import { createAdminClient } from '@/lib/supabase/server-admin';
import { Agent, AgentLookupResult, AgentFilters } from '@/types/agent';

/**
 * Find company ID by Retell agent ID
 * This is the primary function used by webhooks to determine which company a call belongs to
 */
export async function findCompanyByAgentId(agentId: string | undefined): Promise<string | null> {
  if (!agentId) {
    console.warn('findCompanyByAgentId: No agent ID provided');
    return null;
  }

  try {
    const supabase = createAdminClient();
    const { data: agent, error } = await supabase
      .from('agents')
      .select('company_id')
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn(`findCompanyByAgentId: No active agent found for agent ID: ${agentId}`);
        return null;
      }
      console.error('findCompanyByAgentId: Database error:', error);
      return null;
    }

    return agent.company_id;
  } catch (error) {
    console.error('findCompanyByAgentId: Unexpected error:', error);
    return null;
  }
}

/**
 * Find company ID and agent direction by Retell agent ID
 * Extended version that also returns the agent direction for determining call type
 */
export async function findCompanyAndDirectionByAgentId(agentId: string | undefined): Promise<{
  company_id: string | null;
  agent_direction: Agent['agent_direction'] | null;
}> {
  if (!agentId) {
    console.warn('findCompanyAndDirectionByAgentId: No agent ID provided');
    return { company_id: null, agent_direction: null };
  }

  try {
    const supabase = createAdminClient();
    const { data: agent, error } = await supabase
      .from('agents')
      .select('company_id, agent_direction')
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn(`findCompanyAndDirectionByAgentId: No active agent found for agent ID: ${agentId}`);
        return { company_id: null, agent_direction: null };
      }
      console.error('findCompanyAndDirectionByAgentId: Database error:', error);
      return { company_id: null, agent_direction: null };
    }

    return {
      company_id: agent.company_id,
      agent_direction: agent.agent_direction
    };
  } catch (error) {
    console.error('findCompanyAndDirectionByAgentId: Unexpected error:', error);
    return { company_id: null, agent_direction: null };
  }
}

/**
 * Get full agent details by Retell agent ID
 * Returns both agent and company information
 */
export async function getAgentByAgentId(agentId: string): Promise<AgentLookupResult> {
  if (!agentId) {
    return { error: 'No agent ID provided' };
  }

  try {
    const supabase = createAdminClient();
    const { data: agent, error } = await supabase
      .from('agents')
      .select('*')
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { error: 'Agent not found or inactive' };
      }
      console.error('getAgentByAgentId: Database error:', error);
      return { error: 'Database error occurred' };
    }

    return { 
      agent, 
      company_id: agent.company_id 
    };
  } catch (error) {
    console.error('getAgentByAgentId: Unexpected error:', error);
    return { error: 'Unexpected error occurred' };
  }
}

/**
 * Get all agents for a company with optional filtering
 */
export async function getCompanyAgents(companyId: string, filters?: AgentFilters): Promise<Agent[]> {
  if (!companyId) {
    console.warn('getCompanyAgents: No company ID provided');
    return [];
  }

  try {
    const supabase = createAdminClient();
    let query = supabase
      .from('agents')
      .select('*')
      .eq('company_id', companyId);

    // Apply filters
    if (filters?.agent_direction) {
      query = query.eq('agent_direction', filters.agent_direction);
    }
    if (filters?.agent_type) {
      query = query.eq('agent_type', filters.agent_type);
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    // Default to only active agents unless explicitly requested otherwise
    if (filters?.is_active === undefined) {
      query = query.eq('is_active', true);
    }

    query = query.order('created_at', { ascending: true });

    const { data: agents, error } = await query;

    if (error) {
      console.error('getCompanyAgents: Database error:', error);
      return [];
    }

    return agents || [];
  } catch (error) {
    console.error('getCompanyAgents: Unexpected error:', error);
    return [];
  }
}

/**
 * Get the first available agent for a company by type and direction
 * Useful for automations and systems that just need "an agent" of a specific type
 */
export async function getDefaultAgent(
  companyId: string, 
  agentType: Agent['agent_type'], 
  agentDirection: Agent['agent_direction']
): Promise<Agent | null> {
  const agents = await getCompanyAgents(companyId, {
    agent_type: agentType,
    agent_direction: agentDirection,
    is_active: true
  });

  return agents.length > 0 ? agents[0] : null;
}

/**
 * Check if a company has any agents of a specific type
 */
export async function hasAgentType(
  companyId: string, 
  agentType: Agent['agent_type'], 
  agentDirection?: Agent['agent_direction']
): Promise<boolean> {
  const agents = await getCompanyAgents(companyId, {
    agent_type: agentType,
    agent_direction: agentDirection,
    is_active: true
  });

  return agents.length > 0;
}

/**
 * Validate that an agent ID belongs to a specific company
 * Useful for security checks in APIs
 */
export async function validateAgentCompanyAccess(agentId: string, expectedCompanyId: string): Promise<boolean> {
  const result = await getAgentByAgentId(agentId);
  return result.agent?.company_id === expectedCompanyId;
}

/**
 * Get agents with phone numbers for calling operations
 */
export async function getCallingAgents(companyId: string, direction?: Agent['agent_direction']): Promise<Agent[]> {
  const agents = await getCompanyAgents(companyId, {
    agent_type: 'calling',
    agent_direction: direction,
    is_active: true
  });

  // Filter to only agents with phone numbers
  return agents.filter(agent => agent.phone_number && agent.phone_number.trim() !== '');
}

/**
 * Get agents for SMS operations
 */
export async function getSMSAgents(companyId: string, direction?: Agent['agent_direction']): Promise<Agent[]> {
  const agents = await getCompanyAgents(companyId, {
    agent_type: 'sms',
    agent_direction: direction,
    is_active: true
  });

  // Filter to only agents with phone numbers
  return agents.filter(agent => agent.phone_number && agent.phone_number.trim() !== '');
}