import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { TaskCreateData } from '@/types/task';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');
    const relatedEntityType = searchParams.get('relatedEntityType');
    const relatedEntityId = searchParams.get('relatedEntityId');
    const includeArchived = searchParams.get('includeArchived') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
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
        .eq('company_id', companyId)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this company' },
          { status: 403 }
        );
      }
    }

    // First test basic table access
    console.log('Testing basic tasks table access...');
    const { data: testData, error: testError } = await supabase
      .from('tasks')
      .select('*')
      .eq('company_id', companyId)
      .limit(1);
    
    if (testError) {
      console.error('Basic table access failed:', testError);
      return NextResponse.json({ 
        error: 'Tasks table access failed', 
        details: testError.message,
        code: testError.code 
      }, { status: 500 });
    }
    
    console.log('Basic table access successful, found', testData?.length || 0, 'tasks');

    // Build the query with proper joins using explicit constraint names
    let query = supabase
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
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    // Apply filters
    if (!includeArchived) {
      query = query.eq('archived', false);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }

    if (relatedEntityType) {
      query = query.eq('related_entity_type', relatedEntityType);
    }

    if (relatedEntityId) {
      query = query.eq('related_entity_id', relatedEntityId);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: tasks, error } = await query;

    if (error) {
      console.error('Error fetching tasks:', error);
      console.error('Query details:', {
        companyId,
        status,
        priority,
        assignedTo,
        relatedEntityType,
        relatedEntityId,
        includeArchived
      });
      return NextResponse.json({ 
        error: 'Failed to fetch tasks', 
        details: error.message,
        code: error.code 
      }, { status: 500 });
    }

    // Fetch related entity data for tasks that have them
    const tasksWithRelatedData = await Promise.all(
      (tasks || []).map(async (task) => {
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
              
              return {
                ...task,
                related_entity: relatedEntity
              };
            }
          } catch (error) {
            console.warn(`Failed to fetch related entity for task ${task.id}:`, error);
          }
        }
        
        return task;
      })
    );

    const finalTasks = tasksWithRelatedData || [];
    console.log('Returning', finalTasks.length, 'tasks');
    
    return NextResponse.json({ 
      tasks: finalTasks,
      total: finalTasks.length,
      message: finalTasks.length === 0 ? 'No tasks found' : undefined
    });
  } catch (error) {
    console.error('Error in tasks GET route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const taskData: TaskCreateData = await request.json();

    // Validate required fields
    if (!taskData.title || !taskData.company_id) {
      return NextResponse.json(
        { error: 'Title and company ID are required' },
        { status: 400 }
      );
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
        .eq('company_id', taskData.company_id)
        .single();

      if (userCompanyError || !userCompany) {
        return NextResponse.json(
          { error: 'Access denied to this company' },
          { status: 403 }
        );
      }
    }

    // Clean the task data - convert empty strings to null for UUID and time fields
    const cleanedTaskData = {
      ...taskData,
      assigned_to: taskData.assigned_to || null,
      related_entity_id: taskData.related_entity_id || null,
      due_date: taskData.due_date || null,
      due_time: taskData.due_time || null,
    };

    // If assigned_to is provided, verify the user exists and has access to the company
    if (cleanedTaskData.assigned_to) {
      const { data: assignedUser, error: assignedUserError } = await supabase
        .from('user_companies')
        .select('id')
        .eq('user_id', cleanedTaskData.assigned_to)
        .eq('company_id', cleanedTaskData.company_id)
        .single();

      if (assignedUserError || !assignedUser) {
        return NextResponse.json(
          { error: 'Assigned user does not have access to this company' },
          { status: 400 }
        );
      }
    }

    // Set created_by to current user
    const taskToCreate = {
      ...cleanedTaskData,
      created_by: user.id,
    };

    const { data: task, error } = await supabase
      .from('tasks')
      .insert(taskToCreate)
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
      console.error('Error creating task:', error);
      return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error in tasks POST route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}