import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function getAuthorizedUser(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'project_manager') return null;
  return user;
}

// GET /api/admin/companies/[id]/ai-feedback
// Returns unreviewed negative feedback (not yet promoted to instruction)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getAuthorizedUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId } = await params;

    const { data, error } = await supabase
      .from('ai_feedback')
      .select('*')
      .eq('company_id', companyId)
      .eq('rating', 'negative')
      .eq('promoted_to_instruction', false)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ feedback: data });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

// POST /api/admin/companies/[id]/ai-feedback
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getAuthorizedUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId } = await params;
    const body = await request.json();
    const { feature_type, content_type, rating, notes, original_prompt, content_piece_id } = body;

    if (!feature_type || !rating) {
      return NextResponse.json({ error: 'feature_type and rating are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('ai_feedback')
      .insert({
        company_id: companyId,
        content_piece_id: content_piece_id ?? null,
        feature_type,
        content_type: content_type ?? null,
        rating,
        notes: notes ?? null,
        original_prompt: original_prompt ?? null,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ feedback: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
