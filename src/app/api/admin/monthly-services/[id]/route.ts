import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/admin/monthly-services/[id] - Fetch single monthly service with templates and tasks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check if user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'project_manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get month filter from query params (default to current month)
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Fetch the monthly service with company info and budget tracking settings
    const { data: service, error: serviceError } = await supabase
      .from('monthly_services')
      .select(
        `
        id,
        service_name,
        description,
        status,
        is_active,
        track_google_ads_budget,
        default_google_ads_budget,
        track_social_media_budget,
        default_social_media_budget,
        track_lsa_budget,
        default_lsa_budget,
        created_at,
        updated_at,
        company_id,
        companies (
          id,
          name,
          logo_url
        )
      `
      )
      .eq('id', id)
      .single();

    if (serviceError || !service) {
      console.error('Error fetching service:', serviceError);
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Fetch task templates
    const { data: templates, error: templatesError } = await supabase
      .from('monthly_service_task_templates')
      .select(
        `
        id,
        title,
        description,
        week_of_month,
        due_day_of_week,
        recurrence_frequency,
        display_order,
        default_assigned_to,
        department_id,
        profiles:default_assigned_to (
          id,
          first_name,
          last_name,
          email
        ),
        monthly_services_departments:department_id (
          id,
          name,
          icon
        )
      `
      )
      .eq('monthly_service_id', id)
      .order('display_order', { ascending: true });

    if (templatesError) {
      console.error('Error fetching templates:', templatesError);
      return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
    }

    // Calculate date range for the month
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = new Date(year, monthNum - 1, 1); // Month is 0-indexed
    const endDate = new Date(year, monthNum, 0); // Day 0 = last day of previous month (which is monthNum - 1)

    // Fetch generated tasks for this service in the current month
    console.log(`[Monthly Service ${id}] Fetching tasks for month: ${month}`);
    console.log(`[Monthly Service ${id}] Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    const { data: tasks, error: tasksError } = await supabase
      .from('project_tasks')
      .select(
        `
        id,
        title,
        description,
        is_completed,
        priority,
        due_date,
        assigned_to,
        profiles:assigned_to (
          id,
          first_name,
          last_name,
          email,
          avatar_url,
          uploaded_avatar_url
        ),
        monthly_service_task_department_assignments (
          department_id,
          monthly_services_departments (
            id,
            name,
            icon
          )
        ),
        comments:project_task_comments (
          id,
          comment,
          created_at,
          updated_at,
          user_id,
          user_profile:profiles(id, first_name, last_name, email, avatar_url, uploaded_avatar_url)
        ),
        activity:project_task_activity (
          id,
          action_type,
          old_value,
          new_value,
          created_at,
          user_id,
          user_profile:profiles(id, first_name, last_name, email, avatar_url, uploaded_avatar_url)
        )
      `
      )
      .eq('monthly_service_id', id)
      .gte('due_date', startDate.toISOString().split('T')[0])
      .lte('due_date', endDate.toISOString().split('T')[0])
      .order('due_date', { ascending: true });

    if (tasksError) {
      console.error(`[Monthly Service ${id}] Error fetching tasks:`, {
        error: tasksError,
        code: tasksError.code,
        message: tasksError.message,
        details: tasksError.details,
        hint: tasksError.hint,
      });
      return NextResponse.json({
        error: 'Failed to fetch tasks',
        details: tasksError.message,
        code: tasksError.code
      }, { status: 500 });
    }

    console.log(`[Monthly Service ${id}] Tasks fetched: ${tasks?.length || 0}`);
    if (tasks && tasks.length > 0) {
      console.log(`[Monthly Service ${id}] Task due dates:`, tasks.map(t => ({ title: t.title, due_date: t.due_date })));
    }

    // Calculate hasUnreadComments for each task
    const taskIds = (tasks || []).map(t => t.id);
    let tasksWithUnreadFlags = tasks || [];

    if (taskIds.length > 0) {
      // Get all view records for current user for these tasks
      const { data: viewRecords } = await supabase
        .from('project_task_views')
        .select('task_id, last_viewed_at')
        .eq('user_id', user.id)
        .in('task_id', taskIds);

      // Create a map of task_id -> last_viewed_at
      const viewMap = new Map(
        (viewRecords || []).map(v => [v.task_id, new Date(v.last_viewed_at)])
      );

      // Add hasUnreadComments and hasUnreadMentions flags to each task
      tasksWithUnreadFlags = (tasks || []).map(task => {
        let hasUnreadComments = false;
        let hasUnreadMentions = false;

        if (task.comments && task.comments.length > 0) {
          const lastViewedAt = viewMap.get(task.id);

          if (!lastViewedAt) {
            // Never viewed - all comments are unread
            hasUnreadComments = true;
            // Check if any comment mentions the current user
            hasUnreadMentions = task.comments.some((comment: any) => {
              const html = comment.comment || '';
              return html.includes(`data-id="${user.id}"`);
            });
          } else {
            // Get unread comments (newer than last view)
            const unreadComments = task.comments.filter(
              (comment: any) => new Date(comment.created_at) > lastViewedAt
            );

            hasUnreadComments = unreadComments.length > 0;

            // Check if any unread comment mentions the current user
            hasUnreadMentions = unreadComments.some((comment: any) => {
              const html = comment.comment || '';
              return html.includes(`data-id="${user.id}"`);
            });
          }
        }

        return { ...task, hasUnreadComments, hasUnreadMentions };
      });
    }

    // Fetch budgets for the selected month
    const [budgetYear, budgetMonth] = month.split('-').map(Number);
    const { data: budgets, error: budgetsError } = await supabase
      .from('monthly_service_budgets')
      .select('*')
      .eq('monthly_service_id', id)
      .eq('year', budgetYear)
      .eq('month', budgetMonth);

    if (budgetsError) {
      console.error(`[Monthly Service ${id}] Error fetching budgets:`, budgetsError);
      // Don't fail the request if budgets fail to load
    }

    console.log(`[Monthly Service ${id}] Budgets fetched: ${budgets?.length || 0}`);

    // Calculate progress by week (use tasksWithUnreadFlags instead of tasks)
    const weekProgress = [1, 2, 3, 4].map(week => {
      const weekTemplates = (templates || []).filter(t => t.week_of_month === week);
      const weekTasks = tasksWithUnreadFlags.filter(t => {
        // Calculate week from due_date
        // Parse day directly from ISO date string to avoid timezone issues
        const dayOfMonth = parseInt(t.due_date.split('-')[2], 10);
        const calculatedWeek = Math.min(Math.ceil(dayOfMonth / 7), 4);
        return calculatedWeek === week;
      });

      const total = weekTasks.length;
      const completed = weekTasks.filter(t => t.is_completed === true).length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        week,
        completed,
        total,
        percentage,
        tasks: weekTasks,
      };
    });

    return NextResponse.json({
      service: {
        ...service,
        templates: templates || [],
        tasks: tasksWithUnreadFlags,
        weekProgress,
        budgets: budgets || [],
      },
      month,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/monthly-services/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/admin/monthly-services/[id] - Update monthly service with task templates
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Check if user is admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'project_manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const {
      company_id,
      service_name,
      description,
      status,
      is_active,
      track_google_ads_budget,
      default_google_ads_budget,
      track_social_media_budget,
      default_social_media_budget,
      track_lsa_budget,
      default_lsa_budget,
      task_templates
    } = body;

    if (!service_name) {
      return NextResponse.json(
        { error: 'service_name is required' },
        { status: 400 }
      );
    }

    // Update service
    const { data: service, error: updateError } = await supabase
      .from('monthly_services')
      .update({
        service_name,
        description,
        status: status || 'active',
        is_active: is_active !== undefined ? is_active : true,
        track_google_ads_budget: track_google_ads_budget || false,
        default_google_ads_budget: default_google_ads_budget || null,
        track_social_media_budget: track_social_media_budget || false,
        default_social_media_budget: default_social_media_budget || null,
        track_lsa_budget: track_lsa_budget || false,
        default_lsa_budget: default_lsa_budget || null,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating service:', updateError);
      return NextResponse.json({ error: 'Failed to update service' }, { status: 500 });
    }

    // Handle task templates
    if (task_templates && Array.isArray(task_templates)) {
      // Validate task templates
      for (const template of task_templates) {
        if (!template.title || !template.title.trim()) {
          return NextResponse.json(
            { error: 'All task templates must have a title' },
            { status: 400 }
          );
        }
        if (template.week_of_month === null || template.week_of_month === undefined) {
          return NextResponse.json(
            { error: 'All task templates must have a week of month' },
            { status: 400 }
          );
        }
        if (template.due_day_of_week === null || template.due_day_of_week === undefined) {
          return NextResponse.json(
            { error: 'All task templates must have a day of week' },
            { status: 400 }
          );
        }
        if (!template.department_id) {
          return NextResponse.json(
            { error: 'All task templates must have a department' },
            { status: 400 }
          );
        }
      }

      // Get existing template IDs
      const { data: existingTemplates } = await supabase
        .from('monthly_service_task_templates')
        .select('id')
        .eq('monthly_service_id', id);

      const existingIds = new Set(existingTemplates?.map(t => t.id) || []);
      const submittedIds = new Set(task_templates.filter(t => t.id && !t.id.startsWith('temp-')).map(t => t.id));

      // Delete templates that were removed
      const idsToDelete = Array.from(existingIds).filter(id => !submittedIds.has(id));
      if (idsToDelete.length > 0) {
        await supabase
          .from('monthly_service_task_templates')
          .delete()
          .in('id', idsToDelete);
      }

      // Update or insert templates
      for (const template of task_templates) {
        const templateData = {
          monthly_service_id: id,
          title: template.title,
          description: template.description || null,
          default_assigned_to: template.default_assigned_to || null,
          department_id: template.department_id,
          week_of_month: template.week_of_month,
          due_day_of_week: template.due_day_of_week,
          display_order: template.display_order !== undefined ? template.display_order : 0,
        };

        if (template.id && !template.id.startsWith('temp-')) {
          // Update existing template
          await supabase
            .from('monthly_service_task_templates')
            .update(templateData)
            .eq('id', template.id);
        } else {
          // Insert new template
          await supabase
            .from('monthly_service_task_templates')
            .insert(templateData);
        }
      }
    }

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error('Error in PUT /api/admin/monthly-services/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
