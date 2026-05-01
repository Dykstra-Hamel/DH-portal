import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

/**
 * GET /api/tech-leads/upsell-catalog/[companyId]
 * Returns service plans and add-on services that a field technician is
 * allowed to upsell (tech_can_upsell = true and is_active = true).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    const userClient = await createClient();
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createAdminClient();

    const [plansRes, addonsRes] = await Promise.all([
      supabase
        .from('service_plans')
        .select(
          'id, plan_name, plan_description, initial_price, recurring_price, billing_frequency, plan_features, plan_terms, plan_disclaimer, highlight_badge, display_order, tech_can_upsell'
        )
        .eq('company_id', companyId)
        .eq('is_active', true)
        .eq('tech_can_upsell', true)
        .order('display_order', { ascending: true }),
      supabase
        .from('add_on_services')
        .select(
          'id, addon_name, addon_description, addon_category, initial_price, recurring_price, billing_frequency, addon_features, addon_terms, addon_disclaimer, highlight_badge, display_order, tech_can_upsell'
        )
        .eq('company_id', companyId)
        .eq('is_active', true)
        .eq('tech_can_upsell', true)
        .order('display_order', { ascending: true }),
    ]);

    if (plansRes.error) {
      console.error('upsell-catalog: plans fetch failed', plansRes.error);
    }
    if (addonsRes.error) {
      console.error('upsell-catalog: addons fetch failed', addonsRes.error);
    }

    return NextResponse.json({
      success: true,
      plans: plansRes.data ?? [],
      addons: addonsRes.data ?? [],
    });
  } catch (error) {
    console.error('Error in GET /api/tech-leads/upsell-catalog:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
