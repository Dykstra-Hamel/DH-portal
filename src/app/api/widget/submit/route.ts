import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
// Auto-calling functions - implemented inline below
import { normalizePhoneNumber } from '@/lib/utils';
import {
  handleCorsPrelight,
  createCorsResponse,
  createCorsErrorResponse,
  validateOrigin,
} from '@/lib/cors';

// ServicePlan interface for typing
interface ServicePlan {
  id: string;
  company_id: string;
  plan_name: string;
  plan_description: string;
  plan_category: string;
  initial_price: number;
  recurring_price: number;
  billing_frequency: string;
  treatment_frequency: string;
  includes_inspection: boolean;
  plan_features: string[];
  plan_faqs: Array<{ question: string; answer: string }>;
  display_order: number;
  highlight_badge: string | null;
  color_scheme: any;
  requires_quote: boolean;
  plan_image_url: string | null;
  is_active: boolean;
  pest_coverage?: Array<{
    pest_id: string;
    coverage_level: string;
    pest_name: string;
    pest_slug: string;
    pest_icon: string;
    pest_category: string;
  }>;
  created_at: string;
  updated_at: string;
}
import {
  sendLeadCreatedNotifications,
  validateEmails,
  LeadNotificationData,
} from '@/lib/email';
import { sendEvent } from '@/lib/inngest/client';

// Helper function to check if auto-calling is enabled for a company
async function shouldAutoCall(companyId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    const { data: setting, error } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'auto_call_enabled')
      .single();

    if (error || !setting) {
      console.error('Failed to fetch auto_call_enabled setting:', error);
      return false; // Default to false if setting not found
    }

    return setting.setting_value === 'true';
  } catch (error) {
    console.error('Error checking shouldAutoCall:', error);
    return false;
  }
}

