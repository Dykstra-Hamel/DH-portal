/**
 * AWS SES Tenant Management Library
 *
 * Provides functions to manage SES tenants for multi-company email isolation.
 * Each company gets its own tenant for independent reputation management.
 */

import {
  CreateTenantCommand,
  GetTenantCommand,
  ListTenantsCommand,
  DeleteTenantCommand,
} from '@aws-sdk/client-sesv2';
import { sesClient } from './client';
import { SesTenantInfo } from '@/types/aws-ses';

/**
 * Slugify a string for use in AWS resource names
 * Converts to lowercase, replaces spaces/special chars with hyphens
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-') // Replace non-alphanumeric (except hyphens) with hyphens
    .replace(/-+/g, '-') // Replace multiple consecutive hyphens with single hyphen
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate a tenant name from company name and ID
 * Format: {slugified-company-name}-{short-id}
 * Example: northwest-exterminating-8da6
 */
export function generateTenantName(companyId: string, companyName?: string): string {
  if (!companyName) {
    // Fallback to old format if no company name provided
    return `company-${companyId}`;
  }

  const slug = slugify(companyName);
  const shortId = companyId.substring(0, 8); // First 8 chars of UUID for uniqueness

  return `${slug}-${shortId}`;
}

/**
 * Create a new SES tenant for a company
 *
 * @param companyId - UUID of the company
 * @param companyName - Name of the company (for tags)
 * @returns Tenant information or error
 */
export async function createTenant(
  companyId: string,
  companyName: string
): Promise<{ success: boolean; data?: SesTenantInfo; error?: string }> {
  try {
    const tenantName = generateTenantName(companyId, companyName);

    // Sanitize company name for AWS tag value (spaces not allowed)
    // AWS tag values must match: [a-zA-Z0-9/_\+=\.:@\-]*
    const sanitizedCompanyName = companyName.replace(/[^a-zA-Z0-9/_+=.:@-]/g, '-');

    const command = new CreateTenantCommand({
      TenantName: tenantName,
      Tags: [
        { Key: 'CompanyId', Value: companyId },
        { Key: 'CompanyName', Value: sanitizedCompanyName },
        { Key: 'ManagedBy', Value: 'dh-portal' },
      ],
    });

    const response = await sesClient.send(command);

    return {
      success: true,
      data: {
        tenantId: response.TenantId || '',
        tenantName: tenantName,
        tenantArn: response.TenantArn || '',
        sendingStatus: response.SendingStatus as SesTenantInfo['sendingStatus'] || 'ENABLED',
        createdTimestamp: response.CreatedTimestamp,
      },
    };
  } catch (error) {
    console.error('Error creating SES tenant:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create tenant',
    };
  }
}

/**
 * Get tenant information by tenant name
 *
 * @param tenantName - Name of the tenant (company-{uuid})
 * @returns Tenant information or error
 */
export async function getTenant(
  tenantName: string
): Promise<{ success: boolean; data?: SesTenantInfo; error?: string }> {
  try {
    const command = new GetTenantCommand({
      TenantName: tenantName,
    });

    const response = await sesClient.send(command);

    if (!response.Tenant) {
      return {
        success: false,
        error: 'Tenant not found in response',
      };
    }

    return {
      success: true,
      data: {
        tenantId: response.Tenant.TenantId || '',
        tenantName: response.Tenant.TenantName || tenantName,
        tenantArn: response.Tenant.TenantArn || '',
        sendingStatus: (response.Tenant.SendingStatus as SesTenantInfo['sendingStatus']) || 'ENABLED',
        createdTimestamp: response.Tenant.CreatedTimestamp,
      },
    };
  } catch (error) {
    console.error(`Error getting SES tenant ${tenantName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tenant',
    };
  }
}

/**
 * Get tenant by company ID
 * This function queries AWS to find the tenant by listing all tenants and matching by CompanyId tag
 *
 * @param companyId - UUID of the company
 * @returns Tenant information or error
 */
export async function getTenantByCompanyId(
  companyId: string
): Promise<{ success: boolean; data?: SesTenantInfo; error?: string }> {
  try {
    // List all tenants and find by CompanyId tag
    const listResult = await listTenants(100);

    if (!listResult.success || !listResult.data) {
      return {
        success: false,
        error: listResult.error || 'Failed to list tenants',
      };
    }

    // Note: AWS SES v2 ListTenants doesn't return tags, so we need to try getting each tenant
    // A better approach is to use the database to store tenant name mappings
    // For now, try the old naming convention as fallback
    const legacyTenantName = `company-${companyId}`;

    // First try to find tenant with legacy name
    const legacyResult = await getTenant(legacyTenantName);
    if (legacyResult.success) {
      return legacyResult;
    }

    // If not found, the tenant might not exist or uses new naming
    // In practice, tenant name should be retrieved from database (company_settings)
    return {
      success: false,
      error: `Tenant not found for company ${companyId}. Tenant name should be retrieved from database.`,
    };
  } catch (error) {
    console.error(`Error getting tenant for company ${companyId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get tenant',
    };
  }
}

/**
 * List all tenants in the AWS account
 *
 * @param maxResults - Maximum number of results to return (default: 100)
 * @returns Array of tenant information or error
 */
export async function listTenants(
  maxResults: number = 100
): Promise<{ success: boolean; data?: SesTenantInfo[]; error?: string }> {
  try {
    const command = new ListTenantsCommand({
      PageSize: maxResults,
    });

    const response = await sesClient.send(command);

    const tenants: SesTenantInfo[] = (response.Tenants || []).map((tenant) => ({
      tenantId: tenant.TenantId || '',
      tenantName: tenant.TenantName || '',
      tenantArn: tenant.TenantArn || '',
      sendingStatus: 'ENABLED' as SesTenantInfo['sendingStatus'], // ListTenants doesn't include SendingStatus
    }));

    return {
      success: true,
      data: tenants,
    };
  } catch (error) {
    console.error('Error listing SES tenants:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list tenants',
    };
  }
}

/**
 * Delete a tenant by tenant name
 * WARNING: This will remove all tenant configuration
 *
 * @param tenantName - Name of the tenant to delete
 * @returns Success status or error
 */
export async function deleteTenant(
  tenantName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteTenantCommand({
      TenantName: tenantName,
    });

    await sesClient.send(command);

    return {
      success: true,
    };
  } catch (error) {
    console.error(`Error deleting SES tenant ${tenantName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete tenant',
    };
  }
}

/**
 * Check if a tenant exists
 *
 * @param tenantName - Name of the tenant to check
 * @returns True if tenant exists, false otherwise
 */
export async function tenantExists(tenantName: string): Promise<boolean> {
  const result = await getTenant(tenantName);
  return result.success;
}
