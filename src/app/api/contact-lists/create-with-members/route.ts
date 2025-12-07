import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';
import type { NormalizedLeadData } from '@/lib/gemini/csv-parser';

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;
    const body = await request.json();
    const { company_id, name, description, notes, members, campaign_id } = body;

    // Validate required fields
    if (!company_id || !name || !Array.isArray(members)) {
      return NextResponse.json(
        { error: 'company_id, name, and members array are required' },
        { status: 400 }
      );
    }

    // Check user has permission
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', company_id)
        .single();

      if (!userCompany || !['admin', 'manager', 'owner'].includes(userCompany.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);
    const adminSupabase = createAdminClient();

    // Create the contact list
    const { data: list, error: listError } = await queryClient
      .from('contact_lists')
      .insert({
        company_id,
        name: name.trim(),
        description: description?.trim() || null,
        notes: notes?.trim() || null,
        created_by: user.id,
        total_contacts: 0, // Will be updated by trigger
      })
      .select()
      .single();

    if (listError) {
      if (listError.code === '23505') {
        return NextResponse.json(
          { error: 'A contact list with this name already exists' },
          { status: 409 }
        );
      }
      console.error('Error creating contact list:', listError);
      return NextResponse.json(
        { error: 'Failed to create contact list' },
        { status: 500 }
      );
    }

    // Process each contact member
    let newCustomersCount = 0;
    let existingCustomersCount = 0;
    let failedCount = 0;
    const addedCustomerIds: string[] = [];

    for (const contactData of members as NormalizedLeadData[]) {
      try {
        let customerId: string | null = null;

        // Try to find existing customer by email or phone
        if (contactData.email || contactData.phone_number) {
          const query = adminSupabase
            .from('customers')
            .select('id')
            .eq('company_id', company_id);

          if (contactData.email) {
            query.eq('email', contactData.email);
          } else if (contactData.phone_number) {
            query.eq('phone', contactData.phone_number);
          }

          const { data: existingCustomer } = await query.maybeSingle();

          if (existingCustomer) {
            customerId = existingCustomer.id;
            existingCustomersCount++;
          }
        }

        // Create customer if not found
        if (!customerId && (contactData.first_name || contactData.last_name)) {
          const { data: newCustomer, error: customerError } = await adminSupabase
            .from('customers')
            .insert({
              company_id,
              first_name: contactData.first_name || '',
              last_name: contactData.last_name || '',
              email: contactData.email || null,
              phone: contactData.phone_number || null,
              address: contactData.street_address || null,
              city: contactData.city || null,
              state: contactData.state || null,
              zip_code: contactData.zip || null,
            })
            .select('id')
            .single();

          if (customerError) {
            console.error('Error creating customer:', customerError);
            failedCount++;
            continue;
          }

          customerId = newCustomer.id;
          newCustomersCount++;
        }

        // Add to contact list
        if (customerId) {
          const { error: memberError } = await adminSupabase
            .from('contact_list_members')
            .insert({
              contact_list_id: list.id,
              customer_id: customerId,
              added_by: user.id,
            });

          if (memberError) {
            // Ignore duplicate errors (customer already in list)
            if (memberError.code !== '23505') {
              console.error('Error adding list member:', memberError);
              failedCount++;
            }
          } else {
            addedCustomerIds.push(customerId);
          }
        } else {
          failedCount++;
        }

      } catch (error) {
        console.error('Error processing contact:', error);
        failedCount++;
      }
    }

    // Get updated list with total_contacts (updated by trigger)
    const { data: updatedList } = await queryClient
      .from('contact_lists')
      .select('*')
      .eq('id', list.id)
      .single();

    // If campaign_id is provided, assign this list to the campaign
    if (campaign_id && addedCustomerIds.length > 0) {
      // Create assignment
      await adminSupabase
        .from('campaign_contact_list_assignments')
        .insert({
          campaign_id,
          contact_list_id: list.id,
          assigned_by: user.id,
        });

      // Add members to campaign tracking
      const campaignMembers = addedCustomerIds.map(customerId => ({
        contact_list_id: list.id,
        customer_id: customerId,
        campaign_id,
        status: 'pending',
      }));

      const { error: campaignMembersError } = await adminSupabase
        .from('campaign_contact_list_members')
        .insert(campaignMembers);

      if (campaignMembersError) {
        console.error('Error adding campaign members:', campaignMembersError);
        // Don't fail the whole request - the list was created successfully
        // Just return with a warning
        return NextResponse.json({
          success: false,
          error: `List created but failed to assign to campaign: ${campaignMembersError.message}`,
          list: updatedList || list,
          stats: {
            totalProcessed: members.length,
            newCustomers: newCustomersCount,
            existingCustomers: existingCustomersCount,
            failed: failedCount,
          },
        }, { status: 500 });
      }

      // Update campaign total_contacts
      const { count: totalMembersCount } = await queryClient
        .from('campaign_contact_list_members')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign_id);

      await adminSupabase
        .from('campaigns')
        .update({ total_contacts: totalMembersCount || 0 })
        .eq('id', campaign_id);
    }

    return NextResponse.json({
      success: true,
      list: updatedList || list,
      stats: {
        totalProcessed: members.length,
        newCustomers: newCustomersCount,
        existingCustomers: existingCustomersCount,
        failed: failedCount,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error in create contact list with members:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
