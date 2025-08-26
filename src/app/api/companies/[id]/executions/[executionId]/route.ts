import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendEvent } from '@/lib/inngest/client';

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
    
    console.log('Execution update request:', {
      executionId,
      companyId: id,
      execution_status,
      cancellation_reason,
      userId: user.id
    });

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
      console.error('Execution lookup failed:', {
        executionId,
        companyId: id,
        fetchError,
        userId: user.id
      });
      return NextResponse.json(
        { error: 'Execution not found', executionId, companyId: id },
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
      
      // Safely handle existing execution_data
      const existingData = existingExecution.execution_data || {};
      updateData.execution_data = {
        ...existingData,
        cancellationReason: cancellation_reason || 'Cancelled by user',
        cancelledBy: user.id,
        cancelledAt: new Date().toISOString()
      };
    }

    // Verify execution still exists before update (race condition check)
    const { data: currentExecution, error: reCheckError } = await supabase
      .from('automation_executions')
      .select('id, execution_status, company_id')
      .eq('id', executionId)
      .eq('company_id', id)
      .single();

    if (reCheckError || !currentExecution) {
      console.error('Execution no longer exists at update time:', {
        executionId,
        companyId: id,
        reCheckError,
        originalStatus: existingExecution.execution_status
      });
      return NextResponse.json(
        { 
          error: 'Execution no longer exists or was modified by another process',
          executionId,
          details: 'The execution may have been completed, cancelled, or deleted by another operation'
        },
        { status: 409 }
      );
    }

    console.log('About to update execution:', {
      executionId,
      companyId: id,
      currentStatus: currentExecution.execution_status,
      targetStatus: execution_status,
      updateData
    });

    // Update the execution (remove .single() to handle 0 affected rows gracefully)
    const { data: execution, error, count } = await supabase
      .from('automation_executions')
      .update(updateData)
      .eq('id', executionId)
      .eq('company_id', id)
      .select();

    if (error) {
      console.error('Error updating execution:', {
        error,
        executionId,
        companyId: id,
        updateData,
        userId: user.id,
        requestBody: body,
        affectedRows: count
      });
      return NextResponse.json(
        { 
          error: 'Failed to update execution',
          details: error.message || 'Database update failed',
          executionId,
          operation: execution_status === 'cancelled' ? 'cancellation' : 'update'
        },
        { status: 500 }
      );
    }

    // Check if any rows were actually updated
    if (!execution || execution.length === 0) {
      console.error('No rows updated - execution may have been modified:', {
        executionId,
        companyId: id,
        affectedRows: count,
        executionExists: !!currentExecution,
        currentStatus: currentExecution?.execution_status,
        targetStatus: execution_status
      });
      return NextResponse.json(
        {
          error: 'Execution could not be updated',
          details: 'The execution may have been completed or modified by another process',
          executionId,
          currentStatus: currentExecution?.execution_status
        },
        { status: 409 }
      );
    }

    // If this was a cancellation, send cancellation event to Inngest
    if (execution_status === 'cancelled' && execution.length > 0) {
      try {
        await sendEvent({
          name: 'workflow/cancel',
          data: {
            executionId,
            workflowId: existingExecution.workflow_id,
            companyId: id,
            cancelledBy: user.id,
            cancellationReason: cancellation_reason || 'Cancelled by user',
            timestamp: new Date().toISOString()
          }
        });
        console.log(`🚫 CANCELLATION EVENT SENT: ${executionId}`);
      } catch (eventError) {
        console.error('Failed to send cancellation event to Inngest:', eventError);
        // Don't fail the cancellation if event sending fails
      }
    }

    return NextResponse.json({
      success: true,
      execution: execution[0], // Take first (and should be only) result
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