import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGeminiClient } from '@/lib/ai/gemini-client';
import { fetchStandingInstructions } from '@/lib/ai/standing-instructions';

interface AIPageTitlesResponse {
  page_titles: string[];
}

// POST /api/admin/content-pieces/[id]/ai-page-titles
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
      return NextResponse.json({ error: 'A topic must be approved before generating page titles.' }, { status: 400 });
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

    // Reuse the 'headlines' scope for standing instructions — page titles share
    // the same SEO-friendly short-text shape, so the same saved rules apply.
    const standingInstructions = companyId
      ? await fetchStandingInstructions(supabase, companyId, 'headlines', piece.content_type)
      : '';

    const systemInstruction = `You are an SEO content strategist for ${companyName}, a local service business. Use COMPANY CONTEXT below for industry and voice — do not assume any specific industry. Write at a 7th–8th grade reading level. Avoid industry jargon.

You are generating SEO meta <title> tag candidates (the text that appears in the browser tab and as the clickable headline in Google search results). These are NOT blog post H1s — they prioritize search-engine ranking and click-through.

COMPANY: ${companyName}, ${location}
CONTENT TYPE: ${piece.content_type ?? 'general'}
APPROVED TOPIC: ${piece.topic}${piece.title ? `\nPOST TITLE / H1: ${piece.title}` : ''}${aiContextBlock}${brandVoiceSection}${standingInstructions}

Generate 5 distinct SEO page title variations. Each must:
- Be 50–60 characters (Google truncates around 60). Never exceed 65.
- Lead with the primary keyword/phrase a user would search for.
- Include the company location (city or region) when relevant for local-intent pages.
- Read naturally — not keyword stuffed.
- Each variation uses a different angle: keyword-first, benefit-led, question, location-led, and brand-led. Do not repeat the same format twice.
- Avoid clickbait punctuation overuse (no multiple !!!, no ALL CAPS).`;

    const userMessage = `Return a JSON object with: page_titles (array of exactly 5 strings, each 50–60 characters).`;

    const gemini = getGeminiClient();
    const response = await gemini.generate<AIPageTitlesResponse>(userMessage, {
      systemInstruction,
      jsonMode: true,
      temperature: 0.85,
      maxOutputTokens: 400,
    });

    if (!response.data || !Array.isArray(response.data.page_titles)) {
      return NextResponse.json({ error: 'Failed to generate page titles' }, { status: 500 });
    }

    const generatedAt = new Date().toISOString();
    await supabase
      .from('monthly_service_content_pieces')
      .update({
        ai_page_titles: { items: response.data.page_titles, prompt: prompt.trim(), generated_at: generatedAt },
      })
      .eq('id', id);

    return NextResponse.json({ suggestions: { page_titles: response.data.page_titles } });
  } catch (error) {
    console.error('Error in POST /api/admin/content-pieces/[id]/ai-page-titles:', error);
    return NextResponse.json({ error: 'Failed to generate page titles' }, { status: 500 });
  }
}
