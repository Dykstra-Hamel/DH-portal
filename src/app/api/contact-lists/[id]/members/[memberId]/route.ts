import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/api-utils';

// DELETE /api/contact-lists/[id]/members/[memberId] - Remove contact from list
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: listId, memberId } = await params;

    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // Get member to verify it exists and get list info
    const { data: member, error: memberError } = await queryClient
      .from('contact_list_members')
      .select('contact_list_id, contact_lists(company_id)')
      .eq('id', memberId)
      .eq('contact_list_id', listId)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const companyId = (member as any).contact_lists?.company_id;

    if (!companyId) {
      return NextResponse.json({ error: 'Invalid list data' }, { status: 500 });
    }

    // Check user has permission
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (!userCompany || !['admin', 'manager', 'owner'].includes(userCompany.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Delete member
    const { error: deleteError } = await queryClient
      .from('contact_list_members')
      .delete()
      .eq('id', memberId);

    if (deleteError) {
      console.error('Error deleting member:', deleteError);
      return NextResponse.json({ error: 'Failed to remove contact' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in member DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/contact-lists/[id]/members/[memberId] - Update member notes
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: listId, memberId } = await params;

    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    const body = await request.json();
    const { notes } = body;

    // Get member to verify it exists and get list info
    const { data: member, error: memberError } = await queryClient
      .from('contact_list_members')
      .select('contact_list_id, contact_lists(company_id)')
      .eq('id', memberId)
      .eq('contact_list_id', listId)
      .single();

    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const companyId = (member as any).contact_lists?.company_id;

    if (!companyId) {
      return NextResponse.json({ error: 'Invalid list data' }, { status: 500 });
    }

    // Check user has permission
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', companyId)
        .single();

      if (!userCompany || !['admin', 'manager', 'owner'].includes(userCompany.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Update member notes
    const { data: updatedMember, error: updateError } = await queryClient
      .from('contact_list_members')
      .update({ notes: notes?.trim() || null })
      .eq('id', memberId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating member:', updateError);
      return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
    }

    return NextResponse.json({ success: true, member: updatedMember });
  } catch (error) {
    console.error('Error in member PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
