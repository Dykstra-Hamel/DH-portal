import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { ReportsResponse } from '@/services/reportsService';

async function getReportMetrics(
  supabase: any,
  companyId: string,
  startDate: string,
  endDate: string
) {
  // Get all leads for the company within the date range
  const { data: leads, count: totalLeadsCount } = await supabase
    .from('leads')
    .select('id, lead_status, estimated_value', { count: 'exact' })
    .eq('company_id', companyId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Count leads by status
  const leadsWon = leads?.filter((l: any) => l.lead_status === 'won').length || 0;
  const leadsLost = leads?.filter((l: any) => l.lead_status === 'lost').length || 0;
  const totalLeads = totalLeadsCount || 0;

  // Calculate win rate
  const closedLeads = leadsWon + leadsLost;
  const winRate = closedLeads > 0 ? Math.round((leadsWon / closedLeads) * 100) : 0;

  // Calculate pipeline value (sum of estimated_value for non-won/lost leads)
  const activeLeads = leads?.filter(
    (l: any) => l.lead_status !== 'won' && l.lead_status !== 'lost'
  ) || [];
  const pipelineValue = activeLeads.reduce(
    (sum: number, lead: any) => sum + (lead.estimated_value || 0),
    0
  );

  // Get call metrics from tickets
  const { count: outboundCalls } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('call_direction', 'outbound')
    .eq('archived', false)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  const { count: inboundCalls } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .eq('call_direction', 'inbound')
    .eq('archived', false)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Get total calls from call_records via leads
  const { data: companyLeadIds } = await supabase
    .from('leads')
    .select('id')
    .eq('company_id', companyId);

  let totalCalls = 0;
  if (companyLeadIds && companyLeadIds.length > 0) {
    const leadIdArray = companyLeadIds.map((lead: { id: string }) => lead.id);
    const { count } = await supabase
      .from('call_records')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .in('lead_id', leadIdArray);

    totalCalls = count || 0;
  }

  // Get calls from customers as well
  const { data: companyCustomerIds } = await supabase
    .from('customers')
    .select('id')
    .eq('company_id', companyId);

  if (companyCustomerIds && companyCustomerIds.length > 0) {
    const customerIdArray = companyCustomerIds.map((customer: { id: string }) => customer.id);
    const { count } = await supabase
      .from('call_records')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .in('customer_id', customerIdArray);

    totalCalls += count || 0;
  }

  return {
    totalLeads,
    leadsWon,
    leadsLost,
    winRate,
    pipelineValue,
    outboundCalls: outboundCalls || 0,
    inboundCalls: inboundCalls || 0,
    totalCalls,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const compareEnabled = searchParams.get('compare') === 'true';
    const compareStartDate = searchParams.get('compareStartDate');
    const compareEndDate = searchParams.get('compareEndDate');

    if (!companyId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Company ID, start date, and end date are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get current period metrics
    const currentMetrics = await getReportMetrics(supabase, companyId, startDate, endDate);

    // Get comparison period metrics if enabled
    let previousMetrics = null;
    if (compareEnabled && compareStartDate && compareEndDate) {
      previousMetrics = await getReportMetrics(
        supabase,
        companyId,
        compareStartDate,
        compareEndDate
      );
    }

    // Calculate percentage changes
    const calculatePercentageChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Build response with comparisons
    const response: ReportsResponse = {
      totalLeads: {
        title: 'Total Sales Leads',
        value: currentMetrics.totalLeads,
        ...(previousMetrics && {
          comparisonValue: calculatePercentageChange(
            currentMetrics.totalLeads,
            previousMetrics.totalLeads
          ),
          trend:
            currentMetrics.totalLeads >= previousMetrics.totalLeads ? 'good' : 'bad',
        }),
      },
      leadsWon: {
        title: 'Leads Won',
        value: currentMetrics.leadsWon,
        ...(previousMetrics && {
          comparisonValue: calculatePercentageChange(
            currentMetrics.leadsWon,
            previousMetrics.leadsWon
          ),
          trend: currentMetrics.leadsWon >= previousMetrics.leadsWon ? 'good' : 'bad',
        }),
      },
      leadsLost: {
        title: 'Leads Lost',
        value: currentMetrics.leadsLost,
        ...(previousMetrics && {
          comparisonValue: calculatePercentageChange(
            currentMetrics.leadsLost,
            previousMetrics.leadsLost
          ),
          trend: currentMetrics.leadsLost <= previousMetrics.leadsLost ? 'good' : 'bad',
        }),
      },
      winRate: {
        title: 'Win Rate',
        value: `${currentMetrics.winRate}%`,
        ...(previousMetrics && {
          comparisonValue: calculatePercentageChange(
            currentMetrics.winRate,
            previousMetrics.winRate
          ),
          trend: currentMetrics.winRate >= previousMetrics.winRate ? 'good' : 'bad',
        }),
      },
      pipelineValue: {
        title: 'Pipeline Value',
        value: `$${currentMetrics.pipelineValue.toLocaleString()}`,
        ...(previousMetrics && {
          comparisonValue: calculatePercentageChange(
            currentMetrics.pipelineValue,
            previousMetrics.pipelineValue
          ),
          trend:
            currentMetrics.pipelineValue >= previousMetrics.pipelineValue
              ? 'good'
              : 'bad',
        }),
      },
      totalOutboundCalls: {
        title: 'Outbound Calls',
        value: currentMetrics.outboundCalls,
        ...(previousMetrics && {
          comparisonValue: calculatePercentageChange(
            currentMetrics.outboundCalls,
            previousMetrics.outboundCalls
          ),
          trend:
            currentMetrics.outboundCalls >= previousMetrics.outboundCalls
              ? 'good'
              : 'bad',
        }),
      },
      totalInboundCalls: {
        title: 'Inbound Calls',
        value: currentMetrics.inboundCalls,
        ...(previousMetrics && {
          comparisonValue: calculatePercentageChange(
            currentMetrics.inboundCalls,
            previousMetrics.inboundCalls
          ),
          trend:
            currentMetrics.inboundCalls >= previousMetrics.inboundCalls ? 'good' : 'bad',
        }),
      },
      totalCalls: {
        title: 'Total Calls',
        value: currentMetrics.totalCalls,
        ...(previousMetrics && {
          comparisonValue: calculatePercentageChange(
            currentMetrics.totalCalls,
            previousMetrics.totalCalls
          ),
          trend: currentMetrics.totalCalls >= previousMetrics.totalCalls ? 'good' : 'bad',
        }),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in reports API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
