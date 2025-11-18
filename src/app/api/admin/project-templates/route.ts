import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';

// GET /api/admin/project-templates - List all templates
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin authorization
    const adminAuthorized = await isAuthorizedAdmin(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('is_active');
    const projectType = searchParams.get('project_type');

    let query = supabase
      .from('project_templates')
      .select(
        `
        *,
        tasks:project_template_tasks(*)
      `
      )
      .order('name', { ascending: true });

    // Apply filters
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (projectType) {
      query = query.eq('project_type', projectType);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(templates || []);
  } catch (error) {
    console.error('Error in GET /api/admin/project-templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/project-templates - Create new template
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin authorization
    const adminAuthorized = await isAuthorizedAdmin(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.project_type) {
      return NextResponse.json(
        { error: 'Name and project type are required' },
        { status: 400 }
      );
    }

    // Create template
    const { data: template, error: templateError } = await supabase
      .from('project_templates')
      .insert({
        name: body.name,
        description: body.description || null,
        project_type: body.project_type,
        project_subtype: body.project_subtype || null,
        is_active: body.is_active !== false,
        template_data: body.template_data || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (templateError) {
      console.error('Error creating template:', templateError);
      return NextResponse.json(
        { error: templateError.message },
        { status: 500 }
      );
    }

    // Create template tasks if provided
    if (body.tasks && Array.isArray(body.tasks) && body.tasks.length > 0) {
      const tasksToInsert = body.tasks.map((task: any, index: number) => ({
        template_id: template.id,
        title: task.title,
        description: task.description || null,
        priority: task.priority || 'medium',
        due_date_offset_days: task.due_date_offset_days || 0,
        display_order: task.display_order ?? index,
        tags: task.tags || null,
      }));

      const { error: tasksError } = await supabase
        .from('project_template_tasks')
        .insert(tasksToInsert);

      if (tasksError) {
        console.error('Error creating template tasks:', tasksError);
        // Delete the template if tasks fail to create
        await supabase.from('project_templates').delete().eq('id', template.id);
        return NextResponse.json(
          { error: 'Failed to create template tasks' },
          { status: 500 }
        );
      }
    }

    // Fetch complete template with tasks
    const { data: completeTemplate } = await supabase
      .from('project_templates')
      .select(
        `
        *,
        tasks:project_template_tasks(*)
      `
      )
      .eq('id', template.id)
      .single();

    return NextResponse.json(completeTemplate, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/project-templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
