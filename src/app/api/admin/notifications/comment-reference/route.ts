import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAuthorized = await isAuthorizedAdmin(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const commentId = searchParams.get('commentId');

    if (!type || !commentId) {
      return NextResponse.json(
        { error: 'type and commentId are required' },
        { status: 400 }
      );
    }

    if (type === 'project_comment') {
      const { data: comment, error } = await supabase
        .from('project_comments')
        .select('id, project_id')
        .eq('id', commentId)
        .single();

      if (error || !comment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }

      return NextResponse.json({ projectId: comment.project_id });
    }

    if (type === 'task_comment') {
      const { data: taskComment, error } = await supabase
        .from('project_task_comments')
        .select('id, task_id')
        .eq('id', commentId)
        .single();

      if (error || !taskComment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }

      const { data: task, error: taskError } = await supabase
        .from('project_tasks')
        .select('id, project_id')
        .eq('id', taskComment.task_id)
        .single();

      if (taskError || !task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      return NextResponse.json({ projectId: task.project_id, taskId: task.id });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error resolving comment reference:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
