import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/api-utils';

// POST /api/contact-lists/[id]/members - Add contacts to list
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
    const { customer_ids, notes } = body;

    if (!customer_ids || !Array.isArray(customer_ids) || customer_ids.length === 0) {
      return NextResponse.json(
        { error: 'customer_ids array is required' },
        { status: 400 }
      );
    }

    // Get contact list
    const { data: list, error: listError } = await queryClient
      .from('contact_lists')
      .select('company_id')
      .eq('id', listId)
      .single();

    if (listError || !list) {
      return NextResponse.json({ error: 'Contact list not found' }, { status: 404 });
    }

    // Check user has permission
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', list.company_id)
        .single();

      if (!userCompany || !['admin', 'manager', 'owner'].includes(userCompany.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Verify all customers belong to the company
    const { data: customers, error: customersError } = await queryClient
      .from('customers')
      .select('id')
      .eq('company_id', list.company_id)
      .in('id', customer_ids);

    if (customersError) {
      console.error('Error verifying customers:', customersError);
      return NextResponse.json({ error: 'Failed to verify customers' }, { status: 500 });
    }

    if (!customers || customers.length !== customer_ids.length) {
      return NextResponse.json(
        { error: 'One or more customer IDs are invalid or do not belong to this company' },
        { status: 400 }
      );
    }

    // Add members
    const members = customer_ids.map((customerId) => ({
      contact_list_id: listId,
      customer_id: customerId,
      notes: notes || null,
      added_by: user.id,
    }));

    const { data: addedMembers, error: addError } = await queryClient
      .from('contact_list_members')
      .insert(members)
      .select();

    if (addError) {
      if (addError.code === '23505') {
        return NextResponse.json(
          { error: 'One or more contacts are already in this list' },
          { status: 409 }
        );
      }
      console.error('Error adding members:', addError);
      return NextResponse.json({ error: 'Failed to add contacts' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      added_count: addedMembers?.length || 0,
      members: addedMembers,
    });
  } catch (error) {
    console.error('Error in contact list members POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
