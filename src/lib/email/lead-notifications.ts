import { Resend } from 'resend';
import { EmailRecipient, LeadNotificationData } from './types';
import { generateLeadCreatedEmailTemplate } from './templates/lead-created';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendLeadCreatedNotifications(
  recipients: string[],
  leadData: LeadNotificationData,
  emailConfig?: {
    subjectLine?: string;
  }
) {
  try {
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || 'notifications@yourdomain.com';
    const fromName = process.env.RESEND_FROM_NAME || 'PCOcentral';

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
          console.log(`Lead notification sent successfully to ${email}:`, data);
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

    console.log(
      `Lead notification results: ${successCount} sent, ${failureCount} failed`
    );

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
