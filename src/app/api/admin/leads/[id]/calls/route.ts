import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Admin Lead Calls API: Starting request');

    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      console.log('Admin Lead Calls API: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    console.log('Admin Lead Calls API: Fetching calls for lead', {
      leadId: id,
    });

    const supabase = createAdminClient();

    // Get call records for this lead
    const { data: calls, error: callsError } = await supabase
      .from('call_records')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false });

    if (callsError) {
      console.error('Admin Lead Calls API: Error fetching calls:', callsError);
      return NextResponse.json(
        { error: 'Failed to fetch calls' },
        { status: 500 }
      );
    }

    console.log('Admin Lead Calls API: Successfully fetched calls', {
      leadId: id,
      callCount: calls.length,
    });

    return NextResponse.json(calls);
  } catch (error) {
    console.error('Admin Lead Calls API: Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
