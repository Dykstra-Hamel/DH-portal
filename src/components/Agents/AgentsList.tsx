'use client';

import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Agent, AGENT_TYPE_LABELS, AGENT_DIRECTION_LABELS } from '@/types/agent';
import styles from './AgentsList.module.scss';

interface AgentsListProps {
  companyId?: string; // Optional - for admin interface
  onEdit: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
  refreshTrigger?: number;
}

export default function AgentsList({ companyId, onEdit, onDelete, refreshTrigger }: AgentsListProps) {
  const { selectedCompany } = useCompany();
  
  // Use provided companyId or fall back to context
  const effectiveCompanyId = companyId || selectedCompany?.id;
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    type?: string;
    direction?: string;
    status?: string;
  }>({});

  useEffect(() => {
    if (effectiveCompanyId) {
      fetchAgents();
    }
  }, [effectiveCompanyId, refreshTrigger]);

  const fetchAgents = async () => {
    if (!effectiveCompanyId) return;

    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filter.type) queryParams.append('agent_type', filter.type);
      if (filter.direction) queryParams.append('agent_direction', filter.direction);
      if (filter.status !== undefined) queryParams.append('is_active', filter.status);

      const url = `/api/companies/${effectiveCompanyId}/agents${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to fetch agents');
      }

      const fetchedAgents = await response.json();
      setAgents(fetchedAgents);
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (agent: Agent) => {
    if (!window.confirm(`Are you sure you want to delete the agent "${agent.agent_name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/agents/${agent.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete agent');
      }

      onDelete(agent);
      fetchAgents(); // Refresh the list
    } catch (err) {
      console.error('Error deleting agent:', err);
      alert('Failed to delete agent. Please try again.');
    }
  };

  const filteredAgents = agents.filter(agent => {
    if (filter.type && agent.agent_type !== filter.type) return false;
    if (filter.direction && agent.agent_direction !== filter.direction) return false;
    if (filter.status !== undefined && agent.is_active !== (filter.status === 'true')) return false;
    return true;
  });

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading agents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <p>Error: {error}</p>
        <button onClick={fetchAgents} className={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.agentsList}>
      <div className={styles.header}>
        <h2>Agents</h2>
        <div className={styles.filters}>
          <select
            value={filter.type || ''}
            onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value || undefined }))}
            className={styles.filterSelect}
          >
            <option value="">All Types</option>
            <option value="calling">Voice Calling</option>
            <option value="sms">SMS Messaging</option>
            <option value="web_agent">Web Chat</option>
          </select>

          <select
            value={filter.direction || ''}
            onChange={(e) => setFilter(prev => ({ ...prev, direction: e.target.value || undefined }))}
            className={styles.filterSelect}
          >
            <option value="">All Directions</option>
            <option value="inbound">Inbound</option>
            <option value="outbound">Outbound</option>
          </select>

          <select
            value={filter.status || ''}
            onChange={(e) => setFilter(prev => ({ ...prev, status: e.target.value || undefined }))}
            className={styles.filterSelect}
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {filteredAgents.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No agents found matching the current filters.</p>
          <p>Create your first agent to get started with Retell integration.</p>
        </div>
      ) : (
        <div className={styles.agentsGrid}>
          {filteredAgents.map((agent) => (
            <div key={agent.id} className={`${styles.agentCard} ${!agent.is_active ? styles.inactive : ''}`}>
              <div className={styles.agentHeader}>
                <h3 className={styles.agentName}>{agent.agent_name}</h3>
                <div className={styles.agentStatus}>
                  <span className={`${styles.statusBadge} ${agent.is_active ? styles.active : styles.inactive}`}>
                    {agent.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className={styles.agentDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Type:</span>
                  <span className={styles.value}>{AGENT_TYPE_LABELS[agent.agent_type]}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Direction:</span>
                  <span className={styles.value}>{AGENT_DIRECTION_LABELS[agent.agent_direction]}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Agent ID:</span>
                  <span className={styles.value}>{agent.agent_id}</span>
                </div>
                {agent.phone_number && (
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Phone:</span>
                    <span className={styles.value}>{agent.phone_number}</span>
                  </div>
                )}
              </div>

              <div className={styles.agentActions}>
                <button
                  onClick={() => onEdit(agent)}
                  className={styles.editButton}
                  disabled={!agent.is_active}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(agent)}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}