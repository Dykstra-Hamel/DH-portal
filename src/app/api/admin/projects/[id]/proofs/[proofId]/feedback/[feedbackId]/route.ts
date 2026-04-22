import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendProofFeedbackResolvedSlackNotification } from '@/lib/slack/proof-notifications';

interface ProjectAccessRow {
  name: string;
  company_id: string | null;
  requested_by: string | null;
  assigned_to: string | null;
  members?: Array<{ user_id: string }> | null;
}

interface ActorProfileRow {
  first_name: string | null;
  last_name: string | null;
  role: string | null;
  is_admin: boolean | null;
}

function getDisplayName(profile: Pick<ActorProfileRow, 'first_name' | 'last_name'> | null): string {
  const first = profile?.first_name?.trim() ?? '';
  const last = profile?.last_name?.trim() ?? '';
  const fullName = `${first} ${last}`.trim();
  return fullName || 'A team member';
}

function hasProjectAccess(project: ProjectAccessRow, userId: string, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  if (project.requested_by === userId) return true;
  if (project.assigned_to === userId) return true;
  return Boolean(project.members?.some((member) => member.user_id === userId));
}

/**
 * PATCH /api/admin/projects/[id]/proofs/[proofId]/feedback/[feedbackId]
 * Any project-access user can toggle is_resolved.
 * Only author/admin can edit comment.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; proofId: string; feedbackId: string }> }
) {
  try {
    const { id: projectId, proofId, feedbackId } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const updates: Record<string, any> = {};

    if (typeof body.is_resolved === 'boolean') {
      updates.is_resolved = body.is_resolved;
    }
    if (typeof body.comment === 'string' && body.comment.trim()) {
      updates.comment = body.comment.trim();
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const [projectResult, actorProfileResult, existingFeedbackResult] = await Promise.all([
      adminClient
        .from('projects')
        .select('name, company_id, requested_by, assigned_to, members:project_members(user_id)')
        .eq('id', projectId)
        .single<ProjectAccessRow>(),
      adminClient
        .from('profiles')
        .select('first_name, last_name, role, is_admin')
        .eq('id', user.id)
        .single<ActorProfileRow>(),
      adminClient
        .from('proof_feedback')
        .select('id, project_id, proof_id, user_id, is_resolved, comment')
        .eq('id', feedbackId)
        .eq('project_id', projectId)
        .eq('proof_id', proofId)
        .single<{
          id: string;
          project_id: string;
          proof_id: string;
          user_id: string;
          is_resolved: boolean;
          comment: string;
        }>(),
    ]);

    const project = projectResult.data;
    if (projectResult.error || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const actorProfile = actorProfileResult.data ?? null;
    const isAdmin = Boolean(actorProfile?.is_admin) || actorProfile?.role === 'admin';
    if (!hasProjectAccess(project, user.id, isAdmin)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const existingFeedback = existingFeedbackResult.data;
    if (existingFeedbackResult.error || !existingFeedback) {
      return NextResponse.json({ error: 'Feedback not found' }, { status: 404 });
    }

    const isAuthor = existingFeedback.user_id === user.id;
    if (typeof updates.comment === 'string' && !isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: 'Only the feedback author or an admin can edit comment text' },
        { status: 403 }
      );
    }

    updates.updated_at = new Date().toISOString();

    const { data: feedback, error: updateError } = await adminClient
      .from('proof_feedback')
      .update(updates)
      .eq('id', feedbackId)
      .eq('project_id', projectId)
      .eq('proof_id', proofId)
      .select(`
        *,
        user_profile:profiles!proof_feedback_user_id_fkey(id, first_name, last_name, avatar_url, uploaded_avatar_url)
      `)
      .single();

    if (updateError || !feedback) {
      return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
    }

    const wasResolved = existingFeedback.is_resolved === true;
    const isNowResolved = feedback.is_resolved === true;
    const shouldNotifyAuthor = !wasResolved && isNowResolved && feedback.user_id !== user.id;

    if (shouldNotifyAuthor) {
      const resolverName = getDisplayName(actorProfile);
      const deepLinkUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin/project-management/${projectId}?tab=proofs&proofId=${proofId}&proofFeedbackId=${feedback.id}`;

      if (project.company_id) {
        const { error: notificationError } = await adminClient
          .from('notifications')
          .insert({
            user_id: feedback.user_id,
            company_id: project.company_id,
            type: 'proof_feedback',
            title: `${resolverName} resolved your proof feedback`,
            message: `${resolverName} resolved your feedback on project "${project.name}"`,
            reference_id: feedback.id,
            reference_type: 'proof',
          });

        if (notificationError) {
          console.error('Error creating proof feedback resolved notification:', notificationError);
        }
      }

      sendProofFeedbackResolvedSlackNotification({
        recipientUserId: feedback.user_id,
        resolverName,
        projectName: project.name,
        feedbackComment: feedback.comment || existingFeedback.comment || '',
        deepLinkUrl,
      }).catch(() => {});
    }

    return NextResponse.json({ feedback });
  } catch (error) {
    console.error('Error updating proof feedback:', error);
    return NextResponse.json({ error: 'Failed to update feedback' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/projects/[id]/proofs/[proofId]/feedback/[feedbackId]
 * Hard-delete. RLS enforces author-or-admin.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; proofId: string; feedbackId: string }> }
) {
  try {
    const { feedbackId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // RLS policy author_or_admin_can_delete_proof_feedback enforces access
    const { error: deleteError } = await supabase
      .from('proof_feedback')
      .delete()
      .eq('id', feedbackId);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete feedback or access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting proof feedback:', error);
    return NextResponse.json({ error: 'Failed to delete feedback' }, { status: 500 });
  }
}
