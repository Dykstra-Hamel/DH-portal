import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    // Use admin client to fetch leads
    const supabase = createAdminClient();

    // Build query - specify only needed columns to reduce data transfer
    // For assigned users, we'll need to fetch profiles separately since assigned_to references auth.users
    let query = supabase
      .from('leads')
      .select(
        `
        id,
        company_id,
        customer_id,
        service_address_id,
        lead_source,
        lead_type,
        service_type,
        lead_status,
        comments,
        assigned_to,
        last_contacted_at,
        next_follow_up_at,
        estimated_value,
        priority,
        lost_reason,
        lost_stage,
        archived,
        furthest_completed_stage,
        scheduled_date,
        scheduled_time,
        created_at,
        updated_at,
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
      `
      )
      .order('created_at', { ascending: false });

    // Apply archived filter
    if (includeArchived) {
      // If including archived, only show archived leads
      query = query.eq('archived', true);
    } else {
      // Default behavior: show active leads (exclude archived)
      query = query
        .in('lead_status', ['unassigned', 'contacting', 'quoted', 'ready_to_schedule', 'scheduled'])
        .or('archived.is.null,archived.eq.false');
    }

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
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error('Admin Leads API: Error fetching leads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
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
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', Array.from(userIds));

      if (profilesError) {
        console.error(
          'Admin Leads API: Error fetching profiles:',
          profilesError
        );
        return NextResponse.json(
          { error: 'Failed to fetch user profiles' },
          { status: 500 }
        );
      }

      profiles = profilesData || [];
    }

    // Create a map of user profiles for quick lookup
    const profileMap = new Map(profiles.map(p => [p.id, p]));

    // Enhance leads with profile data
    const enhancedLeads = leads.map(lead => ({
      ...lead,
      assigned_user: lead.assigned_to
        ? profileMap.get(lead.assigned_to) || null
        : null,
    }));

    return NextResponse.json(enhancedLeads);
  } catch (error) {
    console.error('Admin Leads API: Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Use admin client to create lead
    const supabase = createAdminClient();

    const { data: lead, error } = await supabase
      .from('leads')
      .insert([body])
      .select()
      .single();

    if (error) {
      console.error('Admin Leads API: Error creating lead:', error);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    // Generate notifications based on assignment status
    try {
      if (body.company_id) {
        if (lead.assigned_to) {
          // Lead is assigned - notify only the assigned user and managers/admins
          await supabase.rpc('notify_assigned_and_managers', {
            p_company_id: body.company_id,
            p_assigned_user_id: lead.assigned_to,
            p_type: 'new_lead_assigned',
            p_title: 'New Lead Assigned to You',
            p_message: `A new lead has been assigned to you${lead.customer_name ? ` from ${lead.customer_name}` : ''}`,
            p_reference_id: lead.id,
            p_reference_type: 'lead'
          });
        } else {
          // Lead is unassigned - notify all sales team and managers/admins
          await supabase.rpc('notify_department_and_managers', {
            p_company_id: body.company_id,
            p_department: 'sales',
            p_type: 'new_lead_unassigned',
            p_title: 'New Unassigned Lead',
            p_message: `A new unassigned lead has been created${lead.customer_name ? ` from ${lead.customer_name}` : ''}`,
            p_reference_id: lead.id,
            p_reference_type: 'lead'
          });
        }
      }
    } catch (notificationError) {
      console.error('Error creating lead notifications:', notificationError);
      // Don't fail the request if notification creation fails
    }

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Admin Leads API: Internal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
