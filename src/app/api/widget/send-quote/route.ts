import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { Resend } from 'resend';
import { generateQuoteEmailTemplate } from '@/lib/email/templates/quote';
import { QuoteEmailData } from '@/lib/email/types';

const resend = new Resend(process.env.RESEND_API_KEY);

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

    // Extract first name from customer name
    const firstName = quoteData.customerName.split(' ')[0] || quoteData.customerName;
    
    // Generate quote email content using template
    const quoteEmailData: QuoteEmailData = {
      firstName,
      pestType: quoteData.pestType,
      address: quoteData.address || 'your location',
      urgency: quoteData.urgency || '1-2-days',
      companyName: company.name,
      customerEmail: quoteData.customerEmail
    };

    const emailHtml = generateQuoteEmailTemplate(quoteEmailData);

    // Determine the from email address - use custom domain if verified in Resend
    let fromEmail = process.env.RESEND_FROM_EMAIL || 'quotes@company.com';
    console.log('DEBUG: Initial fromEmail:', fromEmail);

    try {
      // Get domain settings from company_settings
      const { data: domainSettings } = await supabase
        .from('company_settings')
        .select('setting_key, setting_value')
        .eq('company_id', quoteData.companyId)
        .in('setting_key', [
          'email_domain',
          'email_domain_prefix',
          'resend_domain_id',
        ]);

      console.log(
        'DEBUG: Domain settings found:',
        domainSettings?.length || 0,
        'settings'
      );

      if (domainSettings && domainSettings.length > 0) {
        const settingsMap = domainSettings.reduce(
          (acc, setting) => {
            acc[setting.setting_key] = setting.setting_value;
            return acc;
          },
          {} as Record<string, string>
        );

        const emailDomain = settingsMap.email_domain;
        const emailPrefix = settingsMap.email_domain_prefix || 'quotes';
        const resendDomainId = settingsMap.resend_domain_id;

        console.log(
          'DEBUG: Email config - domain:',
          emailDomain,
          'prefix:',
          emailPrefix,
          'resendId:',
          resendDomainId
        );

        // Use custom domain if configured (skip real-time verification to avoid rate limits)
        if (emailDomain && resendDomainId) {
          fromEmail = `${emailPrefix}@${emailDomain}`;
          console.log('DEBUG: Using custom domain email:', fromEmail);
        } else {
          console.log('DEBUG: Missing domain or resendId, using default');
        }
      } else {
        console.log('DEBUG: No domain settings found, using default');
      }
    } catch (error) {
      console.warn(
        'Failed to load domain settings for quotes, using default:',
        error
      );
    }

    console.log('DEBUG: Final fromEmail to be used:', fromEmail);

    // Send email using Resend
    console.log('DEBUG: Attempting to send email to:', quoteData.customerEmail);
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: [quoteData.customerEmail],
      subject: `Your Pest Control Quote - ${company.name}`,
      html: emailHtml,
    });

    if (emailError) {
      console.error('DEBUG: Email sending failed with error:', emailError);
      return NextResponse.json(
        { error: 'Failed to send quote email', details: emailError },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log('DEBUG: Email sent successfully, ID:', emailData?.id);
    return NextResponse.json({
      success: true,
      emailId: emailData?.id,
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
