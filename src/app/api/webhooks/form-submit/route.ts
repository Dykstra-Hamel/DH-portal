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

export async function OPTIONS(request: NextRequest) {
  return handleCorsPrelight(request, 'widget');
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const origin = request.headers.get('origin') || '';
    const referer = request.headers.get('referer') || '';

    // Step 1: Validate origin using widget whitelist and get company info
    const corsValidation = await validateOrigin(request, 'widget');
    if (!corsValidation.isValid) {
      return corsValidation.response || NextResponse.json(
        { error: 'Origin not allowed' },
        { status: 403 }
      );
    }

    // Get company info from CORS validation
    const companyId = corsValidation.companyId || null;

    // Step 2: Parse request body based on Content-Type
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

    // Step 3: Determine source URL for tracking
    const supabase = createAdminClient();
    let lookupUrl: string | null = null;

    // Priority order for determining the source URL:
    // 1. pageUrl from payload (Webflow, etc.)
    // 2. Origin header
    // 3. Referer header
    if (sourceUrl) {
      lookupUrl = sourceUrl;
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

    // Step 4: Create initial form_submissions record (pending state)
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

    // Step 7: Lookup or create customer
    let customerId: string | null = null;
    const { normalized } = geminiResult;

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

      const addressResult = await createOrFindServiceAddress(companyId, {
        street_address: normalized.street_address,
        city: normalized.city,
        state: normalized.state,
        zip_code: normalized.zip,
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

    // Step 9: Create ticket
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
      pest_type: normalized.pest_issue || null,
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

    const ticketId = ticket.id;

    // Step 10: Link ticket and customer to form submission
    await supabase
      .from('form_submissions')
      .update({
        ticket_id: ticketId,
        customer_id: customerId,
      })
      .eq('id', submissionId);

    // Step 11: Return success response
    const response: FormSubmissionResponse = {
      success: true,
      submissionId,
      ticketId,
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
