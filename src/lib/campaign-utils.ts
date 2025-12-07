/**
 * Campaign Landing Page Utilities
 *
 * Helper functions for generating campaign landing page URLs
 * and formatting campaign-related data.
 */

/**
 * Generate a campaign landing page URL
 *
 * Company is automatically determined from the campaign ID, so it's not needed in the URL.
 * The company slug is only used for the optional vanity subdomain.
 *
 * @param companySlug - The company's slug identifier (optional, for vanity subdomain only)
 * @param campaignId - The campaign ID (e.g., "PEST26")
 * @param customerId - The customer's UUID
 * @param useVanityUrl - Whether to use vanity subdomain (default: true)
 * @returns The full campaign landing page URL
 *
 * @example
 * // Development (no subdomain support)
 * generateCampaignLandingUrl('northwest-exterminating', 'PEST26', 'uuid')
 * // Returns: http://localhost:3000/campaign/PEST26/uuid
 *
 * @example
 * // Staging with vanity subdomain (prettier for emails)
 * generateCampaignLandingUrl('northwest-exterminating', 'PEST26', 'uuid', true)
 * // Returns: https://northwest-exterminating.staging.pmpcentral.io/campaign/PEST26/uuid
 *
 * @example
 * // Staging without vanity subdomain (always works)
 * generateCampaignLandingUrl('northwest-exterminating', 'PEST26', 'uuid', false)
 * // Returns: https://staging.pmpcentral.io/campaign/PEST26/uuid
 */
export function generateCampaignLandingUrl(
  companySlug: string,
  campaignId: string,
  customerId: string,
  useVanityUrl: boolean = true
): string {
  const env = process.env.NEXT_PUBLIC_ENV || 'staging'; // 'staging' or 'production'

  if (process.env.NODE_ENV === 'development') {
    // Local development: no subdomain support, simple path
    return `http://localhost:3000/campaign/${campaignId}/${customerId}`;
  }

  if (useVanityUrl) {
    // Vanity URL: company.staging.pmpcentral.io/campaign/X/Y
    const domain = env === 'production' ? 'app.pmpcentral.io' : 'staging.pmpcentral.io';
    return `https://${companySlug}.${domain}/campaign/${campaignId}/${customerId}`;
  } else {
    // Non-vanity URL: staging.pmpcentral.io/campaign/X/Y
    const domain = env === 'production' ? 'app.pmpcentral.io' : 'staging.pmpcentral.io';
    return `https://${domain}/campaign/${campaignId}/${customerId}`;
  }
}

/**
 * Format a discount for display
 *
 * @param discount - The discount object from company_discounts table
 * @returns Formatted discount string (e.g., "15% OFF" or "$50 OFF")
 */
export function formatDiscount(discount: {
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
}): string {
  if (discount.discount_type === 'percentage') {
    return `${discount.discount_value}% OFF`;
  } else {
    return `$${discount.discount_value} OFF`;
  }
}
