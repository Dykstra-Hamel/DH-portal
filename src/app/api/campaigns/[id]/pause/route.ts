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
      .select('company_id, status')
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

    // Validate campaign can be paused
    if (campaign.status !== 'running' && campaign.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Only running or scheduled campaigns can be paused' },
        { status: 400 }
      );
    }

    // Update campaign status
    const { data: updatedCampaign, error: updateError } = await queryClient
      .from('campaigns')
      .update({ status: 'paused' })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error pausing campaign:', updateError);
      return NextResponse.json({ error: 'Failed to pause campaign' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign paused',
      campaign: updatedCampaign
    });

  } catch (error) {
    console.error('Error in campaign pause:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
