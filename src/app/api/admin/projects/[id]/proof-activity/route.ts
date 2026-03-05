import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/projects/[id]/proof-activity
 * Returns all proof feedback items for the project with their associated proof metadata,
 * ordered by created_at ascending (for merging into the comment feed).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: activity, error } = await supabase
      .from('proof_feedback')
      .select(`
        id,
        proof_id,
        user_id,
        comment,
        pin_number,
        x_percent,
        y_percent,
        page_number,
        is_resolved,
        created_at,
        user_profile:profiles!proof_feedback_user_id_fkey(id, first_name, last_name, avatar_url),
        proof:project_proofs!proof_feedback_proof_id_fkey(id, file_name, version, is_current, mime_type)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch proof activity' }, { status: 500 });
    }

    return NextResponse.json({ activity: activity ?? [] });
  } catch (error) {
    console.error('Error fetching proof activity:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
