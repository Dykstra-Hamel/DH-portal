import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { PaginatedResponse, CallRecordWithDirection } from '@/types/call-record';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get query parameters
    const url = new URL(request.url);
    const companyIdFilter = url.searchParams.get('companyId');
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
      );

    // Apply company filter if specified
    if (companyIdFilter) {
      // We need to filter by company_id in both leads and customers
      // Since this requires OR logic across joins, we'll apply filtering after the query
    }

    const { data: calls, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching calls:', error);
      return NextResponse.json(
        { error: 'Failed to fetch calls' },
        { status: 500 }
      );
    }

    // Filter calls by company if specified (but no date filtering)
    let filteredCalls = calls || [];

    if (companyIdFilter) {
      filteredCalls = filteredCalls.filter(call => {
        const leadCompanyId = call.leads?.company_id;
        const customerCompanyId = call.customers?.company_id;
        return leadCompanyId === companyIdFilter || customerCompanyId === companyIdFilter;
      });
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
