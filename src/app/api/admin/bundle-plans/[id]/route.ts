import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

/**
 * PUT /api/admin/bundle-plans/[id]
 * Update an existing bundle plan
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Bundle plan ID is required' },
        { status: 400 }
      );
    }

    const {
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
    const mode = pricing_mode || 'global';

    if (mode === 'global') {
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
    } else if (mode === 'per_interval' && interval_pricing && interval_pricing.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Per-interval pricing requires interval pricing configuration',
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (bundle_name !== undefined) updateData.bundle_name = bundle_name;
    if (bundle_description !== undefined) updateData.bundle_description = bundle_description;
    if (bundle_category !== undefined) updateData.bundle_category = bundle_category;
    if (bundled_service_plans !== undefined) updateData.bundled_service_plans = bundled_service_plans;
    if (bundled_add_ons !== undefined) updateData.bundled_add_ons = bundled_add_ons;

    if (pricing_mode !== undefined) {
      updateData.pricing_mode = pricing_mode;
      // Clear opposite pricing fields when switching modes
      if (pricing_mode === 'global') {
        updateData.interval_dimension = null;
        updateData.interval_pricing = [];
      } else {
        updateData.pricing_type = null;
        updateData.custom_initial_price = null;
        updateData.custom_recurring_price = null;
        updateData.discount_type = null;
        updateData.discount_value = null;
        updateData.applies_to_price = null;
        updateData.recurring_discount_type = null;
        updateData.recurring_discount_value = null;
      }
    }

    if (pricing_type !== undefined) {
      updateData.pricing_type = pricing_type;
      // Clear opposite pricing fields
      if (pricing_type === 'custom') {
        updateData.discount_type = null;
        updateData.discount_value = null;
        updateData.applies_to_price = null;
        updateData.recurring_discount_type = null;
        updateData.recurring_discount_value = null;
      } else {
        updateData.custom_initial_price = null;
        updateData.custom_recurring_price = null;
      }
    }
    if (custom_initial_price !== undefined) updateData.custom_initial_price = custom_initial_price;
    if (custom_recurring_price !== undefined) updateData.custom_recurring_price = custom_recurring_price;
    if (discount_type !== undefined) updateData.discount_type = discount_type;
    if (discount_value !== undefined) updateData.discount_value = discount_value;
    if (applies_to_price !== undefined) updateData.applies_to_price = applies_to_price;
    if (recurring_discount_type !== undefined) updateData.recurring_discount_type = recurring_discount_type;
    if (recurring_discount_value !== undefined) updateData.recurring_discount_value = recurring_discount_value;
    if (interval_dimension !== undefined) updateData.interval_dimension = interval_dimension;
    if (interval_pricing !== undefined) updateData.interval_pricing = interval_pricing;
    if (billing_frequency !== undefined) updateData.billing_frequency = billing_frequency;
    if (bundle_features !== undefined) updateData.bundle_features = bundle_features;
    if (bundle_image_url !== undefined) updateData.bundle_image_url = bundle_image_url;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (highlight_badge !== undefined) updateData.highlight_badge = highlight_badge;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data, error } = await supabase
      .from('bundle_plans')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating bundle plan:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update bundle plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/bundle-plans/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/bundle-plans/[id]
 * Delete a bundle plan
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Bundle plan ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('bundle_plans')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting bundle plan:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete bundle plan' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/bundle-plans/[id]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
