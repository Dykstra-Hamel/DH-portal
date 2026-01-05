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
    const { customer_ids, members, notes } = body;

    // Support two modes:
    // 1. customer_ids: Add existing customers to list
    // 2. members: Create new customers from CSV data and add to list
    if (!customer_ids && !members) {
      return NextResponse.json(
        { error: 'Either customer_ids or members array is required' },
        { status: 400 }
      );
    }

    if (customer_ids && (!Array.isArray(customer_ids) || customer_ids.length === 0)) {
      return NextResponse.json(
        { error: 'customer_ids must be a non-empty array' },
        { status: 400 }
      );
    }

    if (members && (!Array.isArray(members) || members.length === 0)) {
      return NextResponse.json(
        { error: 'members must be a non-empty array' },
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

    let finalCustomerIds: string[] = [];

    // Handle two modes: existing customer IDs or create new customers from members data
    if (customer_ids) {
      // Mode 1: Verify all customers belong to the company
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

      finalCustomerIds = customer_ids;
    } else if (members) {
      // Mode 2: Create customers from CSV/member data
      const customersToCreate = members.map((member: any) => ({
        company_id: list.company_id,
        first_name: member.first_name || '',
        last_name: member.last_name || '',
        email: member.email || null,
        phone: member.phone_number || member.phone || null,
        address: member.street_address || member.address || null,
        city: member.city || null,
        state: member.state || null,
        zip_code: member.zip || member.zip_code || null,
        customer_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { data: createdCustomers, error: createError } = await queryClient
        .from('customers')
        .insert(customersToCreate)
        .select('id');

      if (createError) {
        console.error('Error creating customers:', createError);
        return NextResponse.json({ error: 'Failed to create customers' }, { status: 500 });
      }

      if (!createdCustomers || createdCustomers.length === 0) {
        return NextResponse.json({ error: 'Failed to create customers' }, { status: 500 });
      }

      finalCustomerIds = createdCustomers.map((c: { id: string }) => c.id);
    }

    // Add members to contact list
    const listMembers = finalCustomerIds.map((customerId) => ({
      contact_list_id: listId,
      customer_id: customerId,
      notes: notes || null,
      added_by: user.id,
    }));

    const { data: addedMembers, error: addError } = await queryClient
      .from('contact_list_members')
      .insert(listMembers)
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
