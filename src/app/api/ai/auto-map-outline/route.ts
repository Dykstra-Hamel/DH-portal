import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';
import { getAuthenticatedUser } from '@/lib/api-utils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const MAX_MODEL_RETRIES = 2;
const BASE_RETRY_DELAY_MS = 800;

interface AutoMapRequestBody {
  companyId?: string;
  image?: {
    mimeType?: string;
    data?: string;
  };
  tapPoint?: {
    x?: number;
    y?: number;
  };
  existingAddress?: string;
}

interface OutlinePoint {
  x: number;
  y: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function clampNormalized(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

function extractJsonObject(text: string): string | null {
  const cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
    return cleaned;
  }

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    return null;
  }
  return cleaned.slice(firstBrace, lastBrace + 1);
}

async function generateWithRetry(parts: Part[]) {
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
  });

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_MODEL_RETRIES; attempt++) {
    try {
      return await model.generateContent(parts);
    } catch (error: any) {
      lastError = error;
      const isRetryable =
        error?.status === 429 ||
        error?.status === 503 ||
        error?.message?.includes('overloaded') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('network');

      if (!isRetryable || attempt === MAX_MODEL_RETRIES) {
        throw error;
      }

      const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;
    const body: AutoMapRequestBody = await request.json();
    const { companyId, image, tapPoint, existingAddress } = body;

    if (!companyId || !image?.data || !image?.mimeType) {
      return NextResponse.json(
        { error: 'companyId and image payload are required.' },
        { status: 400 }
      );
    }

    if (image.data.length > 12_000_000) {
      return NextResponse.json(
        { error: 'Image payload is too large for Auto-Map.' },
        { status: 400 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured.' },
        { status: 500 }
      );
    }

    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (!userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this company.' },
          { status: 403 }
        );
      }
    }

    const prompt = `You are an assistant that maps house footprints from overhead satellite images.

Analyze the single satellite image and detect the primary house/building outline.

Return ONLY valid JSON with this exact schema:
{
  "outlinePoints": [{ "x": 0.123, "y": 0.456 }],
  "summary": "one short sentence",
  "confidence": 0.0
}

Rules:
- Coordinates are normalized: (0,0) is top-left and (1,1) is bottom-right.
- The polygon should represent the outer roof/home footprint only, not fences or driveway.
- Prefer 8-24 points in clockwise order; minimum 3 points.
- Keep all x/y values between 0 and 1.
- If uncertain, return an empty outlinePoints array and explain why in summary.
- Do not include markdown, prose, or code fences.`;

    const addressHint =
      typeof existingAddress === 'string' && existingAddress.trim()
        ? `Address context (for disambiguation only): ${existingAddress.trim()}`
        : 'Address context: not provided.';

    const hasTapPoint =
      typeof tapPoint?.x === 'number' &&
      Number.isFinite(tapPoint.x) &&
      typeof tapPoint?.y === 'number' &&
      Number.isFinite(tapPoint.y);

    const tapX = hasTapPoint ? clampNormalized(tapPoint!.x as number) : null;
    const tapY = hasTapPoint ? clampNormalized(tapPoint!.y as number) : null;
    const tapPointHint = hasTapPoint && tapX !== null && tapY !== null
      ? `User tap point: x=${tapX.toFixed(4)}, y=${tapY.toFixed(4)}. Prioritize the building footprint nearest this coordinate.`
      : 'User tap point: not provided.';

    const result = await generateWithRetry([
      { text: prompt },
      {
        inlineData: {
          mimeType: image.mimeType,
          data: image.data,
        },
      },
      { text: addressHint },
      { text: tapPointHint },
    ]);

    const responseText = result.response.text();
    const jsonText = extractJsonObject(responseText);

    if (!jsonText) {
      throw new Error('Model response was not valid JSON.');
    }

    const parsed = JSON.parse(jsonText) as {
      outlinePoints?: Array<{ x?: number; y?: number }>;
      summary?: string;
      confidence?: number;
    };

    const outlinePoints: OutlinePoint[] = Array.isArray(parsed.outlinePoints)
      ? parsed.outlinePoints
          .slice(0, 64)
          .map(point => ({
            x: clampNormalized(Number(point.x)),
            y: clampNormalized(Number(point.y)),
          }))
          .filter(point => Number.isFinite(point.x) && Number.isFinite(point.y))
      : [];

    const confidence =
      typeof parsed.confidence === 'number' && Number.isFinite(parsed.confidence)
        ? Math.max(0, Math.min(1, parsed.confidence))
        : null;

    return NextResponse.json({
      outlinePoints,
      summary:
        typeof parsed.summary === 'string' && parsed.summary.trim()
          ? parsed.summary.trim()
          : outlinePoints.length >= 3
            ? 'Auto-Map generated a house outline.'
            : 'Auto-Map could not confidently detect a house outline.',
      confidence,
    });
  } catch (error) {
    console.error('Auto-map-outline API error:', error);
    return NextResponse.json(
      { error: 'Failed to auto-map house outline.' },
      { status: 500 }
    );
  }
}
