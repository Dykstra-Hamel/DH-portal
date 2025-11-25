import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/api-utils';

export async function GET(
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

    // Use admin client for global admins to bypass RLS
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // Get campaign to verify access
    const { data: campaign } = await queryClient
      .from('campaigns')
      .select('company_id')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check user has access (skip for global admins)
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('company_id', campaign.company_id)
        .single();

      if (!userCompany) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Get contact lists with member counts
    const { data: rawLists, error } = await queryClient
      .from('campaign_contact_lists')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contact lists:', error);
      return NextResponse.json({ error: 'Failed to fetch contact lists' }, { status: 500 });
    }

    if (!rawLists || rawLists.length === 0) {
      return NextResponse.json({ success: true, contactLists: [] });
    }

    // Add computed member counts for each list
    const contactListsWithCounts = await Promise.all(
      rawLists.map(async (list: any) => {
        const { count: totalMembers } = await queryClient
          .from('campaign_contact_list_members')
          .select('id', { count: 'exact', head: true })
          .eq('contact_list_id', list.id);

        const { count: pendingCount } = await queryClient
          .from('campaign_contact_list_members')
          .select('id', { count: 'exact', head: true })
          .eq('contact_list_id', list.id)
          .eq('status', 'pending');

        const { count: processingCount } = await queryClient
          .from('campaign_contact_list_members')
          .select('id', { count: 'exact', head: true })
          .eq('contact_list_id', list.id)
          .eq('status', 'processing');

        const { count: processedCount } = await queryClient
          .from('campaign_contact_list_members')
          .select('id', { count: 'exact', head: true })
          .eq('contact_list_id', list.id)
          .eq('status', 'processed');

        const { count: failedCount } = await queryClient
          .from('campaign_contact_list_members')
          .select('id', { count: 'exact', head: true })
          .eq('contact_list_id', list.id)
          .eq('status', 'failed');

        return {
          ...list,
          total_members: totalMembers || 0,
          pending_count: pendingCount || 0,
          processing_count: processingCount || 0,
          processed_count: processedCount || 0,
          failed_count: failedCount || 0,
        };
      })
    );

    return NextResponse.json({ success: true, contactLists: contactListsWithCounts });

  } catch (error) {
    console.error('Error in contact lists GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { list_name, description, customer_ids, lead_ids } = body;

    // Validate
    if (!list_name) {
      return NextResponse.json({ error: 'list_name is required' }, { status: 400 });
    }

    if ((!customer_ids || customer_ids.length === 0) && (!lead_ids || lead_ids.length === 0)) {
      return NextResponse.json(
        { error: 'At least one customer_id or lead_id is required' },
        { status: 400 }
      );
    }

    // Use admin client for global admins to bypass RLS
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // Get campaign to verify access
    const { data: campaign } = await queryClient
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

    // Create contact list
    const { data: contactList, error: createError } = await queryClient
      .from('campaign_contact_lists')
      .insert({
        campaign_id: campaignId,
        list_name,
        description,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating contact list:', createError);
      return NextResponse.json({ error: 'Failed to create contact list' }, { status: 500 });
    }

    // Add members (customers)
    const members = [];

    if (customer_ids && customer_ids.length > 0) {
      for (const customerId of customer_ids) {
        members.push({
          contact_list_id: contactList.id,
          customer_id: customerId,
          status: 'pending',
        });
      }
    }

    // Add members (leads)
    if (lead_ids && lead_ids.length > 0) {
      // Get customer_id from each lead
      const { data: leads } = await queryClient
        .from('leads')
        .select('id, customer_id')
        .in('id', lead_ids);

      if (leads) {
        for (const lead of leads) {
          members.push({
            contact_list_id: contactList.id,
            customer_id: lead.customer_id,
            lead_id: lead.id,
            status: 'pending',
          });
        }
      }
    }

    if (members.length > 0) {
      const { error: membersError } = await queryClient
        .from('campaign_contact_list_members')
        .insert(members);

      if (membersError) {
        console.error('Error adding list members:', membersError);
        // Don't fail completely, just log the error
      }
    }

    // Get updated contact list with member count
    const { data: updatedList } = await queryClient
      .from('campaign_contact_lists')
      .select('*')
      .eq('id', contactList.id)
      .single();

    return NextResponse.json({ success: true, contactList: updatedList }, { status: 201 });

  } catch (error) {
    console.error('Error in contact lists POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
