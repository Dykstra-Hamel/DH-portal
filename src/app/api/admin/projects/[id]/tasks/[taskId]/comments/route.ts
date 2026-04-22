import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { isAuthorizedAdminOrPM } from '@/lib/auth-helpers';
import { STORAGE_CONFIG } from '@/lib/storage-utils';
import { sendMentionSlackNotifications } from '@/lib/slack/mention-notifications';

// GET /api/admin/projects/[id]/tasks/[taskId]/comments - List all comments for a task
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
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
    const adminAuthorized = await isAuthorizedAdminOrPM(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminDb = createAdminClient();

    // Fetch comments with attachments
    const { data: comments, error } = await adminDb
      .from('project_task_comments')
      .select(
        `
        *,
        user_profile:profiles(id, first_name, last_name, email, avatar_url, uploaded_avatar_url),
        attachments:comment_attachments(id, file_path, file_name, file_size, mime_type, created_at)
      `
      )
      .eq('task_id', taskId)
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
        .select('id, user_id, emoji, created_at, task_comment_id')
        .in('task_comment_id', commentIds);
      (reactions || []).forEach((r: { id: string; user_id: string; emoji: string; created_at: string; task_comment_id: string }) => {
        if (!reactionsMap[r.task_comment_id]) reactionsMap[r.task_comment_id] = [];
        reactionsMap[r.task_comment_id].push({ id: r.id, user_id: r.user_id, emoji: r.emoji, created_at: r.created_at });
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
    console.error('Error in GET /api/admin/projects/[id]/tasks/[taskId]/comments:', error);
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

// POST /api/admin/projects/[id]/tasks/[taskId]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id: projectId, taskId } = await params;
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

    if (body.comment === undefined || body.comment === null) {
      return NextResponse.json(
        { error: 'Comment field is required' },
        { status: 400 }
      );
    }

    // Get task and project details for company_id and names
    const { data: task, error: taskError } = await adminDb
      .from('project_tasks')
      .select('id, title, project_id, projects(id, name, company_id, company:companies(name))')
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      console.error('Error fetching task:', taskError);
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const project = (task.projects as unknown) as {
      id: string;
      name: string;
      company_id: string;
      company?: { name?: string } | null;
    } | null;

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
      .from('project_task_comments')
      .insert({
        task_id: taskId,
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

    // Update project's updated_at timestamp if task has a project
    if (projectId) {
      await adminDb
        .from('projects')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', projectId);
    }

    // Extract mentioned user IDs and create notifications
    const mentionedUserIds = extractMentionedUserIds(body.comment);

    if (mentionedUserIds.length > 0 && project?.company_id) {
      // Create notifications for each mentioned user (except the commenter)
      const notificationsToCreate = mentionedUserIds
        .filter(id => id !== user.id) // Don't notify yourself
        .map(mentionedUserId => ({
          user_id: mentionedUserId,
          company_id: project.company_id,
          type: 'mention',
          title: `${commenterName} mentioned you`,
          message: `${commenterName} mentioned you in a comment on task "${task.title}" in project "${project.name}"`,
          reference_id: comment.id,
          reference_type: 'task_comment',
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
        contextType: 'task',
        contextName: task.title,
        clientName: project?.company?.name || null,
        commentText: body.comment,
        deepLinkUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/project-management/${projectId}?taskId=${taskId}&commentId=${comment.id}`,
      }).catch(() => {});
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/projects/[id]/tasks/[taskId]/comments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
