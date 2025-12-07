import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/add-on-services/[companyId]/[addonId]
 * Get a single add-on service with its eligibility data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; addonId: string }> }
) {
  try {
    const { companyId, addonId } = await params;
    const supabase = await createClient();

    // Fetch add-on
    const { data: addon, error } = await supabase
      .from('add_on_services')
      .select('*')
      .eq('id', addonId)
      .eq('company_id', companyId)
      .single();

    if (error) {
      console.error('Error fetching add-on:', error);
      return NextResponse.json(
        { success: false, error: 'Add-on not found' },
        { status: 404 }
      );
    }

    // If eligibility_mode is 'specific', fetch eligible plans
    let eligiblePlanIds: string[] = [];
    if (addon.eligibility_mode === 'specific') {
      const { data: eligibility, error: eligibilityError } = await supabase
        .from('addon_service_plan_eligibility')
        .select('service_plan_id')
        .eq('addon_id', addonId);

      if (!eligibilityError && eligibility) {
        eligiblePlanIds = eligibility.map(e => e.service_plan_id);
      }
    }

    return NextResponse.json({
      success: true,
      addon: {
        ...addon,
        eligible_plan_ids: eligiblePlanIds,
      },
    });
  } catch (error) {
    console.error('Error in GET /api/add-on-services/[companyId]/[addonId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/add-on-services/[companyId]/[addonId]
 * Update an add-on service
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; addonId: string }> }
) {
  try {
    const { companyId, addonId } = await params;
    const body = await request.json();
    const supabase = await createClient();

    // Update add-on
    const { data: addon, error: updateError } = await supabase
      .from('add_on_services')
      .update({
        addon_name: body.addon_name,
        addon_description: body.addon_description || null,
        addon_category: body.addon_category || null,
        initial_price: body.initial_price || null,
        recurring_price: body.recurring_price,
        billing_frequency: body.billing_frequency,
        initial_discount: body.initial_discount || 0,
        home_size_pricing: body.home_size_pricing || null,
        yard_size_pricing: body.yard_size_pricing || null,
        treatment_frequency: body.treatment_frequency || null,
        includes_inspection: body.includes_inspection || false,
        addon_image_url: body.addon_image_url || null,
        addon_disclaimer: body.addon_disclaimer || null,
        addon_features: body.addon_features || [],
        addon_faqs: body.addon_faqs || [],
        display_order: body.display_order || 0,
        highlight_badge: body.highlight_badge || null,
        color_scheme: body.color_scheme || null,
        eligibility_mode: body.eligibility_mode,
        is_active: body.is_active !== undefined ? body.is_active : true,
        requires_quote: body.requires_quote || false,
      })
      .eq('id', addonId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating add-on:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update add-on service' },
        { status: 500 }
      );
    }

    // Update eligibility based on mode
    if (body.eligibility_mode === 'specific') {
      // Delete existing eligibility records
      await supabase
        .from('addon_service_plan_eligibility')
        .delete()
        .eq('addon_id', addonId);

      // Insert new eligibility records
      if (body.eligible_plan_ids?.length > 0) {
        const eligibilityRecords = body.eligible_plan_ids.map((planId: string) => ({
          addon_id: addonId,
          service_plan_id: planId,
        }));

        const { error: eligibilityError } = await supabase
          .from('addon_service_plan_eligibility')
          .insert(eligibilityRecords);

        if (eligibilityError) {
          console.error('Error updating eligibility records:', eligibilityError);
          return NextResponse.json(
            {
              success: false,
              error: 'Add-on updated but failed to update eligibility',
            },
            { status: 500 }
          );
        }
      }
    } else if (body.eligibility_mode === 'all') {
      // Delete all eligibility records if switching to 'all' mode
      await supabase
        .from('addon_service_plan_eligibility')
        .delete()
        .eq('addon_id', addonId);
    }

    return NextResponse.json({ success: true, addon });
  } catch (error) {
    console.error('Error in PUT /api/add-on-services/[companyId]/[addonId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/add-on-services/[companyId]/[addonId]
 * Soft delete an add-on service by setting is_active to false
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; addonId: string }> }
) {
  try {
    const { companyId, addonId } = await params;
    const supabase = await createClient();

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('add_on_services')
      .update({ is_active: false })
      .eq('id', addonId)
      .eq('company_id', companyId);

    if (error) {
      console.error('Error deleting add-on:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete add-on service' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/add-on-services/[companyId]/[addonId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
