import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { MAILERSEND_API_TOKEN, MAILERSEND_FROM_EMAIL } from '@/lib/email';
import { abTestEngine } from '@/lib/ab-testing/ab-test-engine';
import type { EmailScheduledEvent } from '../client';

export const emailScheduledHandler = inngest.createFunction(
  {
    id: 'email-scheduled-handler',
    name: 'Handle Scheduled Email',
    retries: 2,
  },
  { event: 'email/scheduled' },
  async ({ event, step }) => {
    const { 
      companyId, 
      templateId, 
      recipientEmail, 
      recipientName, 
      variables, 
      scheduledFor,
      workflowId,
      stepId,
      leadId,
      customerId
    } = event.data;
    
    console.log(`Processing scheduled email: ${templateId} to ${recipientEmail}`);

    // Step 1: Wait until scheduled time if needed
    const scheduledTime = new Date(scheduledFor);
    const now = new Date();
    
    if (scheduledTime > now) {
      await step.sleepUntil('wait-for-scheduled-time', scheduledTime);
    }

    // Step 2: Check for A/B test and get correct template
    const finalTemplateId = await step.run('check-ab-test', async () => {
      if (!leadId) {
        return templateId; // No lead ID, use original template
      }

      // Check if there's an active A/B test and assign lead if needed
      const assignedVariantId = await abTestEngine.assignLeadToTest(companyId, leadId, templateId);
      
      if (assignedVariantId) {
        // Get the template for the assigned variant
        const testTemplateId = await abTestEngine.getTemplateForLead(leadId, templateId);
        console.log(`Lead ${leadId} assigned to A/B test variant, using template ${testTemplateId}`);
        return testTemplateId;
      }

      return templateId; // No active test, use original template
    });

    // Step 3: Get email template and company info with comprehensive data
    const emailData = await step.run('get-email-data', async () => {
      const supabase = createAdminClient();
      
      // Get email template (using final template ID from A/B test if applicable)
      const { data: template, error: templateError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', finalTemplateId)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .single();

      if (templateError || !template) {
        throw new Error(`Email template ${finalTemplateId} not found or inactive`);
      }

      // Get company info for sender details
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('name, website')
        .eq('id', companyId)
        .single();

      if (companyError) {
        console.warn('Could not fetch company info:', companyError);
      }

      // Get comprehensive company settings
      const { data: allSettings } = await supabase
        .from('company_settings')
        .select('setting_key, setting_value')
        .eq('company_id', companyId);

      const settingsMap = new Map(allSettings?.map(s => [s.setting_key, s.setting_value]) || []);

      // Get brand data
      const { data: brandData } = await supabase
        .from('company_brand')
        .select('*')
        .eq('company_id', companyId)
        .single();

      // Get Google reviews data
      const { data: reviewsData } = await supabase
        .from('google_reviews')
        .select('review_text, reviewer_name, rating')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      // Get pricing plans
      const { data: pricingPlans } = await supabase
        .from('pricing_plans')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('order_index');

      return {
        template,
        company: company || { name: 'Your Company', website: '' },
        settings: settingsMap,
        brandData: brandData || {},
        reviews: reviewsData || [],
        pricingPlans: pricingPlans || [],
      };
    });

    // Step 4: Create email log entry
    const emailLogId = await step.run('create-email-log', async () => {
      const supabase = createAdminClient();
      
      const { data: execution } = await supabase
        .from('automation_executions')
        .select('id')
        .eq('workflow_id', workflowId)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { data: emailLog, error } = await supabase
        .from('email_automation_log')
        .insert([{
          execution_id: execution?.id,
          company_id: companyId,
          template_id: finalTemplateId, // Use the A/B test template if applicable
          recipient_email: recipientEmail,
          recipient_name: recipientName,
          subject_line: emailData.template.subject_line,
          send_status: 'scheduled',
          scheduled_for: scheduledFor,
        }])
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to create email log: ${error.message}`);
      }

      // Update A/B test assignment with email log reference if applicable
      if (leadId && finalTemplateId !== templateId) {
        await supabase
          .from('ab_test_assignments')
          .update({ 
            email_log_id: emailLog.id,
            email_sent_at: new Date().toISOString()
          })
          .eq('lead_id', leadId);
      }

      return emailLog.id;
    });

    // Step 5: Process email template with comprehensive variables
    const processedEmail = await step.run('process-email-template', async () => {
      // Build comprehensive variables object
      const templateVariables = {
        ...variables,
        // Basic company info
        companyName: emailData.company.name,
        companyWebsite: emailData.company.website,
        companyPhone: emailData.settings.get('company_phone') || '',
        recipientName,
        
        // Brand colors and styling
        primaryColor: emailData.brandData?.primary_color || '#000000',
        secondaryColor: emailData.brandData?.secondary_color || '#666666',
        accentColor: emailData.brandData?.accent_color || '#007bff',
        brandFont: emailData.brandData?.font_family || 'Arial, sans-serif',
        
        // Logo settings
        companyLogo: emailData.brandData?.logo_url || '',
        logoOverride: emailData.settings.get('logo_override_url') || emailData.brandData?.logo_url || '',
        
        // Google reviews
        googleReviews: emailData.reviews.map(review => ({
          text: review.review_text,
          reviewerName: review.reviewer_name,
          rating: review.rating,
        })),
        hasReviews: emailData.reviews.length > 0,
        reviewCount: emailData.reviews.length,
        avgRating: emailData.reviews.length > 0 
          ? (emailData.reviews.reduce((sum, r) => sum + r.rating, 0) / emailData.reviews.length).toFixed(1)
          : '0',
        
        // Pricing plans
        pricingPlans: emailData.pricingPlans,
        hasPricingPlans: emailData.pricingPlans.length > 0,
        
        // Selected plan (from variables if passed in)
        selectedPlan: variables.selectedPlan || null,
        selectedPlanPrice: variables.selectedPlanPrice || '',
        selectedPlanName: variables.selectedPlanName || '',
        
        // Additional settings
        businessAddress: emailData.settings.get('business_address') || '',
        businessHours: emailData.settings.get('business_hours') || '',
        licenseNumber: emailData.settings.get('license_number') || '',
        
        // Social media
        facebookUrl: emailData.settings.get('facebook_url') || '',
        instagramUrl: emailData.settings.get('instagram_url') || '',
        twitterUrl: emailData.settings.get('twitter_url') || '',
        
        // Email customization
        emailSignature: emailData.settings.get('email_signature') || '',
        unsubscribeUrl: emailData.settings.get('unsubscribe_url') || '',
      };

      return processEmailTemplate(emailData.template, templateVariables);
    });

    // Step 6: Send email via MailerSend
    const emailResult = await step.run('send-email', async () => {
      try {
        // Get custom from email if configured, otherwise use default
        const fromEmail = await getCompanyFromEmail(companyId) || MAILERSEND_FROM_EMAIL;
        const fromName = emailData.company.name || 'Your Company';

        const mailersendPayload = {
          from: {
            email: fromEmail,
            name: fromName,
          },
          to: [{
            email: recipientEmail,
            name: recipientName,
          }],
          subject: processedEmail.subject,
          html: processedEmail.htmlContent,
          text: processedEmail.textContent,
          // Add tracking for opens and clicks
          tags: [
            `company:${companyId}`,
            `workflow:${workflowId}`,
            `template:${finalTemplateId}`,
            ...(finalTemplateId !== templateId ? [`ab_test:${finalTemplateId}`, `original:${templateId}`] : []),
            ...(leadId ? [`lead:${leadId}`] : []),
          ],
          personalization: [{
            email: recipientEmail,
            data: variables,
          }],
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
          throw new Error(`MailerSend error: ${response.status} - ${errorData}`);
        }

        let responseData: any = {};
        try {
          const responseText = await response.text();
          if (responseText.trim()) {
            responseData = JSON.parse(responseText);
          }
        } catch (parseError) {
          console.log('MailerSend response was not JSON, but email likely sent successfully');
        }

        return {
          success: true,
          providerId: responseData.message_id || `ms-${Date.now()}`,
          response: responseData,
        };
      } catch (error) {
        console.error('Error sending email via MailerSend:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    // Step 7: Update email log with result
    await step.run('update-email-log', async () => {
      const supabase = createAdminClient();
      
      const updateData: any = {
        send_status: emailResult.success ? 'sent' : 'failed',
        updated_at: new Date().toISOString(),
      };

      if (emailResult.success) {
        updateData.sent_at = new Date().toISOString();
        if ('providerId' in emailResult) {
          updateData.email_provider_id = emailResult.providerId;
        }
      } else {
        updateData.failed_at = new Date().toISOString();
        if ('error' in emailResult) {
          updateData.error_message = emailResult.error;
        }
      }

      await supabase
        .from('email_automation_log')
        .update(updateData)
        .eq('id', emailLogId);
    });

    // Step 8: Record A/B test metrics if applicable
    if (emailResult.success && leadId && finalTemplateId !== templateId) {
      await step.run('record-ab-test-metrics', async () => {
        await abTestEngine.recordEmailMetrics(emailLogId, 'sent');
      });
    }

    // Step 9: Schedule delivery tracking if email was sent successfully
    if (emailResult.success) {
      await step.run('schedule-delivery-tracking', async () => {
        // Schedule tracking check in 1 hour
        const trackingTime = new Date();
        trackingTime.setHours(trackingTime.getHours() + 1);

        await inngest.send({
          name: 'email/delivery-tracking',
          data: {
            emailLogId,
            companyId,
            providerId: 'providerId' in emailResult ? emailResult.providerId : null,
            scheduledFor: trackingTime.toISOString(),
          },
        });
      });
    }

    return {
      success: emailResult.success,
      emailLogId,
      recipientEmail,
      templateId,
      error: 'error' in emailResult ? emailResult.error : null,
    };
  }
);

// Process email template with variables
function processEmailTemplate(template: any, variables: Record<string, any>) {
  let processedSubject = template.subject_line;
  let processedHtmlContent = template.html_content;
  let processedTextContent = template.text_content || '';

  // Simple template variable replacement using {{variable}} syntax
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    const stringValue = String(value || '');
    
    processedSubject = processedSubject.replace(regex, stringValue);
    processedHtmlContent = processedHtmlContent.replace(regex, stringValue);
    processedTextContent = processedTextContent.replace(regex, stringValue);
  });

  // Handle conditional blocks {{#if variable}}...{{/if}}
  processedHtmlContent = processConditionalBlocks(processedHtmlContent, variables);
  processedTextContent = processConditionalBlocks(processedTextContent, variables);

  return {
    subject: processedSubject,
    htmlContent: processedHtmlContent,
    textContent: processedTextContent,
  };
}

// Process conditional blocks in templates
function processConditionalBlocks(content: string, variables: Record<string, any>): string {
  // Handle {{#if variable}}...{{/if}} blocks
  const ifRegex = /{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g;
  
  return content.replace(ifRegex, (match, variableName, blockContent) => {
    const value = variables[variableName];
    
    // Show block if variable exists and is truthy
    if (value && value !== '' && value !== null && value !== undefined) {
      return blockContent;
    }
    
    return ''; // Hide block if variable is falsy
  });
}

// Get company's custom from email if configured
async function getCompanyFromEmail(companyId: string): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    
    const { data: settings } = await supabase
      .from('company_settings')
      .select('setting_key, setting_value')
      .eq('company_id', companyId)
      .in('setting_key', ['email_domain', 'email_domain_prefix', 'email_domain_status']);

    const settingsMap = new Map(settings?.map(s => [s.setting_key, s.setting_value]) || []);
    
    const domain = settingsMap.get('email_domain');
    const prefix = settingsMap.get('email_domain_prefix') || 'noreply';
    const status = settingsMap.get('email_domain_status');
    
    // Only use custom domain if it's verified
    if (domain && status === 'verified') {
      return `${prefix}@${domain}`;
    }
    
    return null;
  } catch (error) {
    console.warn('Error getting company from email:', error);
    return null;
  }
}