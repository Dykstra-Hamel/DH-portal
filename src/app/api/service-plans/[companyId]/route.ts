import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

/**
 * GET /api/service-plans/[companyId]
 * Fetch all service plans for a company
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    // Verify the user is authenticated
    const userClient = await createClient();
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client so plan_pest_coverage rows are readable regardless of RLS policy gaps
    const supabase = createAdminClient();

    // Fetch all active service plans for the company, including pest coverage and linked products
    const { data: plans, error } = await supabase
      .from('service_plans')
      .select(`
        *,
        plan_pest_coverage (
          pest_id,
          coverage_level,
          pest_types (
            id,
            name,
            slug
          )
        ),
        service_plan_products (
          product_id
        ),
        service_plan_recommended_addons (
          addon_id
        )
      `)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('plan_name', { ascending: true });

    if (error) {
      console.error('Error fetching service plans:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch service plans' },
        { status: 500 }
      );
    }

    const transformedPlans = (plans || []).map((plan: any) => ({
      ...plan,
      pest_coverage: (plan.plan_pest_coverage ?? []).map((coverage: any) => ({
        pest_id: coverage.pest_id,
        coverage_level: coverage.coverage_level ?? null,
        pest_name: coverage.pest_types?.name ?? '',
        pest_slug: coverage.pest_types?.slug ?? null,
      })),
      plan_product_ids: (plan.service_plan_products ?? []).map((r: any) => r.product_id as string),
      recommended_addon_ids: (plan.service_plan_recommended_addons ?? []).map((r: any) => r.addon_id as string),
      plan_pest_coverage: undefined,
      service_plan_products: undefined,
      service_plan_recommended_addons: undefined,
    }));

    return NextResponse.json({
      success: true,
      plans: transformedPlans,
    });
  } catch (error) {
    console.error('Error in GET /api/service-plans/[companyId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
