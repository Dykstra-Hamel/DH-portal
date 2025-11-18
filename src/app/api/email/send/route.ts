import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { MAILERSEND_API_TOKEN, MAILERSEND_FALLBACK_EMAIL, getCompanyFromEmail } from '@/lib/email';

interface EmailSendRequest {
  to: string;
  subject: string;
  html: string;
  text: string;
  companyId: string;
  templateId?: string;
  leadId?: string;
  source?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      to, 
      subject, 
      html, 
      text, 
      companyId, 
      templateId, 
      leadId, 
      source = 'automation_workflow' 
    }: EmailSendRequest = await request.json();

    // Basic validation
    if (!to || !subject || !html || !companyId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: to, subject, html, companyId' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get company information for proper from name
    const { data: company } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    const fromName = company?.name || 'Automation System';

    // Get company's from email (custom domain if verified, otherwise fallback)
    const fromEmail = await getCompanyFromEmail(companyId);

    // Prepare MailerSend API request
    const mailersendData = {
      from: {
        email: fromEmail,
        name: fromName,
      },
      to: [
        {
          email: to,
          name: to.split('@')[0], // Use email prefix as name
        },
      ],
      subject: subject,
      html: html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags as fallback
      tags: [
        'automation',
        source,
        ...(templateId ? [`template-${templateId}`] : []),
        ...(leadId ? [`lead-${leadId}`] : []),
      ],
      variables: [
        {
          email: to,
          substitutions: [
            {
              var: 'company_name',
              value: fromName,
            },
          ],
        },
      ],
    };

    // Prepare MailerSend payload
    const mailersendPayload = JSON.stringify(mailersendData);

    // Send email via MailerSend
    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAILERSEND_API_TOKEN}`,
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: mailersendPayload,
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('MailerSend API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorData,
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Email service error: ${response.status} - ${response.statusText}`,
          details: errorData 
        },
        { status: 500 }
      );
    }

    let result;
    let messageId;
    
    try {
      const responseText = await response.text();
      
      if (responseText.trim()) {
        result = JSON.parse(responseText);
        messageId = result.message_id || `auto-${Date.now()}`;
      } else {
        // Empty response but successful HTTP status
        result = { message_id: `mailersend-${Date.now()}` };
        messageId = result.message_id;
      }
    } catch (parseError) {
      console.error('Failed to parse MailerSend response as JSON:', parseError);
      // If parsing fails but HTTP status was OK, treat as success
      messageId = `mailersend-fallback-${Date.now()}`;
      result = { message_id: messageId };
    }


    // Optional: Log email sending to database for tracking
    try {
      await supabase
        .from('email_logs')
        .insert([
          {
            company_id: companyId,
            lead_id: leadId,
            template_id: templateId,
            recipient_email: to,
            subject_line: subject,
            email_provider: 'mailersend',
            provider_message_id: messageId,
            send_status: 'sent',
            source: source,
            sent_at: new Date().toISOString(),
          },
        ]);
    } catch (logError) {
      console.warn('Failed to log email sending (non-critical):', logError);
      // Don't fail the email sending if logging fails
    }

    return NextResponse.json({
      success: true,
      messageId,
      provider: 'mailersend',
      to,
      subject,
      sentAt: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error in email send API:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// GET method to check email service status
export async function GET() {
  try {
    // Basic health check for MailerSend configuration
    if (!MAILERSEND_API_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'MailerSend API token not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: 'mailersend',
      configured: true,
      fallbackEmail: MAILERSEND_FALLBACK_EMAIL,
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Configuration error' 
      },
      { status: 500 }
    );
  }
}