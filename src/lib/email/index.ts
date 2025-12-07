import { createAdminClient } from '@/lib/supabase/server-admin';
import { isSESConfigured } from '@/lib/aws-ses/client';

// AWS SES configuration check
if (!isSESConfigured()) {
  console.warn('AWS SES not fully configured. Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables.');
}

// Fallback email address for companies without custom domains
export const FALLBACK_FROM_EMAIL = 'noreply@pmpcentral.io';

/**
 * Get the from email address for a company
 * Returns company's verified custom domain if available, otherwise fallback domain
 *
 * @param companyId - The company ID to get email for
 * @returns Promise<string> - The from email address to use
 */
export async function getCompanyFromEmail(companyId: string): Promise<string> {
  if (!companyId) {
    return FALLBACK_FROM_EMAIL;
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
      return FALLBACK_FROM_EMAIL;
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
    return FALLBACK_FROM_EMAIL;
  } catch (error) {
    console.error('Error fetching company email domain:', error);
    return FALLBACK_FROM_EMAIL;
  }
}

/**
 * Get the AWS SES tenant name for a company from database
 * Tenant names are now based on company name, so must be retrieved from storage
 *
 * @param companyId - The company ID
 * @returns Promise<string> - The tenant name from database
 */
export async function getCompanyTenantName(companyId: string): Promise<string> {
  const supabase = createAdminClient();

  // Get tenant name from company_settings
  const { data, error } = await supabase
    .from('company_settings')
    .select('setting_value')
    .eq('company_id', companyId)
    .eq('setting_key', 'aws_ses_tenant_name')
    .single();

  if (error || !data) {
    // Fallback to legacy format if not found
    console.warn(`Tenant name not found for company ${companyId}, using fallback format`);
    return `company-${companyId}`;
  }

  return data.setting_value;
}

/**
 * Get company name for email from address
 *
 * @param companyId - The company ID
 * @returns Promise<string> - The company name or default
 */
export async function getCompanyName(companyId: string): Promise<string> {
  if (!companyId) {
    return 'DH Portal';
  }

  try {
    const supabase = createAdminClient();

    const { data: company, error } = await supabase
      .from('companies')
      .select('name')
      .eq('id', companyId)
      .single();

    if (error || !company) {
      return 'DH Portal';
    }

    return company.name;
  } catch (error) {
    console.error('Error fetching company name:', error);
    return 'DH Portal';
  }
}

// Re-export all email services
export * from './project-notifications';
export * from './lead-notifications';
export * from './call-summary-notifications';
export * from './types';
