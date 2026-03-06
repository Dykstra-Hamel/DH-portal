import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getGeminiClient } from '@/lib/ai/gemini-client';

interface AISuggestResponse {
  topics: string[];
}

function getReferenceDate(publishDate: string | null, serviceMonth: string | null): Date {
  if (publishDate) return new Date(publishDate);
  if (serviceMonth) return new Date(`${serviceMonth}-15`);
  return new Date();
}

function aggregatePressure(points: Array<{ pest_type: string; pest_mentions_count?: number; urgency_level?: number }>): { pest: string; mentions: number; avgUrgency: number }[] {
  const map = new Map<string, { mentions: number; urgencySum: number; count: number }>();
  for (const p of points ?? []) {
    const entry = map.get(p.pest_type) ?? { mentions: 0, urgencySum: 0, count: 0 };
    entry.mentions += p.pest_mentions_count ?? 1;
    entry.urgencySum += p.urgency_level ?? 0;
    entry.count++;
    map.set(p.pest_type, entry);
  }
  return Array.from(map.entries())
    .map(([pest, v]) => ({ pest, mentions: v.mentions, avgUrgency: v.count ? +(v.urgencySum / v.count).toFixed(1) : 0 }))
    .sort((a, b) => b.mentions - a.mentions);
}

function getPastContentInstruction(contentType: string | null): { header: string; instruction: string } {
  switch (contentType) {
    case 'pest_id':
      return {
        header: 'EXISTING PEST ID PAGES (choose a pest NOT in this list):',
        instruction: 'Each topic must be for a pest species NOT already covered. Pick pests the company treats that are missing from the list above.',
      };
    case 'location':
      return {
        header: 'EXISTING LOCATION PAGES (choose a location NOT in this list):',
        instruction: 'Each topic must target a service area or city NOT already covered. Use the service areas list above for candidates.',
      };
    case 'blog':
      return {
        header: 'EXISTING BLOG POSTS (do NOT duplicate these topics):',
        instruction: 'Topics must be meaningfully different from existing blog posts — no rewrites or near-duplicates.',
      };
    case 'evergreen':
      return {
        header: 'EXISTING EVERGREEN PAGES (do NOT duplicate these topics):',
        instruction: 'Topics must be meaningfully different from existing evergreen pages.',
      };
    case 'pillar':
      return {
        header: 'EXISTING PILLAR PAGES (do NOT duplicate these topics):',
        instruction: 'Topics must be meaningfully different from existing pillar pages.',
      };
    case 'cluster':
      return {
        header: 'EXISTING CLUSTER PAGES (do NOT duplicate these topics):',
        instruction: 'Topics must cover angles or sub-topics not already addressed in existing cluster pages.',
      };
    default:
      return {
        header: 'PAST CONTENT (do NOT duplicate these topics):',
        instruction: 'Topics must be meaningfully different from existing content.',
      };
  }
}

