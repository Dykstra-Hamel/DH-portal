import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient } from '@/lib/ai';
import { createClient } from '@/lib/supabase/server';
import { fetchStandingInstructions } from '@/lib/ai/standing-instructions';

const EDIT_SYSTEM_INSTRUCTION = `You are a text editing assistant. Your job is to edit or transform the provided text according to the user's instruction.

CRITICAL RULES:
- Return ONLY the edited content as valid HTML
- Use only these HTML tags: <p>, <strong>, <em>, <ul>, <ol>, <li>, <h2>, <h3>
- Do NOT include any explanations, commentary, or prose outside the HTML content
- Do NOT wrap the output in markdown code fences (no \`\`\`html or \`\`\`)
- Do NOT add any introduction like "Here is..." or "Sure, here's..."
- Output ONLY the HTML content that should replace the selected text`;

const INSERT_SYSTEM_INSTRUCTION = `You are a content writing assistant. Your job is to generate new content to be inserted into an existing document at the user's cursor position.

CRITICAL RULES:
- Return ONLY the new content as valid HTML
- Use only these HTML tags: <p>, <strong>, <em>, <ul>, <ol>, <li>, <h2>, <h3>
- Do NOT repeat, paraphrase, or summarize anything already in the document
- Do NOT include any explanations, commentary, or prose outside the HTML content
- Do NOT wrap the output in markdown code fences (no \`\`\`html or \`\`\`)
- Do NOT add any introduction like "Here is..." or "Sure, here's..."
- Output ONLY the HTML content to be inserted`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { selectedText, prompt, mode = 'edit', documentContext, companyId } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'prompt is required' },
        { status: 400 }
      );
    }

    if (mode === 'edit' && !selectedText) {
      return NextResponse.json(
        { error: 'selectedText is required for edit mode' },
        { status: 400 }
      );
    }

    let standingInstructions = '';
    if (companyId) {
      const supabase = await createClient();
      standingInstructions = await fetchStandingInstructions(supabase, companyId, 'edit');
    }

    const gemini = getGeminiClient();

    let userMessage: string;
    let systemInstruction: string;

    if (mode === 'insert') {
      systemInstruction = INSERT_SYSTEM_INSTRUCTION + standingInstructions;
      userMessage = documentContext
        ? `Existing document content (for context only — do NOT repeat this):\n${documentContext}\n\nInstruction:\n${prompt}`
        : `Instruction:\n${prompt}`;
    } else {
      systemInstruction = EDIT_SYSTEM_INSTRUCTION + standingInstructions;
      userMessage = `Selected text:\n${selectedText}\n\nInstruction:\n${prompt}`;
    }

    const response = await gemini.generate<string>(userMessage, {
      systemInstruction,
      temperature: 0.7,
      maxOutputTokens: 2048,
    });

    return NextResponse.json({ result: response.data });
  } catch (error: any) {
    console.error('[AI Edit Text] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI text edit' },
      { status: 500 }
    );
  }
}
