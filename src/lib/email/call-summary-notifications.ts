import { CallSummaryEmailData } from './types';
import { generateCallSummaryEmailTemplate } from './templates/call-summary';
import { getCompanyFromEmail, getCompanyName, getCompanyTenantName } from './index';
import { validateEmails } from './lead-notifications';
import { sendEmailWithFallback } from '@/lib/aws-ses/send-email';

export async function sendCallSummaryNotifications(
  recipients: string[],
  callData: CallSummaryEmailData,
  emailConfig?: {
    subjectLine?: string;
  },
  companyId?: string
) {
  try {
    // Validate email addresses first
    const { valid: validEmails, invalid: invalidEmails } = validateEmails(recipients);
    
    if (validEmails.length === 0) {
      return {
        success: false,
        results: [],
        successCount: 0,
        failureCount: recipients.length,
        error: 'No valid email addresses provided',
        invalidEmails,
      };
    }

    // Get company's from email (custom domain if verified, otherwise fallback)
    const fromEmail = companyId ? await getCompanyFromEmail(companyId) : await getCompanyFromEmail('');
    const fromName = companyId ? await getCompanyName(companyId) : (callData.companyName || 'Call Management System');
    const tenantName = companyId ? await getCompanyTenantName(companyId) : '';

    const results = [];

    // Send email to each valid recipient
    for (const email of validEmails) {
      try {
        // Extract name from email or use generic greeting
        const recipientName = email
          .split('@')[0]
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());

        // Generate subject line and email template
        const subject = generateSubjectLine(callData, emailConfig?.subjectLine);
        const emailHtml = generateCallSummaryEmailTemplate(recipientName, callData);

        // Send email using AWS SES
        const result = await sendEmailWithFallback({
          tenantName,
          from: fromEmail,
          fromName,
          to: email,
          subject,
          html: emailHtml,
          companyId: companyId || '',
          source: 'call_summary_notification',
          tags: ['call', 'summary', 'notification'],
        });

        if (!result.success) {
          console.error(`[Call Summary Email Service] Failed to send to ${email}:`, result.error);
          results.push({ email, success: false, error: result.error });
        } else {
          results.push({ email, success: true, messageId: result.messageId });
        }
      } catch (emailError) {
        console.error(`[Call Summary Email Service] Error sending to ${email}:`, emailError);
        results.push({
          email,
          success: false,
          error: emailError instanceof Error ? emailError.message : 'Unknown error',
        });
      }
    }

    // Add failed results for invalid emails
    for (const invalidEmail of invalidEmails) {
      results.push({
        email: invalidEmail,
        success: false,
        error: 'Invalid email format',
      });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    return {
      success: successCount > 0,
      results,
      successCount,
      failureCount,
      invalidEmails,
    };
  } catch (error) {
    console.error(`[Call Summary Email Service] Critical error for call ${callData.callId}:`, error);
    throw error;
  }
}

// Generate subject line with template variable support
function generateSubjectLine(
  callData: CallSummaryEmailData,
  customTemplate?: string
): string {
  // Default professional subject line
  const defaultTemplate = 'Call Summary: {customerPhone} - {callStatus} ({companyName})';

  // Use custom template or default
  const template = customTemplate || defaultTemplate;

  // Format call status for display
  const formattedStatus = callData.callStatus === 'completed' ? 'Completed' 
    : callData.callStatus === 'no-answer' ? 'No Answer'
    : callData.callStatus.charAt(0).toUpperCase() + callData.callStatus.slice(1);

  // Replace template variables
  return template
    .replace(/\{customerPhone\}/g, callData.customerPhone)
    .replace(/\{customerName\}/g, callData.customerName || 'Unknown')
    .replace(/\{companyName\}/g, callData.companyName)
    .replace(/\{callStatus\}/g, formattedStatus)
    .replace(/\{callId\}/g, callData.callId)
    .replace(/\{sentiment\}/g, callData.sentiment || 'neutral')
    .replace(/\{pestIssue\}/g, callData.pestIssue || 'N/A')
    .replace(/\{address\}/g, callData.streetAddress || 'N/A');
}