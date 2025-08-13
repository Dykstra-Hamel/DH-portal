import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; executionId: string }> }
) {
  try {
    const { id, executionId } = await params;
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

    // Fetch specific execution with detailed information
    const { data: execution, error } = await supabase
      .from('automation_executions')
      .select(`
        *,
        workflow:automation_workflows(
          id,
          name,
          description,
          workflow_type,
          trigger_type,
          workflow_steps
        ),
        lead:leads(
          id,
          lead_status,
          pest_type,
          urgency,
          customer:customers(
            first_name,
            last_name,
            email,
            phone
          )
        )
      `)
      .eq('id', executionId)
      .eq('company_id', id)
      .single();

    if (error || !execution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      execution
    });

  } catch (error) {
    console.error('Error in execution GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; executionId: string }> }
) {
  try {
    const { id, executionId } = await params;
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

    const body = await request.json();
    const { execution_status, cancellation_reason } = body;

    // Validate the request
    if (!execution_status) {
      return NextResponse.json(
        { error: 'execution_status is required' },
        { status: 400 }
      );
    }

    // Check if execution exists and belongs to this company
    const { data: existingExecution, error: fetchError } = await supabase
      .from('automation_executions')
      .select('id, execution_status, workflow_id, execution_data')
      .eq('id', executionId)
      .eq('company_id', id)
      .single();

    if (fetchError || !existingExecution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    // Validate status transitions
    const validStatuses = ['pending', 'running', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(execution_status)) {
      return NextResponse.json(
        { error: 'Invalid execution status' },
        { status: 400 }
      );
    }

    // Prevent certain status changes
    if (existingExecution.execution_status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot modify completed execution' },
        { status: 409 }
      );
    }

    // Build update data
    const updateData: any = {
      execution_status,
      updated_at: new Date().toISOString(),
    };

    // Handle cancellation specifically
    if (execution_status === 'cancelled') {
      updateData.completed_at = new Date().toISOString();
      updateData.current_step = 'cancelled_by_user';
      
      if (cancellation_reason) {
        updateData.execution_data = {
          ...existingExecution.execution_data,
          cancellationReason: cancellation_reason,
          cancelledBy: user.id,
          cancelledAt: new Date().toISOString()
        };
      }
    }

    // Update the execution
    const { data: execution, error } = await supabase
      .from('automation_executions')
      .update(updateData)
      .eq('id', executionId)
      .eq('company_id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating execution:', error);
      return NextResponse.json(
        { error: 'Failed to update execution' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      execution,
      message: execution_status === 'cancelled' 
        ? 'Execution cancelled successfully'
        : 'Execution updated successfully'
    });

  } catch (error) {
    console.error('Error in execution PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; executionId: string }> }
) {
  try {
    const { id, executionId } = await params;
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

    // Check if execution exists and can be cancelled
    const { data: existingExecution, error: fetchError } = await supabase
      .from('automation_executions')
      .select('id, execution_status')
      .eq('id', executionId)
      .eq('company_id', id)
      .single();

    if (fetchError || !existingExecution) {
      return NextResponse.json(
        { error: 'Execution not found' },
        { status: 404 }
      );
    }

    // Only allow cancellation of pending or running executions
    if (!['pending', 'running'].includes(existingExecution.execution_status)) {
      return NextResponse.json(
        { error: 'Can only cancel pending or running executions' },
        { status: 409 }
      );
    }

    // Cancel the execution (set status to cancelled instead of deleting)
    const { data: execution, error } = await supabase
      .from('automation_executions')
      .update({
        execution_status: 'cancelled',
        completed_at: new Date().toISOString(),
        current_step: 'cancelled_by_user',
        execution_data: {
          cancellationReason: 'cancelled_by_user',
          cancelledBy: user.id,
          cancelledAt: new Date().toISOString()
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', executionId)
      .eq('company_id', id)
      .select()
      .single();

    if (error) {
      console.error('Error cancelling execution:', error);
      return NextResponse.json(
        { error: 'Failed to cancel execution' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      execution,
      message: 'Execution cancelled successfully'
    });

  } catch (error) {
    console.error('Error in execution DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}