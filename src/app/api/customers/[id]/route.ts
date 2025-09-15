import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normalizePhoneNumber } from '@/lib/utils';

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

    const { id: customerId } = await params;

    // Get customer with company info
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(
        `
        *,
        company:companies(
          id,
          name,
          website
        )
      `
      )
      .eq('id', customerId)
      .single();

    if (customerError) {
      console.error('Error fetching customer:', customerError);
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

    // Verify user has access to this customer's company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', customer.company_id)
      .single();

    if (userCompanyError || !userCompany) {
      return NextResponse.json(
        { error: 'Access denied to this customer' },
        { status: 403 }
      );
    }

    // Get all leads for this customer
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (leadsError) {
      console.error('Error fetching leads:', leadsError);
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

    // Get all tickets for this customer
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('customer_id', customerId)
      .eq('archived', false) // Only show non-archived tickets
      .order('created_at', { ascending: false });

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError);
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

    // Enhanced customer object
    const enhancedCustomer = {
      ...customer,
      leads: leadsWithUsers || [],
      tickets: ticketsWithUsers || [],
    };

    return NextResponse.json(enhancedCustomer);
  } catch (error) {
    console.error('Error in customer detail API:', error);
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

    const { id: customerId } = await params;
    const body = await request.json();

    // First get the customer to check company access
    const { data: existingCustomer, error: existingCustomerError } =
      await supabase
        .from('customers')
        .select('company_id')
        .eq('id', customerId)
        .single();

    if (existingCustomerError) {
      console.error('Error fetching existing customer:', existingCustomerError);
      if (existingCustomerError.code === 'PGRST116') {
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

    // Verify user has access to this customer's company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', existingCustomer.company_id)
      .single();

    if (userCompanyError || !userCompany) {
      return NextResponse.json(
        { error: 'Access denied to this customer' },
        { status: 403 }
      );
    }

    // Clean and validate the data before updating
    const updateData = {
      ...body,
      // Convert empty strings to null and normalize phone
      email: body.email?.trim() || null,
      phone: body.phone?.trim()
        ? normalizePhoneNumber(body.phone.trim()) || body.phone.trim()
        : null,
      address: (body.address?.trim() && body.address !== 'none') ? body.address.trim() : null,
      city: (body.city?.trim() && body.city !== 'none') ? body.city.trim() : null,
      state: (body.state?.trim() && body.state !== 'none') ? body.state.trim() : null,
      zip_code: (body.zip_code?.trim() && body.zip_code !== 'none') ? body.zip_code.trim() : null,
      notes: body.notes?.trim() || null,
    };

    // Remove any fields that are undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    console.log('Customer API: Updating customer with data:', updateData);

    // Update the customer
    const { data: customer, error } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', customerId)
      .select(
        `
        *,
        company:companies(
          id,
          name,
          website
        )
      `
      )
      .single();

    if (error) {
      console.error('Error updating customer:', error);
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

    return NextResponse.json(customer);
  } catch (error) {
    console.error('Error in customer detail API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
