import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { TicketFormData } from '@/types/ticket';
import {
  getAuthenticatedUser,
  getSupabaseClient,
  verifyCompanyAccess,
  createErrorResponse,
  createSuccessResponse
} from '@/lib/api-utils';
import {
  createOrFindServiceAddress,
  getCustomerPrimaryServiceAddress,
  linkCustomerToServiceAddress,
} from '@/lib/service-addresses';

/**
 * Helper function to get ticket counts for all tabs
 * Uses optimized RPC function with fallback to individual queries
 */
async function getTicketTabCounts(
  companyId: string,
  includeArchived: boolean
): Promise<{
  all: number;
  calls: number;
  forms: number;
  incoming?: number;
  outbound?: number;
}> {
  const adminSupabase = createAdminClient();

  // Build base filter for archived status
  const archivedFilter = includeArchived
    ? 'archived.eq.true'
    : 'archived.is.null,archived.eq.false';

  // Use parallel queries to get accurate counts
  const [allCount, callsCount, incomingCount, outboundCount, formsCount] = await Promise.all([
    adminSupabase.from('tickets').select('id', { count: 'exact', head: true }).eq('company_id', companyId).neq('status', 'live').neq('status', 'closed').or(archivedFilter),
    adminSupabase.from('tickets').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('type', 'phone_call').neq('status', 'live').neq('status', 'closed').or(archivedFilter),
    adminSupabase.from('tickets').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('type', 'phone_call').eq('call_direction', 'inbound').neq('status', 'live').neq('status', 'closed').or(archivedFilter),
    adminSupabase.from('tickets').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('type', 'phone_call').eq('call_direction', 'outbound').neq('status', 'live').neq('status', 'closed').or(archivedFilter),
    adminSupabase.from('tickets').select('id', { count: 'exact', head: true }).eq('company_id', companyId).eq('type', 'web_form').neq('status', 'live').neq('status', 'closed').or(archivedFilter),
  ]);

  return {
    all: allCount.count || 0,
    calls: callsCount.count || 0,
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
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

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
    let query = queryClient
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
          email,
          avatar_url
        )
      `,
        { count: 'exact' }
      )
      .eq('company_id', companyId);

    if (includeArchived) {
      query = query.eq('archived', true);
    } else {
      query = query
        .or('archived.is.null,archived.eq.false');
    }

    // Apply tab filter with status exclusions
    if (tabFilter === 'calls') {
      query = query
        .eq('type', 'phone_call')
        .neq('status', 'live')
        .neq('status', 'closed');
    } else if (tabFilter === 'incoming') {
      query = query
        .eq('type', 'phone_call')
        .eq('call_direction', 'inbound')
        .neq('status', 'live')
        .neq('status', 'closed');
    } else if (tabFilter === 'outbound') {
      query = query
        .eq('type', 'phone_call')
        .eq('call_direction', 'outbound')
        .neq('status', 'live')
        .neq('status', 'closed');
    } else if (tabFilter === 'forms') {
      query = query
        .eq('type', 'web_form')
        .neq('status', 'live')
        .neq('status', 'closed');
    } else if (tabFilter === 'all') {
      query = query
        .neq('status', 'live')
        .neq('status', 'closed');
    }

    // Apply search filter
    // PostgREST doesn't support filtering on joined tables in .or(), so we need to:
    // 1. Search for matching customer IDs first
    // 2. Then filter tickets by those customer IDs
    if (search) {
      const escapedSearch = search.replace(/[%_]/g, '\\$&'); // Escape SQL wildcards

      // First, find customer IDs that match the search
      const { data: matchingCustomers, error: customerSearchError } = await queryClient
        .from('customers')
        .select('id')
        .eq('company_id', companyId)
        .or(
          `first_name.ilike.%${escapedSearch}%,last_name.ilike.%${escapedSearch}%,email.ilike.%${escapedSearch}%,phone.ilike.%${escapedSearch}%`
        );

      if (customerSearchError) {
        console.error('Error searching customers:', customerSearchError);
      }

      const matchingCustomerIds = (matchingCustomers || []).map((c: { id: string }) => c.id);

      // Apply filter by matching customer IDs
      if (matchingCustomerIds.length > 0) {
        query = query.in('customer_id', matchingCustomerIds);
      } else {
        // No matching customers found - return empty result by filtering for impossible condition
        query = query.eq('id', '00000000-0000-0000-0000-000000000000');
      }
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

    // Always fetch tab counts so UI badges stay accurate, even when the current tab has no rows
    const counts = await getTicketTabCounts(companyId, includeArchived);

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
        counts,
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

    // Fetch primary service addresses for ticket customers
    const customerIds = new Set<string>();
    tickets.forEach((ticket: { customer_id?: string; customer?: { id?: string } }) => {
      const customerId = ticket.customer_id || ticket.customer?.id;
      if (customerId) {
        customerIds.add(customerId);
      }
    });

    let primaryServiceAddressMap = new Map<string, any>();
    if (customerIds.size > 0) {
      const adminSupabase = createAdminClient();
      const { data: primaryServiceAddresses, error: primaryServiceAddressError } =
        await adminSupabase
          .from('customer_service_addresses')
          .select(`
            customer_id,
            service_address:service_addresses(
              id,
              street_address,
              apartment_unit,
              address_line_2,
              city,
              state,
              zip_code,
              home_size_range,
              yard_size_range,
              latitude,
              longitude
            )
          `)
          .eq('is_primary_address', true)
          .in('customer_id', Array.from(customerIds));

      if (primaryServiceAddressError) {
        console.error('Error fetching primary service addresses:', primaryServiceAddressError);
      } else {
        primaryServiceAddressMap = new Map(
          (primaryServiceAddresses || []).map(address => [
            address.customer_id,
            address.service_address,
          ])
        );
      }
    }


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
      const { data: profilesData, error: profilesError } = await queryClient
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
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
    const enhancedTickets = tickets.map((ticket: { id: string; assigned_to?: string; customer_id?: string; customer?: { id?: string }; [key: string]: any }) => {
      const customerId = ticket.customer_id || ticket.customer?.id;
      const primaryServiceAddress = customerId
        ? primaryServiceAddressMap.get(customerId) || null
        : null;
      const customer = ticket.customer
        ? {
            ...ticket.customer,
            primary_service_address: primaryServiceAddress,
          }
        : ticket.customer;

      return {
        ...ticket,
        customer,
        assigned_user: ticket.assigned_to
          ? profileMap.get(ticket.assigned_to) || null
          : null,
        call_records: callRecordsMap.get(ticket.id) || [],
      };
    });

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

    const { user, supabase, isGlobalAdmin } = authResult;
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    const ticketData: TicketFormData & { company_id: string } = await request.json();

    // Verify user has access to this company (admins bypass this check)
    const accessCheck = await verifyCompanyAccess(supabase, user.id, ticketData.company_id, isGlobalAdmin);
    if (accessCheck instanceof NextResponse) {
      return accessCheck;
    }

    // Insert the new ticket
    const { data: ticket, error: insertError } = await queryClient
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

    try {
      const customerId = ticket.customer_id || ticketData.customer_id;
      const companyId = ticket.company_id || ticketData.company_id;

      if (customerId && companyId) {
        const primaryResult = await getCustomerPrimaryServiceAddress(customerId);
        const hasPrimary = Boolean(primaryResult.serviceAddress);

        if (!hasPrimary) {
          if (ticket.service_address_id) {
            await linkCustomerToServiceAddress(
              customerId,
              ticket.service_address_id,
              'owner',
              true
            );
          } else {
            const addressData = {
              street_address: ticket.customer?.address || '',
              city: ticket.customer?.city || '',
              state: ticket.customer?.state || '',
              zip_code: ticket.customer?.zip_code || '',
            };
            const hasAddressData = Object.values(addressData).some(
              value => typeof value === 'string' && value.trim() !== ''
            );

            if (hasAddressData) {
              const serviceAddressResult = await createOrFindServiceAddress(
                companyId,
                addressData
              );

              if (
                serviceAddressResult.success &&
                serviceAddressResult.serviceAddressId
              ) {
                await linkCustomerToServiceAddress(
                  customerId,
                  serviceAddressResult.serviceAddressId,
                  'owner',
                  true
                );

                if (!ticket.service_address_id) {
                  await queryClient
                    .from('tickets')
                    .update({
                      service_address_id: serviceAddressResult.serviceAddressId,
                    })
                    .eq('id', ticket.id);
                }
              }
            }
          }
        }
      }
    } catch (serviceAddressError) {
      console.error(
        'Error ensuring primary service address for ticket:',
        serviceAddressError
      );
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
