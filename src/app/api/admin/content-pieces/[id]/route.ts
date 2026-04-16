import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_CONTENT_TYPES = ['blog', 'evergreen', 'location', 'pillar', 'cluster', 'pest_id', 'other'];

// GET /api/admin/content-pieces/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
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

    const { data: piece, error: pieceError } = await supabase
      .from('monthly_service_content_pieces')
      .select(`
        *,
        monthly_services (
          id,
          service_name,
          company_id,
          companies ( id, name )
        ),
        content_task:project_tasks!task_id (
          id,
          title,
          is_completed,
          due_date,
          assigned_to,
          profiles:assigned_to ( id, first_name, last_name, email, avatar_url, uploaded_avatar_url )
        ),
        social_media_task:project_tasks!social_media_task_id (
          id,
          title,
          is_completed,
          due_date,
          assigned_to,
          profiles:assigned_to ( id, first_name, last_name, email, avatar_url, uploaded_avatar_url )
        )
      `)
      .eq('id', id)
      .single();

    if (pieceError || !piece) {
      return NextResponse.json({ error: 'Content piece not found' }, { status: 404 });
    }

    const service = piece.monthly_services as any;
    const task = (piece as any).content_task as any;
    const socialTask = (piece as any).social_media_task as any;

    const result = {
      id: piece.id,
      monthly_service_id: piece.monthly_service_id,
      task_id: piece.task_id,
      content_type: piece.content_type,
      title: piece.title,
      publish_date: piece.publish_date,
      link: piece.link,
      notes: piece.notes ?? null,
      google_doc_link: (piece as any).google_doc_link ?? null,
      topic: (piece as any).topic ?? null,
      ai_topics:    (piece as any).ai_topics    ?? null,
      ai_headlines: (piece as any).ai_headlines ?? null,
      ai_draft:     (piece as any).ai_draft     ?? null,
      content:      (piece as any).content      ?? null,
      is_completed: piece.is_completed,
      service_month: piece.service_month,
      created_at: piece.created_at,
      updated_at: piece.updated_at,
      service_id: service?.id ?? null,
      service_name: service?.service_name ?? null,
      company_id: service?.company_id ?? null,
      company_name: (service?.companies as any)?.name ?? null,
      task_title: task?.title ?? null,
      task_is_completed: task?.is_completed ?? null,
      task_due_date: task?.due_date ?? null,
      task_assigned_to: task?.assigned_to ?? null,
      task_assignee_name: task?.profiles
        ? `${(task.profiles as any).first_name ?? ''} ${(task.profiles as any).last_name ?? ''}`.trim() || null
        : null,
      task_assignee_email: task?.profiles ? (task.profiles as any).email ?? null : null,
      task_assignee_avatar_url: task?.profiles ? (task.profiles as any).uploaded_avatar_url || (task.profiles as any).avatar_url ?? null : null,
      social_media_task_id: (piece as any).social_media_task_id ?? null,
      social_media_task_title: socialTask?.title ?? null,
      social_media_task_is_completed: socialTask?.is_completed ?? null,
      social_media_task_due_date: socialTask?.due_date ?? null,
      social_media_task_assigned_to: socialTask?.assigned_to ?? null,
      social_media_task_assignee_name: socialTask?.profiles
        ? `${(socialTask.profiles as any).first_name ?? ''} ${(socialTask.profiles as any).last_name ?? ''}`.trim() || null
        : null,
      social_media_task_assignee_email: socialTask?.profiles ? (socialTask.profiles as any).email ?? null : null,
      social_media_task_assignee_avatar_url: socialTask?.profiles ? (socialTask.profiles as any).uploaded_avatar_url || (socialTask.profiles as any).avatar_url ?? null : null,
    };

    return NextResponse.json({ contentPiece: result });
  } catch (error) {
    console.error('Error in GET /api/admin/content-pieces/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/content-pieces/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();
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
    const { content_type, title, publish_date, link, notes, google_doc_link, topic, content } = body;

    if (content_type && !VALID_CONTENT_TYPES.includes(content_type)) {
      return NextResponse.json({ error: 'Invalid content_type' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if ('content_type' in body) updateData.content_type = content_type || null;
    if ('title' in body) updateData.title = title || null;
    if ('publish_date' in body) updateData.publish_date = publish_date || null;
    if ('link' in body) updateData.link = link || null;
    if ('notes' in body) updateData.notes = notes || null;
    if ('google_doc_link' in body) updateData.google_doc_link = google_doc_link || null;
    if ('topic' in body) updateData.topic = topic ?? null;
    if ('ai_topics'    in body) updateData.ai_topics    = body.ai_topics    ?? null;
    if ('ai_headlines' in body) updateData.ai_headlines = body.ai_headlines ?? null;
    if ('ai_draft'     in body) updateData.ai_draft     = body.ai_draft     ?? null;
    if ('content'      in body) updateData.content      = content          ?? null;

    const { data: contentPiece, error: updateError } = await supabase
      .from('monthly_service_content_pieces')
      .update(updateData)
      .eq('id', id)
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
    console.error('Error in PATCH /api/admin/content-pieces/[id]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
