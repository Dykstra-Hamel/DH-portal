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

// GET /api/admin/companies/[id]/ai-instructions
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
      .from('ai_standing_instructions')
      .select('*')
      .eq('company_id', companyId)
      .order('scope')
      .order('content_type', { nullsFirst: true })
      .order('created_at');

    if (error) throw error;

    return NextResponse.json({ instructions: data });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch instructions' }, { status: 500 });
  }
}

// POST /api/admin/companies/[id]/ai-instructions
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
    const { scope, content_type, instruction_text, source } = body;

    if (!instruction_text?.trim()) {
      return NextResponse.json({ error: 'instruction_text is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('ai_standing_instructions')
      .insert({
        company_id: companyId,
        scope: scope ?? 'all',
        content_type: content_type ?? null,
        instruction_text: instruction_text.trim(),
        source: source ?? 'manual',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ instruction: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Failed to create instruction' }, { status: 500 });
  }
}
