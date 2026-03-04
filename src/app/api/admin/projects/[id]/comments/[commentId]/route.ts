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

// PATCH /api/admin/projects/[id]/comments/[commentId] - Update a comment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: projectId, commentId } = await params;
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

    const body = await request.json();
    if (!body.comment || !body.comment.trim()) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    // Fetch original comment before update
    const { data: originalComment } = await supabase
      .from('project_comments')
      .select('comment')
      .eq('id', commentId)
      .single();

    const originalMentions = originalComment ? extractMentionedUserIds(originalComment.comment) : [];

    // Fetch project and commenter profile in parallel
    const [{ data: project }, { data: commenterProfile }] = await Promise.all([
      supabase.from('projects').select('name, company_id').eq('id', projectId).single(),
      supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single(),
    ]);

    const commenterName = commenterProfile
      ? `${commenterProfile.first_name || ''} ${commenterProfile.last_name || ''}`.trim() || 'Someone'
      : 'Someone';

    const { data: updatedComment, error } = await supabase
      .from('project_comments')
      .update({ comment: body.comment })
      .eq('id', commentId)
      .eq('project_id', projectId)
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

    if (project) {
      const newMentions = extractMentionedUserIds(body.comment);
      const deepLinkUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/admin/project-management/${projectId}?commentId=${commentId}`;

      const editTargets = originalMentions.filter(id => id !== user.id);
      const newTagTargets = newMentions.filter(id => !originalMentions.includes(id) && id !== user.id);

      if (editTargets.length > 0 && project.company_id) {
        const editNotifications = editTargets.map(userId => ({
          user_id: userId,
          company_id: project.company_id,
          type: 'mention',
          title: `${commenterName} edited a comment you were tagged in`,
          message: `${commenterName} edited a comment you were tagged in on project "${project.name}"`,
          reference_id: commentId,
          reference_type: 'project_comment',
        }));
        supabase.from('notifications').insert(editNotifications).then(({ error: notifError }) => {
          if (notifError) console.error('Error creating edit notifications:', notifError);
        });

        sendEditedCommentSlackNotifications({
          mentionedUserIds: editTargets,
          commenterName,
          contextType: 'project',
          contextName: project.name,
          commentText: body.comment,
          deepLinkUrl,
        }).catch(() => {});
      }

      if (newTagTargets.length > 0 && project.company_id) {
        const newTagNotifications = newTagTargets.map(userId => ({
          user_id: userId,
          company_id: project.company_id,
          type: 'mention',
          title: `${commenterName} mentioned you`,
          message: `${commenterName} mentioned you in a comment on project "${project.name}"`,
          reference_id: commentId,
          reference_type: 'project_comment',
        }));
        supabase.from('notifications').insert(newTagNotifications).then(({ error: notifError }) => {
          if (notifError) console.error('Error creating mention notifications:', notifError);
        });

        sendMentionSlackNotifications({
          mentionedUserIds: newTagTargets,
          commenterName,
          contextType: 'project',
          contextName: project.name,
          commentText: body.comment,
          deepLinkUrl,
        }).catch(() => {});
      }
    }

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error('Error in PATCH /api/admin/projects/[id]/comments/[commentId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/projects/[id]/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: projectId, commentId } = await params;
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

    const { data, error } = await supabase
      .from('project_comments')
      .delete()
      .eq('id', commentId)
      .eq('project_id', projectId)
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
    console.error('Error in DELETE /api/admin/projects/[id]/comments/[commentId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
