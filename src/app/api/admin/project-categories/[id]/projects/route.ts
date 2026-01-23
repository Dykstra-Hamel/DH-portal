import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/project-categories/[id]/projects - List all projects using this category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile?.role || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Verify category exists and is internal
    const { data: category } = await supabase
      .from('project_categories')
      .select('id')
      .eq('id', id)
      .is('company_id', null)
      .single();

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      );
    }

    // Get all projects using this category
    const { data: projects, error } = await supabase
      .from('project_category_assignments')
      .select(`
        project_id,
        projects!inner (
          id,
          name,
          status,
          priority,
          due_date,
          scope,
          company:companies (
            id,
            name
          )
        )
      `)
      .eq('category_id', id);

    if (error) {
      console.error('Error fetching projects using category:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    // Extract and format projects
    const formattedProjects = projects?.map(p => p.projects) || [];

    return NextResponse.json({
      category_id: id,
      projects: formattedProjects,
      count: formattedProjects.length,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/project-categories/[id]/projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
