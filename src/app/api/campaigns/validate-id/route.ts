import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser } from '@/lib/api-utils';

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { supabase } = authResult;

    const body = await request.json();
    const { campaign_id, exclude_campaign_id } = body;

    // Validate required fields
    if (!campaign_id) {
      return NextResponse.json(
        { error: 'campaign_id is required' },
        { status: 400 }
      );
    }

    // Check if campaign_id already exists
    let query = supabase
      .from('campaigns')
      .select('id')
      .eq('campaign_id', campaign_id);

    // If updating an existing campaign, exclude it from the check
    if (exclude_campaign_id) {
      query = query.neq('id', exclude_campaign_id);
    }

    const { data: existingCampaign, error } = await query.maybeSingle();

    if (error) {
      console.error('Error validating campaign ID:', error);
      return NextResponse.json(
        { error: 'Failed to validate campaign ID' },
        { status: 500 }
      );
    }

    const isAvailable = !existingCampaign;

    return NextResponse.json({
      success: true,
      available: isAvailable,
      message: isAvailable
        ? 'Campaign ID is available'
        : 'Campaign ID is already in use',
    });

  } catch (error) {
    console.error('Error in campaign ID validation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
