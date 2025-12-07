import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { handleCorsPrelight, createCorsResponse, createCorsErrorResponse, validateOrigin } from '@/lib/cors';
import { sendEvent } from '@/lib/inngest/client';
import { createOrFindServiceAddress, extractAddressData } from '@/lib/service-addresses';

interface PartialSaveRequest {
  companyId: string;
  sessionId: string;
  stepCompleted: 'address' | 'confirm-address' | 'how-we-do-it' | 'quote-contact' | 'plan-comparison' | 'contact';
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
  serviceAreaData?: {
    served: boolean;
    areas: any[];
    primaryArea?: any;
  } | null;
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

    // Validate coordinate data - only required for steps that have location data
    const requiresCoordinates = ['address', 'confirm-address'].includes(stepCompleted);
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

    // First, try to find existing session, then insert or update accordingly
    const { data: existingSession } = await supabase
      .from('widget_sessions')
      .select('session_id')
      .eq('session_id', sessionId)
      .single();

    let sessionData, sessionError;
    
    if (existingSession) {
      // Session exists, update it (triggers will handle last_activity_at)
      const result = await supabase
        .from('widget_sessions')
        .update({
          user_agent: attributionData.user_agent,
          ip_address: ip !== 'unknown' ? ip : null,
          referrer_url: attributionData.referrer_url || null,
          page_url: attributionData.page_url
        })
        .eq('session_id', sessionId)
        .select()
        .single();
      sessionData = result.data;
      sessionError = result.error;
    } else {
      // Session doesn't exist, create it
      const result = await supabase
        .from('widget_sessions')
        .insert({
          session_id: sessionId,
          company_id: companyId,
          user_agent: attributionData.user_agent,
          ip_address: ip !== 'unknown' ? ip : null,
          referrer_url: attributionData.referrer_url || null,
          page_url: attributionData.page_url
        })
        .select()
        .single();
      sessionData = result.data;
      sessionError = result.error;
    }

    if (sessionError) {
      console.error('Error creating/updating widget session:', sessionError);
      return createCorsErrorResponse(
        `Failed to create session: ${sessionError.message || sessionError}`,
        origin,
        'widget',
        500
      );
    }

    // Create or update partial lead (updated_at is handled by database trigger)
    const upsertData: any = {
      company_id: companyId,
      session_id: sessionId,
      form_data: formData,
      step_completed: stepCompleted,
      attribution_data: {
        ...attributionData,
        ip_address: ip !== 'unknown' ? ip : null,
        saved_at: new Date().toISOString(),
        // Include progressive state in attribution data for comprehensive tracking
        progressive_state: progressiveState || null
      }
    };

    // Only include service_area_data if it's provided (don't overwrite existing data with null)
    if (serviceAreaData) {
      upsertData.service_area_data = serviceAreaData;
    }

    const { data: partialLead, error: partialLeadError } = await supabase
      .from('partial_leads')
      .upsert(upsertData, {
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

    // Create service address if this is an address validation step
    let serviceAddressId = null;
    if (['address', 'confirm-address'].includes(stepCompleted) && formData.addressDetails) {
      try {
        const addressData = extractAddressData(
          formData.addressDetails,
          formData.address,
          formData.latitude && formData.longitude ? {
            latitude: formData.latitude,
            longitude: formData.longitude
          } : undefined
        );

        if (addressData) {
          const serviceAddressResult = await createOrFindServiceAddress(companyId, addressData);
          
          if (serviceAddressResult.success && serviceAddressResult.serviceAddressId) {
            serviceAddressId = serviceAddressResult.serviceAddressId;
            
            // Update the partial lead with the service address ID
            const { error: updateError } = await supabase
              .from('partial_leads')
              .update({ service_address_id: serviceAddressId })
              .eq('id', partialLead.id);

            if (updateError) {
              console.error('Error updating partial lead with service address:', updateError);
              // Don't fail the request, just log the error
            }

            console.log(`✅ Service address ${serviceAddressResult.isExisting ? 'found' : 'created'}: ${serviceAddressId} for partial lead ${partialLead.id}`);
          } else {
            console.error('Failed to create service address:', serviceAddressResult.error);
            // Don't fail the request, continue without service address
          }
        }
      } catch (error) {
        console.error('Error processing service address for partial lead:', error);
        // Don't fail the request, continue without service address
      }
    }

    // Send Inngest event for partial lead created
    try {
      await sendEvent({
        name: 'partial-lead/created',
        data: {
          partialLeadId: partialLead.id,
          companyId,
          sessionId,
          stepCompleted,
          formData,
          serviceAreaData,
          attribution: {
            utm_source: attributionData.utm_source,
            utm_medium: attributionData.utm_medium,
            utm_campaign: attributionData.utm_campaign,
            utm_term: attributionData.utm_term,
            utm_content: attributionData.utm_content,
            gclid: attributionData.gclid,
            referrer_url: attributionData.referrer_url,
            referrer_domain: attributionData.referrer_domain,
            traffic_source: attributionData.traffic_source,
            page_url: attributionData.page_url
          },
          createdAt: new Date().toISOString()
        }
      });
      console.log(`✅ Partial lead created event sent for ${partialLead.id} at step ${stepCompleted}`);
    } catch (eventError) {
      // Don't fail the API call if event emission fails, but log it
      console.error('Failed to send partial lead created event:', eventError);
    }

    return createCorsResponse({
      success: true,
      partialLeadId: partialLead.id,
      sessionId: sessionId,
      stepCompleted: stepCompleted,
      serviceAreaServed: serviceAreaData?.served || null,
      serviceAddressId: serviceAddressId
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