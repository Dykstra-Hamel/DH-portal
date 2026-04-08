import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { isAuthorizedAdminOrPM } from '@/lib/auth-helpers';
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

// PATCH /api/admin/projects/[id]/tasks/[taskId]/comments/[commentId] - Update a comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string; commentId: string }> }
) {
  try {
    const { id: projectId, taskId, commentId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAuthorized = await isAuthorizedAdminOrPM(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminDb = createAdminClient();

    const body = await request.json();
    if (!body.comment || !body.comment.trim()) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    // Fetch original comment and context data in parallel
    const [{ data: originalComment }, { data: task }, { data: commenterProfile }] = await Promise.all([
      adminDb.from('project_task_comments').select('comment').eq('id', commentId).single(),
      adminDb.from('project_tasks').select('id, title, projects(id, name, company_id, company:companies(name))').eq('id', taskId).single(),
      adminDb.from('profiles').select('first_name, last_name').eq('id', user.id).single(),
    ]);

    const originalMentions = originalComment ? extractMentionedUserIds(originalComment.comment) : [];

    const commenterName = commenterProfile
      ? `${commenterProfile.first_name || ''} ${commenterProfile.last_name || ''}`.trim() || 'Someone'
      : 'Someone';

    const { data: updatedComment, error } = await adminDb
      .from('project_task_comments')
      .update({ comment: body.comment })
      .eq('id', commentId)
      .eq('task_id', taskId)
      .eq('user_id', user.id)
      .select(
        `
        *,
        user_profile:profiles(id, first_name, last_name, email, avatar_url)
      `
      )
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }
      console.error('Error updating comment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (task) {
      const project = (task.projects as unknown) as {
        id: string;
        name: string;
        company_id: string;
        company?: { name?: string } | null;
      } | null;
      const newMentions = extractMentionedUserIds(body.comment);
      const deepLinkUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/project-management/${projectId}?taskId=${taskId}&commentId=${commentId}`;

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
        adminDb.from('notifications').insert(editNotifications).then(({ error: notifError }) => {
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
        adminDb.from('notifications').insert(newTagNotifications).then(({ error: notifError }) => {
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

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error('Error in PATCH /api/admin/projects/[id]/tasks/[taskId]/comments/[commentId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/projects/[id]/tasks/[taskId]/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string; commentId: string }> }
) {
  try {
    const { taskId, commentId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAuthorized = await isAuthorizedAdminOrPM(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminDb = createAdminClient();

    const { data, error } = await adminDb
      .from('project_task_comments')
      .delete()
      .eq('id', commentId)
      .eq('task_id', taskId)
      .eq('user_id', user.id)
      .select('id');

    if (error) {
      console.error('Error deleting comment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/projects/[id]/tasks/[taskId]/comments/[commentId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