function getTopicInstruction(contentType: string | null): string {
  switch (contentType) {
    case 'blog':
      return `Generate 5 blog topic ideas. Each should be a specific angle or research direction — a theme to explore, not a polished headline. Focus on: current pest pressure trends, seasonal patterns, service area relevance, and gaps in past content. Topics should be descriptive directions like "Termite prevention for new homeowners in the Phoenix metro" rather than headline-formatted strings.`;

    case 'pest_id':
      return `Generate 5 Pest ID page topic ideas. Each topic must name a specific pest species the company treats that is NOT already covered (see deduplication list above). Topics should include the pest name and a geographic or audience angle — e.g., "American cockroach identification and treatment for Central Florida homes." Suggest specific species or closely related species clusters, not broad categories like "cockroaches."`;

    case 'location':
      return `Generate 5 Location page topic ideas. Each topic must target a specific city, neighborhood, or service area NOT already covered (see deduplication list above). Use the service areas list for candidates. Topics should include the location name and the primary pest challenge — e.g., "Pest control services in Weeki Wachee, FL — mosquito and rodent focus." Do not suggest locations already covered.`;

    case 'pillar':
      return `Generate 5 Pillar page topic ideas. Each topic must be a broad, comprehensive subject that could serve as a hub for multiple cluster pages — not a narrow single-pest angle. Focus on: service category overviews for a city or region, pest category comprehensive guides, or full location guides. Topics should feel like the "hub" of a content cluster — e.g., "Complete Pest Control Guide for Tucson, AZ" or "Termite, Rodent & Mosquito Control in the Greater Phoenix Area."`;

    case 'cluster':
      return `Generate 5 Cluster page topic ideas. Each topic must be a focused sub-topic — ONE pest type or ONE service in ONE location. Focus on specific treatment coverage, specific pest species in a specific city, or a specific service category tied to a location. Topics should feel like one focused chapter — e.g., "Termite Control in Tucson, AZ" or "Mosquito Yard Treatment Services in Weeki Wachee, FL."`;

    case 'evergreen':
      return `Generate 5 Evergreen page topic ideas. Each topic must be a timeless, educational subject with long-term search relevance — no seasonal hooks or time-sensitive events. Focus on: identification and types guides, signs of infestation, prevention how-tos, homeowner decision guides (DIY vs. professional), or pest biology explainers. Topics should be just as useful to a homeowner searching 2 years from now as today.`;

    default:
      return `Generate 5 content topic ideas. Each should be a specific angle or research direction — a theme to explore, not a polished headline. Focus on: current pest pressure trends, seasonal patterns, service area relevance, and gaps in past content. Topics should be descriptive directions like "Termite prevention for new homeowners in the Phoenix metro" rather than headline-formatted strings.`;
  }
}

