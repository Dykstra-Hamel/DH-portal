import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizeFileName } from '@/lib/storage-utils';

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
 * Upload a new attachment to a project
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

    // Check permissions
    const canEdit = await canEditProject(supabase, projectId, user.id);
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse form data
    let formData;
    try {
      formData = await request.formData();
    } catch (formError) {
      console.error('Error parsing form data:', formError);
      return NextResponse.json(
        { error: 'Invalid form data' },
        { status: 400 }
      );
    }

    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} is not allowed` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Sanitize filename
    const sanitizedName = sanitizeFileName(file.name);
    const timestamp = Date.now();
    const storagePath = `${projectId}/${timestamp}-${sanitizedName}`;

    // Upload to storage
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Create attachment metadata
    const attachmentId = crypto.randomUUID();
    const attachment = {
      id: attachmentId,
      file_path: storagePath,
      file_name: file.name,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: user.id,
      uploaded_at: new Date().toISOString(),
    };

    // Get current attachments
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('attachments')
      .eq('id', projectId)
      .single();

    if (fetchError) {
      // Clean up uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      return NextResponse.json({ error: 'Failed to fetch project' }, { status: 500 });
    }

    // Update attachments array
    const currentAttachments = project.attachments || [];
    const updatedAttachments = [...currentAttachments, attachment];

    const { error: updateError } = await supabase
      .from('projects')
      .update({ attachments: updatedAttachments })
      .eq('id', projectId);

    if (updateError) {
      // Clean up uploaded file
      await supabase.storage.from(STORAGE_BUCKET).remove([storagePath]);
      return NextResponse.json(
        { error: 'Failed to update project attachments' },
        { status: 500 }
      );
    }

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    return NextResponse.json(
      { error: 'Failed to upload attachment' },
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
