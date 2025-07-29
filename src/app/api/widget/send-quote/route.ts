import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
// import { Resend } from 'resend';
import { generateQuoteEmailTemplate } from '@/lib/email/templates/quote';
import { QuoteEmailData } from '@/lib/email/types';
import { MAILERSEND_API_TOKEN, MAILERSEND_FROM_EMAIL } from '@/lib/email';

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

export async function POST(request: NextRequest) {
  try {
    const quoteData: QuoteRequest = await request.json();

    // Validate required fields
    if (
      !quoteData.companyId ||
      !quoteData.customerEmail ||
      !quoteData.customerName
    ) {
      return NextResponse.json(
        { error: 'Company ID, customer email, and name are required' },
        { status: 400, headers: corsHeaders }
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
      return NextResponse.json({ error: 'Company not found' }, { status: 404, headers: corsHeaders });
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
      urgency: quoteData.urgency || '1-2-days',
      companyName: company.name,
      customerEmail: quoteData.customerEmail,
      selectedPlan: servicePlan
    };

    const emailHtml = generateQuoteEmailTemplate(quoteEmailData);

    // Use MailerSend with hard-coded from email
    const fromEmail = MAILERSEND_FROM_EMAIL;

    // Send email using MailerSend
    console.log('DEBUG: Attempting to send email to:', quoteData.customerEmail);
    
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
      return NextResponse.json(
        { error: 'Failed to send quote email', details: errorData },
        { status: 500, headers: corsHeaders }
      );
    }

    let responseData: any = {};
    try {
      const responseText = await response.text();
      if (responseText.trim()) {
        responseData = JSON.parse(responseText);
      }
    } catch (error) {
      console.log('MailerSend response was not JSON, but email may have sent successfully');
    }

    console.log('DEBUG: Email sent successfully via MailerSend:', responseData);
    return NextResponse.json({
      success: true,
      emailId: responseData?.data?.id || 'unknown',
      message: 'Quote sent successfully to ' + quoteData.customerEmail,
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error in send quote:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
