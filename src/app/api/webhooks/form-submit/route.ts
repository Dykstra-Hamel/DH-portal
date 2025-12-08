/**
 * Universal Form Submission Webhook
 *
 * Accepts flexible form submissions from whitelisted domains, uses Gemini AI
 * to normalize data, and creates customers + tickets automatically.
 *
 * Supports both:
 * - application/json (modern JavaScript forms)
 * - application/x-www-form-urlencoded (traditional HTML forms)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { normalizePhoneNumber } from '@/lib/utils';
import {
  handleCorsPrelight,
  createCorsResponse,
  createCorsErrorResponse,
  validateOrigin,
} from '@/lib/cors';
import { parseFormSubmission } from '@/lib/gemini/form-parser';
import type { FormSubmissionResponse } from '@/types/form-submission';
import {
  createOrFindServiceAddress,
  linkCustomerToServiceAddress,
} from '@/lib/service-addresses';

/**
 * Check for recent duplicate form submissions
 * @param supabase - Supabase client
 * @param companyId - Company ID to check within
 * @param email - Email address from normalized data
 * @param phone - Phone number from normalized data
 * @param windowSeconds - Time window in seconds to check for duplicates (default: 30)
 * @returns true if a duplicate is found, false otherwise
 */
async function checkForRecentDuplicate(
  supabase: any,
  companyId: string,
  currentSubmissionId: string,
  email: string | null,
  phone: string | null,
  windowSeconds: number = 30
): Promise<boolean> {
  // Don't check if we have neither email nor phone
  if (!email && !phone) {
    return false;
  }

  const cutoffTime = new Date(Date.now() - windowSeconds * 1000);

  const { data, error } = await supabase
    .from('form_submissions')
    .select('id, normalized_data, created_at')
    .eq('company_id', companyId)
    .neq('id', currentSubmissionId)
    .gte('created_at', cutoffTime.toISOString())
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !data || data.length === 0) {
    return false;
  }

  // Check if any recent submission matches email or phone
  return data.some((submission: any) => {
    const normalizedData = submission.normalized_data as any;
    if (!normalizedData) return false;

    // Match by email (case-insensitive)
    if (email && normalizedData.email) {
      if (normalizedData.email.toLowerCase() === email.toLowerCase()) {
        return true;
      }
    }

    // Match by phone number
    if (phone && normalizedData.phone_number === phone) {
      return true;
    }

    return false;
  });
}

