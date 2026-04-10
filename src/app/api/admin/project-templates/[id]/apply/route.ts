import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin, isAuthorizedAdminOrPM } from '@/lib/auth-helpers';
import { projectTypeOptions } from '@/types/project';
import { sendProjectCreatedNotification as sendEmail } from '@/lib/email/project-notifications';
import {
  EmailRecipient,
  ProjectNotificationData as EmailProjectData,
} from '@/lib/email/types';
import { ProjectNotificationData as SlackProjectData } from '@/lib/slack/types';

// POST /api/admin/project-templates/[id]/apply - Apply template to create project with tasks
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: templateId } = await params;
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

    // Parse request body (project-specific data)
    const body = await request.json();

    // Validate required fields for project creation
    if (!body.name || !body.company_id || !body.requested_by) {
      return NextResponse.json(
        { error: 'Project name, company, and requester are required' },
        { status: 400 }
      );
    }

    // Fetch template with tasks, categories, and default members
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
        categories:project_template_category_assignments(
          id,
          category_id
        ),
        default_members:project_template_members(
          id,
          user_id
        )
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

    const templateTypeCode =
      projectTypeOptions.find((option) => option.value === template.project_type)?.code || null;

    if (templateTypeCode) {
      const { data: shortCodeSetting, error: shortCodeError } = await supabase
        .from('company_settings')
        .select('setting_value')
        .eq('company_id', body.company_id)
        .eq('setting_key', 'short_code')
        .maybeSingle();

      if (shortCodeError) {
        console.error('Error fetching short code:', shortCodeError);
      }

      if (!shortCodeSetting?.setting_value) {
        return NextResponse.json(
          { error: 'Company must have a short code before creating projects with type codes. Please add one in Company Settings.' },
          { status: 400 }
        );
      }
    }

    // Calculate due date based on template offset
    const projectStartDate = body.start_date ? new Date(body.start_date) : new Date();
    let calculatedDueDate = null;
    if (template.default_due_date_offset_days !== null) {
      const dueDate = new Date(projectStartDate);
      dueDate.setDate(dueDate.getDate() + template.default_due_date_offset_days);
      calculatedDueDate = dueDate.toISOString().split('T')[0];
    }

    // Merge template data with provided project data
    const projectData = {
      name: body.name,
      description: body.description || template.description || null,
      project_type: template.project_type,
      project_subtype: template.project_subtype,
      type_code: templateTypeCode,
      company_id: body.company_id,
      requested_by: body.requested_by,
      assigned_to: body.assigned_to || template.default_assigned_to || null,
      status: body.status || 'new',
      priority: body.priority || 'medium',
      due_date: body.due_date || calculatedDueDate || null,
      start_date: body.start_date || null,
      is_billable:
        body.is_billable === 'true' ||
        body.is_billable === true ||
        (body.is_billable === undefined || body.is_billable === null
          ? template.default_is_billable ?? false
          : false),
      quoted_price: body.quoted_price || null,
      tags: body.tags || template.template_data?.tags || null,
      notes: body.notes || template.notes || null,
      scope: template.default_scope || 'internal',
      current_department_id: template.initial_department_id || null,
    };

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (projectError) {
      console.error('Error creating project from template:', projectError);
      return NextResponse.json(
        { error: projectError.message },
        { status: 500 }
      );
    }

    // Copy category assignments from template to project
    if (template.categories && template.categories.length > 0) {
      const categoryAssignments = template.categories.map((cat: any) => ({
        project_id: project.id,
        category_id: cat.category_id,
        category_type: 'internal', // Default to internal, can be adjusted based on template
      }));

      const { error: categoryError } = await supabase
        .from('project_category_assignments')
        .insert(categoryAssignments);

      if (categoryError) {
        console.error('Error assigning categories to project:', categoryError);
        // Don't fail the whole request, just log the error
      }
    }

    // Add default members from template to project
    if (template.default_members && template.default_members.length > 0) {
      const memberInserts = template.default_members.map((m: any) => ({
        project_id: project.id,
        user_id: m.user_id,
        added_via: 'manual',
        added_by: user.id,
      }));

      const { error: memberError } = await supabase
        .from('project_members')
        .insert(memberInserts);

      if (memberError) {
        console.error('Error adding default members to project:', memberError);
        // Don't fail the whole request, just log the error
      }
    }

    // Create tasks from template if they exist (supports subtasks)
    if (template.tasks && template.tasks.length > 0) {
      const projectStartDate = body.start_date
        ? new Date(body.start_date)
        : new Date();

      const parentTemplateTasks = template.tasks.filter(
        (templateTask: any) => !templateTask.parent_task_id
      );
      const childTemplateTasks = template.tasks.filter(
        (templateTask: any) => templateTask.parent_task_id
      );
      const taskIdMap = new Map<string, string>();

      for (const templateTask of parentTemplateTasks) {
        let taskDueDate = null;
        if (templateTask.due_date_offset_days !== null) {
          const dueDate = new Date(projectStartDate);
          dueDate.setDate(dueDate.getDate() + templateTask.due_date_offset_days);
          taskDueDate = dueDate.toISOString().split('T')[0];
        }

        const { data: createdTask, error: createError } = await supabase
          .from('project_tasks')
          .insert({
            project_id: project.id,
            title: templateTask.title,
            description: templateTask.description,
            priority: templateTask.priority,
            due_date: taskDueDate,
            start_date: body.start_date || null,
            display_order: templateTask.display_order,
            created_by: user.id,
            assigned_to: templateTask.default_assigned_to || body.assigned_to || null,
            is_completed: false,
            progress_percentage: 0,
            parent_task_id: null,
            department_id: templateTask.department_id || null,
          })
          .select('id')
          .single();

        if (createError || !createdTask) {
          console.error('Error creating parent task from template:', createError);
        } else {
          taskIdMap.set(templateTask.id, createdTask.id);
        }
      }

      if (childTemplateTasks.length > 0) {
        for (const templateTask of childTemplateTasks) {
          let taskDueDate = null;
          if (templateTask.due_date_offset_days !== null) {
            const dueDate = new Date(projectStartDate);
            dueDate.setDate(dueDate.getDate() + templateTask.due_date_offset_days);
            taskDueDate = dueDate.toISOString().split('T')[0];
          }

          const { data: createdTask, error: createError } = await supabase
            .from('project_tasks')
            .insert({
              project_id: project.id,
              title: templateTask.title,
              description: templateTask.description,
              priority: templateTask.priority,
              due_date: taskDueDate,
              start_date: body.start_date || null,
              display_order: templateTask.display_order,
              created_by: user.id,
              assigned_to: templateTask.default_assigned_to || body.assigned_to || null,
              is_completed: false,
              progress_percentage: 0,
              parent_task_id: templateTask.parent_task_id
                ? taskIdMap.get(templateTask.parent_task_id) || null
                : null,
              department_id: templateTask.department_id || null,
            })
            .select('id')
            .single();

          if (createError || !createdTask) {
            console.error('Error creating child task from template:', createError);
          } else {
            taskIdMap.set(templateTask.id, createdTask.id);
          }
        }
      }

      // Third pass: Update task dependencies now that all tasks exist
      for (const templateTask of template.tasks) {
        const projectTaskId = taskIdMap.get(templateTask.id);
        if (!projectTaskId) continue;

        const dependencyUpdates: any = {};
        let needsUpdate = false;

        if (templateTask.blocks_task_id) {
          const blocksProjectTaskId = taskIdMap.get(templateTask.blocks_task_id);
          if (blocksProjectTaskId) {
            dependencyUpdates.blocks_task_id = blocksProjectTaskId;
            needsUpdate = true;
          }
        }

        if (templateTask.blocked_by_task_id) {
          const blockedByProjectTaskId = taskIdMap.get(templateTask.blocked_by_task_id);
          if (blockedByProjectTaskId) {
            dependencyUpdates.blocked_by_task_id = blockedByProjectTaskId;
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from('project_tasks')
            .update(dependencyUpdates)
            .eq('id', projectTaskId);

          if (updateError) {
            console.error('Error updating task dependencies:', updateError);
            // Don't fail the whole request, just log the error
          }
        }
      }

      // Fourth pass: Copy task category assignments
      for (const templateTask of template.tasks) {
        const projectTaskId = taskIdMap.get(templateTask.id);
        if (!projectTaskId) continue;

        if (
          templateTask.categories &&
          Array.isArray(templateTask.categories) &&
          templateTask.categories.length > 0
        ) {
          const firstCategoryId = templateTask.categories[0]?.category_id;
          if (!firstCategoryId) continue;

          const { error: categoryError } = await supabase
            .from('project_task_category_assignments')
            .insert({
              task_id: projectTaskId,
              category_id: firstCategoryId,
            });

          if (categoryError) {
            console.error('Error assigning categories to project task:', categoryError);
            // Don't fail the whole request, just log the error
          }
        }
      }
    }

    // Fetch complete project with relationships
    const { data: completeProject } = await supabase
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
        assigned_to_profile:profiles!projects_assigned_to_fkey(id, first_name, last_name, email)
      `
      )
      .eq('id', project.id)
      .single();

    // Trigger notifications (fire-and-forget)
    const triggerNotifications = async () => {
      try {
        if (!completeProject) return;

        const requesterProfile = completeProject.requested_by_profile;
        const requesterName =
          `${requesterProfile?.first_name || ''} ${requesterProfile?.last_name || ''}`.trim() ||
          'Unknown';
        const requesterEmail = requesterProfile?.email || 'unknown@example.com';

        // Get assigned user info if project is assigned
        const assignedProfile = completeProject.assigned_to_profile;
        const assignedToName = assignedProfile
          ? `${assignedProfile.first_name || ''} ${assignedProfile.last_name || ''}`.trim()
          : undefined;
        const assignedToEmail = assignedProfile?.email;

        // Prepare notification data
        const emailData: EmailProjectData = {
          projectId: completeProject.id,
          projectName: completeProject.name,
          projectType: completeProject.project_type,
          description: completeProject.description,
          dueDate: completeProject.due_date,
          priority: completeProject.priority,
          requesterName,
          requesterEmail,
          companyName: completeProject.company?.name || 'Unknown Company',
        };

        const slackData: SlackProjectData = {
          id: completeProject.id,
          projectId: completeProject.id,
          projectName: completeProject.name,
          projectType: completeProject.project_type,
          description: completeProject.description,
          dueDate: completeProject.due_date,
          priority: completeProject.priority as 'low' | 'medium' | 'high' | 'urgent',
          status: completeProject.status,
          requesterName,
          requesterEmail,
          companyName: completeProject.company?.name || 'Unknown Company',
          assignedToName,
          assignedToEmail,
          timestamp: new Date().toISOString(),
          actionUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin/project-management/${completeProject.id}`,
        };

        // Send email notification to assigned user (if assigned)
        let emailPromise: Promise<any> = Promise.resolve();
        if (assignedToEmail && assignedToName) {
          const assignedRecipient: EmailRecipient = {
            email: assignedToEmail,
            name: assignedToName,
          };
          emailPromise = sendEmail(assignedRecipient, emailData).catch(error =>
            console.error('Failed to send email notification:', error)
          );
        }

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

    return NextResponse.json(completeProject, { status: 201 });
  } catch (error) {
    console.error(
      'Error in POST /api/admin/project-templates/[id]/apply:',
      error
    );
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
