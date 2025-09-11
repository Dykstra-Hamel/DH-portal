/**
 * Retell Agent Types and Interfaces
 */

export type AgentDirection = 'inbound' | 'outbound';
export type AgentType = 'calling' | 'sms' | 'web_agent';

export interface Agent {
  id: string;
  company_id: string;
  agent_name: string;
  agent_id: string; // Retell agent ID
  phone_number?: string;
  agent_direction: AgentDirection;
  agent_type: AgentType;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateAgentData {
  agent_name: string;
  agent_id: string;
  phone_number?: string;
  agent_direction: AgentDirection;
  agent_type: AgentType;
  is_active?: boolean;
}

export interface UpdateAgentData {
  agent_name?: string;
  agent_id?: string;
  phone_number?: string;
  agent_direction?: AgentDirection;
  agent_type?: AgentType;
  is_active?: boolean;
}

export interface AgentFilters {
  agent_direction?: AgentDirection;
  agent_type?: AgentType;
  is_active?: boolean;
}

export interface AgentLookupResult {
  agent?: Agent;
  company_id?: string;
  error?: string;
}

// Agent configuration for Retell API calls
export interface AgentConfig {
  apiKey: string;
  agentId: string;
  phoneNumber?: string;
  knowledgeBaseId?: string;
}

export interface AgentConfigResult {
  config?: AgentConfig;
  error?: string;
  missingSettings?: string[];
}

// Agent statistics and metrics
export interface AgentStats {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  average_duration: number;
  last_call_date?: string;
}

export interface AgentWithStats extends Agent {
  stats?: AgentStats;
}

// Form validation
export interface AgentFormErrors {
  agent_name?: string;
  agent_id?: string;
  phone_number?: string;
  agent_direction?: string;
  agent_type?: string;
}

// Agent display options
export const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  calling: 'Voice Calling',
  sms: 'SMS Messaging',
  web_agent: 'Web Chat'
};

export const AGENT_DIRECTION_LABELS: Record<AgentDirection, string> = {
  inbound: 'Inbound',
  outbound: 'Outbound'
};

// Agent validation rules
export const AGENT_VALIDATION = {
  agent_name: {
    required: true,
    minLength: 1,
    maxLength: 255
  },
  agent_id: {
    required: true,
    minLength: 1,
    maxLength: 255,
    pattern: /^[a-zA-Z0-9_-]+$/ // Alphanumeric, underscore, hyphen only
  },
  phone_number: {
    required: false,
    pattern: /^\+?[1-9]\d{1,14}$/ // E.164 format
  }
};