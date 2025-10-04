import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/leads/[id]/activities - Get all activities for a lead
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const supabase = await createClient();

    const { data: activities, error } = await supabase
      .from('lead_activity_log')
      .select(`
        *,
        user:profiles!user_id(id, first_name, last_name, email)
      `)
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching lead activities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lead activities' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: activities || [] });
  } catch (error) {
    console.error('Error in GET /api/leads/[id]/activities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/leads/[id]/activities - Log a new activity
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: leadId } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { activity_type, notes, skip_task_completion } = body;

    // Get current user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!activity_type) {
      return NextResponse.json(
        { error: 'activity_type is required' },
        { status: 400 }
      );
    }

    // Validate activity_type
    const validActionTypes = ['live_call', 'outbound_call', 'text_message', 'ai_call', 'email'];
    if (!validActionTypes.includes(activity_type)) {
      return NextResponse.json(
        { error: 'Invalid activity_type' },
        { status: 400 }
      );
    }

    // Create the activity (trigger will handle cadence progression unless skip_task_completion is true)
    const { data: newActivity, error: insertError } = await supabase
      .from('lead_activity_log')
      .insert({
        lead_id: leadId,
        user_id: user.id,
        action_type: activity_type,
        notes: notes || null,
        skip_task_completion: skip_task_completion || false,
      })
      .select(`
        *,
        user:profiles!user_id(id, first_name, last_name, email)
      `)
      .single();

    if (insertError) {
      console.error('Error creating lead activity:', insertError);
      return NextResponse.json(
        { error: 'Failed to create lead activity' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: newActivity }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/leads/[id]/activities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
