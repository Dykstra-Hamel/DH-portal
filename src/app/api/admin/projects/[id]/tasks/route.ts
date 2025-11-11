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

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Check admin authorization
    const adminAuthorized = await isAuthorizedAdmin(supabase, profile);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assigned_to');
    const milestone = searchParams.get('milestone');
    const sprint = searchParams.get('sprint');
    const parentTaskId = searchParams.get('parent_task_id');

    // Build query
    let query = supabase
      .from('project_tasks')
      .select(
        `
        *,
        assigned_to_profile:profiles!project_tasks_assigned_to_fkey(id, first_name, last_name, email),
        created_by_profile:profiles!project_tasks_created_by_fkey(id, first_name, last_name, email)
      `
      )
      .eq('project_id', projectId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (assignedTo) query = query.eq('assigned_to', assignedTo);
    if (milestone) query = query.eq('milestone', milestone);
    if (sprint) query = query.eq('sprint', sprint);
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

    return NextResponse.json(tasks || []);
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

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Check admin authorization
    const adminAuthorized = await isAuthorizedAdmin(supabase, profile);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Process labels if provided as comma-separated string
    let labels = body.labels;
    if (typeof labels === 'string' && labels.trim()) {
      labels = labels
        .split(',')
        .map((l: string) => l.trim())
        .filter((l: string) => l.length > 0);
    } else if (!Array.isArray(labels)) {
      labels = null;
    }

    // Prepare task data
    const taskData = {
      project_id: projectId,
      parent_task_id: body.parent_task_id || null,
      title: body.title,
      description: body.description || null,
      notes: body.notes || null,
      status: body.status || 'todo',
      priority: body.priority || 'medium',
      assigned_to: body.assigned_to || null,
      created_by: user.id,
      due_date: body.due_date || null,
      start_date: body.start_date || null,
      estimated_hours: body.estimated_hours
        ? parseFloat(body.estimated_hours)
        : null,
      labels,
      milestone: body.milestone || null,
      sprint: body.sprint || null,
      story_points: body.story_points ? parseInt(body.story_points, 10) : null,
      display_order: body.display_order || 0,
      kanban_column: body.kanban_column || body.status || 'todo',
    };

    // Insert task
    const { data: task, error } = await supabase
      .from('project_tasks')
      .insert(taskData)
      .select(
        `
        *,
        assigned_to_profile:profiles!project_tasks_assigned_to_fkey(id, first_name, last_name, email),
        created_by_profile:profiles!project_tasks_created_by_fkey(id, first_name, last_name, email)
      `
      )
      .single();

    if (error) {
      console.error('Error creating task:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/projects/[id]/tasks:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
