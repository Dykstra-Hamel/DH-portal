import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createAdminClient();

    // First check if the call record exists
    const { data: callRecord, error: fetchError } = await supabase
      .from('call_records')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Error fetching call record:', fetchError);
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Call record not found' }, { status: 404 });
      }
      return NextResponse.json(
        { error: 'Failed to fetch call record' },
        { status: 500 }
      );
    }

    // Delete the call record (admin only - permanent deletion)
    const { error: deleteError } = await supabase
      .from('call_records')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting call record:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete call record' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Call record deleted successfully' 
    });
  } catch (error) {
    console.error('Error in admin call record delete API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}