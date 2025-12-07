import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Use admin client for global admins to bypass RLS
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // Get campaign to verify access
    const { data: campaign } = await queryClient
      .from('campaigns')
      .select('company_id')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check user has access (skip for global admins)
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('company_id', campaign.company_id)
        .single();

      if (!userCompany) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    // Build query - alias execution_status as status for frontend compatibility
    let query = queryClient
      .from('campaign_executions')
      .select(
        `
        id,
        customer_id,
        lead_id,
        execution_status,
        started_at,
        completed_at,
        automation_execution_id,
        customers(first_name, last_name, email, phone),
        automation_execution:automation_executions(execution_data, error_message)
      `,
        { count: 'exact' }
      )
      .eq('campaign_id', campaignId)
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('execution_status', status);
    }

    const { data: executions, error, count } = await query;

    // Debug logging
    console.log('Executions query result:', {
      count,
      executionsLength: executions?.length,
      error,
      hasData: !!executions,
    });

    if (error) {
      console.error('Error fetching executions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch executions' },
        { status: 500 }
      );
    }

    // Map execution_status to status for frontend compatibility
    const mappedExecutions = (executions || []).map((execution: any) => ({
      ...execution,
      status: execution.execution_status,
      workflow_run_id: execution.automation_execution_id,
      error_message: execution.automation_execution?.error_message || null,
      step_results: execution.automation_execution?.execution_data?.stepResults || [],
    }));

    return NextResponse.json({
      success: true,
      executions: mappedExecutions,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: count ? offset + limit < count : false,
      },
    });
  } catch (error) {
    console.error('Error in executions GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
