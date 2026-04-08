import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin, isAuthorizedAdminOrPM } from '@/lib/auth-helpers';
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

// PUT /api/admin/monthly-services/[id]/comments/[commentId] - Update a comment
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: monthlyServiceId, commentId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin authorization
    const adminAuthorized = await isAuthorizedAdminOrPM(user);
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

    // Fetch original comment, monthly service details, and commenter profile in parallel
    const [{ data: originalComment }, { data: monthlyService }, { data: commenterProfile }] = await Promise.all([
      supabase.from('monthly_service_comments').select('comment').eq('id', commentId).single(),
      supabase.from('monthly_services').select('service_name, company_id, company:companies(name)').eq('id', monthlyServiceId).single(),
      supabase.from('profiles').select('first_name, last_name').eq('id', user.id).single(),
    ]);

    const originalMentions = originalComment ? extractMentionedUserIds(originalComment.comment) : [];

    const commenterName = commenterProfile
      ? `${commenterProfile.first_name || ''} ${commenterProfile.last_name || ''}`.trim() || 'Someone'
      : 'Someone';

    // Update comment (RLS policy ensures user can only update their own)
    const { data: comment, error } = await supabase
      .from('monthly_service_comments')
      .update({
        comment: body.comment,
      })
      .eq('id', commentId)
      .eq('user_id', user.id) // Ensure user owns this comment
      .select(
        `
        *,
        user_profile:profiles(id, first_name, last_name, email, avatar_url)
      `
      )
      .single();

    if (error) {
      console.error('Error updating comment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found or you do not have permission to edit it' },
        { status: 404 }
      );
    }

    if (monthlyService) {
      const newMentions = extractMentionedUserIds(body.comment);
      const commentMonth = comment.comment_month || body.month;
      const deepLinkUrl = commentMonth
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/admin/monthly-services/${monthlyServiceId}?month=${encodeURIComponent(commentMonth)}&commentId=${commentId}`
        : `${process.env.NEXT_PUBLIC_SITE_URL}/admin/monthly-services/${monthlyServiceId}?commentId=${commentId}`;

      const editTargets = originalMentions.filter(id => id !== user.id);
      const newTagTargets = newMentions.filter(id => !originalMentions.includes(id) && id !== user.id);

      if (editTargets.length > 0 && monthlyService.company_id) {
        const editNotifications = editTargets.map(userId => ({
          user_id: userId,
          company_id: monthlyService.company_id,
          type: 'mention',
          title: `${commenterName} edited a comment you were tagged in`,
          message: `${commenterName} edited a comment you were tagged in on service "${monthlyService.service_name}"`,
          reference_id: commentId,
          reference_type: 'monthly_service_comment',
        }));
        supabase.from('notifications').insert(editNotifications).then(({ error: notifError }) => {
          if (notifError) console.error('Error creating edit notifications:', notifError);
        });

        sendEditedCommentSlackNotifications({
          mentionedUserIds: editTargets,
          commenterName,
          contextType: 'monthly_service',
          contextName: monthlyService.service_name,
          clientName: (monthlyService.company as { name?: string } | null)?.name || null,
          commentText: body.comment,
          deepLinkUrl,
        }).catch(() => {});
      }

      if (newTagTargets.length > 0 && monthlyService.company_id) {
        const newTagNotifications = newTagTargets.map(userId => ({
          user_id: userId,
          company_id: monthlyService.company_id,
          type: 'mention',
          title: `${commenterName} mentioned you`,
          message: `${commenterName} mentioned you in a comment on service "${monthlyService.service_name}"`,
          reference_id: commentId,
          reference_type: 'monthly_service_comment',
        }));
        supabase.from('notifications').insert(newTagNotifications).then(({ error: notifError }) => {
          if (notifError) console.error('Error creating mention notifications:', notifError);
        });

        sendMentionSlackNotifications({
          mentionedUserIds: newTagTargets,
          commenterName,
          contextType: 'monthly_service',
          contextName: monthlyService.service_name,
          clientName: (monthlyService.company as { name?: string } | null)?.name || null,
          commentText: body.comment,
          deepLinkUrl,
        }).catch(() => {});
      }
    }

    return NextResponse.json(comment);
  } catch (error) {
    console.error('Error in PUT /api/admin/monthly-services/[id]/comments/[commentId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/monthly-services/[id]/comments/[commentId] - Delete a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin authorization
    const adminAuthorized = await isAuthorizedAdminOrPM(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete comment (RLS policy ensures user can only delete their own)
    const { error } = await supabase
      .from('monthly_service_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', user.id); // Ensure user owns this comment

    if (error) {
      console.error('Error deleting comment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/monthly-services/[id]/comments/[commentId]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
