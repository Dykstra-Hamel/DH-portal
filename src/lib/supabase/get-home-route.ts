import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Determines the correct home route for a user after login.
 * Technician or inspector members → /field-ops/dashboard
 * Everyone else → /tickets/dashboard
 */
export async function getHomeRoute(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  try {
    // Prefer the primary company; fall back to any company the user belongs to
    let { data: userCompany } = await supabase
      .from('user_companies')
      .select('role, company_id')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .maybeSingle();

    if (!userCompany) {
      const { data: anyCompany } = await supabase
        .from('user_companies')
        .select('role, company_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();
      userCompany = anyCompany;
    }

    // Non-members (company_admin, company_manager) and missing records go to dashboard
    if (!userCompany || userCompany.role !== 'member') {
      return '/tickets/dashboard';
    }

    // Check departments for member-role users
    const { data: depts } = await supabase
      .from('user_departments')
      .select('department')
      .eq('user_id', userId)
      .eq('company_id', userCompany.company_id);

    const departments = (depts ?? []).map((d: { department: string }) => d.department);

    // Technician or inspector members go to FieldOps dashboard
    if (
      departments.length > 0 &&
      departments.every((d: string) => d === 'inspector' || d === 'technician')
    ) {
      return '/field-ops/dashboard';
    }
  } catch {
    // Fall back to default on any error
  }

  return '/tickets/dashboard';
}
