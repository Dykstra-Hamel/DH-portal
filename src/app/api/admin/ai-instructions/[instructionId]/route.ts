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

// PATCH /api/admin/ai-instructions/[instructionId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ instructionId: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getAuthorizedUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { instructionId } = await params;
    const body = await request.json();
    const { is_active, instruction_text } = body;

    const updates: Record<string, unknown> = {};
    if (typeof is_active === 'boolean') updates.is_active = is_active;
    if (typeof instruction_text === 'string') updates.instruction_text = instruction_text.trim();

    const { data, error } = await supabase
      .from('ai_standing_instructions')
      .update(updates)
      .eq('id', instructionId)
      .is('company_id', null)
      .select()
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: 'Instruction not found' }, { status: 404 });

    return NextResponse.json({ instruction: data });
  } catch {
    return NextResponse.json({ error: 'Failed to update global instruction' }, { status: 500 });
  }
}

// DELETE /api/admin/ai-instructions/[instructionId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ instructionId: string }> }
) {
  try {
    const supabase = await createClient();
    const user = await getAuthorizedUser(supabase);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { instructionId } = await params;

    const { error } = await supabase
      .from('ai_standing_instructions')
      .delete()
      .eq('id', instructionId)
      .is('company_id', null);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete global instruction' }, { status: 500 });
  }
}
