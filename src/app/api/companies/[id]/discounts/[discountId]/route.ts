import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/companies/[companyId]/discounts/[id]
 *
 * Gets a single discount by ID (requires admin access)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; discountId: string }> }
) {
  try {
    const { id: companyId, discountId } = await params;

    if (!companyId || !discountId) {
      return NextResponse.json(
        { error: 'Company ID and Discount ID are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user has access to this company
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user belongs to the company and has admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Verify user belongs to the company
    const { data: userCompany } = await supabase
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single();

    if (!userCompany) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch the discount
    const { data: discount, error } = await supabase
      .from('company_discounts')
      .select('*')
      .eq('id', discountId)
      .eq('company_id', companyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Discount not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching discount:', error);
      return NextResponse.json(
        { error: 'Failed to fetch discount' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      discount,
    });
  } catch (error) {
    console.error('Error in discount GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/companies/[companyId]/discounts/[id]
 *
 * Updates a discount (requires admin access)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; discountId: string }> }
) {
  try {
    const { id: companyId, discountId } = await params;
    const body = await request.json();

    if (!companyId || !discountId) {
      return NextResponse.json(
        { error: 'Company ID and Discount ID are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user has access to this company
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user belongs to the company and has admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Verify user belongs to the company
    const { data: userCompany } = await supabase
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single();

    if (!userCompany) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update discount
    const adminClient = createAdminClient();
    const { data: discount, error } = await adminClient
      .from('company_discounts')
      .update({
        discount_name: body.discount_name,
        description: body.description,
        discount_type: body.discount_type,
        discount_value: body.discount_value,
        applies_to_price: body.applies_to_price,
        applies_to_plans: body.applies_to_plans,
        eligible_plan_ids: body.eligible_plan_ids,
        requires_manager: body.requires_manager,
        time_restriction_type: body.time_restriction_type,
        seasonal_start_month: body.seasonal_start_month,
        seasonal_start_day: body.seasonal_start_day,
        seasonal_end_month: body.seasonal_end_month,
        seasonal_end_day: body.seasonal_end_day,
        limited_time_start: body.limited_time_start,
        limited_time_end: body.limited_time_end,
        sort_order: body.sort_order,
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', discountId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Discount not found' },
          { status: 404 }
        );
      }
      console.error('Error updating discount:', error);
      return NextResponse.json(
        { error: 'Failed to update discount' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      discount,
    });
  } catch (error) {
    console.error('Error in discount PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/companies/[companyId]/discounts/[id]
 *
 * Deletes a discount (requires admin access)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; discountId: string }> }
) {
  try {
    const { id: companyId, discountId } = await params;

    if (!companyId || !discountId) {
      return NextResponse.json(
        { error: 'Company ID and Discount ID are required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify user has access to this company
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user belongs to the company and has admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Verify user belongs to the company
    const { data: userCompany } = await supabase
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single();

    if (!userCompany) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete discount
    const adminClient = createAdminClient();
    const { error } = await adminClient
      .from('company_discounts')
      .delete()
      .eq('id', discountId)
      .eq('company_id', companyId);

    if (error) {
      console.error('Error deleting discount:', error);
      return NextResponse.json(
        { error: 'Failed to delete discount' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Discount deleted successfully',
    });
  } catch (error) {
    console.error('Error in discount DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
