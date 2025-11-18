import { MailerSend, Domain } from 'mailersend';

if (!process.env.MAILERSEND_API_TOKEN) {
  throw new Error('MAILERSEND_API_TOKEN environment variable is required');
}

const mailersend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_TOKEN,
});

export interface DomainRecord {
  hostname: string;
  type: string;
  value: string;
  priority?: number;
}

export interface DomainInfo {
  id: string;
  name: string;
  dkim: boolean;
  spf: boolean;
  tracking: boolean;
  is_verified: boolean;
  is_cname_verified: boolean;
  is_dns_active: boolean;
  is_cname_active: boolean;
  is_tracking_allowed: boolean;
  has_not_queued_messages: boolean;
  not_queued_messages_count: number;
  domain_settings: {
    send_paused: boolean;
    track_clicks: boolean;
    track_opens: boolean;
    track_unsubscribe: boolean;
    track_unsubscribe_html: string;
    track_unsubscribe_plain: string;
    track_content: boolean;
    custom_tracking_enabled: boolean;
    custom_tracking_subdomain: string;
  };
  created_at: string;
  updated_at: string;
  records?: DomainRecord[];
}

export interface CreateDomainRequest {
  name: string;
  return_path_subdomain?: string;
  custom_tracking_subdomain?: string;
  inbound_routing_subdomain?: string;
}

/**
 * Create a new domain in MailerSend
 */
