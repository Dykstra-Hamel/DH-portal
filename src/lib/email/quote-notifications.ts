import { QuoteSignedEmailData } from './types';
import { generateQuoteSignedEmailTemplate } from './templates/quote-signed';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { MAILERSEND_API_TOKEN, getCompanyFromEmail } from './index';

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

    // Generate subject line
    const subject = `Quote Accepted - ${customerName}`;

    // Generate email HTML
    const html = generateQuoteSignedEmailTemplate(data);

    // Send email using MailerSend
    const mailersendPayload = {
      from: {
        email: fromEmail,
        name: fromName,
      },
      to: [
        {
          email: assignedUserEmail,
          name: assignedUserName,
        },
      ],
      subject: subject,
      html: html,
    };

    const response = await fetch('https://api.mailersend.com/v1/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${MAILERSEND_API_TOKEN}`,
      },
      body: JSON.stringify(mailersendPayload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error(
        `Failed to send quote signed notification to ${assignedUserEmail}:`,
        response.status,
        errorData
      );
      return {
        success: false,
        error: `MailerSend error: ${response.status}`,
      };
    }

    let responseData: any = {};
    try {
      const responseText = await response.text();
      if (responseText.trim()) {
        responseData = JSON.parse(responseText);
      }
    } catch (error) {
      console.log(
        'MailerSend response was not JSON, but email may have sent successfully'
      );
    }

    console.log(
      `Quote signed notification sent to ${assignedUserEmail} for quote ${data.quoteId}`
    );

    return {
      success: true,
      data: responseData,
    };
  } catch (error) {
    console.error('Error in sendQuoteSignedNotification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
