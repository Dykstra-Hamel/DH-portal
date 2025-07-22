import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user from the session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
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
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    // First verify user has access to this company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single();

    if (userCompanyError || !userCompany) {
      return NextResponse.json({ error: 'Access denied to this company' }, { status: 403 });
    }

    // Build query with company join
    let query = supabase
      .from('customers')
      .select(`
        *,
        company:companies(
          id,
          name
        )
      `)
      .eq('company_id', companyId);

    // Apply filters
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
      console.error('Error fetching customers:', error);
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
      console.error('Error fetching lead counts:', leadCountError);
      // Continue without lead counts rather than failing
    }

    // Group lead data by customer
    const leadCountsByCustomer = new Map();
    const totalValuesByCustomer = new Map();
    
    if (leadCounts) {
      leadCounts.forEach(lead => {
        const customerId = lead.customer_id;
        
        // Count leads by status
        if (!leadCountsByCustomer.has(customerId)) {
          leadCountsByCustomer.set(customerId, {
            total: 0,
            new: 0,
            contacted: 0,
            qualified: 0,
            quoted: 0,
            won: 0,
            lost: 0,
            unqualified: 0
          });
          totalValuesByCustomer.set(customerId, 0);
        }
        
        const counts = leadCountsByCustomer.get(customerId);
        counts.total += 1;
        if (lead.lead_status in counts) {
          counts[lead.lead_status] += 1;
        }
        
        // Sum estimated values
        if (lead.estimated_value) {
          const currentTotal = totalValuesByCustomer.get(customerId) || 0;
          totalValuesByCustomer.set(customerId, currentTotal + lead.estimated_value);
        }
      });
    }

    // Enhance customers with lead counts and total values
    const enhancedCustomers = customers.map(customer => {
      const leadCounts = leadCountsByCustomer.get(customer.id) || {
        total: 0, new: 0, contacted: 0, qualified: 0, quoted: 0, won: 0, lost: 0, unqualified: 0
      };
      
      // Calculate active leads (new, contacted, qualified, quoted)
      const activeLeads = leadCounts.new + leadCounts.contacted + leadCounts.qualified + leadCounts.quoted;
      
      return {
        ...customer,
        lead_counts: leadCounts,
        active_leads: activeLeads,
        total_leads: leadCounts.total,
        total_estimated_value: totalValuesByCustomer.get(customer.id) || 0
      };
    });
    
    return NextResponse.json(enhancedCustomers);
  } catch (error) {
    console.error('Error in customers API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}