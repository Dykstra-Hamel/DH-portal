import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Admin Customer Detail API: Starting request');
    
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      console.log('Admin Customer Detail API: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    console.log('Admin Customer Detail API: Fetching customer', { customerId: id });

    // Use admin client to fetch customer with all related data
    const supabase = createAdminClient();
    
    // Get customer with company info
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select(`
        *,
        company:companies(
          id,
          name
        )
      `)
      .eq('id', id)
      .single();
    
    if (customerError) {
      console.error('Admin Customer Detail API: Error fetching customer:', customerError);
      if (customerError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch customer' }, { status: 500 });
    }

    // Get all leads for this customer (including archived ones)
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('customer_id', id)
      .order('created_at', { ascending: false });

    if (leadsError) {
      console.error('Admin Customer Detail API: Error fetching leads:', leadsError);
      return NextResponse.json({ error: 'Failed to fetch customer leads' }, { status: 500 });
    }

    // Get assigned user profiles for the leads
    const assignedUserIds = leads?.filter(lead => lead.assigned_to).map(lead => lead.assigned_to) || [];
    let assignedUsers: any[] = [];
    
    if (assignedUserIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', assignedUserIds);
      
      if (!profilesError && profilesData) {
        assignedUsers = profilesData;
      }
    }

    // Merge assigned user data with leads
    const leadsWithUsers = leads?.map(lead => ({
      ...lead,
      assigned_user: lead.assigned_to ? assignedUsers.find(user => user.id === lead.assigned_to) : null
    })) || [];

    // Calculate customer statistics
    const activeLeads = leadsWithUsers?.filter(l => ['new', 'contacted', 'qualified', 'quoted'].includes(l.lead_status)) || [];
    const completedLeads = leadsWithUsers?.filter(l => ['won', 'lost', 'unqualified'].includes(l.lead_status)) || [];
    const totalValue = leadsWithUsers?.reduce((sum, l) => sum + (l.estimated_value || 0), 0) || 0;
    const wonValue = leadsWithUsers?.filter(l => l.lead_status === 'won').reduce((sum, l) => sum + (l.estimated_value || 0), 0) || 0;

    // Enhanced customer object
    const enhancedCustomer = {
      ...customer,
      full_name: `${customer.first_name} ${customer.last_name}`,
      leads: leadsWithUsers || [],
      active_leads_count: activeLeads.length,
      completed_leads_count: completedLeads.length,
      total_leads: leadsWithUsers?.length || 0,
      total_value: totalValue,
      won_value: wonValue,
      last_activity: leadsWithUsers?.[0]?.created_at || customer.updated_at
    };
    
    console.log('Admin Customer Detail API: Successfully fetched customer', { 
      customerId: id, 
      leadsCount: leadsWithUsers?.length || 0 
    });
    
    return NextResponse.json(enhancedCustomer);
  } catch (error) {
    console.error('Admin Customer Detail API: Internal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Admin Customer Detail API: Starting PUT request');
    
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      console.log('Admin Customer Detail API: Unauthorized PUT access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    console.log('Admin Customer Detail API: Updating customer', { customerId: id, body });

    // Use admin client to update customer
    const supabase = createAdminClient();
    
    const { data: customer, error } = await supabase
      .from('customers')
      .update(body)
      .eq('id', id)
      .select(`
        *,
        company:companies(
          id,
          name
        )
      `)
      .single();
    
    if (error) {
      console.error('Admin Customer Detail API: Error updating customer:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
    }

    console.log('Admin Customer Detail API: Successfully updated customer', { customerId: id });
    return NextResponse.json({
      ...customer,
      full_name: `${customer.first_name} ${customer.last_name}`,
      last_activity: customer.updated_at
    });
  } catch (error) {
    console.error('Admin Customer Detail API: Internal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Admin Customer Detail API: Starting DELETE request');
    
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      console.log('Admin Customer Detail API: Unauthorized DELETE access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    console.log('Admin Customer Detail API: Deleting customer', { customerId: id });

    // Use admin client to delete customer
    const supabase = createAdminClient();
    
    // First check if customer has any leads
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id')
      .eq('customer_id', id);

    if (leadsError) {
      console.error('Admin Customer Detail API: Error checking leads:', leadsError);
      return NextResponse.json({ error: 'Failed to check customer leads' }, { status: 500 });
    }

    if (leads && leads.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete customer with existing leads. Please delete or reassign leads first.' 
      }, { status: 400 });
    }

    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Admin Customer Detail API: Error deleting customer:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
    }

    console.log('Admin Customer Detail API: Successfully deleted customer', { customerId: id });
    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Admin Customer Detail API: Internal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}