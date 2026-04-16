import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendNewProofSlackNotifications } from '@/lib/slack/proof-notifications';

const STORAGE_BUCKET = 'project-files';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/illustrator',
  'application/postscript',
  'image/vnd.adobe.photoshop',
];

/**
 * GET /api/admin/projects/[id]/proofs
 * Returns { proofGroups }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: groups, error: groupsError } = await adminClient
      .from('proof_groups')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: true });

    if (groupsError) {
      return NextResponse.json({ error: 'Failed to fetch proof groups' }, { status: 500 });
    }

    const { data: proofs, error: proofsError } = await adminClient
      .from('project_proofs')
      .select(`
        *,
        uploaded_by_profile:profiles!project_proofs_uploaded_by_fkey(id, first_name, last_name, avatar_url, uploaded_avatar_url)
      `)
      .eq('project_id', projectId)
      .order('version', { ascending: true });

    if (proofsError) {
      return NextResponse.json({ error: 'Failed to fetch proofs' }, { status: 500 });
    }

    const { data: feedbackRows, error: feedbackError } = await adminClient
      .from('proof_feedback')
      .select('proof_id, is_resolved')
      .eq('project_id', projectId);

    if (feedbackError) {
      console.error('Failed to fetch proof feedback stats:', feedbackError);
    }

    const feedbackStatsByProof = new Map<string, { total: number; resolved: number }>();
    for (const feedback of feedbackRows ?? []) {
      const existing = feedbackStatsByProof.get(feedback.proof_id) ?? { total: 0, resolved: 0 };
      existing.total += 1;
      if (feedback.is_resolved) {
        existing.resolved += 1;
      }
      feedbackStatsByProof.set(feedback.proof_id, existing);
    }

    const proofsByGroup = new Map<string, any[]>();
    for (const proof of proofs ?? []) {
      const feedbackStats = feedbackStatsByProof.get(proof.id) ?? { total: 0, resolved: 0 };
      const list = proofsByGroup.get(proof.group_id) ?? [];
      list.push({
        ...proof,
        feedback_total: feedbackStats.total,
        feedback_resolved: feedbackStats.resolved,
      });
      proofsByGroup.set(proof.group_id, list);
    }

    const proofGroups = (groups ?? []).map((group: any) => {
      const groupProofs = proofsByGroup.get(group.id) ?? [];
      const currentProof = groupProofs.find((p) => p.is_current) ?? null;
      const archivedProofs = groupProofs
        .filter((p) => !p.is_current)
        .sort((a, b) => b.version - a.version);
      return { ...group, currentProof, archivedProofs };
    });

    return NextResponse.json({ proofGroups });
  } catch (error) {
    console.error('Error fetching proofs:', error);
    return NextResponse.json({ error: 'Failed to fetch proofs' }, { status: 500 });
  }
}

/**
 * POST /api/admin/projects/[id]/proofs
 * Mode A (no group_id): create new proof group + first proof
 * Mode B (group_id provided): upload new version within existing group
 */
export async function POST(
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

    const body = await request.json();
    const { file_path, file_name, file_size, mime_type, group_id } = body;

    if (!file_path || !file_name || !file_size || !mime_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(mime_type)) {
      return NextResponse.json({ error: `File type ${mime_type} is not allowed` }, { status: 400 });
    }

    if (file_size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 50MB limit' }, { status: 400 });
    }

    const adminClient = createAdminClient();
    let resolvedGroupId: string;

    if (!group_id) {
      // Mode A: new proof group
      const baseName = file_name.replace(/\.[^.]+$/, ''); // strip extension
      const groupName = baseName
        .split(/[-_.\s]+/)
        .filter(Boolean)
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      const { data: newGroup, error: groupError } = await adminClient
        .from('proof_groups')
        .insert({ project_id: projectId, name: groupName })
        .select('id')
        .single();

      if (groupError || !newGroup) {
        console.error('Error creating proof group:', groupError);
        return NextResponse.json({ error: 'Failed to create proof group' }, { status: 500 });
      }

      resolvedGroupId = newGroup.id;
    } else {
      // Mode B: new version within existing group — validate ownership
      const { data: existingGroup, error: groupFetchError } = await adminClient
        .from('proof_groups')
        .select('id')
        .eq('id', group_id)
        .eq('project_id', projectId)
        .single();

      if (groupFetchError || !existingGroup) {
        return NextResponse.json({ error: 'Proof group not found' }, { status: 404 });
      }

      resolvedGroupId = existingGroup.id;

      // Archive current proof within this group only
      await adminClient
        .from('project_proofs')
        .update({ is_current: false })
        .eq('group_id', resolvedGroupId)
        .eq('is_current', true);
    }

    // Get max version within this group
    const { data: versionData } = await adminClient
      .from('project_proofs')
      .select('version')
      .eq('group_id', resolvedGroupId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const nextVersion = (versionData?.version ?? 0) + 1;

    // Insert new proof
    const { data: proof, error: insertError } = await adminClient
      .from('project_proofs')
      .insert({
        project_id: projectId,
        group_id: resolvedGroupId,
        file_path,
        file_name,
        file_size,
        mime_type,
        uploaded_by: user.id,
        is_current: true,
        version: nextVersion,
      })
      .select(`
        *,
        uploaded_by_profile:profiles!project_proofs_uploaded_by_fkey(id, first_name, last_name, avatar_url, uploaded_avatar_url)
      `)
      .single();

    if (insertError || !proof) {
      console.error('Error inserting proof:', insertError);
      return NextResponse.json({ error: 'Failed to create proof' }, { status: 500 });
    }

    // Collect all project members for notifications
    const { data: project } = await adminClient
      .from('projects')
      .select('name, company_id, requested_by, assigned_to, members:project_members(user_id)')
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
      memberSet.delete(user.id);

      const recipientIds = Array.from(memberSet);
      const uploaderProfile = (proof as any).uploaded_by_profile;
      const uploaderName = uploaderProfile
        ? `${uploaderProfile.first_name} ${uploaderProfile.last_name}`
        : 'A team member';

      const deepLinkUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/admin/project-management/${projectId}?tab=proofs&proofId=${proof.id}`;

      // Slack notifications (fire-and-forget)
      sendNewProofSlackNotifications({
        recipientUserIds: recipientIds,
        uploaderName,
        projectName: project.name,
        deepLinkUrl,
      }).catch(() => {});

      // In-app notifications
      if (recipientIds.length > 0 && project.company_id) {
        const notifications = recipientIds.map((recipientId) => ({
          user_id: recipientId,
          company_id: project.company_id,
          type: 'proof_feedback',
          title: `${uploaderName} uploaded a new proof`,
          message: `${uploaderName} uploaded a new proof for project "${project.name}"`,
          reference_id: proof.id,
          reference_type: 'proof',
        }));

        const { error: notifError } = await adminClient
          .from('notifications')
          .insert(notifications);

        if (notifError) {
          console.error('Error creating proof notifications:', notifError);
        }
      }
    }

    return NextResponse.json({ proof }, { status: 201 });
  } catch (error) {
    console.error('Error creating proof:', error);
    return NextResponse.json({ error: 'Failed to create proof' }, { status: 500 });
  }
}
