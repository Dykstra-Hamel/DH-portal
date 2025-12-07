import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, supabase } = authResult;

    // Await params (Next.js 15+ requirement)
    const { id } = await params;

    // Get the upload to verify ownership and status
    const { data: upload, error: fetchError } = await supabase
      .from('bulk_lead_uploads')
      .select('id, status, created_by, company_id')
      .eq('id', id)
      .single();

    if (fetchError || !upload) {
      return NextResponse.json(
        { error: 'Upload not found' },
        { status: 404 }
      );
    }

    // Verify user owns this upload
    if (upload.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Only allow cancellation of pending uploads
    if (upload.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot cancel upload with status: ${upload.status}` },
        { status: 400 }
      );
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from('bulk_lead_uploads')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('Error cancelling upload:', updateError);
      return NextResponse.json(
        { error: 'Failed to cancel upload' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Upload cancelled successfully',
    });
  } catch (error) {
    console.error('Error in bulk cancel API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
