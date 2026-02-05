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

    // Get project with attachments to verify access
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        attachments,
        requested_by,
        assigned_to,
        company_id,
        members:project_members(user_id)
      `)
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if user has access to this project
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, company_id')
      .eq('id', user.id)
      .single();

    const hasAccess = (
      profile?.is_admin ||
      project.requested_by === user.id ||
      project.assigned_to === user.id ||
      project.company_id === profile?.company_id ||
      project.members?.some((m: { user_id: string }) => m.user_id === user.id)
    );

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
