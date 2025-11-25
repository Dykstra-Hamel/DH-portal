/**
 * AWS SES Identity Management Library
 *
 * Manages email identities (domains and email addresses) for verification and DKIM configuration.
 * Handles domain verification and association with tenants.
 */

import {
  CreateEmailIdentityCommand,
  GetEmailIdentityCommand,
  DeleteEmailIdentityCommand,
  PutEmailIdentityDkimAttributesCommand,
  CreateTenantResourceAssociationCommand,
  DeleteTenantResourceAssociationCommand,
  ListEmailIdentitiesCommand,
} from '@aws-sdk/client-sesv2';
import { sesClient } from './client';
import { SesIdentityInfo, DkimToken } from '@/types/aws-ses';

/**
 * Create and verify an email identity (domain or email address)
 * Automatically enables Easy DKIM for domains
 *
 * @param identity - Domain name (e.g., "example.com") or email address
 * @returns Identity information including DKIM tokens for DNS configuration
 */
export async function createEmailIdentity(
  identity: string
): Promise<{
  success: boolean;
  data?: SesIdentityInfo;
  dkimTokens?: DkimToken[];
  error?: string;
}> {
  try {
    // Use Easy DKIM (AWS-managed keys) by not specifying DkimSigningAttributes
    const command = new CreateEmailIdentityCommand({
      EmailIdentity: identity,
    });

    const createResponse = await sesClient.send(command);

    // Extract DKIM tokens for DNS configuration
    const dkimTokens: DkimToken[] = (createResponse.DkimAttributes?.Tokens || []).map(
      (token) => ({
        name: `${token}._domainkey.${identity}`,
        value: `${token}.dkim.amazonses.com`,
        type: 'CNAME' as const,
      })
    );

    // Fetch the full identity details to get the ARN
    const identityResult = await getEmailIdentity(identity);

    if (!identityResult.success || !identityResult.data) {
      // Fallback if we can't get the full details
      return {
        success: true,
        data: {
          identityArn: '',
          identityName: identity,
          identityType: createResponse.IdentityType || 'DOMAIN',
          verifiedForSendingStatus: createResponse.VerifiedForSendingStatus || false,
          dkimAttributes: {
            signingEnabled: createResponse.DkimAttributes?.SigningEnabled || false,
            status: createResponse.DkimAttributes?.Status || 'PENDING',
            tokens: createResponse.DkimAttributes?.Tokens,
          },
        },
        dkimTokens,
      };
    }

    return {
      success: true,
      data: identityResult.data,
      dkimTokens: identityResult.dkimTokens || dkimTokens,
    };
  } catch (error) {
    console.error(`Error creating email identity ${identity}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create identity',
    };
  }
}

/**
 * Get email identity information and verification status
 *
 * @param identity - Domain name or email address
 * @returns Identity information or error
 */
export async function getEmailIdentity(
  identity: string
): Promise<{
  success: boolean;
  data?: SesIdentityInfo;
  dkimTokens?: DkimToken[];
  error?: string;
}> {
  try {
    const command = new GetEmailIdentityCommand({
      EmailIdentity: identity,
    });

    const response = await sesClient.send(command);

    // Extract DKIM tokens if available
    const dkimTokens: DkimToken[] = (response.DkimAttributes?.Tokens || []).map(
      (token) => ({
        name: `${token}._domainkey.${identity}`,
        value: `${token}.dkim.amazonses.com`,
        type: 'CNAME' as const,
      })
    );

    return {
      success: true,
      data: {
        identityArn: '',  // ARN not directly available in GetEmailIdentity response
        identityName: identity,
        identityType: response.IdentityType || 'DOMAIN',
        verifiedForSendingStatus: response.VerifiedForSendingStatus || false,
        dkimAttributes: {
          signingEnabled: response.DkimAttributes?.SigningEnabled || false,
          status: response.DkimAttributes?.Status || 'PENDING',
          tokens: response.DkimAttributes?.Tokens,
        },
      },
      dkimTokens,
    };
  } catch (error) {
    console.error(`Error getting email identity ${identity}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get identity',
    };
  }
}

/**
 * Get identity verification status
 *
 * @param identity - Domain name or email address
 * @returns Verification status object
 */
export async function getIdentityVerificationStatus(
  identity: string
): Promise<{
  success: boolean;
  isVerified?: boolean;
  dkimStatus?: string;
  error?: string;
}> {
  const result = await getEmailIdentity(identity);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  return {
    success: true,
    isVerified: result.data?.verifiedForSendingStatus || false,
    dkimStatus: result.data?.dkimAttributes?.status || 'PENDING',
  };
}

