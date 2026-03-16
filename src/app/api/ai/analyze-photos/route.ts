import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    const body = await request.json();
    const { companyId, images, notes } = body as {
      companyId: string;
      images: Array<{ mimeType: string; data: string }>;
      notes?: string;
    };

    if (!companyId || !images || images.length === 0) {
      return NextResponse.json(
        { error: 'companyId and at least one image are required' },
        { status: 400 }
      );
    }

    if (images.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 images allowed' },
        { status: 400 }
      );
    }

    // Verify user has access to this company
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (!userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this company' },
          { status: 403 }
        );
      }
    }

    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite' });

    const systemPrompt = `You are an expert pest control field technician analyst. Analyze the provided images from a field technician's inspection and identify pest issues, property conditions, and service opportunities.

Return ONLY valid JSON in this exact format:
{
  "issue_detected": "Brief description of the main issue or finding visible in the photos",
  "service_category": "One of: Pest Control, Termite Treatment, Mosquito Service, Rodent Control, Wildlife Removal, General Inspection, or Other",
  "ai_summary": "2-3 sentence summary of findings and recommended action",
  "suggested_pest_type": "Specific pest type if identifiable (e.g. German Cockroach, Norway Rat, Subterranean Termite) or null",
  "severity": "low or medium or high or null"
}

Base severity on visible damage, infestation signs, and urgency. Return null for severity if there is insufficient visual evidence.`;

    const parts: Part[] = [
      { text: systemPrompt },
      ...images.map(img => ({
        inlineData: { mimeType: img.mimeType, data: img.data },
      })),
      { text: notes ? `Technician notes: ${notes}` : '' },
    ];

    const result = await model.generateContent(parts);
    const responseText = result.response.text();

    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleanedText);

    return NextResponse.json({
      issue_detected: parsed.issue_detected || '',
      service_category: parsed.service_category || '',
      ai_summary: parsed.ai_summary || '',
      suggested_pest_type: parsed.suggested_pest_type || null,
      severity: parsed.severity || null,
    });
  } catch (error) {
    console.error('Error in analyze-photos API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze photos' },
      { status: 500 }
    );
  }
}
