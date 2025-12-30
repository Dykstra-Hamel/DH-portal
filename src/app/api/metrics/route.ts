import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { MetricsResponse } from '@/services/metricsService';

async function getMetricCounts(supabase: any, companyId: string, startDate: string, endDate: string) {
  const buildBaseQuery = () => {
    const query = supabase.from('tickets').select('*', { count: 'exact', head: true });

    if (companyId) {
      query.eq('company_id', companyId);
    }

    query.eq('archived', false);
    query.gte('created_at', startDate);
    query.lte('created_at', endDate);

    return query;
  };

  // Fetch all call records with joins to leads and customers (same approach as /api/calls)
  const { data: allCalls } = await supabase
    .from('call_records')
    .select(`
      id,
      duration_seconds,
      sentiment,
      lead_id,
      created_at,
      leads (
        id,
        company_id,
        lead_status
      ),
      customers (
        id,
        company_id
      )
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .eq('archived', false);

  // Filter calls to only include those belonging to the specified company
  const filteredCalls = (allCalls || []).filter((call: any) => {
    const leadCompanyId = call.leads?.company_id;
    const customerCompanyId = call.customers?.company_id;
    const matches = leadCompanyId === companyId || customerCompanyId === companyId;
    return matches;
  });

  const allCallRecords = filteredCalls;

  // Calculate Average Call Duration
  let avgCallDuration = 0;
  const callsWithDuration = allCallRecords.filter((call: any) => call.duration_seconds && call.duration_seconds > 0);
  if (callsWithDuration.length > 0) {
    const totalDuration = callsWithDuration.reduce((sum: number, call: any) => sum + call.duration_seconds, 0);
    avgCallDuration = Math.round(totalDuration / callsWithDuration.length); // in seconds
  }

  // Calculate Positive Sentiment Rate (includes both positive and neutral)
  let positiveSentimentRate = 0;
  const callsWithSentiment = allCallRecords.filter((call: any) => call.sentiment);
  if (callsWithSentiment.length > 0) {
    const positiveCalls = callsWithSentiment.filter((call: any) =>
      call.sentiment === 'positive' || call.sentiment === 'neutral'
    ).length;
    positiveSentimentRate = Math.round((positiveCalls / callsWithSentiment.length) * 100); // percentage
  }

  // Calculate Sales Calls Won (calls where associated lead has lead_status = 'won')
  const salesCallsWon = allCallRecords.filter((call: any) =>
    call.leads && call.leads.lead_status === 'won'
  ).length;

  const result = {
    totalCalls: allCallRecords.length,
    avgCallDuration,
    positiveSentimentRate,
    salesCallsWon
  };

  return result;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Calculate date ranges for 30-day periods
    const now = new Date();
    const currentPeriodStart = new Date(now);
    currentPeriodStart.setDate(now.getDate() - 30);
    const currentPeriodEnd = now;

    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(currentPeriodStart.getDate() - 30);
    const previousPeriodEnd = currentPeriodStart;

    // Get current period metrics (past 30 days)
    const currentMetrics = await getMetricCounts(
      supabase,
      companyId,
      currentPeriodStart.toISOString(),
      currentPeriodEnd.toISOString()
    );

    // Get previous period metrics (30 days before that)
    const previousMetrics = await getMetricCounts(
      supabase,
      companyId,
      previousPeriodStart.toISOString(),
      previousPeriodEnd.toISOString()
    );

    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Helper to format duration in seconds to MM:SS
    const formatDuration = (seconds: number): string => {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const totalCallsChange = calculatePercentageChange(currentMetrics.totalCalls, previousMetrics.totalCalls);
    const avgDurationChange = calculatePercentageChange(currentMetrics.avgCallDuration, previousMetrics.avgCallDuration);
    const sentimentChange = calculatePercentageChange(currentMetrics.positiveSentimentRate, previousMetrics.positiveSentimentRate);
    const salesWonChange = calculatePercentageChange(currentMetrics.salesCallsWon, previousMetrics.salesCallsWon);

    // Create response with comparison data
    const response: MetricsResponse = {
      totalCalls: {
        title: 'Total Calls',
        value: currentMetrics.totalCalls,
        comparisonValue: totalCallsChange,
        comparisonPeriod: 'vs previous 30 days',
        trend: totalCallsChange >= 0 ? 'good' : 'bad'
      },
      avgCallDuration: {
        title: 'Avg Call Duration',
        value: formatDuration(currentMetrics.avgCallDuration),
        comparisonValue: avgDurationChange,
        comparisonPeriod: 'vs previous 30 days',
        trend: avgDurationChange >= 0 ? 'good' : 'bad' // Longer calls may indicate engagement
      },
      positiveSentimentRate: {
        title: 'Positive Sentiment Rate',
        value: `${currentMetrics.positiveSentimentRate}%`,
        comparisonValue: sentimentChange,
        comparisonPeriod: 'vs previous 30 days',
        trend: sentimentChange >= 0 ? 'good' : 'bad'
      },
      salesCallsWon: {
        title: 'Sales Calls Won',
        value: currentMetrics.salesCallsWon,
        comparisonValue: salesWonChange,
        comparisonPeriod: 'vs previous 30 days',
        trend: salesWonChange >= 0 ? 'good' : 'bad'
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in metrics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}