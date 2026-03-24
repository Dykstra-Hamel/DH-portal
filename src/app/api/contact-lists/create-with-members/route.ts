import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';
import type { NormalizedLeadData } from '@/lib/gemini/csv-parser';
import {
  createOrFindServiceAddress,
  linkCustomerToServiceAddress,
} from '@/lib/service-addresses';

async function runInChunks<T, R>(
  items: T[],
  chunkSize: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(chunk.map(fn));
    results.push(...chunkResults);
  }
  return results;
}

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

    const typedMembers = members as NormalizedLeadData[];

    // --- Step 1: Batch email lookup (1 query instead of N) ---
    const emails = [...new Set(typedMembers.map(m => m.email).filter(Boolean) as string[])];
    const emailToCustomerId = new Map<string, string>();

    if (emails.length > 0) {
      const { data: emailMatches } = await adminSupabase
        .from('customers')
        .select('id, email')
        .eq('company_id', company_id)
        .in('email', emails);

      for (const row of emailMatches ?? []) {
        if (row.email) emailToCustomerId.set(row.email, row.id);
      }
    }

    // --- Step 2: Batch phone lookup for unmatched members (1 query instead of N) ---
    const unmatchedPhones = [...new Set(
      typedMembers
        .filter(m => !emailToCustomerId.get(m.email ?? ''))
        .map(m => m.phone_number)
        .filter(Boolean) as string[]
    )];
    const phoneToCustomerId = new Map<string, string>();

    if (unmatchedPhones.length > 0) {
      const { data: phoneMatches } = await adminSupabase
        .from('customers')
        .select('id, phone')
        .eq('company_id', company_id)
        .in('phone', unmatchedPhones);

      for (const row of phoneMatches ?? []) {
        if (row.phone) phoneToCustomerId.set(row.phone, row.id);
      }
    }

    // --- Step 3: Batch insert new customers (1 insert instead of N) ---
    // Deduplicate by email → phone → name to avoid constraint violations
    const seenCreateKeys = new Set<string>();
    const toCreate = typedMembers.filter(m => {
      if (emailToCustomerId.get(m.email ?? '') || phoneToCustomerId.get(m.phone_number ?? '')) return false;
      if (!m.first_name && !m.last_name) return false;
      const key = m.email ?? m.phone_number ?? `${m.first_name}:${m.last_name}`;
      if (seenCreateKeys.has(key)) return false;
      seenCreateKeys.add(key);
      return true;
    });

    const newCustomerEmailMap = new Map<string, string>(); // email → id
    const newCustomerPhoneMap = new Map<string, string>(); // phone → id

    if (toCreate.length > 0) {
      const { data: newCustomers, error: insertError } = await adminSupabase
        .from('customers')
        .insert(
          toCreate.map(m => ({
            company_id,
            first_name: m.first_name || '',
            last_name: m.last_name || '',
            email: m.email || null,
            phone: m.phone_number || null,
            address: m.street_address || null,
            city: m.city || null,
            state: m.state || null,
            zip_code: m.zip || null,
          }))
        )
        .select('id, email, phone');

      if (insertError) {
        console.error('Error batch-inserting customers:', insertError);
      } else {
        for (const row of newCustomers ?? []) {
          if (row.email) newCustomerEmailMap.set(row.email, row.id);
          if (row.phone) newCustomerPhoneMap.set(row.phone, row.id);
        }
      }
    }

    // Resolve customer ID + isNew flag for a single member
    function resolveCustomerId(m: NormalizedLeadData): [string | null, boolean] {
      if (m.email) {
        const existing = emailToCustomerId.get(m.email);
        if (existing) return [existing, false];
        const created = newCustomerEmailMap.get(m.email);
        if (created) return [created, true];
      }
      if (m.phone_number) {
        const existing = phoneToCustomerId.get(m.phone_number);
        if (existing) return [existing, false];
        const created = newCustomerPhoneMap.get(m.phone_number);
        if (created) return [created, true];
      }
      return [null, false];
    }

    // Resolve all members once so index lookups are stable for later steps
    const resolvedIds = typedMembers.map(m => resolveCustomerId(m));

    // --- Step 4: Batch address check for existing customers (1 query instead of N) ---
    const existingCustomerIds = resolvedIds
      .filter(([id, isNew]) => id && !isNew)
      .map(([id]) => id as string);

    const existingCustomersWithAddress = new Set<string>();
    if (existingCustomerIds.length > 0) {
      const { data: addressLinks } = await adminSupabase
        .from('customer_service_addresses')
        .select('customer_id')
        .in('customer_id', existingCustomerIds);

      for (const row of addressLinks ?? []) {
        existingCustomersWithAddress.add(row.customer_id);
      }
    }

    // --- Step 5: Service address creation (parallel in chunks of 20) ---
    type AddressWork = { customerId: string; member: NormalizedLeadData };

    const addressWorkItems = typedMembers
      .map((m, i) => {
        const [customerId, isNew] = resolvedIds[i];
        const hasAddress = m.street_address || m.city || m.state || m.zip;
        if (!customerId || !hasAddress) return null;
        if (!isNew && existingCustomersWithAddress.has(customerId)) return null;
        return { customerId, member: m } as AddressWork;
      })
      .filter((item): item is AddressWork => item !== null);

    await runInChunks(addressWorkItems, 20, async ({ customerId, member }) => {
      try {
        const addressResult = await createOrFindServiceAddress(company_id, {
          street_address: member.street_address ?? undefined,
          city: member.city ?? undefined,
          state: member.state ?? undefined,
          zip_code: member.zip ?? undefined,
        });
        if (addressResult.success && addressResult.serviceAddressId) {
          await linkCustomerToServiceAddress(
            customerId,
            addressResult.serviceAddressId,
            'owner',
            true
          );
        }
      } catch (addressError) {
        console.warn('Failed to create/link service address for customer:', customerId, addressError);
      }
    });

    // --- Step 6: Batch insert contact_list_members (1 insert instead of N) ---
    let newCustomersCount = 0;
    let existingCustomersCount = 0;
    let failedCount = 0;
    const addedCustomerIds: string[] = [];
    const seenForList = new Set<string>();
    const memberInserts: { contact_list_id: string; customer_id: string; added_by: string }[] = [];

    for (let i = 0; i < typedMembers.length; i++) {
      const [customerId, isNew] = resolvedIds[i];
      if (!customerId) {
        failedCount++;
        continue;
      }
      if (seenForList.has(customerId)) continue; // deduplicate within this batch
      seenForList.add(customerId);
      if (isNew) newCustomersCount++;
      else existingCustomersCount++;
      memberInserts.push({ contact_list_id: list.id, customer_id: customerId, added_by: user.id });
    }

    if (memberInserts.length > 0) {
      const { error: memberError } = await adminSupabase
        .from('contact_list_members')
        .insert(memberInserts);

      if (memberError && memberError.code !== '23505') {
        console.error('Error batch inserting list members:', memberError);
        failedCount += memberInserts.length;
      } else {
        addedCustomerIds.push(...memberInserts.map(r => r.customer_id));
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
