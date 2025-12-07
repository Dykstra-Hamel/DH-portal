import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/api-utils';

// POST /api/contact-lists/[id]/duplicate - Duplicate a contact list
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

    const body = await request.json();
    const { new_name } = body;

    // Get existing list
    const { data: existingList, error: listError } = await queryClient
      .from('contact_lists')
      .select('*')
      .eq('id', listId)
      .single();

    if (listError || !existingList) {
      return NextResponse.json({ error: 'Contact list not found' }, { status: 404 });
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

    // Determine new list name
    const listName = new_name || `${existingList.name} (Copy)`;

    // Create new list
    const { data: newList, error: createError } = await queryClient
      .from('contact_lists')
      .insert({
        company_id: existingList.company_id,
        name: listName,
        description: existingList.description,
        notes: existingList.notes,
        created_by: user.id,
      })
      .select()
      .single();

    if (createError) {
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: 'A contact list with this name already exists' },
          { status: 409 }
        );
      }
      console.error('Error creating duplicate list:', createError);
      return NextResponse.json({ error: 'Failed to duplicate list' }, { status: 500 });
    }

    // Get existing members
    const { data: existingMembers, error: membersError } = await queryClient
      .from('contact_list_members')
      .select('customer_id, notes')
      .eq('contact_list_id', listId);

    if (membersError) {
      console.error('Error fetching existing members:', membersError);
      // Don't fail, just return the new list without members
      return NextResponse.json({
        success: true,
        list: newList,
        warning: 'List created but members could not be copied',
      });
    }

    // Copy members to new list
    if (existingMembers && existingMembers.length > 0) {
      const newMembers = existingMembers.map((member: { customer_id: string; notes: string | null }) => ({
        contact_list_id: newList.id,
        customer_id: member.customer_id,
        notes: member.notes,
        added_by: user.id,
      }));

      const { error: copyError } = await queryClient
        .from('contact_list_members')
        .insert(newMembers);

      if (copyError) {
        console.error('Error copying members:', copyError);
        return NextResponse.json({
          success: true,
          list: newList,
          warning: 'List created but some members could not be copied',
        });
      }
    }

    return NextResponse.json({ success: true, list: newList });
  } catch (error) {
    console.error('Error in duplicate POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
