import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { TicketFormData } from '@/types/ticket';
import {
  getAuthenticatedUser,
  verifyCompanyAccess,
  createErrorResponse,
  createSuccessResponse
} from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user, isGlobalAdmin, supabase } = authResult;

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    if (!companyId) {
      return createErrorResponse('Company ID is required', 400);
    }

    // Verify user has access to this company
    const accessCheck = await verifyCompanyAccess(supabase, user.id, companyId, isGlobalAdmin);
    if (accessCheck instanceof NextResponse) {
      return accessCheck;
    }

    // Build query based on whether archived tickets are requested
    let query = supabase
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
        )
      `
      )
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (includeArchived) {
      // If including archived, only show archived tickets
      query = query.eq('archived', true);
    } else {
      // Default behavior: show active tickets (exclude archived)
      query = query
        .in('status', ['live', 'new', 'contacted', 'qualified', 'quoted', 'in_progress', 'resolved', 'unqualified'])
        .or('archived.is.null,archived.eq.false');
    }

    const { data: tickets, error } = await query;

    if (error) {
      console.error('Error fetching tickets:', error);
      return createErrorResponse('Failed to fetch tickets');
    }

    if (!tickets || tickets.length === 0) {
      return createSuccessResponse([]);
    }

    // Fetch call_records for all tickets if any exist
    let callRecords: Array<{
      id: string;
      call_id: string;
      call_status?: string;
      start_timestamp?: string;
      end_timestamp?: string;
      duration_seconds?: number;
      ticket_id: string;
    }> = [];
    const ticketIds = tickets.map((ticket: { id: string }) => ticket.id);
    
    if (ticketIds.length > 0) {
      // Use admin client to query call_records for consistent access
      const adminSupabase = createAdminClient();
      
      const { data: callRecordsData, error: callRecordsError } = await adminSupabase
        .from('call_records')
        .select(`
          id,
          call_id,
          call_status,
          start_timestamp,
          end_timestamp,
          duration_seconds,
          ticket_id
        `)
        .in('ticket_id', ticketIds);

      if (callRecordsError) {
        console.error('Error fetching call_records:', callRecordsError);
        // Continue without call_records rather than failing
      } else {
        callRecords = callRecordsData || [];
      }
    }

    // Create a map of call records by ticket_id for quick lookup
    const callRecordsMap = new Map();
    callRecords.forEach(record => {
      if (!callRecordsMap.has(record.ticket_id)) {
        callRecordsMap.set(record.ticket_id, []);
      }
      callRecordsMap.get(record.ticket_id).push(record);
    });


    // Get all unique user IDs from tickets (assigned_to field)
    const userIds = new Set<string>();
    tickets.forEach((ticket: { assigned_to?: string }) => {
      if (ticket.assigned_to) {
        userIds.add(ticket.assigned_to);
      }
    });

    // Get profiles for assigned users if there are any
    let profiles: any[] = [];
    if (userIds.size > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', Array.from(userIds));

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return createErrorResponse('Failed to fetch user profiles');
      }

      profiles = profilesData || [];
    }

    // Create a map of user profiles for quick lookup
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    // Enhance tickets with profile data and call_records
    const enhancedTickets = tickets.map((ticket: { id: string; assigned_to?: string; [key: string]: any }) => ({
      ...ticket,
      assigned_user: ticket.assigned_to
        ? profileMap.get(ticket.assigned_to) || null
        : null,
      call_records: callRecordsMap.get(ticket.id) || [],
    }));

    return createSuccessResponse(enhancedTickets);
  } catch (error) {
    console.error('Error in tickets API:', error);
    return createErrorResponse('Internal server error');
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }
    
    const { user, supabase } = authResult;

    const ticketData: TicketFormData & { company_id: string } = await request.json();

    // Verify user has access to this company  
    const accessCheck = await verifyCompanyAccess(supabase, user.id, ticketData.company_id);
    if (accessCheck instanceof NextResponse) {
      return accessCheck;
    }

    // Insert the new ticket
    const { data: ticket, error: insertError } = await supabase
      .from('tickets')
      .insert([ticketData])
      .select(`
        *,
        customer:customers(
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

    if (insertError) {
      console.error('Error creating ticket:', insertError);
      return createErrorResponse('Failed to create ticket');
    }

    // Generate notifications for all company users
    try {
      const adminSupabase = createAdminClient();
      await adminSupabase.rpc('notify_all_company_users', {
        p_company_id: ticketData.company_id,
        p_type: 'new_ticket',
        p_title: 'New Ticket Created',
        p_message: `A new ticket has been created from ${ticket.customer?.first_name || 'Customer'} ${ticket.customer?.last_name || ''}`.trim(),
        p_reference_id: ticket.id,
        p_reference_type: 'ticket'
      });
    } catch (notificationError) {
      console.error('Error creating ticket notifications:', notificationError);
      // Don't fail the request if notification creation fails
    }

    return createSuccessResponse(ticket, 201);
  } catch (error) {
    console.error('Error in POST tickets API:', error);
    return createErrorResponse('Internal server error');
  }
}