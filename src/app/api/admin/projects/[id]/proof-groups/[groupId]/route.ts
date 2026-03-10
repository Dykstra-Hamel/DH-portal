import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

/**
 * PATCH /api/admin/projects/[id]/proof-groups/[groupId]
 * { name: string } — rename the proof group
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; groupId: string }> }
) {
  try {
    const { id: projectId, groupId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data: group, error } = await adminClient
      .from('proof_groups')
      .update({ name: name.trim(), updated_at: new Date().toISOString() })
      .eq('id', groupId)
      .eq('project_id', projectId)
      .select('*')
      .single();

    if (error || !group) {
      return NextResponse.json({ error: 'Failed to rename proof group' }, { status: 500 });
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error('Error renaming proof group:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
