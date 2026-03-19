'use client';

import { useState } from 'react';
import { Plus, Save, X, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import {
  SystemSalesCadenceWithSteps,
  CadenceStepFormData,
  ACTION_TYPE_LABELS,
  PRIORITY_LABELS,
  ActionType,
  Priority,
} from '@/types/sales-cadence';
import styles from './AdminCadenceModal.module.scss';

interface AdminCadenceModalProps {
  cadence: SystemSalesCadenceWithSteps | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface CadenceFormData {
  name: string;
  description: string;
  is_active: boolean;
  is_featured: boolean;
}

// Local step form data extending the shared type with workflow_id
interface StepFormData extends CadenceStepFormData {
  workflow_id?: string | null;
}

export default function AdminCadenceModal({ cadence, onClose, onSuccess }: AdminCadenceModalProps) {
  const [formData, setFormData] = useState<CadenceFormData>({
    name: cadence?.name || '',
    description: cadence?.description || '',
    is_active: cadence?.is_active !== undefined ? cadence.is_active : true,
    is_featured: cadence?.is_featured || false,
  });
  const [steps, setSteps] = useState<StepFormData[]>(
    cadence?.steps?.map(step => ({
      day_number: step.day_number,
      time_of_day: step.time_of_day,
      action_type: step.action_type,
      priority: step.priority,
      description: step.description || '',
      workflow_id: step.workflow_id || null,
    })) || []
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError('Cadence name is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const url = cadence
        ? `/api/admin/cadence-library/${cadence.id}`
        : '/api/admin/cadence-library';
      const method = cadence ? 'PUT' : 'POST';

      // Steps are sent in state order — day_number is always null for sequential cadences
      const payload = {
        ...formData,
        steps: steps.map((step, index) => ({
          ...step,
          day_number: null,
          time_of_day: 'morning',
          display_order: index,
          workflow_id: step.workflow_id || null,
        })),
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save cadence');
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save cadence');
    } finally {
      setSaving(false);
    }
  };

  const addStep = () => {
    setSteps([
      ...steps,
      {
        day_number: 1,
        time_of_day: 'morning',
        action_type: 'outbound_call',
        priority: 'medium',
        description: '',
        workflow_id: null,
      },
    ]);
  };

  const moveStepUp = (index: number) => {
    if (index === 0) return;
    const newSteps = [...steps];
    [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
    setSteps(newSteps);
  };

  const moveStepDown = (index: number) => {
    if (index === steps.length - 1) return;
    const newSteps = [...steps];
    [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
    setSteps(newSteps);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof StepFormData, value: string | number | null) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    // Clear workflow_id when switching away from trigger_workflow
    if (field === 'action_type' && value !== 'trigger_workflow') {
      updated[index].workflow_id = null;
    }
    setSteps(updated);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{cadence ? 'Edit System Cadence' : 'Create System Cadence'}</h3>
          <button onClick={onClose} className={styles.closeButton} disabled={saving}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalContent}>
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.formGroup}>
            <label>Cadence Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., 5-Step Standard Follow-up"
              required
              disabled={saving}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe when and how this cadence should be used..."
              rows={3}
              disabled={saving}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.checkboxGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                  disabled={saving}
                />
                Active
              </label>
            </div>
            <div className={styles.checkboxGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={e => setFormData({ ...formData, is_featured: e.target.checked })}
                  disabled={saving}
                />
                Featured
              </label>
            </div>
          </div>

          <div className={styles.stepsSection}>
            <div className={styles.stepsSectionHeader}>
              <h4>Cadence Steps</h4>
              <button type="button" onClick={addStep} className={styles.addStepButton} disabled={saving}>
                <Plus size={16} />
                Add Step
              </button>
            </div>

            {steps.length === 0 ? (
              <div className={styles.emptySteps}>
                <p>No steps added yet. Click &quot;Add Step&quot; to begin.</p>
              </div>
            ) : (
              <div className={styles.stepsList}>
                {steps.map((step, index) => {
                  const isTriggerWorkflow = step.action_type === 'trigger_workflow';

                  return (
                    <div key={index} className={styles.stepFormItem}>
                      <div className={styles.stepFormHeader}>
                        <span className={styles.stepLabel}>
                          {isTriggerWorkflow ? '⚡ Auto Step' : `Step ${index + 1}`}
                        </span>
                        <div className={styles.stepOrderControls}>
                          <button
                            type="button"
                            onClick={() => moveStepUp(index)}
                            disabled={saving || index === 0}
                            className={styles.moveButton}
                            title="Move up"
                          >
                            <ChevronUp size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveStepDown(index)}
                            disabled={saving || index === steps.length - 1}
                            className={styles.moveButton}
                            title="Move down"
                          >
                            <ChevronDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeStep(index)}
                            disabled={saving}
                            className={styles.removeButton}
                            title="Delete step"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>

                      <div className={styles.stepFormGrid}>
                        <div className={styles.formGroup}>
                          <label>Action Type</label>
                          <select
                            value={step.action_type}
                            onChange={e =>
                              updateStep(index, 'action_type', e.target.value as ActionType)
                            }
                            disabled={saving}
                          >
                            {Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {!isTriggerWorkflow && (
                          <div className={styles.formGroup}>
                            <label>Priority</label>
                            <select
                              value={step.priority}
                              onChange={e =>
                                updateStep(index, 'priority', e.target.value as Priority)
                              }
                              disabled={saving}
                            >
                              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                                <option key={value} value={value}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {isTriggerWorkflow && (
                          <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                            <p className={styles.workflowNote}>
                              Workflow will be configured per company after import.
                            </p>
                          </div>
                        )}

                        <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                          <label>Description (Optional)</label>
                          <input
                            type="text"
                            value={step.description}
                            onChange={e =>
                              updateStep(index, 'description', e.target.value)
                            }
                            placeholder="Add notes about this step..."
                            disabled={saving}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={onClose} className={styles.cancelButton} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : cadence ? 'Update Cadence' : 'Create Cadence'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
