import { NextRequest, NextResponse } from 'next/server';
import { normalizePhoneNumber, toE164PhoneNumber } from '@/lib/utils';
import { handleCorsPrelight, createCorsResponse, createCorsErrorResponse, validateOrigin } from '@/lib/cors';

// Handle preflight OPTIONS request
export async function OPTIONS(request: NextRequest) {
  return await handleCorsPrelight(request, 'widget');
}

interface SMSRequest {
  customerPhone: string;
  customerName: string;
  pestType: string;
}

export async function POST(request: NextRequest) {
  try {
    // Validate origin first
    const { isValid, origin, response: corsResponse } = await validateOrigin(request, 'widget');
    if (!isValid && corsResponse) {
      return corsResponse;
    }

    const smsData: SMSRequest = await request.json();

    // Validate required fields
    if (!smsData.customerPhone || !smsData.customerName || !smsData.pestType) {
      return createCorsErrorResponse(
        'Phone number, customer name, and pest type are required',
        origin,
        'widget',
        400
      );
    }

    // Validate and format phone number
    const normalizedPhone = normalizePhoneNumber(smsData.customerPhone);
    if (!normalizedPhone) {
      return createCorsErrorResponse(
        'Invalid phone number format',
        origin,
        'widget',
        400
      );
    }

    const e164Phone = toE164PhoneNumber(smsData.customerPhone);
    if (!e164Phone) {
      return createCorsErrorResponse(
        'Could not format phone number for SMS',
        origin,
        'widget',
        400
      );
    }

    // Check for MailerSend API token
    if (!process.env.MAILERSEND_API_TOKEN) {
      console.error('MAILERSEND_API_TOKEN not configured');
      return createCorsErrorResponse(
        'SMS service not configured',
        origin,
        'widget',
        500
      );
    }

    // Extract first name from full name
    const firstName = smsData.customerName.split(' ')[0];

    // Map pest types - handle 'others' special case
    const pestText = smsData.pestType === 'others' ? 'pests' : smsData.pestType;

    // Create SMS message
    const message = `Hi ${firstName}. Thanks for scheduling us to get rid of those ${pestText}. One of our team members will call soon to confirm your appointment. In the meantime, feel free to message me here or call this number with any questions - 24/7.
I also sent you a confirmation email.
Thanks for choosing Northwest!

Aiden`;

    // Prepare MailerSend API request
    const mailersendPayload = {
      from: process.env.MAILERSEND_FROM_NUMBER || '+15005550006', // Default to magic number
      to: [e164Phone], // Use E.164 formatted phone number
      text: message
    };

    // Send SMS via MailerSend API
    const response = await fetch('https://api.mailersend.com/v1/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MAILERSEND_API_TOKEN}`,
      },
      body: JSON.stringify(mailersendPayload),
    });

    let responseData = {};
    try {
      const responseText = await response.text();
      if (responseText.trim()) {
        responseData = JSON.parse(responseText);
      }
    } catch (error) {
      // MailerSend response was not JSON, but SMS may have sent successfully
    }

    if (!response.ok) {
      console.error('MailerSend SMS API error:', responseData);
      return createCorsErrorResponse(
        `Failed to send SMS: ${JSON.stringify(responseData)}`,
        origin,
        'widget',
        response.status
      );
    }

    return createCorsResponse({
      success: true,
      message: 'SMS sent successfully to ' + e164Phone,
      smsId: (responseData as any)?.data?.id || 'unknown'
    }, origin, 'widget');

  } catch (error) {
    console.error('Error in SMS route:', error);
    return createCorsErrorResponse(
      'Internal server error',
      null,
      'widget',
      500
    );
  }
}