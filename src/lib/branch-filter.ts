import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Returns a PostgREST-compatible `.or()` filter string that restricts a query
 * to the user's assigned branches only. Records with branch_id IS NULL are not
 * shown to branch-restricted users.
 *
 * Returns null if the user is unrestricted (global admin, or no branch assignments),
 * in which case all records are visible regardless of branch.
 * Usage: if (filter) query = query.or(filter);
 */
export async function getUserBranchFilter(
  supabase: SupabaseClient,
  userId: string,
  companyId: string,
  isGlobalAdmin: boolean
): Promise<string | null> {
  // Global app admins (profiles.role = 'admin') see everything
  if (isGlobalAdmin) return null;

  const { data } = await supabase
    .from('user_branch_assignments')
    .select('branch_id')
    .eq('user_id', userId)
    .eq('company_id', companyId);

  // No assignments = unrestricted (sees all branches)
  if (!data?.length) return null;

  const ids = data.map(r => r.branch_id).join(',');
  return `branch_id.in.(${ids})`;
}

/**
 * Resolves the branch_id to assign to a new lead/ticket/submission.
 *
 * 1. If a service area ID is provided and it has a branch, use that.
 * 2. Otherwise, fall back to the company's primary branch.
 * 3. If no primary branch exists, returns null (no branch assigned).
 */
export async function resolveDefaultBranchId(
  supabase: SupabaseClient,
  companyId: string,
  serviceAreaId?: string | null
): Promise<string | null> {
  // 1. Try to derive branch from matched service area
  if (serviceAreaId) {
    const { data: sa } = await supabase
      .from('service_areas')
      .select('branch_id')
      .eq('id', serviceAreaId)
      .single();
    if (sa?.branch_id) return sa.branch_id;
  }

  // 2. Fall back to the company's primary branch
  const { data: primary } = await supabase
    .from('branches')
    .select('id')
    .eq('company_id', companyId)
    .eq('is_primary', true)
    .single();

  return primary?.id ?? null;
}
