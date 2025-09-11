'use client';

import { useState } from 'react';
import { Agent } from '@/types/agent';
import AgentsList from './AgentsList';
import AgentForm from './AgentForm';
import styles from './AgentsManager.module.scss';

interface AgentsManagerProps {
  companyId?: string; // Optional - for admin interface
}

export default function AgentsManager({ companyId }: AgentsManagerProps = {}) {
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCreateNew = () => {
    setEditingAgent(null);
    setShowForm(true);
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setShowForm(true);
  };

  const handleDelete = (agent: Agent) => {
    // AgentsList handles the deletion, we just need to refresh
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSave = (agent: Agent) => {
    setShowForm(false);
    setEditingAgent(null);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAgent(null);
  };

  return (
    <div className={styles.agentsManager}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1>Agent Management</h1>
          <p className={styles.description}>
            Manage your Retell agents for voice calls, SMS, and web chat. 
            Create multiple agents for different purposes and customize their settings.
          </p>
        </div>
        <button onClick={handleCreateNew} className={styles.createButton}>
          + Create Agent
        </button>
      </div>

      <div className={styles.content}>
        <AgentsList
          companyId={companyId}
          onEdit={handleEdit}
          onDelete={handleDelete}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {showForm && (
        <AgentForm
          companyId={companyId}
          agent={editingAgent}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
}