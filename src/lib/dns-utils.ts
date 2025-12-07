/**
 * DNS Utilities
 *
 * Helper functions for generating and managing DNS records
 * for AWS SES email domain configuration.
 */

export interface DnsRecord {
  hostname: string;
  type: string;
  value: string;
  priority?: number;
}

/**
 * Generate DMARC record for a domain
 *
 * DMARC (Domain-based Message Authentication, Reporting & Conformance)
 * specifies how email servers should handle messages that fail
 * authentication checks.
 *
 * Policy: p=none (monitor only)
 * This is the safest option for initial setup and allows monitoring
 * without affecting email delivery.
 *
 * @param domain - The domain name (e.g., "example.com")
 * @returns DnsRecord object with DMARC configuration
 */
export function generateDmarcRecord(domain: string): DnsRecord {
  return {
    hostname: `_dmarc.${domain}`,
    type: 'TXT',
    value: 'v=DMARC1; p=none;'
  };
}

/**
 * Generate SPF record for AWS SES
 *
 * SPF (Sender Policy Framework) specifies which mail servers
 * are authorized to send email on behalf of your domain.
 *
 * @returns DnsRecord object with SPF configuration
 */
export function generateSpfRecord(): DnsRecord {
  return {
    hostname: '@',
    type: 'TXT',
    value: 'v=spf1 include:amazonses.com ~all'
  };
}