// Helper function to handle auto lead calling via Retell API
async function handleAutoLeadCall(
  leadId: string,
  companyId: string,
  customerData: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  },
  leadStatus: string,
  notes: string,
  companyData?: {
    name: string;
    website?: string;
  },
  addressComponents?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  },
  pestData?: {
    pestType: string;
    selectedPlan?: ServicePlan;
    recommendedPlan?: ServicePlan;
  }
): Promise<{
  success: boolean;
  skipped?: boolean;
  reason?: string;
  callId?: string;
  error?: string;
}> {
  try {
    // Prepare the call request data
    const callRequest = {
      firstName: customerData.first_name,
      lastName: customerData.last_name,
      email: customerData.email,
      phone: customerData.phone,
      message: notes, // Use the formatted customer comments
      pestType: pestData?.pestType || '',
      selectedPlan: pestData?.selectedPlan?.plan_name || '',
      recommendedPlan: pestData?.recommendedPlan?.plan_name || '',
      streetAddress: addressComponents?.street || '',
      city: addressComponents?.city || '',
      state: addressComponents?.state || '',
      zipCode: addressComponents?.zip || '',
      companyId: companyId,
    };

    // Make request to our retell-call endpoint
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/retell-call`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(callRequest),
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Auto-call request failed:', response.status, errorData);
      return {
        success: false,
        error: `Call request failed: ${response.status} - ${errorData}`,
      };
    }

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        callId: result.callId,
      };
    } else {
      return {
        success: false,
        error: result.error || 'Unknown error from call service',
      };
    }
  } catch (error) {
    console.error('Error in handleAutoLeadCall:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Helper function to determine lead source from attribution data
function determineLeadSourceFromAttribution(attributionData: any): string {
  if (!attributionData) return 'other';

  const { utm_source, utm_medium, gclid, traffic_source, referrer_domain } =
    attributionData;

  // Google Ads (highest priority)
  if (gclid || (utm_source === 'google' && utm_medium === 'cpc')) {
    return 'google_cpc';
  }

  // Facebook Ads
  if (
    utm_source === 'facebook' &&
    ['paid', 'cpc', 'ads'].includes(utm_medium)
  ) {
    return 'facebook_ads';
  }

  // LinkedIn
  if (utm_source === 'linkedin') {
    return 'linkedin';
  }

  // Bing Ads
  if (utm_source === 'bing' && utm_medium === 'cpc') {
    return 'bing_cpc';
  }

  // Organic search
  if (traffic_source === 'organic') {
    return 'organic';
  }

  // Social media
  if (
    traffic_source === 'social' ||
    (referrer_domain &&
      ['facebook.com', 'instagram.com', 'twitter.com', 'linkedin.com'].includes(
        referrer_domain
      ))
  ) {
    return 'social_media';
  }

  // Referral
  if (traffic_source === 'referral') {
    return 'referral';
  }

  // Default
  return 'other';
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return await handleCorsPrelight(request, 'widget');
}

interface WidgetSubmission {
  companyId: string;
  pestType: string;
  selectedPlan?: ServicePlan;
  recommendedPlan?: ServicePlan;
  address: string; // Formatted address for backward compatibility
  addressDetails?: {
    // New structured address data
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  homeSize: number;
  // Scheduling information from widget form
  startDate?: string;
  arrivalTime?: string;
  contactInfo: {
    name: string;
    phone: string;
    email: string;
    comments?: string;
  };
  estimatedPrice?: {
    min: number;
    max: number;
    service_type: string;
  };
  conversationContext?: any;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  // Enhanced attribution and session data
  sessionId?: string;
  attributionData?: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_term?: string;
    utm_content?: string;
    gclid?: string;
    referrer_url?: string;
    referrer_domain?: string;
    traffic_source?: string;
    page_url?: string;
    user_agent?: string;
    timestamp?: string;
    collected_at?: string;
    cross_domain_data?: any;
    domain?: string;
    subdomain?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Validate origin first
    const { isValid, origin, response } = await validateOrigin(
      request,
      'widget'
    );
    if (!isValid && response) {
      return response;
    }

    const submission: WidgetSubmission = await request.json();

    // Validate required fields
    if (
      !submission.companyId ||
      !submission.contactInfo?.email ||
      !submission.contactInfo?.name
    ) {
      return createCorsErrorResponse(
        'Company ID, name, and email are required',
        origin,
        'widget',
        400
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(submission.contactInfo.email)) {
      return createCorsErrorResponse(
        'Invalid email format',
        origin,
        'widget',
        400
      );
    }

    // Validate field lengths to prevent abuse
    if (
      submission.contactInfo.name.length > 100 ||
      submission.contactInfo.email.length > 254 ||
      (submission.contactInfo.phone && submission.contactInfo.phone.length > 20)
    ) {
      return createCorsErrorResponse(
        'Input field too long',
        origin,
        'widget',
        400
      );
    }

    const supabase = createAdminClient();

    // Check for existing partial lead to link conversion
    let partialLead = null;
    let partialLeadAttribution = null;
    if (submission.sessionId) {
      try {
        const { data: existingPartialLead, error: partialLeadError } =
          await supabase
            .from('partial_leads')
            .select(
              `
            id,
            form_data,
            attribution_data,
            service_area_data,
            created_at
          `
            )
            .eq('session_id', submission.sessionId)
            .eq('company_id', submission.companyId)
            .is('converted_to_lead_id', null)
            .single();

        if (existingPartialLead && !partialLeadError) {
          partialLead = existingPartialLead;
          partialLeadAttribution = existingPartialLead.attribution_data;
        }
      } catch (error) {
        console.warn('Error checking for partial lead:', error);
        // Continue processing - don't fail submission if partial lead lookup fails
      }
    }

    // Merge attribution data: prioritize submission data, fallback to partial lead
    const finalAttributionData = {
      ...partialLeadAttribution,
      ...submission.attributionData,
      conversion_timestamp: new Date().toISOString(),
      converted_from_partial: !!partialLead,
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

    // If service areas are configured but location is not served, we still accept the lead

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
            phone: normalizedPhone || submission.contactInfo.phone, // Use normalized phone if available, fallback to original
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

    // Set priority to medium for all leads
    const priority = 'medium';

    // Set lead status to new lead
    const status:
      | 'new'
      | 'contacted'
      | 'quoted'
      | 'won'
      | 'lost'
      | 'unqualified' = 'new';

    // Create lead notes
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

    // Set lead source as widget_submission for widget form submissions
    const leadSource = 'widget_submission';

    // Create lead with enhanced attribution data
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert([
        {
          company_id: submission.companyId,
          customer_id: customerId,
          partial_lead_id: partialLead?.id || null,
          lead_source: leadSource,
          lead_type: 'web_form',
          lead_status: status,
          priority,
          comments: notes,
          estimated_value: submission.estimatedPrice
            ? (submission.estimatedPrice.min + submission.estimatedPrice.max) /
              2
            : null,
          // Scheduling fields
          requested_date: submission.startDate || null,
          requested_time: submission.arrivalTime || null,
          // Pest and plan information
          pest_type: submission.pestType || null,
          selected_plan_id: submission.selectedPlan?.id || null,
          recommended_plan_name: submission.recommendedPlan?.plan_name || null,
          // Attribution fields
          utm_source: finalAttributionData.utm_source || null,
          utm_medium: finalAttributionData.utm_medium || null,
          utm_campaign: finalAttributionData.utm_campaign || null,
          utm_term: finalAttributionData.utm_term || null,
          utm_content: finalAttributionData.utm_content || null,
          gclid: finalAttributionData.gclid || null,
          attribution_data: finalAttributionData,
        },
      ])
      .select('id')
      .single();

    if (leadError || !lead) {
      console.error('Error creating lead:', leadError);
      return createCorsErrorResponse(
        'Failed to create lead',
        origin,
        'widget',
        500
      );
    }

    // Update partial lead to mark it as converted (if it exists)
    if (partialLead) {
      try {
        await supabase
          .from('partial_leads')
          .update({
            converted_to_lead_id: lead.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', partialLead.id);
      } catch (error) {
        console.warn('Error updating partial lead conversion status:', error);
        // Don't fail the lead creation if this update fails
      }
    }

    // Get company info for both calling and email notifications
    const { data: company } = await supabase
      .from('companies')
      .select('name, website, widget_config')
      .eq('id', submission.companyId)
      .single();

    // Attempt auto-call if enabled (don't fail lead creation if this fails)
    let autoCallEnabled = false;
    try {
      // Auto-calling disabled
      autoCallEnabled = false;

      // autoCallEnabled = await shouldAutoCall(submission.companyId);

      if (autoCallEnabled) {
        // Extract address components for the call
        let addressComponents = {
          street: '',
          city: '',
          state: '',
          zip: '',
        };

        if (submission.addressDetails) {
          // Use structured address data
          addressComponents = {
            street: submission.addressDetails.street || '',
            city: submission.addressDetails.city || '',
            state: submission.addressDetails.state || '',
            zip: submission.addressDetails.zip || '',
          };
        } else if (submission.address) {
          // Parse formatted address string
          const addressParts = submission.address
            .split(',')
            .map(part => part.trim());
          const zipMatch = submission.address.match(/\b\d{5}\b/);

          addressComponents.street = addressParts[0] || '';
          if (addressParts.length >= 2) {
            addressComponents.city = addressParts[1] || '';
          }
          if (addressParts.length >= 3) {
            const stateZip = addressParts[2] || '';
            const stateMatch = stateZip.match(/([A-Z]{2})/);
            addressComponents.state = stateMatch ? stateMatch[1] : '';
          }
          addressComponents.zip = zipMatch ? zipMatch[0] : '';
        }

        // Format customer comments with widget-specific details
        let customerComments = `Widget Submission Details:\n`;
        customerComments += `Pest Type: ${submission.pestType}\n`;
        if (submission.selectedPlan) {
          customerComments += `Selected Plan: ${submission.selectedPlan.plan_name}\n`;
        }
        if (submission.recommendedPlan) {
          customerComments += `Recommended Plan: ${submission.recommendedPlan.plan_name}\n`;
        }
        if (submission.homeSize) {
          customerComments += `Home Size: ${submission.homeSize} sq ft\n`;
        }
        if (submission.estimatedPrice) {
          customerComments += `Estimated Price: $${submission.estimatedPrice.min} - $${submission.estimatedPrice.max} (${submission.estimatedPrice.service_type})\n`;
        }
        if (submission.address) {
          customerComments += `Address: ${submission.address}\n`;
        }
        if (
          submission.contactInfo.comments &&
          submission.contactInfo.comments.trim()
        ) {
          customerComments += `Customer Comments: ${submission.contactInfo.comments.trim()}\n`;
        }

        const callResult = await handleAutoLeadCall(
          lead.id,
          submission.companyId,
          {
            first_name: submission.contactInfo.name.split(' ')[0] || '',
            last_name:
              submission.contactInfo.name.split(' ').slice(1).join(' ') || '',
            email: submission.contactInfo.email,
            phone: submission.contactInfo.phone,
          },
          status,
          customerComments, // Use formatted comments instead of generic notes
          company
            ? { name: company.name, website: company.website }
            : undefined,
          addressComponents, // Pass address components
          {
            pestType: submission.pestType,
            selectedPlan: submission.selectedPlan,
            recommendedPlan: submission.recommendedPlan,
          }
        );

        if (callResult.success && !callResult.skipped) {
        } else if (callResult.skipped) {
        } else {
          console.error(
            `Auto-call failed for lead ${lead.id}: ${callResult.error}`
          );
        }
      } else {
      }
    } catch (error) {
      console.error('Error in auto-call process:', error);
      // Don't fail the lead creation due to call issues
    }

    // Trigger Inngest automation workflows (don't fail lead creation if this fails)
    try {
      await sendEvent({
        name: 'widget/schedule-completed',
        data: {
          leadId: lead.id,
          companyId: submission.companyId,
          customerId,
          leadData: {
            customerName: submission.contactInfo.name,
            customerEmail: submission.contactInfo.email,
            customerPhone: submission.contactInfo.phone,
            pestType: submission.pestType,
            address: submission.address,
            homeSize: submission.homeSize,
            selectedPlan: submission.selectedPlan?.plan_name,
            estimatedPrice: submission.estimatedPrice,
          },
          attribution: {
            leadSource: 'widget_submission',
            utmSource: finalAttributionData.utm_source,
            utmMedium: finalAttributionData.utm_medium,
            utmCampaign: finalAttributionData.utm_campaign,
          },
          createdAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error triggering Inngest automation:', error);
      // Don't fail the lead creation due to automation trigger issues
    }

    // Send email notifications (don't fail lead creation if this fails)
    try {
      const widgetConfig = company?.widget_config || {};
      const notificationEmails = widgetConfig.notifications?.emails || [];

      if (notificationEmails.length > 0) {
        // Validate email addresses
        const { valid: validEmails, invalid: invalidEmails } =
          validateEmails(notificationEmails);

        if (invalidEmails.length > 0) {
          console.warn(
            `Invalid notification emails found for company ${submission.companyId}:`,
            invalidEmails
          );
        }

        if (validEmails.length > 0) {
          const leadNotificationData: LeadNotificationData = {
            leadId: lead.id,
            companyName: company?.name || 'Unknown Company',
            customerName: submission.contactInfo.name,
            customerEmail: submission.contactInfo.email,
            customerPhone: submission.contactInfo.phone,
            pestType: submission.pestType,
            selectedPlan: submission.selectedPlan?.plan_name,
            recommendedPlan: submission.recommendedPlan?.plan_name,
            address: submission.address,
            homeSize: submission.homeSize,
            estimatedPrice: submission.estimatedPrice,
            priority,
            autoCallEnabled,
            submittedAt: new Date().toISOString(),
          };

          // Get email notification configuration from company widget config
          const emailConfig = company?.widget_config?.emailNotifications || {
            enabled: true,
            subjectLine: 'New Service Request: {customerName} - {companyName}',
          };

          const emailResult = await sendLeadCreatedNotifications(
            validEmails,
            leadNotificationData,
            emailConfig.enabled
              ? {
                  subjectLine: emailConfig.subjectLine,
                }
              : undefined,
            submission.companyId // Pass company ID for custom domain lookup
          );

          if (emailResult.success) {
          } else {
            console.error(
              `All lead notification emails failed for lead ${lead.id}`
            );
          }
        }
      }
    } catch (error) {
      console.error('Error sending lead notification emails:', error);
      // Don't fail the lead creation due to email issues
    }

    // Send SMS confirmation (immediate)
    try {
      const smsResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/widget/send-sms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            customerPhone: submission.contactInfo.phone,
            customerName: submission.contactInfo.name,
            pestType: submission.pestType,
          }),
        }
      );

      if (smsResponse.ok) {
        const smsResult = await smsResponse.json();
      } else {
        const smsError = await smsResponse.json();
        console.error('SMS sending failed:', smsError);
      }
    } catch (error) {
      console.error('Error sending SMS confirmation:', error);
      // Don't fail the lead creation due to SMS issues
    }

    // NOW HANDLED BY AUTOMATION WORKFLOWS

    // Schedule automatic quote email (10 seconds after submission)
    // setTimeout(async () => {
    //   try {
    //     await sendDelayedQuoteEmail(submission, company);
    //   } catch (error) {
    //     console.error('Error sending delayed quote email:', error);
    //     // Don't affect the main submission flow
    //   }
    // }, 10 * 1000); // 10 seconds in milliseconds

    // Return success response
    return createCorsResponse(
      {
        success: true,
        customerId,
        leadId: lead.id,
        priority,
        message:
          'Thank you! Your information has been submitted successfully. We&apos;ll be in touch soon.',
        serviceArea: serviceAreaValidation
          ? {
              served: serviceAreaValidation.served,
              areas: serviceAreaValidation.areas,
              primaryArea: serviceAreaValidation.primaryArea,
              outsideServiceArea: !serviceAreaValidation.served,
            }
          : null,
        attribution: {
          leadSource: 'widget_submission',
          hasAttribution: !!(
            finalAttributionData.utm_source || finalAttributionData.gclid
          ),
          convertedFromPartial: !!partialLead,
          partialLeadId: partialLead?.id || null,
          utmSource: finalAttributionData.utm_source || null,
          utmMedium: finalAttributionData.utm_medium || null,
          utmCampaign: finalAttributionData.utm_campaign || null,
          gclid: finalAttributionData.gclid || null,
          trafficSource: finalAttributionData.traffic_source || null,
        },
      },
      origin,
      'widget'
    );
  } catch (error) {
    console.error('Error in widget submit:', error);
    // For error case, we can't access origin, so use null
    return createCorsErrorResponse(
      'Internal server error',
      null,
      'widget',
      500
    );
  }
}

// THIS IS NOW HANDLED BY AUTOMATION WORKFLOWS. SHOULD BE SAFE TO REMOVE BUT SAVING FOR NOW JUST IN CASE

// Function to send delayed quote email
// async function sendDelayedQuoteEmail(submission: WidgetSubmission, company: any) {
//   try {
//     // Generate pricing estimate based on pest type and submission data
//     const estimatedPrice = generatePricingEstimate(submission);

//     // Prepare quote data for the existing quote API
//     const quoteData = {
//       companyId: submission.companyId,
//       customerEmail: submission.contactInfo.email,
//       customerName: submission.contactInfo.name,
//       pestType: submission.pestType,
//       homeSize: submission.homeSize || undefined,
//       address: submission.address || undefined,
//       estimatedPrice: estimatedPrice,
//       urgency: submission.urgency,
//       selectedPlan: submission.selectedPlan
//     };

//     // Make internal API call to send quote email
//     const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/widget/send-quote`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(quoteData)
//     });

//     if (!response.ok) {
//       const errorData = await response.json();
//       throw new Error(`Quote API failed: ${errorData.error || 'Unknown error'}`);
//     }

//     const result = await response.json();

//   } catch (error) {
//     console.error('Failed to send delayed quote email:', error);
//     throw error;
//   }
// }

// Function to generate pricing estimates based on submission data
function generatePricingEstimate(submission: WidgetSubmission) {
  // Standard pricing for all pest types and home sizes
  const baseMin = 150;
  const baseMax = 300;
  const serviceType = 'Professional pest control service';
  const factors = [
    'Comprehensive inspection',
    'Targeted treatment plan',
    'Professional grade products',
    'Follow-up service included',
  ];

  return {
    min: baseMin,
    max: baseMax,
    service_type: serviceType,
    factors: factors,
  };
}
