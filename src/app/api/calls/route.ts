import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Check if user is global admin
    const isAdmin = await isAuthorizedAdmin(user);

    // Get optional company_id filter from query params
    const url = new URL(request.url);
    const companyIdFilter = url.searchParams.get('company_id');
    
    // Log the received company_id for debugging
    console.log('Received company_id:', companyIdFilter, 'Type:', typeof companyIdFilter);
    
    // Validate company_id format if provided
    if (companyIdFilter && companyIdFilter !== 'all' && companyIdFilter.trim() !== '') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(companyIdFilter.trim())) {
        console.error('Invalid company ID format received:', companyIdFilter);
        return NextResponse.json(
          { error: `Invalid company ID format: ${companyIdFilter}` },
          { status: 400 }
        );
      }
    }

    const query = supabase
      .from('call_records')
      .select(
        `
        *,
        leads (
          id,
          customer_id,
          company_id,
          customers (
            id,
            first_name,
            last_name,
            email
          )
        ),
        customers (
          id,
          first_name,
          last_name,
          email,
          company_id
        )
      `
      );

    // Get company access for filtering
    let userCompanies = [];
    if (!isAdmin) {
      const { data: companies, error: companiesError } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id);

      if (companiesError) {
        console.error('Error fetching user companies:', companiesError);
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }

      if (!companies || companies.length === 0) {
        return NextResponse.json(
          { error: 'User not associated with any company' },
          { status: 403 }
        );
      }

      userCompanies = companies.map(uc => uc.company_id);
    }

    // Apply filtering - we'll filter the results after the query to handle both leads and customers
    const { data: calls, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching calls:', error);
      return NextResponse.json(
        { error: 'Unable to retrieve data' },
        { status: 500 }
      );
    }

    // Filter calls based on user permissions and company filter
    let filteredCalls = calls || [];

    // Filter out calls that don't have either leads or customers
    filteredCalls = filteredCalls.filter(call => call.leads || call.customers);

    // Apply company-based filtering
    if (isAdmin) {
      // Admin users: filter by specific company if requested
      if (companyIdFilter && companyIdFilter !== 'all') {
        filteredCalls = filteredCalls.filter(call => {
          const leadCompanyId = call.leads?.company_id;
          const customerCompanyId = call.customers?.company_id;
          return leadCompanyId === companyIdFilter || customerCompanyId === companyIdFilter;
        });
      }
      // If no filter or 'all', show all calls (no additional filtering)
    } else {
      // Non-admin users: only show calls from their associated companies
      if (companyIdFilter && userCompanies.includes(companyIdFilter)) {
        // Filter by specific company if user has access to it
        filteredCalls = filteredCalls.filter(call => {
          const leadCompanyId = call.leads?.company_id;
          const customerCompanyId = call.customers?.company_id;
          return leadCompanyId === companyIdFilter || customerCompanyId === companyIdFilter;
        });
      } else if (companyIdFilter) {
        // User requested a company they don't have access to
        return NextResponse.json(
          { error: 'Access denied to requested company' },
          { status: 403 }
        );
      } else {
        // No company filter - show calls from all user's associated companies
        filteredCalls = filteredCalls.filter(call => {
          const leadCompanyId = call.leads?.company_id;
          const customerCompanyId = call.customers?.company_id;
          return userCompanies.includes(leadCompanyId) || userCompanies.includes(customerCompanyId);
        });
      }
    }

    return NextResponse.json(filteredCalls);
  } catch (error) {
    console.error('Error in calls API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}