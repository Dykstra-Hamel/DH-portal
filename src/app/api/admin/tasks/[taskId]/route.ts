import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';

// GET /api/admin/tasks/[taskId] - Get task details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
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

    // Fetch task with monthly service department assignments, comments, and activity
    const { data: task, error } = await supabase
      .from('project_tasks')
      .select(
        `
        *,
        monthly_service_task_department_assignments (
          department_id,
          monthly_services_departments (
            id,
            name,
            icon
          )
        ),
        comments:project_task_comments (
          id,
          comment,
          created_at,
          updated_at,
          user_id,
          user_profile:profiles(id, first_name, last_name, email, avatar_url)
        ),
        activity:project_task_activity (
          id,
          action_type,
          old_value,
          new_value,
          created_at,
          user_id,
          user_profile:profiles(id, first_name, last_name, email, avatar_url)
        ),
        profiles:assigned_to (
          id,
          first_name,
          last_name,
          email,
          avatar_url
        )
      `
      )
      .eq('id', taskId)
      .single();

    if (error) {
      console.error(`[GET /api/admin/tasks/${taskId}] Error:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Calculate hasUnreadComments
    let hasUnreadComments = false;
    if (task.comments && task.comments.length > 0) {
      // Get user's last view time for this task
      const { data: viewRecord } = await supabase
        .from('project_task_views')
        .select('last_viewed_at')
        .eq('user_id', user.id)
        .eq('task_id', taskId)
        .single();

      if (!viewRecord) {
        // Never viewed - all comments are unread
        hasUnreadComments = true;
      } else {
        // Check if any comment is newer than last view
        const lastViewedAt = new Date(viewRecord.last_viewed_at);
        hasUnreadComments = task.comments.some(
          (comment: any) => new Date(comment.created_at) > lastViewedAt
        );
      }
    }

    return NextResponse.json({ ...task, hasUnreadComments });
  } catch (error) {
    console.error('Error in GET /api/admin/tasks/[taskId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/tasks/[taskId] - Update a task (works for both project and monthly service tasks)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
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
    if (body.progress_percentage !== undefined) {
      updateData.progress_percentage = body.progress_percentage;
    }
    if (body.status !== undefined) updateData.status = body.status;
    if (body.labels !== undefined) updateData.labels = body.labels;
    if (body.milestone !== undefined) updateData.milestone = body.milestone || null;
    if (body.sprint !== undefined) updateData.sprint = body.sprint || null;

    // Always update updated_at
    updateData.updated_at = new Date().toISOString();

    console.log(`[PATCH /api/admin/tasks/${taskId}] Updating task with data:`, updateData);

    // Update the task
    const { data: task, error } = await supabase
      .from('project_tasks')
      .update(updateData)
      .eq('id', taskId)
      .select()
      .single();

    if (error) {
      console.error(`[PATCH /api/admin/tasks/${taskId}] Error:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[PATCH /api/admin/tasks/${taskId}] Task updated successfully`);

    return NextResponse.json(task);
  } catch (error) {
    console.error('Error in PATCH /api/admin/tasks/[taskId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tasks/[taskId] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;
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

    console.log(`[DELETE /api/admin/tasks/${taskId}] Deleting task`);

    // Delete the task
    const { error } = await supabase
      .from('project_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      console.error(`[DELETE /api/admin/tasks/${taskId}] Error:`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`[DELETE /api/admin/tasks/${taskId}] Task deleted successfully`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/tasks/[taskId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
