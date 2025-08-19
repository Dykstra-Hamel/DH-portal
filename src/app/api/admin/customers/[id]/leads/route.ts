import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Use admin client to fetch leads
    const supabase = createAdminClient();

    // Build query
    let query = supabase
      .from('leads')
      .select(
        `
        *,
        assigned_user:profiles!leads_assigned_to_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .eq('customer_id', id);

    // Apply filters
    if (status) {
      query = query.eq('lead_status', status);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    const { data: leads, error } = await query;

    if (error) {
      console.error('Admin Customer Leads API: Error fetching leads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    return NextResponse.json(leads || []);
  } catch (error) {
    console.error('Admin Customer Leads API: Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Use admin client to create lead
    const supabase = createAdminClient();

    // First verify customer exists
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, company_id')
      .eq('id', id)
      .single();

    if (customerError) {
      console.error(
        'Admin Customer Leads API: Error fetching customer:',
        customerError
      );
      if (customerError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to verify customer' },
        { status: 500 }
      );
    }

    // Create lead with customer and company IDs
    const leadData = {
      ...body,
      customer_id: id,
      company_id: customer.company_id,
    };

    const { data: lead, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select(
        `
        *,
        assigned_user:profiles!leads_assigned_to_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .single();

    if (error) {
      console.error('Admin Customer Leads API: Error creating lead:', error);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Admin Customer Leads API: Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
