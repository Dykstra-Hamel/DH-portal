import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { Resend } from 'resend';

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

    // Generate quote email content
    const quoteId = `QUOTE-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Pest Control Quote</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${company.widget_config?.branding?.primaryColor || '#007bff'}; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .quote-details { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid ${company.widget_config?.branding?.primaryColor || '#007bff'}; }
            .price-range { font-size: 24px; font-weight: bold; color: ${company.widget_config?.branding?.primaryColor || '#007bff'}; }
            .factors { margin: 15px 0; }
            .factors li { margin: 5px 0; }
            .next-steps { background: #e8f4f8; padding: 15px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${company.name}</h1>
            <h2>Your Pest Control Quote</h2>
          </div>
          
          <div class="content">
            <p>Hi ${quoteData.customerName},</p>
            
            <p>Thank you for contacting us about your ${quoteData.pestType.toLowerCase()} issue. Based on the information you provided, here&apos;s your personalized quote:</p>
            
            <div class="quote-details">
              <h3>Quote Details</h3>
              <div class="price-range">$${quoteData.estimatedPrice?.min} - $${quoteData.estimatedPrice?.max}</div>
              <p><strong>Service:</strong> ${quoteData.estimatedPrice?.service_type}</p>
              <p><strong>Pest Type:</strong> ${quoteData.pestType}</p>
              ${quoteData.homeSize ? `<p><strong>Property Size:</strong> ${quoteData.homeSize} sq ft</p>` : ''}
              ${quoteData.address ? `<p><strong>Service Address:</strong> ${quoteData.address}</p>` : ''}
              <p><strong>Timeline:</strong> ${quoteData.urgency}</p>
              
              <div class="factors">
                <p><strong>Pricing factors considered:</strong></p>
                <ul>
                  ${quoteData.estimatedPrice?.factors.map(factor => `<li>${factor}</li>`).join('')}
                </ul>
              </div>
              
              <p><strong>Quote ID:</strong> ${quoteId}</p>
            </div>
            
            <div class="next-steps">
              <h3>Next Steps</h3>
              <p>We&apos;d love to schedule a consultation to provide you with a more detailed assessment and final pricing. Our team will contact you within 24 hours to:</p>
              <ul>
                <li>Confirm the details of your pest issue</li>
                <li>Schedule an on-site inspection</li>
                <li>Provide a detailed treatment plan</li>
                <li>Answer any questions you may have</li>
              </ul>
            </div>
            
            <p>If you have any immediate questions or would like to schedule sooner, please don&apos;t hesitate to contact us:</p>
            <p><strong>Phone:</strong> ${company.phone || 'Contact via email'}<br>
            <strong>Email:</strong> ${company.email || 'info@company.com'}</p>
            
            <p>We look forward to helping you resolve your pest control needs!</p>
            
            <p>Best regards,<br>
            The ${company.name} Team</p>
          </div>
          
          <div class="footer">
            <p>This quote is valid for 30 days. Prices may vary based on final inspection.</p>
            <p>${company.name} | Professional Pest Control Services</p>
          </div>
        </body>
      </html>
    `;

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
      quoteId,
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
