import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  handleAutoLeadCall,
  shouldAutoCall,
} from '@/lib/services/lead-calling';
import { normalizePhoneNumber } from '@/lib/utils';
import {
  sendLeadCreatedNotifications,
  validateEmails,
  LeadNotificationData,
} from '@/lib/email';

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Helper function to add CORS headers
const addCorsHeaders = (response: NextResponse) => {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
};

interface WidgetSubmission {
  companyId: string;
  pestIssue: string;
  address: string; // Formatted address for backward compatibility
  addressDetails?: {
    // New structured address data
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  homeSize: number;
  contactInfo: {
    name: string;
    phone: string;
    email: string;
  };
  estimatedPrice?: {
    min: number;
    max: number;
    service_type: string;
  };
  conversationContext?: any;
}

export async function POST(request: NextRequest) {
  try {
    const submission: WidgetSubmission = await request.json();

    // Validate required fields
    if (
      !submission.companyId ||
      !submission.contactInfo?.email ||
      !submission.contactInfo?.name
    ) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Company ID, name, and email are required' },
          { status: 400 }
        )
      );
    }

    const supabase = createAdminClient();

    // Normalize phone number for consistent lookup and storage
    const normalizedPhone = normalizePhoneNumber(submission.contactInfo.phone);

    // Check if customer already exists by email OR phone number
    let customerId: string;
    let existingCustomer = null;

    // First, try to find by email
    const { data: emailCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', submission.contactInfo.email)
      .eq('company_id', submission.companyId)
      .single();

    if (emailCustomer) {
      existingCustomer = emailCustomer;
    } else if (normalizedPhone) {
      // If no email match and we have a valid phone, try phone lookup
      const { data: phoneCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', normalizedPhone)
        .eq('company_id', submission.companyId)
        .single();

      if (phoneCustomer) {
        existingCustomer = phoneCustomer;
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
        return addCorsHeaders(
          NextResponse.json(
            { error: 'Failed to create customer' },
            { status: 500 }
          )
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
    notes += `Pest Issue: ${submission.pestIssue}\n`;
    if (submission.homeSize)
      notes += `Home Size: ${submission.homeSize} sq ft\n`;
    if (submission.address) notes += `Address: ${submission.address}\n`;
    if (submission.estimatedPrice) {
      notes += `Estimated Price: $${submission.estimatedPrice.min} - $${submission.estimatedPrice.max} (${submission.estimatedPrice.service_type})\n`;
    }

    // Create lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .insert([
        {
          company_id: submission.companyId,
          customer_id: customerId,
          lead_source: 'other',
          lead_type: 'web_form',
          lead_status: status,
          priority,
          comments: notes,
          estimated_value: submission.estimatedPrice
            ? (submission.estimatedPrice.min + submission.estimatedPrice.max) /
              2
            : null,
        },
      ])
      .select('id')
      .single();

    if (leadError || !lead) {
      console.error('Error creating lead:', leadError);
      return addCorsHeaders(
        NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
      );
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
      autoCallEnabled = await shouldAutoCall(submission.companyId);

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
        company ? { name: company.name, website: company.website } : undefined,
        status,
        notes
      );

      if (callResult.success && !callResult.skipped) {
        console.log(
          `Auto-call initiated for lead ${lead.id}, call ID: ${callResult.callId}`
        );
      } else if (callResult.skipped) {
        console.log(
          `Auto-call skipped for lead ${lead.id}: ${callResult.reason}`
        );
      } else {
        console.error(
          `Auto-call failed for lead ${lead.id}: ${callResult.error}`
        );
      }
    } catch (error) {
      console.error('Error in auto-call process:', error);
      // Don't fail the lead creation due to call issues
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
            pestIssue: submission.pestIssue,
            address: submission.address,
            homeSize: submission.homeSize,
            estimatedPrice: submission.estimatedPrice,
            priority,
            autoCallEnabled,
            submittedAt: new Date().toISOString(),
          };

          const emailResult = await sendLeadCreatedNotifications(
            validEmails,
            leadNotificationData
          );

          if (emailResult.success) {
            console.log(
              `Lead notification emails sent successfully for lead ${lead.id}. Sent: ${emailResult.successCount}, Failed: ${emailResult.failureCount}`
            );
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

    // Return success response
    return addCorsHeaders(
      NextResponse.json({
        success: true,
        customerId,
        leadId: lead.id,
        priority,
        message:
          'Thank you! Your information has been submitted successfully. We&apos;ll be in touch soon.',
      })
    );
  } catch (error) {
    console.error('Error in widget submit:', error);
    return addCorsHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    );
  }
}
