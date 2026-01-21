import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

/**
 * GET /api/admin/bundle-plans?companyId={companyId}
 * Fetch all bundle plans for a company
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json(
        { success: false, error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch bundle plans for the company
    const { data: bundles, error } = await supabase
      .from('bundle_plans')
      .select('*')
      .eq('company_id', companyId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching bundle plans:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch bundle plans' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: bundles || [],
    });
  } catch (error) {
    console.error('Error in GET /api/admin/bundle-plans:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/bundle-plans
 * Create a new bundle plan
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      company_id,
      bundle_name,
      bundle_description,
      bundle_category,
      bundled_service_plans,
      bundled_add_ons,
      pricing_mode,
      pricing_type,
      custom_initial_price,
      custom_recurring_price,
      discount_type,
      discount_value,
      applies_to_price,
      recurring_discount_type,
      recurring_discount_value,
      interval_dimension,
      interval_pricing,
      billing_frequency,
      bundle_features,
      bundle_image_url,
      display_order,
      highlight_badge,
      is_active,
    } = body;

    // Validation
    if (!company_id || !bundle_name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Company ID and bundle name are required',
        },
        { status: 400 }
      );
    }

    const mode = pricing_mode || 'global';

    if (mode === 'global') {
      if (!pricing_type) {
        return NextResponse.json(
          {
            success: false,
            error: 'Pricing type is required for global pricing',
          },
          { status: 400 }
        );
      }

      if (pricing_type === 'custom' && (!custom_initial_price || !custom_recurring_price)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Custom pricing requires both initial and recurring prices',
          },
          { status: 400 }
        );
      }

      if (pricing_type === 'discount' && (!discount_type || discount_value === undefined)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Discount pricing requires discount type and value',
          },
          { status: 400 }
        );
      }
    } else if (mode === 'per_interval') {
      if (!interval_pricing || interval_pricing.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Per-interval pricing requires interval pricing configuration',
          },
          { status: 400 }
        );
      }
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('bundle_plans')
      .insert({
        company_id,
        bundle_name,
        bundle_description,
        bundle_category,
        bundled_service_plans: bundled_service_plans || [],
        bundled_add_ons: bundled_add_ons || [],
        pricing_mode: mode,
        pricing_type: mode === 'global' ? pricing_type : null,
        custom_initial_price: mode === 'global' && pricing_type === 'custom' ? custom_initial_price : null,
        custom_recurring_price: mode === 'global' && pricing_type === 'custom' ? custom_recurring_price : null,
        discount_type: mode === 'global' && pricing_type === 'discount' ? discount_type : null,
        discount_value: mode === 'global' && pricing_type === 'discount' ? discount_value : null,
        applies_to_price: mode === 'global' && pricing_type === 'discount' ? (applies_to_price || 'both') : null,
        recurring_discount_type: mode === 'global' && pricing_type === 'discount' && applies_to_price === 'both' ? recurring_discount_type : null,
        recurring_discount_value: mode === 'global' && pricing_type === 'discount' && applies_to_price === 'both' ? recurring_discount_value : null,
        interval_dimension: mode === 'per_interval' ? (interval_dimension || 'home') : null,
        interval_pricing: mode === 'per_interval' ? interval_pricing : [],
        billing_frequency,
        bundle_features: bundle_features || [],
        bundle_image_url,
        display_order: display_order ?? 0,
        highlight_badge,
        is_active: is_active ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating bundle plan:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create bundle plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/bundle-plans:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
