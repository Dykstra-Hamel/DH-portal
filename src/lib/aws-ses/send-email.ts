/**
 * AWS SES Email Sending Library
 *
 * Main email sending function that replaces Mailersend.
 * Handles suppression list checking, tenant routing, and email logging.
 */

import { SendEmailCommand } from '@aws-sdk/client-sesv2';
import { sesClient } from './client';
import { SendEmailParams, SendEmailResult } from '@/types/aws-ses';
import { isEmailSuppressed } from './suppression';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { generateTenantName } from './tenants';
import { generateConfigSetName } from './config-sets';

/**
 * Send an email via AWS SES
 *
 * This function:
 * 1. Checks if recipient is on suppression list
 * 2. Sends email via AWS SES using company's tenant
 * 3. Logs the email send to the database
 *
 * @param params - Email parameters
 * @returns Send result with message ID or error
 */
export async function sendEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  const {
    tenantName: providedTenantName,
    from,
    fromName,
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
    tags = [],
    configurationSetName: providedConfigSetName,
    trackingData,
  } = params;

  try {
    // Normalize recipient(s) to array
    const recipients = Array.isArray(to) ? to : [to];

    // Check suppression list for all recipients
    for (const recipient of recipients) {
      const isSuppressed = await isEmailSuppressed(recipient, companyId);
      if (isSuppressed) {
        console.warn(`Email ${recipient} is suppressed for company ${companyId}`);
        return {
          success: false,
          error: `Recipient ${recipient} is on the suppression list`,
        };
      }
    }

    // Generate tenant and config set names if not provided
    const tenantName = providedTenantName || generateTenantName(companyId);
    const configurationSetName =
      providedConfigSetName || 'my-first-configuration-set';

    // Build from address with name if provided
    const fromAddress = fromName ? `"${fromName}" <${from}>` : from;

    // Prepare email content
    const emailContent = {
      Simple: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: html,
            Charset: 'UTF-8',
          },
          ...(text && {
            Text: {
              Data: text,
              Charset: 'UTF-8',
            },
          }),
        },
      },
    };

    // Prepare destination
    const destination = {
      ToAddresses: recipients,
    };

    // Prepare email tags (metadata)
    const emailTags = [
      { Name: 'company_id', Value: companyId },
      { Name: 'source', Value: source },
      ...(leadId ? [{ Name: 'lead_id', Value: leadId }] : []),
      ...(templateId ? [{ Name: 'template_id', Value: templateId }] : []),
      ...tags.map((tag) => ({ Name: tag, Value: 'true' })),
    ];

    // Send email via AWS SES
    const command = new SendEmailCommand({
      FromEmailAddress: fromAddress,
      Destination: destination,
      Content: emailContent,
      ConfigurationSetName: configurationSetName,
      TenantName: tenantName,
      EmailTags: emailTags,
    });

    const response = await sesClient.send(command);
    const messageId = response.MessageId;

    if (!messageId) {
      throw new Error('No message ID returned from AWS SES');
    }

    // Log email send to database
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
        email_provider: 'aws-ses',
        provider_message_id: messageId,
        ses_message_id: messageId,
        tenant_name: tenantName,
        send_status: 'sent',
        delivery_status: 'sent',
        source: source,
        scheduled_for: scheduledFor || sentAt,
        tracking_data: trackingData || {},
        sent_at: sentAt,
      });
    } catch (logError) {
      console.error('Failed to log email send (non-critical):', logError);
      // Don't fail the email send if logging fails
    }

    return {
      success: true,
      messageId,
      tenantName,
      sentAt,
    };
  } catch (error) {
    console.error('Error sending email via AWS SES:', error);

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
        email_provider: 'aws-ses',
        send_status: 'failed',
        delivery_status: 'failed',
        source: source,
        scheduled_for: scheduledFor || new Date().toISOString(),
        tracking_data: trackingData || {},
        sent_at: new Date().toISOString(),
        ses_event_data: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      });
    } catch (logError) {
      console.error('Failed to log email error (non-critical):', logError);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}

/**
 * Send email to multiple recipients (batch send)
 * Note: AWS SES allows up to 50 recipients per email
 *
 * @param params - Email parameters with array of recipients
 * @returns Send result
 */
export async function sendBulkEmail(
  params: Omit<SendEmailParams, 'to'> & { to: string[] }
): Promise<SendEmailResult> {
  const { to, ...restParams } = params;

  if (to.length === 0) {
    return {
      success: false,
      error: 'No recipients provided',
    };
  }

  if (to.length > 50) {
    return {
      success: false,
      error: 'Maximum 50 recipients allowed per email',
    };
  }

  return sendEmail({
    ...restParams,
    to,
  });
}

/**
 * Send templated email (for future template support)
 * Currently sends as regular HTML email, can be extended to use SES templates
 *
 * @param params - Email parameters
 * @returns Send result
 */
export async function sendTemplateEmail(
  params: SendEmailParams
): Promise<SendEmailResult> {
  // For now, just use regular HTML sending
  // Can be extended to use AWS SES email templates in the future
  return sendEmail(params);
}

/**
 * Send email with automatic fallback to pmpcentral.io
 * If company tenant/domain fails, retries with fallback tenant
 *
 * @param params - Email parameters
 * @returns Send result
 */
export async function sendEmailWithFallback(
  params: SendEmailParams
): Promise<SendEmailResult> {
  // Try with company tenant/domain first
  const primaryResult = await sendEmail(params);

  if (primaryResult.success) {
    return primaryResult;
  }

  // Primary failed - try fallback
  console.warn(
    `Primary email send failed for company ${params.companyId}: ${primaryResult.error}. Attempting fallback...`
  );

  const fallbackTenant = process.env.FALLBACK_SES_TENANT_NAME || 'pmpcentral-fallback';
  const fallbackConfigSet = process.env.FALLBACK_SES_CONFIG_SET || 'my-first-configuration-set';
  const fallbackFrom = 'noreply@pmpcentral.io';

  const fallbackResult = await sendEmail({
    ...params,
    tenantName: fallbackTenant,
    configurationSetName: fallbackConfigSet,
    from: fallbackFrom,
    fromName: 'DH Portal',
  });

  if (fallbackResult.success) {
    console.log(`Email sent via fallback for company ${params.companyId}`);
  } else {
    console.error(
      `Both primary and fallback email sends failed for company ${params.companyId}`
    );
  }

  return fallbackResult;
}
