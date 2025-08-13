import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const workflowId = searchParams.get('workflow_id');
    const leadId = searchParams.get('lead_id');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    let query = supabase
      .from('automation_executions')
      .select(`
        *,
        workflow:automation_workflows(
          id,
          name,
          workflow_type,
          trigger_type
        ),
        lead:leads(
          id,
          customer:customers(
            first_name,
            last_name,
            email
          )
        )
      `)
      .eq('company_id', id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status) {
      const statusArray = status.split(',');
      query = query.in('execution_status', statusArray);
    }

    if (workflowId) {
      query = query.eq('workflow_id', workflowId);
    }

    if (leadId) {
      query = query.eq('lead_id', leadId);
    }

    const { data: executions, error } = await query;

    if (error) {
      console.error('Error fetching executions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch executions' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('automation_executions')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', id);

    if (status) {
      const statusArray = status.split(',');
      countQuery = countQuery.in('execution_status', statusArray);
    }
    if (workflowId) countQuery = countQuery.eq('workflow_id', workflowId);
    if (leadId) countQuery = countQuery.eq('lead_id', leadId);

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting executions:', countError);
    }

    return NextResponse.json({
      success: true,
      executions: executions || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      }
    });

  } catch (error) {
    console.error('Error in executions GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}