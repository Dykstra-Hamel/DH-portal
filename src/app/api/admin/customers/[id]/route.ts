import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Use admin client to fetch customer with all related data
    const supabase = createAdminClient();

    // Get customer with company info and primary service address
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(
        `
        *,
        company:companies(
          id,
          name
        ),
        primary_service_address:customer_service_addresses!customer_service_addresses_customer_id_fkey(
          service_address:service_addresses(
            id,
            street_address,
            apartment_unit,
            city,
            state,
            zip_code,
            home_size_range,
            yard_size_range,
            latitude,
            longitude
          )
        )
      `
      )
      .eq('id', id)
      .eq('customer_service_addresses.is_primary_address', true)
      .single();

    if (customerError) {
      console.error(
        'Admin Customer Detail API: Error fetching customer:',
        customerError
      );
      if (customerError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch customer' },
        { status: 500 }
      );
    }

    // Get all leads for this customer (including archived ones)
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    if (leadsError) {
      console.error(
        'Admin Customer Detail API: Error fetching leads:',
        leadsError
      );
      return NextResponse.json(
        { error: 'Failed to fetch customer leads' },
        { status: 500 }
      );
    }

    // Get assigned user profiles for the leads
    const assignedUserIds =
      leads?.filter(lead => lead.assigned_to).map(lead => lead.assigned_to) ||
      [];
    let assignedUsers: any[] = [];

    // Get all tickets for this customer (including archived ones for admin)
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('customer_id', id)
      .neq('status', 'resolved')
      .order('created_at', { ascending: false });

    if (ticketsError) {
      console.error(
        'Admin Customer Detail API: Error fetching tickets:',
        ticketsError
      );
      return NextResponse.json(
        { error: 'Failed to fetch customer tickets' },
        { status: 500 }
      );
    }

    // Get assigned user profiles for both leads and tickets
    const ticketAssignedUserIds =
      tickets?.filter(ticket => ticket.assigned_to).map(ticket => ticket.assigned_to) ||
      [];
    
    const allAssignedUserIds = [...assignedUserIds, ...ticketAssignedUserIds];

    if (allAssignedUserIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', allAssignedUserIds);

      if (!profilesError && profilesData) {
        assignedUsers = profilesData;
      }
    }

    // Merge assigned user data with leads
    const leadsWithUsers =
      leads?.map(lead => ({
        ...lead,
        assigned_user: lead.assigned_to
          ? assignedUsers.find(user => user.id === lead.assigned_to)
          : null,
      })) || [];

    // Merge assigned user data with tickets
    const ticketsWithUsers =
      tickets?.map(ticket => ({
        ...ticket,
        assigned_user: ticket.assigned_to
          ? assignedUsers.find(user => user.id === ticket.assigned_to)
          : null,
      })) || [];

    // Calculate customer statistics
    const activeLeads =
      leadsWithUsers?.filter(l =>
        ['new', 'contacted', 'qualified', 'quoted'].includes(l.lead_status)
      ) || [];
    const completedLeads =
      leadsWithUsers?.filter(l =>
        ['won', 'lost', 'unqualified'].includes(l.lead_status)
      ) || [];
    const totalValue =
      leadsWithUsers?.reduce((sum, l) => sum + (l.estimated_value || 0), 0) ||
      0;
    const wonValue =
      leadsWithUsers
        ?.filter(l => l.lead_status === 'won')
        .reduce((sum, l) => sum + (l.estimated_value || 0), 0) || 0;

    // Calculate ticket statistics
    const activeTickets =
      ticketsWithUsers?.filter(t =>
        ['new', 'contacted', 'qualified', 'quoted', 'in_progress'].includes(t.status)
      ) || [];
    const completedTickets =
      ticketsWithUsers?.filter(t =>
        ['resolved', 'closed', 'won', 'lost', 'unqualified'].includes(t.status)
      ) || [];

    // Flatten primary service address structure
    const primaryServiceAddress =
      customer.primary_service_address &&
      Array.isArray(customer.primary_service_address) &&
      customer.primary_service_address.length > 0
        ? customer.primary_service_address[0]?.service_address
        : null;

    // Enhanced customer object
    const enhancedCustomer = {
      ...customer,
      full_name: `${customer.first_name} ${customer.last_name}`,
      leads: leadsWithUsers || [],
      tickets: ticketsWithUsers || [],
      primary_service_address: primaryServiceAddress,
      active_leads_count: activeLeads.length,
      completed_leads_count: completedLeads.length,
      total_leads: leadsWithUsers?.length || 0,
      active_tickets_count: activeTickets.length,
      completed_tickets_count: completedTickets.length,
      total_tickets: ticketsWithUsers?.length || 0,
      total_value: totalValue,
      won_value: wonValue,
      last_activity: leadsWithUsers?.[0]?.created_at || customer.updated_at,
    };


    return NextResponse.json(enhancedCustomer);
  } catch (error) {
    console.error('Admin Customer Detail API: Internal error:', error);
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

    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Clean and validate the data before updating
    const updateData = {
      ...body,
      // Convert empty strings to null
      email: body.email?.trim() || null,
      phone: body.phone?.trim() || null,
      address: (body.address?.trim() && body.address !== 'none') ? body.address.trim() : null,
      city: (body.city?.trim() && body.city !== 'none') ? body.city.trim() : null,
      state: (body.state?.trim() && body.state !== 'none') ? body.state.trim() : null,
      zip_code: (body.zip_code?.trim() && body.zip_code !== 'none') ? body.zip_code.trim() : null,
      notes: body.notes?.trim() || null,
    };

    // Remove any fields that are undefined or null if they shouldn't be updated
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    console.log('Admin Customer API: Updating customer with data:', updateData);

    // Use admin client to update customer
    const supabase = createAdminClient();

    const { data: customer, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
        company:companies(
          id,
          name
        )
      `
      )
      .single();

    if (error) {
      console.error(
        'Admin Customer Detail API: Error updating customer:',
        error
      );
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to update customer' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ...customer,
      full_name: `${customer.first_name} ${customer.last_name}`,
      last_activity: customer.updated_at,
    });
  } catch (error) {
    console.error('Admin Customer Detail API: Internal error:', error);
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

    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Use admin client to delete customer
    const supabase = createAdminClient();

    // First check if customer has any leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id')
      .eq('customer_id', id);

    if (leadsError) {
      console.error(
        'Admin Customer Detail API: Error checking leads:',
        leadsError
      );
      return NextResponse.json(
        { error: 'Failed to check customer leads' },
        { status: 500 }
      );
    }

    if (leads && leads.length > 0) {
      return NextResponse.json(
        {
          error:
            'Cannot delete customer with existing leads. Please delete or reassign leads first.',
        },
        { status: 400 }
      );
    }

    const { error } = await supabase.from('customers').delete().eq('id', id);

    if (error) {
      console.error(
        'Admin Customer Detail API: Error deleting customer:',
        error
      );
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to delete customer' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Admin Customer Detail API: Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
