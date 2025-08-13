import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = id;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // Default to 30 days
    const metric = searchParams.get('metric') || 'conversion_rate';

    const supabase = createAdminClient();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Get overall A/B testing metrics
    const overallMetrics = await getOverallMetrics(supabase, companyId, startDate, endDate);
    
    // Get campaign performance data
    const campaignPerformance = await getCampaignPerformance(supabase, companyId, startDate, endDate, metric);
    
    // Get template performance comparison
    const templatePerformance = await getTemplatePerformance(supabase, companyId, startDate, endDate);
    
    // Get testing trends over time
    const testingTrends = await getTestingTrends(supabase, companyId, startDate, endDate);

    return NextResponse.json({
      success: true,
      analytics: {
        period_days: parseInt(period),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        overall_metrics: overallMetrics,
        campaign_performance: campaignPerformance,
        template_performance: templatePerformance,
        testing_trends: testingTrends
      }
    });

  } catch (error) {
    console.error('Error in GET /api/companies/[id]/ab-tests/analytics:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getOverallMetrics(supabase: any, companyId: string, startDate: Date, endDate: Date) {
  // Get campaign counts by status
  const { data: campaigns } = await supabase
    .from('ab_test_campaigns')
    .select('status, created_at')
    .eq('company_id', companyId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString());

  const campaignStats = {
    total: campaigns?.length || 0,
    running: campaigns?.filter((c: any) => c.status === 'running').length || 0,
    completed: campaigns?.filter((c: any) => c.status === 'completed').length || 0,
    draft: campaigns?.filter((c: any) => c.status === 'draft').length || 0
  };

  // Get total participants and emails sent
  const { data: participantStats } = await supabase
    .from('ab_test_assignments')
    .select(`
      lead_id,
      ab_test_variants!inner (
        ab_test_campaigns!inner (
          company_id,
          created_at
        )
      )
    `)
    .eq('ab_test_variants.ab_test_campaigns.company_id', companyId)
    .gte('ab_test_variants.ab_test_campaigns.created_at', startDate.toISOString())
    .lte('ab_test_variants.ab_test_campaigns.created_at', endDate.toISOString());

  // Get average improvement from completed tests
  const { data: improvements } = await supabase
    .from('ab_test_results')
    .select(`
      lift_percentage,
      is_significant,
      ab_test_campaigns!inner (
        company_id,
        status,
        created_at
      )
    `)
    .eq('ab_test_campaigns.company_id', companyId)
    .eq('ab_test_campaigns.status', 'completed')
    .gte('ab_test_campaigns.created_at', startDate.toISOString())
    .lte('ab_test_campaigns.created_at', endDate.toISOString());

  const significantImprovements = improvements?.filter((i: any) => i.is_significant && i.lift_percentage > 0) || [];
  const averageImprovement = significantImprovements.length > 0
    ? significantImprovements.reduce((sum: number, i: any) => sum + i.lift_percentage, 0) / significantImprovements.length
    : 0;

  return {
    campaigns: campaignStats,
    total_participants: participantStats?.length || 0,
    significant_winners: significantImprovements.length,
    average_improvement_percent: Math.round(averageImprovement * 100) / 100,
    success_rate: campaignStats.completed > 0 
      ? Math.round((significantImprovements.length / campaignStats.completed) * 100)
      : 0
  };
}

async function getCampaignPerformance(supabase: any, companyId: string, startDate: Date, endDate: Date, metric: string) {
  const { data: campaigns } = await supabase
    .from('ab_test_campaigns')
    .select(`
      id,
      name,
      status,
      created_at,
      winner_variant,
      statistical_significance,
      ab_test_variants (
        variant_label,
        is_control,
        participants_assigned,
        emails_sent,
        emails_opened,
        emails_clicked,
        conversions,
        open_rate,
        click_rate,
        conversion_rate
      ),
      ab_test_results (
        lift_percentage,
        is_significant,
        p_value,
        confidence_level,
        analysis_date
      )
    `)
    .eq('company_id', companyId)
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false });

  return (campaigns || []).map((campaign: any) => {
    const latestResult = campaign.ab_test_results?.[0];
    const controlVariant = campaign.ab_test_variants?.find((v: any) => v.is_control);
    const bestVariant = campaign.ab_test_variants?.reduce((best: any, current: any) => 
      current[metric] > best[metric] ? current : best
    );

    return {
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      created_at: campaign.created_at,
      winner_variant: campaign.winner_variant,
      total_participants: campaign.ab_test_variants?.reduce((sum: number, v: any) => sum + v.participants_assigned, 0) || 0,
      control_performance: controlVariant ? controlVariant[metric] : 0,
      best_performance: bestVariant ? bestVariant[metric] : 0,
      lift_percentage: latestResult?.lift_percentage || 0,
      is_significant: latestResult?.is_significant || false,
      p_value: latestResult?.p_value,
      confidence_level: latestResult?.confidence_level
    };
  });
}

