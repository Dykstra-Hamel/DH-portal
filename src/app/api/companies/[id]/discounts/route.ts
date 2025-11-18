import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/companies/[companyId]/discounts
 *
 * Lists all discounts for a company (requires admin access)
 */
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

    // Fetch all discounts for the company
    const { data: discounts, error } = await supabase
      .from('company_discounts')
      .select('*')
      .eq('company_id', companyId)
      .order('sort_order', { ascending: true })
      .order('discount_name', { ascending: true });

    if (error) {
      console.error('Error fetching discounts:', error);
      return NextResponse.json(
        { error: 'Failed to fetch discounts' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      discounts: discounts || [],
    });
  } catch (error) {
    console.error('Error in discounts GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/companies/[companyId]/discounts
 *
 * Creates a new discount (requires admin access)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const body = await request.json();

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
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

    // Validate required fields
    if (!body.discount_name || !body.discount_type || body.discount_value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: discount_name, discount_type, discount_value' },
        { status: 400 }
      );
    }

    // Create discount
    const adminClient = createAdminClient();
    const { data: discount, error } = await adminClient
      .from('company_discounts')
      .insert({
        company_id: companyId,
        discount_name: body.discount_name,
        description: body.description || null,
        discount_type: body.discount_type,
        discount_value: body.discount_value,
        applies_to_price: body.applies_to_price || 'initial',
        applies_to_plans: body.applies_to_plans || 'all',
        eligible_plan_ids: body.eligible_plan_ids || [],
        requires_manager: body.requires_manager || false,
        time_restriction_type: body.time_restriction_type || 'none',
        seasonal_start_month: body.seasonal_start_month || null,
        seasonal_start_day: body.seasonal_start_day || null,
        seasonal_end_month: body.seasonal_end_month || null,
        seasonal_end_day: body.seasonal_end_day || null,
        limited_time_start: body.limited_time_start || null,
        limited_time_end: body.limited_time_end || null,
        sort_order: body.sort_order || 0,
        is_active: body.is_active !== undefined ? body.is_active : true,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating discount:', error);
      return NextResponse.json(
        { error: 'Failed to create discount' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      discount,
    });
  } catch (error) {
    console.error('Error in discounts POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
