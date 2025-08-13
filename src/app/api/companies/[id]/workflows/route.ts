import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET all workflows for a company
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

    // Fetch workflows
    const { data: workflows, error } = await supabase
      .from('automation_workflows')
      .select('*')
      .eq('company_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching workflows:', error);
      return NextResponse.json(
        { error: 'Failed to fetch workflows' },
        { status: 500 }
      );
    }

    return NextResponse.json({ workflows });
  } catch (error) {
    console.error('Error in workflows GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new workflow
export async function POST(
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

    // Validate required fields
    if (!workflowData.name || !workflowData.workflow_type || !workflowData.trigger_type) {
      return NextResponse.json(
        { error: 'Missing required fields: name, workflow_type, trigger_type' },
        { status: 400 }
      );
    }

    // Validate workflow name uniqueness for this company
    const { data: existingWorkflow } = await supabase
      .from('automation_workflows')
      .select('id')
      .eq('company_id', id)
      .eq('name', workflowData.name)
      .single();

    if (existingWorkflow) {
      return NextResponse.json(
        { error: 'Workflow name already exists for this company' },
        { status: 409 }
      );
    }

    // Create new workflow
    const { data: workflow, error } = await supabase
      .from('automation_workflows')
      .insert([
        {
          company_id: id,
          name: workflowData.name,
          description: workflowData.description || '',
          workflow_type: workflowData.workflow_type,
          trigger_type: workflowData.trigger_type,
          trigger_conditions: workflowData.trigger_conditions || {},
          workflow_steps: workflowData.workflow_steps || [],
          is_active: workflowData.is_active || false,
          business_hours_only: workflowData.business_hours_only !== false,
          auto_cancel_on_status: workflowData.auto_cancel_on_status !== false,
          cancel_on_statuses: workflowData.cancel_on_statuses || ['won', 'closed_won', 'converted'],
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating workflow:', error);
      return NextResponse.json(
        { error: 'Failed to create workflow' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      workflow,
      message: 'Workflow created successfully' 
    });
  } catch (error) {
    console.error('Error in workflows POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}