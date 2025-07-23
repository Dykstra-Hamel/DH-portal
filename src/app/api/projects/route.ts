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

    // Get projects for this company where user is either requester or assigned
    const { data: projects, error } = await supabase
      .from('projects')
      .select(
        `
        *,
        company:companies(
          id,
          name
        )
      `
      )
      .eq('company_id', companyId)
      .or(`requested_by.eq.${user.id},assigned_to.eq.${user.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json([]);
    }

    // Get all unique user IDs from projects
    const userIds = new Set<string>();
    projects.forEach(project => {
      userIds.add(project.requested_by);
      if (project.assigned_to) {
        userIds.add(project.assigned_to);
      }
    });

    // Get profiles for these users
    const { data: profiles, error: profilesError } = await supabase
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

    // Create a map of user profiles for quick lookup
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Enhance projects with profile data
    const enhancedProjects = projects.map(project => ({
      ...project,
      requested_by_profile: profileMap.get(project.requested_by) || null,
      assigned_to_profile: project.assigned_to
        ? profileMap.get(project.assigned_to) || null
        : null,
    }));

    return NextResponse.json(enhancedProjects);
  } catch (error) {
    console.error('Error in projects API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