export async function OPTIONS(request: NextRequest) {
  return handleCorsPrelight(request, 'widget');
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const origin = request.headers.get('origin') || '';
    const referer = request.headers.get('referer') || '';

    // Step 1: Parse request body based on Content-Type
    const contentType = request.headers.get('content-type') || '';
    let rawPayload: Record<string, any>;

    if (contentType.includes('application/json')) {
      rawPayload = await request.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData();
      rawPayload = Object.fromEntries(formData);
    } else {
      return createCorsErrorResponse(
        'Unsupported content type. Use application/json or application/x-www-form-urlencoded',
        origin,
        'widget',
        415
      );
    }

    // Handle nested payload structure (e.g., Webflow: { triggerType: 'form_submission', payload: { data: {...}, pageUrl: '...' } })
    let formData = rawPayload;
    let sourceUrl: string | null = null;

    // Extract form data from various nested structures
    if (rawPayload.payload && typeof rawPayload.payload === 'object') {
      // Check if form fields are in payload.data (Webflow style)
      if (rawPayload.payload.data && typeof rawPayload.payload.data === 'object') {
        formData = rawPayload.payload.data;
      } else {
        formData = rawPayload.payload;
      }

      // Extract source URL from payload if available
      if (rawPayload.payload.pageUrl) {
        sourceUrl = rawPayload.payload.pageUrl;
      }
    }

    // Step 2: Validate origin using widget whitelist and get company info
    // Pass sourceUrl (pageUrl from Webflow) as fallback when headers are missing
    const corsValidation = await validateOrigin(request, 'widget', sourceUrl);

    if (!corsValidation.isValid) {
      return corsValidation.response || NextResponse.json(
        { error: 'Origin not allowed' },
        { status: 403 }
      );
    }

    // Get company info from CORS validation
    const companyId = corsValidation.companyId || null;

    // Step 3: Determine source URL for tracking
    const supabase = createAdminClient();
    let lookupUrl: string | null = null;

    // Priority order for determining the source URL:
    // 1. pageUrl from payload (Webflow, etc.)
    // 2. In dev with ngrok: Referer (actual form domain) over Origin (ngrok URL)
    // 3. In production: Origin header
    // 4. Referer header as fallback
    const isNgrokInDev = process.env.NODE_ENV === 'development' && origin?.includes('.ngrok');

    if (sourceUrl) {
      lookupUrl = sourceUrl;
    } else if (isNgrokInDev) {
      // For ngrok testing, use referer (actual domain) over origin (ngrok URL)
      lookupUrl = referer || origin;
    } else if (origin) {
      lookupUrl = origin;
    } else if (referer) {
      lookupUrl = referer;
    }

    if (!lookupUrl) {
      return createCorsErrorResponse(
        'Unable to determine source URL',
        origin,
        'widget',
        400
      );
    }

    // If company wasn't found from origin header, we still need to verify we have one
    if (!companyId) {
      return createCorsErrorResponse(
        'Unable to determine company from origin',
        origin,
        'widget',
        403
      );
    }

    // Extract domain for tracking
    const urlOrigin = lookupUrl.startsWith('http') ? new URL(lookupUrl).origin : lookupUrl;
    const sourceDomain = urlOrigin.replace(/^https?:\/\//, '');

    // Step 4: Extract campaign_id if present (supports multiple sources)
    // Priority: URL query param > form field > top-level payload
    const queryParams = request.nextUrl.searchParams;
    const campaignId = queryParams.get('campaign_id') || queryParams.get('campaignId') ||
                       formData.campaignId || formData.campaign_id || formData['campaign-id'] ||
                       rawPayload.campaignId || rawPayload.campaign_id || rawPayload['campaign-id'] || null;

    // Step 5: Create initial form_submissions record (pending state)
    const userAgent = request.headers.get('user-agent') || null;
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                      request.headers.get('x-real-ip') ||
                      null;

    const { data: formSubmission, error: submissionError } = await supabase
      .from('form_submissions')
      .insert({
        company_id: companyId,
        source_url: lookupUrl,
        source_domain: sourceDomain,
        raw_payload: rawPayload,
        content_type: contentType,
        processing_status: 'pending',
        ip_address: ipAddress,
        user_agent: userAgent,
        campaign_id: campaignId,
      })
      .select('id')
      .single();

    if (submissionError || !formSubmission) {
      console.error('❌ Failed to create form submission:', submissionError);
      return createCorsErrorResponse(
        'Failed to store form submission',
        origin,
        'widget',
        500
      );
    }

    const submissionId = formSubmission.id;

    // Step 5: Parse form data with Gemini AI
    const geminiResult = await parseFormSubmission(formData);

    // Step 6: Update form_submissions with normalized data
    const { error: updateError } = await supabase
      .from('form_submissions')
      .update({
        normalized_data: geminiResult.normalized,
        gemini_confidence: geminiResult.confidence,
        processing_status: geminiResult.success ? 'processed' : 'failed',
        processing_error: geminiResult.error || null,
        processed_at: new Date().toISOString(),
      })
      .eq('id', submissionId);

    if (updateError) {
      console.error('⚠️ Failed to update form submission with Gemini data:', updateError);
    }

    // Step 6.5: Check for duplicate submissions (within 30 second window)
    const { normalized } = geminiResult;
    const isDuplicate = await checkForRecentDuplicate(
      supabase,
      companyId,
      submissionId,
      normalized.email || null,
      normalized.phone_number || null,
      30
    );

    if (isDuplicate) {
      // Update form submission to mark as duplicate
      await supabase
        .from('form_submissions')
        .update({
          processing_status: 'failed',
          processing_error: 'Duplicate submission detected within 30 seconds',
        })
        .eq('id', submissionId);

      console.log('🔄 Duplicate form submission detected:', {
        submissionId,
        companyId,
        email: normalized.email ? '***@' + normalized.email.split('@')[1] : null,
        phone: normalized.phone_number ? '***' + normalized.phone_number.slice(-4) : null,
      });

      return createCorsResponse(
        {
          success: true,
          message: 'Form submission received (duplicate detected)',
          duplicate: true,
        },
        origin,
        'widget'
      );
    }

    // Step 7: Lookup or create customer
    let customerId: string | null = null;

    // Try to find existing customer by email first, then phone
    if (normalized.email) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', normalized.email)
        .eq('company_id', companyId)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      }
    }

    if (!customerId && normalized.phone_number) {
      const normalizedPhone = normalizePhoneNumber(normalized.phone_number);
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', normalizedPhone)
        .eq('company_id', companyId)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      }
    }

    // Create new customer if not found
    if (!customerId) {
      // first_name and last_name are required in customers table
      const firstName = normalized.first_name || 'Unknown';
      const lastName = normalized.last_name || 'Customer';

      const customerData: any = {
        company_id: companyId,
        first_name: firstName,
        last_name: lastName,
        email: normalized.email || null,
        phone: normalized.phone_number ? normalizePhoneNumber(normalized.phone_number) : null,
        address: normalized.street_address || null,
        city: normalized.city || null,
        state: normalized.state || null,
        zip_code: normalized.zip || null,
      };

      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert(customerData)
        .select('id')
        .single();

      if (customerError) {
        console.error('Failed to create customer:', customerError);
      } else if (newCustomer) {
        customerId = newCustomer.id;
      }
    }

    // Step 8: Create or find service address if we have address data
    let serviceAddressId: string | null = null;
    const hasAddressData = normalized.street_address || normalized.city || normalized.state || normalized.zip;

    if (hasAddressData && customerId && companyId) {
      // Geocode the address to get coordinates for satellite imagery
      let latitude: number | null = null;
      let longitude: number | null = null;
      let hasStreetView = false;

      if (normalized.city && normalized.state) {
        try {
          const geocodeResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/internal/geocode`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              street: normalized.street_address,
              city: normalized.city,
              state: normalized.state,
              zip: normalized.zip,
            }),
          });

          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            if (geocodeData.success && geocodeData.coordinates) {
              latitude = geocodeData.coordinates.lat;
              longitude = geocodeData.coordinates.lng;
              hasStreetView = geocodeData.coordinates.hasStreetView || false;
              console.log(`✅ Geocoded form submission address: ${latitude}, ${longitude}`);
            }
          }
        } catch (error) {
          console.warn('⚠️ Geocoding failed for form submission address:', error);
          // Continue without coordinates
        }
      }

      const addressResult = await createOrFindServiceAddress(companyId, {
        street_address: normalized.street_address,
        city: normalized.city,
        state: normalized.state,
        zip_code: normalized.zip,
        latitude: latitude ?? undefined,
        longitude: longitude ?? undefined,
        hasStreetView,
        address_type: normalized.own_or_rent === 'rent' ? 'residential' :
                      normalized.own_or_rent === 'own' ? 'residential' :
                      'residential',
        property_notes: normalized.additional_comments || undefined,
      });

      if (addressResult.success && addressResult.serviceAddressId) {
        serviceAddressId = addressResult.serviceAddressId;

        // Link service address to customer
        const linkResult = await linkCustomerToServiceAddress(
          customerId,
          serviceAddressId,
          normalized.own_or_rent === 'own' ? 'owner' : 'tenant',
          true // Set as primary address
        );

        if (!linkResult.success) {
          console.warn('Failed to link service address to customer:', linkResult.error);
        }
      } else if (addressResult.error) {
        console.warn('Failed to create service address:', addressResult.error);
      }
    }

    // Step 9: Create lead (if campaign) or ticket (if not)
    let ticketId: string | null = null;
    let leadId: string | null = null;

    if (campaignId) {
      // Campaign submission: Create a lead instead of a ticket
      // First, look up the campaign UUID from the campaign_id string
      const { data: campaign, error: campaignError } = await supabase
        .from('campaigns')
        .select('id')
        .eq('campaign_id', campaignId)
        .eq('company_id', companyId)
        .single();

      if (campaignError) {
        console.error('Failed to find campaign:', campaignError);
        return createCorsErrorResponse(
          'Campaign not found',
          origin,
          'widget',
          404
        );
      }

      const leadData: any = {
        company_id: companyId,
        customer_id: customerId,
        campaign_id: campaign.id, // Store campaign UUID for proper FK relationship
        lead_source: 'campaign',
        lead_type: 'web_form',
        service_type: geminiResult.ticket.service_type || 'Pest Control',
        lead_status: 'new',
        comments: geminiResult.ticket.description || 'Campaign form submission',
        priority: geminiResult.ticket.priority || 'medium',
        utm_campaign: campaignId, // Also store in UTM for tracking purposes
        ip_address: ipAddress,
        user_agent: userAgent,
        referrer_url: lookupUrl,
      };

      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert(leadData)
        .select('id')
        .single();

      if (leadError) {
        console.error('Failed to create lead:', leadError);
        return createCorsErrorResponse(
          'Failed to create lead',
          origin,
          'widget',
          500
        );
      }

      leadId = lead.id;
    } else {
      // Non-campaign submission: Create a ticket (existing behavior)
      const ticketData: any = {
        company_id: companyId,
        customer_id: customerId,
        service_address_id: serviceAddressId,
        type: 'web_form',
        source: 'website',
        description: geminiResult.ticket.description || 'Form submission',
        priority: geminiResult.ticket.priority || 'medium',
        service_type: geminiResult.ticket.service_type || 'Pest Control',
        status: 'new',
        pest_type: geminiResult.ticket.pest_type || 'General Pest Control',
        form_submission_id: submissionId,
      };

      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert(ticketData)
        .select('id')
        .single();

      if (ticketError) {
        console.error('Failed to create ticket:', ticketError);
        return createCorsErrorResponse(
          'Failed to create ticket',
          origin,
          'widget',
          500
        );
      }

      ticketId = ticket.id;
    }

    // Step 10: Link ticket/lead and customer to form submission
    await supabase
      .from('form_submissions')
      .update({
        ticket_id: ticketId,
        lead_id: leadId,
        customer_id: customerId,
      })
      .eq('id', submissionId);

    // Step 10.5: Send to Tadabase for Northwest Exterminating
    // COMMENTED OUT - Not currently in use
    /*
    const nweDomains = ['nwexterminating.com', 'www.nwexterminating.com'];

    if (sourceDomain && nweDomains.some(domain => sourceDomain.includes(domain))) {
      try {
        console.log(`[Tadabase] Sending form submission ${submissionId} for Northwest Exterminating to Tadabase`);

        // Build complete payload matching call integration format
        const tadabasePayload = {
          // Form submission identifiers
          submission_id: submissionId,
          ticket_id: ticketId,
          customer_id: customerId,

          // Raw and normalized data
          raw_payload: rawPayload,
          normalized_data: geminiResult.normalized,

          // AI analysis (similar to call_analysis in call integration)
          ai_analysis: {
            confidence: geminiResult.confidence,
            description: geminiResult.ticket.description,
            priority: geminiResult.ticket.priority,
            service_type: geminiResult.ticket.service_type,
            pest_type: geminiResult.ticket.pest_type,
          },

          // Metadata
          source_url: lookupUrl,
          source_domain: sourceDomain,
          ip_address: ipAddress,
          submitted_at: new Date().toISOString(),

          // Processing status
          processing_status: geminiResult.success ? 'processed' : 'failed',
        };

        const tadabaseResponse = await fetch('https://catchtemp.tadabase.io/webhook/RBe3G7c8eL', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tadabasePayload),
        });

        if (tadabaseResponse.ok) {
          console.log(`[Tadabase] Successfully sent form submission ${submissionId} to Tadabase`);
        } else {
          console.warn(`[Tadabase] Failed to send form submission ${submissionId}: ${tadabaseResponse.status} ${tadabaseResponse.statusText}`);
        }
      } catch (error) {
        console.error(`[Tadabase] Error sending form submission ${submissionId}:`, error instanceof Error ? error.message : error);
        // Don't throw - continue with normal response even if Tadabase fails
      }
    }
    */

    // Step 11: Return success response
    const response: FormSubmissionResponse = {
      success: true,
      submissionId,
      ticketId: ticketId || undefined,
      leadId: leadId || undefined,
      customerId: customerId || undefined,
    };

    return createCorsResponse(response, origin, 'widget', { status: 200 });

  } catch (error) {
    console.error('Form submission webhook error:', error);

    const origin = request.headers.get('origin') || '';
    return createCorsErrorResponse(
      'Internal server error',
      origin,
      'widget',
      500
    );
  }
}
