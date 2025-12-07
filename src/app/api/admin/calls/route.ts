import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { CallRecordWithDirection } from '@/types/call-record';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get company filter from query params (but NOT date filters)
    const url = new URL(request.url);
    const companyIdFilter = url.searchParams.get('companyId');

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
        agents!fk_call_records_agent_id (
          agent_name,
          agent_direction
        )
      `
      )
      .order('created_at', { ascending: false });

    const { data: calls, error } = await query;

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
        return (
          leadCompanyId === companyIdFilter ||
          customerCompanyId === companyIdFilter
        );
      });
    }

    // Transform calls to include call direction
    const callsWithDirection: CallRecordWithDirection[] = filteredCalls.map(
      call => ({
        ...call,
        call_direction: call.agents?.agent_direction
          ? (call.agents.agent_direction as 'inbound' | 'outbound')
          : 'unknown',
        agent_name: call.agents?.agent_name || null,
      })
    );

    return NextResponse.json(callsWithDirection);
  } catch (error) {
    console.error('Error in calls API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
