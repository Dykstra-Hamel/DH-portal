import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { TicketFormData } from '@/types/ticket';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Try Bearer token authentication first (for API client calls)
    const authHeader = request.headers.get('authorization');
    let user = null;
    let supabase;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Bearer token authentication - use admin client
      const { user: authUser, error: authError } = await verifyAuth(request);
      if (authError || !authUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = authUser;
      supabase = createAdminClient();
    } else {
      // Session-based authentication - use regular client
      supabase = await createClient();
      const {
        data: { user: sessionUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !sessionUser) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      user = sessionUser;
    }

    const { id } = await params;

    // Get ticket with customer and company info
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(
        `
        *,
        customer:customers!tickets_customer_id_fkey(
          id,
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          state,
          zip_code
        ),
        company:companies(
          id,
          name,
          website
        )
      `
      )
      .eq('id', id)
      .single();

    if (ticketError) {
      console.error('Error fetching ticket:', ticketError);
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check user profile to determine if they're a global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';

    // Check if user has access to this company (admins have access to all companies)
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

    // Get assigned user profile if ticket is assigned
    if (ticket.assigned_to) {
      const { data: assignedUser, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('id', ticket.assigned_to)
        .single();

      if (!profileError && assignedUser) {
        ticket.assigned_user = assignedUser;
      }
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error in GET ticket API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { id } = await params;
    const updateData: Partial<TicketFormData> = await request.json();

    // First get the current ticket to verify access
    const { data: existingTicket, error: fetchError } = await supabase
      .from('tickets')
      .select('company_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
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
        .eq('company_id', existingTicket.company_id)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this ticket' },
          { status: 403 }
        );
      }
    }

    // Update the ticket
    const { data: ticket, error: updateError } = await supabase
      .from('tickets')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        customer:customers!tickets_customer_id_fkey(
          id,
          first_name,
          last_name,
          email,
          phone,
          address,
          city,
          state,
          zip_code
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating ticket:', updateError);
      return NextResponse.json(
        { error: 'Failed to update ticket' },
        { status: 500 }
      );
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error('Error in PUT ticket API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { id } = await params;

    // First get the current ticket to verify access
    const { data: existingTicket, error: fetchError } = await supabase
      .from('tickets')
      .select('company_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check user profile to determine if they're a global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';

    // Check if user has access to this company (admins have access to all companies)
    if (!isGlobalAdmin) {
      const { data: userCompany, error: userCompanyError } = await supabase
        .from('user_companies')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', existingTicket.company_id)
        .single();

      // Only allow company admins or global admins to delete tickets
      if (userCompanyError || !userCompany || !['admin', 'owner'].includes(userCompany.role)) {
        return NextResponse.json(
          { error: 'Access denied. Only administrators can delete tickets.' },
          { status: 403 }
        );
      }
    }

    // Soft delete by setting archived = true
    const { error: deleteError } = await supabase
      .from('tickets')
      .update({ archived: true })
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting ticket:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete ticket' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Ticket archived successfully' });
  } catch (error) {
    console.error('Error in DELETE ticket API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}