import { EmailRecipient, LeadNotificationData } from './types';
import { generateLeadCreatedEmailTemplate } from './templates/lead-created';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { MAILERSEND_API_TOKEN, getCompanyFromEmail } from './index';

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
    let fromName = 'PMP Central';

    if (companyId) {
      try {
        const supabase = createAdminClient();

        // Get company name
        const { data: company } = await supabase
          .from('companies')
          .select('name')
          .eq('id', companyId)
          .single();

        if (company) {
          fromName = company.name;
        }
      } catch (error) {
        console.warn('Failed to load company name, using default:', error);
      }
    }

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

        // Send email using MailerSend
        const mailersendPayload = {
          from: {
            email: fromEmail,
            name: fromName
          },
          to: [
            {
              email: email
            }
          ],
          subject: subject,
          html: generateLeadCreatedEmailTemplate(recipientName, leadData)
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
          console.error(`Failed to send lead notification to ${email}:`, response.status, errorData);
          results.push({ email, success: false, error: `MailerSend error: ${response.status}` });
        } else {
          let responseData: any = {};
          try {
            const responseText = await response.text();
            if (responseText.trim()) {
              responseData = JSON.parse(responseText);
            }
          } catch (error) {
            console.log('MailerSend response was not JSON, but email may have sent successfully');
          }
          
          results.push({ email, success: true, data: responseData });
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
