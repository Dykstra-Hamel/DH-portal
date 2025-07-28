import { Resend } from 'resend';
import { EmailRecipient, LeadNotificationData } from './types';
import { generateLeadCreatedEmailTemplate } from './templates/lead-created';
import { createAdminClient } from '@/lib/supabase/server-admin';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendLeadCreatedNotifications(
  recipients: string[],
  leadData: LeadNotificationData,
  emailConfig?: {
    subjectLine?: string;
  },
  companyId?: string
) {
  try {
    // Get custom domain configuration for the company
    let fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@yourdomain.com';
    let fromName = process.env.RESEND_FROM_NAME || 'PCOcentral';

    if (companyId) {
      try {
        const supabase = createAdminClient();
        
        // Get company name and domain settings
        const { data: company } = await supabase
          .from('companies')
          .select('name')
          .eq('id', companyId)
          .single();
          
        const { data: domainSettings } = await supabase
          .from('company_settings')
          .select('setting_key, setting_value')
          .eq('company_id', companyId)
          .in('setting_key', ['email_domain', 'email_domain_status', 'email_domain_prefix']);

        if (company && domainSettings) {
          const settingsMap = domainSettings.reduce((acc, setting) => {
            acc[setting.setting_key] = setting.setting_value;
            return acc;
          }, {} as Record<string, string>);

          const emailDomain = settingsMap.email_domain;
          const domainStatus = settingsMap.email_domain_status;
          const emailPrefix = settingsMap.email_domain_prefix || 'noreply';

          if (emailDomain && domainStatus === 'verified') {
            // Use the custom domain for sending
            fromEmail = `${emailPrefix}@${emailDomain}`;
            fromName = company.name;
          }
        }
      } catch (error) {
        console.warn('Failed to load custom domain configuration, using default:', error);
        // Continue with default configuration
      }
    }

    // Format from field with name
    const fromField = `${fromName} <${fromEmail}>`;

    const results = [];

    // Send email to each recipient
    for (const email of recipients) {
      try {
        // Extract name from email or use generic greeting
        const recipientName = email
          .split('@')[0]
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());

        // Generate subject line
        const subject = generateSubjectLine(leadData, emailConfig?.subjectLine);

        const { data, error } = await resend.emails.send({
          from: fromField,
          to: [email],
          subject: subject,
          html: generateLeadCreatedEmailTemplate(recipientName, leadData),
        });

        if (error) {
          console.error(`Failed to send lead notification to ${email}:`, error);
          results.push({ email, success: false, error: error.message });
        } else {
          results.push({ email, success: true, data });
        }
      } catch (emailError) {
        console.error(`Error sending email to ${email}:`, emailError);
        results.push({
          email,
          success: false,
          error:
            emailError instanceof Error ? emailError.message : 'Unknown error',
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;


    return {
      success: successCount > 0,
      results,
      successCount,
      failureCount,
    };
  } catch (error) {
    console.error('Error in sendLeadCreatedNotifications:', error);
    throw error;
  }
}

// Helper function to validate email addresses
export function validateEmails(emails: string[]): {
  valid: string[];
  invalid: string[];
} {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const email of emails) {
    const trimmedEmail = email.trim();
    if (emailRegex.test(trimmedEmail)) {
      valid.push(trimmedEmail);
    } else {
      invalid.push(trimmedEmail);
    }
  }

  return { valid, invalid };
}

// Generate subject line with template variable support
function generateSubjectLine(
  leadData: LeadNotificationData,
  customTemplate?: string
): string {
  // Default professional subject line
  const defaultTemplate = 'New Service Request: {customerName} - {companyName}';

  // Use custom template or default
  const template = customTemplate || defaultTemplate;

  // Replace template variables
  return template
    .replace(/\{customerName\}/g, leadData.customerName)
    .replace(/\{companyName\}/g, leadData.companyName)
    .replace(/\{pestIssue\}/g, leadData.pestType)
    .replace(/\{priority\}/g, leadData.priority.toUpperCase())
    .replace(/\{address\}/g, leadData.address);
}
