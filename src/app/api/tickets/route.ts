import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { TicketFormData } from '@/types/ticket';
import {
  getAuthenticatedUser,
  verifyCompanyAccess,
  createErrorResponse,
  createSuccessResponse
} from '@/lib/api-utils';

/**
 * Helper function to get ticket counts for all tabs
 * Uses optimized RPC function with fallback to individual queries
 */
async function getTicketTabCounts(
  companyId: string,
  includeArchived: boolean
): Promise<{ all: number; incoming: number; outbound: number; forms: number }> {
  const adminSupabase = createAdminClient();

  // Try to use the optimized RPC function first
  const { data: countsData } = await adminSupabase.rpc('get_ticket_tab_counts', {
    p_company_id: companyId,
    p_include_archived: includeArchived
  });

  // Return RPC results if available
  if (countsData) {
    return countsData;
  }

  // Fallback: Use parallel queries if RPC doesn't exist yet
  const [allCount, incomingCount, outboundCount, formsCount] = await Promise.all([
    adminSupabase.from('tickets').select('id', { count: 'exact', head: true }).eq('company_id', companyId).neq('status', 'live').or('archived.is.null,archived.eq.false'),
    adminSupabase.from('tickets').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('type', 'phone_call').eq('call_direction', 'inbound').or('archived.is.null,archived.eq.false'),
    adminSupabase.from('tickets').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('type', 'phone_call').eq('call_direction', 'outbound').or('archived.is.null,archived.eq.false'),
    adminSupabase.from('tickets').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('type', 'web_form').or('archived.is.null,archived.eq.false'),
  ]);

  return {
    all: allCount.count || 0,
    incoming: incomingCount.count || 0,
    outbound: outboundCount.count || 0,
    forms: formsCount.count || 0,
  };
}

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
    const countOnly = searchParams.get('countOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '25', 10);
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const search = searchParams.get('search') || '';
    const tabFilter = searchParams.get('tab') || 'all';

    if (!companyId) {
      return createErrorResponse('Company ID is required', 400);
    }

    // Verify user has access to this company
    const accessCheck = await verifyCompanyAccess(supabase, user.id, companyId, isGlobalAdmin);
    if (accessCheck instanceof NextResponse) {
      return accessCheck;
    }

    // If count only, return counts for all tabs using optimized helper
    if (countOnly) {
      const counts = await getTicketTabCounts(companyId, includeArchived);
      return createSuccessResponse({ counts });
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
        ),
        service_address:service_addresses!left(
          id,
          street_address,
          city,
          state,
          zip_code,
          apartment_unit,
          address_line_2,
          address_type,
          property_notes,
          home_size_range,
          yard_size_range
        ),
        reviewed_by_profile:profiles!reviewed_by(
          id,
          first_name,
          last_name,
          email
        )
      `,
        { count: 'exact' }
      )
      .eq('company_id', companyId);

    if (includeArchived) {
      query = query.eq('archived', true);
    } else {
      query = query
        .in('status', ['live', 'new', 'contacted', 'qualified', 'quoted', 'in_progress', 'resolved', 'unqualified'])
        .or('archived.is.null,archived.eq.false');
    }

    // Apply tab filter
    if (tabFilter === 'incoming') {
      query = query.eq('type', 'phone_call').eq('call_direction', 'inbound');
    } else if (tabFilter === 'outbound') {
      query = query.eq('type', 'phone_call').eq('call_direction', 'outbound');
    } else if (tabFilter === 'forms') {
      query = query.eq('type', 'web_form');
    } else if (tabFilter === 'all') {
      query = query.neq('status', 'live');
    }

    // Apply search filter
    if (search) {
      query = query.or(
        `customer.first_name.ilike.%${search}%,customer.last_name.ilike.%${search}%,customer.email.ilike.%${search}%,customer.phone.ilike.%${search}%,pest_issue.ilike.%${search}%`
      );
    }

    // Apply sorting
    const ascending = sortOrder === 'asc';
    query = query.order(sortBy, { ascending });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Execute query - count is already included from line 105
    const { data: tickets, error, count: totalCount } = await query;

    if (error) {
      console.error('Error fetching tickets:', error);
      return createErrorResponse('Failed to fetch tickets');
    }

    if (!tickets || tickets.length === 0) {
      return createSuccessResponse({
        tickets: [],
        pagination: {
          page,
          limit,
          total: totalCount || 0,
          totalPages: Math.ceil((totalCount || 0) / limit),
          hasMore: false,
        },
      });
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

    // Get tab counts using the optimized helper function
    const counts = await getTicketTabCounts(companyId, includeArchived);

    return createSuccessResponse({
      tickets: enhancedTickets,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit),
        hasMore: page < Math.ceil((totalCount || 0) / limit),
      },
      counts
    });
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
        service_address:service_addresses!left(
          id,
          street_address,
          city,
          state,
          zip_code,
          apartment_unit,
          address_line_2,
          address_type,
          property_notes,
          home_size_range,
          yard_size_range
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