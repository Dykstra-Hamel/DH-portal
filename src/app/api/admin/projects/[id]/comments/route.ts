import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { isAuthorizedAdminOrPM } from '@/lib/auth-helpers';
import { STORAGE_CONFIG } from '@/lib/storage-utils';
import { sendMentionSlackNotifications } from '@/lib/slack/mention-notifications';

// GET /api/admin/projects/[id]/comments - List all comments for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
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

    const adminDb = createAdminClient();

    // Fetch comments with attachments
    const { data: comments, error } = await adminDb
      .from('project_comments')
      .select(
        `
        *,
        user_profile:profiles(id, first_name, last_name, email, avatar_url, uploaded_avatar_url),
        attachments:comment_attachments!project_comment_id(id, file_path, file_name, file_size, mime_type, created_at)
      `
      )
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch reactions separately so the main query doesn't fail if the table doesn't exist yet
    const reactionsMap: Record<string, { id: string; user_id: string; emoji: string; created_at: string }[]> = {};
    const commentIds = (comments || []).map((c) => c.id);
    if (commentIds.length > 0) {
      const { data: reactions } = await adminDb
        .from('comment_reactions')
        .select('id, user_id, emoji, created_at, project_comment_id')
        .in('project_comment_id', commentIds);
      (reactions || []).forEach((r: { id: string; user_id: string; emoji: string; created_at: string; project_comment_id: string }) => {
        if (!reactionsMap[r.project_comment_id]) reactionsMap[r.project_comment_id] = [];
        reactionsMap[r.project_comment_id].push({ id: r.id, user_id: r.user_id, emoji: r.emoji, created_at: r.created_at });
      });
    }

    // Add public URLs to attachments and attach reactions
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
      reactions: reactionsMap[comment.id] || [],
    }));

    return NextResponse.json(commentsWithUrls);
  } catch (error) {
    console.error('Error in GET /api/admin/projects/[id]/comments:', error);
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

  return userIds;
}

// POST /api/admin/projects/[id]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
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

    const adminDb = createAdminClient();

    // Parse request body
    const body = await request.json();

    if (!body.comment || !body.comment.trim()) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }

    // Get project details for company_id and project name
    const { data: project, error: projectError } = await adminDb
      .from('projects')
      .select('id, name, company_id, company:companies(name)')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('Error fetching project:', projectError);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get commenter's profile for notification message
    const { data: commenterProfile } = await adminDb
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single();

    const commenterName = commenterProfile
      ? `${commenterProfile.first_name || ''} ${commenterProfile.last_name || ''}`.trim() || 'Someone'
      : 'Someone';

    // Create comment
    const { data: comment, error } = await adminDb
      .from('project_comments')
      .insert({
        project_id: projectId,
        user_id: user.id,
        comment: body.comment,
      })
      .select(
        `
        *,
        user_profile:profiles(id, first_name, last_name, email, avatar_url, uploaded_avatar_url)
      `
      )
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update project's updated_at timestamp
    await adminDb
      .from('projects')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', projectId);

    // Extract mentioned user IDs and create notifications
    const mentionedUserIds = extractMentionedUserIds(body.comment);

    if (mentionedUserIds.length > 0 && project.company_id) {
      // Create notifications for each mentioned user (except the commenter)
      const notificationsToCreate = mentionedUserIds
        .filter(id => id !== user.id) // Don't notify yourself
        .map(mentionedUserId => ({
          user_id: mentionedUserId,
          company_id: project.company_id,
          type: 'mention',
          title: `${commenterName} mentioned you`,
          message: `${commenterName} mentioned you in a comment on project "${project.name}"`,
          reference_id: comment.id,
          reference_type: 'project_comment',
        }));

      if (notificationsToCreate.length > 0) {
        const { error: notificationError } = await adminDb
          .from('notifications')
          .insert(notificationsToCreate);

        if (notificationError) {
          // Log but don't fail the request if notifications fail
          console.error('Error creating mention notifications:', notificationError);
        }
      }
    }

    if (mentionedUserIds.length > 0) {
      sendMentionSlackNotifications({
        mentionedUserIds,
        commenterName,
        contextType: 'project',
        contextName: project.name,
        clientName: (project.company as { name?: string } | null)?.name || null,
        commentText: body.comment,
        deepLinkUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/project-management/${projectId}?commentId=${comment.id}`,
      }).catch(() => {});
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/projects/[id]/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
