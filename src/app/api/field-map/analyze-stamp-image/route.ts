import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI, Part } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { stampType, pestLabel, conditionOptions, image } = body as {
      stampType: 'pest' | 'condition';
      pestLabel?: string;
      conditionOptions?: string[];
      image: { mimeType: string; data: string };
    };

    if (!stampType || !image?.data || !image?.mimeType) {
      return NextResponse.json(
        { error: 'stampType and image are required' },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
    });

    let systemPrompt: string;

    if (stampType === 'pest') {
      const label = pestLabel || 'pest';
      systemPrompt = `You are an expert pest control inspector. Analyze this image in the context of a ${label} inspection.
Describe what evidence, damage, activity, or conditions are visible that relate to ${label}.
Be specific and concise (1–2 sentences). If no ${label} evidence is clearly visible, describe the most relevant pest-related finding you can see.

Return ONLY valid JSON with no markdown or code fences:
{"description":"Your 1-2 sentence finding description here","severity":"low or medium or high or null"}`;
    } else {
      const optionsList = Array.isArray(conditionOptions) && conditionOptions.length > 0
        ? conditionOptions.join(', ')
        : 'general conducive conditions';

      systemPrompt = `You are an expert pest control inspector identifying conducive conditions at a property.
Analyze this image and determine which conducive conditions are present. You must select ONLY from this exact list:
${optionsList}

Return ONLY valid JSON with no markdown or code fences:
{"description":"1-2 sentence description of what you see that constitutes a conducive condition","suggestions":["Best matching condition from the list","Second best if applicable","Third best if applicable"]}

Rules:
- Only include suggestions clearly evidenced in the image (1–3 maximum)
- Each suggestion must be an EXACT string from the provided list
- If nothing clearly matches, return an empty suggestions array`;
    }

    const parts: Part[] = [
      { text: systemPrompt },
      { inlineData: { mimeType: image.mimeType, data: image.data } },
    ];

    const result = await model.generateContent(parts);
    const responseText = result.response.text();

    const cleanedText = responseText
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsed = JSON.parse(cleanedText);

    if (stampType === 'pest') {
      return NextResponse.json({
        description: parsed.description || '',
        severity: parsed.severity ?? null,
      });
    } else {
      return NextResponse.json({
        description: parsed.description || '',
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [],
      });
    }
  } catch (error) {
    console.error('Error in analyze-stamp-image API:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}
