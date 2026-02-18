import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_CONTENT_TYPES = ['blog', 'evergreen', 'location', 'pillar', 'cluster', 'pest_id', 'other'];

// GET /api/admin/monthly-services/[id]/content - List content pieces for a monthly service
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const taskId = request.nextUrl.searchParams.get('task_id');

    let query = supabase
      .from('monthly_service_content_pieces')
      .select('*')
      .eq('monthly_service_id', id)
      .order('created_at', { ascending: true });

    if (taskId) {
      query = query.eq('task_id', taskId);
    }

    const { data: contentPieces, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch content pieces' }, { status: 500 });
    }

    return NextResponse.json({ contentPieces });
  } catch (error) {
    console.error('Error in GET /api/admin/monthly-services/[id]/content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/admin/monthly-services/[id]/content - Create a new content piece
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

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

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { content_type, title, publish_date, link, task_id, service_month } = body;

    if (content_type && !VALID_CONTENT_TYPES.includes(content_type)) {
      return NextResponse.json({ error: 'Invalid content_type' }, { status: 400 });
    }

    const { data: contentPiece, error: insertError } = await supabase
      .from('monthly_service_content_pieces')
      .insert({
        monthly_service_id: id,
        task_id: task_id || null,
        content_type: content_type || null,
        title: title || null,
        publish_date: publish_date || null,
        link: link || null,
        service_month: service_month || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create content piece' }, { status: 500 });
    }

    return NextResponse.json({ contentPiece }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/admin/monthly-services/[id]/content:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
