import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendProjectCreatedNotification as sendEmail } from '@/lib/email/project-notifications';
import {
  EmailRecipient,
  ProjectNotificationData as EmailProjectData,
} from '@/lib/email/types';
// Removed Slack notification import - now using separate endpoint
import { ProjectNotificationData as SlackProjectData } from '@/lib/slack/types';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const scope = searchParams.get('scope') || 'internal'; // internal, client, all
    const categoryId = searchParams.get('categoryId');
    const assignedTo = searchParams.get('assignedTo');
    const scopeFilter = searchParams.get('scopeFilter'); // NEW: e.g., 'internal,both' or 'external,both'
    const isBillable = searchParams.get('isBillable'); // NEW: filter by is_billable

    // Build select query - use !inner modifier on categories if filtering by category
    const categoryRelation = categoryId
      ? 'categories:project_category_assignments!inner(id, category_id, category:project_categories(id, name, description, sort_order))'
      : 'categories:project_category_assignments(id, category_id, category:project_categories(id, name, description, sort_order))';

    // First get projects with company info and category assignments
    let query = supabase
      .from('projects')
      .select(
        `
        *,
        company:companies(
          id,
          name
        ),
        ${categoryRelation}
      `
      )
      .order('created_at', { ascending: false });

    // Apply scope filter - scopeFilter takes precedence over scope param
    if (scopeFilter) {
      // New scopeFilter format: comma-separated values like 'internal,both' or 'external,both'
      const scopes = scopeFilter.split(',').map(s => s.trim());
      query = query.in('scope', scopes);
    } else if (scope === 'internal') {
      // Legacy scope param support
      query = query.in('scope', ['internal', 'both']);
    } else if (scope === 'client') {
      query = query.in('scope', ['external', 'both']);
    }
    // scope === 'all' or no filter means no scope filter

    // Apply other filters if provided
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }
    if (isBillable === 'true') {
      query = query.eq('is_billable', true);
    }

    // Apply category filter if provided
    if (categoryId) {
      query = query.eq('categories.category_id', categoryId);
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json(
        { error: 'Failed to fetch projects', details: error.message },
        { status: 500 }
      );
    }


    if (!projects || projects.length === 0) {
      return NextResponse.json([]);
    }

    const projectIds = projects.map(project => project.id);

    // Fetch comment counts per project
    const { data: projectComments, error: commentsError } = await supabase
      .from('project_comments')
      .select('project_id')
      .in('project_id', projectIds);

    if (commentsError) {
      console.error('Error fetching project comments:', commentsError);
      return NextResponse.json(
        { error: 'Failed to fetch project comments' },
        { status: 500 }
      );
    }

    const commentCounts = new Map<string, number>();
    (projectComments || []).forEach(comment => {
      commentCounts.set(
        comment.project_id,
        (commentCounts.get(comment.project_id) || 0) + 1
      );
    });

    // Fetch assigned members per project (distinct assigned_to in tasks)
    const { data: projectTasks, error: tasksError } = await supabase
      .from('project_tasks')
      .select('project_id, assigned_to')
      .in('project_id', projectIds);

    if (tasksError) {
      console.error('Error fetching project tasks:', tasksError);
      return NextResponse.json(
        { error: 'Failed to fetch project tasks' },
        { status: 500 }
      );
    }

    const memberSets = new Map<string, Set<string>>();
    (projectTasks || []).forEach(task => {
      if (!task.assigned_to) return;
      const set = memberSets.get(task.project_id) || new Set<string>();
      set.add(task.assigned_to);
      memberSets.set(task.project_id, set);
    });

    // Check for unread mention notifications for the current user
    // reference_id is the comment_id, so we need to join with project_comments to get project_id
    const { data: unreadMentions, error: mentionsError } = await supabase
      .from('notifications')
      .select('reference_id')
      .eq('user_id', user.id)
      .eq('type', 'mention')
      .eq('reference_type', 'project_comment')
      .eq('read', false);

    if (mentionsError) {
      console.error('Error fetching unread mentions:', mentionsError);
    }

    // Get comment IDs from notifications
    const commentIds = (unreadMentions || [])
      .map(mention => mention.reference_id)
      .filter(Boolean);

    // Map comment IDs to project IDs
    const projectsWithMentions = new Set<string>();
    if (commentIds.length > 0) {
      const { data: comments, error: commentsError } = await supabase
        .from('project_comments')
        .select('id, project_id')
        .in('id', commentIds);

      if (commentsError) {
        console.error('Error fetching comments for mentions:', commentsError);
      } else {
        (comments || []).forEach(comment => {
          if (projectIds.includes(comment.project_id)) {
            projectsWithMentions.add(comment.project_id);
          }
        });
      }
    }

    // Get all unique user IDs from projects
    const userIds = new Set<string>();
    projects.forEach(project => {
      if (project.requested_by) {
        userIds.add(project.requested_by);
      }
      if (project.assigned_to) {
        userIds.add(project.assigned_to);
      }
    });


    // Get profiles for these users
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url')
      .in('id', Array.from(userIds));

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json(
        {
          error: 'Failed to fetch user profiles',
          details: profilesError.message,
        },
        { status: 500 }
      );
    }


    // Create a map of user profiles for quick lookup
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

    // Enhance projects with profile data
    const enhancedProjects = projects.map(project => ({
      ...project,
      requested_by_profile: profileMap.get(project.requested_by) || null,
      assigned_to_profile: project.assigned_to
        ? profileMap.get(project.assigned_to) || null
        : null,
      comments_count: commentCounts.get(project.id) || 0,
      members_count: memberSets.get(project.id)?.size || 0,
      has_unread_mentions: projectsWithMentions.has(project.id),
    }));

    return NextResponse.json(enhancedProjects);
  } catch (error) {
    console.error('Error in projects API:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const body = await request.json();

    const {
      name,
      description,
      project_type,
      project_subtype,
      requested_by,
      company_id,
      assigned_to,
      status = 'in_progress',
      priority = 'medium',
      due_date,
      start_date,
      is_billable,
      quoted_price,
      tags,
      notes,
      primary_file_path,
      scope = 'internal', // Project scope: internal, external, or both
      category_ids = [],
      type_code, // Project type code for shortcode generation
    } = body;

    // Validate required fields
    const requiredFieldValidation = {
      name: !!name,
      project_type: !!project_type,
      requested_by: !!requested_by,
      company_id: !!company_id,
      due_date: !!due_date,
    };

    const missingFields = Object.entries(requiredFieldValidation)
      .filter(([_, value]) => !value)
      .map(([key, _]) => key);

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Missing required fields: ${missingFields.join(', ')}`,
          details: requiredFieldValidation,
        },
        { status: 400 }
      );
    }

    // Validate type_code and company short_code
    if (type_code) {
      // Validate type_code format
      const validTypeCodes = ['WEB', 'SOC', 'EML', 'PRT', 'VEH', 'DIG', 'ADS'];
      if (!validTypeCodes.includes(type_code)) {
        return NextResponse.json(
          { error: `Invalid type_code. Must be one of: ${validTypeCodes.join(', ')}` },
          { status: 400 }
        );
      }

      // Check if company has a short_code in company_settings
      const { data: shortCodeSetting, error: shortCodeError } = await supabase
        .from('company_settings')
        .select('setting_value')
        .eq('company_id', company_id)
        .eq('setting_key', 'short_code')
        .single();

      if (shortCodeError) {
        console.error('Error fetching short code:', shortCodeError);
      }

      console.log('Short code setting for company', company_id, ':', shortCodeSetting);

      if (!shortCodeSetting || !shortCodeSetting.setting_value) {
        return NextResponse.json(
          { error: 'Company must have a short code before creating projects with type codes. Please add one in Company Settings.' },
          { status: 400 }
        );
      }
    }

    // Convert tags string to array
    const tagsArray = tags
      ? (typeof tags === 'string'
          ? tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0)
          : tags)
      : [];

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name,
        description,
        project_type,
        project_subtype: project_subtype || null,
        type_code: type_code || null, // Type code for shortcode generation
        requested_by,
        company_id,
        assigned_to: assigned_to || null,
        status,
        priority,
        due_date,
        start_date: start_date || null,
        is_billable: is_billable === 'true' || is_billable === true,
        quoted_price: quoted_price ? parseFloat(quoted_price) : null,
        tags: tagsArray,
        notes,
        primary_file_path: primary_file_path || null,
        scope, // Project scope: internal, external, or both
      })
      .select(
        `
        *,
        company:companies(
          id,
          name
        )
      `
      )
      .single();

    if (error) {
      console.error('Error creating project:', error);
      return NextResponse.json(
        { error: 'Failed to create project', details: error.message },
        { status: 500 }
      );
    }

    // Manually log project creation with the authenticated user's ID
    // (The trigger can't get auth.uid() when using admin client, so we do it manually)
    try {
      await supabase.from('project_activity').insert({
        project_id: project.id,
        user_id: user.id,
        action_type: 'created',
      });
    } catch (activityError) {
      console.error('Error logging project activity:', activityError);
      // Don't fail the request if activity logging fails
    }

    // Handle category assignments if provided
    if (category_ids && Array.isArray(category_ids) && category_ids.length > 0) {
      const categoryAssignments = category_ids.map((categoryId: string) => ({
        project_id: project.id,
        category_id: categoryId,
      }));

      const { error: categoryError } = await supabase
        .from('project_category_assignments')
        .insert(categoryAssignments);

      if (categoryError) {
        console.error('Error assigning categories to project:', categoryError);
        // Don't fail the whole request, just log the error
      }
    }

    // Get profiles for the users involved in this project
    const userIds = [project.requested_by];
    if (project.assigned_to) {
      userIds.push(project.assigned_to);
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch user profiles' },
        { status: 500 }
      );
    }

    // Create profile map and enhance project
    const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
    const enhancedProject = {
      ...project,
      requested_by_profile: profileMap.get(project.requested_by) || null,
      assigned_to_profile: project.assigned_to
        ? profileMap.get(project.assigned_to) || null
        : null,
    };

    // Trigger notifications (fire-and-forget)
    const triggerNotifications = async () => {
      try {
        const requesterProfile = profileMap.get(project.requested_by);
        const requesterName =
          `${requesterProfile?.first_name || ''} ${requesterProfile?.last_name || ''}`.trim() ||
          'Unknown';
        const requesterEmail = requesterProfile?.email || 'unknown@example.com';

        // Get assigned user info if project is assigned
        const assignedProfile = project.assigned_to ? profileMap.get(project.assigned_to) : null;
        const assignedToName = assignedProfile
          ? `${assignedProfile.first_name || ''} ${assignedProfile.last_name || ''}`.trim()
          : undefined;
        const assignedToEmail = assignedProfile?.email;

        // Prepare notification data
        const emailData: EmailProjectData = {
          projectId: project.id,
          projectName: project.name,
          projectType: project.project_type,
          description: project.description,
          dueDate: project.due_date,
          priority: project.priority,
          requesterName,
          requesterEmail,
          companyName: project.company.name,
        };

        const slackData: SlackProjectData = {
          id: project.id,
          projectId: project.id,
          projectName: project.name,
          projectType: project.project_type,
          description: project.description,
          dueDate: project.due_date,
          priority: project.priority as 'low' | 'medium' | 'high' | 'urgent',
          status: project.status,
          requesterName,
          requesterEmail,
          companyName: project.company.name,
          assignedToName,
          assignedToEmail,
          timestamp: new Date().toISOString(),
          actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/project-management/${project.id}`,
        };

        // Send notifications
        const testRecipient: EmailRecipient = {
          email: 'austin@dykstrahamel.com',
          name: 'Austin',
        };

        const emailPromise = sendEmail(testRecipient, emailData).catch(error =>
          console.error('Failed to send email notification:', error)
        );

        const { sendProjectCreatedNotification } = await import(
          '@/lib/slack/project-notifications'
        );

        setImmediate(async () => {
          try {
            const result = await sendProjectCreatedNotification(slackData);
            if (!result.success) {
              console.error('Failed to send Slack notification:', result.error);
            }
          } catch (error) {
            console.error('Error in Slack notification:', error);
          }
        });

        await emailPromise;
      } catch (error) {
        console.error('Failed to send notifications:', error);
      }
    };

    // Call notifications asynchronously (don't await)
    triggerNotifications();

    return NextResponse.json(enhancedProject, { status: 201 });
  } catch (error) {
    console.error('Error in projects POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
