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

    // Use the new unified activity_log table
    const { data: activities, error } = await supabase
      .from('activity_log')
      .select(`
        *,
        user:profiles!activity_log_user_id_fkey(id, first_name, last_name, email)
      `)
      .eq('entity_type', 'lead')
      .eq('entity_id', leadId)
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

    const { activity_type, notes } = body;

    // Get current user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the lead to get company_id
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('company_id')
      .eq('id', leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!activity_type) {
      return NextResponse.json(
        { error: 'activity_type is required' },
        { status: 400 }
      );
    }

    // Map old activity types to new unified activity type
    // Old: live_call, outbound_call, text_message, ai_call, email
    // New: contact_made (with metadata to specify type)
    const activityTypeMapping: Record<string, string> = {
      'live_call': 'contact_made',
      'outbound_call': 'contact_made',
      'text_message': 'contact_made',
      'ai_call': 'contact_made',
      'email': 'contact_made',
    };

    const mappedActivityType = activityTypeMapping[activity_type] || 'contact_made';

    // Create the activity using the new unified activity_log table
    const { data: newActivity, error: insertError } = await supabase
      .from('activity_log')
      .insert({
        company_id: lead.company_id,
        entity_type: 'lead',
        entity_id: leadId,
        activity_type: mappedActivityType,
        user_id: user.id,
        notes: notes || null,
        metadata: {
          contact_type: activity_type, // Store original type in metadata
        },
      })
      .select(`
        *,
        user:profiles!activity_log_user_id_fkey(id, first_name, last_name, email)
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
