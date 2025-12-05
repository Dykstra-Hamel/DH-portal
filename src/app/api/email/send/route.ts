import { NextRequest, NextResponse } from 'next/server';
import { getCompanyFromEmail, getCompanyName, getCompanyTenantName } from '@/lib/email';
import { sendEmailWithFallback } from '@/lib/aws-ses/send-email';

interface EmailSendRequest {
  to: string;
  subject: string;
  html: string;
  text: string;
  companyId: string;
  templateId?: string;
  leadId?: string;
  customerId?: string;
  source?: string;
  campaignId?: string;
  executionId?: string;
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
      customerId,
      source = 'automation_workflow',
      campaignId,
      executionId
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

    // Get company information for proper from name
    const fromName = await getCompanyName(companyId);
    const fromEmail = await getCompanyFromEmail(companyId);

    // IMPORTANT: If using fallback email domain, use fallback tenant directly
    // Company tenants are only associated with their own custom domains, not pmpcentral.io
    const FALLBACK_FROM_EMAIL = 'noreply@pmpcentral.io';

    let result;

    if (fromEmail === FALLBACK_FROM_EMAIL) {
      // Using fallback email - send directly with fallback tenant (no retry needed)
      const { sendEmail } = await import('@/lib/aws-ses/send-email');
      result = await sendEmail({
        tenantName: process.env.FALLBACK_SES_TENANT_NAME || 'pmpcentral-fallback',
        from: fromEmail,
        fromName,
        to,
        subject,
        html,
        text: text || undefined,
        companyId,
        leadId,
        customerId,
        templateId,
        source,
        campaignId,
        executionId,
        tags: [
          'automation',
          source,
          ...(templateId ? [`template-${templateId}`] : []),
          ...(leadId ? [`lead-${leadId}`] : []),
          ...(campaignId ? [`campaign-${campaignId}`] : []),
        ],
      });
    } else {
      // Using custom domain - use fallback mechanism as safety net
      const tenantName = await getCompanyTenantName(companyId);
      result = await sendEmailWithFallback({
        tenantName,
        from: fromEmail,
        fromName,
        to,
        subject,
        html,
        text: text || undefined,
        companyId,
        leadId,
        customerId,
        templateId,
        source,
        campaignId,
        executionId,
        tags: [
          'automation',
          source,
          ...(templateId ? [`template-${templateId}`] : []),
          ...(leadId ? [`lead-${leadId}`] : []),
          ...(campaignId ? [`campaign-${campaignId}`] : []),
        ],
      });
    }

    if (!result.success) {
      console.error('AWS SES error:', result.error);

      return NextResponse.json(
        {
          success: false,
          error: `Email service error: ${result.error}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      provider: 'aws-ses',
      to,
      subject,
      sentAt: result.sentAt,
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
    const { isSESConfigured } = await import('@/lib/aws-ses/client');
    const { FALLBACK_FROM_EMAIL } = await import('@/lib/email');

    // Basic health check for AWS SES configuration
    if (!isSESConfigured()) {
      return NextResponse.json(
        { success: false, error: 'AWS SES not configured. Check AWS credentials.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: 'aws-ses',
      configured: true,
      fallbackEmail: FALLBACK_FROM_EMAIL,
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