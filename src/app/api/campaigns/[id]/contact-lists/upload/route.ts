import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { getAuthenticatedUser } from '@/lib/api-utils';
import type { NormalizedLeadData } from '@/lib/gemini/csv-parser';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    const body = await request.json();
    const { listName, parsedData } = body;

    if (!listName || !parsedData || !Array.isArray(parsedData)) {
      return NextResponse.json(
        { error: 'listName and parsedData array are required' },
        { status: 400 }
      );
    }

    // Get campaign and verify access
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('company_id, status')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check user has permission (skip for global admins)
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', campaign.company_id)
        .single();

      if (!userCompany || !['admin', 'manager', 'owner'].includes(userCompany.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Don't allow adding to running campaigns
    if (campaign.status === 'running') {
      return NextResponse.json(
        { error: 'Cannot add contact lists to a running campaign' },
        { status: 400 }
      );
    }

    // Use admin client for data operations
    const adminSupabase = createAdminClient();

    // Create contact list
    const { data: contactList, error: listError } = await adminSupabase
      .from('campaign_contact_lists')
      .insert({
        campaign_id: campaignId,
        list_name: listName,
        description: `Uploaded ${parsedData.length} contacts`,
      })
      .select()
      .single();

    if (listError || !contactList) {
      console.error('Error creating contact list:', listError);
      return NextResponse.json(
        { error: 'Failed to create contact list' },
        { status: 500 }
      );
    }

    // Process each contact
    let newCustomersCount = 0;
    let existingCustomersCount = 0;
    let failedCount = 0;

    for (const contactData of parsedData as NormalizedLeadData[]) {
      try {
        let customerId: string | null = null;

        // Try to find existing customer by email or phone
        if (contactData.email || contactData.phone_number) {
          const query = adminSupabase
            .from('customers')
            .select('id')
            .eq('company_id', campaign.company_id);

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
              company_id: campaign.company_id,
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

        // Add to contact list if we have a customer
        if (customerId) {
          const { error: memberError } = await adminSupabase
            .from('campaign_contact_list_members')
            .insert({
              contact_list_id: contactList.id,
              customer_id: customerId,
              status: 'pending',
            });

          if (memberError) {
            console.error('Error adding list member:', memberError);
            failedCount++;
          }
        } else {
          failedCount++;
        }

      } catch (error) {
        console.error('Error processing contact:', error);
        failedCount++;
      }
    }

    // Get updated contact list with final count
    const { data: updatedList } = await adminSupabase
      .from('campaign_contact_lists')
      .select('*')
      .eq('id', contactList.id)
      .single();

    return NextResponse.json({
      success: true,
      contactList: updatedList,
      stats: {
        totalProcessed: parsedData.length,
        newCustomers: newCustomersCount,
        existingCustomers: existingCustomersCount,
        failed: failedCount,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error in contact list upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
