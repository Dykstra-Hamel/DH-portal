import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';

// POST /api/admin/projects/[id]/duplicate
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sourceProjectId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAuthorized = await isAuthorizedAdmin(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, companyId, dueDate } = body;

    if (!name || !companyId || !dueDate) {
      return NextResponse.json(
        { error: 'name, companyId, and dueDate are required' },
        { status: 400 }
      );
    }

    // Fetch source project
    const { data: sourceProject, error: sourceError } = await supabase
      .from('projects')
      .select(
        'id, name, description, company_id, project_type, project_subtype, type_code, assigned_to, priority, due_date, start_date, is_billable, quoted_price, tags, notes, scope, current_department_id'
      )
      .eq('id', sourceProjectId)
      .single();

    if (sourceError || !sourceProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectTypeToCode: Record<string, string | null> = {
      none: null,
      website: 'WEB',
      social: 'SOC',
      email: 'EML',
      print: 'PRT',
      vehicle: 'VEH',
      digital: 'DIG',
      ads: 'ADS',
      campaigns: 'CAM',
      software: 'SFT',
    };

    const isCompanyChanged = sourceProject.company_id !== companyId;
    const normalizeName = (value: string) => value.trim().toLowerCase();
    const resolvedTypeCode =
      sourceProject.type_code ??
      projectTypeToCode[sourceProject.project_type] ??
      null;
    let mappedCurrentDepartmentId: string | null =
      sourceProject.current_department_id;

    if (sourceProject.current_department_id && isCompanyChanged) {
      const { data: sourceDepartment, error: sourceDepartmentError } =
        await supabase
          .from('project_departments')
          .select('id, name, company_id')
          .eq('id', sourceProject.current_department_id)
          .maybeSingle();

      if (sourceDepartmentError) {
        return NextResponse.json(
          {
            error: 'Failed to fetch source project department',
            details: sourceDepartmentError.message,
          },
          { status: 500 }
        );
      }

      if (!sourceDepartment) {
        mappedCurrentDepartmentId = null;
      } else if (sourceDepartment.company_id === null) {
        // System departments can be reused as-is across companies
        mappedCurrentDepartmentId = sourceDepartment.id;
      } else {
        const { data: candidateDepartments, error: candidateDepartmentsError } =
          await supabase
            .from('project_departments')
            .select('id, company_id')
            .eq('name', sourceDepartment.name)
            .or(`company_id.eq.${companyId},company_id.is.null`);

        if (candidateDepartmentsError) {
          return NextResponse.json(
            {
              error: 'Failed to map project department for target company',
              details: candidateDepartmentsError.message,
            },
            { status: 500 }
          );
        }

        const companyMatch =
          candidateDepartments?.find(
            (department) => department.company_id === companyId
          ) || null;
        const systemMatch =
          candidateDepartments?.find(
            (department) => department.company_id === null
          ) || null;

        mappedCurrentDepartmentId =
          companyMatch?.id || systemMatch?.id || null;
      }
    }

    // Fetch source tasks first so we can copy categories even if there are no tasks
    const { data: sourceTasks, error: tasksError } = await supabase
      .from('project_tasks')
      .select(
        'id, parent_task_id, title, description, notes, priority, due_date, start_date, assigned_to, department_id, blocks_task_id, blocked_by_task_id, is_completed, display_order'
      )
      .eq('project_id', sourceProjectId);

    if (tasksError) {
      return NextResponse.json(
        { error: 'Failed to fetch source tasks', details: tasksError.message },
        { status: 500 }
      );
    }

    const sourceTaskIds = (sourceTasks || []).map((task) => task.id);

    // Fetch project-level category assignments
    const {
      data: sourceProjectCategoryAssignments,
      error: sourceProjectCategoryError,
    } = await supabase
      .from('project_category_assignments')
      .select(
        'category_id, category_type, category:project_categories(id, name, company_id)'
      )
      .eq('project_id', sourceProjectId);

    if (sourceProjectCategoryError) {
      return NextResponse.json(
        {
          error: 'Failed to fetch source project categories',
          details: sourceProjectCategoryError.message,
        },
        { status: 500 }
      );
    }

    let sourceTaskCategoryAssignments: Array<{
      task_id: string;
      category_id: string;
      category_type: 'internal' | 'external';
      category: { id: string; name: string; company_id: string | null } | null;
    }> = [];

    if (sourceTaskIds.length > 0) {
      const { data, error: sourceTaskCategoryError } = await supabase
        .from('project_task_category_assignments')
        .select(
          'task_id, category_id, category_type, category:project_categories(id, name, company_id)'
        )
        .in('task_id', sourceTaskIds);

      if (sourceTaskCategoryError) {
        return NextResponse.json(
          {
            error: 'Failed to fetch source task categories',
            details: sourceTaskCategoryError.message,
          },
          { status: 500 }
        );
      }

      sourceTaskCategoryAssignments = (data || []).map((row) => {
        const cat = Array.isArray(row.category) ? row.category[0] : row.category;
        return {
          task_id: row.task_id as string,
          category_id: row.category_id as string,
          category_type: (row.category_type as 'internal' | 'external') || 'internal',
          category: cat
            ? { id: cat.id as string, name: cat.name as string, company_id: cat.company_id as string | null }
            : null,
        };
      });
    }

    // Build category ID mapping. If the company changed, map external categories by name.
    const sourceCategoryById = new Map<
      string,
      { id: string; name: string; company_id: string | null }
    >();

    (sourceProjectCategoryAssignments || []).forEach((assignment) => {
      const raw = assignment.category;
      const category = (Array.isArray(raw) ? raw[0] : raw) as {
        id: string;
        name: string;
        company_id: string | null;
      } | null | undefined;
      if (category?.id) {
        sourceCategoryById.set(category.id, category);
      }
    });

    sourceTaskCategoryAssignments.forEach((assignment) => {
      const category = assignment.category;
      if (category?.id) {
        sourceCategoryById.set(category.id, category);
      }
    });

    const categoryIdMap = new Map<string, string>();

    if (!isCompanyChanged) {
      sourceCategoryById.forEach((category) => {
        categoryIdMap.set(category.id, category.id);
      });
    } else {
      const externalCategoryNames = Array.from(
        new Set(
          Array.from(sourceCategoryById.values())
            .filter((category) => category.company_id !== null)
            .map((category) => category.name)
        )
      );

      // Internal categories are system-wide and safe to carry over by ID
      sourceCategoryById.forEach((category) => {
        if (category.company_id === null) {
          categoryIdMap.set(category.id, category.id);
        }
      });

      if (externalCategoryNames.length > 0) {
        const { data: targetCompanyCategories, error: targetCategoryError } =
          await supabase
            .from('project_categories')
            .select('id, name')
            .eq('company_id', companyId)
            .in('name', externalCategoryNames);

        if (targetCategoryError) {
          return NextResponse.json(
            {
              error: 'Failed to map external categories for target company',
              details: targetCategoryError.message,
            },
            { status: 500 }
          );
        }

        const targetByName = new Map<string, string>();
        (targetCompanyCategories || []).forEach((category) => {
          targetByName.set(normalizeName(category.name), category.id);
        });

        sourceCategoryById.forEach((category) => {
          if (category.company_id === null) return;
          const mappedCategoryId = targetByName.get(normalizeName(category.name));
          if (mappedCategoryId) {
            categoryIdMap.set(category.id, mappedCategoryId);
          }
        });
      }
    }

    // Insert new project
    const { data: newProject, error: insertError } = await supabase
      .from('projects')
      .insert({
        name,
        company_id: companyId,
        description: sourceProject.description,
        project_type: sourceProject.project_type,
        project_subtype: sourceProject.project_subtype,
        type_code: resolvedTypeCode,
        requested_by: user.id,
        assigned_to: sourceProject.assigned_to,
        status: 'new',
        priority: sourceProject.priority || 'medium',
        due_date: dueDate,
        start_date: sourceProject.start_date,
        is_billable: !!sourceProject.is_billable,
        quoted_price: sourceProject.quoted_price,
        tags: sourceProject.tags,
        notes: sourceProject.notes,
        scope: sourceProject.scope,
        current_department_id: mappedCurrentDepartmentId,
      })
      .select('id')
      .single();

    if (insertError || !newProject) {
      return NextResponse.json(
        { error: 'Failed to create project', details: insertError?.message },
        { status: 500 }
      );
    }

    // Copy project-level category assignments first (including categories with no tasks)
    const projectCategoryInsertMap = new Map<
      string,
      { project_id: string; category_id: string; category_type: 'internal' | 'external' }
    >();

    (sourceProjectCategoryAssignments || []).forEach((assignment) => {
      const mappedCategoryId = categoryIdMap.get(assignment.category_id);
      if (!mappedCategoryId) return;
      const categoryType =
        (assignment.category_type as 'internal' | 'external') || 'internal';
      const key = `${mappedCategoryId}:${categoryType}`;
      projectCategoryInsertMap.set(key, {
        project_id: newProject.id,
        category_id: mappedCategoryId,
        category_type: categoryType,
      });
    });

    if (projectCategoryInsertMap.size > 0) {
      const { error: projectCategoryInsertError } = await supabase
        .from('project_category_assignments')
        .insert(Array.from(projectCategoryInsertMap.values()));

      if (projectCategoryInsertError) {
        return NextResponse.json(
          {
            error: 'Failed to copy project categories',
            details: projectCategoryInsertError.message,
          },
          { status: 500 }
        );
      }
    }

    if (!sourceTasks || sourceTasks.length === 0) {
      return NextResponse.json({ projectId: newProject.id }, { status: 201 });
    }

    // Build old-to-new ID map
    const oldIdToNewId = new Map<string, string>();
    for (const sourceTask of sourceTasks) {
      const { data: insertedTask, error: insertTaskError } = await supabase
        .from('project_tasks')
        .insert({
          project_id: newProject.id,
          parent_task_id: null,
          title: sourceTask.title,
          description: sourceTask.description,
          notes: sourceTask.notes,
          priority: sourceTask.priority,
          due_date: null,
          start_date: sourceTask.start_date,
          assigned_to: sourceTask.assigned_to,
          department_id: isCompanyChanged ? null : sourceTask.department_id,
          created_by: user.id,
          is_completed: false,
          display_order: sourceTask.display_order,
          blocks_task_id: null,
          blocked_by_task_id: null,
        })
        .select('id')
        .single();

      if (insertTaskError || !insertedTask) {
        return NextResponse.json(
          {
            error: 'Failed to create duplicated task',
            details: insertTaskError?.message,
          },
          { status: 500 }
        );
      }

      oldIdToNewId.set(sourceTask.id, insertedTask.id);
    }

    // Re-apply parent relationships and dependencies
    for (const sourceTask of sourceTasks) {
      const newTaskId = oldIdToNewId.get(sourceTask.id);
      if (!newTaskId) continue;

      const { error: dependencyUpdateError } = await supabase
        .from('project_tasks')
        .update({
          parent_task_id: sourceTask.parent_task_id
            ? (oldIdToNewId.get(sourceTask.parent_task_id) ?? null)
            : null,
          blocks_task_id: sourceTask.blocks_task_id
            ? (oldIdToNewId.get(sourceTask.blocks_task_id) ?? null)
            : null,
          blocked_by_task_id: sourceTask.blocked_by_task_id
            ? (oldIdToNewId.get(sourceTask.blocked_by_task_id) ?? null)
            : null,
        })
        .eq('id', newTaskId);

      if (dependencyUpdateError) {
        return NextResponse.json(
          {
            error: 'Failed to restore task dependencies',
            details: dependencyUpdateError.message,
          },
          { status: 500 }
        );
      }
    }

    // Copy task-level category assignments
    const taskCategoryInsertMap = new Map<
      string,
      { task_id: string; category_id: string; category_type: 'internal' | 'external' }
    >();

    sourceTaskCategoryAssignments.forEach((assignment) => {
      const mappedTaskId = oldIdToNewId.get(assignment.task_id);
      const mappedCategoryId = categoryIdMap.get(assignment.category_id);
      if (!mappedTaskId || !mappedCategoryId) return;

      const categoryType = assignment.category_type || 'internal';
      const key = `${mappedTaskId}:${mappedCategoryId}:${categoryType}`;
      taskCategoryInsertMap.set(key, {
        task_id: mappedTaskId,
        category_id: mappedCategoryId,
        category_type: categoryType,
      });
    });

    if (taskCategoryInsertMap.size > 0) {
      const { error: taskCategoryInsertError } = await supabase
        .from('project_task_category_assignments')
        .insert(Array.from(taskCategoryInsertMap.values()));

      if (taskCategoryInsertError) {
        return NextResponse.json(
          {
            error: 'Failed to copy task categories',
            details: taskCategoryInsertError.message,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ projectId: newProject.id }, { status: 201 });
  } catch (error) {
    console.error('Error duplicating project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
