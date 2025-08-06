import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { handleCorsPrelight, createCorsResponse, createCorsErrorResponse, validateOrigin } from '@/lib/cors';

interface PartialSaveRequest {
  companyId: string;
  sessionId: string;
  stepCompleted: 'pest_issue_completed' | 'urgency_completed' | 'address_validated' | 'contact_started';
  formData: {
    pestType?: string;
    urgency?: string;
    address?: string;
    addressDetails?: {
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
    };
    latitude: number | null;
    longitude: number | null;
    contactInfo?: {
      name?: string;
      phone?: string;
      email?: string;
    };
  };
  serviceAreaData: {
    served: boolean;
    areas: any[];
    primaryArea?: any;
  };
  attributionData: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    gclid?: string;
    referrer_url?: string;
    referrer_domain?: string;
    traffic_source: string;
    page_url: string;
    user_agent: string;
    timestamp: string;
    collected_at: string;
  };
  progressiveState?: {
    currentStep: string;
    completionPercentage: number;
    stepCompletions: any;
    userEngagement: any;
    validationErrors: any;
    autoSaveTimestamp: string;
    formVersion: string;
  };
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return await handleCorsPrelight(request, 'widget');
}

// Save partial form submission
export async function POST(request: NextRequest) {
  try {
    // Validate origin first
    const { isValid, origin, response: corsResponse } = await validateOrigin(request, 'widget');
    if (!isValid && corsResponse) {
      return corsResponse;
    }

    const body: PartialSaveRequest = await request.json();
    const {
      companyId,
      sessionId,
      stepCompleted,
      formData,
      serviceAreaData,
      attributionData,
      progressiveState
    } = body;

    // Validate required fields
    if (!companyId || !sessionId || !formData || !attributionData) {
      return createCorsErrorResponse(
        'Missing required fields: companyId, sessionId, formData, and attributionData are required',
        origin,
        'widget',
        400
      );
    }

    // Validate coordinate data - only required for steps after address entry
    const requiresCoordinates = !['pest_issue_completed', 'urgency_completed'].includes(stepCompleted);
    if (requiresCoordinates && (typeof formData.latitude !== 'number' || typeof formData.longitude !== 'number')) {
      return createCorsErrorResponse(
        'Invalid coordinate data: latitude and longitude must be numbers for this step',
        origin,
        'widget',
        400
      );
    }

    const supabase = createAdminClient();

    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 
               request.headers.get('x-real-ip') || 
               'unknown';

    // First, create or update widget session
    const { data: sessionData, error: sessionError } = await supabase
      .from('widget_sessions')
      .upsert({
        session_id: sessionId,
        company_id: companyId,
        user_agent: attributionData.user_agent,
        ip_address: ip !== 'unknown' ? ip : null,
        referrer_url: attributionData.referrer_url || null,
        page_url: attributionData.page_url,
        last_activity_at: new Date().toISOString()
      }, {
        onConflict: 'session_id'
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating/updating widget session:', sessionError);
      return createCorsErrorResponse(
        `Failed to create session: ${sessionError.message || sessionError}`,
        origin,
        'widget',
        500
      );
    }

    // Create or update partial lead
    const { data: partialLead, error: partialLeadError } = await supabase
      .from('partial_leads')
      .upsert({
        company_id: companyId,
        session_id: sessionId,
        form_data: formData,
        step_completed: stepCompleted,
        service_area_data: serviceAreaData,
        attribution_data: {
          ...attributionData,
          ip_address: ip !== 'unknown' ? ip : null,
          saved_at: new Date().toISOString(),
          // Include progressive state in attribution data for comprehensive tracking
          progressive_state: progressiveState || null
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'session_id'
      })
      .select()
      .single();

    if (partialLeadError) {
      console.error('Error creating/updating partial lead:', partialLeadError);
      return createCorsErrorResponse(
        `Failed to save partial lead data: ${partialLeadError.message || partialLeadError}`,
        origin,
        'widget',
        500
      );
    }


    return createCorsResponse({
      success: true,
      partialLeadId: partialLead.id,
      sessionId: sessionId,
      stepCompleted: stepCompleted,
      serviceAreaServed: serviceAreaData.served
    }, origin, 'widget');

  } catch (error) {
    console.error('Error in partial-save endpoint:', error);
    return createCorsErrorResponse(
      'Internal server error',
      null,
      'widget',
      500
    );
  }
}