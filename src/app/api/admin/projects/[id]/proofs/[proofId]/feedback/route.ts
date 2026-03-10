import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendProofFeedbackSlackNotifications } from '@/lib/slack/proof-notifications';
import { sendMentionSlackNotifications } from '@/lib/slack/mention-notifications';

// Match data-id attribute in mention spans (handles any attribute order)
function extractMentionedUserIds(html: string): string[] {
  const mentionRegex = /<span[^>]*data-type=["']mention["'][^>]*>/g;
  const idRegex = /data-id=["']([^"']+)["']/;
  const userIds: string[] = [];

  const mentions = html.match(mentionRegex) || [];
  for (const mention of mentions) {
    const idMatch = mention.match(idRegex);
    if (idMatch && idMatch[1] && !userIds.includes(idMatch[1])) {
      userIds.push(idMatch[1]);
    }
  }

  return userIds;
}

/**
 * GET /api/admin/projects/[id]/proofs/[proofId]/feedback
 * Returns all feedback for a proof ordered by pin_number.
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

    const { data: feedback, error: feedbackError } = await supabase
      .from('proof_feedback')
      .select(`
        *,
        user_profile:profiles!proof_feedback_user_id_fkey(id, first_name, last_name, avatar_url)
      `)
      .eq('proof_id', proofId)
      .eq('project_id', projectId)
      .order('pin_number', { ascending: true });

    if (feedbackError) {
      return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
    }

    return NextResponse.json({ feedback: feedback ?? [] });
  } catch (error) {
    console.error('Error fetching proof feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

/**
 * POST /api/admin/projects/[id]/proofs/[proofId]/feedback
 * Any project member (including clients) can post feedback.
 */
export async function POST(
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

    // Verify user has access to this proof (RLS enforces project membership)
    const { data: proof, error: proofError } = await supabase
      .from('project_proofs')
      .select('project_id')
      .eq('id', proofId)
      .single();

    if (proofError || !proof) {
      return NextResponse.json({ error: 'Proof not found or access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { x_percent = null, y_percent = null, page_number = 1, comment } = body;

    if (!comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate coordinates only when provided
    if (x_percent !== null && (x_percent < 0 || x_percent > 1)) {
      return NextResponse.json({ error: 'x_percent must be between 0 and 1' }, { status: 400 });
    }
    if (y_percent !== null && (y_percent < 0 || y_percent > 1)) {
      return NextResponse.json({ error: 'y_percent must be between 0 and 1' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Get next pin number for this proof
    const { data: maxPinData } = await adminClient
      .from('proof_feedback')
      .select('pin_number')
      .eq('proof_id', proofId)
      .order('pin_number', { ascending: false })
      .limit(1)
      .single();

    const nextPinNumber = (maxPinData?.pin_number ?? 0) + 1;

    const { data: feedbackRow, error: insertError } = await adminClient
      .from('proof_feedback')
      .insert({
        proof_id: proofId,
        project_id: projectId,
        user_id: user.id,
        x_percent,
        y_percent,
        page_number,
        comment,
        pin_number: nextPinNumber,
      })
      .select(`
        *,
        user_profile:profiles!proof_feedback_user_id_fkey(id, first_name, last_name, avatar_url)
      `)
      .single();

    if (insertError || !feedbackRow) {
      console.error('Error inserting feedback:', insertError);
      return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 });
    }

    // Collect all project members for notifications
    const { data: project } = await adminClient
      .from('projects')
      .select('name, company_id, company:companies(name), requested_by, assigned_to, members:project_members(user_id)')
      .eq('id', projectId)
      .single();

    if (project) {
      const memberSet = new Set<string>(
        [
          project.requested_by,
          project.assigned_to,
          ...(project.members ?? []).map((m: { user_id: string }) => m.user_id),
        ].filter(Boolean)
      );
      const recipientIds = Array.from(memberSet);
      const mentionedUserIds = extractMentionedUserIds(comment).filter((id) => id !== user.id);
      const mentionedUserIdSet = new Set(mentionedUserIds);
      // Mentioned users should only get the mention notification (not the member-wide proof feedback notification).
      const broadcastRecipientIds = recipientIds.filter((recipientId) => !mentionedUserIdSet.has(recipientId));
      const authorProfile = (feedbackRow as any).user_profile;
      const authorName = authorProfile
        ? `${authorProfile.first_name} ${authorProfile.last_name}`
        : 'A team member';

      const deepLinkUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin/project-management/${projectId}?tab=proofs&proofId=${proofId}`;

      // Slack notifications (fire-and-forget)
      sendProofFeedbackSlackNotifications({
        recipientUserIds: broadcastRecipientIds,
        authorName,
        projectName: project.name,
        clientName: (project.company as { name?: string } | null)?.name || null,
        comment,
        deepLinkUrl,
      }).catch(() => {});

      // In-app notifications
      if (broadcastRecipientIds.length > 0 && project.company_id) {
        const notifications = broadcastRecipientIds.map((recipientId) => ({
          user_id: recipientId,
          company_id: project.company_id,
          type: 'proof_feedback',
          title: `${authorName} left proof feedback`,
          message: `${authorName} left feedback on a proof for project "${project.name}"`,
          reference_id: feedbackRow.id,
          reference_type: 'proof',
        }));

        const { error: notifError } = await adminClient
          .from('notifications')
          .insert(notifications);

        if (notifError) {
          console.error('Error creating proof feedback notifications:', notifError);
        }
      }

      // Mention notifications for explicitly tagged users
      if (mentionedUserIds.length > 0 && project.company_id) {
        const mentionNotifications = mentionedUserIds.map((mentionedUserId) => ({
          user_id: mentionedUserId,
          company_id: project.company_id,
          type: 'mention',
          title: `${authorName} mentioned you`,
          message: `${authorName} mentioned you in proof feedback on project "${project.name}"`,
          reference_id: feedbackRow.id,
          reference_type: 'proof',
        }));

        const { error: mentionNotifError } = await adminClient
          .from('notifications')
          .insert(mentionNotifications);

        if (mentionNotifError) {
          console.error('Error creating proof mention notifications:', mentionNotifError);
        }

        sendMentionSlackNotifications({
          mentionedUserIds,
          commenterName: authorName,
          contextType: 'project',
          contextName: project.name,
          clientName: (project.company as { name?: string } | null)?.name || null,
          commentText: comment,
          deepLinkUrl: `${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin/project-management/${projectId}?tab=proofs&proofId=${proofId}&proofFeedbackId=${feedbackRow.id}`,
        }).catch(() => {});
      }
    }

    return NextResponse.json({ feedback: feedbackRow }, { status: 201 });
  } catch (error) {
    console.error('Error creating proof feedback:', error);
    return NextResponse.json({ error: 'Failed to create feedback' }, { status: 500 });
  }
}
