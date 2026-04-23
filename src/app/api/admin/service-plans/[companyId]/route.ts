import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

interface ServicePlan {
  id: string;
  company_id: string;
  plan_name: string;
  plan_description: string;
  plan_category: string;
  initial_price: number;
  initial_discount: number;
  recurring_price: number | null;  // Nullable for one-time plans
  billing_frequency: string | null; // Nullable for one-time plans
  treatment_frequency: string;
  includes_inspection: boolean;
  plan_features: string[];
  plan_faqs: Array<{ question: string; answer: string }>;
  display_order: number;
  highlight_badge: string | null;
  color_scheme: any;
  tech_can_upsell: boolean;
  requires_quote: boolean;
  plan_image_url: string | null;
  plan_disclaimer: string | null;
  plan_video_url: string | null;
  home_size_pricing: {
    initial_cost_per_interval: number;
    recurring_cost_per_interval: number;
  };
  yard_size_pricing: {
    initial_cost_per_interval: number;
    recurring_cost_per_interval: number;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface CreateServicePlanRequest {
  plan_name: string;
  plan_description?: string;
  plan_category?: string;
  initial_price?: number;
  initial_discount?: number;
  recurring_price?: number | null;  // Optional and nullable for one-time plans
  billing_frequency?: string | null; // Optional and nullable for one-time plans
  treatment_frequency?: string;
  includes_inspection?: boolean;
  plan_features?: string[];
  plan_faqs?: Array<{ question: string; answer: string }>;
  display_order?: number;
  highlight_badge?: string;
  color_scheme?: any;
  tech_can_upsell?: boolean;
  requires_quote?: boolean;
  is_featured?: boolean;
  plan_image_url?: string;
  plan_disclaimer?: string;
  plan_video_url?: string | null;
  home_size_pricing?: {
    initial_cost_per_interval: number;
    recurring_cost_per_interval: number;
  };
  yard_size_pricing?: {
    initial_cost_per_interval: number;
    recurring_cost_per_interval: number;
  };
  yard_sqft_pricing?: {
    pricing_mode?: 'linear' | 'custom';
    initial_cost_per_interval: number;
    recurring_cost_per_interval: number;
    custom_initial_prices?: number[];
    custom_recurring_prices?: number[];
  } | null;
  pest_coverage?: Array<{ pest_id: string; coverage_level: string }>;
  plan_products?: string[];
  recommended_addon_ids?: string[];
  plan_recommended_addons?: string[];
}

interface UpdateServicePlanRequest extends CreateServicePlanRequest {
  id: string;
  is_active?: boolean;
}

// GET: Fetch company's service plans with pest coverage
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch service plans with pest coverage, product associations, and recommended addons
    const { data: servicePlans, error } = await supabase
      .from('service_plans')
      .select(`
        *,
        plan_pest_coverage (
          id,
          pest_id,
          coverage_level,
          pest_types (
            id,
            name,
            slug,
            icon_svg,
            pest_categories (
              name,
              slug
            )
          )
        ),
        service_plan_products ( product_id ),
        service_plan_recommended_addons ( addon_id )
      `)
      .eq('company_id', companyId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching service plans:', error);
      return NextResponse.json(
        { error: 'Failed to fetch service plans' },
        { status: 500 }
      );
    }

    // Transform the data to include pest coverage
    const transformedPlans = (servicePlans || []).map((plan: any) => ({
      ...plan,
      pest_coverage: plan.plan_pest_coverage.map((coverage: any) => ({
        pest_id: coverage.pest_id,
        coverage_level: coverage.coverage_level,
        pest_name: coverage.pest_types.name,
        pest_slug: coverage.pest_types.slug,
        pest_icon: coverage.pest_types.icon_svg,
        pest_category: coverage.pest_types.pest_categories?.name || 'Unknown',
      })),
      plan_pest_coverage: undefined, // Remove the nested structure
      plan_products: plan.service_plan_products.map((r: any) => r.product_id as string),
      service_plan_products: undefined,
      recommended_addon_ids: plan.service_plan_recommended_addons.map((r: any) => r.addon_id as string),
      service_plan_recommended_addons: undefined,
    }));

    return NextResponse.json({
      success: true,
      data: transformedPlans,
    });
  } catch (error) {
    console.error('Error in service plans GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new service plan
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const planData: CreateServicePlanRequest = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Validate plan data based on category
    if (!planData.plan_name) {
      return NextResponse.json(
        { error: 'Plan name is required' },
        { status: 400 }
      );
    }

    // Check if linear feet pricing or simple per-unit pricing is configured
    const hasLinearFeetPricing = (planData as any).linear_feet_pricing !== null && (planData as any).linear_feet_pricing !== undefined;
    const hasPerUnitPricing = !!(planData as any).pricing_unit;

    if (planData.plan_category === 'one-time') {
      // One-time service validation
      if (planData.recurring_price !== 0) {
        return NextResponse.json(
          { error: 'One-time service plans must have recurring_price = 0' },
          { status: 400 }
        );
      }
      // Force billing_frequency to null for one-time plans
      planData.billing_frequency = null;
    } else {
      // Subscription plan validation
      // Allow $0 initial price if linear feet pricing or per-unit pricing is configured
      if (!hasLinearFeetPricing && !hasPerUnitPricing && planData.initial_price !== undefined && planData.initial_price === 0 && !((planData.recurring_price ?? 0) > 0)) {
        return NextResponse.json(
          { error: 'Initial price must be greater than 0 unless linear feet, per-unit pricing, or a recurring price is configured' },
          { status: 400 }
        );
      }

      // Allow $0 recurring price if linear feet pricing is configured
      if (!hasLinearFeetPricing && (!planData.recurring_price || planData.recurring_price <= 0)) {
        return NextResponse.json(
          { error: 'Recurring price is required for subscription plans and must be greater than 0 unless linear feet pricing is configured' },
          { status: 400 }
        );
      }
      if (!planData.billing_frequency) {
        return NextResponse.json(
          { error: 'Billing frequency is required for subscription plans' },
          { status: 400 }
        );
      }
    }

    const supabase = createAdminClient();

    // Extract pest coverage, product associations, and recommended addons
    const { pest_coverage, plan_products, recommended_addon_ids, plan_recommended_addons: _planRecommendedAddons, ...planFields } = planData;

    // Create the service plan
    const { data: newPlan, error: planError } = await supabase
      .from('service_plans')
      .insert({
        company_id: companyId,
        ...planFields,
        plan_features: planFields.plan_features || [],
        plan_faqs: planFields.plan_faqs || [],
      })
      .select()
      .single();

    if (planError) {
      console.error('Error creating service plan:', planError);
      return NextResponse.json(
        { error: 'Failed to create service plan' },
        { status: 500 }
      );
    }

    // Add pest coverage if provided
    if (pest_coverage && pest_coverage.length > 0) {
      const coverageData = pest_coverage.map(coverage => ({
        plan_id: newPlan.id,
        pest_id: coverage.pest_id,
        coverage_level: coverage.coverage_level,
      }));

      const { error: coverageError } = await supabase
        .from('plan_pest_coverage')
        .insert(coverageData);

      if (coverageError) {
        console.error('Error adding pest coverage:', coverageError);
        // Continue without failing - coverage can be added later
      }
    }

    // Add product associations if provided
    if (plan_products && plan_products.length > 0) {
      const { error: productsError } = await supabase
        .from('service_plan_products')
        .insert(plan_products.map((productId: string) => ({ plan_id: newPlan.id, product_id: productId })));

      if (productsError) {
        console.error('Error adding plan products:', productsError);
      }
    }

    // Add recommended addon associations if provided
    if (recommended_addon_ids && recommended_addon_ids.length > 0) {
      const { error: recommendedAddonsError } = await supabase
        .from('service_plan_recommended_addons')
        .insert(recommended_addon_ids.map((addonId: string) => ({ plan_id: newPlan.id, addon_id: addonId })));

      if (recommendedAddonsError) {
        console.error('Error adding recommended addons:', recommendedAddonsError);
      }
    }

    return NextResponse.json({
      success: true,
      data: newPlan,
      message: 'Service plan created successfully',
    });
  } catch (error) {
    console.error('Error in service plans POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update an existing service plan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const planData: UpdateServicePlanRequest = await request.json();

    if (!companyId || !planData.id) {
      return NextResponse.json(
        { error: 'Company ID and plan ID are required' },
        { status: 400 }
      );
    }

    // Check if linear feet pricing or simple per-unit pricing is configured
    const hasLinearFeetPricing = (planData as any).linear_feet_pricing !== null && (planData as any).linear_feet_pricing !== undefined;
    const hasPerUnitPricing = !!(planData as any).pricing_unit;

    // Validate and enforce recurring field rules based on plan_category
    if (planData.plan_category === 'one-time') {
      // Force recurring fields to correct values for one-time plans
      planData.recurring_price = 0;
      planData.billing_frequency = null;
    } else if (planData.plan_category && planData.plan_category !== 'one-time') {
      // Validate subscription plans have required fields
      // Allow $0 initial price if linear feet pricing or per-unit pricing is configured
      if (!hasLinearFeetPricing && !hasPerUnitPricing && planData.initial_price !== undefined && planData.initial_price === 0 && !((planData.recurring_price ?? 0) > 0)) {
        return NextResponse.json(
          { error: 'Initial price must be greater than 0 unless linear feet, per-unit pricing, or a recurring price is configured' },
          { status: 400 }
        );
      }

      // Allow $0 recurring price if linear feet pricing is configured
      if (!hasLinearFeetPricing && planData.recurring_price !== undefined && (planData.recurring_price === null || planData.recurring_price <= 0)) {
        return NextResponse.json(
          { error: 'Subscription plans must have recurring_price > 0 unless linear feet pricing is configured' },
          { status: 400 }
        );
      }
    }

    const supabase = createAdminClient();

    // Extract pest coverage, product associations, and recommended addons
    const { pest_coverage, plan_products, recommended_addon_ids, plan_recommended_addons: _planRecommendedAddons, id, ...planFields } = planData;

    // Update the service plan
    const { data: updatedPlan, error: planError } = await supabase
      .from('service_plans')
      .update({
        ...planFields,
        plan_features: planFields.plan_features || [],
        plan_faqs: planFields.plan_faqs || [],
      })
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single();

    if (planError) {
      console.error('Error updating service plan:', planError);
      return NextResponse.json(
        { error: 'Failed to update service plan' },
        { status: 500 }
      );
    }

    // Update pest coverage if provided
    if (pest_coverage !== undefined) {
      // Delete existing coverage
      await supabase
        .from('plan_pest_coverage')
        .delete()
        .eq('plan_id', id);

      // Add new coverage
      if (pest_coverage.length > 0) {
        const coverageData = pest_coverage.map(coverage => ({
          plan_id: id,
          pest_id: coverage.pest_id,
          coverage_level: coverage.coverage_level,
        }));

        const { error: coverageError } = await supabase
          .from('plan_pest_coverage')
          .insert(coverageData);

        if (coverageError) {
          console.error('Error updating pest coverage:', coverageError);
          // Continue without failing
        }
      }
    }

    // Update product associations (always replace)
    await supabase.from('service_plan_products').delete().eq('plan_id', id);
    if (plan_products && plan_products.length > 0) {
      const { error: productsError } = await supabase
        .from('service_plan_products')
        .insert(plan_products.map((productId: string) => ({ plan_id: id, product_id: productId })));

      if (productsError) {
        console.error('Error updating plan products:', productsError);
      }
    }

    // Update recommended addon associations (always replace)
    await supabase.from('service_plan_recommended_addons').delete().eq('plan_id', id);
    if (recommended_addon_ids && recommended_addon_ids.length > 0) {
      const { error: recommendedAddonsError } = await supabase
        .from('service_plan_recommended_addons')
        .insert(recommended_addon_ids.map((addonId: string) => ({ plan_id: id, addon_id: addonId })));

      if (recommendedAddonsError) {
        console.error('Error updating recommended addons:', recommendedAddonsError);
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedPlan,
      message: 'Service plan updated successfully',
    });
  } catch (error) {
    console.error('Error in service plans PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a service plan
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('id');

    if (!companyId || !planId) {
      return NextResponse.json(
        { error: 'Company ID and plan ID are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Delete the service plan (cascade will handle pest coverage)
    const { error } = await supabase
      .from('service_plans')
      .delete()
      .eq('id', planId)
      .eq('company_id', companyId);

    if (error) {
      console.error('Error deleting service plan:', error);
      return NextResponse.json(
        { error: 'Failed to delete service plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service plan deleted successfully',
    });
  } catch (error) {
    console.error('Error in service plans DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}