/**
 * Email Provider Router
 *
 * Routes outbound email to either AWS SES (default) or MailerSend,
 * based on the company's `email_provider` setting in company_settings.
 */

import { SendEmailParams, SendEmailResult } from '@/types/aws-ses';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendEmailWithFallback } from '@/lib/aws-ses/send-email';
import { sendEmailViaMailerSend } from '@/lib/mailersend/send-email';

async function getEmailProviderSettings(companyId: string): Promise<{
  provider: string;
  mailersendApiKey: string | null;
  mailersendFromEmail: string | null;
  mailersendFromName: string | null;
}> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('company_settings')
    .select('setting_key, setting_value')
    .eq('company_id', companyId)
    .in('setting_key', [
      'email_provider',
      'mailersend_api_key',
      'mailersend_from_email',
      'mailersend_from_name',
    ]);

  const settings: Record<string, string> = {};
  data?.forEach(s => {
    settings[s.setting_key] = s.setting_value;
  });

  return {
    provider: settings['email_provider'] || 'aws-ses',
    mailersendApiKey: settings['mailersend_api_key'] || null,
    mailersendFromEmail: settings['mailersend_from_email'] || null,
    mailersendFromName: settings['mailersend_from_name'] || null,
  };
}

/**
 * Send an email routed to the appropriate provider based on company settings.
 *
 * - If the company has `email_provider = 'mailersend'` and a valid API key,
 *   the email is sent via MailerSend using the company's credentials.
 * - Otherwise, falls back to AWS SES with the existing fallback mechanism.
 */
export async function sendEmailRouted(
  params: SendEmailParams
): Promise<SendEmailResult> {
  const { companyId } = params;

  const settings = await getEmailProviderSettings(companyId);

  const useMailerSend =
    settings.provider === 'mailersend' &&
    !!settings.mailersendApiKey &&
    !!settings.mailersendFromEmail;

  console.log('[email-router] routing', {
    companyId,
    provider: settings.provider,
    useMailerSend,
    hasMailersendApiKey: !!settings.mailersendApiKey,
    hasMailersendFromEmail: !!settings.mailersendFromEmail,
    mailersendFromEmail: settings.mailersendFromEmail,
    to: params.to,
    subject: params.subject,
  });

  if (useMailerSend) {
    return sendEmailViaMailerSend({
      ...params,
      apiKey: settings.mailersendApiKey!,
      fromOverride: settings.mailersendFromEmail!,
      fromNameOverride: settings.mailersendFromName || undefined,
    });
  }

  return sendEmailWithFallback(params);
}
