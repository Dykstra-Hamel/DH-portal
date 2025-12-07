import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { normalizePhoneNumber } from '@/lib/utils';

/**
 * Helper function to get customer counts for all tabs
 */
async function getCustomerTabCounts(
  companyId: string | null
): Promise<{ all: number; active: number; inactive: number; archived: number }> {
  const supabase = createAdminClient();

  // Build base queries
  let allQuery = supabase.from('customers').select('id', { count: 'exact', head: true });
  let activeQuery = supabase.from('customers').select('id', { count: 'exact', head: true }).eq('customer_status', 'active');
  let inactiveQuery = supabase.from('customers').select('id', { count: 'exact', head: true }).eq('customer_status', 'inactive');
  let archivedQuery = supabase.from('customers').select('id', { count: 'exact', head: true }).eq('customer_status', 'archived');

  // Apply company filtering if specified
  if (companyId) {
    allQuery = allQuery.eq('company_id', companyId);
    activeQuery = activeQuery.eq('company_id', companyId);
    inactiveQuery = inactiveQuery.eq('company_id', companyId);
    archivedQuery = archivedQuery.eq('company_id', companyId);
  }

  const [allCount, activeCount, inactiveCount, archivedCount] = await Promise.all([
    allQuery,
    activeQuery,
    inactiveQuery,
    archivedQuery,
  ]);

  return {
    all: allCount.count || 0,
    active: activeCount.count || 0,
    inactive: inactiveCount.count || 0,
    archived: archivedCount.count || 0,
  };
}

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
    const startsWith = searchParams.get('startsWith');
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
        ),
        tickets:tickets!tickets_customer_id_fkey(
          id,
          status
        ),
        support_cases:support_cases!support_cases_customer_id_fkey(
          id
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
    if (startsWith) {
      // Filter by first letter of last name
      query = query.ilike('last_name', `${startsWith}%`);
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

    // Get tab counts for all customer statuses
    const counts = await getCustomerTabCounts(companyId);

    if (!customers || customers.length === 0) {
      return NextResponse.json({
        customers: [],
        counts
      });
    }

    // Calculate lead statistics efficiently from the joined data
    const enhancedCustomers = customers.map(customer => {
      const customerLeads = customer.leads || [];
      const customerTickets = customer.tickets || [];
      const customerSupportCases = customer.support_cases || [];

      // Filter tickets to only count "new" status
      const newTickets = customerTickets.filter((t: any) => t.status === 'new');

      const activeLeads = customerLeads.filter((l: any) =>
        ['new', 'contacted', 'qualified', 'quoted'].includes(l.lead_status)
      );
      const totalValue = customerLeads.reduce(
        (sum: number, l: any) => sum + (l.estimated_value || 0),
        0
      );

      // Remove arrays to reduce response size
      const { leads: _, tickets: __, support_cases: ___, ...customerWithoutRelations } = customer;

      return {
        ...customerWithoutRelations,
        full_name: `${customer.first_name} ${customer.last_name}`,
        total_leads: customerLeads.length,
        active_leads: activeLeads.length,
        total_tickets: newTickets.length,
        total_support_cases: customerSupportCases.length,
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

    return NextResponse.json({
      customers: enhancedCustomers,
      counts
    });
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
        total_tickets: 0,
        total_support_cases: 0,
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
