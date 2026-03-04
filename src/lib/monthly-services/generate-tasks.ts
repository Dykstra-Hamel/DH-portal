import { SupabaseClient } from '@supabase/supabase-js';

interface TaskTemplate {
  id: string;
  title: string;
  description: string | null;
  week_of_month: number | null;
  due_day_of_week: number | null;
  default_assigned_to: string | null;
  department_id: string | null;
  content_type: string | null;
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

  // Create department assignments and content pieces for tasks that have a department
  if (createdTasks && createdTasks.length > 0) {
    // Resolve the Content department ID once
    const { data: contentDept } = await supabase
      .from('monthly_services_departments')
      .select('id')
      .eq('name', 'Content')
      .single();
    const contentDeptId = contentDept?.id || null;

    // Query existing unlinked content pieces for this service+month (created via the calendar UI)
    const { data: existingUnlinkedPieces } = await supabase
      .from('monthly_service_content_pieces')
      .select('id, content_type')
      .eq('monthly_service_id', serviceId)
      .eq('service_month', targetMonth)
      .is('task_id', null);

    // Build a typed queue (for Pass 1) and a full ID list (for Pass 2 fallback)
    const unlinkedByType = new Map<string, string[]>();
    const allUnlinkedIds: string[] = [];
    const claimedIds = new Set<string>();

    for (const piece of existingUnlinkedPieces || []) {
      allUnlinkedIds.push(piece.id);
      if (piece.content_type) {
        const arr = unlinkedByType.get(piece.content_type) || [];
        arr.push(piece.id);
        unlinkedByType.set(piece.content_type, arr);
      }
    }

    const departmentAssignments: { task_id: string; department_id: string }[] = [];
    const pieceLinksToUpdate: { id: string; task_id: string }[] = [];
    const newContentPieces: { monthly_service_id: string; task_id: string; content_type: string | null; service_month: string }[] = [];
    const unmatchedContentTasks: { task: { id: string }; template: TaskTemplate }[] = [];

    // Build department assignments; Pass 1: typed matches for Content-dept tasks
    createdTasks.forEach((task, index) => {
      const template = templates[index];
      if (template.department_id) {
        departmentAssignments.push({
          task_id: task.id,
          department_id: template.department_id,
        });

        // For Content-department tasks, link an existing unlinked piece or create a new one
        if (contentDeptId && template.department_id === contentDeptId) {
          const contentType = template.content_type || null;
          let matched = false;

          if (contentType) {
            const available = unlinkedByType.get(contentType) || [];
            while (available.length > 0) {
              const id = available.shift()!;
              if (!claimedIds.has(id)) {
                pieceLinksToUpdate.push({ id, task_id: task.id });
                claimedIds.add(id);
                matched = true;
                break;
              }
            }
          }

          if (!matched) {
            unmatchedContentTasks.push({ task, template });
          }
        }
      }
    });

    // Pass 2: generic fallback — assign unmatched tasks to any remaining unlinked pieces
    const remainingPool = allUnlinkedIds.filter(id => !claimedIds.has(id));
    for (const { task, template } of unmatchedContentTasks) {
      if (remainingPool.length > 0) {
        const id = remainingPool.shift()!;
        pieceLinksToUpdate.push({ id, task_id: task.id });
      } else {
        // Pass 3: no unlinked piece available — create a new one
        newContentPieces.push({
          monthly_service_id: serviceId,
          task_id: task.id,
          content_type: template.content_type || null,
          service_month: targetMonth,
        });
      }
    }

    if (departmentAssignments.length > 0) {
      const { error: deptError } = await supabase
        .from('monthly_service_task_department_assignments')
        .insert(departmentAssignments);

      if (deptError) {
        console.error(`[generateTasksForMonth] Error creating department assignments:`, deptError);
        // Don't fail the whole operation, just log the error
      }
    }

    // Link existing unlinked pieces to their matched tasks
    if (pieceLinksToUpdate.length > 0) {
      await Promise.all(
        pieceLinksToUpdate.map(({ id, task_id }) =>
          supabase
            .from('monthly_service_content_pieces')
            .update({ task_id })
            .eq('id', id)
        )
      );
    }

    // Insert new pieces only for templates that had no matching unlinked piece
    let insertedNewPieces: { id: string; task_id: string }[] | null = null;
    if (newContentPieces.length > 0) {
      const { data: insertedData, error: contentError } = await supabase
        .from('monthly_service_content_pieces')
        .insert(newContentPieces)
        .select('id, task_id');

      if (contentError) {
        console.error(`[generateTasksForMonth] Error creating content pieces:`, contentError);
        // Don't fail the whole operation, just log the error
      } else {
        insertedNewPieces = insertedData as { id: string; task_id: string }[];
      }
    }

    // Pass 4: Link social media tasks to content pieces by matching week_of_month
    const { data: socialMediaDept } = await supabase
      .from('monthly_services_departments')
      .select('id')
      .ilike('name', '%social%')
      .single();
    const socialMediaDeptId = socialMediaDept?.id || null;

    if (socialMediaDeptId) {
      const weekToSocialTaskId = new Map<number, string>();
      const contentTaskIdToWeek = new Map<string, number>();

      createdTasks.forEach((task, index) => {
        const template = templates[index];
        if (template.week_of_month === null) return;
        if (template.department_id === socialMediaDeptId) {
          weekToSocialTaskId.set(template.week_of_month, task.id);
        }
        if (template.department_id === contentDeptId) {
          contentTaskIdToWeek.set(task.id, template.week_of_month);
        }
      });

      const socialUpdates: { id: string; social_media_task_id: string }[] = [];

      for (const { id, task_id } of pieceLinksToUpdate) {
        const week = contentTaskIdToWeek.get(task_id);
        if (week !== undefined) {
          const socialTaskId = weekToSocialTaskId.get(week);
          if (socialTaskId) socialUpdates.push({ id, social_media_task_id: socialTaskId });
        }
      }

      for (const piece of insertedNewPieces || []) {
        const week = contentTaskIdToWeek.get(piece.task_id);
        if (week !== undefined) {
          const socialTaskId = weekToSocialTaskId.get(week);
          if (socialTaskId) socialUpdates.push({ id: piece.id, social_media_task_id: socialTaskId });
        }
      }

      if (socialUpdates.length > 0) {
        await Promise.all(
          socialUpdates.map(({ id, social_media_task_id }) =>
            supabase
              .from('monthly_service_content_pieces')
              .update({ social_media_task_id })
              .eq('id', id)
          )
        );
      }
    }
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
