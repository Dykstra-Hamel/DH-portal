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

// PATCH /api/admin/companies/[id]/ai-instructions/[instructionId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; instructionId: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getAuthorizedUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId, instructionId } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.instruction_text !== undefined) updates.instruction_text = body.instruction_text.trim();

    const { data, error } = await supabase
      .from('ai_standing_instructions')
      .update(updates)
      .eq('id', instructionId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ instruction: data });
  } catch {
    return NextResponse.json({ error: 'Failed to update instruction' }, { status: 500 });
  }
}

// DELETE /api/admin/companies/[id]/ai-instructions/[instructionId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; instructionId: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getAuthorizedUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: companyId, instructionId } = await params;

    const { error } = await supabase
      .from('ai_standing_instructions')
      .delete()
      .eq('id', instructionId)
      .eq('company_id', companyId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete instruction' }, { status: 500 });
  }
}
