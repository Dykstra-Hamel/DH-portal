import { SupabaseClient } from '@supabase/supabase-js';

interface TaskTemplate {
  id: string;
  title: string;
  description: string | null;
  week_of_month: number | null;
  due_day_of_week: number | null;
  default_assigned_to: string | null;
  recurrence_frequency: string | null;
  display_order: number;
}

interface GenerateTasksOptions {
  month?: string; // YYYY-MM format, defaults to current month
  createdBy?: string; // User ID who triggered generation
}

/**
 * Calculate the due date for a task based on week_of_month and due_day_of_week
 * @param year - Year (YYYY)
 * @param month - Month (1-12)
 * @param weekOfMonth - Week of month (1-4)
 * @param dayOfWeek - Day of week (0=Sunday, 6=Saturday)
 * @returns ISO date string (YYYY-MM-DD)
 */
function calculateDueDate(
  year: number,
  month: number,
  weekOfMonth: number | null,
  dayOfWeek: number | null
): string {
  // If week or day not specified, default to first day of month
  if (weekOfMonth === null || dayOfWeek === null) {
    return new Date(year, month - 1, 1).toISOString().split('T')[0];
  }

  // Find the first occurrence of the target day of week in the month
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const firstDayOfWeek = firstDayOfMonth.getDay();

  // Calculate days to add to get to first occurrence of target day
  let daysToAdd = dayOfWeek - firstDayOfWeek;
  if (daysToAdd < 0) {
    daysToAdd += 7;
  }

  // Add weeks to get to the target week
  daysToAdd += (weekOfMonth - 1) * 7;

  const dueDate = new Date(year, month - 1, 1 + daysToAdd);

  // Ensure we didn't overflow into next month
  if (dueDate.getMonth() !== month - 1) {
    // If we overflowed, use the last occurrence of that day in the month
    dueDate.setDate(dueDate.getDate() - 7);
  }

  return dueDate.toISOString().split('T')[0];
}

/**
 * Generate tasks for a monthly service for a specific month
 * @param supabase - Supabase client
 * @param serviceId - Monthly service ID
 * @param options - Generation options (month, createdBy)
 * @returns Array of created task IDs
 */
export async function generateTasksForMonth(
  supabase: SupabaseClient,
  serviceId: string,
  options: GenerateTasksOptions = {}
): Promise<string[]> {
  const { month, createdBy } = options;

  // Parse month or default to current month
  const targetMonth = month || new Date().toISOString().slice(0, 7);
  const [yearStr, monthStr] = targetMonth.split('-');
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);

  // Calculate date range for the month
  const startDate = new Date(year, monthNum - 1, 1);
  const endDate = new Date(year, monthNum, 0); // Last day of month

  // Fetch the monthly service
  const { data: service, error: serviceError } = await supabase
    .from('monthly_services')
    .select('id, company_id, is_active, status')
    .eq('id', serviceId)
    .single();

  if (serviceError || !service) {
    console.error(`[generateTasksForMonth] Service not found: ${serviceId}`, serviceError);
    return [];
  }

  if (!service.is_active || service.status !== 'active') {
    console.log(`[generateTasksForMonth] Service ${serviceId} is not active, skipping`);
    return [];
  }

  // Check if tasks already exist for this month
  const { data: existingTasks } = await supabase
    .from('project_tasks')
    .select('id')
    .eq('monthly_service_id', serviceId)
    .gte('due_date', startDate.toISOString().split('T')[0])
    .lte('due_date', endDate.toISOString().split('T')[0]);

  if (existingTasks && existingTasks.length > 0) {
    console.log(
      `[generateTasksForMonth] Tasks already exist for service ${serviceId} in ${targetMonth}, skipping`
    );
    return existingTasks.map(t => t.id);
  }

  // Fetch task templates
  const { data: templates, error: templatesError } = await supabase
    .from('monthly_service_task_templates')
    .select('*')
    .eq('monthly_service_id', serviceId)
    .order('display_order', { ascending: true });

  if (templatesError) {
    console.error(`[generateTasksForMonth] Error fetching templates:`, templatesError);
    return [];
  }

  if (!templates || templates.length === 0) {
    console.log(`[generateTasksForMonth] No templates found for service ${serviceId}`);
    return [];
  }

  // Generate tasks from templates
  const tasksToCreate = templates.map((template: TaskTemplate) => {
    const dueDate = calculateDueDate(year, monthNum, template.week_of_month, template.due_day_of_week);

    return {
      monthly_service_id: serviceId,
      project_id: null, // Monthly service tasks are not tied to a specific project
      title: template.title,
      description: template.description,
      assigned_to: template.default_assigned_to,
      due_date: dueDate,
      priority: 'medium',
      is_completed: false,
      progress_percentage: 0,
      created_by: createdBy || null,
    };
  });

  // Insert tasks
  const { data: createdTasks, error: insertError } = await supabase
    .from('project_tasks')
    .insert(tasksToCreate)
    .select('id');

  if (insertError) {
    console.error(`[generateTasksForMonth] Error creating tasks:`, insertError);
    return [];
  }

  console.log(
    `[generateTasksForMonth] Created ${createdTasks?.length || 0} tasks for service ${serviceId} in ${targetMonth}`
  );

  return createdTasks?.map(t => t.id) || [];
}

/**
 * Generate tasks for all active monthly services for a specific month
 * @param supabase - Supabase client
 * @param options - Generation options (month)
 * @returns Summary of generation results
 */
export async function generateTasksForAllServices(
  supabase: SupabaseClient,
  options: GenerateTasksOptions = {}
): Promise<{ servicesProcessed: number; tasksCreated: number; errors: string[] }> {
  const { month } = options;
  const targetMonth = month || new Date().toISOString().slice(0, 7);

  // Fetch all active monthly services
  const { data: services, error: servicesError } = await supabase
    .from('monthly_services')
    .select('id, service_name')
    .eq('is_active', true)
    .eq('status', 'active');

  if (servicesError) {
    console.error('[generateTasksForAllServices] Error fetching services:', servicesError);
    return { servicesProcessed: 0, tasksCreated: 0, errors: [servicesError.message] };
  }

  if (!services || services.length === 0) {
    console.log('[generateTasksForAllServices] No active services found');
    return { servicesProcessed: 0, tasksCreated: 0, errors: [] };
  }

  console.log(
    `[generateTasksForAllServices] Processing ${services.length} active services for ${targetMonth}`
  );

  let totalTasksCreated = 0;
  const errors: string[] = [];

  // Process each service
  for (const service of services) {
    try {
      const taskIds = await generateTasksForMonth(supabase, service.id, { month: targetMonth });
      totalTasksCreated += taskIds.length;
    } catch (error) {
      const errorMsg = `Failed to generate tasks for service ${service.service_name} (${service.id}): ${error}`;
      console.error('[generateTasksForAllServices]', errorMsg);
      errors.push(errorMsg);
    }
  }

  console.log(
    `[generateTasksForAllServices] Completed: ${services.length} services processed, ${totalTasksCreated} tasks created, ${errors.length} errors`
  );

  return {
    servicesProcessed: services.length,
    tasksCreated: totalTasksCreated,
    errors,
  };
}
