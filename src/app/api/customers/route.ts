import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
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

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Check user profile to determine if they're a global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';

    // Verify user has access to this company (admins have access to all companies)
    if (!isGlobalAdmin) {
      const { data: userCompany, error: userCompanyError } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this company' },
          { status: 403 }
        );
      }
    }

    // Build query with company join and lead data
    let query = supabase
      .from('customers')
      .select(
        `
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
          id
        ),
        support_cases:support_cases!support_cases_customer_id_fkey(
          id
        )
      `
      )
      .eq('company_id', companyId);

    // Apply filters
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

    // Apply sorting - validate sortBy field exists on customers table
    const validSortFields = [
      'created_at', 'updated_at', 'first_name', 'last_name', 
      'email', 'phone', 'city', 'state', 'customer_status'
    ];
    
    const safeSortBy = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    const ascending = sortOrder === 'asc';
    query = query.order(safeSortBy, { ascending });

    const { data: customers, error } = await query;

    if (error) {
      console.error('Error fetching customers with details:', {
        error,
        sortBy: safeSortBy,
        sortOrder,
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

    // Calculate lead statistics per customer with better performance
    const enhancedCustomers = customers.map(customer => {
      const leads = customer.leads || [];
      const tickets = customer.tickets || [];
      const supportCases = customer.support_cases || [];

      const leadCounts = {
        total: leads.length,
        unassigned: leads.filter((l: any) => l.lead_status === 'unassigned').length,
        contacting: leads.filter((l: any) => l.lead_status === 'contacting').length,
        quoted: leads.filter((l: any) => l.lead_status === 'quoted').length,
        ready_to_schedule: leads.filter((l: any) => l.lead_status === 'ready_to_schedule').length,
        scheduled: leads.filter((l: any) => l.lead_status === 'scheduled').length,
        won: leads.filter((l: any) => l.lead_status === 'won').length,
        lost: leads.filter((l: any) => l.lead_status === 'lost').length,
      };

      // Calculate active leads (unassigned, contacting, quoted)
      const activeLeads = leadCounts.unassigned + leadCounts.contacting + leadCounts.quoted;

      // Calculate total estimated value
      const totalEstimatedValue = leads.reduce(
        (sum: number, lead: any) => sum + (lead.estimated_value || 0),
        0
      );

      // Remove arrays from the response to avoid sending unnecessary data
      const { leads: _, tickets: __, support_cases: ___, ...customerWithoutRelations } = customer;

      return {
        ...customerWithoutRelations,
        lead_counts: leadCounts,
        active_leads: activeLeads,
        total_leads: leadCounts.total,
        total_tickets: tickets.length,
        total_support_cases: supportCases.length,
        total_estimated_value: totalEstimatedValue,
      };
    });

    return NextResponse.json(enhancedCustomers);
  } catch (error) {
    console.error('Error in customers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customerData = await request.json();
    const { company_id, ...customerFields } = customerData;

    if (!company_id) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Check user profile to determine if they're a global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';

    // Verify user has access to this company (admins have access to all companies)
    if (!isGlobalAdmin) {
      const { data: userCompany, error: userCompanyError } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', company_id)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Unauthorized access to company' },
          { status: 403 }
        );
      }
    }

    // Insert the new customer
    const { data: customer, error: insertError } = await supabase
      .from('customers')
      .insert([{
        ...customerFields,
        company_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating customer:', insertError);
      return NextResponse.json(
        { error: 'Failed to create customer', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error('Error in POST customers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
