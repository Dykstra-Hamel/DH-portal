import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

const resend = new Resend(process.env.RESEND_API_KEY);

export interface DomainRecord {
  record: string;
  name: string;
  value: string;
  type: string;
  ttl?: string;
  priority?: string;
  status?: 'verified' | 'pending' | 'failed';
}

export interface DomainInfo {
  id: string;
  name: string;
  status: 'not_started' | 'pending' | 'verified' | 'failed' | 'temporary_failure';
  records: DomainRecord[];
  created_at: string;
  region?: string;
}

export interface CreateDomainRequest {
  name: string;
  region?: 'us-east-1' | 'eu-west-1' | 'sa-east-1' | 'ap-northeast-1';
  custom_return_path?: string;
}

/**
 * Create a new domain in Resend
 */
export async function createDomain(request: CreateDomainRequest): Promise<DomainInfo> {
  // Input validation
  if (!request.name || typeof request.name !== 'string') {
    throw new Error('Domain name is required');
  }
  
  if (request.name.length > 253) {
    throw new Error('Domain name is too long');
  }
  
  const validRegions = ['us-east-1', 'eu-west-1', 'sa-east-1', 'ap-northeast-1'];
  if (request.region && !validRegions.includes(request.region)) {
    throw new Error('Invalid region specified');
  }
  
  try {
    const response = await resend.domains.create({
      name: request.name,
      region: request.region || 'us-east-1',
      ...(request.custom_return_path && { custom_return_path: request.custom_return_path })
    });

    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to create domain');
    }

    return {
      id: response.data.id,
      name: response.data.name,
      status: response.data.status as any,
      records: response.data.records?.map(record => ({
        record: record.record,
        name: record.name,
        value: record.value,
        type: record.type,
        ttl: record.ttl,
        priority: record.priority?.toString(),
        status: record.status as any
      })) || [],
      created_at: response.data.created_at,
      region: response.data.region
    };
  } catch (error) {
    console.error('Error creating domain:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to create domain');
  }
}

/**
 * Get domain information including DNS records and verification status
 */
export async function getDomain(domainId: string): Promise<DomainInfo> {
  try {
    const response = await resend.domains.get(domainId);

    if (!response.data) {
      throw new Error(response.error?.message || 'Domain not found');
    }

    return {
      id: response.data.id,
      name: response.data.name,
      status: response.data.status as any,
      records: response.data.records?.map(record => ({
        record: record.record,
        name: record.name,
        value: record.value,
        type: record.type,
        ttl: record.ttl,
        priority: record.priority?.toString(),
        status: record.status as any
      })) || [],
      created_at: response.data.created_at,
      region: response.data.region
    };
  } catch (error) {
    console.error('Error getting domain:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get domain');
  }
}

/**
 * Verify a domain (trigger verification check)
 */
export async function verifyDomain(domainId: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await resend.domains.verify(domainId);

    if (response.error) {
      throw new Error(response.error.message);
    }

    return {
      success: true,
      message: 'Domain verification triggered successfully'
    };
  } catch (error) {
    console.error('Error verifying domain:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to verify domain'
    };
  }
}

/**
 * Update domain configuration
 */
export async function updateDomain(domainId: string, updates: Partial<CreateDomainRequest>): Promise<DomainInfo> {
  try {
    // Note: Resend API doesn't have an update method, so we need to handle this differently
    // For now, we'll just return the current domain info
    // In a real implementation, you might need to delete and recreate if significant changes are needed
    return await getDomain(domainId);
  } catch (error) {
    console.error('Error updating domain:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update domain');
  }
}

/**
 * Delete a domain from Resend
 */
export async function deleteDomain(domainId: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await resend.domains.remove(domainId);

    if (response.error) {
      throw new Error(response.error.message);
    }

    return {
      success: true,
      message: 'Domain deleted successfully'
    };
  } catch (error) {
    console.error('Error deleting domain:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to delete domain'
    };
  }
}

/**
 * List all domains
 */
export async function listDomains(): Promise<DomainInfo[]> {
  try {
    const response = await resend.domains.list();

    if (!response.data) {
      throw new Error(response.error?.message || 'Failed to list domains');
    }

    return response.data.data.map(domain => ({
      id: domain.id,
      name: domain.name,
      status: domain.status as any,
      records: [], // Records are not included in list response, use getDomain() for full details
      created_at: domain.created_at,
      region: domain.region
    }));
  } catch (error) {
    console.error('Error listing domains:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to list domains');
  }
}

/**
 * Generate email address for a domain
 */
export function generateEmailAddress(domain: string, prefix: string = 'noreply'): string {
  return `${prefix}@${domain}`;
}

/**
 * Check if domain is ready for sending emails
 */
export function isDomainReady(domainInfo: DomainInfo): boolean {
  return domainInfo.status === 'verified' && 
         domainInfo.records.every(record => record.status === 'verified');
}

/**
 * Get domain status display text
 */
export function getDomainStatusText(status: DomainInfo['status']): { text: string; color: string } {
  switch (status) {
    case 'verified':
      return { text: 'Verified', color: 'green' };
    case 'pending':
      return { text: 'Verification Pending', color: 'orange' };
    case 'not_started':
      return { text: 'Not Started', color: 'gray' };
    case 'failed':
      return { text: 'Verification Failed', color: 'red' };
    case 'temporary_failure':
      return { text: 'Temporary Failure', color: 'orange' };
    default:
      return { text: 'Unknown', color: 'gray' };
  }
}

/**
 * Get record status display text
 */
export function getRecordStatusText(status?: string): { text: string; color: string } {
  switch (status) {
    case 'verified':
      return { text: 'Verified', color: 'green' };
    case 'pending':
      return { text: 'Pending', color: 'orange' };
    case 'failed':
      return { text: 'Failed', color: 'red' };
    default:
      return { text: 'Not Checked', color: 'gray' };
  }
}