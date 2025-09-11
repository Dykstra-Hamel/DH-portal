'use client';

import { useState, useEffect } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { Agent, CreateAgentData, UpdateAgentData, AGENT_VALIDATION } from '@/types/agent';
import styles from './AgentForm.module.scss';

interface AgentFormProps {
  companyId?: string; // Optional - for admin interface
  agent?: Agent | null;
  onSave: (agent: Agent) => void;
  onCancel: () => void;
}

export default function AgentForm({ companyId, agent, onSave, onCancel }: AgentFormProps) {
  const { selectedCompany } = useCompany();
  
  // Use provided companyId or fall back to context
  const effectiveCompanyId = companyId || selectedCompany?.id;
  const [formData, setFormData] = useState({
    agent_name: '',
    agent_id: '',
    phone_number: '',
    agent_direction: 'inbound' as 'inbound' | 'outbound',
    agent_type: 'calling' as 'calling' | 'sms' | 'web_agent',
    is_active: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (agent) {
      setFormData({
        agent_name: agent.agent_name,
        agent_id: agent.agent_id,
        phone_number: agent.phone_number || '',
        agent_direction: agent.agent_direction,
        agent_type: agent.agent_type,
        is_active: agent.is_active,
      });
    }
  }, [agent]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Agent name validation
    if (!formData.agent_name.trim()) {
      newErrors.agent_name = 'Agent name is required';
    } else if (formData.agent_name.trim().length > AGENT_VALIDATION.agent_name.maxLength) {
      newErrors.agent_name = `Agent name must be less than ${AGENT_VALIDATION.agent_name.maxLength} characters`;
    }

    // Agent ID validation
    if (!formData.agent_id.trim()) {
      newErrors.agent_id = 'Retell Agent ID is required';
    } else if (!AGENT_VALIDATION.agent_id.pattern.test(formData.agent_id.trim())) {
      newErrors.agent_id = 'Agent ID can only contain letters, numbers, underscores, and hyphens';
    } else if (formData.agent_id.trim().length > AGENT_VALIDATION.agent_id.maxLength) {
      newErrors.agent_id = `Agent ID must be less than ${AGENT_VALIDATION.agent_id.maxLength} characters`;
    }

    // Phone number validation (optional)
    if (formData.phone_number.trim() && !AGENT_VALIDATION.phone_number.pattern.test(formData.phone_number.trim())) {
      newErrors.phone_number = 'Invalid phone number format. Use E.164 format (e.g., +12074197718)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !effectiveCompanyId) {
      return;
    }

    setLoading(true);

    try {
      if (agent) {
        // Update existing agent
        const updateData: UpdateAgentData = {
          agent_name: formData.agent_name.trim(),
          agent_id: formData.agent_id.trim(),
          phone_number: formData.phone_number.trim() || undefined,
          agent_direction: formData.agent_direction,
          agent_type: formData.agent_type,
          is_active: formData.is_active,
        };

        const response = await fetch(`/api/agents/${agent.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update agent');
        }

        const updatedAgent = await response.json();
        onSave(updatedAgent);
      } else {
        // Create new agent
        const createData: CreateAgentData = {
          agent_name: formData.agent_name.trim(),
          agent_id: formData.agent_id.trim(),
          phone_number: formData.phone_number.trim() || undefined,
          agent_direction: formData.agent_direction,
          agent_type: formData.agent_type,
          is_active: formData.is_active,
        };

        const response = await fetch(`/api/companies/${effectiveCompanyId}/agents`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(createData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create agent');
        }

        const newAgent = await response.json();
        onSave(newAgent);
      }
    } catch (err) {
      console.error('Error saving agent:', err);
      if (err instanceof Error && err.message.includes('already exists')) {
        setErrors({ agent_id: 'This Agent ID is already in use. Please choose a different one.' });
      } else {
        alert(err instanceof Error ? err.message : 'Failed to save agent. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.agentFormOverlay}>
      <div className={styles.agentForm}>
        <div className={styles.header}>
          <h2>{agent ? 'Edit Agent' : 'Create New Agent'}</h2>
          <button onClick={onCancel} className={styles.closeButton} disabled={loading}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="agent_name" className={styles.label}>
              Agent Name *
            </label>
            <input
              type="text"
              id="agent_name"
              value={formData.agent_name}
              onChange={(e) => setFormData(prev => ({ ...prev, agent_name: e.target.value }))}
              className={`${styles.input} ${errors.agent_name ? styles.error : ''}`}
              placeholder="e.g., Customer Support Voice Agent"
              disabled={loading}
            />
            {errors.agent_name && <span className={styles.errorText}>{errors.agent_name}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="agent_id" className={styles.label}>
              Retell Agent ID *
            </label>
            <input
              type="text"
              id="agent_id"
              value={formData.agent_id}
              onChange={(e) => setFormData(prev => ({ ...prev, agent_id: e.target.value }))}
              className={`${styles.input} ${errors.agent_id ? styles.error : ''}`}
              placeholder="e.g., agent_abc123"
              disabled={loading}
            />
            {errors.agent_id && <span className={styles.errorText}>{errors.agent_id}</span>}
            <small className={styles.helpText}>
              This is the unique identifier from your Retell dashboard
            </small>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="agent_type" className={styles.label}>
                Agent Type *
              </label>
              <select
                id="agent_type"
                value={formData.agent_type}
                onChange={(e) => setFormData(prev => ({ ...prev, agent_type: e.target.value as any }))}
                className={styles.select}
                disabled={loading}
              >
                <option value="calling">Voice Calling</option>
                <option value="sms">SMS Messaging</option>
                <option value="web_agent">Web Chat</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="agent_direction" className={styles.label}>
                Direction *
              </label>
              <select
                id="agent_direction"
                value={formData.agent_direction}
                onChange={(e) => setFormData(prev => ({ ...prev, agent_direction: e.target.value as any }))}
                className={styles.select}
                disabled={loading}
              >
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phone_number" className={styles.label}>
              Phone Number
            </label>
            <input
              type="text"
              id="phone_number"
              value={formData.phone_number}
              onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              className={`${styles.input} ${errors.phone_number ? styles.error : ''}`}
              placeholder="e.g., +12074197718"
              disabled={loading}
            />
            {errors.phone_number && <span className={styles.errorText}>{errors.phone_number}</span>}
            <small className={styles.helpText}>
              Optional. Use E.164 format for international compatibility
            </small>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                disabled={loading}
              />
              <span className={styles.checkmark}></span>
              Active Agent
            </label>
            <small className={styles.helpText}>
              Only active agents can be used for calls and messages
            </small>
          </div>

          <div className={styles.actions}>
            <button
              type="button"
              onClick={onCancel}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner}></span>
                  {agent ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                agent ? 'Update Agent' : 'Create Agent'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}