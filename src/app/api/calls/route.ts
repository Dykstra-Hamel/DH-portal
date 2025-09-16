import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { PaginatedResponse, CallRecordWithDirection } from '@/types/call-record';

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

    // Get query parameters
    const url = new URL(request.url);
    const companyIdFilter = url.searchParams.get('company_id');
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100); // Cap at 100
    const offset = (page - 1) * limit;

    // Validate pagination parameters
    if (page < 1) {
      return NextResponse.json({ error: 'Page must be >= 1' }, { status: 400 });
    }
    if (limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Limit must be between 1 and 100' }, { status: 400 });
    }

    // Validate company_id format if provided
    if (companyIdFilter && companyIdFilter !== 'all' && companyIdFilter.trim() !== '') {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(companyIdFilter.trim())) {
        return NextResponse.json(
          { error: `Invalid company ID format: ${companyIdFilter}` },
          { status: 400 }
        );
      }
    }

    // Build base query with agents join
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
        ),
        agents (
          agent_name,
          agent_direction
        )
      `,
        { count: 'exact' }
      )
      .eq('archived', false);

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

    // Apply company filtering before fetching data for better performance
    if (isAdmin && companyIdFilter && companyIdFilter !== 'all') {
      // For admin users with a specific company filter, we can use a more complex query
      // But since filtering by company requires checking both leads and customers,
      // we'll keep post-query filtering for now
    } else if (!isAdmin) {
      // For non-admin users, we can at least filter by leads.company_id
      if (userCompanies.length > 0) {
        // We'll use post-query filtering since we need to check both leads and customers
      }
    }

    // Execute query with pagination
    const { data: calls, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching calls with full details:', {
        error,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json(
        { error: 'Unable to retrieve data', details: error.message },
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

    // Transform calls to include call direction
    const callsWithDirection: CallRecordWithDirection[] = filteredCalls.map(call => ({
      ...call,
      call_direction: call.agents?.agent_direction ? call.agents.agent_direction as 'inbound' | 'outbound' : 'unknown',
      agent_name: call.agents?.agent_name || null
    }));

    // Calculate pagination metadata
    const totalPages = Math.ceil((count || 0) / limit);
    const response: PaginatedResponse<CallRecordWithDirection> = {
      data: callsWithDirection,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in calls API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}