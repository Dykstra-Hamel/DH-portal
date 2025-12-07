import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;
    const body = await request.json();
    const { contact_list_id } = body;

    if (!contact_list_id) {
      return NextResponse.json(
        { error: 'contact_list_id is required' },
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

    // Don't allow removing from running campaigns
    if (campaign.status === 'running') {
      return NextResponse.json(
        { error: 'Cannot remove contact lists from a running campaign' },
        { status: 400 }
      );
    }

    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);
    const adminSupabase = createAdminClient();

    // Delete assignment
    const { error: deleteError } = await adminSupabase
      .from('campaign_contact_list_assignments')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('contact_list_id', contact_list_id);

    if (deleteError) {
      console.error('Error deleting assignment:', deleteError);
      return NextResponse.json(
        { error: 'Failed to unassign contact list' },
        { status: 500 }
      );
    }

    // Remove members from campaign_contact_list_members
    const { error: membersError } = await adminSupabase
      .from('campaign_contact_list_members')
      .delete()
      .eq('campaign_id', campaignId)
      .eq('contact_list_id', contact_list_id);

    if (membersError) {
      console.error('Error removing campaign members:', membersError);
    }

    // Update campaign's total_contacts count
    const { count: totalMembersCount } = await queryClient
      .from('campaign_contact_list_members')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);

    await adminSupabase
      .from('campaigns')
      .update({ total_contacts: totalMembersCount || 0 })
      .eq('id', campaignId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in contact list unassignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
