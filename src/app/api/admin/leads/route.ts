import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(request: NextRequest) {
  try {
    console.log('Admin Leads API: Starting request');
    
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      console.log('Admin Leads API: Unauthorized access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Admin Leads API: User authenticated and authorized', { userId: user.id });

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    
    console.log('Admin Leads API: Query parameters', { companyId, status, priority });

    // Use admin client to fetch leads
    const supabase = createAdminClient();
    
    // Build query - filter to active leads only by default
    let query = supabase
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
          name
        )
      `)
      .in('lead_status', ['new', 'contacted', 'quoted'])
      .order('created_at', { ascending: false });

    // Apply filters
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    if (status) {
      query = query.eq('lead_status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: leads, error } = await query;
    
    if (error) {
      console.error('Admin Leads API: Error fetching leads:', error);
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 });
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json([]);
    }

    // Get all unique user IDs from leads (assigned_to field)
    const userIds = new Set<string>();
    leads.forEach(lead => {
      if (lead.assigned_to) {
        userIds.add(lead.assigned_to);
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
        console.error('Admin Leads API: Error fetching profiles:', profilesError);
        return NextResponse.json({ error: 'Failed to fetch user profiles' }, { status: 500 });
      }

      profiles = profilesData || [];
    }

    // Create a map of user profiles for quick lookup
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    // Enhance leads with profile data
    const enhancedLeads = leads.map(lead => ({
      ...lead,
      assigned_user: lead.assigned_to ? profileMap.get(lead.assigned_to) || null : null
    }));
    
    console.log('Admin Leads API: Successfully fetched leads', { count: enhancedLeads.length });
    return NextResponse.json(enhancedLeads);
  } catch (error) {
    console.error('Admin Leads API: Internal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Admin Leads API: Starting POST request');
    
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      console.log('Admin Leads API: Unauthorized POST access attempt');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Admin Leads API: Creating lead', { body });

    // Use admin client to create lead
    const supabase = createAdminClient();
    
    const { data: lead, error } = await supabase
      .from('leads')
      .insert([body])
      .select()
      .single();
    
    if (error) {
      console.error('Admin Leads API: Error creating lead:', error);
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }

    console.log('Admin Leads API: Successfully created lead', { leadId: lead.id });
    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Admin Leads API: Internal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}