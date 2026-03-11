import { NextRequest, NextResponse } from 'next/server';
import { getCompanyName } from '@/lib/email';
import { sendEmailRouted } from '@/lib/email/router';

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

    // Get company name for from display
    const fromName = await getCompanyName(companyId);

    const result = await sendEmailRouted({
      tenantName: '',
      from: 'noreply@pmpcentral.io',
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

    if (!result.success) {
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

    if (!isSESConfigured()) {
      return NextResponse.json(
        { success: false, error: 'AWS SES not configured. Check AWS credentials.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      provider: 'aws-ses (default, per-company routing active)',
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
