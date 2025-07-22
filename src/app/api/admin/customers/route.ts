import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin Customers API: Starting request');
    
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    console.log('Admin Customers API: Query parameters', { companyId, status, search, sortBy, sortOrder });

    // Use admin client to fetch customers
    const supabase = createAdminClient();
    
    // Build query with company join
    let query = supabase
      .from('customers')
      .select(`
        *,
        company:companies(
          id,
          name
        )
      `);

    // Apply filters
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    if (status) {
      query = query.eq('customer_status', status);
    }
    if (search) {
      // Search across name, email, and phone fields
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    const { data: customers, error } = await query;
    
    if (error) {
      console.error('Admin Customers API: Error fetching customers:', error);
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json([]);
    }

    // Get lead counts for each customer
    const customerIds = customers.map(c => c.id);
    const { data: leadCounts, error: leadCountError } = await supabase
      .from('leads')
      .select('customer_id, lead_status, estimated_value')
      .in('customer_id', customerIds);

    if (leadCountError) {
      console.error('Admin Customers API: Error fetching lead counts:', leadCountError);
      // Continue without lead counts rather than failing
    }

    // Enhance customers with lead statistics
    const enhancedCustomers = customers.map(customer => {
      const customerLeads = leadCounts?.filter(l => l.customer_id === customer.id) || [];
      const activeLeads = customerLeads.filter(l => ['new', 'contacted', 'qualified', 'quoted'].includes(l.lead_status));
      const totalValue = customerLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
      
      return {
        ...customer,
        full_name: `${customer.first_name} ${customer.last_name}`,
        total_leads: customerLeads.length,
        active_leads: activeLeads.length,
        total_value: totalValue,
        last_activity: customer.updated_at
      };
    });
    
    console.log('Admin Customers API: Successfully fetched customers', { count: enhancedCustomers.length });
    return NextResponse.json(enhancedCustomers);
  } catch (error) {
    console.error('Admin Customers API: Internal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Admin Customers API: Starting POST request');
    
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      console.log('Admin Customers API: Unauthorized POST access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Admin Customers API: Creating customer', { body });

    // Validate required fields
    if (!body.first_name || !body.last_name || !body.company_id) {
      return NextResponse.json({ error: 'Missing required fields: first_name, last_name, company_id' }, { status: 400 });
    }

    // Use admin client to create customer
    const supabase = createAdminClient();
    
    const { data: customer, error } = await supabase
      .from('customers')
      .insert([body])
      .select(`
        *,
        company:companies(
          id,
          name
        )
      `)
      .single();
    
    if (error) {
      console.error('Admin Customers API: Error creating customer:', error);
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }

    console.log('Admin Customers API: Successfully created customer', { customerId: customer.id });
    return NextResponse.json({
      ...customer,
      full_name: `${customer.first_name} ${customer.last_name}`,
      total_leads: 0,
      active_leads: 0,
      total_value: 0,
      last_activity: customer.updated_at
    }, { status: 201 });
  } catch (error) {
    console.error('Admin Customers API: Internal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}