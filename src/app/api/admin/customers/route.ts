import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { normalizePhoneNumber } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {

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


    // Use admin client to fetch customers
    const supabase = createAdminClient();

    // Build optimized query with company join and leads data in one go
    let query = supabase.from('customers').select(`
        *,
        company:companies(
          id,
          name
        ),
        leads(
          id,
          lead_status,
          estimated_value
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
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    // Apply sorting with validation - handle company field specially
    const validCustomerFields = [
      'created_at', 'updated_at', 'first_name', 'last_name', 
      'email', 'phone', 'city', 'state', 'customer_status'
    ];
    
    let actualSortBy = sortBy;
    const actualSortOrder = sortOrder;
    
    // If sorting by company, we'll need to sort after the query since it's a joined field
    if (sortBy === 'company') {
      // Default to created_at for the database query, we'll sort by company name after
      actualSortBy = 'created_at';
    } else if (!validCustomerFields.includes(sortBy)) {
      // Fallback to created_at for invalid fields
      actualSortBy = 'created_at';
    }
    
    const ascending = actualSortOrder === 'asc';
    query = query.order(actualSortBy, { ascending });

    const { data: customers, error } = await query;

    if (error) {
      console.error('Admin Customers API: Error fetching customers:', {
        error,
        sortBy: actualSortBy,
        sortOrder: actualSortOrder,
        companyId,
        status,
        search
      });
      return NextResponse.json(
        { error: 'Failed to fetch customers', details: error.message },
        { status: 500 }
      );
    }

    if (!customers || customers.length === 0) {
      return NextResponse.json([]);
    }

    // Calculate lead statistics efficiently from the joined data
    const enhancedCustomers = customers.map(customer => {
      const customerLeads = customer.leads || [];
      const activeLeads = customerLeads.filter((l: any) =>
        ['new', 'contacted', 'qualified', 'quoted'].includes(l.lead_status)
      );
      const totalValue = customerLeads.reduce(
        (sum: number, l: any) => sum + (l.estimated_value || 0),
        0
      );

      // Remove leads array to reduce response size
      const { leads: _, ...customerWithoutLeads } = customer;

      return {
        ...customerWithoutLeads,
        full_name: `${customer.first_name} ${customer.last_name}`,
        total_leads: customerLeads.length,
        active_leads: activeLeads.length,
        total_value: totalValue,
        last_activity: customer.updated_at,
      };
    });

    // Handle company sorting after the query since it's a joined field
    if (sortBy === 'company') {
      enhancedCustomers.sort((a, b) => {
        const aCompanyName = a.company?.name || '';
        const bCompanyName = b.company?.name || '';
        const comparison = aCompanyName.localeCompare(bCompanyName);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return NextResponse.json(enhancedCustomers);
  } catch (error) {
    console.error('Admin Customers API: Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {

    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate required fields
    if (!body.first_name || !body.last_name || !body.company_id) {
      return NextResponse.json(
        { error: 'Missing required fields: first_name, last_name, company_id' },
        { status: 400 }
      );
    }

    // Normalize phone number if provided
    const customerData = {
      ...body,
      phone: body.phone
        ? normalizePhoneNumber(body.phone) || body.phone
        : body.phone,
    };

    // Use admin client to create customer
    const supabase = createAdminClient();

    const { data: customer, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select(
        `
        *,
        company:companies(
          id,
          name
        )
      `
      )
      .single();

    if (error) {
      console.error('Admin Customers API: Error creating customer:', error);
      return NextResponse.json(
        { error: 'Failed to create customer' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ...customer,
        full_name: `${customer.first_name} ${customer.last_name}`,
        total_leads: 0,
        active_leads: 0,
        total_value: 0,
        last_activity: customer.updated_at,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin Customers API: Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
