import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: ticketId } = await params;

    // First get the ticket to check company access
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('company_id')
      .eq('id', ticketId)
      .single();

    if (ticketError) {
      console.error('Error fetching ticket for calls:', ticketError);
      if (ticketError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Failed to fetch ticket' },
        { status: 500 }
      );
    }

    // Check user profile to determine if they're a global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';

    // Verify user has access to this ticket's company (admins have access to all companies)
    if (!isGlobalAdmin) {
      const { data: userCompany, error: userCompanyError } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', ticket.company_id)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this ticket' },
          { status: 403 }
        );
      }
    }

    // Get call records for this ticket
    const { data: calls, error: callsError } = await supabase
      .from('call_records')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('start_timestamp', { ascending: false });

    if (callsError) {
      console.error('Error fetching call records:', callsError);
      return NextResponse.json(
        { error: 'Failed to fetch call records' },
        { status: 500 }
      );
    }

    return NextResponse.json(calls || []);
  } catch (error) {
    console.error('Error in ticket calls API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}