/**
 * Get DKIM tokens for DNS configuration
 *
 * @param domain - Domain name
 * @returns Array of DKIM CNAME records to add to DNS
 */
export async function getDkimTokens(
  domain: string
): Promise<{ success: boolean; data?: DkimToken[]; error?: string }> {
  const result = await getEmailIdentity(domain);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
    };
  }

  return {
    success: true,
    data: result.dkimTokens || [],
  };
}

/**
 * Associate an email identity with a tenant
 *
 * @param identity - Domain name or email address
 * @param tenantName - Tenant name (company-{uuid})
 * @param identityArn - ARN of the email identity (optional, will fetch if not provided)
 * @returns Success status or error
 */
export async function associateIdentityWithTenant(
  identity: string,
  tenantName: string,
  identityArn?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch identity ARN if not provided
    let arn = identityArn;
    if (!arn) {
      const identityResult = await getEmailIdentity(identity);
      if (!identityResult.success) {
        return {
          success: false,
          error: 'Failed to fetch identity ARN: ' + identityResult.error,
        };
      }
      arn = identityResult.data?.identityArn;
    }

    if (!arn) {
      return {
        success: false,
        error: 'Identity ARN not found',
      };
    }

    const command = new CreateTenantResourceAssociationCommand({
      TenantName: tenantName,
      ResourceArn: arn,
    });

    await sesClient.send(command);

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      `Error associating identity ${identity} with tenant ${tenantName}:`,
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to associate identity',
    };
  }
}

/**
 * Remove identity association from a tenant
 *
 * @param identity - Domain name or email address
 * @param tenantName - Tenant name
 * @param identityArn - ARN of the email identity (optional)
 * @returns Success status or error
 */
export async function disassociateIdentityFromTenant(
  identity: string,
  tenantName: string,
  identityArn?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch identity ARN if not provided
    let arn = identityArn;
    if (!arn) {
      const identityResult = await getEmailIdentity(identity);
      if (!identityResult.success) {
        return {
          success: false,
          error: 'Failed to fetch identity ARN: ' + identityResult.error,
        };
      }
      arn = identityResult.data?.identityArn;
    }

    if (!arn) {
      return {
        success: false,
        error: 'Identity ARN not found',
      };
    }

    const command = new DeleteTenantResourceAssociationCommand({
      TenantName: tenantName,
      ResourceArn: arn,
    });

    await sesClient.send(command);

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      `Error disassociating identity ${identity} from tenant ${tenantName}:`,
      error
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to disassociate identity',
    };
  }
}

/**
 * Delete an email identity
 * WARNING: This will remove the identity and all its configuration
 *
 * @param identity - Domain name or email address
 * @returns Success status or error
 */
export async function deleteEmailIdentity(
  identity: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteEmailIdentityCommand({
      EmailIdentity: identity,
    });

    await sesClient.send(command);

    return {
      success: true,
    };
  } catch (error) {
    console.error(`Error deleting email identity ${identity}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete identity',
    };
  }
}

/**
 * Enable or disable DKIM signing for an identity
 *
 * @param identity - Domain name or email address
 * @param enabled - Whether DKIM signing should be enabled
 * @returns Success status or error
 */
export async function updateDkimAttributes(
  identity: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new PutEmailIdentityDkimAttributesCommand({
      EmailIdentity: identity,
      SigningEnabled: enabled,
    });

    await sesClient.send(command);

    return {
      success: true,
    };
  } catch (error) {
    console.error(`Error updating DKIM attributes for ${identity}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update DKIM attributes',
    };
  }
}

/**
 * List all email identities in the account
 *
 * @param maxResults - Maximum number of results (default: 100)
 * @returns Array of identity names or error
 */
export async function listEmailIdentities(
  maxResults: number = 100
): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const command = new ListEmailIdentitiesCommand({
      PageSize: maxResults,
    });

    const response = await sesClient.send(command);

    const identities = (response.EmailIdentities || []).map(
      (identity) => identity.IdentityName || ''
    );

    return {
      success: true,
      data: identities,
    };
  } catch (error) {
    console.error('Error listing email identities:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list identities',
    };
  }
}

/**
 * Check if an identity exists
 *
 * @param identity - Domain name or email address
 * @returns True if identity exists, false otherwise
 */
export async function identityExists(identity: string): Promise<boolean> {
  const result = await getEmailIdentity(identity);
  return result.success;
}
