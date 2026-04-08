import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
    const supabase = await createClient();

    // Fetch all active service plans for the company, including pest coverage
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
      plan_pest_coverage: undefined,
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