async function getTemplatePerformance(supabase: any, companyId: string, startDate: Date, endDate: Date) {
  const { data: templateStats } = await supabase
    .from('ab_test_variants')
    .select(`
      template_id,
      is_control,
      participants_assigned,
      emails_sent,
      emails_opened,
      emails_clicked,
      conversions,
      open_rate,
      click_rate,
      conversion_rate,
      email_templates!inner (
        name,
        template_type
      ),
      ab_test_campaigns!inner (
        company_id,
        created_at,
        status
      )
    `)
    .eq('ab_test_campaigns.company_id', companyId)
    .gte('ab_test_campaigns.created_at', startDate.toISOString())
    .lte('ab_test_campaigns.created_at', endDate.toISOString());

  // Group by template and calculate average performance
  const templateMap = new Map();
  
  (templateStats || []).forEach((variant: any) => {
    const templateId = variant.template_id;
    
    if (!templateMap.has(templateId)) {
      templateMap.set(templateId, {
        template_id: templateId,
        name: variant.email_templates.name,
        type: variant.email_templates.template_type,
        tests_count: 0,
        wins_count: 0,
        total_participants: 0,
        total_emails_sent: 0,
        total_opens: 0,
        total_clicks: 0,
        total_conversions: 0,
        is_control_count: 0
      });
    }
    
    const template = templateMap.get(templateId);
    template.tests_count += 1;
    template.total_participants += variant.participants_assigned;
    template.total_emails_sent += variant.emails_sent;
    template.total_opens += variant.emails_opened;
    template.total_clicks += variant.emails_clicked;
    template.total_conversions += variant.conversions;
    
    if (variant.is_control) {
      template.is_control_count += 1;
    }
    
    // Count as win if this variant performed better than average in its campaign
    // This is simplified - in practice you'd compare against the control variant
    if (variant.conversion_rate > 0.1) { // Simplified win condition
      template.wins_count += 1;
    }
  });

  return Array.from(templateMap.values()).map(template => ({
    ...template,
    average_open_rate: template.total_emails_sent > 0 
      ? template.total_opens / template.total_emails_sent 
      : 0,
    average_click_rate: template.total_emails_sent > 0 
      ? template.total_clicks / template.total_emails_sent 
      : 0,
    average_conversion_rate: template.total_participants > 0 
      ? template.total_conversions / template.total_participants 
      : 0,
    win_rate: template.tests_count > 0 
      ? template.wins_count / template.tests_count 
      : 0
  }));
}

async function getTestingTrends(supabase: any, companyId: string, startDate: Date, endDate: Date) {
  // Get daily/weekly aggregated data
  const { data: trends } = await supabase
    .from('ab_test_results')
    .select(`
      analysis_date,
      total_participants,
      is_significant,
      lift_percentage,
      ab_test_campaigns!inner (
        company_id,
        created_at
      )
    `)
    .eq('ab_test_campaigns.company_id', companyId)
    .gte('analysis_date', startDate.toISOString())
    .lte('analysis_date', endDate.toISOString())
    .order('analysis_date');

  // Group by date (simplified to daily)
  const trendMap = new Map();
  
  (trends || []).forEach((result: any) => {
    const date = result.analysis_date.split('T')[0]; // Get date part
    
    if (!trendMap.has(date)) {
      trendMap.set(date, {
        date,
        total_tests: 0,
        significant_results: 0,
        total_participants: 0,
        average_lift: 0,
        lift_values: []
      });
    }
    
    const trend = trendMap.get(date);
    trend.total_tests += 1;
    trend.total_participants += result.total_participants;
    
    if (result.is_significant) {
      trend.significant_results += 1;
    }
    
    if (result.lift_percentage) {
      trend.lift_values.push(result.lift_percentage);
    }
  });

  return Array.from(trendMap.values()).map(trend => ({
    date: trend.date,
    total_tests: trend.total_tests,
    significant_results: trend.significant_results,
    significance_rate: trend.total_tests > 0 
      ? trend.significant_results / trend.total_tests 
      : 0,
    total_participants: trend.total_participants,
    average_lift: trend.lift_values.length > 0 
      ? trend.lift_values.reduce((sum: number, val: number) => sum + val, 0) / trend.lift_values.length 
      : 0
  }));
}