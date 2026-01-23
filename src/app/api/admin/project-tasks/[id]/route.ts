import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { data: task, error } = await supabase
      .from('project_tasks')
      .select(`
        *,
        assigned_to_profile:profiles!project_tasks_assigned_to_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        created_by_profile:profiles!project_tasks_created_by_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        project:projects(
          id,
          name
        ),
        subtasks:project_tasks!project_tasks_parent_task_id_fkey(
          id,
          title,
          is_completed,
          priority,
          due_date
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching task:', error);
      return NextResponse.json(
        { error: 'Failed to fetch task', details: error.message },
        { status: 500 }
      );
    }

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error in project-tasks GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const body = await request.json();

    // Get the current task for comparison (for activity logging)
    const { data: currentTask } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('id', id)
      .single();

    if (!currentTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    // Build update object - only include fields that are provided
    const updateData: Record<string, unknown> = {};
    const allowedFields = [
      'project_id',
      'parent_task_id',
      'title',
      'description',
      'notes',
      'is_completed',
      'priority',
      'assigned_to',
      'due_date',
      'start_date',
      'progress_percentage',
      'actual_hours',
      'blocker_reason',
      'display_order',
      'recurring_frequency',
      'recurring_end_date',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Handle completion status changes
    if (body.is_completed !== undefined && body.is_completed !== currentTask.is_completed) {
      updateData.is_completed = body.is_completed;
      updateData.completed_at = body.is_completed ? new Date().toISOString() : null;
    }

    // Update the task
    const { data: task, error } = await supabase
      .from('project_tasks')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        assigned_to_profile:profiles!project_tasks_assigned_to_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        created_by_profile:profiles!project_tasks_created_by_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        project:projects(
          id,
          name
        )
      `)
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json(
        { error: 'Failed to update task', details: error.message },
        { status: 500 }
      );
    }

    // Log activity for specific changes
    const activityPromises: PromiseLike<unknown>[] = [];

    if (body.is_completed !== undefined && body.is_completed !== currentTask.is_completed) {
      activityPromises.push(
        supabase.from('project_task_activity').insert({
          task_id: id,
          user_id: user.id,
          action_type: body.is_completed ? 'completed' : 'uncompleted',
        })
      );
    }

    if (body.title !== undefined && body.title !== currentTask.title) {
      activityPromises.push(
        supabase.from('project_task_activity').insert({
          task_id: id,
          user_id: user.id,
          action_type: 'title_changed',
          field_changed: 'title',
          old_value: currentTask.title,
          new_value: body.title,
        })
      );
    }

    if (body.priority !== undefined && body.priority !== currentTask.priority) {
      activityPromises.push(
        supabase.from('project_task_activity').insert({
          task_id: id,
          user_id: user.id,
          action_type: 'priority_changed',
          field_changed: 'priority',
          old_value: currentTask.priority,
          new_value: body.priority,
        })
      );
    }

    if (body.assigned_to !== undefined && body.assigned_to !== currentTask.assigned_to) {
      activityPromises.push(
        supabase.from('project_task_activity').insert({
          task_id: id,
          user_id: user.id,
          action_type: body.assigned_to ? 'assigned' : 'unassigned',
          field_changed: 'assigned_to',
          old_value: currentTask.assigned_to,
          new_value: body.assigned_to,
        })
      );
    }

    // Execute all activity logs (fire and forget)
    Promise.all(activityPromises).catch(err => {
      console.error('Error logging task activity:', err);
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error in project-tasks PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('project_tasks')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json(
        { error: 'Failed to delete task', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in project-tasks DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
