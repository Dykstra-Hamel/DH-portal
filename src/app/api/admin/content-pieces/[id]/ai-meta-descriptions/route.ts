import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGeminiClient } from '@/lib/ai/gemini-client';
import { fetchStandingInstructions } from '@/lib/ai/standing-instructions';

interface AIMetaDescriptionsResponse {
  meta_descriptions: string[];
}

// POST /api/admin/content-pieces/[id]/ai-meta-descriptions
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

    const { data: piece, error: pieceError } = await supabase
      .from('monthly_service_content_pieces')
      .select(`
        id,
        content_type,
        topic,
        title,
        page_title,
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
      return NextResponse.json({ error: 'A topic must be approved before generating meta descriptions.' }, { status: 400 });
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

    // Reuse the 'headlines' scope for standing instructions.
    const standingInstructions = companyId
      ? await fetchStandingInstructions(supabase, companyId, 'headlines', piece.content_type)
      : '';

    const pageTitleHint = (piece as any).page_title ? `\nPAGE TITLE (already set): ${(piece as any).page_title}` : '';

    const systemInstruction = `You are an SEO content strategist for ${companyName}, a local service business. Use COMPANY CONTEXT below for industry and voice — do not assume any specific industry. Write at a 7th–8th grade reading level. Avoid industry jargon.

You are generating SEO meta description tag candidates — the snippet of text Google shows under the page title in search results. These should describe the page accurately and motivate a click.

COMPANY: ${companyName}, ${location}
CONTENT TYPE: ${piece.content_type ?? 'general'}
APPROVED TOPIC: ${piece.topic}${piece.title ? `\nPOST TITLE / H1: ${piece.title}` : ''}${pageTitleHint}${aiContextBlock}${brandVoiceSection}${standingInstructions}

Generate 5 distinct meta description variations. Each must:
- Be 150–160 characters (Google truncates around 160). Never exceed 165.
- Be a complete, well-formed sentence (or two short ones) — not a fragment.
- Include the primary keyword and the company location when relevant.
- Include a soft call-to-action where natural ("Schedule today", "Get a free quote", "Learn more"). At most one CTA per description.
- Each variation uses a different angle: benefit-led, problem/solution, local-credibility, urgency/timeliness, and authority/expertise. Do not repeat the same angle twice.
- Avoid all caps, multiple punctuation marks, and clickbait phrasing.`;

    const userMessage = `Return a JSON object with: meta_descriptions (array of exactly 5 strings, each 150–160 characters).`;

    const gemini = getGeminiClient();
    const response = await gemini.generate<AIMetaDescriptionsResponse>(userMessage, {
      systemInstruction,
      jsonMode: true,
      temperature: 0.85,
      maxOutputTokens: 800,
    });

    if (!response.data || !Array.isArray(response.data.meta_descriptions)) {
      return NextResponse.json({ error: 'Failed to generate meta descriptions' }, { status: 500 });
    }

    const generatedAt = new Date().toISOString();
    await supabase
      .from('monthly_service_content_pieces')
      .update({
        ai_meta_descriptions: { items: response.data.meta_descriptions, prompt: prompt.trim(), generated_at: generatedAt },
      })
      .eq('id', id);

    return NextResponse.json({ suggestions: { meta_descriptions: response.data.meta_descriptions } });
  } catch (error) {
    console.error('Error in POST /api/admin/content-pieces/[id]/ai-meta-descriptions:', error);
    return NextResponse.json({ error: 'Failed to generate meta descriptions' }, { status: 500 });
  }
}
