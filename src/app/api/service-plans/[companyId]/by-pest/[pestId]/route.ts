import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

// GET: Fetch service plans that cover a specific pest, sorted by price (cheapest first)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; pestId: string }> }
) {
  try {
    const { companyId, pestId } = await params;

    if (!companyId || !pestId) {
      return NextResponse.json(
        { error: 'Company ID and Pest ID are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch service plans that cover the specified pest
    const { data: plans, error } = await supabase
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
        plan_pest_coverage!inner (
          coverage_level
        )
      `)
      .eq('company_id', companyId)
      .eq('is_active', true)
      .eq('plan_pest_coverage.pest_id', pestId)
      .order('recurring_price', { ascending: true }); // Cheapest first

    if (error) {
      console.error('Error fetching service plans by pest:', error);
      return NextResponse.json(
        { error: 'Failed to fetch service plans' },
        { status: 500 }
      );
    }

    // Also fetch all pests covered by each plan for the "Covered Pests" tab
    const planIds = (plans || []).map(plan => plan.id);

    let allCoveredPests: any[] = [];
    if (planIds.length > 0) {
      const { data: coveredPests, error: pestsError } = await supabase
        .from('plan_pest_coverage')
        .select(`
          plan_id,
          coverage_level,
          pest_types (
            id,
            name,
            slug
          )
        `)
        .in('plan_id', planIds);

      if (pestsError) {
        console.error('Error fetching covered pests:', pestsError);
      } else {
        allCoveredPests = coveredPests || [];
      }
    }

    // Transform the data and include covered pests for each plan
    const transformedPlans = (plans || []).map((plan: any) => {
      const planCoveredPests = allCoveredPests
        .filter((cp: any) => cp.plan_id === plan.id)
        .map((cp: any) => ({
          id: cp.pest_types.id,
          name: cp.pest_types.name,
          slug: cp.pest_types.slug,
          coverage_level: cp.coverage_level,
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
        coverage_level: plan.plan_pest_coverage[0]?.coverage_level || 'full',
        covered_pests: planCoveredPests,
      };
    });

    // Return the cheapest plan first (already sorted by recurring_price)
    return NextResponse.json({
      success: true,
      data: transformedPlans,
      cheapest_plan: transformedPlans[0] || null,
    });
  } catch (error) {
    console.error('Error in service plans by pest GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}