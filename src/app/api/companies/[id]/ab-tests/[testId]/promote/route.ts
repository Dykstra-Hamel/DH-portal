import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { abTestEngine } from '@/lib/ab-testing/ab-test-engine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    const { id, testId } = await params;
    const companyId = id;
    const body = await request.json();
    
    const { winner_variant, force = false } = body;

    if (!winner_variant) {
      return NextResponse.json(
        { success: false, error: 'Winner variant is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify campaign exists and belongs to company
    const { data: campaign, error: campaignError } = await supabase
      .from('ab_test_campaigns')
      .select('*')
      .eq('id', testId)
      .eq('company_id', companyId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Check if campaign is in a state that allows promotion
    if (!['running', 'paused'].includes(campaign.status)) {
      return NextResponse.json(
        { success: false, error: 'Can only promote winners from running or paused campaigns' },
        { status: 400 }
      );
    }

    // Verify the winner variant exists
    const { data: winnerVariant, error: variantError } = await supabase
      .from('ab_test_variants')
      .select('*')
      .eq('campaign_id', testId)
      .eq('variant_label', winner_variant)
      .single();

    if (variantError || !winnerVariant) {
      return NextResponse.json(
        { success: false, error: 'Winner variant not found' },
        { status: 404 }
      );
    }

    // Get current statistical analysis (unless forced)
    if (!force) {
      const results = await abTestEngine.analyzeTestResults(testId);
      
      if (!results) {
        return NextResponse.json(
          { success: false, error: 'Unable to analyze test results' },
          { status: 500 }
        );
      }

      // Check if there's statistical significance
      if (!results.is_significant) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Test results are not statistically significant. Use force=true to promote anyway.',
            p_value: results.p_value,
            confidence_level: results.confidence_level,
            is_significant: false
          },
          { status: 400 }
        );
      }

      // Check if the recommended winner matches the requested winner
      if (results.recommended_winner && results.recommended_winner !== winner_variant) {
        return NextResponse.json(
          {
            success: false,
            error: `Statistical analysis recommends variant ${results.recommended_winner}, not ${winner_variant}. Use force=true to override.`,
            recommended_winner: results.recommended_winner,
            requested_winner: winner_variant
          },
          { status: 400 }
        );
      }
    }

    // Promote the winner
    const promotionSuccess = await abTestEngine.promoteWinner(testId, winner_variant);

    if (!promotionSuccess) {
      return NextResponse.json(
        { success: false, error: 'Failed to promote winner' },
        { status: 500 }
      );
    }

    // Get the updated campaign
    const { data: updatedCampaign, error: updateError } = await supabase
      .from('ab_test_campaigns')
      .select('*')
      .eq('id', testId)
      .single();

    // Record the promotion in results
    await supabase
      .from('ab_test_results')
      .insert({
        campaign_id: testId,
        total_participants: 0, // Will be updated by analysis
        primary_metric: 'conversion_rate',
        recommended_action: 'stop_and_implement_winner',
        recommended_winner: winner_variant,
        notes: `Winner promoted ${force ? '(forced)' : 'based on statistical significance'}`
      });

    return NextResponse.json({
      success: true,
      message: `Successfully promoted variant ${winner_variant} as the winner`,
      campaign: updatedCampaign,
      promoted_variant: winnerVariant,
      forced: force
    });

  } catch (error) {
    console.error('Error in POST /api/companies/[id]/ab-tests/[testId]/promote:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}