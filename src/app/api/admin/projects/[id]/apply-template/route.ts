import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';

// POST /api/admin/projects/[id]/apply-template - Apply template to existing project
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
    const adminAuthorized = await isAuthorizedAdmin(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { templateId, mergeDescription, keepExistingTasks, useTemplateDueDate, newStatus } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    // Fetch existing project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Fetch template with tasks and initial department
    const { data: template, error: templateError } = await supabase
      .from('project_templates')
      .select(
        `
        *,
        tasks:project_template_tasks(
          *,
          categories:project_template_task_category_assignments(
            id,
            category_id
          )
        ),
        initial_department:project_departments(id, name, icon)
      `
      )
      .eq('id', templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    if (!template.is_active) {
      return NextResponse.json(
        { error: 'Template is not active' },
        { status: 400 }
      );
    }

    // Prepare updated project data
    const updateData: any = {};

    // Handle description merge
    if (template.description) {
      if (mergeDescription && project.description) {
        updateData.description = `${project.description}\n\n${template.description}`;
      } else {
        updateData.description = template.description;
      }
    }

    // Update status if provided
    if (newStatus) {
      updateData.status = newStatus;
    }

    // Update due date if using template due date
    if (useTemplateDueDate && template.default_due_date_offset_days !== null) {
      const startDate = project.start_date ? new Date(project.start_date) : new Date();
      const dueDate = new Date(startDate);
      dueDate.setDate(dueDate.getDate() + template.default_due_date_offset_days);
      updateData.due_date = dueDate.toISOString().split('T')[0];
    }

    // Update other fields from template
    if (template.initial_department_id) {
      updateData.current_department_id = template.initial_department_id;
    }
    if (template.default_scope) {
      updateData.scope = template.default_scope;
    }
    if (template.notes) {
      // Always append notes if they exist
      updateData.notes = project.notes
        ? `${project.notes}\n\n${template.notes}`
        : template.notes;
    }

    // Update project with template fields
    const { error: updateError } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId);

    if (updateError) {
      console.error('Error updating project with template data:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Delete existing tasks if not keeping them
    if (!keepExistingTasks) {
      const { error: deleteTasksError } = await supabase
        .from('project_tasks')
        .delete()
        .eq('project_id', projectId);

      if (deleteTasksError) {
        console.error('Error deleting existing tasks:', deleteTasksError);
        // Don't fail the whole request, just log the error
      }
    }

    // Create tasks from template if they exist
    if (template.tasks && template.tasks.length > 0) {
      const projectStartDate = project.start_date
        ? new Date(project.start_date)
        : new Date();

      // Sort tasks by display_order to ensure parent tasks are created first
      const sortedTasks = [...template.tasks].sort(
        (a, b) => a.display_order - b.display_order
      );

      // Map to track template task ID -> project task ID
      const taskIdMap = new Map<string, string>();

      // First pass: Create all tasks without dependencies
      for (const templateTask of sortedTasks) {
        let taskDueDate = null;
        if (templateTask.due_date_offset_days !== null && project.start_date) {
          const dueDate = new Date(projectStartDate);
          dueDate.setDate(dueDate.getDate() + templateTask.due_date_offset_days);
          taskDueDate = dueDate.toISOString().split('T')[0];
        }

        const taskData: any = {
          project_id: projectId,
          title: templateTask.title,
          description: templateTask.description,
          priority: templateTask.priority,
          due_date: taskDueDate,
          start_date: project.start_date || null,
          display_order: templateTask.display_order,
          created_by: user.id,
          assigned_to: templateTask.default_assigned_to || project.assigned_to || null,
          is_completed: false,
          progress_percentage: 0,
        };

        // Map parent task ID if it exists
        if (templateTask.parent_task_id) {
          const mappedParentId = taskIdMap.get(templateTask.parent_task_id);
          if (mappedParentId) {
            taskData.parent_task_id = mappedParentId;
          }
        }

        const { data: createdTask, error: createError } = await supabase
          .from('project_tasks')
          .insert(taskData)
          .select('id')
          .single();

        if (createError || !createdTask) {
          console.error('Error creating task from template:', createError);
        } else {
          taskIdMap.set(templateTask.id, createdTask.id);
        }
      }

      // Second pass: Update task dependencies
      for (const templateTask of sortedTasks) {
        const projectTaskId = taskIdMap.get(templateTask.id);
        if (!projectTaskId) continue;

        const dependencyUpdates: any = {};
        let needsUpdate = false;

        if (templateTask.blocks_task_id) {
          const mappedBlocksId = taskIdMap.get(templateTask.blocks_task_id);
          if (mappedBlocksId) {
            dependencyUpdates.blocks_task_id = mappedBlocksId;
            needsUpdate = true;
          }
        }

        if (templateTask.blocked_by_task_id) {
          const mappedBlockedById = taskIdMap.get(templateTask.blocked_by_task_id);
          if (mappedBlockedById) {
            dependencyUpdates.blocked_by_task_id = mappedBlockedById;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          const { error: updateDepsError } = await supabase
            .from('project_tasks')
            .update(dependencyUpdates)
            .eq('id', projectTaskId);

          if (updateDepsError) {
            console.error('Error updating task dependencies:', updateDepsError);
          }
        }
      }

      // Third pass: Copy task category assignments
      for (const templateTask of sortedTasks) {
        const projectTaskId = taskIdMap.get(templateTask.id);
        if (!projectTaskId) continue;

        // Copy category assignments from template task to project task
        if (templateTask.categories && Array.isArray(templateTask.categories) && templateTask.categories.length > 0) {
          const categoryAssignments = templateTask.categories.map((cat: any) => ({
            task_id: projectTaskId,
            category_id: cat.category_id,
          }));

          const { error: categoryError } = await supabase
            .from('project_task_category_assignments')
            .insert(categoryAssignments);

          if (categoryError) {
            console.error('Error assigning categories to project task:', categoryError);
            // Don't fail the whole request, just log the error
          }
        }
      }
    }

    // Fetch updated project with relationships
    const { data: updatedProject } = await supabase
      .from('projects')
      .select(
        `
        *,
        company:companies(
          id,
          name,
          branding:brands!company_id(
            icon_logo_url
          )
        ),
        requested_by_profile:profiles!projects_requested_by_fkey(id, first_name, last_name, email),
        assigned_to_profile:profiles!projects_assigned_to_fkey(id, first_name, last_name, email),
        current_department:project_departments(id, name, icon)
      `
      )
      .eq('id', projectId)
      .single();

    return NextResponse.json(updatedProject, { status: 200 });
  } catch (error) {
    console.error(
      'Error in POST /api/admin/projects/[id]/apply-template:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
