import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin, isAuthorizedAdminOrPM } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendTaskUnblockedNotifications } from '@/lib/slack';
import { STORAGE_CONFIG } from '@/lib/storage-utils';

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
    const adminAuthorized = await isAuthorizedAdminOrPM(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminDb = createAdminClient();

    // Fetch task with related data
    const { data: task, error } = await adminDb
      .from('project_tasks')
      .select(
        `
        *,
        assigned_to_profile:profiles!project_tasks_assigned_to_fkey(id, first_name, last_name, email, avatar_url),
        created_by_profile:profiles!project_tasks_created_by_fkey(id, first_name, last_name, email, avatar_url),
        blocking_task:blocks_task_id(id, title, is_completed, assigned_to, due_date),
        blocked_by_task:blocked_by_task_id(id, title, is_completed, assigned_to, due_date),
        comments:project_task_comments(
          *,
          user_profile:profiles(id, first_name, last_name, email, avatar_url),
          attachments:comment_attachments!task_comment_id(id, file_path, file_name, file_size, mime_type, created_at)
        ),
        activity:project_task_activity(
          *,
          user_profile:profiles(id, first_name, last_name, email, avatar_url)
        ),
        project:projects(
          id,
          name,
          shortcode
        ),
        project_task_category_assignments(
          category_type,
          category:project_categories(id, name)
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
    const { data: subtasks } = await adminDb
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

    // Flatten categories with category_type
    // For /admin/ routes, filter to only include internal categories
    const categories = task.project_task_category_assignments
      ?.filter((assignment: any) => assignment.category_type === 'internal')
      .map((assignment: any) => ({
        ...assignment.category,
        category_type: assignment.category_type,
      }))
      .filter((category: any) => category !== null) || [];

    // Fetch reactions separately so the main query doesn't fail if the table doesn't exist yet
    const reactionsMap: Record<string, { id: string; user_id: string; emoji: string; created_at: string }[]> = {};
    const commentIds = (task.comments || []).map((c: any) => c.id);
    if (commentIds.length > 0) {
      const { data: reactions } = await adminDb
        .from('comment_reactions')
        .select('id, user_id, emoji, created_at, task_comment_id')
        .in('task_comment_id', commentIds);
      (reactions || []).forEach((r: { id: string; user_id: string; emoji: string; created_at: string; task_comment_id: string }) => {
        if (!reactionsMap[r.task_comment_id]) reactionsMap[r.task_comment_id] = [];
        reactionsMap[r.task_comment_id].push({ id: r.id, user_id: r.user_id, emoji: r.emoji, created_at: r.created_at });
      });
    }

    // Add public URLs to comment attachments and attach reactions
    const commentsWithUrls = (task.comments || []).map((comment: any) => ({
      ...comment,
      attachments: (comment.attachments || []).map((attachment: any) => {
        const { data: urlData } = supabase.storage
          .from(STORAGE_CONFIG.BUCKET_NAME)
          .getPublicUrl(attachment.file_path);
        return {
          ...attachment,
          url: urlData.publicUrl,
        };
      }),
      reactions: reactionsMap[comment.id] || [],
    }));

    const { project_task_category_assignments, ...taskWithoutAssignments } = task;

    const taskWithSubtasks = {
      ...taskWithoutAssignments,
      categories,
      comments: commentsWithUrls,
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
    const adminAuthorized = await isAuthorizedAdminOrPM(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    console.log('PUT /tasks/[taskId] - Request body:', JSON.stringify(body));
    console.log('PUT /tasks/[taskId] - taskId:', taskId, 'projectId:', projectId);

    const adminDb = createAdminClient();

    // Fetch current task state before update
    const { data: currentTask, error: fetchError } = await adminDb
      .from('project_tasks')
      .select('is_completed, blocked_by_task_id, blocked_by_task:blocked_by_task_id(id, title, is_completed)')
      .eq('id', taskId)
      .single();

    if (fetchError) {
      console.error('Error fetching current task:', fetchError);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Before allowing completion, check if task is blocked
    if (body.is_completed && !currentTask.is_completed) {
      // Check if task has an active blocker
      const { data: hasBlocker } = await adminDb
        .rpc('has_blocking_dependency', { task_uuid: taskId });

      if (hasBlocker) {
        // Get blocker details
        const { data: blocker } = await adminDb
          .rpc('get_blocking_task', { task_uuid: taskId });

        return NextResponse.json(
          {
            error: 'Cannot complete task: blocked by another task',
            blockedBy: blocker
          },
          { status: 400 }
        );
      }

      // Check if task has incomplete subtasks
      const { data: incompleteSubtasks, error: subtasksError } = await adminDb
        .from('project_tasks')
        .select('id, title')
        .eq('parent_task_id', taskId)
        .eq('is_completed', false);

      if (subtasksError) {
        console.error('Error checking subtasks:', subtasksError);
      }

      if (incompleteSubtasks && incompleteSubtasks.length > 0) {
        const subtaskTitles = incompleteSubtasks.map(st => st.title).join(', ');
        return NextResponse.json(
          {
            error: `Cannot complete task: ${incompleteSubtasks.length} incomplete subtask${incompleteSubtasks.length > 1 ? 's' : ''} (${subtaskTitles})`,
            incompleteSubtasks
          },
          { status: 400 }
        );
      }
    }

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
    if (body.blocks_task_id !== undefined) updateData.blocks_task_id = body.blocks_task_id || null;
    if (body.blocked_by_task_id !== undefined) updateData.blocked_by_task_id = body.blocked_by_task_id || null;
    if (body.blocker_reason !== undefined) updateData.blocker_reason = body.blocker_reason || null;
    if (body.department_id !== undefined) updateData.department_id = body.department_id || null;
    if (body.display_order !== undefined) updateData.display_order = body.display_order;
    if (body.parent_task_id !== undefined) updateData.parent_task_id = body.parent_task_id || null;

    // Recurring task fields
    if (body.recurring_frequency !== undefined) {
      updateData.recurring_frequency = body.recurring_frequency || null;
      updateData.is_recurring_template = body.recurring_frequency && body.recurring_frequency !== 'none';
    }
    if (body.recurring_end_date !== undefined) updateData.recurring_end_date = body.recurring_end_date || null;
    if (body.next_recurrence_date !== undefined) updateData.next_recurrence_date = body.next_recurrence_date || null;

    // Always update the updated_at timestamp (even if only updating categories)
    // This prevents empty updates which cause PGRST116 errors
    updateData.updated_at = new Date().toISOString();

    // Update task
    console.log('PUT /tasks/[taskId] - updateData:', JSON.stringify(updateData));
    const { data: task, error } = await adminDb
      .from('project_tasks')
      .update(updateData)
      .eq('id', taskId)
      .eq('project_id', projectId)
      .select(
        `
        *,
        assigned_to_profile:profiles!project_tasks_assigned_to_fkey(id, first_name, last_name, email, avatar_url),
        created_by_profile:profiles!project_tasks_created_by_fkey(id, first_name, last_name, email, avatar_url),
        blocking_task:blocks_task_id(id, title, is_completed, assigned_to, due_date),
        blocked_by_task:blocked_by_task_id(id, title, is_completed, assigned_to, due_date)
      `
      )
      .single();

    console.log('PUT /tasks/[taskId] - Update result:', { task: !!task, error });

    if (error) {
      if (error.code === 'PGRST116') {
        console.error('Task not found - taskId:', taskId, 'projectId:', projectId);
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }
      console.error('Error updating task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update project's updated_at timestamp when task is updated
    if (projectId) {
      await adminDb
        .from('projects')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', projectId);
    }

    // Handle task completion - notify and move department
    if (body.is_completed && !currentTask.is_completed) {
      // Fetch tasks that were blocked by this one
      const { data: unblockedTasks } = await adminDb
        .rpc('get_all_blocked_tasks', { task_uuid: taskId });

      if (unblockedTasks && unblockedTasks.length > 0) {
        // Trigger Slack notifications (fire-and-forget)
        setImmediate(async () => {
          try {
            // Fetch project name for notification
            const { data: project } = await adminDb
              .from('projects')
              .select('name')
              .eq('id', projectId)
              .single();

            await sendTaskUnblockedNotifications(unblockedTasks, {
              id: task.id,
              title: task.title,
              project_id: task.project_id || projectId,
              project: { name: project?.name || 'Unknown Project' }
            });
          } catch (error) {
            console.error('Error sending Slack notifications:', error);
          }
        });

        // Auto-move project to first unblocked task's department (if set)
        const firstUnblockedTask = unblockedTasks[0];
        if (firstUnblockedTask.department_id) {
          // Fetch current project department
          const { data: project } = await adminDb
            .from('projects')
            .select('current_department_id')
            .eq('id', projectId)
            .single();

          if (project && project.current_department_id !== firstUnblockedTask.department_id) {
            await adminDb
              .from('projects')
              .update({ current_department_id: firstUnblockedTask.department_id })
              .eq('id', projectId);
          }
        }
      }
    }

    // Handle category updates if provided
    // For /admin/ routes, always use 'internal' category_type
    if (body.category_ids !== undefined) {
      console.log('PUT /tasks/[taskId] - Updating categories:', body.category_ids);

      // Delete existing internal category assignments
      const { error: deleteError } = await adminDb
        .from('project_task_category_assignments')
        .delete()
        .eq('task_id', taskId)
        .eq('category_type', 'internal');

      if (deleteError) {
        console.error('Error deleting existing task categories:', deleteError);
      }

      // Insert new category assignments if any
      if (Array.isArray(body.category_ids) && body.category_ids.length > 0) {
        const categoryAssignments = body.category_ids.map((categoryId: string) => ({
          task_id: taskId,
          category_id: categoryId,
          category_type: 'internal', // Admin routes always use internal categories
        }));

        console.log('PUT /tasks/[taskId] - Inserting category assignments:', categoryAssignments);

        const { error: categoryError } = await adminDb
          .from('project_task_category_assignments')
          .insert(categoryAssignments);

        if (categoryError) {
          console.error('Error updating task categories:', categoryError);
          // Don't fail the whole request, just log the error
        } else {
          console.log('PUT /tasks/[taskId] - Categories updated successfully');
        }
      }
    }

    // Fetch task with categories
    const { data: taskWithCategories } = await adminDb
      .from('project_tasks')
      .select(
        `
        *,
        assigned_to_profile:profiles!project_tasks_assigned_to_fkey(id, first_name, last_name, email, avatar_url),
        created_by_profile:profiles!project_tasks_created_by_fkey(id, first_name, last_name, email, avatar_url),
        blocking_task:blocks_task_id(id, title, is_completed, assigned_to, due_date),
        blocked_by_task:blocked_by_task_id(id, title, is_completed, assigned_to, due_date),
        project_task_category_assignments(
          category_type,
          category:project_categories(id, name)
        )
      `
      )
      .eq('id', taskId)
      .single();

    // Flatten categories with category_type
    // For /admin/ routes, filter to only include internal categories
    const categories = taskWithCategories?.project_task_category_assignments
      ?.filter((assignment: any) => assignment.category_type === 'internal')
      .map((assignment: any) => ({
        ...assignment.category,
        category_type: assignment.category_type,
      }))
      .filter((category: any) => category !== null) || [];

    const { project_task_category_assignments, ...taskData } = taskWithCategories || task;

    return NextResponse.json({ ...taskData, categories });
  } catch (error) {
    console.error('Error in PUT /api/admin/projects/[id]/tasks/[taskId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/projects/[id]/tasks/[taskId] - Partially update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  // PATCH uses the same logic as PUT for task updates
  return PUT(request, { params });
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
    const adminAuthorized = await isAuthorizedAdminOrPM(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminDb = createAdminClient();

    // Delete task (cascades to subtasks and comments)
    const { error } = await adminDb
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
