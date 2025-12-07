import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
 * POST - Send test email with sample data
 * Allows testing email templates before adding to workflows
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; templateId: string }> }
) {
  try {
    const { id: companyId, templateId } = await params;
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has access to this company
    const { data: userCompany, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single();

    // Also check if user is global admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isGlobalAdmin = profile?.role === 'admin';
    const hasCompanyAccess = userCompany && !userCompanyError;

    if (!isGlobalAdmin && !hasCompanyAccess) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
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

    // Fetch the email template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .eq('company_id', companyId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { success: false, error: 'Email template not found' },
        { status: 404 }
      );
    }

    // Fetch company data for variables
    const { data: company } = await supabase
      .from('companies')
      .select('name, email, phone, website')
      .eq('id', companyId)
      .single();

    // Fetch brand data for logo
    const { data: brandData } = await supabase
      .from('brands')
      .select('logo_url')
      .eq('company_id', companyId)
      .single();

    // Fetch Google reviews data
    const { data: reviewsSetting } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'google_reviews_data')
      .single();

    let reviewsData = null;
    try {
      if (reviewsSetting?.setting_value && reviewsSetting.setting_value !== '{}') {
        reviewsData = JSON.parse(reviewsSetting.setting_value);
      }
    } catch (parseError) {
      console.error('Error parsing Google reviews data:', parseError);
    }

    // Create sample variables with real company data
    const sampleVariables = createSampleVariables(
      company,
      brandData,
      reviewsData
    );

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

    // Send test email via email send API
    const emailResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email/send`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail,
          subject: processedSubject,
          html: processedHtml,
          text: processedText,
          companyId,
          templateId,
          source: 'template_test',
        }),
      }
    );

    const emailResult = await emailResponse.json();

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: emailResult.error || 'Failed to send test email',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent successfully to ${testEmail}`,
      emailId: emailResult.emailId,
      templateName: template.name,
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
