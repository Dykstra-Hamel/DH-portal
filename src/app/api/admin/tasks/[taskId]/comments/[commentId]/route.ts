import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';
import { sendMentionSlackNotifications, sendEditedCommentSlackNotifications } from '@/lib/slack/mention-notifications';

function extractMentionedUserIds(html: string): string[] {
  const mentionRegex = /<span[^>]*data-type=["']mention["'][^>]*>/g;
  const idRegex = /data-id=["']([^"']+)["']/;
  const userIds: string[] = [];

  const mentions = html.match(mentionRegex) || [];
  for (const mention of mentions) {
    const idMatch = mention.match(idRegex);
    if (idMatch && idMatch[1] && !userIds.includes(idMatch[1])) {
      userIds.push(idMatch[1]);
    }
  }

  return userIds;
}

// PATCH /api/admin/tasks/[taskId]/comments/[commentId] - Update a comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string; commentId: string }> }
) {
  try {
    const { taskId, commentId } = await params;
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

    // Fetch original comment to verify ownership and extract original mentions
    const { data: existingComment, error: fetchError } = await supabase
      .from('project_task_comments')
      .select('id, user_id, comment')
      .eq('id', commentId)
      .single();

    if (fetchError || !existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (existingComment.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only edit your own comments' },
        { status: 403 }
      );
    }

    const originalMentions = extractMentionedUserIds(existingComment.comment);

    // Fetch task details and commenter profile in parallel
    const [{ data: task }, { data: commenterProfile }] = await Promise.all([
      supabase
        .from('project_tasks')
        .select('id, title, project_id, projects(company_id, company:companies(name))')
        .eq('id', taskId)
        .single(),
      supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single(),
    ]);

    const commenterName = commenterProfile
      ? `${commenterProfile.first_name || ''} ${commenterProfile.last_name || ''}`.trim() || 'Someone'
      : 'Someone';

    // Update comment
    const { data: comment, error } = await supabase
      .from('project_task_comments')
      .update({ comment: body.comment, updated_at: new Date().toISOString() })
      .eq('id', commentId)
      .select(
        `
        *,
        user_profile:profiles(id, first_name, last_name, email, avatar_url, uploaded_avatar_url)
      `
      )
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (task) {
      const project = (task.projects as unknown) as {
        company_id: string;
        company?: { name?: string } | null;
      } | null;
      const newMentions = extractMentionedUserIds(body.comment);
      const deepLinkUrl = task.project_id
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/admin/project-management/${task.project_id}`
        : `${process.env.NEXT_PUBLIC_SITE_URL}/admin/tasks`;

      const editTargets = originalMentions.filter(id => id !== user.id);
      const newTagTargets = newMentions.filter(id => !originalMentions.includes(id) && id !== user.id);

      if (editTargets.length > 0 && project?.company_id) {
        const editNotifications = editTargets.map(userId => ({
          user_id: userId,
          company_id: project.company_id,
          type: 'mention',
          title: `${commenterName} edited a comment you were tagged in`,
          message: `${commenterName} edited a comment you were tagged in on task "${task.title}"`,
          reference_id: commentId,
          reference_type: 'task_comment',
        }));
        supabase.from('notifications').insert(editNotifications).then(({ error: notifError }) => {
          if (notifError) console.error('Error creating edit notifications:', notifError);
        });

        sendEditedCommentSlackNotifications({
          mentionedUserIds: editTargets,
          commenterName,
          contextType: 'task',
          contextName: task.title,
          clientName: project?.company?.name || null,
          commentText: body.comment,
          deepLinkUrl,
        }).catch(() => {});
      }

      if (newTagTargets.length > 0 && project?.company_id) {
        const newTagNotifications = newTagTargets.map(userId => ({
          user_id: userId,
          company_id: project.company_id,
          type: 'mention',
          title: `${commenterName} mentioned you`,
          message: `${commenterName} mentioned you in a comment on task "${task.title}"`,
          reference_id: commentId,
          reference_type: 'task_comment',
        }));
        supabase.from('notifications').insert(newTagNotifications).then(({ error: notifError }) => {
          if (notifError) console.error('Error creating mention notifications:', notifError);
        });

        sendMentionSlackNotifications({
          mentionedUserIds: newTagTargets,
          commenterName,
          contextType: 'task',
          contextName: task.title,
          clientName: project?.company?.name || null,
          commentText: body.comment,
          deepLinkUrl,
        }).catch(() => {});
      }
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error in PATCH /api/admin/tasks/[taskId]/comments/[commentId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/tasks/[taskId]/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string; commentId: string }> }
) {
  try {
    const { taskId, commentId } = await params;
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

    // Verify the comment exists and belongs to the user
    const { data: existingComment, error: fetchError } = await supabase
      .from('project_task_comments')
      .select('id, user_id')
      .eq('id', commentId)
      .single();

    if (fetchError || !existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (existingComment.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own comments' },
        { status: 403 }
      );
    }

    // Delete comment (attachments will be cascade deleted)
    const { error } = await supabase
      .from('project_task_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('Error deleting comment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log task activity for the comment deletion
    await supabase.from('project_task_activity').insert({
      task_id: taskId,
      user_id: user.id,
      action_type: 'comment_deleted',
      old_value: commentId,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/tasks/[taskId]/comments/[commentId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
