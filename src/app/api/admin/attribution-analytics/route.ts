import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const dateRange = searchParams.get('dateRange') || '30d';
    const metric = searchParams.get('metric') || 'overview';

    const supabase = createAdminClient();

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    let baseQuery = supabase
      .from('leads')
      .select(`
        id,
        company_id,
        lead_source,
        lead_status,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_term,
        utm_content,
        gclid,
        attribution_data,
        partial_lead_id,
        created_at,
        estimated_value
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (companyId) {
      baseQuery = baseQuery.eq('company_id', companyId);
    }

    const { data: leads, error } = await baseQuery;

    if (error) {
      console.error('Error fetching attribution data:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch attribution data' },
        { status: 500 }
      );
    }

    // Also get partial leads for funnel analysis
    let partialLeadsQuery = supabase
      .from('partial_leads')
      .select(`
        id,
        company_id,
        attribution_data,
        service_area_data,
        converted_to_lead_id,
        created_at
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString());

    if (companyId) {
      partialLeadsQuery = partialLeadsQuery.eq('company_id', companyId);
    }

    const { data: partialLeads } = await partialLeadsQuery;

    // Process analytics based on requested metric
    let analyticsData: any = {};

    switch (metric) {
      case 'overview':
        analyticsData = generateOverviewAnalytics(leads || [], partialLeads || []);
        break;
      case 'sources':
        analyticsData = generateSourceAnalytics(leads || [], partialLeads || []);
        break;
      case 'campaigns':
        analyticsData = generateCampaignAnalytics(leads || [], partialLeads || []);
        break;
      case 'funnel':
        analyticsData = generateFunnelAnalytics(leads || [], partialLeads || []);
        break;
      case 'performance':
        analyticsData = generatePerformanceAnalytics(leads || [], partialLeads || []);
        break;
      case 'trends':
        analyticsData = generateTrendAnalytics(leads || [], partialLeads || [], startDate, endDate);
        break;
      default:
        analyticsData = generateOverviewAnalytics(leads || [], partialLeads || []);
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
      metadata: {
        dateRange: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          label: dateRange
        },
        totalLeads: leads?.length || 0,
        totalPartialLeads: partialLeads?.length || 0,
        companyFilter: companyId
      }
    });

  } catch (error) {
    console.error('Error in attribution analytics API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateOverviewAnalytics(leads: any[], partialLeads: any[]) {
  const totalLeads = leads?.length || 0;
  const totalPartialLeads = partialLeads?.length || 0;
  const convertedPartialLeads = partialLeads?.filter(p => p.converted_to_lead_id)?.length || 0;
  const conversionRate = totalPartialLeads > 0 ? (convertedPartialLeads / totalPartialLeads) * 100 : 0;

  // Lead sources breakdown
  const sourceBreakdown = leads?.reduce((acc: any, lead) => {
    const source = determineLeadSource(lead);
    acc[source] = (acc[source] || 0) + 1;
    return acc;
  }, {}) || {};

  // Attribution quality metrics
  const attributionQuality = leads?.reduce((acc: any, lead) => {
    const hasGclid = !!lead.gclid;
    const hasUtm = !!(lead.utm_source || lead.utm_medium || lead.utm_campaign);
    const hasAttribution = hasGclid || hasUtm;
    const hasDetailedAttribution = lead.attribution_data && Object.keys(lead.attribution_data).length > 5;

    acc.total++;
    if (hasGclid) acc.withGclid++;
    if (hasUtm) acc.withUtm++;
    if (hasAttribution) acc.withAttribution++;
    if (hasDetailedAttribution) acc.withDetailedAttribution++;

    return acc;
  }, { total: 0, withGclid: 0, withUtm: 0, withAttribution: 0, withDetailedAttribution: 0 }) || {};

  return {
    summary: {
      totalLeads,
      totalPartialLeads,
      convertedPartialLeads,
      conversionRate: Math.round(conversionRate * 100) / 100,
      partialLeadConversionRate: conversionRate
    },
    sourceBreakdown,
    attributionQuality: {
      ...attributionQuality,
      gclidRate: attributionQuality.total > 0 ? (attributionQuality.withGclid / attributionQuality.total) * 100 : 0,
      utmRate: attributionQuality.total > 0 ? (attributionQuality.withUtm / attributionQuality.total) * 100 : 0,
      attributionRate: attributionQuality.total > 0 ? (attributionQuality.withAttribution / attributionQuality.total) * 100 : 0,
      detailedAttributionRate: attributionQuality.total > 0 ? (attributionQuality.withDetailedAttribution / attributionQuality.total) * 100 : 0
    }
  };
}

function generateSourceAnalytics(leads: any[], partialLeads: any[]) {
  // Analyze leads by source
  const leadsBySource = leads?.reduce((acc: any, lead) => {
    const source = determineLeadSource(lead);
    if (!acc[source]) {
      acc[source] = {
        count: 0,
        value: 0,
        conversions: 0,
        gclids: 0,
        campaigns: new Set()
      };
    }
    
    acc[source].count++;
    acc[source].value += lead.estimated_value || 0;
    if (lead.lead_status === 'won') acc[source].conversions++;
    if (lead.gclid) acc[source].gclids++;
    if (lead.utm_campaign) acc[source].campaigns.add(lead.utm_campaign);

    return acc;
  }, {}) || {};

  // Analyze partial leads by source
  const partialLeadsBySource = partialLeads?.reduce((acc: any, partialLead) => {
    const source = determineLeadSource(partialLead.attribution_data);
    if (!acc[source]) {
      acc[source] = {
        count: 0,
        converted: 0,
        served: 0
      };
    }
    
    acc[source].count++;
    if (partialLead.converted_to_lead_id) acc[source].converted++;
    if (partialLead.service_area_data?.served) acc[source].served++;

    return acc;
  }, {}) || {};

  // Combine and calculate metrics
  const sourceAnalytics = Object.keys({...leadsBySource, ...partialLeadsBySource}).map(source => {
    const leadData = leadsBySource[source] || { count: 0, value: 0, conversions: 0, gclids: 0, campaigns: new Set() };
    const partialData = partialLeadsBySource[source] || { count: 0, converted: 0, served: 0 };
    
    return {
      source,
      leads: leadData.count,
      partialLeads: partialData.count,
      totalValue: leadData.value,
      conversions: leadData.conversions,
      conversionRate: leadData.count > 0 ? (leadData.conversions / leadData.count) * 100 : 0,
      partialLeadConversionRate: partialData.count > 0 ? (partialData.converted / partialData.count) * 100 : 0,
      serviceAreaServed: partialData.served,
      serviceAreaServedRate: partialData.count > 0 ? (partialData.served / partialData.count) * 100 : 0,
      gclidCoverage: leadData.count > 0 ? (leadData.gclids / leadData.count) * 100 : 0,
      campaignCount: leadData.campaigns.size,
      avgLeadValue: leadData.count > 0 ? leadData.value / leadData.count : 0
    };
  }).sort((a, b) => b.leads - a.leads);

  return {
    sourceAnalytics,
    topSources: sourceAnalytics.slice(0, 5),
    totalSources: sourceAnalytics.length
  };
}

function generateCampaignAnalytics(leads: any[], partialLeads: any[]) {
  // Analyze by UTM campaign
  const campaignData = leads?.reduce((acc: any, lead) => {
    const campaign = lead.utm_campaign || 'No Campaign';
    const source = lead.utm_source || 'Unknown';
    const medium = lead.utm_medium || 'Unknown';
    
    const key = `${campaign}|${source}|${medium}`;
    
    if (!acc[key]) {
      acc[key] = {
        campaign,
        source,
        medium,
        leads: 0,
        value: 0,
        conversions: 0,
        gclids: 0
      };
    }
    
    acc[key].leads++;
    acc[key].value += lead.estimated_value || 0;
    if (lead.lead_status === 'won') acc[key].conversions++;
    if (lead.gclid) acc[key].gclids++;

    return acc;
  }, {}) || {};

  const campaignAnalytics = Object.values(campaignData).map((campaign: any) => ({
    ...campaign,
    conversionRate: campaign.leads > 0 ? (campaign.conversions / campaign.leads) * 100 : 0,
    avgLeadValue: campaign.leads > 0 ? campaign.value / campaign.leads : 0,
    gclidCoverage: campaign.leads > 0 ? (campaign.gclids / campaign.leads) * 100 : 0
  })).sort((a: any, b: any) => b.leads - a.leads);

  return {
    campaignAnalytics,
    topCampaigns: campaignAnalytics.slice(0, 10),
    totalCampaigns: campaignAnalytics.length
  };
}

function generateFunnelAnalytics(leads: any[], partialLeads: any[]) {
  const totalPartialLeads = partialLeads?.length || 0;
  const servedPartialLeads = partialLeads?.filter(p => p.service_area_data?.served)?.length || 0;
  const convertedPartialLeads = partialLeads?.filter(p => p.converted_to_lead_id)?.length || 0;
  const wonLeads = leads?.filter(l => l.lead_status === 'won')?.length || 0;

  const funnel = [
    {
      stage: 'Widget Interaction',
      count: totalPartialLeads,
      percentage: 100,
      dropoffRate: 0
    },
    {
      stage: 'Service Area Qualified',
      count: servedPartialLeads,
      percentage: totalPartialLeads > 0 ? (servedPartialLeads / totalPartialLeads) * 100 : 0,
      dropoffRate: totalPartialLeads > 0 ? ((totalPartialLeads - servedPartialLeads) / totalPartialLeads) * 100 : 0
    },
    {
      stage: 'Form Completed',
      count: convertedPartialLeads,
      percentage: servedPartialLeads > 0 ? (convertedPartialLeads / servedPartialLeads) * 100 : 0,
      dropoffRate: servedPartialLeads > 0 ? ((servedPartialLeads - convertedPartialLeads) / servedPartialLeads) * 100 : 0
    },
    {
      stage: 'Lead Won',
      count: wonLeads,
      percentage: convertedPartialLeads > 0 ? (wonLeads / convertedPartialLeads) * 100 : 0,
      dropoffRate: convertedPartialLeads > 0 ? ((convertedPartialLeads - wonLeads) / convertedPartialLeads) * 100 : 0
    }
  ];

  return {
    funnel,
    overallConversionRate: totalPartialLeads > 0 ? (wonLeads / totalPartialLeads) * 100 : 0,
    qualifiedToFormRate: servedPartialLeads > 0 ? (convertedPartialLeads / servedPartialLeads) * 100 : 0,
    formToWinRate: convertedPartialLeads > 0 ? (wonLeads / convertedPartialLeads) * 100 : 0
  };
}

function generatePerformanceAnalytics(leads: any[], partialLeads: any[]) {
  // Calculate performance by source
  const sourcePerformance = leads?.reduce((acc: any, lead) => {
    const source = determineLeadSource(lead);
    if (!acc[source]) {
      acc[source] = { leads: 0, value: 0, conversions: 0 };
    }
    
    acc[source].leads++;
    acc[source].value += lead.estimated_value || 0;
    if (lead.lead_status === 'won') acc[source].conversions++;

    return acc;
  }, {}) || {};

  const performanceMetrics = Object.entries(sourcePerformance).map(([source, data]: [string, any]) => ({
    source,
    leads: data.leads,
    totalValue: data.value,
    conversions: data.conversions,
    conversionRate: data.leads > 0 ? (data.conversions / data.leads) * 100 : 0,
    avgLeadValue: data.leads > 0 ? data.value / data.leads : 0,
    roi: data.conversions > 0 ? data.value / data.conversions : 0
  })).sort((a, b) => b.totalValue - a.totalValue);

  return {
    performanceMetrics,
    topPerformers: performanceMetrics.slice(0, 5),
    totalValue: performanceMetrics.reduce((sum, metric) => sum + metric.totalValue, 0),
    totalConversions: performanceMetrics.reduce((sum, metric) => sum + metric.conversions, 0)
  };
}

function generateTrendAnalytics(leads: any[], partialLeads: any[], startDate: Date, endDate: Date) {
  // Generate daily trends
  const dailyData = new Map();
  const dayCount = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Initialize all days
  for (let i = 0; i < dayCount; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateKey = date.toISOString().split('T')[0];
    dailyData.set(dateKey, {
      date: dateKey,
      leads: 0,
      partialLeads: 0,
      value: 0,
      conversions: 0
    });
  }

  // Populate leads data
  leads?.forEach(lead => {
    const dateKey = lead.created_at.split('T')[0];
    const dayData = dailyData.get(dateKey);
    if (dayData) {
      dayData.leads++;
      dayData.value += lead.estimated_value || 0;
      if (lead.lead_status === 'won') dayData.conversions++;
    }
  });

  // Populate partial leads data
  partialLeads?.forEach(partialLead => {
    const dateKey = partialLead.created_at.split('T')[0];
    const dayData = dailyData.get(dateKey);
    if (dayData) {
      dayData.partialLeads++;
    }
  });

  const trends = Array.from(dailyData.values());

  return {
    trends,
    totalDays: dayCount,
    avgDailyLeads: trends.reduce((sum, day) => sum + day.leads, 0) / dayCount,
    avgDailyPartialLeads: trends.reduce((sum, day) => sum + day.partialLeads, 0) / dayCount,
    avgDailyValue: trends.reduce((sum, day) => sum + day.value, 0) / dayCount
  };
}

function determineLeadSource(leadOrAttributionData: any): string {
  const data = leadOrAttributionData.attribution_data || leadOrAttributionData;
  
  if (!data) return 'Unknown';
  
  const { utm_source, utm_medium, gclid, traffic_source, lead_source } = data;
  
  // Use lead_source if available
  if (leadOrAttributionData.lead_source && leadOrAttributionData.lead_source !== 'other') {
    return leadOrAttributionData.lead_source.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  }
  
  if (gclid || (utm_source === 'google' && utm_medium === 'cpc')) {
    return 'Google Ads';
  } else if (utm_source === 'facebook' && ['paid', 'cpc', 'ads'].includes(utm_medium)) {
    return 'Facebook Ads';
  } else if (utm_source === 'linkedin') {
    return 'LinkedIn';
  } else if (traffic_source === 'organic') {
    return 'Organic Search';
  } else if (traffic_source === 'social') {
    return 'Social Media';
  } else if (traffic_source === 'referral') {
    return 'Referral';
  } else if (traffic_source === 'direct') {
    return 'Direct';
  }
  
  return 'Other';
}