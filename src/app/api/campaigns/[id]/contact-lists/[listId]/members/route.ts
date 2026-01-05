import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, listId: string }> }
) {
  try {
    const { id: campaignId, listId } = await params;

    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Use admin client for global admins to bypass RLS
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // Verify the contact list is assigned to this campaign (new reusable system)
    const { data: assignment } = await queryClient
      .from('campaign_contact_list_assignments')
      .select('contact_list_id')
      .eq('campaign_id', campaignId)
      .eq('contact_list_id', listId)
      .single();

    if (!assignment) {
      return NextResponse.json({ error: 'Contact list not found or not assigned to this campaign' }, { status: 404 });
    }

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

    // Get contact list members with customer details
    // Filter by both contact_list_id AND campaign_id for reusable lists
    const { data: members, error } = await queryClient
      .from('campaign_contact_list_members')
      .select(`
        id,
        status,
        added_at,
        processed_at,
        error_message,
        first_viewed_at,
        last_viewed_at,
        view_count,
        redeemed_at,
        customer:customers(
          id,
          first_name,
          last_name,
          email,
          phone
        )
      `)
      .eq('contact_list_id', listId)
      .eq('campaign_id', campaignId)
      .order('added_at', { ascending: false });

    if (error) {
      console.error('Error fetching contact list members:', error);
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }

    return NextResponse.json({ success: true, members: members || [] });

  } catch (error) {
    console.error('Error in contact list members GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
