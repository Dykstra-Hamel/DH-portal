import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGeminiClient } from '@/lib/ai/gemini-client';
import { fetchStandingInstructions } from '@/lib/ai/standing-instructions';

interface AIHeadlinesResponse {
  headlines: string[];
}

function getHeadlineInstruction(contentType: string | null): string {
  switch (contentType) {
    case 'blog':
      return `Generate 5 distinct headline variations. Include a mix of: curiosity hook, how-to or listicle, question, seasonal/timely angle, and benefit-driven styles. Headlines should be 50–70 characters, conversational yet SEO-friendly, and feel timely or topical. Do not repeat the same format twice.`;

    case 'pest_id':
      return `Generate 5 distinct headline variations. Each must include the pest name. Include a mix of: identification-forward (e.g., "How to Identify [Pest] in Your Home"), danger/threat-aware (risks or damage), action-oriented (treatment or removal), informational (facts or biology), and local authority framing. Headlines should be 50–70 characters, factual in tone, and SEO-friendly. Do not repeat the same format twice.`;

    case 'location':
      return `Generate 5 distinct headline variations. Each must include the city or location name. Include a mix of: local service statement (e.g., "[City] Pest Control Services"), local pest authority, question (local problem-based), benefit-driven (e.g., "Same-Day Service in [City]"), and local environmental angle. Headlines should be 50–70 characters, locally specific, and service-focused. Do not repeat the same format twice.`;

    case 'pillar':
      return `Generate 5 distinct headline variations for a comprehensive pillar page. Headlines should signal breadth and authority. Include a mix of: "complete guide" framing, "everything you need to know", broad authoritative question, service-hub statement, and local comprehensive angle. Headlines should be 55–75 characters and read as the definitive resource on this topic. Do not repeat the same format twice.`;

    case 'cluster':
      return `Generate 5 distinct headline variations for a focused cluster page. Headlines should signal specificity and depth — one precise answer to one specific question. Include a mix of: specific how-to, focused question, number-based (e.g., "3 Signs of Termites in Your Tucson Home"), comparison or decision-guide, and local service-specific statement. Headlines should be 50–70 characters and feel like a precise, narrow answer. Do not repeat the same format twice.`;

    case 'evergreen':
      return `Generate 5 distinct headline variations for a timeless educational page. Headlines must avoid seasonal language or date references. Include a mix of: how-to guide, signs or identification-focused, decision-guide (DIY vs. professional), informational reference, and question. Headlines should be 50–70 characters, educational in tone, and hold equal relevance year-round. Do not repeat the same format twice.`;

    default:
      return `Generate 5 distinct headline variations. Vary the formats: include a mix of question, how-to, number-based, statement, and benefit-driven styles. Each headline should be 50–70 characters, SEO-friendly, and specific to the topic. Do not repeat the same format twice.`;
  }
}

// POST /api/admin/content-pieces/[id]/ai-headlines
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'project_manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const prompt: string = body.prompt ?? '';

    // Fetch content piece
    const { data: piece, error: pieceError } = await supabase
      .from('monthly_service_content_pieces')
      .select(`
        id,
        content_type,
        topic,
        service_month,
        publish_date,
        monthly_services (
          company_id,
          companies ( name, city, state, ai_context, brand_voice_formality, brand_voice_humor, words_not_to_use )
        )
      `)
      .eq('id', id)
      .single();

    if (pieceError || !piece) {
      return NextResponse.json({ error: 'Content piece not found' }, { status: 404 });
    }

    const service = piece.monthly_services as any;
    const company = service?.companies as any;

    if (!piece.topic) {
      return NextResponse.json({ error: 'A topic must be approved before generating headlines.' }, { status: 400 });
    }

    const companyId: string | undefined = service?.company_id;

    const companyName: string = company?.name ?? 'Unknown Company';
    const location = [company?.city, company?.state].filter(Boolean).join(', ') || 'N/A';
    const aiContextBlock = company?.ai_context
      ? `\nCOMPANY CONTEXT (provided by admin):\n${company.ai_context}`
      : '';
    const formalityLabel = (v: number) =>
      v <= 12 ? 'Very casual' : v <= 37 ? 'Casual' : v <= 62 ? 'Balanced' : v <= 87 ? 'Formal' : 'Very formal';
    const humorLabel = (v: number) =>
      v <= 12 ? 'Very serious and professional' : v <= 37 ? 'Serious' : v <= 62 ? 'Balanced' : v <= 87 ? 'Funny' : 'Very funny and humorous';
    const brandVoiceLines = [
      company?.brand_voice_formality != null ? `WRITING STYLE: ${formalityLabel(company.brand_voice_formality)} (${company.brand_voice_formality}/100)` : '',
      company?.brand_voice_humor != null ? `TONE: ${humorLabel(company.brand_voice_humor)} (${company.brand_voice_humor}/100)` : '',
      company?.words_not_to_use?.length ? `WORDS TO NEVER USE: ${company.words_not_to_use.join(', ')}` : '',
    ].filter(Boolean).join('\n');
    const brandVoiceSection = brandVoiceLines ? `\nBRAND VOICE:\n${brandVoiceLines}` : '';

    const standingInstructions = companyId
      ? await fetchStandingInstructions(supabase, companyId, 'headlines', piece.content_type)
      : '';

    const systemInstruction = `You are an SEO content strategist for a pest control company. Generate headline variations for the given content topic.

COMPANY: ${companyName}, ${location}
CONTENT TYPE: ${piece.content_type ?? 'general'}
APPROVED TOPIC: ${piece.topic}${aiContextBlock}${brandVoiceSection}${standingInstructions}

${getHeadlineInstruction(piece.content_type)}`;

    const userMessage = `Return a JSON object with: headlines (array of exactly 5 headline strings).`;

    const gemini = getGeminiClient();
    const response = await gemini.generate<AIHeadlinesResponse>(userMessage, {
      systemInstruction,
      jsonMode: true,
      temperature: 0.9,
      maxOutputTokens: 400,
    });

    if (!response.data) {
      return NextResponse.json({ error: 'Failed to generate headlines' }, { status: 500 });
    }

    const generatedAt = new Date().toISOString();
    await supabase
      .from('monthly_service_content_pieces')
      .update({
        ai_headlines: { items: response.data.headlines, prompt: prompt.trim(), generated_at: generatedAt },
      })
      .eq('id', id);

    return NextResponse.json({ suggestions: { headlines: response.data.headlines } });
  } catch (error) {
    console.error('Error in POST /api/admin/content-pieces/[id]/ai-headlines:', error);
    return NextResponse.json({ error: 'Failed to generate headlines' }, { status: 500 });
  }
}
