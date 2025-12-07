import { QuoteSignedEmailData } from './types';
import { generateQuoteSignedEmailTemplate } from './templates/quote-signed';
import { getCompanyFromEmail, getCompanyName, getCompanyTenantName } from './index';
import { sendEmailWithFallback } from '@/lib/aws-ses/send-email';

/**
 * Send quote signed notification email to the assigned user
 */
export async function sendQuoteSignedNotification(
  data: QuoteSignedEmailData,
  companyId: string
) {
  try {
    const { assignedUserEmail, assignedUserName, customerName } = data;

    // Validate email
    if (!assignedUserEmail || !assignedUserEmail.includes('@')) {
      console.error('Invalid assigned user email:', assignedUserEmail);
      return {
        success: false,
        error: 'Invalid assigned user email',
      };
    }

    // Get company's from email (custom domain if verified, otherwise fallback)
    const fromEmail = await getCompanyFromEmail(companyId);
    const fromName = await getCompanyName(companyId);
    const tenantName = await getCompanyTenantName(companyId);

    // Generate subject line
    const subject = `Quote Accepted - ${customerName}`;

    // Generate email HTML
    const html = generateQuoteSignedEmailTemplate(data);

    // Send email using AWS SES
    const result = await sendEmailWithFallback({
      tenantName,
      from: fromEmail,
      fromName,
      to: assignedUserEmail,
      subject,
      html,
      companyId,
      source: 'quote_signed_notification',
      tags: ['quote', 'notification'],
    });

    if (!result.success) {
      console.error(
        `Failed to send quote signed notification to ${assignedUserEmail}:`,
        result.error
      );
      return {
        success: false,
        error: result.error || 'Failed to send email',
      };
    }

    console.log(
      `Quote signed notification sent to ${assignedUserEmail} for quote ${data.quoteId}`
    );

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Error in sendQuoteSignedNotification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
