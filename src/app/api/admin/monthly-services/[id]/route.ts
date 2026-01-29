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

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get month filter from query params (default to current month)
    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7); // YYYY-MM format

    // Fetch the monthly service with company info
    const { data: service, error: serviceError } = await supabase
      .from('monthly_services')
      .select(
        `
        id,
        service_name,
        description,
        status,
        is_active,
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
        profiles:default_assigned_to (
          id,
          first_name,
          last_name,
          email
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
          email
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

    // Calculate progress by week
    const weekProgress = [1, 2, 3, 4].map(week => {
      const weekTemplates = (templates || []).filter(t => t.week_of_month === week);
      const weekTasks = (tasks || []).filter(t => {
        // Calculate week from due_date
        const taskDate = new Date(t.due_date);
        const dayOfMonth = taskDate.getDate();
        const calculatedWeek = Math.ceil(dayOfMonth / 7);
        return calculatedWeek === week;
      });

      const total = weekTemplates.length;
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
        weekProgress,
      },
      month,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/monthly-services/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
