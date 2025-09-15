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

  // Total Calls (actual call records from call_records table)
  // Get call records linked via leads
  const { data: companyLeadIds } = await supabase
    .from('leads')
    .select('id')
    .eq('company_id', companyId);

  let totalCallsFromLeads = 0;

  if (companyLeadIds && companyLeadIds.length > 0) {
    const leadIdArray = companyLeadIds.map((lead: { id: string }) => lead.id);
    const { count } = await supabase
      .from('call_records')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .in('lead_id', leadIdArray);

    totalCallsFromLeads = count || 0;
  }

  // Get call records linked via customers
  const { data: companyCustomerIds } = await supabase
    .from('customers')
    .select('id')
    .eq('company_id', companyId);

  let totalCallsFromCustomers = 0;

  if (companyCustomerIds && companyCustomerIds.length > 0) {
    const customerIdArray = companyCustomerIds.map((customer: { id: string }) => customer.id);
    const { count } = await supabase
      .from('call_records')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .in('customer_id', customerIdArray);

    totalCallsFromCustomers = count || 0;
  }

  const totalCalls = totalCallsFromLeads + totalCallsFromCustomers;


  // Total Forms (tickets with type='web_form')
  const formsQuery = buildBaseQuery().eq('type', 'web_form');
  const { count: totalForms } = await formsQuery;

  // Customer Service Calls (tickets with service_type = 'Customer Service')
  const customerServiceQuery = buildBaseQuery().eq('service_type', 'Customer Service');
  const { count: customerServiceCalls } = await customerServiceQuery;

  // For hangup calls, first get lead IDs for the company
  const { data: leadIds } = await supabase
    .from('leads')
    .select('id')
    .eq('company_id', companyId);

  let hangupCalls = 0;

  if (leadIds && leadIds.length > 0) {
    const leadIdArray = leadIds.map((lead: { id: string }) => lead.id);
    const { count } = await supabase
      .from('call_records')
      .select('id', { count: 'exact', head: true })
      .eq('call_status', 'no_answer')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .in('lead_id', leadIdArray);

    hangupCalls = count || 0;
  }

  // Calculate average assignment time for tickets with assigned_at timestamp within date range
  const { data: assignmentData } = await supabase
    .from('tickets')
    .select('created_at, assigned_at')
    .eq('company_id', companyId)
    .eq('archived', false)
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .not('assigned_at', 'is', null);

  let avgTimeToAssign = 0;
  if (assignmentData && assignmentData.length > 0) {
    const totalAssignmentTime = assignmentData.reduce((sum: number, ticket: any) => {
      const createdAt = new Date(ticket.created_at);
      const assignedAt = new Date(ticket.assigned_at);
      return sum + (assignedAt.getTime() - createdAt.getTime());
    }, 0);
    avgTimeToAssign = Math.round(totalAssignmentTime / assignmentData.length / (1000 * 60)); // Convert to minutes
  }

  return {
    totalCalls: totalCalls || 0,
    totalForms: totalForms || 0,
    customerServiceCalls: customerServiceCalls || 0,
    hangupCalls,
    avgTimeToAssign
  };
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

    const totalCallsChange = calculatePercentageChange(currentMetrics.totalCalls, previousMetrics.totalCalls);
    const totalFormsChange = calculatePercentageChange(currentMetrics.totalForms, previousMetrics.totalForms);
    const avgTimeChange = calculatePercentageChange(currentMetrics.avgTimeToAssign, previousMetrics.avgTimeToAssign);
    const hangupCallsChange = calculatePercentageChange(currentMetrics.hangupCalls, previousMetrics.hangupCalls);
    const customerServiceChange = calculatePercentageChange(currentMetrics.customerServiceCalls, previousMetrics.customerServiceCalls);

    // Create response with comparison data
    const response: MetricsResponse = {
      totalCalls: {
        title: 'Total Calls',
        value: currentMetrics.totalCalls,
        comparisonValue: totalCallsChange,
        comparisonPeriod: 'vs previous 30 days',
        trend: totalCallsChange >= 0 ? 'good' : 'bad'
      },
      totalForms: {
        title: 'Total Forms',
        value: currentMetrics.totalForms,
        comparisonValue: totalFormsChange,
        comparisonPeriod: 'vs previous 30 days',
        trend: totalFormsChange >= 0 ? 'good' : 'bad'
      },
      avgTimeToAssign: {
        title: 'Avg Time to Assign',
        value: `${currentMetrics.avgTimeToAssign}m`,
        comparisonValue: avgTimeChange,
        comparisonPeriod: 'vs previous 30 days',
        trend: avgTimeChange <= 0 ? 'good' : 'bad' // Lower time is better
      },
      hangupCalls: {
        title: 'Hangup Calls',
        value: currentMetrics.hangupCalls,
        comparisonValue: hangupCallsChange,
        comparisonPeriod: 'vs previous 30 days',
        trend: hangupCallsChange <= 0 ? 'good' : 'bad' // Lower hangups are better
      },
      customerServiceCalls: {
        title: 'Customer Service Calls',
        value: currentMetrics.customerServiceCalls,
        comparisonValue: customerServiceChange,
        comparisonPeriod: 'vs previous 30 days',
        trend: customerServiceChange >= 0 ? 'good' : 'bad'
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