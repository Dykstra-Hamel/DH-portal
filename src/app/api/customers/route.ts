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
      
      const leadCounts = {
        total: leads.length,
        new: leads.filter((l: any) => l.lead_status === 'new').length,
        contacted: leads.filter((l: any) => l.lead_status === 'contacted').length,
        qualified: leads.filter((l: any) => l.lead_status === 'qualified').length,
        quoted: leads.filter((l: any) => l.lead_status === 'quoted').length,
        won: leads.filter((l: any) => l.lead_status === 'won').length,
        lost: leads.filter((l: any) => l.lead_status === 'lost').length,
        unqualified: leads.filter((l: any) => l.lead_status === 'unqualified').length,
      };

      // Calculate active leads (new, contacted, qualified, quoted)
      const activeLeads = leadCounts.new + leadCounts.contacted + 
                          leadCounts.qualified + leadCounts.quoted;

      // Calculate total estimated value
      const totalEstimatedValue = leads.reduce(
        (sum: number, lead: any) => sum + (lead.estimated_value || 0), 
        0
      );

      // Remove the leads array from the response to avoid sending unnecessary data
      const { leads: _, ...customerWithoutLeads } = customer;

      return {
        ...customerWithoutLeads,
        lead_counts: leadCounts,
        active_leads: activeLeads,
        total_leads: leadCounts.total,
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
