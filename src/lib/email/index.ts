import { createAdminClient } from '@/lib/supabase/server-admin';

// MailerSend configuration
if (!process.env.MAILERSEND_API_TOKEN) {
  throw new Error('MAILERSEND_API_TOKEN environment variable is required');
}

export const MAILERSEND_API_TOKEN = process.env.MAILERSEND_API_TOKEN;
export const MAILERSEND_FALLBACK_EMAIL = 'noreply@pmpcentral.io';

/**
 * Get the from email address for a company
 * Returns company's verified custom domain if available, otherwise fallback domain
 *
 * @param companyId - The company ID to get email for
 * @returns Promise<string> - The from email address to use
 */
export async function getCompanyFromEmail(companyId: string): Promise<string> {
  if (!companyId) {
    return MAILERSEND_FALLBACK_EMAIL;
  }

  try {
    const supabase = createAdminClient();

    // Fetch company's email domain settings
    const { data: settings, error } = await supabase
      .from('company_settings')
      .select('setting_key, setting_value')
      .eq('company_id', companyId)
      .in('setting_key', ['email_domain', 'email_domain_status', 'email_domain_prefix']);

    if (error || !settings || settings.length === 0) {
      return MAILERSEND_FALLBACK_EMAIL;
    }

    // Convert array to object for easier access
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      settingsMap[s.setting_key] = s.setting_value;
    });

    const domain = settingsMap.email_domain;
    const status = settingsMap.email_domain_status;
    const prefix = settingsMap.email_domain_prefix || 'noreply';

    // Only use custom domain if it's verified
    if (domain && status === 'verified') {
      return `${prefix}@${domain}`;
    }

    // Fallback to default
    return MAILERSEND_FALLBACK_EMAIL;
  } catch (error) {
    console.error('Error fetching company email domain:', error);
    return MAILERSEND_FALLBACK_EMAIL;
  }
}

// Re-export all email services
export * from './project-notifications';
export * from './lead-notifications';
export * from './call-summary-notifications';
export * from './types';
