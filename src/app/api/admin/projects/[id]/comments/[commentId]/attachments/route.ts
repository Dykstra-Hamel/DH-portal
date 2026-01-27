import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';
import { STORAGE_CONFIG, sanitizeFileName } from '@/lib/storage-utils';

// GET /api/admin/projects/[id]/comments/[commentId]/attachments - List attachments
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAuthorized = await isAuthorizedAdmin(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: attachments, error } = await supabase
      .from('comment_attachments')
      .select('*')
      .eq('project_comment_id', commentId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching attachments:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Generate public URLs for attachments
    const attachmentsWithUrls = (attachments || []).map((attachment) => {
      const { data: urlData } = supabase.storage
        .from(STORAGE_CONFIG.BUCKET_NAME)
        .getPublicUrl(attachment.file_path);

      return {
        ...attachment,
        url: urlData.publicUrl,
      };
    });

    return NextResponse.json(attachmentsWithUrls);
  } catch (error) {
    console.error('Error in GET attachments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/projects/[id]/comments/[commentId]/attachments - Upload attachments
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { id: projectId, commentId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAuthorized = await isAuthorizedAdmin(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify the comment exists
    const { data: comment, error: commentError } = await supabase
      .from('project_comments')
      .select('id')
      .eq('id', commentId)
      .eq('project_id', projectId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadedAttachments = [];

    const allowedTypes = STORAGE_CONFIG.ATTACHMENT_ALLOWED_TYPES as readonly string[];

    for (const file of files) {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}` },
          { status: 400 }
        );
      }

      // Validate file size
      if (file.size > STORAGE_CONFIG.MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File too large: ${file.name}` },
          { status: 400 }
        );
      }

      // Generate unique file path
      const timestamp = Date.now();
      const sanitizedName = sanitizeFileName(file.name);
      const filePath = `${STORAGE_CONFIG.CATEGORIES.COMMENT_ATTACHMENTS}/${projectId}/${commentId}/${timestamp}-${sanitizedName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE_CONFIG.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return NextResponse.json(
          { error: `Failed to upload ${file.name}` },
          { status: 500 }
        );
      }

      // Create attachment record
      const { data: attachment, error: insertError } = await supabase
        .from('comment_attachments')
        .insert({
          project_comment_id: commentId,
          file_path: filePath,
          file_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating attachment record:', insertError);
        // Clean up uploaded file
        await supabase.storage
          .from(STORAGE_CONFIG.BUCKET_NAME)
          .remove([filePath]);
        return NextResponse.json(
          { error: 'Failed to create attachment record' },
          { status: 500 }
        );
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(STORAGE_CONFIG.BUCKET_NAME)
        .getPublicUrl(filePath);

      uploadedAttachments.push({
        ...attachment,
        url: urlData.publicUrl,
      });
    }

    return NextResponse.json(uploadedAttachments, { status: 201 });
  } catch (error) {
    console.error('Error in POST attachments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/projects/[id]/comments/[commentId]/attachments?attachmentId=xxx
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const { commentId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const adminAuthorized = await isAuthorizedAdmin(user);
    if (!adminAuthorized) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const attachmentId = searchParams.get('attachmentId');

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'attachmentId is required' },
        { status: 400 }
      );
    }

    // Get attachment to find file path
    const { data: attachment, error: fetchError } = await supabase
      .from('comment_attachments')
      .select('*')
      .eq('id', attachmentId)
      .eq('project_comment_id', commentId)
      .single();

    if (fetchError || !attachment) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Check if user owns the attachment
    if (attachment.uploaded_by !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own attachments' },
        { status: 403 }
      );
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .remove([attachment.file_path]);

    if (storageError) {
      console.error('Error deleting file from storage:', storageError);
    }

    // Delete attachment record
    const { error: deleteError } = await supabase
      .from('comment_attachments')
      .delete()
      .eq('id', attachmentId);

    if (deleteError) {
      console.error('Error deleting attachment record:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete attachment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
