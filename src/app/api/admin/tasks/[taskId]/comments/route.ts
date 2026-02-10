import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';
import { STORAGE_CONFIG } from '@/lib/storage-utils';

// GET /api/admin/tasks/[taskId]/comments - List all comments for a task
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

    // Fetch comments with attachments
    const { data: comments, error } = await supabase
      .from('project_task_comments')
      .select(
        `
        *,
        user_profile:profiles(id, first_name, last_name, email, avatar_url),
        attachments:comment_attachments(id, file_path, file_name, file_size, mime_type, created_at)
      `
      )
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Add public URLs to attachments
    const commentsWithUrls = (comments || []).map((comment) => ({
      ...comment,
      attachments: (comment.attachments || []).map((attachment: { file_path: string; id: string; file_name: string; file_size: number; mime_type: string; created_at: string }) => {
        const { data: urlData } = supabase.storage
          .from(STORAGE_CONFIG.BUCKET_NAME)
          .getPublicUrl(attachment.file_path);
        return {
          ...attachment,
          url: urlData.publicUrl,
        };
      }),
    }));

    return NextResponse.json(commentsWithUrls);
  } catch (error) {
    console.error('Error in GET /api/admin/tasks/[taskId]/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/tasks/[taskId]/comments - Create a new comment
export async function POST(
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

    if (!body.comment || !body.comment.trim()) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    // Verify task exists
    const { data: task, error: taskError } = await supabase
      .from('project_tasks')
      .select('id, title, project_id, monthly_service_id')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      console.error('Error fetching task:', taskError);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from('project_task_comments')
      .insert({
        task_id: taskId,
        user_id: user.id,
        comment: body.comment,
      })
      .select(
        `
        *,
        user_profile:profiles(id, first_name, last_name, email, avatar_url)
      `
      )
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log task activity for the comment
    await supabase.from('project_task_activity').insert({
      task_id: taskId,
      user_id: user.id,
      action_type: 'comment_added',
      new_value: comment.id,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/tasks/[taskId]/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
