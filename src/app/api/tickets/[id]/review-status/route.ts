import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
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
    const body = await request.json();
    const { action } = body; // 'start' or 'end'

    // Get the ticket to verify access
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select('company_id, reviewed_by, reviewed_at, review_expires_at')
      .eq('id', ticketId)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check if user is an admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin';

    // Verify user has access to this ticket's company (admins bypass this check)
    if (!isAdmin) {
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

    let updateData: any = {};

    if (action === 'start') {
      // Check if ticket is currently being reviewed by someone else
      if (
        ticket.reviewed_by &&
        ticket.reviewed_by !== user.id &&
        ticket.review_expires_at &&
        new Date(ticket.review_expires_at) > new Date()
      ) {
        return NextResponse.json(
          { error: 'Ticket is currently being reviewed by another user' },
          { status: 409 }
        );
      }

      // Set review status (5 minute expiry)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 5);

      updateData = {
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        review_expires_at: expiresAt.toISOString(),
      };
    } else if (action === 'end') {
      // Only clear if this user is the one reviewing
      if (ticket.reviewed_by === user.id) {
        updateData = {
          reviewed_by: null,
          reviewed_at: null,
          review_expires_at: null,
        };
      } else {
        // Someone else started reviewing, don't clear
        return NextResponse.json({ success: true });
      }
    } else if (action === 'heartbeat') {
      // Update expiry time if this user is reviewing
      if (ticket.reviewed_by === user.id) {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 5);

        updateData = {
          review_expires_at: expiresAt.toISOString(),
        };
      } else {
        return NextResponse.json({ success: true });
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Update the ticket
    const { data: updatedTicket, error: updateError } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', ticketId)
      .select(
        `
        id,
        reviewed_by,
        reviewed_at,
        review_expires_at,
        reviewed_by_profile:profiles!reviewed_by(
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `
      )
      .single();

    if (updateError) {
      console.error('Error updating ticket review status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update ticket review status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, ticket: updatedTicket });
  } catch (error) {
    console.error('Error in ticket review status API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
