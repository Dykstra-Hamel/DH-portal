import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/admin/tasks/[taskId]/monthly-service-department - Update department assignment for monthly service task
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const supabase = await createClient();
    const { taskId } = await params;

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

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { department_id } = body;

    // Verify this is a monthly service task
    const { data: task, error: taskError } = await supabase
      .from('project_tasks')
      .select('monthly_service_id')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (!task.monthly_service_id) {
      return NextResponse.json(
        { error: 'This task is not a monthly service task' },
        { status: 400 }
      );
    }

    // Delete existing department assignments for this task
    const { error: deleteError } = await supabase
      .from('monthly_service_task_department_assignments')
      .delete()
      .eq('task_id', taskId);

    if (deleteError) {
      console.error('Error deleting existing department assignments:', deleteError);
      return NextResponse.json(
        { error: 'Failed to update department assignment' },
        { status: 500 }
      );
    }

    // If department_id is provided, create new assignment
    if (department_id) {
      const { data: assignment, error: insertError } = await supabase
        .from('monthly_service_task_department_assignments')
        .insert({
          task_id: taskId,
          department_id: department_id,
        })
        .select(
          `
          id,
          department_id,
          monthly_services_departments (
            id,
            name,
            icon
          )
        `
        )
        .single();

      if (insertError) {
        console.error('Error creating department assignment:', insertError);
        return NextResponse.json(
          { error: 'Failed to create department assignment' },
          { status: 500 }
        );
      }

      return NextResponse.json({ assignment });
    }

    // If no department_id, just return success (assignment was removed)
    return NextResponse.json({ assignment: null });
  } catch (error) {
    console.error('Error in PATCH /api/admin/tasks/[id]/monthly-service-department:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
