import { createAdminClient } from '@/lib/supabase/server-admin';
import { getCompanyAgents, getDefaultAgent } from '@/lib/agent-utils';
import { Agent, AgentConfig, AgentConfigResult } from '@/types/agent';

/**
 * NEW MULTI-AGENT CONFIGURATION FUNCTIONS
 * These functions work with the new agents table system
 */

/**
 * Gets all agents for a company with their configuration data
 */
export async function getCompanyAgentConfigs(
  companyId: string, 
  agentType?: 'calling' | 'sms' | 'web_agent',
  agentDirection?: 'inbound' | 'outbound'
): Promise<{ agents: Agent[]; apiKey?: string; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Get all agents matching the criteria
    const agents = await getCompanyAgents(companyId, {
      agent_type: agentType,
      agent_direction: agentDirection,
      is_active: true
    });

    if (agents.length === 0) {
      return {
        agents: [],
        error: `No ${agentDirection || ''} ${agentType || ''} agents found for company`
      };
    }

    // Get the Retell API key from company settings
    const { data: apiKeySetting } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'retell_api_key')
      .single();

    if (!apiKeySetting?.setting_value) {
      return {
        agents,
        error: 'Retell API key not configured for company'
      };
    }

    return {
      agents,
      apiKey: apiKeySetting.setting_value
    };
  } catch (error) {
    console.error('Error fetching company agent configurations:', error);
    return {
      agents: [],
      error: 'Failed to load agent configurations'
    };
  }
}

/**
 * Gets a specific agent configuration by agent ID
 */
export async function getAgentConfig(
  companyId: string,
  agentId: string
): Promise<AgentConfigResult> {
  try {
    const supabase = createAdminClient();

    // Get the specific agent
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('*')
      .eq('company_id', companyId)
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .single();

    if (agentError || !agent) {
      return {
        error: 'Agent not found or inactive'
      };
    }

    // Get the Retell API key
    const { data: apiKeySetting } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'retell_api_key')
      .single();

    if (!apiKeySetting?.setting_value) {
      return {
        error: 'Retell API key not configured',
        missingSettings: ['retell_api_key']
      };
    }

    const config: AgentConfig = {
      apiKey: apiKeySetting.setting_value,
      agentId: agent.agent_id,
      phoneNumber: agent.phone_number || undefined
    };

    // Get knowledge base ID from company settings if available
    const { data: knowledgeBaseSetting } = await supabase
      .from('company_settings')
      .select('setting_value')
      .eq('company_id', companyId)
      .eq('setting_key', 'retell_knowledge_base_id')
      .single();

    if (knowledgeBaseSetting?.setting_value) {
      config.knowledgeBaseId = knowledgeBaseSetting.setting_value;
    }

    return { config };
  } catch (error) {
    console.error('Error fetching agent configuration:', error);
    return {
      error: 'Failed to load agent configuration'
    };
  }
}

/**
 * Gets the default agent configuration for a specific type and direction
 */
export async function getDefaultAgentConfig(
  companyId: string,
  agentType: 'calling' | 'sms' | 'web_agent',
  agentDirection: 'inbound' | 'outbound'
): Promise<AgentConfigResult> {
  try {
    const agent = await getDefaultAgent(companyId, agentType, agentDirection);
    
    if (!agent) {
      return {
        error: `No ${agentDirection} ${agentType} agent found for company`,
        missingSettings: [`${agentDirection}_${agentType}_agent`]
      };
    }

    return await getAgentConfig(companyId, agent.agent_id);
  } catch (error) {
    console.error('Error fetching default agent configuration:', error);
    return {
      error: 'Failed to load default agent configuration'
    };
  }
}

/**
 * LEGACY COMPATIBILITY FUNCTIONS
 * These maintain backward compatibility with existing code
 */

export interface RetellConfig {
  apiKey: string;
  agentId: string;
  phoneNumber: string;
  knowledgeBaseId?: string;
}

export interface RetellConfigResult {
  config?: RetellConfig;
  error?: string;
  missingSettings?: string[];
}

/**
 * Legacy function - gets first available agent (for backward compatibility)
 * @deprecated Use getDefaultAgentConfig instead
 */
