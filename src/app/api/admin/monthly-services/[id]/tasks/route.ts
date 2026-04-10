import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/admin/monthly-services/[id]/tasks - Create a new task for a monthly service
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id: monthlyServiceId } = await params;

    // Check if user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'project_manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.title) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    // Verify the monthly service exists
    const { data: service, error: serviceError } = await supabase
      .from('monthly_services')
      .select('id')
      .eq('id', monthlyServiceId)
      .single();

    if (serviceError || !service) {
      return NextResponse.json(
        { error: 'Monthly service not found' },
        { status: 404 }
      );
    }

    // If add_to_template is true, update the service template
    if (body.add_to_template && body.week_of_month) {
      // Fetch existing templates to determine display_order
      const { data: existingTemplates } = await supabase
        .from('monthly_service_task_templates')
        .select('display_order')
        .eq('monthly_service_id', monthlyServiceId)
        .order('display_order', { ascending: false })
        .limit(1);

      const nextDisplayOrder = existingTemplates && existingTemplates.length > 0
        ? existingTemplates[0].display_order + 1
        : 0;

      const templateData = {
        monthly_service_id: monthlyServiceId,
        title: body.title,
        description: body.description || null,
        default_assigned_to: body.assigned_to || null,
        department_id: body.department_id || null,
        week_of_month: body.week_of_month,
        due_day_of_week: body.due_day_of_week || null,
        display_order: nextDisplayOrder,
      };

      const { error: templateError } = await supabase
        .from('monthly_service_task_templates')
        .insert(templateData);

      if (templateError) {
        console.error('Error creating template:', templateError);
        return NextResponse.json(
          { error: 'Failed to add task to template' },
          { status: 500 }
        );
      }
    }

    // Create the task in project_tasks
    // Monthly service tasks have project_id = null (they're standalone tasks linked via monthly_service_id)
    const taskData = {
      monthly_service_id: monthlyServiceId,
      project_id: null,
      title: body.title,
      description: body.description || null,
      priority: body.priority || 'medium',
      assigned_to: body.assigned_to || null,
      created_by: user.id,
      due_date: body.due_date || null,
      is_completed: false,
      progress_percentage: 0,
    };

    console.log('[Create Monthly Service Task] Creating task with data:', {
      monthly_service_id: monthlyServiceId,
      title: body.title,
      due_date: body.due_date,
      week_of_month: body.week_of_month,
      add_to_template: body.add_to_template,
    });

    const { data: task, error: taskError } = await supabase
      .from('project_tasks')
      .insert(taskData)
      .select(
        `
        id,
        title,
        description,
        is_completed,
        priority,
        due_date,
        assigned_to,
        profiles:assigned_to (
          id,
          first_name,
          last_name,
          email
        )
      `
      )
      .single();

    if (taskError) {
      console.error('[Create Monthly Service Task] Error creating task:', taskError);
      return NextResponse.json(
        { error: 'Failed to create task', details: taskError.message },
        { status: 500 }
      );
    }

    console.log('[Create Monthly Service Task] Task created successfully:', {
      id: task.id,
      title: task.title,
      due_date: task.due_date,
    });

    // Create department assignment if department_id is provided
    if (body.department_id) {
      const { error: deptError } = await supabase
        .from('monthly_service_task_department_assignments')
        .insert({
          task_id: task.id,
          department_id: body.department_id,
        });

      if (deptError) {
        console.error('[Create Monthly Service Task] Error creating department assignment:', deptError);
        // Don't fail the whole operation, just log the error
      }
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/monthly-services/[id]/tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
