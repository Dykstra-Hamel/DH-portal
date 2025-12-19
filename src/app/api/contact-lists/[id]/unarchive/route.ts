import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/api-utils';

// POST /api/contact-lists/[id]/unarchive - Restore an archived contact list
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: listId } = await params;

    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // Get existing list
    const { data: existingList, error: fetchError } = await queryClient
      .from('contact_lists')
      .select('company_id, name, archived_at')
      .eq('id', listId)
      .single();

    if (fetchError || !existingList) {
      return NextResponse.json({ error: 'Contact list not found' }, { status: 404 });
    }

    // Check if list is actually archived
    if (!existingList.archived_at) {
      return NextResponse.json({ error: 'Contact list is not archived' }, { status: 400 });
    }

    // Check user has permission
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', existingList.company_id)
        .single();

      if (!userCompany || !['admin', 'manager', 'owner'].includes(userCompany.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Unarchive: Set archived_at back to null
    const { data: unarchivedList, error: unarchiveError } = await queryClient
      .from('contact_lists')
      .update({
        archived_at: null,
        archived_by: null
      })
      .eq('id', listId)
      .select()
      .single();

    if (unarchiveError) {
      console.error('Error unarchiving contact list:', unarchiveError);
      return NextResponse.json({ error: 'Failed to unarchive contact list' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Contact list restored successfully',
      list: unarchivedList
    });
  } catch (error) {
    console.error('Error in contact list unarchive:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
