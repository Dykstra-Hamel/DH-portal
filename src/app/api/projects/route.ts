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
    // Filter only client projects (is_internal = FALSE)
    const { data: projects, error } = await supabase
      .from('projects')
      .select(
        `
        *,
        company:companies(
          id,
          name
        ),
        categories:project_category_assignments(
          id,
          category_id,
          category:project_categories(
            id,
            name,
            description,
            color,
            icon,
            sort_order
          )
        )
      `
      )
      .eq('company_id', companyId)
      .eq('is_internal', false)
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

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    const {
      name,
      description,
      project_type,
      project_subtype,
      requested_by,
      company_id,
      assigned_to,
      status = 'in_progress',
      priority = 'medium',
      due_date,
      start_date,
      is_billable,
      quoted_price,
      tags,
      notes,
      primary_file_path,
      category_ids = [],
      type_code,
      scope = 'external', // Default to external for client projects
    } = body;

    // Validate required fields for client projects
    if (!name || !project_type || !requested_by || !company_id || !due_date) {
      return NextResponse.json(
        { error: 'Missing required fields: name, project_type, requested_by, company_id, due_date' },
        { status: 400 }
      );
    }

    // Verify user has access to this company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('id')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .single();

    if (userCompanyError || !userCompany) {
      return NextResponse.json(
        { error: 'Access denied to this company' },
        { status: 403 }
      );
    }

    // Validate type_code if provided
    if (type_code) {
      const validTypeCodes = ['WEB', 'SOC', 'EML', 'PRT', 'VEH', 'DIG', 'ADS'];
      if (!validTypeCodes.includes(type_code)) {
        return NextResponse.json(
          { error: `Invalid type_code. Must be one of: ${validTypeCodes.join(', ')}` },
          { status: 400 }
        );
      }

      // Check if company has a short_code in company_settings
      const { data: shortCodeSetting, error: shortCodeError } = await supabase
        .from('company_settings')
        .select('setting_value')
        .eq('company_id', company_id)
        .eq('setting_key', 'short_code')
        .single();

      if (shortCodeError || !shortCodeSetting?.setting_value) {
        return NextResponse.json(
          { error: 'Company must have a short code before creating projects with type codes. Please contact your administrator.' },
          { status: 400 }
        );
      }
    }

    // Convert tags string to array
    const tagsArray = tags
      ? (typeof tags === 'string'
          ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0)
          : tags)
      : [];

    // Insert the project (is_internal = false for client projects)
    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        project_type,
        project_subtype: project_subtype || null,
        type_code: type_code || null,
        requested_by,
        company_id,
        assigned_to: assigned_to || null,
        status,
        priority,
        due_date,
        start_date: start_date || null,
        is_billable: is_billable === 'true' || is_billable === true,
        quoted_price: quoted_price ? parseFloat(quoted_price) : null,
        tags: tagsArray,
        notes,
        primary_file_path: primary_file_path || null,
        is_internal: false, // Always false for client projects
        scope, // Default to 'external'
      })
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
      console.error('Error creating project:', error);
      return NextResponse.json(
        { error: 'Failed to create project', details: error.message },
        { status: 500 }
      );
    }

    // Log project creation activity
    try {
      await supabase.from('project_activity').insert({
        project_id: project.id,
        user_id: user.id,
        action_type: 'created',
      });
    } catch (activityError) {
      console.error('Error logging project activity:', activityError);
      // Don't fail the request if activity logging fails
    }

    // Handle category assignments if provided
    if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
      const categoryAssignments = category_ids.map((categoryId: string) => ({
        project_id: project.id,
        category_id: categoryId,
      }));

      const { error: categoryError } = await supabase
        .from('project_category_assignments')
        .insert(categoryAssignments);

      if (categoryError) {
        console.error('Error assigning categories to project:', categoryError);
        // Don't fail the whole request, just log the error
      }
    }

    // Get profiles for the users involved in this project
    const userIds = [project.requested_by];
    if (project.assigned_to) {
      userIds.push(project.assigned_to);
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch user profiles' },
        { status: 500 }
      );
    }

    // Create profile map and enhance project
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const enhancedProject = {
      ...project,
      requested_by_profile: profileMap.get(project.requested_by) || null,
      assigned_to_profile: project.assigned_to
        ? profileMap.get(project.assigned_to) || null
        : null,
    };

    return NextResponse.json(enhancedProject, { status: 201 });
  } catch (error) {
    console.error('Error in projects API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
