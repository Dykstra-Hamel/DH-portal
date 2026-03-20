import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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
 * Check if user can edit the project (admin, requestor, assignee, or project member)
 */
async function canEditProject(supabase: any, projectId: string, userId: string): Promise<boolean> {
  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', userId)
    .single();

  if (profile?.is_admin) {
    return true;
  }

  // Check if user is requestor, assignee, or project member
  const { data: project } = await supabase
    .from('projects')
    .select(`
      requested_by,
      assigned_to,
      members:project_members(user_id)
    `)
    .eq('id', projectId)
    .single();

  if (!project) {
    return false;
  }

  return (
    project.requested_by === userId ||
    project.assigned_to === userId ||
    project.members?.some((m: { user_id: string }) => m.user_id === userId)
  );
}

/**
 * GET /api/admin/projects/[id]/attachments
 * List all attachments for a project
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get project with attachments
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('attachments')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      attachments: project.attachments || []
    });
  } catch (error) {
    console.error('Error fetching attachments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/projects/[id]/attachments
 * Save attachment metadata after direct client upload to storage
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Any authenticated user with access to this project (via RLS) can add attachments.
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('attachments')
      .eq('id', projectId)
      .single();
    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Parse JSON body (file(s) already uploaded directly to storage)
    const body = await request.json();
    const files: Array<{
      file_path: string;
      file_name: string;
      file_size: number;
      mime_type: string;
    }> = Array.isArray(body?.files) ? body.files : [body];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    for (const file of files) {
      if (
        !file?.file_path ||
        !file?.file_name ||
        !file?.file_size ||
        !file?.mime_type
      ) {
        return NextResponse.json(
          { error: 'Missing required file fields' },
          { status: 400 }
        );
      }

      if (!ALLOWED_TYPES.includes(file.mime_type)) {
        return NextResponse.json(
          { error: `File type ${file.mime_type} is not allowed` },
          { status: 400 }
        );
      }

      if (file.file_size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
          { status: 400 }
        );
      }
    }

    // Create attachment metadata
    const attachments = files.map((file) => ({
      id: crypto.randomUUID(),
      file_path: file.file_path,
      file_name: file.file_name,
      file_size: file.file_size,
      mime_type: file.mime_type,
      uploaded_by: user.id,
      uploaded_at: new Date().toISOString(),
    }));

    // Update attachments array
    const currentAttachments = project.attachments || [];
    const updatedAttachments = [...currentAttachments, ...attachments];

    const { error: updateError } = await supabase
      .from('projects')
      .update({ attachments: updatedAttachments })
      .eq('id', projectId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update project attachments' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      files.length === 1
        ? { attachment: attachments[0], attachments }
        : { attachments },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving attachment metadata:', error);
    return NextResponse.json(
      { error: 'Failed to save attachment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/projects/[id]/attachments?id={attachmentId}
 * Delete an attachment from a project
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    const canEdit = await canEditProject(supabase, projectId, user.id);
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get attachment ID from query params
    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('id');

    if (!attachmentId) {
      return NextResponse.json({ error: 'Attachment ID required' }, { status: 400 });
    }

    // Get current attachments
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('attachments')
      .eq('id', projectId)
      .single();

    if (fetchError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const currentAttachments = project.attachments || [];
    const attachment = currentAttachments.find((a: any) => a.id === attachmentId);

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([attachment.file_path]);

    if (deleteError) {
      console.error('Storage delete error:', deleteError);
      // Continue anyway - attachment metadata will still be removed
    }

    // Remove from attachments array
    const updatedAttachments = currentAttachments.filter((a: any) => a.id !== attachmentId);

    const { error: updateError } = await supabase
      .from('projects')
      .update({ attachments: updatedAttachments })
      .eq('id', projectId);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update project attachments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting attachment:', error);
    return NextResponse.json(
      { error: 'Failed to delete attachment' },
      { status: 500 }
    );
  }
}
