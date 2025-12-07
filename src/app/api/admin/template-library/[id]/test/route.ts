import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';
import { createSampleVariables, replaceVariablesWithSample } from '@/lib/email/variables';

interface TestEmailRequest {
  testEmail: string;
  customVariables?: {
    campaignId?: string;
    firstName?: string;
    lastName?: string;
  };
}

/**
 * POST - Send test email for library template with sample data
 * This is for admin template library templates (global templates)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Use regular client for auth, admin client for data
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is global admin
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || !isAuthorizedAdmin(profile)) {
      return NextResponse.json(
        { error: 'Admin privileges required' },
        { status: 403 }
      );
    }

    // Parse request body
    const { testEmail, customVariables }: TestEmailRequest = await request.json();

    // Validate test email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!testEmail || !emailRegex.test(testEmail)) {
      return NextResponse.json(
        { success: false, error: 'Valid test email address is required' },
        { status: 400 }
      );
    }

    // Fetch the library template using admin client
    const { data: template, error: templateError } = await adminSupabase
      .from('email_template_library')
      .select('*')
      .eq('id', id)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Create sample variables with default data
    const sampleVariables = createSampleVariables();

    // Override with custom variables if provided
    if (customVariables) {
      if (customVariables.firstName) {
        sampleVariables.firstName = customVariables.firstName;
      }
      if (customVariables.lastName) {
        sampleVariables.lastName = customVariables.lastName;
      }
      if (customVariables.campaignId) {
        sampleVariables.campaignId = customVariables.campaignId;
        // Optionally fetch real campaign data if campaign ID is provided
        const { data: campaign } = await supabase
          .from('campaigns')
          .select(`
            id,
            campaign_id,
            name,
            campaign_landing_pages (
              hero_image_url
            )
          `)
          .eq('campaign_id', customVariables.campaignId)
          .single();

        if (campaign) {
          sampleVariables.campaignName = campaign.name || sampleVariables.campaignName;

          // Get hero image from landing page if available
          const landingPage = Array.isArray(campaign.campaign_landing_pages)
            ? campaign.campaign_landing_pages[0]
            : campaign.campaign_landing_pages;

          if (landingPage?.hero_image_url) {
            sampleVariables.campaignHeroImage = landingPage.hero_image_url;
          }
        }
      }
    }

    // Process template with sample variables
    const processedSubject = replaceVariablesWithSample(
      template.subject_line,
      sampleVariables
    );
    const processedHtml = replaceVariablesWithSample(
      template.html_content || '',
      sampleVariables
    );
    const processedText = replaceVariablesWithSample(
      template.text_content || '',
      sampleVariables
    );

    // For admin templates, use fallback email tenant
    const { sendEmail } = await import('@/lib/aws-ses/send-email');
    const FALLBACK_FROM_EMAIL = 'noreply@pmpcentral.io';

    const result = await sendEmail({
      tenantName: process.env.FALLBACK_SES_TENANT_NAME || 'pmpcentral-fallback',
      from: FALLBACK_FROM_EMAIL,
      fromName: 'PMP Central',
      to: testEmail,
      subject: processedSubject,
      html: processedHtml,
      text: processedText || undefined,
      companyId: 'admin-template-test',
      templateId: id,
      source: 'admin_template_test',
      tags: ['admin', 'template_test', `template-${id}`],
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send test email',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      messageId: result.messageId,
      templateName: template.name,
    });
  } catch (error) {
    console.error('Error sending admin template test email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
