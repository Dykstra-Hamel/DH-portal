import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET specific workflow
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; workflowId: string }> }
) {
  try {
    const { id, workflowId } = await params;
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', id)
      .single();

    // Also check if user is global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';
    const hasCompanyAccess = userCompany && !userCompanyError;

    if (!isGlobalAdmin && !hasCompanyAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch specific workflow
    const { data: workflow, error } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('id', workflowId)
      .eq('company_id', id)
      .single();

    if (error || !workflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Also fetch related rules if any
    const { data: rules } = await supabase
      .from('automation_rules')
      .select('*')
      .eq('workflow_id', workflowId);

    return NextResponse.json({ 
      workflow: {
        ...workflow,
        rules: rules || []
      }
    });
  } catch (error) {
    console.error('Error in workflow GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT update workflow
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; workflowId: string }> }
) {
  try {
    const { id, workflowId } = await params;
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access to this company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', id)
      .single();

    // Also check if user is global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';
    const isCompanyAdmin =
      userCompany && ['admin', 'manager', 'owner'].includes(userCompany.role);

    if (!isGlobalAdmin && !isCompanyAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Company admin privileges required.' },
        { status: 403 }
      );
    }

    const workflowData = await request.json();

    // Check if workflow exists and belongs to this company
    const { data: existingWorkflow } = await supabase
      .from('automation_workflows')
      .select('id')
      .eq('id', workflowId)
      .eq('company_id', id)
      .single();

    if (!existingWorkflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // If name is being changed, check for uniqueness
    if (workflowData.name) {
      const { data: nameConflict } = await supabase
        .from('automation_workflows')
        .select('id')
        .eq('company_id', id)
        .eq('name', workflowData.name)
        .neq('id', workflowId)
        .single();

      if (nameConflict) {
        return NextResponse.json(
          { error: 'Workflow name already exists for this company' },
          { status: 409 }
        );
      }
    }

    // Update workflow
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Only update provided fields
    if (workflowData.name !== undefined) updateData.name = workflowData.name;
    if (workflowData.description !== undefined) updateData.description = workflowData.description;
    if (workflowData.workflow_type !== undefined) updateData.workflow_type = workflowData.workflow_type;
    if (workflowData.trigger_type !== undefined) updateData.trigger_type = workflowData.trigger_type;
    if (workflowData.trigger_conditions !== undefined) updateData.trigger_conditions = workflowData.trigger_conditions;
    if (workflowData.workflow_steps !== undefined) updateData.workflow_steps = workflowData.workflow_steps;
    if (workflowData.is_active !== undefined) updateData.is_active = workflowData.is_active;
    if (workflowData.business_hours_only !== undefined) updateData.business_hours_only = workflowData.business_hours_only;
    if (workflowData.auto_cancel_on_status !== undefined) updateData.auto_cancel_on_status = workflowData.auto_cancel_on_status;
    if (workflowData.cancel_on_statuses !== undefined) updateData.cancel_on_statuses = workflowData.cancel_on_statuses;

    const { data: workflow, error } = await supabase
      .from('automation_workflows')
      .update(updateData)
      .eq('id', workflowId)
      .eq('company_id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating workflow:', error);
      return NextResponse.json(
        { error: 'Failed to update workflow' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      workflow,
      message: 'Workflow updated successfully' 
    });
  } catch (error) {
    console.error('Error in workflow PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE workflow
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; workflowId: string }> }
) {
  try {
    const { id, workflowId } = await params;
    const supabase = await createClient();

    // Get the current user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has admin access to this company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', id)
      .single();

    // Also check if user is global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';
    const isCompanyAdmin =
      userCompany && ['admin', 'manager', 'owner'].includes(userCompany.role);

    if (!isGlobalAdmin && !isCompanyAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Company admin privileges required.' },
        { status: 403 }
      );
    }

    // Check if workflow exists and belongs to this company
    const { data: existingWorkflow } = await supabase
      .from('automation_workflows')
      .select('id, name')
      .eq('id', workflowId)
      .eq('company_id', id)
      .single();

    if (!existingWorkflow) {
      return NextResponse.json(
        { error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Check if there are any active executions for this workflow
    const { data: activeExecutions } = await supabase
      .from('automation_executions')
      .select('id')
      .eq('workflow_id', workflowId)
      .in('execution_status', ['pending', 'running']);

    if (activeExecutions && activeExecutions.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete workflow with active executions. Please wait for them to complete or cancel them first.' },
        { status: 409 }
      );
    }

    // Delete the workflow (this will cascade to rules and executions due to foreign key constraints)
    const { error } = await supabase
      .from('automation_workflows')
      .delete()
      .eq('id', workflowId)
      .eq('company_id', id);

    if (error) {
      console.error('Error deleting workflow:', error);
      return NextResponse.json(
        { error: 'Failed to delete workflow' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: `Workflow "${existingWorkflow.name}" deleted successfully` 
    });
  } catch (error) {
    console.error('Error in workflow DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}