export async function getCompanyRetellConfig(companyId: string): Promise<RetellConfigResult> {
  const result = await getDefaultAgentConfig(companyId, 'calling', 'inbound');
  
  if (result.error || !result.config) {
    return {
      error: result.error || 'No configuration found',
      missingSettings: result.missingSettings
    };
  }

  // Convert to legacy format
  return {
    config: {
      apiKey: result.config.apiKey,
      agentId: result.config.agentId,
      phoneNumber: result.config.phoneNumber || '',
      knowledgeBaseId: result.config.knowledgeBaseId
    }
  };
}

/**
 * Legacy function - gets outbound calling agent
 * @deprecated Use getDefaultAgentConfig instead
 */
export async function getCompanyOutboundRetellConfig(companyId: string): Promise<RetellConfigResult> {
  const result = await getDefaultAgentConfig(companyId, 'calling', 'outbound');
  
  if (result.error || !result.config) {
    return {
      error: result.error || 'No outbound configuration found',
      missingSettings: result.missingSettings
    };
  }

  return {
    config: {
      apiKey: result.config.apiKey,
      agentId: result.config.agentId,
      phoneNumber: result.config.phoneNumber || '',
      knowledgeBaseId: result.config.knowledgeBaseId
    }
  };
}

/**
 * Legacy function - gets inbound calling agent
 * @deprecated Use getDefaultAgentConfig instead
 */
export async function getCompanyInboundRetellConfig(companyId: string): Promise<RetellConfigResult> {
  const result = await getDefaultAgentConfig(companyId, 'calling', 'inbound');
  
  if (result.error || !result.config) {
    return {
      error: result.error || 'No inbound configuration found',
      missingSettings: result.missingSettings
    };
  }

  return {
    config: {
      apiKey: result.config.apiKey,
      agentId: result.config.agentId,
      phoneNumber: result.config.phoneNumber || '',
      knowledgeBaseId: result.config.knowledgeBaseId
    }
  };
}

/**
 * Legacy function - gets inbound SMS agent
 * @deprecated Use getDefaultAgentConfig instead
 */
export async function getCompanyInboundSMSRetellConfig(companyId: string): Promise<RetellConfigResult> {
  const result = await getDefaultAgentConfig(companyId, 'sms', 'inbound');
  
  if (result.error || !result.config) {
    return {
      error: result.error || 'No inbound SMS configuration found',
      missingSettings: result.missingSettings
    };
  }

  return {
    config: {
      apiKey: result.config.apiKey,
      agentId: result.config.agentId,
      phoneNumber: result.config.phoneNumber || '',
      knowledgeBaseId: result.config.knowledgeBaseId
    }
  };
}

/**
 * Legacy function - gets outbound SMS agent
 * @deprecated Use getDefaultAgentConfig instead
 */
export async function getCompanyOutboundSMSRetellConfig(companyId: string): Promise<RetellConfigResult> {
  const result = await getDefaultAgentConfig(companyId, 'sms', 'outbound');
  
  if (result.error || !result.config) {
    return {
      error: result.error || 'No outbound SMS configuration found',
      missingSettings: result.missingSettings
    };
  }

  return {
    config: {
      apiKey: result.config.apiKey,
      agentId: result.config.agentId,
      phoneNumber: result.config.phoneNumber || '',
      knowledgeBaseId: result.config.knowledgeBaseId
    }
  };
}

/**
 * Validates if required Retell settings are configured for a company
 */
export async function validateRetellConfig(companyId: string): Promise<{
  isValid: boolean;
  error?: string;
  missingSettings?: string[];
}> {
  const result = await getCompanyRetellConfig(companyId);
  
  if (result.error) {
    return {
      isValid: false,
      error: result.error,
      missingSettings: result.missingSettings
    };
  }

  return { isValid: true };
}

/**
 * Logs detailed error messages for Retell configuration issues
 */
export function logRetellConfigError(companyId: string, error: string, missingSettings?: string[]) {
  const errorMessage = `Retell Configuration Error for Company ${companyId}: ${error}`;
  
  if (missingSettings && missingSettings.length > 0) {
    console.error(errorMessage, {
      missingSettings,
      requiredAction: 'Configure agents in Agent Management or check API key in Company Settings'
    });
  } else {
    console.error(errorMessage);
  }
}