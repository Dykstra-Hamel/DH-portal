import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { Lead } from '@/types/lead';
import {
  getAuthenticatedUser,
  verifyCompanyAccess,
  getSupabaseClient
} from '@/lib/api-utils';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user and admin status (like company users API)
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult; // Return error response
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    const unassigned = searchParams.get('unassigned') === 'true';
    const includeArchived = searchParams.get('includeArchived') === 'true';

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // Check user profile to determine if they're a global admin (already provided by getAuthenticatedUser)
    // const { data: profile } = await supabase
    //   .from('profiles')
    //   .select('role')
    //   .eq('id', user.id)
    //   .single();

    // const isGlobalAdmin = profile?.role === 'admin'; // Already provided by authResult

    // Verify user has access to this company (admins have access to all companies)
    if (!isGlobalAdmin) {
      const { data: userCompany, error: userCompanyError } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this company' },
          { status: 403 }
        );
      }
    }

    // Build query based on whether archived leads are requested
    let query = supabase
      .from('leads')
      .select(
        `
        *,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `
      )
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (includeArchived) {
      // If including archived, only show archived leads
      query = query.eq('archived', true);
    } else {
      // Default behavior: show active leads (exclude archived)
      query = query
        .in('lead_status', ['unassigned', 'contacting', 'quoted', 'ready_to_schedule', 'scheduled', 'won', 'lost'])
        .or('archived.is.null,archived.eq.false');
    }

    // Apply additional filters
    if (status) {
      // Handle comma-separated status values (e.g., "unassigned,contacting,quoted")
      const statusArray = status.split(',').map(s => s.trim());
      if (statusArray.length === 1) {
        query = query.eq('lead_status', statusArray[0]);
      } else {
        query = query.in('lead_status', statusArray);
      }
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }
    if (unassigned) {
      // Filter for leads assigned to sales team (assigned_to IS NULL)
      query = query.is('assigned_to', null);
    }

    const { data: leads, error } = await query;

    if (error) {
      console.error('Error fetching leads:', error);
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
    leads.forEach((lead: Lead) => {
      if (lead.assigned_to) {
        userIds.add(lead.assigned_to);
      }
    });

    // Get profiles for assigned users if there are any
    let profiles: any[] = [];
    if (userIds.size > 0) {
      // Always use admin client for profile data so all users can see avatars
      const queryClient = createAdminClient();
      const { data: profilesData, error: profilesError } = await queryClient
        .from('profiles')
        .select('id, first_name, last_name, email, avatar_url')
        .in('id', Array.from(userIds));


      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
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
    const enhancedLeads = leads.map((lead: Lead) => ({
      ...lead,
      assigned_user: lead.assigned_to
        ? profileMap.get(lead.assigned_to) || null
        : null,
    }));

    return NextResponse.json(enhancedLeads);
  } catch (error) {
    console.error('Error in leads API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
