import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    // First verify user has access to this company
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
        .in('lead_status', ['new', 'contacted', 'qualified', 'quoted', 'unqualified'])
        .or('archived.is.null,archived.eq.false');
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
    const enhancedLeads = leads.map(lead => ({
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
