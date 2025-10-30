import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ActivityLogParams } from '@/types/activity';

// GET /api/activity - Fetch activities for an entity
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Get query parameters
    const entityType = searchParams.get('entity_type');
    const entityId = searchParams.get('entity_id');
    const activityId = searchParams.get('activity_id');
    const activityType = searchParams.get('activity_type');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Validate required parameters
    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entity_type and entity_id are required' },
        { status: 400 }
      );
    }

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Build query
    let query = supabase
      .from('activity_log')
      .select(
        `
        *,
        user:profiles!activity_log_user_id_fkey (
          id,
          email,
          first_name,
          last_name,
          avatar_url
        )
      `
      )
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);

    // Optional filter by specific activity ID (for realtime updates)
    if (activityId) {
      query = query.eq('id', activityId);
    } else {
      // Only apply ordering and pagination if not fetching a specific activity
      query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    }

    // Optional filter by activity type
    if (activityType) {
      query = query.eq('activity_type', activityType);
    }

    const { data: activities, error } = await query;

    if (error) {
      console.error('Error fetching activities:', error);
      return NextResponse.json(
        { error: 'Failed to fetch activities' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: activities });
  } catch (error) {
    console.error('Error in GET /api/activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/activity - Create a new activity (mainly for notes)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    const {
      company_id,
      entity_type,
      entity_id,
      activity_type,
      field_name,
      old_value,
      new_value,
      user_id,
      notes,
      metadata,
    } = body;

    // Validate required fields
    if (!company_id || !entity_type || !entity_id || !activity_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Insert activity
    const { data: activity, error: insertError } = await supabase
      .from('activity_log')
      .insert({
        company_id,
        entity_type,
        entity_id,
        activity_type,
        field_name: field_name || null,
        old_value: old_value || null,
        new_value: new_value || null,
        user_id: user_id || user.id,
        notes: notes || null,
        metadata: metadata || null,
      })
      .select(
        `
        *,
        user:profiles!activity_log_user_id_fkey (
          id,
          email,
          first_name,
          last_name,
          avatar_url
        )
      `
      )
      .single();

    if (insertError) {
      console.error('Error creating activity:', insertError);
      return NextResponse.json(
        { error: 'Failed to create activity' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: activity }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/activity:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
