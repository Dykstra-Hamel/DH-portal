import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin, isAuthorizedAdminOrPM } from '@/lib/auth-helpers';

// GET /api/admin/project-templates - List all templates
export async function GET(request: NextRequest) {
  try {
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

    // Parse query params
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('is_active');
    const projectType = searchParams.get('project_type');

    let query = supabase
      .from('project_templates')
      .select(
        `
        *,
        tasks:project_template_tasks(
          *,
          categories:project_template_task_category_assignments(
            id,
            category_id,
            category:project_categories(
              id,
              name,
              description,
              sort_order
            )
          )
        ),
        categories:project_template_category_assignments(
          id,
          category_id,
          category:project_categories(
            id,
            name,
            description,
            sort_order
          )
        ),
        default_members:project_template_members(
          id,
          user_id
        ),
        initial_department:project_departments(id, name, icon)
      `
      )
      .order('name', { ascending: true });

    // Apply filters
    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (projectType) {
      query = query.eq('project_type', projectType);
    }

    const { data: templates, error } = await query;

    if (error) {
      console.error('Error fetching templates:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(templates || []);
  } catch (error) {
    console.error('Error in GET /api/admin/project-templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/project-templates - Create new template
export async function POST(request: NextRequest) {
  try {
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

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.project_type) {
      return NextResponse.json(
        { error: 'Name and project type are required' },
        { status: 400 }
      );
    }

    if (!body.initial_department_id) {
      return NextResponse.json(
        { error: 'Initial department is required' },
        { status: 400 }
      );
    }

    // Create template
    const { data: template, error: templateError } = await supabase
      .from('project_templates')
      .insert({
        name: body.name,
        description: body.description || null,
        notes: body.notes || null,
        project_type: body.project_type,
        project_subtype: body.project_subtype || null,
        is_active: body.is_active !== false,
        template_data: body.template_data || null,
        default_assigned_to: body.default_assigned_to || null,
        default_scope: body.default_scope || 'internal',
        default_due_date_offset_days: body.default_due_date_offset_days ?? 30,
        default_is_billable: body.default_is_billable === true,
        initial_department_id: body.initial_department_id,
        created_by: user.id,
      })
      .select()
      .single();

    if (templateError) {
      console.error('Error creating template:', templateError);
      return NextResponse.json(
        { error: templateError.message },
        { status: 500 }
      );
    }

    // Create template tasks if provided (supports subtasks and dependencies)
    if (body.tasks && Array.isArray(body.tasks) && body.tasks.length > 0) {
      const parentTasks = body.tasks.filter((task: any) => !task.parent_temp_id);
      const childTasks = body.tasks.filter((task: any) => task.parent_temp_id);
      const taskIdMap = new Map<string, string>(); // Maps temp_id -> actual UUID

      // First pass: Create all parent tasks without dependencies
      for (const [index, task] of parentTasks.entries()) {
        const { data: createdTask, error: parentError } = await supabase
          .from('project_template_tasks')
          .insert({
            template_id: template.id,
            title: task.title,
            description: task.description || null,
            priority: task.priority || 'medium',
            due_date_offset_days: task.due_date_offset_days || 0,
            display_order: task.display_order ?? index,
            tags: task.tags || null,
            default_assigned_to: task.default_assigned_to || null,
            parent_task_id: null,
            department_id: task.department_id || null,
            // Don't set dependencies yet
          })
          .select('id')
          .single();

        if (parentError || !createdTask) {
          console.error('Error creating parent template task:', parentError);
          await supabase.from('project_templates').delete().eq('id', template.id);
          return NextResponse.json(
            { error: 'Failed to create template tasks' },
            { status: 500 }
          );
        }

        if (task.temp_id) {
          taskIdMap.set(task.temp_id, createdTask.id);
        }

        // Handle task category assignments
        if (Array.isArray(task.category_ids) && task.category_ids.length > 0) {
          const firstCategoryId = task.category_ids[0];
          const { error: categoryError } = await supabase
            .from('project_template_task_category_assignments')
            .insert({
              template_task_id: createdTask.id,
              category_id: firstCategoryId,
            });

          if (categoryError) {
            console.error('Error assigning categories to template task:', categoryError);
            // Don't fail the whole request, just log the error
          }
        }
      }

      // Second pass: Create child tasks without dependencies
      if (childTasks.length > 0) {
        for (const [index, task] of childTasks.entries()) {
          const { data: createdTask, error: childError } = await supabase
            .from('project_template_tasks')
            .insert({
              template_id: template.id,
              title: task.title,
              description: task.description || null,
              priority: task.priority || 'medium',
              due_date_offset_days: task.due_date_offset_days || 0,
              display_order: task.display_order ?? index,
              tags: task.tags || null,
              default_assigned_to: task.default_assigned_to || null,
              parent_task_id: task.parent_temp_id
                ? taskIdMap.get(task.parent_temp_id) || null
                : null,
              department_id: task.department_id || null,
              // Don't set dependencies yet
            })
            .select('id')
            .single();

          if (childError || !createdTask) {
            console.error('Error creating child template task:', childError);
            await supabase.from('project_templates').delete().eq('id', template.id);
            return NextResponse.json(
              { error: 'Failed to create template tasks' },
              { status: 500 }
            );
          }

          if (task.temp_id) {
            taskIdMap.set(task.temp_id, createdTask.id);
          }

          // Handle task category assignments
          if (Array.isArray(task.category_ids) && task.category_ids.length > 0) {
            const firstCategoryId = task.category_ids[0];
            const { error: categoryError } = await supabase
              .from('project_template_task_category_assignments')
              .insert({
                template_task_id: createdTask.id,
                category_id: firstCategoryId,
              });

            if (categoryError) {
              console.error('Error assigning categories to child template task:', categoryError);
              // Don't fail the whole request, just log the error
            }
          }
        }
      }

      // Third pass: Update task dependencies now that all tasks exist
      for (const task of body.tasks) {
        const taskUuid = taskIdMap.get(task.temp_id);
        if (!taskUuid) continue;

        const dependencyUpdates: any = {};
        let needsUpdate = false;

        if (task.blocks_task_id) {
          const blocksUuid = taskIdMap.get(task.blocks_task_id);
          if (blocksUuid) {
            dependencyUpdates.blocks_task_id = blocksUuid;
            needsUpdate = true;
          }
        }

        if (task.blocked_by_task_id) {
          const blockedByUuid = taskIdMap.get(task.blocked_by_task_id);
          if (blockedByUuid) {
            dependencyUpdates.blocked_by_task_id = blockedByUuid;
            needsUpdate = true;
          }
        }

        // Include department_id in update if present (for tasks that were created in earlier passes)
        if (task.department_id !== undefined) {
          dependencyUpdates.department_id = task.department_id || null;
          needsUpdate = true;
        }

        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from('project_template_tasks')
            .update(dependencyUpdates)
            .eq('id', taskUuid);

          if (updateError) {
            console.error('Error updating task dependencies:', updateError);
            // Don't fail the whole request, just log the error
          }
        }
      }
    }

    // Handle category assignments if provided
    if (body.category_ids && Array.isArray(body.category_ids) && body.category_ids.length > 0) {
      const categoryAssignments = body.category_ids.map((categoryId: string) => ({
        template_id: template.id,
        category_id: categoryId,
      }));

      const { error: categoryError } = await supabase
        .from('project_template_category_assignments')
        .insert(categoryAssignments);

      if (categoryError) {
        console.error('Error assigning categories to template:', categoryError);
        // Don't fail the whole request, just log the error
      }
    }

    if (Array.isArray(body.default_member_ids) && body.default_member_ids.length > 0) {
      const memberAssignments = body.default_member_ids.map((userId: string) => ({
        template_id: template.id,
        user_id: userId,
      }));

      const { error: memberError } = await supabase
        .from('project_template_members')
        .insert(memberAssignments);

      if (memberError) {
        console.error('Error assigning default members to template:', memberError);
        // Don't fail the whole request, just log the error
      }
    }

    // Fetch complete template with tasks, categories, and default members
    const { data: completeTemplate } = await supabase
      .from('project_templates')
      .select(
        `
        *,
        tasks:project_template_tasks(
          *,
          categories:project_template_task_category_assignments(
            id,
            category_id,
            category:project_categories(
              id,
              name,
              description,
              sort_order
            )
          )
        ),
        categories:project_template_category_assignments(
          id,
          category_id,
          category:project_categories(
            id,
            name,
            description,
            sort_order
          )
        ),
        default_members:project_template_members(
          id,
          user_id
        )
      `
      )
      .eq('id', template.id)
      .single();

    return NextResponse.json(completeTemplate, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/project-templates:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
