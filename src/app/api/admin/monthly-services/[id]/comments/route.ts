import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin, isAuthorizedAdminOrPM } from '@/lib/auth-helpers';
import { STORAGE_CONFIG } from '@/lib/storage-utils';
import { sendMentionSlackNotifications } from '@/lib/slack/mention-notifications';

// GET /api/admin/monthly-services/[id]/comments - List all comments for a monthly service and month
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: monthlyServiceId } = await params;
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

    // Get month filter from query params (required)
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month');

    if (!month) {
      return NextResponse.json(
        { error: 'month query parameter is required (format: YYYY-MM)' },
        { status: 400 }
      );
    }

    // Fetch comments filtered by month
    const { data: comments, error } = await supabase
      .from('monthly_service_comments')
      .select(
        `
        *,
        user_profile:profiles(id, first_name, last_name, email, avatar_url)
      `
      )
      .eq('monthly_service_id', monthlyServiceId)
      .eq('comment_month', month)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching monthly service comments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch reactions separately so the query doesn't fail if the table doesn't exist yet
    const reactionsMap: Record<string, { id: string; user_id: string; emoji: string; created_at: string }[]> = {};
    const commentIds = (comments || []).map((c) => c.id);
    if (commentIds.length > 0) {
      const { data: reactions } = await supabase
        .from('comment_reactions')
        .select('id, user_id, emoji, created_at, monthly_service_comment_id')
        .in('monthly_service_comment_id', commentIds);
      (reactions || []).forEach((r: { id: string; user_id: string; emoji: string; created_at: string; monthly_service_comment_id: string }) => {
        if (!reactionsMap[r.monthly_service_comment_id]) reactionsMap[r.monthly_service_comment_id] = [];
        reactionsMap[r.monthly_service_comment_id].push({ id: r.id, user_id: r.user_id, emoji: r.emoji, created_at: r.created_at });
      });
    }

    // Fetch attachments separately for each comment
    const commentsWithAttachments = await Promise.all(
      (comments || []).map(async (comment) => {
        const { data: attachments } = await supabase
          .from('comment_attachments')
          .select('id, file_path, file_name, file_size, mime_type, created_at')
          .eq('monthly_service_comment_id', comment.id);

        // Add public URLs to attachments
        const attachmentsWithUrls = (attachments || []).map((attachment) => {
          const { data: urlData } = supabase.storage
            .from(STORAGE_CONFIG.BUCKET_NAME)
            .getPublicUrl(attachment.file_path);
          return {
            ...attachment,
            url: urlData.publicUrl,
          };
        });

        return {
          ...comment,
          attachments: attachmentsWithUrls,
          reactions: reactionsMap[comment.id] || [],
        };
      })
    );

    return NextResponse.json(commentsWithAttachments);
  } catch (error) {
    console.error('Error in GET /api/admin/monthly-services/[id]/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to extract mentioned user IDs from comment HTML
function extractMentionedUserIds(html: string): string[] {
  // Match data-id attribute in mention spans (handles any attribute order)
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

  console.log('Extracting mentions from HTML:', html);
  console.log('Found mentioned user IDs:', userIds);

  return userIds;
}

// POST /api/admin/monthly-services/[id]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: monthlyServiceId } = await params;
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

    if (!body.month) {
      return NextResponse.json(
        { error: 'month is required (format: YYYY-MM)' },
        { status: 400 }
      );
    }

    // Get monthly service details for company_id and service name
    const { data: monthlyService, error: serviceError } = await supabase
      .from('monthly_services')
      .select('id, service_name, company_id, company:companies(name)')
      .eq('id', monthlyServiceId)
      .single();

    if (serviceError || !monthlyService) {
      console.error('Error fetching monthly service:', serviceError);
      return NextResponse.json({ error: 'Monthly service not found' }, { status: 404 });
    }

    // Get commenter's profile for notification message
    const { data: commenterProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const commenterName = commenterProfile
      ? `${commenterProfile.first_name || ''} ${commenterProfile.last_name || ''}`.trim() || 'Someone'
      : 'Someone';

    // Create comment
    const { data: comment, error } = await supabase
      .from('monthly_service_comments')
      .insert({
        monthly_service_id: monthlyServiceId,
        user_id: user.id,
        comment: body.comment,
        comment_month: body.month,
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

    // Extract mentioned user IDs and create notifications
    const mentionedUserIds = extractMentionedUserIds(body.comment);

    console.log('Current user ID:', user.id);
    console.log('Monthly service company_id:', monthlyService.company_id);

    if (mentionedUserIds.length > 0 && monthlyService.company_id) {
      // Create notifications for each mentioned user (except the commenter)
      const notificationsToCreate = mentionedUserIds
        .filter(id => id !== user.id) // Don't notify yourself
        .map(mentionedUserId => ({
          user_id: mentionedUserId,
          company_id: monthlyService.company_id,
          type: 'mention',
          title: `${commenterName} mentioned you`,
          message: `${commenterName} mentioned you in a comment on monthly service "${monthlyService.service_name}"`,
          reference_id: comment.id,
          reference_type: 'monthly_service_comment',
        }));

      console.log('Notifications to create:', notificationsToCreate);

      if (notificationsToCreate.length > 0) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notificationsToCreate);

        if (notificationError) {
          // Log but don't fail the request if notifications fail
          console.error('Error creating mention notifications:', notificationError);
        } else {
          console.log('Notifications created successfully');
        }
      } else {
        console.log('No notifications to create (mentioned yourself or empty list)');
      }
    } else {
      console.log('Skipping notifications - no mentions or no company_id');
    }

    if (mentionedUserIds.length > 0) {
      const commentMonth = comment.comment_month || body.month;
      const deepLinkUrl = commentMonth
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/admin/monthly-services/${monthlyServiceId}?month=${encodeURIComponent(commentMonth)}&commentId=${comment.id}`
        : `${process.env.NEXT_PUBLIC_SITE_URL}/admin/monthly-services/${monthlyServiceId}?commentId=${comment.id}`;

      sendMentionSlackNotifications({
        mentionedUserIds,
        commenterName,
        contextType: 'monthly_service',
        contextName: monthlyService.service_name,
        clientName: (monthlyService.company as { name?: string } | null)?.name || null,
        commentText: body.comment,
        deepLinkUrl,
      }).catch(() => {});
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/monthly-services/[id]/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
