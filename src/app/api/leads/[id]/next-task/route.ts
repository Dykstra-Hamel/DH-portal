import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/leads/[id]/next-task - Get the next recommended action/task for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const supabase = await createClient();

    // Call the database function to get next incomplete cadence step
    const { data: nextStepData, error: stepError } = await supabase
      .rpc('get_next_incomplete_cadence_step', {
        p_lead_id: leadId
      });

    if (stepError) {
      console.error('Error fetching next cadence step:', stepError);
      return NextResponse.json(
        { error: 'Failed to fetch next cadence step' },
        { status: 500 }
      );
    }

    // If no next step, return null
    if (!nextStepData || nextStepData.length === 0) {
      return NextResponse.json({ data: null });
    }

    const nextStep = nextStepData[0];

    // Fetch the associated task for this cadence step (if it exists)
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, title, due_date, due_time, status, priority')
      .eq('related_entity_id', leadId)
      .eq('related_entity_type', 'leads')
      .eq('cadence_step_id', nextStep.step_id)
      .in('status', ['new', 'pending', 'in_progress']) // Only active tasks
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (taskError) {
      console.error('Error fetching task for cadence step:', taskError);
      // Continue without task data - we still have step info
    }

    // Combine step data with task data
    const nextTaskData = {
      step_id: nextStep.step_id,
      cadence_id: nextStep.cadence_id,
      day_number: nextStep.day_number,
      time_of_day: nextStep.time_of_day,
      action_type: nextStep.action_type,
      priority: nextStep.priority || task?.priority || 'medium',
      description: nextStep.description,
      display_order: nextStep.display_order,
      // Task-specific fields (may be null if task doesn't exist yet)
      task_id: task?.id || null,
      task_title: task?.title || null,
      due_date: task?.due_date || null,
      due_time: task?.due_time || null,
      task_status: task?.status || null,
    };

    return NextResponse.json({ data: nextTaskData });
  } catch (error) {
    console.error('Error in GET /api/leads/[id]/next-task:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
