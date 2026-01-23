import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const assignedTo = searchParams.get('assignedTo');
    const isCompleted = searchParams.get('isCompleted');
    const priority = searchParams.get('priority');
    const standaloneOnly = searchParams.get('standaloneOnly') === 'true';

    // Build query
    let query = supabase
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
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (standaloneOnly) {
      query = query.is('project_id', null);
    }

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    if (isCompleted !== null && isCompleted !== undefined) {
      query = query.eq('is_completed', isCompleted === 'true');
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching project tasks:', error);
      return NextResponse.json(
        { error: 'Failed to fetch tasks', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(tasks || []);
  } catch (error) {
    console.error('Error in project-tasks API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const body = await request.json();

    const {
      project_id = null, // Optional - tasks can exist without a project
      parent_task_id = null,
      title,
      description = null,
      notes = null,
      priority = 'medium',
      assigned_to = null,
      due_date = null,
      start_date = null,
      recurring_frequency = null,
      recurring_end_date = null,
    } = body;

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    // Create the task
    const { data: task, error } = await supabase
      .from('project_tasks')
      .insert({
        project_id: project_id || null,
        parent_task_id: parent_task_id || null,
        title,
        description,
        notes,
        priority,
        assigned_to: assigned_to || null,
        created_by: user.id,
        due_date: due_date || null,
        start_date: start_date || null,
        is_completed: false,
        progress_percentage: 0,
        display_order: 0,
        recurring_frequency: recurring_frequency || null,
        recurring_end_date: recurring_end_date || null,
        is_recurring_template: recurring_frequency ? true : false,
      })
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
      console.error('Error creating task:', error);
      return NextResponse.json(
        { error: 'Failed to create task', details: error.message },
        { status: 500 }
      );
    }

    // Log task creation activity
    try {
      await supabase.from('project_task_activity').insert({
        task_id: task.id,
        user_id: user.id,
        action_type: 'created',
      });
    } catch (activityError) {
      console.error('Error logging task activity:', activityError);
      // Don&apos;t fail the request if activity logging fails
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error in project-tasks POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
