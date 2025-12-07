import { EmailRecipient, LeadNotificationData } from './types';
import { generateLeadCreatedEmailTemplate } from './templates/lead-created';
import { getCompanyFromEmail, getCompanyName, getCompanyTenantName } from './index';
import { sendEmailWithFallback } from '@/lib/aws-ses/send-email';

export async function sendLeadCreatedNotifications(
  recipients: string[],
  leadData: LeadNotificationData,
  emailConfig?: {
    subjectLine?: string;
  },
  companyId?: string
) {
  try {
    // Get company's from email (custom domain if verified, otherwise fallback)
    const fromEmail = companyId ? await getCompanyFromEmail(companyId) : await getCompanyFromEmail('');
    const fromName = companyId ? await getCompanyName(companyId) : 'DH Portal';
    const tenantName = companyId ? await getCompanyTenantName(companyId) : '';

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

        // Generate HTML content
        const html = generateLeadCreatedEmailTemplate(recipientName, leadData);

        // Send email using AWS SES with fallback
        const result = await sendEmailWithFallback({
          tenantName,
          from: fromEmail,
          fromName,
          to: email,
          subject,
          html,
          companyId: companyId || '',
          leadId: leadData.leadId,
          source: 'lead_created_notification',
          tags: ['lead', 'notification'],
        });

        if (!result.success) {
          console.error(`Failed to send lead notification to ${email}:`, result.error);
          results.push({ email, success: false, error: result.error });
        } else {
          results.push({ email, success: true, messageId: result.messageId });
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
