import { NextRequest, NextResponse } from 'next/server';
import {
  getAuthenticatedUser,
  verifyCompanyAccess,
} from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';

const COVERAGE_LEVEL_WEIGHT: Record<string, number> = {
  full: 100,
  high: 75,
  partial: 50,
  limited: 25,
  none: 0,
};

function coverageWeight(level: string | null | undefined): number {
  if (!level) return 0;
  return COVERAGE_LEVEL_WEIGHT[level.toLowerCase()] ?? 0;
}

// GET: Fetch active service plans for a company, optionally filtered by pestSlug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    const accessResult = await verifyCompanyAccess(
      supabase,
      user.id,
      companyId,
      isGlobalAdmin
    );
    if (accessResult instanceof NextResponse) {
      return accessResult;
    }

    const { searchParams } = new URL(request.url);
    const pestSlug = searchParams.get('pestSlug');

    const adminClient = createAdminClient();

    // Resolve pestSlug → pestId if provided
    let pestId: string | null = null;
    if (pestSlug) {
      const { data: pestType } = await adminClient
        .from('pest_types')
        .select('id')
        .eq('slug', pestSlug)
        .single();

      if (!pestType) {
        return NextResponse.json(
          { error: 'Pest not found for slug: ' + pestSlug },
          { status: 404 }
        );
      }
      pestId = pestType.id;
    }

    // Build service plans query
    let plansQuery = adminClient
      .from('service_plans')
      .select(`
        id,
        plan_name,
        plan_description,
        plan_category,
        initial_price,
        recurring_price,
        billing_frequency,
        treatment_frequency,
        includes_inspection,
        plan_features,
        plan_faqs,
        highlight_badge,
        display_order,
        home_size_pricing,
        yard_size_pricing,
        linear_feet_pricing,
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
      .eq('is_active', true);

    if (pestId) {
      plansQuery = (plansQuery as any).eq('plan_pest_coverage.pest_id', pestId);
    }

    const { data: plans, error } = await plansQuery.order('display_order', {
      ascending: true,
    });

    if (error) {
      console.error('Error fetching service plans:', error);
      return NextResponse.json(
        { error: 'Failed to fetch service plans' },
        { status: 500 }
      );
    }

    // Transform plans, adding coverage metadata for the requested pest
    const transformedPlans = ((plans as any[]) || [])
      .map((plan: any) => {
        const coverage = pestId
          ? (plan.plan_pest_coverage || []).find(
              (c: any) => c.pest_id === pestId
            )
          : null;

        const coverageLevel = coverage?.coverage_level ?? null;

        const coveredPests = (plan.plan_pest_coverage || []).map((c: any) => ({
          id: c.pest_types?.id,
          name: c.pest_types?.name,
          slug: c.pest_types?.slug,
          coverage_level: c.coverage_level,
        }));

        return {
          id: plan.id,
          plan_name: plan.plan_name,
          plan_description: plan.plan_description,
          plan_category: plan.plan_category,
          initial_price: plan.initial_price,
          recurring_price: plan.recurring_price,
          billing_frequency: plan.billing_frequency,
          treatment_frequency: plan.treatment_frequency,
          includes_inspection: plan.includes_inspection,
          plan_features: plan.plan_features,
          plan_faqs: plan.plan_faqs,
          highlight_badge: plan.highlight_badge,
          display_order: plan.display_order,
          home_size_pricing: plan.home_size_pricing,
          yard_size_pricing: plan.yard_size_pricing,
          linear_feet_pricing: plan.linear_feet_pricing,
          coverage_level: coverageLevel,
          coverage_weight: coverageWeight(coverageLevel),
          covered_pests: coveredPests,
        };
      })
      // When filtering by pest, exclude plans with no coverage for that pest
      .filter((plan) => !pestId || plan.coverage_level !== null)
      // Sort by coverage weight DESC, then display_order ASC
      .sort((a, b) => {
        if (b.coverage_weight !== a.coverage_weight) {
          return b.coverage_weight - a.coverage_weight;
        }
        return a.display_order - b.display_order;
      });

    return NextResponse.json({
      success: true,
      data: transformedPlans,
    });
  } catch (error) {
    console.error('Error in service-plans GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
