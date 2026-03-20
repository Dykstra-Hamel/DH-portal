import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

/**
 * GET /api/admin/projects/[id]/attachments/[attachmentId]/url
 * Get a signed URL for a project attachment
 * This endpoint handles authorization at the application level
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  try {
    const { id: projectId, attachmentId } = await params;
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the project using the authenticated user's Supabase client.
    // The projects_select_optimized RLS policy already enforces access control
    // (requested_by, assigned_to, same company via user_companies, or admin role),
    // so if this query returns a row the user is authorized.
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, attachments')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Find the attachment
    const attachments = project.attachments || [];
    const attachment = attachments.find((a: any) => a.id === attachmentId);

    if (!attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 });
    }

    // Use admin client to get signed URL (bypasses RLS)
    const adminSupabase = createAdminClient();
    const { data, error } = await adminSupabase.storage
      .from('project-files')
      .createSignedUrl(attachment.file_path, 3600);

    if (error || !data) {
      console.error('Error creating signed URL:', error);
      return NextResponse.json(
        { error: 'Failed to create signed URL' },
        { status: 500 }
      );
    }

    // Return redirect to signed URL
    return NextResponse.redirect(data.signedUrl);
  } catch (error) {
    console.error('Error in attachment URL:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
