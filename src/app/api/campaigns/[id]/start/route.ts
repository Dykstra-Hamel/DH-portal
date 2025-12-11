import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/api-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Use admin client for global admins to bypass RLS
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // Get campaign
    const { data: campaign, error: fetchError } = await queryClient
      .from('campaigns')
      .select('company_id, status, workflow_id')
      .eq('id', id)
      .single();

    if (fetchError || !campaign) {
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

    // Validate campaign can be started
    if (campaign.status === 'running') {
      return NextResponse.json({ error: 'Campaign is already running' }, { status: 400 });
    }

    if (campaign.status === 'completed') {
      return NextResponse.json({ error: 'Cannot restart a completed campaign' }, { status: 400 });
    }

    if (!campaign.workflow_id) {
      return NextResponse.json({ error: 'Campaign must have a workflow assigned' }, { status: 400 });
    }

    // Check if campaign has contact lists (using reusable contact lists system)
    const { data: contactListAssignments, error: listsError } = await queryClient
      .from('campaign_contact_list_assignments')
      .select('contact_list_id')
      .eq('campaign_id', id);

    if (listsError || !contactListAssignments || contactListAssignments.length === 0) {
      return NextResponse.json(
        { error: 'Campaign must have at least one contact list' },
        { status: 400 }
      );
    }

    // Update campaign status to scheduled (scheduler will pick it up)
    const { data: updatedCampaign, error: updateError } = await queryClient
      .from('campaigns')
      .update({
        status: 'scheduled',
        start_datetime: new Date().toISOString() // Start immediately
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error starting campaign:', updateError);
      return NextResponse.json({ error: 'Failed to start campaign' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign scheduled to start',
      campaign: updatedCampaign
    });

  } catch (error) {
    console.error('Error in campaign start:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
