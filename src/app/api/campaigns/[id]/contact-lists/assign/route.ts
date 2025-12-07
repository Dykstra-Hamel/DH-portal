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

    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);
    const adminSupabase = createAdminClient();

    // Verify contact list exists and belongs to same company
    const { data: contactList } = await queryClient
      .from('contact_lists')
      .select('*')
      .eq('id', contact_list_id)
      .eq('company_id', campaign.company_id)
      .single();

    if (!contactList) {
      return NextResponse.json(
        { error: 'Contact list not found or does not belong to this company' },
        { status: 404 }
      );
    }

    // Check if already assigned
    const { data: existingAssignment } = await queryClient
      .from('campaign_contact_list_assignments')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('contact_list_id', contact_list_id)
      .maybeSingle();

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Contact list is already assigned to this campaign' },
        { status: 409 }
      );
    }

    // Create assignment
    const { data: assignment, error: assignmentError } = await adminSupabase
      .from('campaign_contact_list_assignments')
      .insert({
        campaign_id: campaignId,
        contact_list_id: contact_list_id,
        assigned_by: user.id,
      })
      .select()
      .single();

    if (assignmentError) {
      console.error('Error creating assignment:', assignmentError);
      return NextResponse.json(
        { error: 'Failed to assign contact list' },
        { status: 500 }
      );
    }

    // Get all members from the contact list
    const { data: members, error: membersQueryError } = await queryClient
      .from('contact_list_members')
      .select('customer_id')
      .eq('contact_list_id', contact_list_id);

    if (membersQueryError) {
      console.error('Error fetching contact list members:', membersQueryError);
    }

    // Add members to campaign_contact_list_members for tracking
    if (members && members.length > 0) {
      const campaignMembers = members.map((member: { customer_id: string }) => ({
        contact_list_id: contact_list_id,
        customer_id: member.customer_id,
        campaign_id: campaignId,
        status: 'pending',
      }));

      const { error: membersError } = await adminSupabase
        .from('campaign_contact_list_members')
        .insert(campaignMembers);

      if (membersError) {
        console.error('Error adding campaign members:', membersError);

        // Clean up assignment since members failed to add
        await adminSupabase
          .from('campaign_contact_list_assignments')
          .delete()
          .eq('id', assignment.id);

        return NextResponse.json(
          { error: `Failed to add members to campaign: ${membersError.message}` },
          { status: 500 }
        );
      }
    }

    // Update campaign's total_contacts count
    const { data: allAssignments } = await queryClient
      .from('campaign_contact_list_assignments')
      .select('contact_list_id')
      .eq('campaign_id', campaignId);

    if (allAssignments && allAssignments.length > 0) {
      const { count: totalMembersCount } = await queryClient
        .from('campaign_contact_list_members')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaignId);

      await adminSupabase
        .from('campaigns')
        .update({ total_contacts: totalMembersCount || 0 })
        .eq('id', campaignId);
    }

    return NextResponse.json({
      success: true,
      assignment,
      members_added: members?.length || 0,
    }, { status: 201 });

  } catch (error) {
    console.error('Error in contact list assignment:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