export async function createDomain(
  domainName: string,
  options?: {
    return_path_subdomain?: string;
    custom_tracking_subdomain?: string;
    inbound_routing_subdomain?: string;
  }
): Promise<DomainInfo> {
  // Input validation
  if (!domainName || typeof domainName !== 'string') {
    throw new Error('Domain name is required');
  }

  if (domainName.length > 253) {
    throw new Error('Domain name is too long');
  }

  try {
    // Use HTTP request directly instead of SDK classes
    const response = await fetch('https://api.mailersend.com/v1/domains', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MAILERSEND_API_TOKEN}`
      },
      body: JSON.stringify({
        name: domainName,
        return_path_subdomain: options?.return_path_subdomain,
        custom_tracking_subdomain: options?.custom_tracking_subdomain,
        inbound_routing_subdomain: options?.inbound_routing_subdomain
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to create domain');
    }

    const result = await response.json();

    if (!result.data) {
      throw new Error('Invalid response from MailerSend API');
    }

    return {
      id: result.data.id,
      name: result.data.name,
      dkim: result.data.dkim,
      spf: result.data.spf,
      tracking: result.data.tracking,
      is_verified: result.data.is_verified,
      is_cname_verified: result.data.is_cname_verified,
      is_dns_active: result.data.is_dns_active,
      is_cname_active: result.data.is_cname_active,
      is_tracking_allowed: result.data.is_tracking_allowed,
      has_not_queued_messages: result.data.has_not_queued_messages,
      not_queued_messages_count: result.data.not_queued_messages_count,
      domain_settings: result.data.domain_settings,
      created_at: result.data.created_at,
      updated_at: result.data.updated_at,
    };
  } catch (error: any) {
    console.error('Error creating domain:', error);
    throw new Error(
      error?.message || 'Failed to create domain in MailerSend'
    );
  }
}

/**
 * Get domain information including DNS records and verification status
 */
export async function getDomain(domainId: string): Promise<DomainInfo> {
  try {
    const response = await mailersend.email.domain.single(domainId);

    if (!response.body?.data) {
      throw new Error('Invalid response from MailerSend API');
    }

    return {
      id: response.body.data.id,
      name: response.body.data.name,
      dkim: response.body.data.dkim,
      spf: response.body.data.spf,
      tracking: response.body.data.tracking,
      is_verified: response.body.data.is_verified,
      is_cname_verified: response.body.data.is_cname_verified,
      is_dns_active: response.body.data.is_dns_active,
      is_cname_active: response.body.data.is_cname_active,
      is_tracking_allowed: response.body.data.is_tracking_allowed,
      has_not_queued_messages: response.body.data.has_not_queued_messages,
      not_queued_messages_count: response.body.data.not_queued_messages_count,
      domain_settings: response.body.data.domain_settings,
      created_at: response.body.data.created_at,
      updated_at: response.body.data.updated_at,
    };
  } catch (error: any) {
    console.error('Error getting domain:', error);
    throw new Error(error?.message || 'Failed to get domain from MailerSend');
  }
}

/**
 * Get DNS records for a domain
 */
export async function getDomainRecords(
  domainId: string
): Promise<DomainRecord[]> {
  try {
    const response = await mailersend.email.domain.dns(domainId);

    const records: DomainRecord[] = [];

    // Parse DNS records from response
    if (response.body?.data) {
      const dnsData = response.body.data;

      // SPF record
      if (dnsData.spf) {
        records.push({
          hostname: dnsData.spf.hostname,
          type: dnsData.spf.type,
          value: dnsData.spf.value,
        });
      }

      // DKIM record
      if (dnsData.dkim) {
        records.push({
          hostname: dnsData.dkim.hostname,
          type: dnsData.dkim.type,
          value: dnsData.dkim.value,
        });
      }

      // Tracking record (CNAME)
      if (dnsData.cname) {
        records.push({
          hostname: dnsData.cname.hostname,
          type: dnsData.cname.type,
          value: dnsData.cname.value,
        });
      }

      // Return path (MX)
      if (dnsData.mx) {
        records.push({
          hostname: dnsData.mx.hostname,
          type: dnsData.mx.type,
          value: dnsData.mx.value,
          priority: dnsData.mx.priority,
        });
      }

      // Custom tracking
      if (dnsData.custom_tracking_cname) {
        records.push({
          hostname: dnsData.custom_tracking_cname.hostname,
          type: dnsData.custom_tracking_cname.type,
          value: dnsData.custom_tracking_cname.value,
        });
      }

      // Inbound routing
      if (dnsData.inbound_routing_mx) {
        records.push({
          hostname: dnsData.inbound_routing_mx.hostname,
          type: dnsData.inbound_routing_mx.type,
          value: dnsData.inbound_routing_mx.value,
          priority: dnsData.inbound_routing_mx.priority,
        });
      }
    }

    return records;
  } catch (error: any) {
    console.error('Error getting domain DNS records:', error);
    throw new Error(
      error?.message || 'Failed to get DNS records from MailerSend'
    );
  }
}

/**
 * Verify a domain (trigger verification check)
 * MailerSend automatically checks DNS records, but we can fetch the latest status
 */
export async function verifyDomain(
  domainId: string
): Promise<{ success: boolean; message: string; domain?: DomainInfo }> {
  try {
    // Get the latest domain status to check verification
    const domain = await getDomain(domainId);

    if (domain.is_verified) {
      return {
        success: true,
        message: 'Domain is verified and ready to send emails',
        domain,
      };
    } else {
      return {
        success: false,
        message:
          'Domain is not yet verified. Please ensure all DNS records are properly configured.',
        domain,
      };
    }
  } catch (error: any) {
    console.error('Error verifying domain:', error);
    return {
      success: false,
      message: error?.message || 'Failed to verify domain',
    };
  }
}

/**
 * Get domain recipients verification settings
 */
export async function getDomainRecipients(domainId: string): Promise<any> {
  try {
    const response = await mailersend.email.domain.recipients(domainId);

    if (!response.body?.data) {
      throw new Error('Invalid response from MailerSend API');
    }

    return response.body.data;
  } catch (error: any) {
    console.error('Error getting domain recipients:', error);
    throw new Error(
      error?.message || 'Failed to get domain recipients from MailerSend'
    );
  }
}

/**
 * Update domain settings
 */
export async function updateDomainSettings(
  domainId: string,
  settings: {
    send_paused?: boolean;
    track_clicks?: boolean;
    track_opens?: boolean;
    track_unsubscribe?: boolean;
    track_content?: boolean;
    custom_tracking_enabled?: boolean;
    custom_tracking_subdomain?: string;
  }
): Promise<DomainInfo> {
  try {
    // Use HTTP request directly instead of SDK classes
    const response = await fetch(`https://api.mailersend.com/v1/domains/${domainId}/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.MAILERSEND_API_TOKEN}`
      },
      body: JSON.stringify({
        send_paused: settings.send_paused,
        track_clicks: settings.track_clicks,
        track_opens: settings.track_opens,
        track_unsubscribe: settings.track_unsubscribe,
        track_content: settings.track_content,
        custom_tracking_enabled: settings.custom_tracking_enabled,
        custom_tracking_subdomain: settings.custom_tracking_subdomain
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update domain settings');
    }

    // Return updated domain info
    return await getDomain(domainId);
  } catch (error: any) {
    console.error('Error updating domain settings:', error);
    throw new Error(
      error?.message || 'Failed to update domain settings in MailerSend'
    );
  }
}

