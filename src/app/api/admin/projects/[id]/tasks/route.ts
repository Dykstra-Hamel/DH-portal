import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';

// GET /api/admin/projects/[id]/tasks - List all tasks for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
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

    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assigned_to');
    const isCompleted = searchParams.get('is_completed');
    const parentTaskId = searchParams.get('parent_task_id');

    // Build query
    let query = supabase
      .from('project_tasks')
      .select(
        `
        *,
        assigned_to_profile:profiles!assigned_to(id, first_name, last_name, email, avatar_url),
        created_by_profile:profiles!created_by(id, first_name, last_name, email, avatar_url),
        blocking_task:blocks_task_id(id, title, is_completed, assigned_to, due_date),
        blocked_by_task:blocked_by_task_id(id, title, is_completed, assigned_to, due_date),
        project_task_category_assignments(
          category_type,
          category:project_categories(id, name)
        )
      `
      )
      .eq('project_id', projectId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Apply filters
    if (priority) query = query.eq('priority', priority);
    if (assignedTo) query = query.eq('assigned_to', assignedTo);
    if (isCompleted !== null && isCompleted !== undefined) {
      query = query.eq('is_completed', isCompleted === 'true');
    }
    if (parentTaskId) {
      if (parentTaskId === 'null') {
        query = query.is('parent_task_id', null);
      } else {
        query = query.eq('parent_task_id', parentTaskId);
      }
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform tasks to include flattened categories with category_type
    // For /admin/ routes, filter to only include internal categories
    const tasksWithCategories = (tasks || []).map((task: any) => {
      const categories = task.project_task_category_assignments
        ?.filter((assignment: any) => assignment.category_type === 'internal')
        .map((assignment: any) => ({
          ...assignment.category,
          category_type: assignment.category_type,
        }))
        .filter((category: any) => category !== null) || [];

      const { project_task_category_assignments, ...taskWithoutAssignments } = task;

      return {
        ...taskWithoutAssignments,
        categories,
      };
    });

    return NextResponse.json(tasksWithCategories);
  } catch (error) {
    console.error('Error in GET /api/admin/projects/[id]/tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/projects/[id]/tasks - Create a new task
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
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

    let displayOrder = body.display_order;

    if (displayOrder === undefined || displayOrder === null) {
      const { data: lastTask, error: lastTaskError } = await supabase
        .from('project_tasks')
        .select('display_order')
        .eq('project_id', projectId)
        .order('display_order', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastTaskError) {
        console.error('Error fetching last task display_order:', lastTaskError);
      }

      const lastOrder = typeof lastTask?.display_order === 'number' ? lastTask.display_order : -1;
      displayOrder = lastOrder + 1;
    }

    // Prepare task data
    const taskData = {
      project_id: projectId,
      parent_task_id: body.parent_task_id || null,
      title: body.title,
      description: body.description || null,
      notes: body.notes || null,
      is_completed: false, // New tasks always start as not completed
      priority: body.priority || 'medium',
      assigned_to: body.assigned_to || null,
      created_by: user.id,
      due_date: body.due_date || null,
      start_date: body.start_date || null,
      display_order: displayOrder ?? 0,
      blocks_task_id: body.blocks_task_id || null,
      blocked_by_task_id: body.blocked_by_task_id || null,
      blocker_reason: body.blocker_reason || null,
      department_id: body.department_id || null,
      recurring_frequency: body.recurring_frequency || null,
      recurring_end_date: body.recurring_end_date || null,
      is_recurring_template: body.recurring_frequency && body.recurring_frequency !== 'none' ? true : false,
      next_recurrence_date: body.recurring_frequency && body.recurring_frequency !== 'none' && body.due_date ? body.due_date : null,
    };

    // Insert task
    const { data: task, error } = await supabase
      .from('project_tasks')
      .insert(taskData)
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

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Handle category assignments if provided
    // For /admin/ routes, always use 'internal' category_type
    if (body.category_ids && Array.isArray(body.category_ids) && body.category_ids.length > 0) {
      const categoryAssignments = body.category_ids.map((categoryId: string) => ({
        task_id: task.id,
        category_id: categoryId,
        category_type: 'internal', // Admin routes always use internal categories
      }));

      const { error: categoryError } = await supabase
        .from('project_task_category_assignments')
        .insert(categoryAssignments);

      if (categoryError) {
        console.error('Error assigning categories to task:', categoryError);
        // Don't fail the whole request, just log the error
      }
    }

    // Fetch task with categories
    const { data: taskWithCategories } = await supabase
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
      .eq('id', task.id)
      .single();

    // Transform to include flattened categories with category_type
    // For /admin/ routes, filter to only include internal categories
    const categories = taskWithCategories?.project_task_category_assignments
      ?.filter((assignment: any) => assignment.category_type === 'internal')
      .map((assignment: any) => ({
        ...assignment.category,
        category_type: assignment.category_type,
      }))
      .filter((category: any) => category !== null) || [];

    const { project_task_category_assignments, ...taskData2 } = taskWithCategories || task;

    return NextResponse.json({ ...taskData2, categories }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/projects/[id]/tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
