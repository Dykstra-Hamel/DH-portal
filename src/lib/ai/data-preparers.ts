/**
 * Data Preparation Utilities for AI Analysis
 *
 * These functions fetch and prepare data from Supabase in formats
 * optimized for AI analysis, ensuring efficient token usage and
 * relevant context provision.
 */

import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  BusinessMetrics,
  LeadMetrics,
  CallMetrics,
  CustomerMetrics,
  EmailMetrics,
  AutomationMetrics,
  ServiceAreaMetrics,
} from './types';

// ============================================================================
// LEAD METRICS
// ============================================================================

export async function prepareLeadMetrics(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<LeadMetrics> {
  const supabase = createAdminClient();

  // Fetch all leads for the period
  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('company_id', companyId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error || !leads) {
    console.error('Error fetching leads:', error);
    throw new Error('Failed to fetch lead data');
  }

  // Calculate metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.lead_status === 'new').length;
  const contactedLeads = leads.filter((l) => l.lead_status === 'contacted').length;
  const quotedLeads = leads.filter((l) => l.lead_status === 'quoted').length;
  const wonLeads = leads.filter((l) => l.lead_status === 'won').length;
  const lostLeads = leads.filter((l) => l.lead_status === 'lost').length;
  const unqualifiedLeads = leads.filter((l) => l.lead_status === 'unqualified').length;

  // Win rate calculation
  const closedLeads = wonLeads + lostLeads;
  const winRate = closedLeads > 0 ? Math.round((wonLeads / closedLeads) * 100) : 0;

  // Pipeline value (non-closed leads)
  const activeLeads = leads.filter(
    (l) => l.lead_status !== 'won' && l.lead_status !== 'lost' && l.lead_status !== 'unqualified'
  );
  const totalPipelineValue = activeLeads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0);

  // Average lead value
  const leadsWithValue = leads.filter((l) => l.estimated_value > 0);
  const averageLeadValue =
    leadsWithValue.length > 0
      ? Math.round(
          leadsWithValue.reduce((sum, l) => sum + l.estimated_value, 0) / leadsWithValue.length
        )
      : 0;

  // Conversion rate (won / total)
  const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;

  // Average time to close (for won leads with created_at and next_follow_up_at or last_contacted_at)
  const wonLeadsWithDates = leads.filter(
    (l) => l.lead_status === 'won' && l.created_at && l.last_contacted_at
  );
  const averageTimeToClose =
    wonLeadsWithDates.length > 0
      ? Math.round(
          wonLeadsWithDates.reduce((sum, l) => {
            const created = new Date(l.created_at).getTime();
            const closed = new Date(l.last_contacted_at).getTime();
            const days = (closed - created) / (1000 * 60 * 60 * 24);
            return sum + days;
          }, 0) / wonLeadsWithDates.length
        )
      : 0;

  // Group by source
  const leadsBySource: Record<string, number> = {};
  leads.forEach((lead) => {
    const source = lead.lead_source || 'unknown';
    leadsBySource[source] = (leadsBySource[source] || 0) + 1;
  });

  // Group by pest type
  const leadsByPestType: Record<string, number> = {};
  leads.forEach((lead) => {
    const pestType = lead.pest_type || 'unknown';
    leadsByPestType[pestType] = (leadsByPestType[pestType] || 0) + 1;
  });

  // Group by status
  const leadsByStatus: Record<string, number> = {};
  leads.forEach((lead) => {
    const status = lead.lead_status || 'unknown';
    leadsByStatus[status] = (leadsByStatus[status] || 0) + 1;
  });

  return {
    totalLeads,
    newLeads,
    contactedLeads,
    quotedLeads,
    wonLeads,
    lostLeads,
    unqualifiedLeads,
    winRate,
    averageLeadValue,
    totalPipelineValue,
    conversionRate,
    averageTimeToClose,
    leadsBySource,
    leadsByPestType,
    leadsByStatus,
  };
}

