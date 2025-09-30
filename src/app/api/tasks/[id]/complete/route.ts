import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { actual_hours } = await request.json();

    // First, fetch the existing task to verify permissions
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('id, company_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check if task is already completed
    if (existingTask.status === 'completed') {
      return NextResponse.json({ error: 'Task is already completed' }, { status: 400 });
    }

    // Check user profile to determine if they're a global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';

    // Verify user has access to this company (admins have access to all companies)
    if (!isGlobalAdmin) {
      const { data: userCompany, error: userCompanyError } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', existingTask.company_id)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this task' },
          { status: 403 }
        );
      }
    }

    // Update task status to completed and set actual hours if provided
    const updateData: any = { status: 'completed' };
    if (actual_hours !== undefined) {
      updateData.actual_hours = actual_hours;
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        assigned_user:profiles!tasks_assigned_to_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        created_user:profiles!tasks_created_by_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        company:companies!tasks_company_id_fkey(
          id,
          name
        )
      `)
      .single();

    if (error) {
      console.error('Error completing task:', error);
      return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 });
    }

    return NextResponse.json({ task, message: 'Task completed successfully' });
  } catch (error) {
    console.error('Error in task complete route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}