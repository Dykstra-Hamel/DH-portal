'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import {
  SalesCadenceWithSteps,
  CadenceFormData,
  CadenceStepFormData,
  ACTION_TYPE_LABELS,
  TIME_OF_DAY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
  ActionType,
  TimeOfDay,
  Priority,
} from '@/types/sales-cadence';
import styles from './SalesConfigManager.module.scss';

interface SalesConfigManagerProps {
  companyId: string;
}

export default function SalesConfigManager({ companyId }: SalesConfigManagerProps) {
  const [cadences, setCadences] = useState<SalesCadenceWithSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCadenceModal, setShowCadenceModal] = useState(false);
  const [editingCadence, setEditingCadence] = useState<SalesCadenceWithSteps | null>(null);
  const [expandedCadence, setExpandedCadence] = useState<string | null>(null);

  useEffect(() => {
    loadCadences();
  }, [companyId]);

  const loadCadences = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/companies/${companyId}/sales-cadences`);
      if (!response.ok) {
        throw new Error('Failed to load sales cadences');
      }

      const { data } = await response.json();
      setCadences(data);
    } catch (err) {
      console.error('Error loading sales cadences:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sales cadences');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCadence = () => {
    setEditingCadence(null);
    setShowCadenceModal(true);
  };

  const handleEditCadence = (cadence: SalesCadenceWithSteps) => {
    setEditingCadence(cadence);
    setShowCadenceModal(true);
  };

  const handleDeleteCadence = async (cadenceId: string) => {
    if (!confirm('Are you sure you want to delete this sales cadence? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/companies/${companyId}/sales-cadences/${cadenceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const { error: errorMsg } = await response.json();
        throw new Error(errorMsg || 'Failed to delete sales cadence');
      }

      setSuccess('Sales cadence deleted successfully');
      await loadCadences();
    } catch (err) {
      console.error('Error deleting sales cadence:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete sales cadence');
    } finally {
      setSaving(false);
    }
  };

  const toggleCadenceExpansion = (cadenceId: string) => {
    setExpandedCadence(expandedCadence === cadenceId ? null : cadenceId);
  };

  if (loading) {
    return <div className={styles.loading}>Loading sales cadences...</div>;
  }

  return (
    <div className={styles.salesConfigManager}>
      <div className={styles.header}>
        <h2>Sales Cadence Configuration</h2>
        <button onClick={handleCreateCadence} className={styles.createButton} disabled={saving}>
          <Plus size={16} />
          Create Cadence
        </button>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className={styles.successMessage}>
          <strong>Success:</strong> {success}
        </div>
      )}

      {cadences.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No sales cadences configured yet.</p>
          <p>Create your first cadence to get started.</p>
        </div>
      ) : (
        <div className={styles.cadenceList}>
          {cadences.map((cadence) => (
            <div key={cadence.id} className={styles.cadenceCard}>
              <div className={styles.cadenceHeader}>
                <div className={styles.cadenceInfo}>
                  <h3>{cadence.name}</h3>
                  {cadence.description && <p>{cadence.description}</p>}
                  <div className={styles.cadenceMeta}>
                    <span>{cadence.steps?.length || 0} steps</span>
                    {cadence.is_default && <span className={styles.badge}>Default</span>}
                    {cadence.is_active ? (
                      <span className={styles.statusActive}>Active</span>
                    ) : (
                      <span className={styles.statusInactive}>Inactive</span>
                    )}
                  </div>
                </div>
                <div className={styles.cadenceActions}>
                  <button
                    onClick={() => toggleCadenceExpansion(cadence.id)}
                    className={styles.iconButton}
                    title="View Steps"
                  >
                    {expandedCadence === cadence.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button
                    onClick={() => handleEditCadence(cadence)}
                    className={styles.iconButton}
                    disabled={saving}
                    title="Edit Cadence"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCadence(cadence.id)}
                    className={styles.iconButton}
                    disabled={saving}
                    title="Delete Cadence"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {expandedCadence === cadence.id && cadence.steps && cadence.steps.length > 0 && (
                <div className={styles.cadenceSteps}>
                  <h4>Cadence Steps:</h4>
                  <div className={styles.stepsTimeline}>
                    {[...cadence.steps]
                      .sort((a, b) => {
                        // Sort by day number first
                        if (a.day_number !== b.day_number) {
                          return a.day_number - b.day_number;
                        }
                        // Then sort by time of day (morning before afternoon)
                        if (a.time_of_day === 'morning' && b.time_of_day === 'afternoon') return -1;
                        if (a.time_of_day === 'afternoon' && b.time_of_day === 'morning') return 1;
                        return 0;
                      })
                      .map((step, index) => (
                      <div key={step.id} className={styles.stepItem}>
                        <div className={styles.stepNumber}>{index + 1}</div>
                        <div className={styles.stepContent}>
                          <div className={styles.stepHeader}>
                            <span className={styles.stepDay}>
                              Day {step.day_number} - {TIME_OF_DAY_LABELS[step.time_of_day]}
                            </span>
                            <span
                              className={styles.priorityBadge}
                              style={{ backgroundColor: PRIORITY_COLORS[step.priority] }}
                            >
                              {PRIORITY_LABELS[step.priority]}
                            </span>
                          </div>
                          <div className={styles.stepAction}>
                            {ACTION_TYPE_LABELS[step.action_type]}
                          </div>
                          {step.description && (
                            <div className={styles.stepDescription}>{step.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCadenceModal && (
        <CadenceModal
          cadence={editingCadence}
          companyId={companyId}
          onClose={() => {
            setShowCadenceModal(false);
            setEditingCadence(null);
          }}
          onSuccess={() => {
            setShowCadenceModal(false);
            setEditingCadence(null);
            setSuccess(editingCadence ? 'Cadence updated successfully' : 'Cadence created successfully');
            loadCadences();
          }}
        />
      )}
    </div>
  );
}

interface CadenceModalProps {
  cadence: SalesCadenceWithSteps | null;
  companyId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function CadenceModal({ cadence, companyId, onClose, onSuccess }: CadenceModalProps) {
  const [formData, setFormData] = useState<CadenceFormData>({
    name: cadence?.name || '',
    description: cadence?.description || '',
    is_active: cadence?.is_active !== undefined ? cadence.is_active : true,
    is_default: cadence?.is_default || false,
  });
  const [steps, setSteps] = useState<CadenceStepFormData[]>(
    cadence?.steps?.map(step => ({
      day_number: step.day_number,
      time_of_day: step.time_of_day,
      action_type: step.action_type,
      priority: step.priority,
      description: step.description || '',
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

      // Save cadence
      const cadenceResponse = await fetch(
        cadence
          ? `/api/companies/${companyId}/sales-cadences/${cadence.id}`
          : `/api/companies/${companyId}/sales-cadences`,
        {
          method: cadence ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        }
      );

      if (!cadenceResponse.ok) {
        throw new Error('Failed to save cadence');
      }

      const { data: savedCadence } = await cadenceResponse.json();

      // If editing, delete existing steps and recreate
      if (cadence) {
        // Delete all existing steps
        for (const step of cadence.steps || []) {
          await fetch(
            `/api/companies/${companyId}/sales-cadences/${cadence.id}/steps?step_id=${step.id}`,
            { method: 'DELETE' }
          );
        }
      }

      // Create new steps with proper order (use sorted steps)
      const sortedSteps = getSortedSteps();
      for (let i = 0; i < sortedSteps.length; i++) {
        await fetch(`/api/companies/${companyId}/sales-cadences/${savedCadence.id}/steps`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...sortedSteps[i],
            display_order: i,
          }),
        });
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving cadence:', err);
      setError(err instanceof Error ? err.message : 'Failed to save cadence');
    } finally {
      setSaving(false);
    }
  };

  // Auto-sort steps by day and time
  const getSortedSteps = () => {
    return [...steps].sort((a, b) => {
      // First sort by day number
      if (a.day_number !== b.day_number) {
        return a.day_number - b.day_number;
      }
      // Then sort by time of day (morning before afternoon)
      if (a.time_of_day === 'morning' && b.time_of_day === 'afternoon') return -1;
      if (a.time_of_day === 'afternoon' && b.time_of_day === 'morning') return 1;
      return 0;
    });
  };

  // Group steps by day number
  const getStepsByDay = () => {
    const sortedSteps = getSortedSteps();
    const grouped: { [key: number]: CadenceStepFormData[] } = {};

    sortedSteps.forEach((step) => {
      if (!grouped[step.day_number]) {
        grouped[step.day_number] = [];
      }
      grouped[step.day_number].push(step);
    });

    return grouped;
  };

  // Get the highest day number currently in use
  const getMaxDayNumber = () => {
    if (steps.length === 0) return 0;
    return Math.max(...steps.map(s => s.day_number));
  };

  const addStepToDay = (dayNumber: number) => {
    setSteps([
      ...steps,
      {
        day_number: dayNumber,
        time_of_day: 'morning',
        action_type: 'outbound_call',
        priority: 'medium',
        description: '',
      },
    ]);
  };

  const addNewDay = () => {
    const nextDay = getMaxDayNumber() + 1;
    addStepToDay(nextDay);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof CadenceStepFormData, value: any) => {
    const updatedSteps = [...steps];
    updatedSteps[index] = { ...updatedSteps[index], [field]: value };
    setSteps(updatedSteps);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>{cadence ? 'Edit Sales Cadence' : 'Create Sales Cadence'}</h3>
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
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., 3-Day Standard Cadence"
              required
              disabled={saving}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  disabled={saving}
                />
                Active
              </label>
            </div>
            <div className={styles.checkboxGroup}>
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  disabled={saving}
                />
                Set as Default
              </label>
            </div>
          </div>

          <div className={styles.stepsSection}>
            <div className={styles.stepsSectionHeader}>
              <h4>Cadence Steps</h4>
              <button type="button" onClick={addNewDay} className={styles.addStepButton} disabled={saving}>
                <Plus size={16} />
                Add New Day
              </button>
            </div>

            {steps.length === 0 ? (
              <div className={styles.emptySteps}>
                <p>No steps added yet. Click &quot;Add New Day&quot; to begin.</p>
              </div>
            ) : (
              <div className={styles.daysList}>
                {Object.entries(getStepsByDay())
                  .sort(([dayA], [dayB]) => parseInt(dayA) - parseInt(dayB))
                  .map(([dayNumber, daySteps]) => (
                    <div key={dayNumber} className={styles.dayGroup}>
                      <div className={styles.dayHeader}>
                        <h5>Day {dayNumber}</h5>
                        <div className={styles.dayActions}>
                          <span className={styles.stepCount}>{daySteps.length} step{daySteps.length !== 1 ? 's' : ''}</span>
                          <button
                            type="button"
                            onClick={() => addStepToDay(parseInt(dayNumber))}
                            className={styles.addStepToDay}
                            disabled={saving}
                          >
                            <Plus size={14} />
                            Add Step
                          </button>
                        </div>
                      </div>

                      <div className={styles.daySteps}>
                        {daySteps.map((step, dayStepIndex) => {
                          // Find the actual index in the steps array
                          const actualIndex = steps.findIndex(s =>
                            s.day_number === step.day_number &&
                            s.time_of_day === step.time_of_day &&
                            s.action_type === step.action_type &&
                            s.priority === step.priority
                          );

                          return (
                            <div key={dayStepIndex} className={styles.stepFormItem}>
                              <div className={styles.stepFormHeader}>
                                <div className={styles.stepOrder}>
                                  <span className={styles.timeIndicator}>
                                    {step.time_of_day === 'morning' ? '🌅' : '🌆'} {step.time_of_day === 'morning' ? 'Morning' : 'Afternoon'}
                                  </span>
                                </div>
                                <div className={styles.stepOrderControls}>
                                  <button
                                    type="button"
                                    onClick={() => removeStep(actualIndex)}
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
                                  <label>Day #</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={step.day_number}
                                    onChange={(e) => updateStep(actualIndex, 'day_number', parseInt(e.target.value))}
                                    disabled={saving}
                                  />
                                </div>

                                <div className={styles.formGroup}>
                                  <label>Time of Day</label>
                                  <select
                                    value={step.time_of_day}
                                    onChange={(e) => updateStep(actualIndex, 'time_of_day', e.target.value as TimeOfDay)}
                                    disabled={saving}
                                  >
                                    <option value="morning">Morning</option>
                                    <option value="afternoon">Afternoon</option>
                                  </select>
                                </div>

                                <div className={styles.formGroup}>
                                  <label>Action Type</label>
                                  <select
                                    value={step.action_type}
                                    onChange={(e) => updateStep(actualIndex, 'action_type', e.target.value as ActionType)}
                                    disabled={saving}
                                  >
                                    {Object.entries(ACTION_TYPE_LABELS).map(([value, label]) => (
                                      <option key={value} value={value}>
                                        {label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className={styles.formGroup}>
                                  <label>Priority</label>
                                  <select
                                    value={step.priority}
                                    onChange={(e) => updateStep(actualIndex, 'priority', e.target.value as Priority)}
                                    disabled={saving}
                                  >
                                    {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                                      <option key={value} value={value}>
                                        {label}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
                                  <label>Description (Optional)</label>
                                  <input
                                    type="text"
                                    value={step.description}
                                    onChange={(e) => updateStep(actualIndex, 'description', e.target.value)}
                                    placeholder="Add notes about this step..."
                                    disabled={saving}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
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
