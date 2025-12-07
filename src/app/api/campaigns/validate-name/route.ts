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
    const { name, company_id, exclude_campaign_id } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      );
    }

    if (!company_id) {
      return NextResponse.json(
        { error: 'company_id is required' },
        { status: 400 }
      );
    }

    // Check if campaign name already exists for this company
    let query = supabase
      .from('campaigns')
      .select('id')
      .eq('name', name)
      .eq('company_id', company_id);

    // If updating an existing campaign, exclude it from the check
    if (exclude_campaign_id) {
      query = query.neq('id', exclude_campaign_id);
    }

    const { data: existingCampaign, error } = await query.maybeSingle();

    if (error) {
      console.error('Error validating campaign name:', error);
      return NextResponse.json(
        { error: 'Failed to validate campaign name' },
        { status: 500 }
      );
    }

    const isAvailable = !existingCampaign;

    return NextResponse.json({
      success: true,
      available: isAvailable,
      message: isAvailable
        ? 'Campaign name is available'
        : 'Campaign name is already in use for this company',
    });

  } catch (error) {
    console.error('Error in campaign name validation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
