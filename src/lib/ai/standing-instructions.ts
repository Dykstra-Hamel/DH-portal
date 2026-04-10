import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fetches active standing instructions for a company, filtered by scope and optional content type.
 * Returns a formatted string block to be appended to AI system instructions,
 * or an empty string if no instructions are found.
 */
export async function fetchStandingInstructions(
  supabase: SupabaseClient,
  companyId: string,
  scope: 'draft' | 'headlines' | 'edit',
  contentType?: string | null
): Promise<string> {
  const orFilter = contentType
    ? `content_type.is.null,content_type.eq.${contentType}`
    : 'content_type.is.null';

  const { data, error } = await supabase
    .from('ai_standing_instructions')
    .select('instruction_text')
    .eq('is_active', true)
    .in('scope', ['all', scope])
    .or(orFilter)
    .or(`company_id.eq.${companyId},company_id.is.null`);

  if (error || !data || data.length === 0) {
    return '';
  }

  const lines = data.map((row: { instruction_text: string }) => `- ${row.instruction_text}`).join('\n');
  return `\nSTANDING INSTRUCTIONS FROM YOUR TEAM:\n${lines}`;
}
