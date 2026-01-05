import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity-logger';

// POST /api/leads/[id]/cadence - Start sales cadence for a lead (manual start)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const supabase = await createClient();

    // Parse request body for optional cadence_id
    let selectedCadenceId: string | null = null;
    try {
      const body = await request.json();
      selectedCadenceId = body.cadence_id || null;
    } catch {
      // No body or invalid JSON - will use default cadence
    }

    // Get the lead with company_id and assigned_to
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, company_id, assigned_to, customer_id')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    if (!lead.assigned_to) {
      return NextResponse.json(
        { error: 'Lead must be assigned to a user before starting cadence' },
        { status: 400 }
      );
    }

    // Check if lead already has an active cadence
    const { data: existingAssignment } = await supabase
      .from('lead_cadence_assignments')
      .select('id')
      .eq('lead_id', leadId)
      .is('completed_at', null)
      .single();

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Lead already has an active cadence' },
        { status: 400 }
      );
    }

    // Use selected cadence or get the default cadence for this company
    let cadenceId: string;
    let cadenceName: string;

    if (selectedCadenceId) {
      // Verify the selected cadence exists and is active
      const { data: selectedCadence, error: selectedError } = await supabase
        .from('sales_cadences')
        .select('id, name')
        .eq('id', selectedCadenceId)
        .eq('company_id', lead.company_id)
        .eq('is_active', true)
        .single();

      if (selectedError || !selectedCadence) {
        return NextResponse.json(
          { error: 'Selected cadence not found or not active' },
          { status: 404 }
        );
      }

      cadenceId = selectedCadence.id;
      cadenceName = selectedCadence.name;
    } else {
      // Get the default cadence
      const { data: defaultCadence, error: cadenceError } = await supabase
        .from('sales_cadences')
        .select('id, name')
        .eq('company_id', lead.company_id)
        .eq('is_active', true)
        .eq('is_default', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (cadenceError || !defaultCadence) {
        return NextResponse.json(
          { error: 'No default cadence found for this company' },
          { status: 404 }
        );
      }

      cadenceId = defaultCadence.id;
      cadenceName = defaultCadence.name;
    }

    // Create the cadence assignment
    // The trigger_create_first_task_on_cadence_assignment trigger will automatically
    // create the first task for this cadence
    const { data: assignment, error: assignmentError } = await supabase
      .from('lead_cadence_assignments')
      .insert({
        lead_id: leadId,
        cadence_id: cadenceId,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (assignmentError) {
      console.error('Error creating cadence assignment:', assignmentError);
      return NextResponse.json(
        { error: 'Failed to start cadence' },
        { status: 500 }
      );
    }

    // Log cadence started activity
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await logActivity({
        company_id: lead.company_id,
        entity_type: 'lead',
        entity_id: leadId,
        activity_type: 'cadence_started',
        user_id: user?.id || null,
        metadata: {
          cadence_id: cadenceId,
          cadence_name: cadenceName,
        },
      });
    } catch (activityError) {
      console.error('Error logging cadence started activity:', activityError);
    }

    return NextResponse.json({
      data: assignment,
    });
  } catch (error) {
    console.error('Error in POST /api/leads/[id]/cadence:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/leads/[id]/cadence - Get lead's cadence assignment with steps and progress
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const supabase = await createClient();

    // Get the lead's cadence assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('lead_cadence_assignments')
      .select(`
        *,
        cadence:sales_cadences(
          *,
          steps:sales_cadence_steps(*)
        )
      `)
      .eq('lead_id', leadId)
      .single();

    if (assignmentError && assignmentError.code !== 'PGRST116') {
      // PGRST116 = no rows found (which is okay)
      console.error('Error fetching cadence assignment:', assignmentError);
      return NextResponse.json(
        { error: 'Failed to fetch cadence assignment' },
        { status: 500 }
      );
    }

    // If no assignment, return null
    if (!assignment) {
      return NextResponse.json({ data: null });
    }

    // Get progress for this lead
    const { data: progress, error: progressError } = await supabase
      .from('lead_cadence_progress')
      .select('*')
      .eq('lead_id', leadId);

    if (progressError) {
      console.error('Error fetching cadence progress:', progressError);
      return NextResponse.json(
        { error: 'Failed to fetch cadence progress' },
        { status: 500 }
      );
    }

    // Sort steps by display_order
    const sortedSteps = (assignment.cadence?.steps || []).sort((a: any, b: any) =>
      a.display_order - b.display_order
    );

    // Enhance steps with completion status
    const stepsWithProgress = sortedSteps.map((step: any) => ({
      ...step,
      is_completed: progress?.some((p: any) => p.cadence_step_id === step.id) || false,
      completed_at: progress?.find((p: any) => p.cadence_step_id === step.id)?.completed_at || null,
    }));

    return NextResponse.json({
      data: {
        ...assignment,
        cadence: {
          ...assignment.cadence,
          steps: stepsWithProgress,
        },
        progress: progress || [],
      },
    });
  } catch (error) {
    console.error('Error in GET /api/leads/[id]/cadence:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/leads/[id]/cadence - Assign or change a cadence for a lead
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { cadence_id } = body;

    if (!cadence_id) {
      return NextResponse.json(
        { error: 'cadence_id is required' },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the lead to check if it needs assignment or status update
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('id, company_id, assigned_to, lead_status')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // If lead is unassigned or has status 'new', assign to current user and update status
    if (!lead.assigned_to || lead.lead_status === 'new') {
      const leadUpdateData: any = {};

      // Assign to current user if unassigned
      if (!lead.assigned_to) {
        leadUpdateData.assigned_to = user.id;
      }

      // Update status to in_process if currently new
      if (lead.lead_status === 'new') {
        leadUpdateData.lead_status = 'in_process';
      }

      // Update the lead
      const { error: updateError } = await supabase
        .from('leads')
        .update(leadUpdateData)
        .eq('id', leadId);

      if (updateError) {
        console.error('Error updating lead:', updateError);
        return NextResponse.json(
          { error: 'Failed to update lead' },
          { status: 500 }
        );
      }

      // Log assignment activity if lead was assigned
      if (!lead.assigned_to) {
        try {
          await logActivity({
            company_id: lead.company_id,
            entity_type: 'lead',
            entity_id: leadId,
            activity_type: 'assignment_changed',
            user_id: user.id,
            field_name: 'assigned_to',
            old_value: null,
            new_value: user.id,
          });
        } catch (activityError) {
          console.error('Error logging lead assignment activity:', activityError);
        }
      }

      // Log status change activity if status was updated
      if (lead.lead_status === 'new') {
        try {
          await logActivity({
            company_id: lead.company_id,
            entity_type: 'lead',
            entity_id: leadId,
            activity_type: 'status_change',
            user_id: user.id,
            field_name: 'lead_status',
            old_value: 'new',
            new_value: 'in_process',
          });
        } catch (activityError) {
          console.error('Error logging status change activity:', activityError);
        }
      }
    }

    // Delete old cadence tasks (keep completed tasks for history)
    await supabase
      .from('tasks')
      .delete()
      .eq('related_entity_id', leadId)
      .eq('related_entity_type', 'leads')
      .not('cadence_step_id', 'is', null)
      .neq('status', 'completed');

    // Clear existing progress when changing cadences
    await supabase
      .from('lead_cadence_progress')
      .delete()
      .eq('lead_id', leadId);

    // Use upsert to handle both create and update
    const { data, error } = await supabase
      .from('lead_cadence_assignments')
      .upsert(
        {
          lead_id: leadId,
          cadence_id,
          started_at: new Date().toISOString(),
          completed_at: null,
        },
        {
          onConflict: 'lead_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error upserting cadence assignment:', error);
      return NextResponse.json(
        { error: 'Failed to assign cadence', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error in PUT /api/leads/[id]/cadence:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/leads/[id]/cadence - Pause or unpause a cadence
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { action } = body;

    if (!action || (action !== 'pause' && action !== 'unpause')) {
      return NextResponse.json(
        { error: 'action must be "pause" or "unpause"' },
        { status: 400 }
      );
    }

    // Get current assignment
    const { data: assignment, error: fetchError } = await supabase
      .from('lead_cadence_assignments')
      .select('id')
      .eq('lead_id', leadId)
      .single();

    if (fetchError || !assignment) {
      return NextResponse.json(
        { error: 'No cadence assignment found for this lead' },
        { status: 404 }
      );
    }

    if (action === 'pause') {
      // Pause the cadence
      const { error: pauseError } = await supabase
        .from('lead_cadence_assignments')
        .update({ paused_at: new Date().toISOString() })
        .eq('lead_id', leadId);

      if (pauseError) {
        console.error('Error pausing cadence:', pauseError);
        return NextResponse.json(
          { error: 'Failed to pause cadence' },
          { status: 500 }
        );
      }

      // Update pending cadence tasks to on_hold
      await supabase
        .from('tasks')
        .update({ status: 'on_hold' })
        .eq('related_entity_id', leadId)
        .eq('related_entity_type', 'leads')
        .not('cadence_step_id', 'is', null)
        .eq('status', 'pending');

      // Log cadence paused activity
      try {
        const { data: lead } = await supabase.from('leads').select('company_id').eq('id', leadId).single();
        const { data: { user } } = await supabase.auth.getUser();
        if (lead) {
          await logActivity({
            company_id: lead.company_id,
            entity_type: 'lead',
            entity_id: leadId,
            activity_type: 'cadence_paused',
            user_id: user?.id || null,
          });
        }
      } catch (activityError) {
        console.error('Error logging cadence paused activity:', activityError);
      }

    } else if (action === 'unpause') {
      // Unpause the cadence
      const { error: unpauseError } = await supabase
        .from('lead_cadence_assignments')
        .update({ paused_at: null })
        .eq('lead_id', leadId);

      if (unpauseError) {
        console.error('Error unpausing cadence:', unpauseError);
        return NextResponse.json(
          { error: 'Failed to unpause cadence' },
          { status: 500 }
        );
      }

      // Update on_hold cadence tasks back to pending
      await supabase
        .from('tasks')
        .update({ status: 'pending' })
        .eq('related_entity_id', leadId)
        .eq('related_entity_type', 'leads')
        .not('cadence_step_id', 'is', null)
        .eq('status', 'on_hold');
    }

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error('Error in PATCH /api/leads/[id]/cadence:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/leads/[id]/cadence - End/remove cadence assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const supabase = await createClient();

    // Check if assignment exists
    const { data: assignment, error: fetchError } = await supabase
      .from('lead_cadence_assignments')
      .select('id')
      .eq('lead_id', leadId)
      .single();

    if (fetchError || !assignment) {
      return NextResponse.json(
        { error: 'No cadence assignment found for this lead' },
        { status: 404 }
      );
    }

    // Delete non-completed cadence tasks
    await supabase
      .from('tasks')
      .delete()
      .eq('related_entity_id', leadId)
      .eq('related_entity_type', 'leads')
      .not('cadence_step_id', 'is', null)
      .neq('status', 'completed');

    // Delete the cadence assignment
    const { error: deleteError } = await supabase
      .from('lead_cadence_assignments')
      .delete()
      .eq('lead_id', leadId);

    if (deleteError) {
      console.error('Error deleting cadence assignment:', deleteError);
      return NextResponse.json(
        { error: 'Failed to end cadence' },
        { status: 500 }
      );
    }

    // Delete progress records
    await supabase
      .from('lead_cadence_progress')
      .delete()
      .eq('lead_id', leadId);

    // Log cadence ended activity
    try {
      const { data: lead } = await supabase.from('leads').select('company_id').eq('id', leadId).single();
      const { data: { user } } = await supabase.auth.getUser();
      if (lead) {
        await logActivity({
          company_id: lead.company_id,
          entity_type: 'lead',
          entity_id: leadId,
          activity_type: 'cadence_ended',
          user_id: user?.id || null,
        });
      }
    } catch (activityError) {
      console.error('Error logging cadence ended activity:', activityError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/leads/[id]/cadence:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
