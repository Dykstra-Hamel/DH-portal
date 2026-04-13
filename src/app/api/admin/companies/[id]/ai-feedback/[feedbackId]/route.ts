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

// PATCH /api/admin/companies/[id]/ai-feedback/[feedbackId]
// Marks a feedback record as promoted_to_instruction = true
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; feedbackId: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getAuthorizedUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId, feedbackId } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.promoted_to_instruction !== undefined) {
      updates.promoted_to_instruction = body.promoted_to_instruction;
    }

    const { data, error } = await supabase
      .from('ai_feedback')
      .update(updates)
      .eq('id', feedbackId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ feedback: data });
  } catch {
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }
}
