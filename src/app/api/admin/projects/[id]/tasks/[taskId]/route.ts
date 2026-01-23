import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';

// GET /api/admin/projects/[id]/tasks/[taskId] - Get a single task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: projectId, taskId } = await params;
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

    // Fetch task with related data
    const { data: task, error } = await supabase
      .from('project_tasks')
      .select(
        `
        *,
        assigned_to_profile:profiles!project_tasks_assigned_to_fkey(id, first_name, last_name, email, avatar_url),
        created_by_profile:profiles!project_tasks_created_by_fkey(id, first_name, last_name, email, avatar_url),
        comments:project_task_comments(
          *,
          user_profile:profiles(id, first_name, last_name, email, avatar_url)
        ),
        activity:project_task_activity(
          *,
          user_profile:profiles(id, first_name, last_name, email, avatar_url)
        )
      `
      )
      .eq('id', taskId)
      .eq('project_id', projectId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      console.error('Error fetching task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch subtasks if this is a parent task
    const { data: subtasks } = await supabase
      .from('project_tasks')
      .select(
        `
        *,
        assigned_to_profile:profiles!project_tasks_assigned_to_fkey(id, first_name, last_name, email, avatar_url),
        created_by_profile:profiles!project_tasks_created_by_fkey(id, first_name, last_name, email, avatar_url)
      `
      )
      .eq('parent_task_id', taskId)
      .order('display_order', { ascending: true });

    // Sort activity by created_at descending (most recent first)
    const sortedActivity = task.activity
      ? task.activity.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )
      : [];

    const taskWithSubtasks = {
      ...task,
      subtasks: subtasks || [],
      activity: sortedActivity,
    };

    return NextResponse.json(taskWithSubtasks);
  } catch (error) {
    console.error('Error in GET /api/admin/projects/[id]/tasks/[taskId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/projects/[id]/tasks/[taskId] - Update a task
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: projectId, taskId } = await params;
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

    // Prepare update data
    const updateData: any = {};

    // Only include fields that are present in the request
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description || null;
    if (body.notes !== undefined) updateData.notes = body.notes || null;
    if (body.is_completed !== undefined) {
      updateData.is_completed = body.is_completed;
      // Auto-set completed_at when task is marked as completed
      if (body.is_completed && !body.completed_at) {
        updateData.completed_at = new Date().toISOString();
      } else if (!body.is_completed) {
        updateData.completed_at = null;
      }
    }
    if (body.priority !== undefined) updateData.priority = body.priority;
    if (body.assigned_to !== undefined) updateData.assigned_to = body.assigned_to || null;
    if (body.due_date !== undefined) updateData.due_date = body.due_date || null;
    if (body.start_date !== undefined) updateData.start_date = body.start_date || null;
    if (body.completed_at !== undefined) updateData.completed_at = body.completed_at || null;
    if (body.progress_percentage !== undefined) {
      updateData.progress_percentage = body.progress_percentage;
    }
    if (body.actual_hours !== undefined) {
      updateData.actual_hours = body.actual_hours ? parseFloat(body.actual_hours) : null;
    }
    if (body.blocked_by !== undefined) updateData.blocked_by = body.blocked_by;
    if (body.blocking !== undefined) updateData.blocking = body.blocking;
    if (body.blocker_reason !== undefined) updateData.blocker_reason = body.blocker_reason || null;
    if (body.display_order !== undefined) updateData.display_order = body.display_order;
    if (body.parent_task_id !== undefined) updateData.parent_task_id = body.parent_task_id || null;

    // Recurring task fields
    if (body.recurring_frequency !== undefined) {
      updateData.recurring_frequency = body.recurring_frequency || null;
      updateData.is_recurring_template = body.recurring_frequency && body.recurring_frequency !== 'none';
    }
    if (body.recurring_end_date !== undefined) updateData.recurring_end_date = body.recurring_end_date || null;
    if (body.next_recurrence_date !== undefined) updateData.next_recurrence_date = body.next_recurrence_date || null;

    // Update task
    const { data: task, error } = await supabase
      .from('project_tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('project_id', projectId)
      .select(
        `
        *,
        assigned_to_profile:profiles!project_tasks_assigned_to_fkey(id, first_name, last_name, email, avatar_url),
        created_by_profile:profiles!project_tasks_created_by_fkey(id, first_name, last_name, email, avatar_url)
      `
      )
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      console.error('Error updating task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error in PUT /api/admin/projects/[id]/tasks/[taskId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/projects/[id]/tasks/[taskId] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: projectId, taskId } = await params;
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

    // Delete task (cascades to subtasks and comments)
    const { error } = await supabase
      .from('project_tasks')
      .delete()
      .eq('id', taskId)
      .eq('project_id', projectId);

    if (error) {
      console.error('Error deleting task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/projects/[id]/tasks/[taskId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
