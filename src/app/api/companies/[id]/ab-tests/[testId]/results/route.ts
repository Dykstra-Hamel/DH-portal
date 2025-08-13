import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { abTestEngine } from '@/lib/ab-testing/ab-test-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    const { id, testId } = await params;
    const companyId = id;

    const supabase = createAdminClient();

    // Verify campaign exists and belongs to company
    const { data: campaign, error: campaignError } = await supabase
      .from('ab_test_campaigns')
      .select('id, status, company_id')
      .eq('id', testId)
      .eq('company_id', companyId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Get statistical analysis
    const results = await abTestEngine.analyzeTestResults(testId);

    if (!results) {
      return NextResponse.json(
        { success: false, error: 'Unable to analyze test results' },
        { status: 500 }
      );
    }

    // Get detailed variant performance
    const variants = await abTestEngine.getCampaignVariants(testId);

    // Get historical results for trend analysis
    const { data: historicalResults, error: historyError } = await supabase
      .from('ab_test_results')
      .select('*')
      .eq('campaign_id', testId)
      .order('analysis_date', { ascending: true })
      .limit(30); // Last 30 analysis runs

    return NextResponse.json({
      success: true,
      analysis: results,
      variants,
      historical_results: historicalResults || [],
      recommendations: generateRecommendations(results, variants)
    });

  } catch (error) {
    console.error('Error in GET /api/companies/[id]/ab-tests/[testId]/results:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    const { id, testId } = await params;
    const companyId = id;

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

    // Force a new analysis
    const results = await abTestEngine.analyzeTestResults(testId);

    if (!results) {
      return NextResponse.json(
        { success: false, error: 'Unable to analyze test results' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Analysis completed',
      analysis: results
    });

  } catch (error) {
    console.error('Error in POST /api/companies/[id]/ab-tests/[testId]/results:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to generate actionable recommendations
function generateRecommendations(results: any, variants: any[]) {
  const recommendations = [];

  // Sample size recommendations
  if (results.total_participants < results.confidence_level * 100) {
    recommendations.push({
      type: 'warning',
      title: 'Low Sample Size',
      message: `Consider running the test longer to reach at least ${Math.ceil(results.confidence_level * 100)} participants per variant for reliable results.`,
      action: 'extend_test'
    });
  }

  // Statistical significance recommendations
  if (results.is_significant && results.lift_percentage > 0) {
    recommendations.push({
      type: 'success',
      title: 'Significant Winner Found',
      message: `Variant ${results.recommended_winner} shows a ${results.lift_percentage.toFixed(2)}% improvement over the control with ${(results.confidence_level * 100).toFixed(0)}% confidence.`,
      action: 'implement_winner'
    });
  } else if (results.test_duration_days >= 14 && !results.is_significant) {
    recommendations.push({
      type: 'info',
      title: 'No Clear Winner',
      message: 'After 2+ weeks, no variant shows statistically significant improvement. Consider stopping the test or trying a different approach.',
      action: 'stop_test'
    });
  }

  // Performance recommendations
  const controlVariant = variants.find(v => v.is_control);
  const bestVariant = variants.reduce((best, current) => 
    current.conversion_rate > best.conversion_rate ? current : best
  );

  if (controlVariant && bestVariant !== controlVariant) {
    const improvement = ((bestVariant.conversion_rate - controlVariant.conversion_rate) / controlVariant.conversion_rate) * 100;
    
    if (improvement > 10) {
      recommendations.push({
        type: 'success',
        title: 'Strong Performance Difference',
        message: `Variant ${bestVariant.variant_label} is performing ${improvement.toFixed(1)}% better than the control.`,
        action: 'monitor_closely'
      });
    }
  }

  // Engagement recommendations
  const avgOpenRate = variants.reduce((sum, v) => sum + v.open_rate, 0) / variants.length;
  const avgClickRate = variants.reduce((sum, v) => sum + v.click_rate, 0) / variants.length;

  if (avgOpenRate < 0.15) {
    recommendations.push({
      type: 'warning',
      title: 'Low Open Rates',
      message: `Average open rate is ${(avgOpenRate * 100).toFixed(1)}%. Consider testing different subject lines or sender names.`,
      action: 'test_subject_lines'
    });
  }

  if (avgClickRate < 0.02) {
    recommendations.push({
      type: 'warning',
      title: 'Low Click Rates',
      message: `Average click rate is ${(avgClickRate * 100).toFixed(1)}%. Consider testing different content, CTAs, or email design.`,
      action: 'test_content'
    });
  }

  return recommendations;
}