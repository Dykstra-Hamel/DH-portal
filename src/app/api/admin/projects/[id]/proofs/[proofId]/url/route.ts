import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

/**
 * GET /api/admin/projects/[id]/proofs/[proofId]/url
 * Returns a signed URL redirect for the proof file.
 */
export async function GET(
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

    // RLS on project_proofs enforces access
    const { data: proof, error: proofError } = await supabase
      .from('project_proofs')
      .select('file_path')
      .eq('id', proofId)
      .eq('project_id', projectId)
      .single();

    if (proofError || !proof) {
      return NextResponse.json({ error: 'Proof not found' }, { status: 404 });
    }

    const adminClient = createAdminClient();
    const { data, error } = await adminClient.storage
      .from('project-files')
      .createSignedUrl(proof.file_path, 3600);

    if (error || !data) {
      console.error('Error creating signed URL:', error);
      return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error('Error in proof URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
