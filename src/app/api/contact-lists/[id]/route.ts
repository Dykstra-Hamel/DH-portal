import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/api-utils';

// GET /api/contact-lists/[id] - Get contact list details with members
export async function GET(
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

    // Get contact list
    const { data: list, error: listError } = await queryClient
      .from('contact_lists')
      .select('*')
      .eq('id', listId)
      .single();

    if (listError || !list) {
      return NextResponse.json({ error: 'Contact list not found' }, { status: 404 });
    }

    // Check user has access
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('company_id', list.company_id)
        .single();

      if (!userCompany) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Get members with customer details
    const { data: members, error: membersError } = await queryClient
      .from('contact_list_members')
      .select(`
        id,
        notes,
        added_at,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('contact_list_id', listId)
      .order('added_at', { ascending: false });

    if (membersError) {
      console.error('Error fetching members:', membersError);
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }

    // Get campaigns using this list
    const { data: campaigns, error: campaignsError } = await queryClient
      .from('campaign_contact_list_assignments')
      .select(`
        assigned_at,
        campaign:campaigns(
          id,
          name,
          status,
          start_datetime
        )
      `)
      .eq('contact_list_id', listId)
      .order('assigned_at', { ascending: false });

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
    }

    return NextResponse.json({
      success: true,
      list: {
        ...list,
        members: members || [],
        campaigns: campaigns || [],
      },
    });
  } catch (error) {
    console.error('Error in contact list GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/contact-lists/[id] - Update contact list
export async function PATCH(
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
    const { name, description, notes } = body;

    // Get existing list
    const { data: existingList, error: fetchError } = await queryClient
      .from('contact_lists')
      .select('company_id')
      .eq('id', listId)
      .single();

    if (fetchError || !existingList) {
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

    // Build update object
    const updates: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (notes !== undefined) updates.notes = notes?.trim() || null;

    // Update list
    const { data: list, error: updateError } = await queryClient
      .from('contact_lists')
      .update(updates)
      .eq('id', listId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'A contact list with this name already exists' },
          { status: 409 }
        );
      }
      console.error('Error updating contact list:', updateError);
      return NextResponse.json({ error: 'Failed to update contact list' }, { status: 500 });
    }

    return NextResponse.json({ success: true, list });
  } catch (error) {
    console.error('Error in contact list PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/contact-lists/[id] - Delete contact list
export async function DELETE(
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
      .select('company_id, name')
      .eq('id', listId)
      .single();

    if (fetchError || !existingList) {
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

    // Soft delete: Update archived_at instead of deleting
    // This preserves historical campaign data, landing pages, and execution tracking
    const { data: archivedList, error: archiveError } = await queryClient
      .from('contact_lists')
      .update({
        archived_at: new Date().toISOString(),
        archived_by: user.id
      })
      .eq('id', listId)
      .select()
      .single();

    if (archiveError) {
      console.error('Error archiving contact list:', archiveError);
      return NextResponse.json({ error: 'Failed to archive contact list' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Contact list archived successfully',
      list: archivedList
    });
  } catch (error) {
    console.error('Error in contact list DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
