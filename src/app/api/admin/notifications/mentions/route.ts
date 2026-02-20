import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

interface MentionNotificationRow {
  id: string;
  title: string | null;
  message: string | null;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
  read: boolean;
}

interface MentionItem {
  notificationId: string;
  createdAt: string;
  read: boolean;
  title: string;
  message: string;
  referenceId: string;
  referenceType: string;
  commentText: string;
  projectId: string | null;
  projectName: string | null;
  projectShortcode: string | null;
  taskId: string | null;
  taskTitle: string | null;
  monthlyServiceId: string | null;
  monthlyServiceName: string | null;
  senderFirstName: string | null;
  senderLastName: string | null;
  senderEmail: string | null;
  senderAvatarUrl: string | null;
  companyName: string | null;
  companyIconUrl: string | null;
  hasAttachments: boolean;
}

const stripHtml = (value?: string | null): string => {
  if (!value) return '';

  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
};

const getCompanyIconUrl = (branding: any): string | null => {
  if (Array.isArray(branding)) {
    return branding[0]?.icon_logo_url || null;
  }

  return branding?.icon_logo_url || null;
};

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') !== 'false';
    const parsedLimit = Number.parseInt(searchParams.get('limit') || '20', 10);
    const parsedOffset = Number.parseInt(searchParams.get('offset') || '0', 10);
    const limit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 50)
      : 20;
    const offset = Number.isFinite(parsedOffset)
      ? Math.max(parsedOffset, 0)
      : 0;

    let query = supabase
      .from('notifications')
      .select('id, title, message, reference_id, reference_type, created_at, read')
      .eq('user_id', user.id)
      .eq('type', 'mention')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data: notificationRows, error: notificationsError } = await query;

    if (notificationsError) {
      console.error('Error fetching mention notifications:', notificationsError);
      return NextResponse.json({ error: 'Failed to fetch mention notifications' }, { status: 500 });
    }

    const mentionsWithLookahead = (notificationRows || []) as MentionNotificationRow[];
    const hasMore = mentionsWithLookahead.length > limit;
    const mentions = hasMore ? mentionsWithLookahead.slice(0, limit) : mentionsWithLookahead;

    if (mentions.length === 0) {
      return NextResponse.json({ mentions: [], hasMore: false });
    }

    const projectCommentIds = mentions
      .filter((item) => item.reference_type === 'project_comment' && item.reference_id)
      .map((item) => item.reference_id as string);

    const taskCommentIds = mentions
      .filter((item) => item.reference_type === 'task_comment' && item.reference_id)
      .map((item) => item.reference_id as string);

    const monthlyServiceCommentIds = mentions
      .filter((item) => item.reference_type === 'monthly_service_comment' && item.reference_id)
      .map((item) => item.reference_id as string);

    const [projectCommentsResult, taskCommentsResult, monthlyServiceCommentsResult] = await Promise.all([
      projectCommentIds.length > 0
        ? supabase
            .from('project_comments')
            .select('id, comment, project_id, user_id')
            .in('id', projectCommentIds)
        : Promise.resolve({ data: [], error: null }),
      taskCommentIds.length > 0
        ? supabase
            .from('project_task_comments')
            .select('id, comment, task_id, user_id')
            .in('id', taskCommentIds)
        : Promise.resolve({ data: [], error: null }),
      monthlyServiceCommentIds.length > 0
        ? supabase
            .from('monthly_service_comments')
            .select('id, comment, monthly_service_id, user_id')
            .in('id', monthlyServiceCommentIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (projectCommentsResult.error || taskCommentsResult.error || monthlyServiceCommentsResult.error) {
      console.error('Error fetching mention comment records:', {
        projectError: projectCommentsResult.error,
        taskError: taskCommentsResult.error,
        monthlyError: monthlyServiceCommentsResult.error,
      });
      return NextResponse.json({ error: 'Failed to fetch mention details' }, { status: 500 });
    }

    const [
      projectCommentAttachmentsResult,
      taskCommentAttachmentsResult,
      monthlyServiceCommentAttachmentsResult,
    ] = await Promise.all([
      projectCommentIds.length > 0
        ? supabase
            .from('comment_attachments')
            .select('project_comment_id')
            .in('project_comment_id', projectCommentIds)
        : Promise.resolve({ data: [], error: null }),
      taskCommentIds.length > 0
        ? supabase
            .from('comment_attachments')
            .select('task_comment_id')
            .in('task_comment_id', taskCommentIds)
        : Promise.resolve({ data: [], error: null }),
      monthlyServiceCommentIds.length > 0
        ? supabase
            .from('comment_attachments')
            .select('monthly_service_comment_id')
            .in('monthly_service_comment_id', monthlyServiceCommentIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (
      projectCommentAttachmentsResult.error ||
      taskCommentAttachmentsResult.error ||
      monthlyServiceCommentAttachmentsResult.error
    ) {
      console.error('Error fetching mention attachments:', {
        projectAttachmentError: projectCommentAttachmentsResult.error,
        taskAttachmentError: taskCommentAttachmentsResult.error,
        monthlyAttachmentError: monthlyServiceCommentAttachmentsResult.error,
      });
      return NextResponse.json({ error: 'Failed to fetch mention attachment data' }, { status: 500 });
    }

    const senderUserIds = new Set<string>();
    (projectCommentsResult.data || []).forEach((comment) => {
      if (comment.user_id) senderUserIds.add(comment.user_id);
    });
    (taskCommentsResult.data || []).forEach((comment) => {
      if (comment.user_id) senderUserIds.add(comment.user_id);
    });
    (monthlyServiceCommentsResult.data || []).forEach((comment) => {
      if (comment.user_id) senderUserIds.add(comment.user_id);
    });

    const { data: senderProfiles, error: senderProfilesError } =
      senderUserIds.size > 0
        ? await supabase
            .from('profiles')
            .select('id, first_name, last_name, email, avatar_url')
            .in('id', Array.from(senderUserIds))
        : { data: [], error: null };

    if (senderProfilesError) {
      console.error('Error fetching mention sender profiles:', senderProfilesError);
      return NextResponse.json({ error: 'Failed to fetch mention sender profiles' }, { status: 500 });
    }

    const taskIds = (taskCommentsResult.data || [])
      .map((comment) => comment.task_id)
      .filter(Boolean);

    const projectIds = new Set<string>();
    (projectCommentsResult.data || []).forEach((comment) => {
      if (comment.project_id) {
        projectIds.add(comment.project_id);
      }
    });

    const { data: tasks, error: tasksError } =
      taskIds.length > 0
        ? await supabase
            .from('project_tasks')
            .select('id, title, project_id, is_completed')
            .in('id', taskIds)
            .neq('is_completed', true)
        : { data: [], error: null };

    if (tasksError) {
      console.error('Error fetching mention tasks:', tasksError);
      return NextResponse.json({ error: 'Failed to fetch mention tasks' }, { status: 500 });
    }

    (tasks || []).forEach((task) => {
      if (task.project_id) {
        projectIds.add(task.project_id);
      }
    });

    const monthlyServiceIds = new Set<string>();
    (monthlyServiceCommentsResult.data || []).forEach((comment) => {
      if (comment.monthly_service_id) {
        monthlyServiceIds.add(comment.monthly_service_id);
      }
    });

    const [projectsResult, monthlyServicesResult] = await Promise.all([
      projectIds.size > 0
        ? supabase
            .from('projects')
            .select(`
              id,
              name,
              shortcode,
              status,
              company:companies(
                id,
                name,
                branding:brands!company_id(
                  icon_logo_url
                )
              )
            `)
            .in('id', Array.from(projectIds))
            .neq('status', 'complete')
        : Promise.resolve({ data: [], error: null }),
      monthlyServiceIds.size > 0
        ? supabase
            .from('monthly_services')
            .select('id, service_name')
            .in('id', Array.from(monthlyServiceIds))
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (projectsResult.error || monthlyServicesResult.error) {
      console.error('Error fetching mention context:', {
        projectError: projectsResult.error,
        monthlyServiceError: monthlyServicesResult.error,
      });
      return NextResponse.json({ error: 'Failed to fetch mention context' }, { status: 500 });
    }

    const projectCommentById = new Map(
      (projectCommentsResult.data || []).map((comment) => [comment.id, comment])
    );
    const taskCommentById = new Map(
      (taskCommentsResult.data || []).map((comment) => [comment.id, comment])
    );
    const monthlyServiceCommentById = new Map(
      (monthlyServiceCommentsResult.data || []).map((comment) => [comment.id, comment])
    );
    const taskById = new Map((tasks || []).map((task) => [task.id, task]));
    const projectById = new Map((projectsResult.data || []).map((project) => [project.id, project]));
    const monthlyServiceById = new Map(
      (monthlyServicesResult.data || []).map((service) => [service.id, service])
    );
    const senderProfileById = new Map(
      (senderProfiles || []).map((profile) => [profile.id, profile])
    );
    const projectCommentsWithAttachments = new Set(
      (projectCommentAttachmentsResult.data || [])
        .map((attachment) => attachment.project_comment_id)
        .filter(Boolean)
    );
    const taskCommentsWithAttachments = new Set(
      (taskCommentAttachmentsResult.data || [])
        .map((attachment) => attachment.task_comment_id)
        .filter(Boolean)
    );
    const monthlyCommentsWithAttachments = new Set(
      (monthlyServiceCommentAttachmentsResult.data || [])
        .map((attachment) => attachment.monthly_service_comment_id)
        .filter(Boolean)
    );

    const mentionItems: MentionItem[] = mentions.map((notification) => {
      const referenceType = notification.reference_type || '';
      const referenceId = notification.reference_id || '';

      let projectId: string | null = null;
      let projectName: string | null = null;
      let projectShortcode: string | null = null;
      let taskId: string | null = null;
      let taskTitle: string | null = null;
      let monthlyServiceId: string | null = null;
      let monthlyServiceName: string | null = null;
      let commentText = '';
      let senderUserId: string | null = null;
      let companyName: string | null = null;
      let companyIconUrl: string | null = null;
      let hasAttachments = false;

      if (referenceType === 'project_comment' && referenceId) {
        const comment = projectCommentById.get(referenceId);
        projectId = comment?.project_id || null;
        senderUserId = comment?.user_id || null;
        const project = projectId ? projectById.get(projectId) : null;
        projectName = project?.name || null;
        projectShortcode = project?.shortcode || null;
        const companyRaw = project?.company;
        const company = Array.isArray(companyRaw) ? companyRaw[0] ?? null : companyRaw ?? null;
        companyName = company?.name || null;
        companyIconUrl = getCompanyIconUrl(company?.branding);
        commentText = stripHtml(comment?.comment || '');
        hasAttachments = projectCommentsWithAttachments.has(referenceId);
      }

      if (referenceType === 'task_comment' && referenceId) {
        const comment = taskCommentById.get(referenceId);
        taskId = comment?.task_id || null;
        senderUserId = comment?.user_id || null;
        const task = taskId ? taskById.get(taskId) : null;
        taskTitle = task?.title || null;
        projectId = task?.project_id || null;
        const project = projectId ? projectById.get(projectId) : null;
        projectName = project?.name || null;
        projectShortcode = project?.shortcode || null;
        const companyRaw = project?.company;
        const company = Array.isArray(companyRaw) ? companyRaw[0] ?? null : companyRaw ?? null;
        companyName = company?.name || null;
        companyIconUrl = getCompanyIconUrl(company?.branding);
        commentText = stripHtml(comment?.comment || '');
        hasAttachments = taskCommentsWithAttachments.has(referenceId);
      }

      if (referenceType === 'monthly_service_comment' && referenceId) {
        const comment = monthlyServiceCommentById.get(referenceId);
        monthlyServiceId = comment?.monthly_service_id || null;
        senderUserId = comment?.user_id || null;
        const service = monthlyServiceId ? monthlyServiceById.get(monthlyServiceId) : null;
        monthlyServiceName = service?.service_name || null;
        commentText = stripHtml(comment?.comment || '');
        hasAttachments = monthlyCommentsWithAttachments.has(referenceId);
      }

      const fallbackText = stripHtml(notification.message || '') || 'You were mentioned in a comment.';
      const senderProfile = senderUserId ? senderProfileById.get(senderUserId) : null;

      return {
        notificationId: notification.id,
        createdAt: notification.created_at,
        read: notification.read,
        title: notification.title || 'Mention',
        message: notification.message || '',
        referenceId,
        referenceType,
        commentText: commentText || fallbackText,
        projectId,
        projectName,
        projectShortcode,
        taskId,
        taskTitle,
        monthlyServiceId,
        monthlyServiceName,
        senderFirstName: senderProfile?.first_name || null,
        senderLastName: senderProfile?.last_name || null,
        senderEmail: senderProfile?.email || null,
        senderAvatarUrl: senderProfile?.avatar_url || null,
        companyName,
        companyIconUrl,
        hasAttachments,
      };
    });

    // Filter out mentions from completed projects and tasks (excluded by query)
    const filteredMentions = mentionItems.filter(item => {
      // If mention has a projectId but project not found (was completed), exclude it
      if (item.projectId && !projectById.has(item.projectId)) {
        return false;
      }
      // If mention has a taskId but task not found (was completed), exclude it
      if (item.taskId && !taskById.has(item.taskId)) {
        return false;
      }
      return true;
    });

    return NextResponse.json({ mentions: filteredMentions, hasMore });
  } catch (error) {
    console.error('Error in GET /api/admin/notifications/mentions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