// ============================================================================
// CALL METRICS
// ============================================================================

export async function prepareCallMetrics(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<CallMetrics> {
  const supabase = createAdminClient();

  // Get all company leads and customers to filter call_records
  const { data: companyLeadIds } = await supabase
    .from('leads')
    .select('id')
    .eq('company_id', companyId);

  const { data: companyCustomerIds } = await supabase
    .from('customers')
    .select('id')
    .eq('company_id', companyId);

  const leadIdArray = companyLeadIds?.map((l: { id: string }) => l.id) || [];
  const customerIdArray = companyCustomerIds?.map((c: { id: string }) => c.id) || [];

  if (leadIdArray.length === 0 && customerIdArray.length === 0) {
    // No data
    return {
      totalCalls: 0,
      inboundCalls: 0,
      outboundCalls: 0,
      averageDuration: 0,
      totalDuration: 0,
      callsByStatus: {},
      callsByDirection: {},
      sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
      answerRate: 0,
      conversionRate: 0,
    };
  }

  // Build OR filter
  const orFilter =
    leadIdArray.length > 0 && customerIdArray.length > 0
      ? `lead_id.in.(${leadIdArray.join(',')}),customer_id.in.(${customerIdArray.join(',')})`
      : leadIdArray.length > 0
      ? `lead_id.in.(${leadIdArray.join(',')})`
      : `customer_id.in.(${customerIdArray.join(',')})`;

  // Fetch call records
  const { data: calls, error } = await supabase
    .from('call_records')
    .select('*')
    .gte('created_at', startDate)
    .lte('created_at', endDate)
    .or(orFilter);

  if (error || !calls) {
    console.error('Error fetching calls:', error);
    throw new Error('Failed to fetch call data');
  }

  const totalCalls = calls.length;
  const inboundCalls = calls.filter((c) => c.call_direction === 'inbound').length;
  const outboundCalls = calls.filter((c) => c.call_direction === 'outbound').length;

  // Duration calculations
  const totalDuration = calls.reduce((sum, c) => sum + (c.duration_seconds || 0), 0);
  const averageDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

  // Group by status
  const callsByStatus: Record<string, number> = {};
  calls.forEach((call) => {
    const status = call.call_status || 'unknown';
    callsByStatus[status] = (callsByStatus[status] || 0) + 1;
  });

  // Group by direction
  const callsByDirection: Record<string, number> = {
    inbound: inboundCalls,
    outbound: outboundCalls,
  };

  // Sentiment breakdown
  const sentimentBreakdown = {
    positive: calls.filter((c) => c.sentiment === 'positive').length,
    neutral: calls.filter((c) => c.sentiment === 'neutral').length,
    negative: calls.filter((c) => c.sentiment === 'negative').length,
  };

  // Answer rate (calls that were answered vs total)
  const answeredCalls = calls.filter(
    (c) => c.call_status === 'completed' || c.call_status === 'in-progress'
  ).length;
  const answerRate = totalCalls > 0 ? Math.round((answeredCalls / totalCalls) * 100) : 0;

  // Conversion rate (calls associated with won leads)
  const callsWithWonLeads = calls.filter((c) => {
    // Would need to join with leads table to get lead_status
    // For now, return 0 as placeholder
    return false;
  }).length;
  const conversionRate = totalCalls > 0 ? Math.round((callsWithWonLeads / totalCalls) * 100) : 0;

  return {
    totalCalls,
    inboundCalls,
    outboundCalls,
    averageDuration,
    totalDuration,
    callsByStatus,
    callsByDirection,
    sentimentBreakdown,
    answerRate,
    conversionRate,
  };
}

// ============================================================================
// CUSTOMER METRICS
// ============================================================================

export async function prepareCustomerMetrics(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<CustomerMetrics> {
  const supabase = createAdminClient();

  // Fetch all customers (not date-filtered, as we want total customers)
  const { data: allCustomers, error: allError } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', companyId);

  if (allError || !allCustomers) {
    console.error('Error fetching customers:', allError);
    throw new Error('Failed to fetch customer data');
  }

  const totalCustomers = allCustomers.length;
  const activeCustomers = allCustomers.filter((c) => c.customer_status === 'active').length;
  const inactiveCustomers = allCustomers.filter((c) => c.customer_status === 'inactive').length;

  // Average customer value (would need to calculate from quotes/service history)
  // Placeholder for now
  const averageCustomerValue = 0;

  // Group by city
  const customersByCity: Record<string, number> = {};
  allCustomers.forEach((customer) => {
    const city = customer.city || 'unknown';
    customersByCity[city] = (customersByCity[city] || 0) + 1;
  });

  // Group by state
  const customersByState: Record<string, number> = {};
  allCustomers.forEach((customer) => {
    const state = customer.state || 'unknown';
    customersByState[state] = (customersByState[state] || 0) + 1;
  });

  // Churn and retention (would need historical data)
  // Placeholder for now
  const churnRate = 0;
  const retentionRate = 0;

  return {
    totalCustomers,
    activeCustomers,
    inactiveCustomers,
    averageCustomerValue,
    customersByCity,
    customersByState,
    churnRate,
    retentionRate,
  };
}

// ============================================================================
// EMAIL METRICS
// ============================================================================

export async function prepareEmailMetrics(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<EmailMetrics> {
  const supabase = createAdminClient();

  // Fetch email automation logs
  const { data: emails, error } = await supabase
    .from('email_automation_log')
    .select('*')
    .eq('company_id', companyId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error || !emails) {
    console.error('Error fetching emails:', error);
    // Return empty metrics instead of throwing
    return {
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
      bounceRate: 0,
      templatePerformance: [],
    };
  }

  const totalSent = emails.filter((e) => e.send_status === 'sent' || e.send_status === 'delivered').length;
  const totalDelivered = emails.filter((e) => e.send_status === 'delivered').length;
  const totalOpened = emails.filter((e) => e.send_status === 'opened').length;
  const totalClicked = emails.filter((e) => e.send_status === 'clicked').length;

  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0;
  const clickRate = totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0;
  const conversionRate = 0; // Would need to track conversions
  const bounceRate = 0; // Would need bounce data

  // Template performance (would need to aggregate by template_id)
  const templatePerformance: EmailMetrics['templatePerformance'] = [];

  return {
    totalSent,
    totalDelivered,
    totalOpened,
    totalClicked,
    openRate,
    clickRate,
    conversionRate,
    bounceRate,
    templatePerformance,
  };
}

// ============================================================================
// AUTOMATION METRICS
// ============================================================================

export async function prepareAutomationMetrics(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<AutomationMetrics> {
  const supabase = createAdminClient();

  // Fetch active workflows
  const { data: workflows } = await supabase
    .from('automation_workflows')
    .select('id, name')
    .eq('company_id', companyId)
    .eq('is_active', true);

  const activeWorkflows = workflows?.length || 0;

  // Fetch executions
  const { data: executions, error } = await supabase
    .from('automation_executions')
    .select('*')
    .eq('company_id', companyId)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (error || !executions) {
    console.error('Error fetching executions:', error);
    return {
      activeWorkflows,
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      successRate: 0,
      averageExecutionTime: 0,
      workflowPerformance: [],
    };
  }

  const totalExecutions = executions.length;
  const successfulExecutions = executions.filter((e) => e.execution_status === 'completed').length;
  const failedExecutions = executions.filter((e) => e.execution_status === 'failed').length;

  const successRate =
    totalExecutions > 0 ? Math.round((successfulExecutions / totalExecutions) * 100) : 0;

  // Average execution time
  const completedExecutions = executions.filter(
    (e) => e.execution_status === 'completed' && e.started_at && e.completed_at
  );
  const averageExecutionTime =
    completedExecutions.length > 0
      ? Math.round(
          completedExecutions.reduce((sum, e) => {
            const start = new Date(e.started_at).getTime();
            const end = new Date(e.completed_at).getTime();
            const seconds = (end - start) / 1000;
            return sum + seconds;
          }, 0) / completedExecutions.length
        )
      : 0;

  // Workflow performance (would need to aggregate by workflow_id)
  const workflowPerformance: AutomationMetrics['workflowPerformance'] = [];

  return {
    activeWorkflows,
    totalExecutions,
    successfulExecutions,
    failedExecutions,
    successRate,
    averageExecutionTime,
    workflowPerformance,
  };
}

// ============================================================================
// SERVICE AREA METRICS
// ============================================================================

export async function prepareServiceAreaMetrics(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<ServiceAreaMetrics> {
  const supabase = createAdminClient();

  // Fetch service areas
  const { data: serviceAreas, error: areasError } = await supabase
    .from('service_areas')
    .select('*')
    .eq('company_id', companyId)
    .eq('is_active', true);

  if (areasError || !serviceAreas) {
    console.error('Error fetching service areas:', areasError);
    return {
      totalServiceAreas: 0,
      leadsByServiceArea: [],
      coverageGaps: [],
    };
  }

  const totalServiceAreas = serviceAreas.length;

  // Leads by service area (would need to match leads to service areas)
  const leadsByServiceArea: ServiceAreaMetrics['leadsByServiceArea'] = [];

  // Coverage gaps (areas with inquiries but no service)
  const coverageGaps: ServiceAreaMetrics['coverageGaps'] = [];

  return {
    totalServiceAreas,
    leadsByServiceArea,
    coverageGaps,
  };
}

// ============================================================================
// COMPREHENSIVE BUSINESS METRICS
// ============================================================================

export async function prepareBusinessMetrics(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<BusinessMetrics> {
  const supabase = createAdminClient();

  // Fetch company name
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single();

  const companyName = company?.name || 'Unknown Company';

  // Prepare all metrics in parallel
  const [leads, calls, customers, emails, automations, serviceAreas] = await Promise.all([
    prepareLeadMetrics(companyId, startDate, endDate),
    prepareCallMetrics(companyId, startDate, endDate),
    prepareCustomerMetrics(companyId, startDate, endDate),
    prepareEmailMetrics(companyId, startDate, endDate),
    prepareAutomationMetrics(companyId, startDate, endDate),
    prepareServiceAreaMetrics(companyId, startDate, endDate),
  ]);

  return {
    companyId,
    companyName,
    dateRange: {
      start: startDate,
      end: endDate,
    },
    leads,
    calls,
    customers,
    emails,
    automations,
    serviceAreas,
    updatedAt: new Date().toISOString(),
  };
}

// ============================================================================
// RECENT DATA FETCHERS (for chat context)
// ============================================================================

export async function fetchRecentLeads(companyId: string, limit: number = 10) {
  const supabase = createAdminClient();

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent leads:', error);
    return [];
  }

  return leads || [];
}

export async function fetchRecentCalls(companyId: string, limit: number = 10) {
  const supabase = createAdminClient();

  // Get company leads
  const { data: companyLeadIds } = await supabase
    .from('leads')
    .select('id')
    .eq('company_id', companyId);

  const leadIdArray = companyLeadIds?.map((l: { id: string }) => l.id) || [];

  if (leadIdArray.length === 0) {
    return [];
  }

  const { data: calls, error } = await supabase
    .from('call_records')
    .select('*')
    .in('lead_id', leadIdArray)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent calls:', error);
    return [];
  }

  return calls || [];
}

export async function fetchRecentCustomers(companyId: string, limit: number = 10) {
  const supabase = createAdminClient();

  const { data: customers, error } = await supabase
    .from('customers')
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent customers:', error);
    return [];
  }

  return customers || [];
}
