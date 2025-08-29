import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
// import { Resend } from 'resend';
import { generateQuoteEmailTemplate } from '@/lib/email/templates/quote';
import { QuoteEmailData } from '@/lib/email/types';
import { MAILERSEND_API_TOKEN, MAILERSEND_FROM_EMAIL } from '@/lib/email';
import { handleCorsPrelight, createCorsResponse, createCorsErrorResponse, validateOrigin } from '@/lib/cors';

// const resend = new Resend(process.env.RESEND_API_KEY);

interface QuoteRequest {
  companyId: string;
  customerEmail: string;
  customerName: string;
  pestType: string;
  homeSize?: number;
  address?: string;
  estimatedPrice?: {
    min: number;
    max: number;
    service_type: string;
    factors: string[];
  };
  urgency?: string;
  selectedPlan?: string;
}

// Handle preflight OPTIONS request
export async function OPTIONS(request: NextRequest) {
  return await handleCorsPrelight(request, 'widget');
}

export async function POST(request: NextRequest) {
  try {
    // Validate origin first
    const { isValid, origin, response: corsResponse } = await validateOrigin(request, 'widget');
    if (!isValid && corsResponse) {
      return corsResponse;
    }

    const quoteData: QuoteRequest = await request.json();

    // Validate required fields
    if (
      !quoteData.companyId ||
      !quoteData.customerEmail ||
      !quoteData.customerName
    ) {
      return createCorsErrorResponse(
        'Company ID, customer email, and name are required',
        origin,
        'widget',
        400
      );
    }

    // Get company information including domain settings
    const supabase = createAdminClient();
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('name, email, phone, widget_config')
      .eq('id', quoteData.companyId)
      .single();

    if (companyError || !company) {
      console.error('Error fetching company:', companyError);
      return createCorsErrorResponse('Company not found', origin, 'widget', 404);
    }

    // Fetch service plan data if selectedPlan is provided
    let servicePlan: { id: string; plan_name: string; initial_price: number; recurring_price: number; billing_frequency: string; } | undefined;
    if (quoteData.selectedPlan) {
      const { data: planData, error: planError } = await supabase
        .from('service_plans')
        .select('id, plan_name, initial_price, recurring_price, billing_frequency')
        .eq('id', quoteData.selectedPlan)
        .eq('company_id', quoteData.companyId)
        .eq('is_active', true)
        .single();

      if (!planError && planData) {
        servicePlan = planData;
      }
    }

    // Extract first name from customer name
    const firstName = quoteData.customerName.split(' ')[0] || quoteData.customerName;
    
    // Generate quote email content using template
    const quoteEmailData: QuoteEmailData = {
      firstName,
      pestType: quoteData.pestType,
      address: quoteData.address || 'your location',
      companyName: company.name,
      customerEmail: quoteData.customerEmail,
      selectedPlan: servicePlan
    };

    const emailHtml = generateQuoteEmailTemplate(quoteEmailData);

    // Use MailerSend with hard-coded from email
    const fromEmail = MAILERSEND_FROM_EMAIL;

    // Send email using MailerSend
    const mailersendPayload = {
      from: {
        email: fromEmail
      },
      to: [
        {
          email: quoteData.customerEmail
        }
      ],
      subject: `Your Pest Control Quote - ${company.name}`,
      html: emailHtml
    };

    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILERSEND_API_TOKEN}`,
      },
      body: JSON.stringify(mailersendPayload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('DEBUG: MailerSend email sending failed:', response.status, errorData);
      return createCorsErrorResponse(
        'Failed to send quote email',
        origin,
        'widget',
        500
      );
    }

    let responseData: any = {};
    try {
      const responseText = await response.text();
      if (responseText.trim()) {
        responseData = JSON.parse(responseText);
      }
    } catch (error) {
      // MailerSend response was not JSON, but email may have sent successfully
    }

    return createCorsResponse({
      success: true,
      emailId: responseData?.data?.id || 'unknown',
      message: 'Quote sent successfully to ' + quoteData.customerEmail,
    }, origin, 'widget');
  } catch (error) {
    console.error('Error in send quote:', error);
    return createCorsErrorResponse(
      'Internal server error',
      null,
      'widget',
      500
    );
  }
}