/**
 * Delete a domain from MailerSend
 */
export async function deleteDomain(
  domainId: string
): Promise<{ success: boolean; message: string }> {
  try {
    await mailersend.email.domain.delete(domainId);

    return {
      success: true,
      message: 'Domain deleted successfully',
    };
  } catch (error: any) {
    console.error('Error deleting domain:', error);
    return {
      success: false,
      message: error?.message || 'Failed to delete domain',
    };
  }
}

/**
 * List all domains
 */
export async function listDomains(): Promise<DomainInfo[]> {
  try {
    const response = await mailersend.email.domain.list();

    if (!response.body?.data) {
      throw new Error('Invalid response from MailerSend API');
    }

    return response.body.data.map((domain: any) => ({
      id: domain.id,
      name: domain.name,
      dkim: domain.dkim,
      spf: domain.spf,
      tracking: domain.tracking,
      is_verified: domain.is_verified,
      is_cname_verified: domain.is_cname_verified,
      is_dns_active: domain.is_dns_active,
      is_cname_active: domain.is_cname_active,
      is_tracking_allowed: domain.is_tracking_allowed,
      has_not_queued_messages: domain.has_not_queued_messages,
      not_queued_messages_count: domain.not_queued_messages_count,
      domain_settings: domain.domain_settings,
      created_at: domain.created_at,
      updated_at: domain.updated_at,
    }));
  } catch (error: any) {
    console.error('Error listing domains:', error);
    throw new Error(error?.message || 'Failed to list domains from MailerSend');
  }
}

/**
 * Generate email address for a domain
 */
export function generateEmailAddress(
  domain: string,
  prefix: string = 'noreply'
): string {
  return `${prefix}@${domain}`;
}

/**
 * Check if domain is ready for sending emails
 */
export function isDomainReady(domainInfo: DomainInfo): boolean {
  return (
    domainInfo.is_verified &&
    domainInfo.is_dns_active &&
    !domainInfo.domain_settings.send_paused
  );
}

/**
 * Get domain status display text
 */
export function getDomainStatusText(
  domainInfo: DomainInfo
): { text: string; color: string } {
  if (domainInfo.is_verified) {
    return { text: 'Verified', color: 'green' };
  } else if (domainInfo.is_dns_active) {
    return { text: 'DNS Active - Pending Verification', color: 'orange' };
  } else {
    return { text: 'Not Verified', color: 'gray' };
  }
}

/**
 * Get DNS record type display name
 */
export function getRecordTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    TXT: 'TXT Record (SPF/DKIM)',
    CNAME: 'CNAME Record (Tracking)',
    MX: 'MX Record (Return Path)',
  };
  return labels[type] || type;
}

/**
 * Format DNS record for display
 */
export function formatDnsRecordForDisplay(record: DomainRecord): {
  label: string;
  hostname: string;
  type: string;
  value: string;
  priority?: string;
} {
  return {
    label: getRecordTypeLabel(record.type),
    hostname: record.hostname,
    type: record.type,
    value: record.value,
    priority: record.priority?.toString(),
  };
}
