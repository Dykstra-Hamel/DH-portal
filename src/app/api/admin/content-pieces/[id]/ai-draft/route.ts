import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGeminiClient } from '@/lib/ai/gemini-client';

interface AIDraftResponse {
  drafts: Array<{ approach: string; content: string }>;
}

function getDraftTypeInstruction(contentType: string | null): string {
  switch (contentType) {
    case 'blog':
      return `Write 3 drafts, each 600–900 words of actual body content. Do NOT include the title in the draft. Each draft uses a distinctly different approach:
1. Educational/informational — lead with facts, statistics, or pest biology; build toward why homeowners should take action
2. Problem-solution — open with a relatable homeowner scenario or pain point, then position the company as the answer
3. Seasonal/urgency — open with a timely hook (season, local pest surge, recent event) to create relevance and urgency

Each draft should be specific to the company's location, mention relevant pests by name, and end with a brief call-to-action.`;

    case 'pest_id':
      return `Write 1 draft, 1,200–1,400 words. Do NOT include the title. Structure the draft using question-phrased H2 headings — e.g., "What do [Pest] look like?", "Are [Pests] dangerous?", "How can I tell if I have a [Pest] problem?", "Can I get rid of [Pest] myself?". The draft must cover: appearance/identification, activity/behavior, dangers or health risks, habitat and why they enter homes, signs of infestation, DIY limitations, professional treatment approach, and prevention tips. The draft should be authoritative and factual. End with a clear call-to-action for professional treatment. Label the "approach" field with "Pest ID Draft".`;

    case 'location':
      return `Write 1 draft, 1,800–2,500 words. Do NOT include the title. This is a comprehensive local service page. The draft must weave the location name throughout, reference local climate or environment, and be organized with H2 sections by pest/service category (e.g., termite control, mosquito control, rodent control, commercial pest control). Include a "most active pests" or seasonal context section and a local FAQ section at the end. End with a prominent scheduling or contact call-to-action. Label the "approach" field with "Location Page Draft".`;

    case 'pillar':
      return `Write 1 draft, 3,000–5,000 words. Do NOT include the title. This is a comprehensive hub page. The draft must cover ALL major pest control service categories as separate H2 sections (e.g., termite control, rodent control, bed bugs, mosquitoes, ants, spiders, cockroaches), include a seasonal pest activity section, and end with a detailed FAQ. Each section should be substantive (200–400 words) and could serve as a gateway to a more specific cluster page. Include internal link callouts like "Learn more about our termite services" and end with a comprehensive CTA and contact section. Label the "approach" field with "Pillar Page Draft".`;

    case 'cluster':
      return `Write 1 draft, 1,500–2,200 words. Do NOT include the title. This is a focused service page covering ONE pest type or ONE service category in ONE location. The draft must include: an intro establishing the local pest challenge, a "What are [Pest]?" or service overview section, a prevention section, a signs/identification section, a section on the company's specific treatment approach, a trust/why-us section, and a CTA. End with a consultation or free quote call-to-action. Label the "approach" field with "Cluster Page Draft".`;

    case 'evergreen':
      return `Write 2 drafts, each 1,000–1,400 words. Do NOT include the title. These are timeless reference pages — no seasonal hooks, no date references. Use topic-based H2 headings (e.g., "Common Types of [Pest]", "Signs of a [Pest] Infestation", "How to Prevent [Pest]", "Professional [Pest] Control"). Cover: species or types relevant to the company's area, signs and symptoms, prevention strategies, and professional treatment. Use a different organizational angle for each draft:
1. Types + signs guide — begin with species identification and types, move through signs of infestation, prevention, and professional treatment
2. Problem-identification guide — begin with "what are you seeing?"; help the reader diagnose the issue, explain implications, guide toward professional resolution

Each draft should be factual, educational, and hold equal relevance year-round. End with a professional treatment call-to-action.`;

    default:
      return `Write 3 drafts, each 400–600 words of actual body content. Do NOT include the title in the draft text. Each draft must use a distinctly different approach:
1. Educational / informational — lead with facts, biology, and "why it matters" framing
2. Problem-solution — open with a relatable homeowner pain point, then position the company as the answer
3. Seasonal / urgency — open with time-specific framing (seasonal pest pressure, upcoming risk) to create timeliness

Each draft should be specific to the company's location, mention relevant pests by name, and include a brief call-to-action at the end.`;
  }
}

function getDraftCount(contentType: string | null): number {
  if (['pest_id', 'location', 'cluster', 'pillar'].includes(contentType ?? '')) return 1;
  if (contentType === 'evergreen') return 2;
  return 3;
}

function getDraftMaxTokens(contentType: string | null): number {
  switch (contentType) {
    case 'pillar':    return 8000;
    case 'location':  return 5000;
    case 'cluster':   return 4500;
    case 'pest_id':   return 3000;
    case 'evergreen': return 5000;
    case 'blog':      return 5000;
    default:          return 4000;
  }
}

