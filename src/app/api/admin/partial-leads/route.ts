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
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    const supabase = createAdminClient();

    // Build simplified query for debugging
    let query = supabase
      .from('partial_leads')
      .select(`
        id,
        company_id,
        session_id,
        form_data,
        step_completed,
        service_area_data,
        attribution_data,
        created_at,
        updated_at,
        expires_at,
        converted_to_lead_id
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (status === 'converted') {
      query = query.not('converted_to_lead_id', 'is', null);
    } else if (status === 'active') {
      query = query.is('converted_to_lead_id', null).gt('expires_at', new Date().toISOString());
    } else if (status === 'expired') {
      query = query.is('converted_to_lead_id', null).lt('expires_at', new Date().toISOString());
    }

    const { data: partialLeads, error, count } = await query;

    if (error) {
      console.error('Error fetching partial leads:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch partial leads' },
        { status: 500 }
      );
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('partial_leads')
      .select('*', { count: 'exact', head: true });

    if (companyId) {
      countQuery = countQuery.eq('company_id', companyId);
    }

    if (status === 'converted') {
      countQuery = countQuery.not('converted_to_lead_id', 'is', null);
    } else if (status === 'active') {
      countQuery = countQuery.is('converted_to_lead_id', null).gt('expires_at', new Date().toISOString());
    } else if (status === 'expired') {
      countQuery = countQuery.is('converted_to_lead_id', null).lt('expires_at', new Date().toISOString());
    }

    const { count: totalCount, error: countError } = await countQuery;
    
    if (countError) {
      console.error('Error fetching count:', countError);
    }

    // Fetch company data separately
    const companyIds = [...new Set(partialLeads?.map(lead => lead.company_id) || [])];
    const companiesMap = new Map();
    
    if (companyIds.length > 0) {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name, website')
        .in('id', companyIds);
      
      companies?.forEach(company => {
        companiesMap.set(company.id, company);
      });
    }

    // Fetch lead data for converted partial leads
    const convertedLeadIds = partialLeads?.filter(lead => lead.converted_to_lead_id).map(lead => lead.converted_to_lead_id) || [];
    const leadsMap = new Map();
    
    if (convertedLeadIds.length > 0) {
      const { data: leads } = await supabase
        .from('leads')
        .select('id, lead_status, priority, created_at')
        .in('id', convertedLeadIds);
      
      leads?.forEach(lead => {
        leadsMap.set(lead.id, lead);
      });
    }

    // Process and enrich the data with proper company and lead information
    const enrichedPartialLeads = partialLeads?.map(lead => ({
      ...lead,
      status: lead.converted_to_lead_id ? 'converted' : 
              new Date(lead.expires_at) < new Date() ? 'expired' : 'active',
      completionPercentage: calculateCompletionPercentage(lead.form_data),
      daysActive: Math.ceil((new Date().getTime() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      progressiveState: lead.attribution_data?.progressive_state || null,
      engagementMetrics: extractEngagementMetrics(lead.attribution_data),
      leadSource: determineLeadSource(lead.attribution_data),
      serviceAreaStatus: lead.service_area_data?.status === 'unknown' ? 'unknown' : 
                         lead.service_area_data?.served ? 'served' : 'outside_area',
      // Add actual company data
      companies: companiesMap.get(lead.company_id) || { id: lead.company_id, name: 'Unknown Company', website: '' },
      // Add actual lead data for converted partial leads
      leads: lead.converted_to_lead_id ? [leadsMap.get(lead.converted_to_lead_id)].filter(Boolean) : []
    })) || [];

    return NextResponse.json({
      success: true,
      data: enrichedPartialLeads,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in partial leads API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate completion percentage
function calculateCompletionPercentage(formData: any): number {
  if (!formData) return 0;
  
  const fields = {
    pestIssue: formData.pestIssue ? 25 : 0,
    address: formData.address && formData.latitude ? 25 : 0,
    homeSize: formData.homeSize ? 25 : 0,
    contact: (
      (formData.contactInfo?.name ? 8 : 0) +
      (formData.contactInfo?.email ? 8 : 0) +
      (formData.contactInfo?.phone ? 9 : 0)
    )
  };
  
  return Math.round(Object.values(fields).reduce((sum, val) => sum + val, 0));
}

// Helper function to extract engagement metrics
function extractEngagementMetrics(attributionData: any) {
  const progressiveState = attributionData?.progressive_state;
  if (!progressiveState) return null;
  
  return {
    totalTimeSpent: progressiveState.userEngagement?.totalTimeSpent || 0,
    currentSessionDuration: progressiveState.userEngagement?.currentSessionDuration || 0,
    completionPercentage: progressiveState.completionPercentage || 0,
    stepCompletions: progressiveState.stepCompletions || {},
    returningUser: progressiveState.userEngagement?.returningUser || false,
    abandonmentPoints: progressiveState.userEngagement?.abandonmentPoints || []
  };
}

// Helper function to determine lead source
function determineLeadSource(attributionData: any): string {
  if (!attributionData) return 'unknown';
  
  const { utm_source, utm_medium, gclid, traffic_source } = attributionData;
  
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

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Partial lead ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { error } = await supabase
      .from('partial_leads')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting partial lead:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete partial lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Partial lead deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE partial leads API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}