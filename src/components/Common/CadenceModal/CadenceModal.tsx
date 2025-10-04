'use client';

import { useState } from 'react';
import { Plus, Save, X, Trash2 } from 'lucide-react';
import {
  SalesCadenceWithSteps,
  CadenceFormData,
  CadenceStepFormData,
  ACTION_TYPE_LABELS,
  TIME_OF_DAY_LABELS,
  PRIORITY_LABELS,
  ActionType,
  TimeOfDay,
  Priority,
} from '@/types/sales-cadence';
import styles from './CadenceModal.module.scss';

interface CadenceModalProps {
  cadence: SalesCadenceWithSteps | null;
  companyId: string;
  onClose: () => void;
  onSuccess: (newCadenceId?: string) => void;
}

export default function CadenceModal({ cadence, companyId, onClose, onSuccess }: CadenceModalProps) {
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

      onSuccess(savedCadence.id);
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
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
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
