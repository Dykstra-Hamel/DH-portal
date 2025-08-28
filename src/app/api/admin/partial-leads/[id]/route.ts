import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    
    const supabase = createAdminClient();

    const { data: partialLead, error } = await supabase
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
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching partial lead:', error);
      return NextResponse.json(
        { error: 'Partial lead not found' },
        { status: 404 }
      );
    }

    // Fetch company data separately
    const { data: company } = await supabase
      .from('companies')
      .select('id, name, website, widget_config')
      .eq('id', partialLead.company_id)
      .single();

    // Fetch lead data if this partial lead was converted
    let convertedLead = null;
    if (partialLead.converted_to_lead_id) {
      const { data: lead } = await supabase
        .from('leads')
        .select(`
          id,
          lead_status,
          lead_source,
          priority,
          comments,
          created_at,
          customers(
            id,
            first_name,
            last_name,
            email,
            phone
          )
        `)
        .eq('id', partialLead.converted_to_lead_id)
        .single();
      
      convertedLead = lead;
    }

    // Enrich the partial lead data with actual company information
    const enrichedPartialLead = {
      ...partialLead,
      status: partialLead.converted_to_lead_id ? 'converted' : 
              new Date(partialLead.expires_at) < new Date() ? 'expired' : 'active',
      completionPercentage: calculateCompletionPercentage(partialLead.form_data, partialLead.step_completed),
      daysActive: Math.ceil((new Date().getTime() - new Date(partialLead.created_at).getTime()) / (1000 * 60 * 60 * 24)),
      progressiveState: partialLead.attribution_data?.progressive_state || null,
      engagementMetrics: extractEngagementMetrics(partialLead.attribution_data),
      leadSource: determineLeadSource(partialLead.attribution_data),
      serviceAreaStatus: partialLead.service_area_data?.served ? 'served' : 'outside_area',
      formAnalysis: analyzeFormData(partialLead.form_data),
      attributionAnalysis: analyzeAttributionData(partialLead.attribution_data),
      // Add actual company data
      companies: company || { id: partialLead.company_id, name: 'Unknown Company', website: '', widget_config: null },
      // Add converted lead data if available
      leads: convertedLead ? [convertedLead] : [],
      widget_sessions: null,
      sessionAnalysis: null
    };

    return NextResponse.json({
      success: true,
      data: enrichedPartialLead
    });

  } catch (error) {
    console.error('Error in partial lead detail API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify authentication and admin authorization
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user || !(await isAuthorizedAdmin(user))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { id } = await params;
    const body = await request.json();
    
    const supabase = createAdminClient();

    // Only allow updating certain fields
    const allowedUpdates: any = {};
    
    if (body.expires_at) {
      allowedUpdates.expires_at = body.expires_at;
    }
    
    if (body.notes) {
      // Add admin notes to attribution data
      allowedUpdates.attribution_data = {
        ...body.attribution_data,
        admin_notes: body.notes,
        admin_updated_at: new Date().toISOString()
      };
    }

    const { data, error } = await supabase
      .from('partial_leads')
      .update({
        ...allowedUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating partial lead:', error);
      return NextResponse.json(
        { error: 'Failed to update partial lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Partial lead updated successfully'
    });

  } catch (error) {
    console.error('Error in PATCH partial lead API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function calculateCompletionPercentage(formData: any, stepCompleted?: string): number {
  const stepPercentages: { [key: string]: number } = {
    'pest_issue_completed': 15,
    'address_validated': 30,
    'address_confirmed': 45,
    'how_we_do_it_viewed': 60,
    'offer_viewed': 75,
    'plan_selected': 85,
    'contact_started': 95,
    'contact_completed': 100
  };
  
  return stepCompleted ? (stepPercentages[stepCompleted] || 0) : 0;
}

function extractEngagementMetrics(attributionData: any) {
  const progressiveState = attributionData?.progressive_state;
  if (!progressiveState) return null;
  
  return {
    totalTimeSpent: progressiveState.userEngagement?.totalTimeSpent || 0,
    currentSessionDuration: progressiveState.userEngagement?.currentSessionDuration || 0,
    completionPercentage: progressiveState.completionPercentage || 0,
    stepCompletions: progressiveState.stepCompletions || {},
    returningUser: progressiveState.userEngagement?.returningUser || false,
    abandonmentPoints: progressiveState.userEngagement?.abandonmentPoints || [],
    stepTimes: progressiveState.userEngagement?.stepTimes || {},
    validationErrors: progressiveState.validationErrors || {}
  };
}

function determineLeadSource(attributionData: any): string {
  if (!attributionData) return 'Unknown';
  
  const { utm_source, utm_medium, gclid, traffic_source } = attributionData;
  
  if (gclid || (utm_source === 'google' && utm_medium === 'cpc')) {
    return 'Google Ads';
  } else if (utm_source === 'facebook' && ['paid', 'cpc', 'ads'].includes(utm_medium)) {
    return 'Facebook Ads';
  } else if (utm_source === 'linkedin') {
    return 'LinkedIn';
  } else if (traffic_source === 'google_ads') {
    return 'Google Ads';
  } else if (traffic_source === 'paid_search') {
    return 'Paid Search';
  } else if (traffic_source === 'organic_search') {
    return 'Organic Search';
  } else if (traffic_source === 'social') {
    return 'Social Media';
  } else if (traffic_source === 'email') {
    return 'Email';
  } else if (traffic_source === 'referral') {
    return 'Referral';
  } else if (traffic_source === 'direct') {
    return 'Direct';
  } else if (traffic_source && traffic_source.startsWith('utm_')) {
    return `UTM: ${traffic_source.replace('utm_', '').toUpperCase()}`;
  }
  
  return 'Widget';
}

function analyzeFormData(formData: any) {
  if (!formData) return null;
  
  return {
    fieldsCompleted: [
      formData.pestIssue && 'Pest Issue',
      formData.address && 'Address',
      formData.homeSize && 'Home Size',
      formData.contactInfo?.name && 'Name',
      formData.contactInfo?.email && 'Email',
      formData.contactInfo?.phone && 'Phone'
    ].filter(Boolean),
    addressDetails: {
      hasCoordinates: !!(formData.latitude && formData.longitude),
      structured: !!(formData.addressStreet && formData.addressCity),
      complete: !!(formData.address && formData.addressStreet && formData.addressCity && formData.addressState && formData.addressZip)
    },
    contactCompleteness: {
      hasName: !!formData.contactInfo?.name,
      hasEmail: !!formData.contactInfo?.email,
      hasPhone: !!formData.contactInfo?.phone,
      isComplete: !!(formData.contactInfo?.name && formData.contactInfo?.email && formData.contactInfo?.phone)
    }
  };
}

function analyzeAttributionData(attributionData: any) {
  if (!attributionData) return null;
  
  return {
    hasUtmData: !!(attributionData.utm_source || attributionData.utm_medium || attributionData.utm_campaign),
    hasGclid: !!attributionData.gclid,
    consentStatus: attributionData.consent_status || 'unknown',
    privacyCompliant: attributionData.privacy_compliant || false,
    crossDomainData: !!attributionData.cross_domain_data,
    gtmIntegration: !!attributionData.gtm_integration,
    collectionMethod: attributionData.collection_method || 'basic',
    originalDomain: attributionData.domain || attributionData.original_domain,
    referrerDomain: attributionData.referrer_domain
  };
}

function analyzeSessionData(sessionData: any) {
  if (!sessionData) return null;
  
  const firstVisit = new Date(sessionData.first_visit_at);
  const lastActivity = new Date(sessionData.last_activity_at);
  const sessionDuration = lastActivity.getTime() - firstVisit.getTime();
  
  return {
    sessionDuration: Math.round(sessionDuration / 1000), // seconds
    sessionDurationFormatted: formatDuration(sessionDuration),
    userAgent: parseUserAgent(sessionData.user_agent),
    location: {
      ip: sessionData.ip_address,
      referrer: sessionData.referrer_url,
      page: sessionData.page_url
    },
    timeline: {
      firstVisit: sessionData.first_visit_at,
      lastActivity: sessionData.last_activity_at,
      isRecent: (new Date().getTime() - lastActivity.getTime()) < (24 * 60 * 60 * 1000) // Within 24 hours
    }
  };
}

function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

function parseUserAgent(userAgent: string): any {
  if (!userAgent) return null;
  
  // Simple user agent parsing
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
  const isTablet = /iPad|Android(?!.*Mobile)/.test(userAgent);
  const isDesktop = !isMobile && !isTablet;
  
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';
  
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
  
  return {
    browser,
    os,
    deviceType: isDesktop ? 'Desktop' : isTablet ? 'Tablet' : 'Mobile',
    isMobile,
    isTablet,
    isDesktop,
    raw: userAgent
  };
}