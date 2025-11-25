/**
 * AWS SES Configuration Set Management Library
 *
 * Manages configuration sets for email event tracking via SNS.
 * Each company gets a configuration set with event destinations for bounces, complaints, etc.
 */

import {
  CreateConfigurationSetCommand,
  GetConfigurationSetCommand,
  DeleteConfigurationSetCommand,
  CreateConfigurationSetEventDestinationCommand,
  CreateTenantResourceAssociationCommand,
  DeleteTenantResourceAssociationCommand,
  ListConfigurationSetsCommand,
  EventType,
} from '@aws-sdk/client-sesv2';
import { sesClient } from './client';
import { SesConfigurationSet } from '@/types/aws-ses';

/**
 * Generate a configuration set name from company ID
 * Format: company-{uuid}-config
 */
export function generateConfigSetName(companyId: string): string {
  return `company-${companyId}-config`;
}

/**
 * Create a configuration set for email event tracking
 *
 * @param companyId - UUID of the company
 * @returns Configuration set information or error
 */
export async function createConfigurationSet(
  companyId: string
): Promise<{ success: boolean; data?: SesConfigurationSet; error?: string }> {
  try {
    const configSetName = generateConfigSetName(companyId);

    const command = new CreateConfigurationSetCommand({
      ConfigurationSetName: configSetName,
      // TrackingOptions omitted - can be added later if custom tracking domain needed
      SendingOptions: {
        SendingEnabled: true,
      },
    });

    await sesClient.send(command);

    return {
      success: true,
      data: {
        name: configSetName,
      },
    };
  } catch (error) {
    console.error(`Error creating configuration set for company ${companyId}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create configuration set',
    };
  }
}

/**
 * Add SNS event destination to a configuration set
 *
 * @param configSetName - Name of the configuration set
 * @param eventDestinationName - Name for this event destination
 * @param snsTopicArn - ARN of the SNS topic to send events to
 * @param eventTypes - Array of event types to track (default: all)
 * @returns Success status or error
 */
export async function addSnsEventDestination(
  configSetName: string,
  eventDestinationName: string,
  snsTopicArn: string,
  eventTypes: EventType[] = [
    EventType.SEND,
    EventType.REJECT,
    EventType.BOUNCE,
    EventType.COMPLAINT,
    EventType.DELIVERY,
    EventType.OPEN,
    EventType.CLICK,
    EventType.RENDERING_FAILURE,
  ]
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new CreateConfigurationSetEventDestinationCommand({
      ConfigurationSetName: configSetName,
      EventDestinationName: eventDestinationName,
      EventDestination: {
        Enabled: true,
        MatchingEventTypes: eventTypes,
        SnsDestination: {
          TopicArn: snsTopicArn,
        },
      },
    });

    await sesClient.send(command);

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      `Error adding SNS event destination to config set ${configSetName}:`,
      error
    );
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add event destination',
    };
  }
}

/**
 * Create a configuration set with SNS event tracking
 * Combines creating the config set and adding event destination
 *
 * @param companyId - UUID of the company
 * @param snsTopicArn - ARN of the SNS topic (optional, can be added later)
 * @returns Configuration set information or error
 */
export async function createConfigurationSetWithEvents(
  companyId: string,
  snsTopicArn?: string
): Promise<{ success: boolean; data?: SesConfigurationSet; error?: string }> {
  // First, create the configuration set
  const createResult = await createConfigurationSet(companyId);

  if (!createResult.success || !createResult.data) {
    return createResult;
  }

  // If SNS topic ARN provided, add event destination
  if (snsTopicArn) {
    const eventResult = await addSnsEventDestination(
      createResult.data.name,
      'all-events',
      snsTopicArn
    );

    if (!eventResult.success) {
      return {
        success: false,
        error: `Config set created but failed to add events: ${eventResult.error}`,
      };
    }
  }

  return createResult;
}

/**
 * Get configuration set information
 *
 * @param configSetName - Name of the configuration set
 * @returns Configuration set information or error
 */
export async function getConfigurationSet(
  configSetName: string
): Promise<{ success: boolean; data?: SesConfigurationSet; error?: string }> {
  try {
    const command = new GetConfigurationSetCommand({
      ConfigurationSetName: configSetName,
    });

    const response = await sesClient.send(command);

    return {
      success: true,
      data: {
        name: response.ConfigurationSetName || configSetName,
      },
    };
  } catch (error) {
    console.error(`Error getting configuration set ${configSetName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get configuration set',
    };
  }
}

/**
 * Associate a configuration set with a tenant
 *
 * @param configSetName - Name of the configuration set
 * @param tenantName - Tenant name (company-{uuid})
 * @param configSetArn - ARN of the configuration set (optional)
 * @returns Success status or error
 */
export async function associateConfigSetWithTenant(
  configSetName: string,
  tenantName: string,
  configSetArn?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch config set ARN if not provided
    let arn = configSetArn;
    if (!arn) {
      const configSetResult = await getConfigurationSet(configSetName);
      if (!configSetResult.success) {
        return {
          success: false,
          error: 'Failed to fetch config set ARN: ' + configSetResult.error,
        };
      }
      arn = configSetResult.data?.arn;
    }

    if (!arn) {
      return {
        success: false,
        error: 'Configuration set ARN not found',
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
      `Error associating config set ${configSetName} with tenant ${tenantName}:`,
      error
    );
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to associate configuration set',
    };
  }
}

/**
 * Remove configuration set association from a tenant
 *
 * @param configSetName - Name of the configuration set
 * @param tenantName - Tenant name
 * @param configSetArn - ARN of the configuration set (optional)
 * @returns Success status or error
 */
export async function disassociateConfigSetFromTenant(
  configSetName: string,
  tenantName: string,
  configSetArn?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Fetch config set ARN if not provided
    let arn = configSetArn;
    if (!arn) {
      const configSetResult = await getConfigurationSet(configSetName);
      if (!configSetResult.success) {
        return {
          success: false,
          error: 'Failed to fetch config set ARN: ' + configSetResult.error,
        };
      }
      arn = configSetResult.data?.arn;
    }

    if (!arn) {
      return {
        success: false,
        error: 'Configuration set ARN not found',
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
      `Error disassociating config set ${configSetName} from tenant ${tenantName}:`,
      error
    );
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to disassociate configuration set',
    };
  }
}

/**
 * Delete a configuration set
 * WARNING: This will remove the configuration set and all event destinations
 *
 * @param configSetName - Name of the configuration set
 * @returns Success status or error
 */
export async function deleteConfigurationSet(
  configSetName: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = new DeleteConfigurationSetCommand({
      ConfigurationSetName: configSetName,
    });

    await sesClient.send(command);

    return {
      success: true,
    };
  } catch (error) {
    console.error(`Error deleting configuration set ${configSetName}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete configuration set',
    };
  }
}

/**
 * List all configuration sets in the account
 *
 * @param maxResults - Maximum number of results (default: 100)
 * @returns Array of configuration set names or error
 */
export async function listConfigurationSets(
  maxResults: number = 100
): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const command = new ListConfigurationSetsCommand({
      PageSize: maxResults,
    });

    const response = await sesClient.send(command);

    const configSets = response.ConfigurationSets || [];

    return {
      success: true,
      data: configSets,
    };
  } catch (error) {
    console.error('Error listing configuration sets:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list configuration sets',
    };
  }
}

/**
 * Check if a configuration set exists
 *
 * @param configSetName - Name of the configuration set
 * @returns True if configuration set exists, false otherwise
 */
export async function configSetExists(configSetName: string): Promise<boolean> {
  const result = await getConfigurationSet(configSetName);
  return result.success;
}