// POST /api/admin/content-pieces/[id]/ai-draft
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

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const prompt: string = body.prompt ?? '';

    // Fetch content piece with company context
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
          companies ( name, city, state, description, ai_context, brand_voice_formality, brand_voice_humor, words_not_to_use )
        )
      `)
      .eq('id', id)
      .single();

    if (pieceError || !piece) {
      return NextResponse.json({ error: 'Content piece not found' }, { status: 404 });
    }

    if (!piece.topic || !piece.title) {
      return NextResponse.json({ error: 'Both a topic and a title must be set before generating drafts.' }, { status: 400 });
    }

    const service = piece.monthly_services as any;
    const company = service?.companies as any;
    const companyId: string | undefined = service?.company_id;

    if (!companyId) {
      return NextResponse.json({ error: 'Company not found for this content piece' }, { status: 404 });
    }

    // Parallel context fetches
    const [pestsRes, areasRes] = await Promise.all([
      supabase
        .from('company_pest_options')
        .select('custom_label, pest_types(name)')
        .eq('company_id', companyId)
        .eq('is_active', true),
      supabase
        .from('service_areas')
        .select('name')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .limit(15),
    ]);

    const pests: { custom_label?: string; pest_types?: { name: string } | { name: string }[] | null }[] = pestsRes.data ?? [];
    const areas: { name: string }[] = areasRes.data ?? [];

    // Build pest names list (same mapper as ai-suggest)
    const pestNames = pests.map(p => {
      if (p.custom_label) return p.custom_label;
      const pt = p.pest_types;
      if (Array.isArray(pt)) return pt[0]?.name;
      return (pt as any)?.name;
    }).filter(Boolean).join(', ');

    const areasSection = areas.map(a => a.name).filter(Boolean).join(', ');

    const companyName: string = company?.name ?? 'Unknown Company';
    const location = [company?.city, company?.state].filter(Boolean).join(', ') || 'N/A';
    const description: string = company?.description || 'N/A';
    const aiContextBlock = company?.ai_context
      ? `\nCOMPANY CONTEXT (provided by admin):\n${company.ai_context}`
      : '';
    const brandVoiceLines = [
      company?.brand_voice_formality != null ? `WRITING STYLE: ${company.brand_voice_formality < 30 ? 'Very casual' : company.brand_voice_formality > 70 ? 'Very formal' : 'Neutral'} (${company.brand_voice_formality}/100)` : '',
      company?.brand_voice_humor != null ? `TONE: ${company.brand_voice_humor < 30 ? 'Serious and professional' : company.brand_voice_humor > 70 ? 'Light and humorous' : 'Balanced'} (${company.brand_voice_humor}/100)` : '',
      company?.words_not_to_use?.length ? `WORDS TO NEVER USE: ${company.words_not_to_use.join(', ')}` : '',
    ].filter(Boolean).join('\n');
    const brandVoiceSection = brandVoiceLines ? `\nBRAND VOICE:\n${brandVoiceLines}` : '';

    const publishMonth = piece.publish_date
      ? new Date(piece.publish_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : piece.service_month
        ? new Date(`${piece.service_month}-15`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : null;

    const draftCount = getDraftCount(piece.content_type);

    const systemInstruction = `You are a professional content writer specializing in pest control marketing. Write ${draftCount === 1 ? '1 complete content draft' : `${draftCount} complete, distinct content drafts`} for the given topic and title.

COMPANY: ${companyName}
LOCATION: ${location}
COMPANY DESCRIPTION: ${description}
PESTS TREATED: ${pestNames || 'N/A'}
SERVICE AREAS: ${areasSection || 'N/A'}
CONTENT TYPE: ${piece.content_type ?? 'general'}${publishMonth ? `\nPUBLISH MONTH: ${publishMonth}` : ''}${aiContextBlock}${brandVoiceSection}

TOPIC: ${piece.topic}
TITLE: ${piece.title}

${getDraftTypeInstruction(piece.content_type)}`;

    const draftLabel = draftCount > 1 ? 's' : '';
    const userMessage = prompt.trim()
      ? `Additional guidance from user: ${prompt.trim()}\n\nReturn a JSON object with: drafts (array of exactly ${draftCount} object${draftLabel}, each with "approach" (short label) and "content" (full draft text)).`
      : `Return a JSON object with: drafts (array of exactly ${draftCount} object${draftLabel}, each with "approach" (short label) and "content" (full draft text)).`;

    const gemini = getGeminiClient();
    const response = await gemini.generate<AIDraftResponse>(userMessage, {
      systemInstruction,
      jsonMode: true,
      temperature: 0.85,
      maxOutputTokens: getDraftMaxTokens(piece.content_type),
    });

    if (!response.data || !Array.isArray(response.data.drafts)) {
      return NextResponse.json({ error: 'Failed to generate drafts' }, { status: 500 });
    }

    await supabase
      .from('monthly_service_content_pieces')
      .update({
        ai_draft: { items: response.data.drafts, prompt: prompt.trim(), generated_at: new Date().toISOString() },
      })
      .eq('id', id);

    return NextResponse.json({ suggestions: { drafts: response.data.drafts } });
  } catch (error) {
    console.error('Error in POST /api/admin/content-pieces/[id]/ai-draft:', error);
    return NextResponse.json({ error: 'Failed to generate drafts' }, { status: 500 });
  }
}
