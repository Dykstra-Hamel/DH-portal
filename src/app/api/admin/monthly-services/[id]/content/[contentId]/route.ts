import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_CONTENT_TYPES = ['blog', 'evergreen', 'location', 'pillar', 'cluster', 'pest_id', 'other'];

// PATCH /api/admin/monthly-services/[id]/content/[contentId] - Update a content piece
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const supabase = await createClient();
    const { id, contentId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'project_manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { content_type, title, publish_date, link, topic, sort_order } = body;

    if (content_type && !VALID_CONTENT_TYPES.includes(content_type)) {
      return NextResponse.json({ error: 'Invalid content_type' }, { status: 400 });
    }

    const updateData: Record<string, string | number | null> = {};
    if ('content_type' in body) updateData.content_type = content_type || null;
    if ('title' in body) updateData.title = title || null;
    if ('publish_date' in body) updateData.publish_date = publish_date || null;
    if ('link' in body) updateData.link = link || null;
    if ('topic' in body) updateData.topic = topic || null;
    if ('sort_order' in body) updateData.sort_order = typeof sort_order === 'number' ? sort_order : null;

    const { data: contentPiece, error: updateError } = await supabase
      .from('monthly_service_content_pieces')
      .update(updateData)
      .eq('id', contentId)
      .eq('monthly_service_id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update content piece' }, { status: 500 });
    }

    if (!contentPiece) {
      return NextResponse.json({ error: 'Content piece not found' }, { status: 404 });
    }

    return NextResponse.json({ contentPiece });
  } catch (error) {
    console.error('Error in PATCH /api/admin/monthly-services/[id]/content/[contentId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/monthly-services/[id]/content/[contentId] - Delete a content piece
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contentId: string }> }
) {
  try {
    const supabase = await createClient();
    const { id, contentId } = await params;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'project_manager') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('monthly_service_content_pieces')
      .delete()
      .eq('id', contentId)
      .eq('monthly_service_id', id);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete content piece' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/admin/monthly-services/[id]/content/[contentId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
