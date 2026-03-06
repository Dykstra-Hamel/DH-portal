import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateTasksForMonth } from '@/lib/monthly-services/generate-tasks';

// GET /api/admin/monthly-services - Fetch all monthly services with progress
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    // Fetch monthly services with company info
    const { data: services, error: servicesError } = await supabase
      .from('monthly_services')
      .select(
        `
        id,
        service_name,
        description,
        status,
        is_active,
        created_at,
        company_id,
        companies (
          id,
          name,
          logo_url,
          branding:brands!company_id(
            logo_url,
            icon_logo_url
          )
        )
      `
      )
      .eq('is_active', true);

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
    }

    services.sort((a, b) => {
      const nameA = (a.companies as any)?.name ?? '';
      const nameB = (b.companies as any)?.name ?? '';
      return nameA.localeCompare(nameB);
    });

    // For each service, fetch task templates and generated tasks for the month
    const servicesWithProgress = await Promise.all(
      (services || []).map(async service => {
        // Fetch task templates
        const { data: templates } = await supabase
          .from('monthly_service_task_templates')
          .select('*')
          .eq('monthly_service_id', service.id)
          .order('display_order', { ascending: true });

        // Calculate date range for the month
        const [year, monthNum] = month.split('-').map(Number);
        const startDate = new Date(year, monthNum - 1, 1); // Month is 0-indexed
        const endDate = new Date(year, monthNum, 0); // Day 0 = last day of previous month (which is monthNum - 1)

        // Fetch generated tasks for this service in the current month
        const { data: tasks, error: tasksError } = await supabase
          .from('project_tasks')
          .select('id, is_completed, due_date')
          .eq('monthly_service_id', service.id)
          .gte('due_date', startDate.toISOString().split('T')[0])
          .lte('due_date', endDate.toISOString().split('T')[0]);

        if (tasksError) {
          console.error(`[Monthly Services List] Error fetching tasks for service ${service.id}:`, tasksError);
        }
        console.log(`[Monthly Services List] Service ${service.id} tasks (${tasks?.length || 0}):`, tasks?.map(t => ({ id: t.id, is_completed: t.is_completed, due_date: t.due_date })));

        // Calculate progress by week
        const weekProgress = [1, 2, 3, 4].map(week => {
          const weekTemplates = (templates || []).filter(t => t.week_of_month === week);
          const weekTasks = (tasks || []).filter(t => {
            // Calculate week from due_date
            // Parse day directly from ISO date string to avoid timezone issues
            const dayOfMonth = parseInt(t.due_date.split('-')[2], 10);
            const calculatedWeek = Math.ceil(dayOfMonth / 7);
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
          };
        });

        const companies = service.companies as any;
        return {
          ...service,
          companies: {
            ...companies,
            branding: Array.isArray(companies.branding)
              ? companies.branding[0] || null
              : companies.branding,
          },
          templates: templates || [],
          weekProgress,
        };
      })
    );

    return NextResponse.json({
      services: servicesWithProgress,
      month,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/monthly-services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/monthly-services - Create new monthly service with task templates
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    if (!company_id || !service_name) {
      return NextResponse.json(
        { error: 'company_id and service_name are required' },
        { status: 400 }
      );
    }

    // Create service
    const { data: service, error: insertError } = await supabase
      .from('monthly_services')
      .insert({
        company_id,
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
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating service:', insertError);
      return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
    }

    // Create task templates if provided
    if (task_templates && Array.isArray(task_templates) && task_templates.length > 0) {
      const templatesWithServiceId = task_templates.map((template, index) => ({
        monthly_service_id: service.id,
        title: template.title,
        description: template.description || null,
        default_assigned_to: template.default_assigned_to || null,
        department_id: template.department_id || null,
        week_of_month: template.week_of_month || null,
        due_day_of_week: template.due_day_of_week !== undefined ? template.due_day_of_week : null,
        recurrence_frequency: template.recurrence_frequency || null,
        display_order: template.display_order !== undefined ? template.display_order : index,
      }));

      const { error: templatesError } = await supabase
        .from('monthly_service_task_templates')
        .insert(templatesWithServiceId);

      if (templatesError) {
        console.error('Error creating task templates:', templatesError);
        // Note: Service was created successfully, but templates failed
        return NextResponse.json(
          {
            service,
            warning: 'Service created but task templates failed',
            error: templatesError.message,
          },
          { status: 201 }
        );
      }

      // Generate tasks for the current month
      try {
        const currentMonth = new Date().toISOString().slice(0, 7);
        await generateTasksForMonth(supabase, service.id, {
          month: currentMonth,
          createdBy: user.id,
        });
      } catch (taskGenError) {
        console.error('Error generating initial tasks:', taskGenError);
        // Non-fatal - service and templates were created successfully
      }
    }

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/monthly-services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
