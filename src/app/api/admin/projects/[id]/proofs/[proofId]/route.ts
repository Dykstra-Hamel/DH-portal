import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

/**
 * PATCH /api/admin/projects/[id]/proofs/[proofId]
 * Actions:
 *   { action: 'mark_final' }      — set is_final = true (disables new feedback)
 *   { action: 'unmark_final' }    — set is_final = false
 *   { action: 'restore_current' } — make this proof current, archive the current one
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; proofId: string }> }
) {
  try {
    const { id: projectId, proofId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (!['mark_final', 'unmark_final', 'restore_current'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    if (action === 'mark_final') {
      const { data: proof, error } = await adminClient
        .from('project_proofs')
        .update({ is_final: true, updated_at: new Date().toISOString() })
        .eq('id', proofId)
        .eq('project_id', projectId)
        .select(`*, uploaded_by_profile:profiles!project_proofs_uploaded_by_fkey(id, first_name, last_name, avatar_url)`)
        .single();

      if (error || !proof) {
        return NextResponse.json({ error: 'Failed to mark proof as final' }, { status: 500 });
      }
      return NextResponse.json({ proof });
    }

    if (action === 'unmark_final') {
      const { data: proof, error } = await adminClient
        .from('project_proofs')
        .update({ is_final: false, updated_at: new Date().toISOString() })
        .eq('id', proofId)
        .eq('project_id', projectId)
        .select(`*, uploaded_by_profile:profiles!project_proofs_uploaded_by_fkey(id, first_name, last_name, avatar_url)`)
        .single();

      if (error || !proof) {
        return NextResponse.json({ error: 'Failed to unmark proof as final' }, { status: 500 });
      }
      return NextResponse.json({ proof });
    }

    if (action === 'restore_current') {
      // Verify the target proof exists and belongs to this project
      const { data: targetProof, error: targetError } = await adminClient
        .from('project_proofs')
        .select('id, project_id, is_current')
        .eq('id', proofId)
        .eq('project_id', projectId)
        .single();

      if (targetError || !targetProof) {
        return NextResponse.json({ error: 'Proof not found' }, { status: 404 });
      }

      if (targetProof.is_current) {
        return NextResponse.json({ error: 'Proof is already current' }, { status: 400 });
      }

      // Step 1: archive the existing current proof
      await adminClient
        .from('project_proofs')
        .update({ is_current: false, updated_at: new Date().toISOString() })
        .eq('project_id', projectId)
        .eq('is_current', true);

      // Step 2: restore target proof as current
      const { data: proof, error: restoreError } = await adminClient
        .from('project_proofs')
        .update({ is_current: true, updated_at: new Date().toISOString() })
        .eq('id', proofId)
        .select(`*, uploaded_by_profile:profiles!project_proofs_uploaded_by_fkey(id, first_name, last_name, avatar_url)`)
        .single();

      if (restoreError || !proof) {
        return NextResponse.json({ error: 'Failed to restore proof as current' }, { status: 500 });
      }
      return NextResponse.json({ proof });
    }
  } catch (error) {
    console.error('Error updating proof:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/projects/[id]/proofs/[proofId]
 * Permanently deletes a proof and its storage file.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; proofId: string }> }
) {
  try {
    const { id: projectId, proofId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = createAdminClient();

    const { data: proof, error: fetchError } = await adminClient
      .from('project_proofs')
      .select('file_path')
      .eq('id', proofId)
      .eq('project_id', projectId)
      .single();

    if (fetchError || !proof) {
      return NextResponse.json({ error: 'Proof not found' }, { status: 404 });
    }

    // Delete storage file
    await adminClient.storage
      .from('project-files')
      .remove([proof.file_path]);

    // Delete DB record (cascades to feedback)
    const { error: deleteError } = await adminClient
      .from('project_proofs')
      .delete()
      .eq('id', proofId)
      .eq('project_id', projectId);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete proof' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting proof:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
