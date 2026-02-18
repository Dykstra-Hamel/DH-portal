import { NextRequest, NextResponse } from 'next/server';
import { getCompanyCaptchaConfig, verifyTurnstile } from '@/lib/captcha';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { normalizePhoneNumber } from '@/lib/utils';
import {
  handleCorsPrelight,
  createCorsResponse,
  createCorsErrorResponse,
  validateOrigin,
} from '@/lib/cors';
import {
  createOrFindServiceAddress,
  extractAddressData,
  getCustomerPrimaryServiceAddress,
  linkCustomerToServiceAddress,
} from '@/lib/service-addresses';


export async function OPTIONS(request: NextRequest) {
  return handleCorsPrelight(request, 'widget');
}

export async function POST(request: NextRequest) {
  console.log('🎯 Widget Ticket Submission received');
  const startTime = Date.now();

  try {
    // Get origin for CORS
    const origin = request.headers.get('origin') || '';
    
    // Validate origin and get CORS headers
    const corsValidation = await validateOrigin(request, 'widget');
    if (!corsValidation.isValid) {
      console.log('❌ CORS validation failed for origin:', origin);
      return corsValidation.response || NextResponse.json(
        { error: 'Origin not allowed' },
        { status: 403 }
      );
    }

    const submission = await request.json();

    // Enhanced validation
    if (!submission.companyId || typeof submission.companyId !== 'string') {
      console.log('❌ Missing or invalid companyId');
      return createCorsErrorResponse('Company ID is required and must be a string', origin, 'widget', 400);
    }

    if (!submission.contactInfo?.email || !submission.contactInfo?.name) {
      console.log('❌ Missing required contact information');
      return createCorsErrorResponse('Email and name are required', origin, 'widget', 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(submission.contactInfo.email)) {
      console.log('❌ Invalid email format');
      return createCorsErrorResponse('Invalid email format', origin, 'widget', 400);
    }

    console.log('✅ Widget ticket submission validated');

    const supabase = createAdminClient();

    // Get captcha configuration for the company
    const captchaConfig = await getCompanyCaptchaConfig(submission.companyId);
    console.log('🔍 Captcha config:', { 
      enabled: captchaConfig.enabled, 
      required: captchaConfig.required, 
      provider: captchaConfig.provider,
      NODE_ENV: process.env.NODE_ENV 
    });

    // Verify Turnstile token if captcha is enabled, required, and provider is turnstile
    const shouldVerify = captchaConfig.enabled && captchaConfig.required && captchaConfig.provider === 'turnstile';
    console.log('🔍 Should verify captcha:', shouldVerify);
    if (shouldVerify) {
      const turnstileToken = submission.turnstileToken;
      
      if (!turnstileToken) {
        // Temporary bypass for localhost testing
        const isLocalhost = origin?.includes('localhost') || origin?.includes('127.0.0.1');
        if (isLocalhost) {
          console.log('⚠️ Captcha required but skipping for localhost testing');
        } else {
          console.log('❌ Captcha required but token missing');
          return createCorsErrorResponse('Captcha verification required', origin, 'widget', 400);
        }
      } else {
        try {
          const result = await verifyTurnstile(turnstileToken, captchaConfig.secretKey || '', origin, request);
          if (!result.success) {
            console.log('❌ Captcha verification failed');
            return createCorsErrorResponse('Captcha verification failed', origin, 'widget', 400);
          }
          console.log('✅ Captcha verified successfully');
        } catch (error) {
          console.error('❌ Captcha verification error:', error);
          return createCorsErrorResponse('Captcha verification error', origin, 'widget', 500);
        }
      }
    }

    // Check if there's a partial lead to associate
    let partialLead = null;
    if (submission.partialLeadId) {
      const { data, error } = await supabase
        .from('partial_leads')
        .select('*')
        .eq('id', submission.partialLeadId)
        .single();

      if (data && !error) {
        partialLead = data;
        console.log('✅ Found partial lead to associate:', partialLead.id);
      } else {
        console.log('⚠️ Partial lead not found:', submission.partialLeadId);
      }
    };

    // Check service area coverage if coordinates or zip code are provided
    let serviceAreaValidation = null;
    if (submission.coordinates || submission.addressDetails?.zip) {
      try {
        const validationResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/service-areas/validate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              companyId: submission.companyId,
              latitude: submission.coordinates?.latitude,
              longitude: submission.coordinates?.longitude,
              zipCode: submission.addressDetails?.zip,
            }),
          }
        );

        if (validationResponse.ok) {
          serviceAreaValidation = await validationResponse.json();
        }
      } catch (error) {
        console.warn('Service area validation failed:', error);
        // Continue processing - don't fail the submission if validation fails
      }
    }

    // Normalize phone number for consistent lookup and storage
    const normalizedPhone = normalizePhoneNumber(submission.contactInfo.phone);

    // Check if customer already exists by email OR phone number
    let customerId: string;
    let existingCustomer = null;

    // First, try to find by email
    try {
      const { data: emailCustomer, error: emailError } = await supabase
        .from('customers')
        .select('id')
        .eq('email', submission.contactInfo.email)
        .eq('company_id', submission.companyId)
        .single();

      if (emailCustomer && !emailError) {
        existingCustomer = emailCustomer;
      }
    } catch (error) {
      // No customer found with this email for this company
    }

    // If no email match and we have a valid phone, try phone lookup
    if (!existingCustomer && normalizedPhone) {
      try {
        const { data: phoneCustomer, error: phoneError } = await supabase
          .from('customers')
          .select('id')
          .eq('phone', normalizedPhone)
          .eq('company_id', submission.companyId)
          .single();

        if (phoneCustomer && !phoneError) {
          existingCustomer = phoneCustomer;
        }
      } catch (error) {
        // No customer found with this phone for this company
      }
    }

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      // Create new customer
      const nameParts = submission.contactInfo.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // Parse address components - use structured data if available, fallback to parsing
      let addressData = {};
      if (submission.addressDetails) {
        // Use structured address data
        addressData = {
          address: submission.addressDetails.street,
          city: submission.addressDetails.city,
          state: submission.addressDetails.state,
          zip_code: submission.addressDetails.zip,
        };
      } else if (submission.address) {
        // Fallback: parse from formatted address string
        const zipMatch = submission.address.match(/\b\d{5}\b/);
        addressData = {
          address: submission.address,
          zip_code: zipMatch ? zipMatch[0] : null,
        };
      }

      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert([
          {
            company_id: submission.companyId,
            first_name: firstName,
            last_name: lastName,
            email: submission.contactInfo.email,
            phone: normalizedPhone || submission.contactInfo.phone,
            customer_status: 'active',
            ...addressData,
          },
        ])
        .select('id')
        .single();

      if (customerError || !newCustomer) {
        console.error('Error creating customer:', customerError);
        return createCorsErrorResponse(
          'Failed to create customer',
          origin,
          'widget',
          500
        );
      }

      customerId = newCustomer.id;
    }

    let serviceAddressId: string | null = null;
    const primaryServiceAddress = await getCustomerPrimaryServiceAddress(
      customerId
    );

    if (primaryServiceAddress.serviceAddress?.id) {
      serviceAddressId = primaryServiceAddress.serviceAddress.id;
    } else {
      if (partialLead?.service_address_id) {
        serviceAddressId = partialLead.service_address_id;
      } else {
        const parsedAddressData = extractAddressData(
          submission.addressDetails,
          submission.address,
          submission.coordinates
            ? {
                latitude: submission.coordinates.latitude,
                longitude: submission.coordinates.longitude,
              }
            : undefined
        );
        const fallbackAddressData = {
          street_address: submission.addressDetails?.street || submission.address || undefined,
          city: submission.addressDetails?.city || undefined,
          state: submission.addressDetails?.state || undefined,
          zip_code: submission.addressDetails?.zip || undefined,
          latitude: submission.coordinates?.latitude,
          longitude: submission.coordinates?.longitude,
        };
        const serviceAddressData = parsedAddressData || fallbackAddressData;
        const hasAddressData = [
          serviceAddressData.street_address,
          serviceAddressData.city,
          serviceAddressData.state,
          serviceAddressData.zip_code,
        ].some(value => typeof value === 'string' && value.trim() !== '');

        if (hasAddressData) {
          const serviceAddressResult = await createOrFindServiceAddress(
            submission.companyId,
            serviceAddressData
          );

          if (
            serviceAddressResult.success &&
            serviceAddressResult.serviceAddressId
          ) {
            serviceAddressId = serviceAddressResult.serviceAddressId;
          } else if (serviceAddressResult.error) {
            console.warn(
              'Failed to create service address for widget ticket:',
              serviceAddressResult.error
            );
          }
        }
      }

      if (serviceAddressId) {
        const linkResult = await linkCustomerToServiceAddress(
          customerId,
          serviceAddressId,
          'owner',
          true
        );

        if (!linkResult.success && linkResult.error) {
          console.warn(
            'Failed to link service address to customer:',
            linkResult.error
          );
        }
      }
    }

    // Set priority to medium for all tickets
    const priority = 'medium';

    // Set ticket status to new
    const status = 'new';

    // Create ticket notes
    let notes = `Widget Submission:\n`;
    notes += `Pest Type: ${submission.pestType}\n`;
    if (submission.selectedPlan) {
      notes += `Selected Plan: ${submission.selectedPlan.plan_name}\n`;
    }
    if (submission.recommendedPlan) {
      notes += `Recommended Plan: ${submission.recommendedPlan.plan_name}\n`;
    }
    if (submission.homeSize)
      notes += `Home Size: ${submission.homeSize} sq ft\n`;
    if (submission.address) notes += `Address: ${submission.address}\n`;
    if (submission.estimatedPrice) {
      notes += `Estimated Price: $${submission.estimatedPrice.min} - $${submission.estimatedPrice.max} (${submission.estimatedPrice.service_type})\n`;
    }
    if (
      submission.contactInfo.comments &&
      submission.contactInfo.comments.trim()
    ) {
      notes += `Customer Comments: ${submission.contactInfo.comments.trim()}\n`;
    }

    // Add service area information to notes
    if (serviceAreaValidation) {
      if (serviceAreaValidation.served) {
        const primaryArea = serviceAreaValidation.primaryArea;
        notes += `Service Area: ${primaryArea ? primaryArea.area_name : 'Covered'} (${serviceAreaValidation.areas.length} area(s))\n`;
      } else {
        notes += `Service Area: Outside coverage area\n`;
      }
    }

    // Set ticket source as widget for widget chat submissions
    const ticketSource = 'widget';

    // Create ticket with enhanced attribution data
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert([
        {
          company_id: submission.companyId,
          customer_id: customerId,
          source: ticketSource,
          type: 'web_form',
          status: status,
          priority,
          description: notes,
          estimated_value: submission.estimatedPrice
            ? (submission.estimatedPrice.min + submission.estimatedPrice.max) / 2
            : null,
          // Service information
          service_type: 'Sales', // Pre-Qualified field for widget submissions
          pest_type: submission.pestType || null,
          service_address_id: serviceAddressId,
          // Attribution tracking
          partial_lead_id: partialLead?.id || null,
          gclid: submission.gclid || partialLead?.gclid || null,
          fbclid: submission.fbclid || partialLead?.fbclid || null,
          utm_source: submission.utm_source || partialLead?.utm_source || null,
          utm_medium: submission.utm_medium || partialLead?.utm_medium || null,
          utm_campaign: submission.utm_campaign || partialLead?.utm_campaign || null,
          utm_content: submission.utm_content || partialLead?.utm_content || null,
          utm_term: submission.utm_term || partialLead?.utm_term || null,
          referrer_url: submission.referrer_url || partialLead?.referrer_url || null,
          landing_page_url: submission.landing_page_url || partialLead?.landing_page_url || null,
          attribution_data: submission.attribution_data || partialLead?.attribution_data || null,
        },
      ])
      .select()
      .single();

    if (ticketError || !ticket) {
      console.error('❌ Failed to create ticket:', ticketError);
      return createCorsErrorResponse('Failed to create ticket', origin, 'widget', 500);
    }

    console.log('✅ Ticket created successfully:', ticket.id);

    // Mark partial lead as converted if it exists
    if (partialLead) {
      const { error: partialUpdateError } = await supabase
        .from('partial_leads')
        .update({
          converted_to_ticket: true,
          converted_ticket_id: ticket.id,
          converted_at: new Date().toISOString(),
        })
        .eq('id', partialLead.id);

      if (partialUpdateError) {
        console.error('Failed to update partial lead:', partialUpdateError);
        // Don't fail the request for this
      } else {
        console.log('✅ Partial lead marked as converted');
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ Widget ticket submission completed in ${duration}ms`);

    return createCorsResponse(
      {
        success: true,
        ticketId: ticket.id,
        customerId,
        message: 'Ticket created successfully',
        processingTime: duration,
      },
      origin,
      'widget'
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Widget ticket submission failed after ${duration}ms:`, error);
    
    const origin = request.headers.get('origin') || '';
    return createCorsErrorResponse(
      'Internal server error',
      origin,
      'widget',
      500
    );
  }
}
