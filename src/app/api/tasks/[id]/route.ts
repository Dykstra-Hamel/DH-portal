import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TaskUpdateData } from '@/types/task';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user profile to determine if they're a global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';

    // Fetch the task with related data using efficient joins
    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned_user:profiles!tasks_assigned_to_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        created_user:profiles!tasks_created_by_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        company:companies!tasks_company_id_fkey(
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error || !task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Verify user has access to this company (admins have access to all companies)
    if (!isGlobalAdmin) {
      const { data: userCompany, error: userCompanyError } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', task.company_id)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this task' },
          { status: 403 }
        );
      }
    }

    // Fetch related entity data if applicable (only thing not handled by joins)
    let taskWithRelatedData = task;
    if (task.related_entity_type && task.related_entity_id) {
      try {
        let selectFields = 'id';

        // Define select fields based on entity type
        switch (task.related_entity_type) {
          case 'leads':
            selectFields = 'id, service_type as name, lead_status as status, lead_type as type';
            break;
          case 'support_cases':
            selectFields = 'id, summary as title, status, issue_type as type';
            break;
          case 'customers':
            selectFields = 'id, first_name, last_name';
            break;
          case 'tickets':
            selectFields = 'id, title, status, type';
            break;
          case 'call_records':
            selectFields = 'id, call_type as type, call_status as status';
            break;
          default:
            selectFields = 'id';
        }

        const { data: relatedEntity } = await supabase
          .from(task.related_entity_type)
          .select(selectFields)
          .eq('id', task.related_entity_id)
          .single();

        if (relatedEntity) {
          // Handle customer name concatenation
          if (task.related_entity_type === 'customers' && 'first_name' in relatedEntity && relatedEntity.first_name) {
            (relatedEntity as any).name = `${relatedEntity.first_name} ${(relatedEntity as any).last_name || ''}`.trim();
          }
          
          taskWithRelatedData = {
            ...task,
            related_entity: relatedEntity
          };
        }
      } catch (error) {
        console.warn(`Failed to fetch related entity for task ${task.id}:`, error);
      }
    }

    return NextResponse.json({ task: taskWithRelatedData });
  } catch (error) {
    console.error('Error in task GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updateData: Partial<TaskUpdateData> = await request.json();

    // First, fetch the existing task to verify permissions
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('id, company_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check user profile to determine if they're a global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';

    // Verify user has access to this company (admins have access to all companies)
    if (!isGlobalAdmin) {
      const { data: userCompany, error: userCompanyError } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', existingTask.company_id)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this task' },
          { status: 403 }
        );
      }
    }

    // If assigned_to is being changed, verify the new assignee has access to the company
    if (updateData.assigned_to) {
      const { data: assignedUser, error: assignedUserError } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', updateData.assigned_to)
        .eq('company_id', existingTask.company_id)
        .single();

      if (assignedUserError || !assignedUser) {
        return NextResponse.json(
          { error: 'Assigned user does not have access to this company' },
          { status: 400 }
        );
      }
    }

    // Remove id from updateData to prevent conflicts
    const { id: _, ...dataToUpdate } = updateData;

    const { data: task, error } = await supabase
      .from('tasks')
      .update(dataToUpdate)
      .eq('id', id)
      .select(`
        *,
        assigned_user:profiles!tasks_assigned_to_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        created_user:profiles!tasks_created_by_fkey(
          id,
          first_name,
          last_name,
          email
        ),
        company:companies!tasks_company_id_fkey(
          id,
          name
        )
      `)
      .single();

    if (error) {
      console.error('Error updating task:', error);
      return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Error in task PUT route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, fetch the existing task to verify permissions
    const { data: existingTask, error: fetchError } = await supabase
      .from('tasks')
      .select('id, company_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Check user profile to determine if they're a global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';

    // Verify user has access to this company (admins have access to all companies)
    if (!isGlobalAdmin) {
      const { data: userCompany, error: userCompanyError } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', user.id)
        .eq('company_id', existingTask.company_id)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this task' },
          { status: 403 }
        );
      }
    }

    // Archive the task instead of hard delete (soft delete)
    const { error } = await supabase
      .from('tasks')
      .update({ archived: true })
      .eq('id', id);

    if (error) {
      console.error('Error archiving task:', error);
      return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error in task DELETE route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}