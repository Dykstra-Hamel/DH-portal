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

    // Fetch template with tasks and categories
    const { data: template, error } = await supabase
      .from('project_templates')
      .select(
        `
        *,
        tasks:project_template_tasks(*),
        categories:project_template_category_assignments(
          id,
          category_id,
          category:project_categories(
            id,
            name,
            description,
            sort_order
          )
        )
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

    // Update template
    const { error: updateError } = await supabase
      .from('project_templates')
      .update({
        name: body.name,
        description: body.description || null,
        project_type: body.project_type,
        project_subtype: body.project_subtype || null,
        is_active: body.is_active !== false,
        template_data: body.template_data || null,
        default_assigned_to: body.default_assigned_to || null,
        default_scope: body.default_scope || 'internal',
        default_due_date_offset_days: body.default_due_date_offset_days ?? 30,
        default_is_billable: body.default_is_billable === true,
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error updating template:', updateError);
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      );
    }

    // Handle tasks update if provided (supports subtasks)
    if (body.tasks && Array.isArray(body.tasks)) {
      await supabase.from('project_template_tasks').delete().eq('template_id', id);

      if (body.tasks.length > 0) {
        const parentTasks = body.tasks.filter((task: any) => !task.parent_temp_id);
        const childTasks = body.tasks.filter((task: any) => task.parent_temp_id);
        const parentIdMap = new Map<string, string>();

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
            parentIdMap.set(task.temp_id, createdTask.id);
          }
        }

        if (childTasks.length > 0) {
          const tasksToInsert = childTasks.map((task: any, index: number) => ({
            template_id: id,
            title: task.title,
            description: task.description || null,
            priority: task.priority || 'medium',
            due_date_offset_days: task.due_date_offset_days || 0,
            display_order: task.display_order ?? index,
            tags: task.tags || null,
            default_assigned_to: task.default_assigned_to || null,
            parent_task_id: task.parent_temp_id
              ? parentIdMap.get(task.parent_temp_id) || null
              : null,
          }));

          const { error: tasksError } = await supabase
            .from('project_template_tasks')
            .insert(tasksToInsert);

          if (tasksError) {
            console.error('Error updating template tasks:', tasksError);
            return NextResponse.json(
              { error: 'Failed to update template tasks' },
              { status: 500 }
            );
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

    // Fetch updated template with tasks and categories
    const { data: updatedTemplate } = await supabase
      .from('project_templates')
      .select(
        `
        *,
        tasks:project_template_tasks(*),
        categories:project_template_category_assignments(
          id,
          category_id,
          category:project_categories(
            id,
            name,
            description,
            sort_order
          )
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
