import { NextRequest, NextResponse } from 'next/server';
import { normalizePhoneNumber, toE164PhoneNumber } from '@/lib/utils';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new Response(null, { 
    status: 200, 
    headers: corsHeaders 
  });
}

interface SMSRequest {
  customerPhone: string;
  customerName: string;
  pestType: string;
}

export async function POST(request: NextRequest) {
  try {
    const smsData: SMSRequest = await request.json();

    // Validate required fields
    if (!smsData.customerPhone || !smsData.customerName || !smsData.pestType) {
      return NextResponse.json(
        { error: 'Phone number, customer name, and pest type are required' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate and format phone number
    const normalizedPhone = normalizePhoneNumber(smsData.customerPhone);
    if (!normalizedPhone) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400, headers: corsHeaders }
      );
    }

    const e164Phone = toE164PhoneNumber(smsData.customerPhone);
    if (!e164Phone) {
      return NextResponse.json(
        { error: 'Could not format phone number for SMS' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check for MailerSend API token
    if (!process.env.MAILERSEND_API_TOKEN) {
      console.error('MAILERSEND_API_TOKEN not configured');
      return NextResponse.json(
        { error: 'SMS service not configured' },
        { status: 500, headers: corsHeaders }
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
      console.log('MailerSend response was not JSON, but SMS may have sent successfully');
    }

    if (!response.ok) {
      console.error('MailerSend SMS API error:', responseData);
      return NextResponse.json(
        { error: 'Failed to send SMS', details: responseData },
        { status: response.status, headers: corsHeaders }
      );
    }

    console.log('SMS sent successfully:', responseData);
    return NextResponse.json({
      success: true,
      message: 'SMS sent successfully to ' + e164Phone,
      smsId: responseData.data?.id || 'unknown'
    }, { headers: corsHeaders });

  } catch (error) {
    console.error('Error in SMS route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}