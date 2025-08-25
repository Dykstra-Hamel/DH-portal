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
  recurring_price: number;
  billing_frequency: string;
  treatment_frequency: string;
  includes_inspection: boolean;
  plan_features: string[];
  plan_faqs: Array<{ question: string; answer: string }>;
  display_order: number;
  highlight_badge: string | null;
  color_scheme: any;
  requires_quote: boolean;
  plan_image_url: string | null;
  plan_disclaimer: string | null;
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
  recurring_price: number;
  billing_frequency: string;
  treatment_frequency?: string;
  includes_inspection?: boolean;
  plan_features?: string[];
  plan_faqs?: Array<{ question: string; answer: string }>;
  display_order?: number;
  highlight_badge?: string;
  color_scheme?: any;
  requires_quote?: boolean;
  plan_image_url?: string;
  plan_disclaimer?: string;
  pest_coverage?: Array<{ pest_id: string; coverage_level: string }>;
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

    // Fetch service plans with pest coverage
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
        )
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

    if (!planData.plan_name || !planData.recurring_price || !planData.billing_frequency) {
      return NextResponse.json(
        { error: 'Plan name, recurring price, and billing frequency are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Extract pest coverage data
    const { pest_coverage, ...planFields } = planData;

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

    const supabase = createAdminClient();

    // Extract pest coverage data
    const { pest_coverage, id, ...planFields } = planData;

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