import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Admin Lead Detail API: Starting request');
    
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      console.log('Admin Lead Detail API: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    console.log('Admin Lead Detail API: Fetching lead', { leadId: id });

    // Use admin client to fetch lead with all related data
    const supabase = createAdminClient();
    
    // Get lead with customer and company info
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        company:companies(
          id,
          name,
          website
        )
      `)
      .eq('id', id)
      .single();
    
    if (leadError) {
      console.error('Admin Lead Detail API: Error fetching lead:', leadError);
      if (leadError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to fetch lead' }, { status: 500 });
    }

    // Get assigned user profile if lead has one
    let assignedUser = null;
    if (lead.assigned_to) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('id', lead.assigned_to)
        .single();
      
      if (!profileError && profileData) {
        assignedUser = profileData;
      }
    }

    // Enhanced lead object
    const enhancedLead = {
      ...lead,
      assigned_user: assignedUser
    };

    console.log('Admin Lead Detail API: Successfully fetched lead', { 
      leadId: id 
    });
    
    return NextResponse.json(enhancedLead);
  } catch (error) {
    console.error('Admin Lead Detail API: Internal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Admin Lead Detail API: Starting PUT request');
    
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      console.log('Admin Lead Detail API: Unauthorized PUT access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    console.log('Admin Lead Detail API: Updating lead', { leadId: id, body });

    // Use admin client to update lead
    const supabase = createAdminClient();
    
    const { data: lead, error } = await supabase
      .from('leads')
      .update(body)
      .eq('id', id)
      .select(`
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        company:companies(
          id,
          name,
          website
        )
      `)
      .single();
    
    if (error) {
      console.error('Admin Lead Detail API: Error updating lead:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
    }

    // Get assigned user profile if lead has one
    let assignedUser = null;
    if (lead.assigned_to) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .eq('id', lead.assigned_to)
        .single();
      
      if (!profileError && profileData) {
        assignedUser = profileData;
      }
    }

    // Enhanced lead object
    const enhancedLead = {
      ...lead,
      assigned_user: assignedUser
    };

    console.log('Admin Lead Detail API: Successfully updated lead', { leadId: id });
    return NextResponse.json(enhancedLead);
  } catch (error) {
    console.error('Admin Lead Detail API: Internal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Admin Lead Detail API: Starting DELETE request');
    
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      console.log('Admin Lead Detail API: Unauthorized DELETE access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    console.log('Admin Lead Detail API: Deleting lead', { leadId: id });

    // Use admin client to delete lead
    const supabase = createAdminClient();
    
    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Admin Lead Detail API: Error deleting lead:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Failed to delete lead' }, { status: 500 });
    }

    console.log('Admin Lead Detail API: Successfully deleted lead', { leadId: id });
    return NextResponse.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Admin Lead Detail API: Internal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}