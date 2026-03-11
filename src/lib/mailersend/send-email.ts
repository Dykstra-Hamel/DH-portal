/**
 * MailerSend Email Sending Library
 *
 * Alternative email provider for companies that prefer MailerSend over AWS SES.
 * Uses the company's own MailerSend API key and verified from-address.
 */

import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import { SendEmailParams, SendEmailResult } from '@/types/aws-ses';
import { isEmailSuppressed } from '@/lib/suppression';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { generateUnsubscribeToken, getUnsubscribeUrl } from '@/lib/suppression/tokens';
import { generateUnsubscribeFooter, generatePlainTextUnsubscribeFooter } from '@/lib/email/unsubscribe-footer';
import { injectFooterIntoHtml, injectFooterIntoPlainText } from '@/lib/email/inject-footer';
import { shouldSkipUnsubscribeFooter } from '@/lib/email/config';

interface MailerSendSendParams extends SendEmailParams {
  apiKey: string;
  fromOverride: string;
  fromNameOverride?: string;
}

export async function sendEmailViaMailerSend(
  params: MailerSendSendParams
): Promise<SendEmailResult> {
  const {
    apiKey,
    fromOverride,
    fromNameOverride,
    to,
    subject,
    html,
    text,
    companyId,
    leadId,
    customerId,
    templateId,
    executionId,
    campaignId,
    recipientName,
    scheduledFor,
    source = 'automation_workflow',
    trackingData,
  } = params;

  try {
    const recipients = Array.isArray(to) ? to : [to];

    // Check suppression list
    for (const recipient of recipients) {
      const isSuppressed = await isEmailSuppressed(recipient, companyId);
      if (isSuppressed) {
        return {
          success: false,
          error: `Recipient ${recipient} is on the suppression list`,
        };
      }
    }

    // Auto-inject unsubscribe footer (unless this is a system email)
    let finalHtml = html;
    let finalText = text;
    let footerInjected = false;

    if (!shouldSkipUnsubscribeFooter(source)) {
      const supabase = createAdminClient();
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();

      const companyName = company?.name || 'us';
      const recipientEmail = recipients[0];

      const tokenResult = await generateUnsubscribeToken({
        companyId,
        customerId,
        email: recipientEmail,
        source: source || 'automation_workflow',
        metadata: { leadId, templateId, executionId, campaignId },
      });

      if (tokenResult.success && tokenResult.data) {
        const unsubscribeUrl = getUnsubscribeUrl(tokenResult.data.token);

        const footerHtml = generateUnsubscribeFooter({ unsubscribeUrl, companyName });
        const footerText = generatePlainTextUnsubscribeFooter({ unsubscribeUrl, companyName });

        finalHtml = injectFooterIntoHtml(html, footerHtml);
        if (text) {
          finalText = injectFooterIntoPlainText(text, footerText);
        }

        footerInjected = true;
      }
    }

    // Send via MailerSend
    const mailerSend = new MailerSend({ apiKey });

    const sentFrom = new Sender(fromOverride, fromNameOverride);
    const recipientList = recipients.map(email => new Recipient(email));

    const emailParams = new EmailParams()
      .setFrom(sentFrom)
      .setTo(recipientList)
      .setSubject(subject)
      .setHtml(finalHtml);

    if (finalText) {
      emailParams.setText(finalText);
    }

    const response = await mailerSend.email.send(emailParams);

    // MailerSend returns 202 on success; message ID is in X-Message-Id header
    const messageId = (response.headers as Record<string, string>)?.['x-message-id'] || `ms-${Date.now()}`;

    // Log to email_logs
    const supabase = createAdminClient();
    const sentAt = new Date().toISOString();

    try {
      await supabase.from('email_logs').insert({
        company_id: companyId,
        lead_id: leadId || null,
        customer_id: customerId || null,
        template_id: templateId || null,
        execution_id: executionId || null,
        campaign_id: campaignId || null,
        recipient_email: recipients.join(', '),
        recipient_name: recipientName || null,
        subject_line: subject,
        email_provider: 'mailersend',
        provider_message_id: messageId,
        send_status: 'sent',
        delivery_status: 'sent',
        source: source,
        scheduled_for: scheduledFor || sentAt,
        tracking_data: {
          ...trackingData,
          unsubscribe_footer_injected: footerInjected,
        },
        sent_at: sentAt,
      });
    } catch (logError) {
      console.error('Failed to log MailerSend email (non-critical):', logError);
    }

    return {
      success: true,
      messageId,
      sentAt,
    };
  } catch (error) {
    console.error('Error sending email via MailerSend:', error);

    // Log the failed send attempt
    try {
      const supabase = createAdminClient();
      const recipients = Array.isArray(to) ? to : [to];

      await supabase.from('email_logs').insert({
        company_id: companyId,
        lead_id: leadId || null,
        customer_id: customerId || null,
        template_id: templateId || null,
        execution_id: executionId || null,
        campaign_id: campaignId || null,
        recipient_email: recipients.join(', '),
        recipient_name: recipientName || null,
        subject_line: subject,
        email_provider: 'mailersend',
        send_status: 'failed',
        delivery_status: 'failed',
        source: source,
        scheduled_for: scheduledFor || new Date().toISOString(),
        tracking_data: {
          ...trackingData,
          unsubscribe_footer_injected: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        sent_at: new Date().toISOString(),
      });
    } catch (logError) {
      console.error('Failed to log MailerSend error (non-critical):', logError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email via MailerSend',
    };
  }
}
