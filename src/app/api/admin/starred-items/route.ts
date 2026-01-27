import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { StarredItem, CreateStarredItemRequest, DeleteStarredItemRequest } from '@/types/starred';

// GET - Fetch all starred items for the current user
export async function GET() {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch starred items for this user
    const { data, error } = await supabase
      .from('starred_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching starred items:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data as StarredItem[]);
  } catch (error) {
    console.error('Error in GET /api/admin/starred-items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Star an item (project or task)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateStarredItemRequest = await request.json();
    const { item_type, item_id } = body;

    // Validate input
    if (!item_type || !item_id) {
      return NextResponse.json(
        { error: 'item_type and item_id are required' },
        { status: 400 }
      );
    }

    if (item_type !== 'project' && item_type !== 'task') {
      return NextResponse.json(
        { error: 'item_type must be either "project" or "task"' },
        { status: 400 }
      );
    }

    // Insert starred item
    const { data, error } = await supabase
      .from('starred_items')
      .insert({
        user_id: user.id,
        item_type,
        item_id,
      })
      .select()
      .single();

    if (error) {
      // Handle duplicate star attempt (unique constraint violation)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Item is already starred' },
          { status: 409 }
        );
      }
      console.error('Error creating starred item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data as StarredItem, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/starred-items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Unstar an item
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: DeleteStarredItemRequest = await request.json();
    const { item_type, item_id } = body;

    // Validate input
    if (!item_type || !item_id) {
      return NextResponse.json(
        { error: 'item_type and item_id are required' },
        { status: 400 }
      );
    }

    // Delete starred item
    const { error } = await supabase
      .from('starred_items')
      .delete()
      .eq('user_id', user.id)
      .eq('item_type', item_type)
      .eq('item_id', item_id);

    if (error) {
      console.error('Error deleting starred item:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/admin/starred-items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
