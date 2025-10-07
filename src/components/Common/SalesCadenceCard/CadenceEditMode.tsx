'use client';

import { useState } from 'react';
import {
  GripVertical,
  Trash2,
  Copy,
  CirclePlus,
  ChevronDown,
  SquarePen,
  Save,
  CircleX,
} from 'lucide-react';
import {
  SalesCadenceStep,
  ACTION_TYPE_LABELS,
  PRIORITY_LABELS,
  ActionType,
  TimeOfDay,
  Priority,
} from '@/types/sales-cadence';
import styles from './CadenceEditMode.module.scss';

interface CadenceEditModeProps {
  steps: SalesCadenceStep[];
  cadenceName: string;
  onSaveClick: (steps: SalesCadenceStep[]) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function CadenceEditMode({
  steps,
  cadenceName,
  onSaveClick,
  onCancel,
  onDelete,
}: CadenceEditModeProps) {
  const [editingSteps, setEditingSteps] = useState<SalesCadenceStep[]>([
    ...steps,
  ]);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(
    new Set(Array.from(new Set(steps.map(s => s.day_number))))
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Group steps by day
  const groupStepsByDay = () => {
    const grouped: { [key: number]: SalesCadenceStep[] } = {};
    editingSteps.forEach(step => {
      if (!grouped[step.day_number]) {
        grouped[step.day_number] = [];
      }
      grouped[step.day_number].push(step);
    });
    return grouped;
  };

  const toggleDay = (dayNumber: number) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dayNumber)) {
      newExpanded.delete(dayNumber);
    } else {
      newExpanded.add(dayNumber);
    }
    setExpandedDays(newExpanded);
  };

  const updateStep = (
    index: number,
    field: keyof SalesCadenceStep,
    value: any
  ) => {
    const updated = [...editingSteps];
    updated[index] = { ...updated[index], [field]: value };
    setEditingSteps(updated);
  };

  const deleteStep = (index: number) => {
    setEditingSteps(editingSteps.filter((_, i) => i !== index));
  };

  const duplicateStep = (index: number) => {
    const { id, ...stepWithoutId } = editingSteps[index];
    setEditingSteps([
      ...editingSteps.slice(0, index + 1),
      stepWithoutId as SalesCadenceStep,
      ...editingSteps.slice(index + 1),
    ]);
  };

  const addStepToDay = (dayNumber: number) => {
    const newStep: Partial<SalesCadenceStep> = {
      day_number: dayNumber,
      time_of_day: 'morning',
      action_type: 'outbound_call',
      priority: 'medium',
      description: '',
    };
    setEditingSteps([...editingSteps, newStep as SalesCadenceStep]);
  };

  const addNewDay = () => {
    const maxDay =
      editingSteps.length > 0
        ? Math.max(...editingSteps.map(s => s.day_number))
        : 0;
    const newDayNumber = maxDay + 1;
    addStepToDay(newDayNumber);
    setExpandedDays(new Set([...expandedDays, newDayNumber]));
  };

  const deleteDay = (dayNumber: number) => {
    if (!confirm(`Delete all steps for Day ${dayNumber}?`)) return;
    setEditingSteps(editingSteps.filter(s => s.day_number !== dayNumber));
  };

  const handleSave = () => {
    onSaveClick(editingSteps);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === targetIndex) {
      return;
    }

    const newSteps = [...editingSteps];
    const draggedStep = newSteps[draggedIndex];

    // Remove from old position
    newSteps.splice(draggedIndex, 1);

    // Insert at new position
    newSteps.splice(targetIndex, 0, draggedStep);

    setEditingSteps(newSteps);
    setDraggedIndex(targetIndex);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const groupedSteps = groupStepsByDay();
  const sortedDays = Object.keys(groupedSteps)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className={styles.editMode}>
      {/* Warning Banner */}
      <div className={styles.warningBanner}>
        <SquarePen size={18} /> Editing a cadence. Make desired changes below.
      </div>

      {/* Edit Steps Section */}
      <h4 className={styles.editHeading}>Edit Steps:</h4>
      <div className={styles.editStepsSection}>
        {sortedDays.map(dayNumber => {
          const daySteps = groupedSteps[dayNumber];
          const isExpanded = expandedDays.has(dayNumber);

          return (
            <div key={dayNumber} className={styles.dayGroup}>
              <div
                className={styles.dayHeader}
                onClick={() => toggleDay(dayNumber)}
              >
                <div className={styles.dayTitle}>
                  <div className={styles.chevronOuterWrapper}>
                    <div className={styles.chevronInnerWrapper}>
                      <ChevronDown
                        size={16}
                        className={
                          !isExpanded ? styles.dayChevronCollapsed : ''
                        }
                      />
                    </div>
                  </div>
                  <span>Day {dayNumber}</span>
                </div>
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    deleteDay(dayNumber);
                  }}
                  className={styles.deleteDayButton}
                >
                  Delete
                </button>
              </div>

              {isExpanded && (
                <div className={styles.daySteps}>
                  {daySteps.map((step, dayStepIndex) => {
                    const globalIndex = editingSteps.findIndex(s => s === step);

                    return (
                      <div
                        key={dayStepIndex}
                        className={`${styles.stepItem} ${draggedIndex === globalIndex ? styles.dragging : ''}`}
                        draggable
                        onDragStart={() => handleDragStart(globalIndex)}
                        onDragOver={e => handleDragOver(e, globalIndex)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className={styles.dragHandle}>
                          <GripVertical size={16} />
                        </div>

                        <div className={styles.stepFields}>
                          <div className={styles.fieldRow}>
                            <div className={styles.field}>
                              <label>Type:</label>
                              <select
                                value={step.action_type}
                                onChange={e =>
                                  updateStep(
                                    globalIndex,
                                    'action_type',
                                    e.target.value as ActionType
                                  )
                                }
                              >
                                {Object.entries(ACTION_TYPE_LABELS).map(
                                  ([value, label]) => (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>

                            <div className={styles.field}>
                              <label>Description:</label>
                              <input
                                type="text"
                                value={step.description || ''}
                                onChange={e =>
                                  updateStep(
                                    globalIndex,
                                    'description',
                                    e.target.value
                                  )
                                }
                              />
                            </div>
                          </div>

                          <div className={styles.fieldRow}>
                            <div className={styles.field}>
                              <label>Target Time</label>
                              <select
                                value={step.time_of_day}
                                onChange={e =>
                                  updateStep(
                                    globalIndex,
                                    'time_of_day',
                                    e.target.value as TimeOfDay
                                  )
                                }
                              >
                                <option value="morning">Morning</option>
                                <option value="afternoon">Afternoon</option>
                              </select>
                            </div>

                            <div className={styles.field}>
                              <label>Priority</label>
                              <select
                                value={step.priority}
                                onChange={e =>
                                  updateStep(
                                    globalIndex,
                                    'priority',
                                    e.target.value as Priority
                                  )
                                }
                              >
                                {Object.entries(PRIORITY_LABELS).map(
                                  ([value, label]) => (
                                    <option key={value} value={value}>
                                      {label}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>

                            <div className={styles.stepActions}>
                              <button
                                type="button"
                                onClick={() => deleteStep(globalIndex)}
                                title="Delete step"
                              >
                                <Trash2 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => duplicateStep(globalIndex)}
                                title="Duplicate step"
                              >
                                <Copy size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => addStepToDay(dayNumber)}
                                title="Add step"
                              >
                                <CirclePlus size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Add Day Button */}
        <button
          type="button"
          onClick={addNewDay}
          className={styles.addDayButton}
        >
          <CirclePlus size={16} /> Add Day
        </button>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionButtons}>
        <button
          type="button"
          onClick={onDelete}
          className={styles.deleteButton}
        >
          <CircleX size={18} />
          Delete Cadence
        </button>

        <div className={styles.rightButtons}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={styles.saveButton}
          >
            <Save size={18} />
            Save As
          </button>
        </div>
      </div>
    </div>
  );
}
