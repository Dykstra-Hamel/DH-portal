import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Determines the correct home route for a user after login.
 * Technician-only members (role=member, sole department=technician) → /tech-leads
 * Everyone else → /tickets/dashboard
 */
export async function getHomeRoute(
  supabase: SupabaseClient,
  userId: string
): Promise<string> {
  try {
    // Get user's primary company role
    const { data: userCompany } = await supabase
      .from('user_companies')
      .select('role, company_id')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .single();

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

    if (
      departments.length > 0 &&
      departments.every((d: string) => d === 'technician')
    ) {
      return '/tech-leads';
    }
  } catch {
    // Fall back to default on any error
  }

  return '/tickets/dashboard';
}
