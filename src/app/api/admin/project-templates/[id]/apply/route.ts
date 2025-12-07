import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';

// POST /api/admin/project-templates/[id]/apply - Apply template to create project with tasks
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
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

    // Parse request body (project-specific data)
    const body = await request.json();

    // Validate required fields for project creation
    if (!body.name || !body.company_id || !body.requested_by) {
      return NextResponse.json(
        { error: 'Project name, company, and requester are required' },
        { status: 400 }
      );
    }

    // Fetch template with tasks
    const { data: template, error: templateError } = await supabase
      .from('project_templates')
      .select(
        `
        *,
        tasks:project_template_tasks(*)
      `
      )
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (!template.is_active) {
      return NextResponse.json(
        { error: 'Template is not active' },
        { status: 400 }
      );
    }

    // Merge template data with provided project data
    const projectData = {
      name: body.name,
      description: body.description || template.description || null,
      project_type: template.project_type,
      project_subtype: template.project_subtype,
      company_id: body.company_id,
      requested_by: body.requested_by,
      assigned_to: body.assigned_to || null,
      status: body.status || 'coming_up',
      priority: body.priority || 'medium',
      due_date: body.due_date || null,
      start_date: body.start_date || null,
      is_billable: body.is_billable || false,
      quoted_price: body.quoted_price || null,
      tags: body.tags || template.template_data?.tags || null,
      notes: body.notes || null,
    };

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project from template:', projectError);
      return NextResponse.json(
        { error: projectError.message },
        { status: 500 }
      );
    }

    // Create tasks from template if they exist
    if (template.tasks && template.tasks.length > 0) {
      const projectStartDate = body.start_date
        ? new Date(body.start_date)
        : new Date();

      const tasksToCreate = template.tasks.map((templateTask: any) => {
        // Calculate due date based on offset
        let taskDueDate = null;
        if (templateTask.due_date_offset_days !== null) {
          const dueDate = new Date(projectStartDate);
          dueDate.setDate(dueDate.getDate() + templateTask.due_date_offset_days);
          taskDueDate = dueDate.toISOString().split('T')[0];
        }

        return {
          project_id: project.id,
          title: templateTask.title,
          description: templateTask.description,
          priority: templateTask.priority,
          due_date: taskDueDate,
          start_date: body.start_date || null,
          display_order: templateTask.display_order,
          created_by: user.id,
          assigned_to: body.assigned_to || null,
          is_completed: false,
          progress_percentage: 0,
        };
      });

      const { error: tasksError } = await supabase
        .from('project_tasks')
        .insert(tasksToCreate);

      if (tasksError) {
        console.error('Error creating tasks from template:', tasksError);
        // Project is created, but tasks failed - still return success
        // Admin can manually add tasks if needed
      }
    }

    // Fetch complete project with relationships
    const { data: completeProject } = await supabase
      .from('projects')
      .select(
        `
        *,
        company:companies(id, name),
        requested_by_profile:profiles!projects_requested_by_fkey(id, first_name, last_name, email),
        assigned_to_profile:profiles!projects_assigned_to_fkey(id, first_name, last_name, email)
      `
      )
      .eq('id', project.id)
      .single();

    return NextResponse.json(completeProject, { status: 201 });
  } catch (error) {
    console.error(
      'Error in POST /api/admin/project-templates/[id]/apply:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
