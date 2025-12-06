import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/add-on-services/[companyId]
 * List all active add-on services for a company
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const supabase = await createClient();

    // Fetch add-ons for the company
    const { data: addons, error } = await supabase
      .from('add_on_services')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching add-ons:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch add-on services' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, addons });
  } catch (error) {
    console.error('Error in GET /api/add-on-services/[companyId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/add-on-services/[companyId]
 * Create a new add-on service
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;
    const body = await request.json();
    const supabase = await createClient();

    // Insert add-on service
    const { data: addon, error: insertError } = await supabase
      .from('add_on_services')
      .insert({
        company_id: companyId,
        addon_name: body.addon_name,
        addon_description: body.addon_description || null,
        addon_category: body.addon_category || null,
        initial_price: body.initial_price || null,
        recurring_price: body.recurring_price,
        billing_frequency: body.billing_frequency || 'monthly',
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
        eligibility_mode: body.eligibility_mode || 'all',
        is_active: body.is_active !== undefined ? body.is_active : true,
        requires_quote: body.requires_quote || false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating add-on:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create add-on service' },
        { status: 500 }
      );
    }

    // If eligibility_mode is 'specific', insert eligible plans
    if (body.eligibility_mode === 'specific' && body.eligible_plan_ids?.length > 0) {
      const eligibilityRecords = body.eligible_plan_ids.map((planId: string) => ({
        addon_id: addon.id,
        service_plan_id: planId,
      }));

      const { error: eligibilityError } = await supabase
        .from('addon_service_plan_eligibility')
        .insert(eligibilityRecords);

      if (eligibilityError) {
        console.error('Error creating eligibility records:', eligibilityError);
        // Note: Add-on was created but eligibility failed - might want to rollback
        return NextResponse.json(
          {
            success: false,
            error: 'Add-on created but failed to set eligibility',
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, addon }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/add-on-services/[companyId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
