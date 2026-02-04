import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';

// GET /api/admin/project-templates/[id] - Get single template
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Fetch template with tasks, categories, and default members
    const { data: template, error } = await supabase
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
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 404 }
        );
      }
      console.error('Error fetching template:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error in GET /api/admin/project-templates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/project-templates/[id] - Update template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Validate required fields
    if (!body.initial_department_id) {
      return NextResponse.json(
        { error: 'Initial department is required' },
        { status: 400 }
      );
    }

    // Update template
    const { error: updateError } = await supabase
      .from('project_templates')
      .update({
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
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating template:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Handle tasks update if provided (supports subtasks and dependencies)
    if (body.tasks && Array.isArray(body.tasks)) {
      await supabase.from('project_template_tasks').delete().eq('template_id', id);

      if (body.tasks.length > 0) {
        const parentTasks = body.tasks.filter((task: any) => !task.parent_temp_id);
        const childTasks = body.tasks.filter((task: any) => task.parent_temp_id);
        const taskIdMap = new Map<string, string>(); // Maps temp_id -> actual UUID

        // First pass: Create all parent tasks without dependencies
        for (const [index, task] of parentTasks.entries()) {
          const { data: createdTask, error: parentError } = await supabase
            .from('project_template_tasks')
            .insert({
              template_id: id,
              title: task.title,
              description: task.description || null,
              priority: task.priority || 'medium',
              due_date_offset_days: task.due_date_offset_days || 0,
              display_order: task.display_order ?? index,
              tags: task.tags || null,
              default_assigned_to: task.default_assigned_to || null,
              parent_task_id: null,
              // Don't set dependencies yet
            })
            .select('id')
            .single();

          if (parentError || !createdTask) {
            console.error('Error updating parent template task:', parentError);
            return NextResponse.json(
              { error: 'Failed to update template tasks' },
              { status: 500 }
            );
          }

          if (task.temp_id) {
            taskIdMap.set(task.temp_id, createdTask.id);
          }

          // Handle task category assignments
          if (task.category_ids && Array.isArray(task.category_ids) && task.category_ids.length > 0) {
            const categoryAssignments = task.category_ids.map((categoryId: string) => ({
              template_task_id: createdTask.id,
              category_id: categoryId,
            }));

            const { error: categoryError } = await supabase
              .from('project_template_task_category_assignments')
              .insert(categoryAssignments);

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
                template_id: id,
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
                // Don't set dependencies yet
              })
              .select('id')
              .single();

            if (childError || !createdTask) {
              console.error('Error creating child template task:', childError);
              return NextResponse.json(
                { error: 'Failed to update template tasks' },
                { status: 500 }
              );
            }

            if (task.temp_id) {
              taskIdMap.set(task.temp_id, createdTask.id);
            }

            // Handle task category assignments
            if (task.category_ids && Array.isArray(task.category_ids) && task.category_ids.length > 0) {
              const categoryAssignments = task.category_ids.map((categoryId: string) => ({
                template_task_id: createdTask.id,
                category_id: categoryId,
              }));

              const { error: categoryError } = await supabase
                .from('project_template_task_category_assignments')
                .insert(categoryAssignments);

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
    }

    // Handle category assignments update
    if (body.category_ids !== undefined) {
      // Delete existing category assignments
      await supabase
        .from('project_template_category_assignments')
        .delete()
        .eq('template_id', id);

      // Insert new category assignments if provided
      if (Array.isArray(body.category_ids) && body.category_ids.length > 0) {
        const categoryAssignments = body.category_ids.map((categoryId: string) => ({
          template_id: id,
          category_id: categoryId,
        }));

        const { error: categoryError } = await supabase
          .from('project_template_category_assignments')
          .insert(categoryAssignments);

        if (categoryError) {
          console.error('Error updating categories for template:', categoryError);
          // Don't fail the whole request, just log the error
        }
      }
    }

    // Handle default members update
    if (body.default_member_ids !== undefined) {
      // Delete existing default members
      await supabase
        .from('project_template_members')
        .delete()
        .eq('template_id', id);

      // Insert new default members if provided
      if (Array.isArray(body.default_member_ids) && body.default_member_ids.length > 0) {
        const memberAssignments = body.default_member_ids.map((userId: string) => ({
          template_id: id,
          user_id: userId,
        }));

        const { error: memberError } = await supabase
          .from('project_template_members')
          .insert(memberAssignments);

        if (memberError) {
          console.error('Error updating default members for template:', memberError);
          // Don't fail the whole request, just log the error
        }
      }
    }

    // Fetch updated template with tasks, categories, and default members
    const { data: updatedTemplate } = await supabase
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
      .eq('id', id)
      .single();

    return NextResponse.json(updatedTemplate);
  } catch (error) {
    console.error('Error in PUT /api/admin/project-templates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/project-templates/[id] - Delete template
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Delete template (cascade will handle tasks)
    const { error } = await supabase
      .from('project_templates')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting template:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error in DELETE /api/admin/project-templates/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
