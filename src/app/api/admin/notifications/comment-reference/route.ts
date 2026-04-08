import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { isAuthorizedAdminOrPM } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAuthorized = await isAuthorizedAdminOrPM(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminDb = createAdminClient();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const referenceId = searchParams.get('referenceId') || searchParams.get('commentId');

    if (!type || !referenceId) {
      return NextResponse.json(
        { error: 'type and referenceId are required' },
        { status: 400 }
      );
    }

    if (type === 'project_comment') {
      const { data: comment, error } = await adminDb
        .from('project_comments')
        .select('id, project_id')
        .eq('id', referenceId)
        .single();

      if (error || !comment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }

      return NextResponse.json({ projectId: comment.project_id });
    }

    if (type === 'task_comment') {
      const { data: taskComment, error } = await adminDb
        .from('project_task_comments')
        .select('id, task_id')
        .eq('id', referenceId)
        .single();

      if (error || !taskComment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }

      const { data: task, error: taskError } = await adminDb
        .from('project_tasks')
        .select('id, project_id')
        .eq('id', taskComment.task_id)
        .single();

      if (taskError || !task) {
        return NextResponse.json({ error: 'Task not found' }, { status: 404 });
      }

      return NextResponse.json({ projectId: task.project_id, taskId: task.id });
    }

    if (type === 'monthly_service_comment') {
      const { data: comment, error } = await adminDb
        .from('monthly_service_comments')
        .select('id, monthly_service_id')
        .eq('id', referenceId)
        .single();

      if (error || !comment) {
        return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
      }

      return NextResponse.json({ serviceId: comment.monthly_service_id });
    }

    if (type === 'proof') {
      // First try resolving as proof feedback ID
      const { data: feedback } = await adminDb
        .from('proof_feedback')
        .select('id, project_id, proof_id')
        .eq('id', referenceId)
        .maybeSingle();

      if (feedback) {
        return NextResponse.json({
          projectId: feedback.project_id,
          proofId: feedback.proof_id,
          feedbackId: feedback.id,
        });
      }

      // Fallback: resolve as proof ID
      const { data: proof, error: proofError } = await adminDb
        .from('project_proofs')
        .select('id, project_id')
        .eq('id', referenceId)
        .single();

      if (proofError || !proof) {
        return NextResponse.json({ error: 'Proof not found' }, { status: 404 });
      }

      return NextResponse.json({ projectId: proof.project_id, proofId: proof.id });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('Error resolving comment reference:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
