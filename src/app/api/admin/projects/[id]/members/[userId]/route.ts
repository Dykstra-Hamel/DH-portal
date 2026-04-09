import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: projectId, userId } = await params;
    const supabase = await createClient();
    const adminDb = createAdminClient();

    // Verify caller is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has assigned tasks
    const { data: tasks, error: tasksError } = await adminDb
      .from('project_tasks')
      .select('id')
      .eq('project_id', projectId)
      .eq('assigned_to', userId)
      .limit(1);

    if (tasksError) {
      return NextResponse.json({ error: tasksError.message }, { status: 400 });
    }

    if (tasks && tasks.length > 0) {
      return NextResponse.json(
        { error: 'Cannot remove member who is assigned to tasks. Unassign tasks first.' },
        { status: 400 }
      );
    }

    // Check if user is the project's assigned_to
    const { data: project, error: projectError } = await adminDb
      .from('projects')
      .select('assigned_to')
      .eq('id', projectId)
      .single();

    if (projectError) {
      return NextResponse.json({ error: projectError.message }, { status: 400 });
    }

    if (project.assigned_to === userId) {
      return NextResponse.json(
        { error: 'Cannot remove the project assignee from members. Reassign the project first.' },
        { status: 400 }
      );
    }

    // Delete member
    const { error } = await adminDb
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