// POST /api/admin/content-pieces/[id]/ai-suggest
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

    // Fetch content piece with service and company context
    const { data: piece, error: pieceError } = await supabase
      .from('monthly_service_content_pieces')
      .select(`
        id,
        content_type,
        title,
        publish_date,
        service_month,
        monthly_services (
          company_id,
          companies ( name )
        )
      `)
      .eq('id', id)
      .single();

    if (pieceError || !piece) {
      return NextResponse.json({ error: 'Content piece not found' }, { status: 404 });
    }

    const service = piece.monthly_services as any;
    const companyId: string | undefined = service?.company_id;
    const companyName: string = (service?.companies as any)?.name ?? 'Unknown Company';

    if (!companyId) {
      return NextResponse.json({ error: 'Company not found for this content piece' }, { status: 404 });
    }

    // Parallel DB queries for rich context
    const [
      companyRes,
      pestsRes,
      plansRes,
      areasRes,
      pastContentRes,
      recentPressureRes,
      yearAgoPressureRes,
      predictionsRes,
    ] = await Promise.all([
      // 1. Company profile
      supabase.from('companies')
        .select('name, description, website, city, state, ai_context, brand_voice_formality, brand_voice_humor, words_not_to_use')
        .eq('id', companyId).single(),

      // 2. Pests treated
      supabase.from('company_pest_options')
        .select('custom_label, pest_types(name)')
        .eq('company_id', companyId).eq('is_active', true),

      // 3. Service plans
      supabase.from('service_plans')
        .select('plan_name, plan_category, plan_features')
        .eq('company_id', companyId).eq('is_active', true).limit(6),

      // 4. Service areas
      supabase.from('service_areas')
        .select('name, zip_codes')
        .eq('company_id', companyId).eq('is_active', true).limit(15),

      // 5. Past content (resolve monthly_service IDs first)
      (async () => {
        const { data: svcIds } = await supabase.from('monthly_services')
          .select('id').eq('company_id', companyId);
        if (!svcIds?.length) return { data: [] };
        let query = supabase.from('monthly_service_content_pieces')
          .select('title, content_type, topic, publish_date')
          .in('monthly_service_id', svcIds.map((s: { id: string }) => s.id))
          .not('title', 'is', null)
          .order('publish_date', { ascending: false, nullsFirst: false });
        if (piece.content_type) {
          query = query.eq('content_type', piece.content_type);
        }
        return query;
      })(),

      // 6. Recent pest pressure (last 30 days)
      supabase.from('pest_pressure_data_points')
        .select('pest_type, pest_mentions_count, urgency_level, observed_at')
        .eq('company_id', companyId)
        .gte('observed_at', new Date(Date.now() - 30 * 86400000).toISOString())
        .limit(200),

      // 7. Same period last year (seasonal baseline)
      (() => {
        const refDate = getReferenceDate(piece.publish_date, piece.service_month);
        const yearAgo = new Date(refDate);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        const start = new Date(yearAgo.getTime() - 30 * 86400000).toISOString();
        const end = new Date(yearAgo.getTime() + 15 * 86400000).toISOString();
        return supabase.from('pest_pressure_data_points')
          .select('pest_type, pest_mentions_count, observed_at')
          .eq('company_id', companyId)
          .gte('observed_at', start).lte('observed_at', end)
          .limit(200);
      })(),

      // 8. Active predictions + anomalies
      supabase.from('pest_pressure_predictions')
        .select('pest_type, trend, current_pressure, predicted_pressure, anomaly_detected, anomaly_severity, anomaly_description')
        .eq('company_id', companyId)
        .gt('valid_until', new Date().toISOString())
        .order('predicted_pressure', { ascending: false })
        .limit(10),
    ]);

    const company = companyRes.data;
    const brandVoiceFormality = (company as any)?.brand_voice_formality as number | null | undefined;
    const brandVoiceHumor = (company as any)?.brand_voice_humor as number | null | undefined;
    const wordsNotToUse = (company as any)?.words_not_to_use as string[] | null | undefined;
    const pests: { custom_label?: string; pest_types?: { name: string } | { name: string }[] | null }[] = pestsRes.data ?? [];
    const plans: { plan_name: string; plan_category?: string; plan_features?: string[] | null }[] = plansRes.data ?? [];
    const areas: { name: string; zip_codes?: string[] | null }[] = areasRes.data ?? [];
    const pastContent: { title?: string; content_type?: string; topic?: string; publish_date?: string }[] = (pastContentRes as any)?.data ?? [];
    const recentPressure = aggregatePressure(recentPressureRes.data ?? []);
    const yearAgoPressure = aggregatePressure(yearAgoPressureRes.data ?? []);
    const predictions: {
      pest_type: string;
      trend?: string;
      current_pressure?: number;
      predicted_pressure?: number;
      anomaly_detected?: boolean;
      anomaly_severity?: string;
      anomaly_description?: string;
    }[] = predictionsRes.data ?? [];

    // Build pest names list
    const pestNames = pests.map(p => {
      if (p.custom_label) return p.custom_label;
      const pt = p.pest_types;
      if (Array.isArray(pt)) return pt[0]?.name;
      return (pt as any)?.name;
    }).filter(Boolean).join(', ');

    // Build service plans section
    const plansSection = plans.map(p => {
      const features = Array.isArray(p.plan_features) ? p.plan_features.slice(0, 3).join(', ') : '';
      return `- ${p.plan_name}${p.plan_category ? ` (${p.plan_category})` : ''}${features ? `: ${features}` : ''}`;
    }).join('\n');

    // Build service areas section
    const areasSection = areas.map(a => {
      const zips = Array.isArray(a.zip_codes) && a.zip_codes.length ? ` [${a.zip_codes.slice(0, 5).join(', ')}]` : '';
      return `- ${a.name}${zips}`;
    }).join('\n');

    // Build recent pressure section
    const recentPressureSection = recentPressure.slice(0, 10).map(p =>
      `- ${p.pest}: ${p.mentions} reports${p.avgUrgency > 0 ? `, avg urgency ${p.avgUrgency}/10` : ''}`
    ).join('\n');

    // Build year-ago pressure section
    const refDate = getReferenceDate(piece.publish_date, piece.service_month);
    const yearAgoLabel = new Date(refDate.getFullYear() - 1, refDate.getMonth(), 1)
      .toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const yearAgoPressureSection = yearAgoPressure.slice(0, 10).map(p =>
      `- ${p.pest}: ${p.mentions} reports`
    ).join('\n');

    // Build predictions section
    const predictionsSection = predictions.map(p => {
      let line = `- ${p.pest_type}: trend=${p.trend ?? 'N/A'}, predicted pressure=${p.predicted_pressure ?? 'N/A'}/10`;
      if (p.anomaly_detected) {
        line += ` — ANOMALY (${p.anomaly_severity ?? 'unknown'}): ${p.anomaly_description ?? ''}`;
      }
      return line;
    }).join('\n');

    // Build past content section
    const pastContentSection = pastContent.map(c => {
      const date = c.publish_date ? new Date(c.publish_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'undated';
      return `- ${c.title} — ${date}`;
    }).join('\n');

    const { header: pastContentHeader, instruction: pastContentInstruction } = getPastContentInstruction(piece.content_type);

    const systemInstruction = `You are a content marketing expert for a pest control company. Use all the provided context to generate highly relevant, timely, and SEO-friendly topic ideas.

COMPANY PROFILE:
Name: ${company?.name ?? companyName}
Location: ${[company?.city, company?.state].filter(Boolean).join(', ') || 'N/A'}
Description: ${company?.description || 'N/A'}
Website: ${company?.website || 'N/A'}
Content Type Requested: ${piece.content_type ?? 'general'}

SERVICE AREAS:
${areasSection || 'No service areas on file.'}

PESTS TREATED:
${pestNames || 'No pest data on file.'}

SERVICE PLANS:
${plansSection || 'No service plans on file.'}

RECENT PEST PRESSURE (last 30 days):
${recentPressureSection || 'No recent pest pressure data.'}

SAME PERIOD LAST YEAR (${yearAgoLabel}):
${yearAgoPressureSection || 'No historical pest pressure data.'}

ACTIVE PREDICTIONS & ANOMALIES:
${predictionsSection || 'No active predictions.'}

${pastContentHeader}
${pastContentSection || 'None yet.'}

DEDUPLICATION RULE:
${pastContentInstruction}

${company?.ai_context ? `COMPANY AI CONTEXT (provided by admin):\n${company.ai_context}` : ''}
${brandVoiceFormality != null ? `WRITING STYLE: ${brandVoiceFormality <= 12 ? 'Very casual' : brandVoiceFormality <= 37 ? 'Casual' : brandVoiceFormality <= 62 ? 'Balanced' : brandVoiceFormality <= 87 ? 'Formal' : 'Very formal'} (${brandVoiceFormality}/100)` : ''}
${brandVoiceHumor != null ? `TONE: ${brandVoiceHumor <= 12 ? 'Very serious and professional' : brandVoiceHumor <= 37 ? 'Serious' : brandVoiceHumor <= 62 ? 'Balanced' : brandVoiceHumor <= 87 ? 'Funny' : 'Very funny and humorous'} (${brandVoiceHumor}/100)` : ''}
${wordsNotToUse?.length ? `WORDS TO NEVER USE: ${wordsNotToUse.join(', ')}` : ''}

INSTRUCTIONS:
${getTopicInstruction(piece.content_type)}`;

    const userMessage = prompt.trim()
      ? `Additional focus from user: ${prompt.trim()}\n\nReturn a JSON object with: topics (array of exactly 5 strings). Each should be a specific content angle or research direction — a theme to write about, not a polished title. Avoid headline formatting (numbers, "How to", question marks).`
      : `Return a JSON object with: topics (array of exactly 5 strings). Each should be a specific content angle or research direction — a theme to write about, not a polished title. Avoid headline formatting (numbers, "How to", question marks).`;

    const gemini = getGeminiClient();
    const response = await gemini.generate<AISuggestResponse>(userMessage, {
      systemInstruction,
      jsonMode: true,
      temperature: 0.8,
      maxOutputTokens: 600,
    });

    if (!response.data) {
      return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
    }

    const generatedAt = new Date().toISOString();
    await supabase
      .from('monthly_service_content_pieces')
      .update({
        ai_topics: { items: response.data.topics, prompt: prompt.trim(), generated_at: generatedAt },
      })
      .eq('id', id);

    return NextResponse.json({ suggestions: { topics: response.data.topics } });
  } catch (error) {
    console.error('Error in POST /api/admin/content-pieces/[id]/ai-suggest:', error);
    return NextResponse.json({ error: 'Failed to generate suggestions' }, { status: 500 });
  }
}
