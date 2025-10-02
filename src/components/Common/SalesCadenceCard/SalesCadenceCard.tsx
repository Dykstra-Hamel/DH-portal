'use client';

import { useState, useEffect } from 'react';
import { InfoCard } from '../InfoCard/InfoCard';
import { Phone, MessageSquareMore, Mail, Target, Check, CircleSlash } from 'lucide-react';
import {
  SalesCadenceWithSteps,
  SalesCadenceWithProgressSteps,
  SalesCadenceStep,
  ACTION_TYPE_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  ActionType,
} from '@/types/sales-cadence';
import { ConfirmCadenceChangeModal } from '../ConfirmCadenceChangeModal/ConfirmCadenceChangeModal';
import styles from './SalesCadenceCard.module.scss';
import cardStyles from '../InfoCard/InfoCard.module.scss';

interface SalesCadenceCardProps {
  leadId: string;
  companyId: string;
  leadCreatedAt: string;
  onCadenceSelect?: (cadenceId: string | null) => void;
}

interface CadenceAssignment {
  id: string;
  lead_id: string;
  cadence_id: string;
  started_at: string;
  completed_at: string | null;
  paused_at: string | null;
  cadence: SalesCadenceWithProgressSteps;
}

export function SalesCadenceCard({
  leadId,
  companyId,
  leadCreatedAt,
  onCadenceSelect,
}: SalesCadenceCardProps) {
  const [assignment, setAssignment] = useState<CadenceAssignment | null>(null);
  const [availableCadences, setAvailableCadences] = useState<SalesCadenceWithSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [changingCadence, setChangingCadence] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingCadenceId, setPendingCadenceId] = useState<string | null>(null);
  const [isPausing, setIsPausing] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [selectedPreviewCadenceId, setSelectedPreviewCadenceId] = useState<string | null>(null);
  const [previewSteps, setPreviewSteps] = useState<SalesCadenceStep[]>([]);

  useEffect(() => {
    loadData();
  }, [leadId, companyId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load current assignment
      const assignmentRes = await fetch(`/api/leads/${leadId}/cadence`);
      let currentAssignment = null;
      if (assignmentRes.ok) {
        const { data } = await assignmentRes.json();
        currentAssignment = data;
        setAssignment(data);
      }

      // Load available cadences
      const cadencesRes = await fetch(`/api/companies/${companyId}/sales-cadences`);
      if (cadencesRes.ok) {
        const { data } = await cadencesRes.json();
        const activeCadences = data.filter((c: any) => c.is_active);
        setAvailableCadences(activeCadences);

        // If no assignment, pre-select the default cadence for preview
        if (!currentAssignment && activeCadences.length > 0) {
          const defaultCadence = activeCadences.find((c: any) => c.is_default) || activeCadences[0];
          setSelectedPreviewCadenceId(defaultCadence.id);
          setPreviewSteps(defaultCadence.steps || []);
          // Notify parent component
          onCadenceSelect?.(defaultCadence.id);
        }
      }
    } catch (error) {
      console.error('Error loading cadence data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCadenceSelectChange = (cadenceId: string) => {
    if (!cadenceId) return;

    // If there's an active assignment, keep the existing PUT logic
    if (assignment) {
      const completedCount = getCompletedCount();

      // If there's progress and we're changing to a different cadence, show confirmation
      if (completedCount > 0 && cadenceId !== assignment.cadence_id) {
        setPendingCadenceId(cadenceId);
        setShowConfirmModal(true);
      } else {
        // No progress or same cadence, proceed with PUT
        handleCadenceChange(cadenceId);
      }
    } else {
      // No active assignment - update preview
      setSelectedPreviewCadenceId(cadenceId);
      const selectedCadence = availableCadences.find(c => c.id === cadenceId);
      if (selectedCadence) {
        setPreviewSteps(selectedCadence.steps || []);
      }
      // Notify parent component
      onCadenceSelect?.(cadenceId);
    }
  };

  const handleConfirmChange = () => {
    if (pendingCadenceId) {
      handleCadenceChange(pendingCadenceId);
    }
    setShowConfirmModal(false);
    setPendingCadenceId(null);
  };

  const handleCancelChange = () => {
    setShowConfirmModal(false);
    setPendingCadenceId(null);
  };

  const handleCadenceChange = async (cadenceId: string) => {
    if (!cadenceId || changingCadence) return;

    try {
      setChangingCadence(true);

      const response = await fetch(`/api/leads/${leadId}/cadence`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cadence_id: cadenceId }),
      });

      if (!response.ok) {
        throw new Error('Failed to update cadence');
      }

      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error changing cadence:', error);
      alert('Failed to update cadence');
    } finally {
      setChangingCadence(false);
    }
  };

  const getActionIcon = (actionType: ActionType) => {
    switch (actionType) {
      case 'live_call':
      case 'outbound_call':
      case 'ai_call':
        return <Phone size={16} />;
      case 'text_message':
        return <MessageSquareMore size={16} />;
      case 'email':
        return <Mail size={16} />;
      default:
        return <Target size={16} />;
    }
  };

  const calculateTargetDateTime = (step: SalesCadenceStep, startedAt: string) => {
    const startDate = new Date(startedAt);
    const targetDate = new Date(startDate);
    targetDate.setDate(targetDate.getDate() + (step.day_number - 1));

    const timeStr = step.time_of_day === 'morning' ? '12PM' : '5PM';
    const dateStr = targetDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
    });

    return `${dateStr} | ${timeStr}`;
  };

  const getCompletedCount = () => {
    if (!assignment?.cadence?.steps) return 0;
    return assignment.cadence.steps.filter((s) => s.is_completed).length;
  };

  const getTotalCount = () => {
    return assignment?.cadence?.steps?.length || 0;
  };

  const getProgressPercentage = () => {
    const total = getTotalCount();
    if (total === 0) return 0;
    return (getCompletedCount() / total) * 100;
  };

  const getNextIncompleteStep = () => {
    return assignment?.cadence?.steps?.find((s) => !s.is_completed) || null;
  };

  const handlePauseCadence = async () => {
    if (!assignment || isPausing) return;

    try {
      setIsPausing(true);
      const action = assignment.paused_at ? 'unpause' : 'pause';

      const response = await fetch(`/api/leads/${leadId}/cadence`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} cadence`);
      }

      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      console.error('Error pausing/unpausing cadence:', error);
      alert(`Failed to ${assignment.paused_at ? 'resume' : 'pause'} cadence`);
    } finally {
      setIsPausing(false);
    }
  };

  const handleEndCadence = async () => {
    if (!assignment || isEnding) return;

    const confirmed = confirm(
      'Are you sure you want to end this cadence? This will remove the cadence assignment and cancel all pending tasks.'
    );

    if (!confirmed) return;

    try {
      setIsEnding(true);

      const response = await fetch(`/api/leads/${leadId}/cadence`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to end cadence');
      }

      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      console.error('Error ending cadence:', error);
      alert('Failed to end cadence');
    } finally {
      setIsEnding(false);
    }
  };

  if (loading) {
    return (
      <InfoCard title="Sales Cadence" icon={<Target size={20} />} startExpanded={true}>
        <div className={styles.cardContent}>
          <p className={cardStyles.lightText}>Loading...</p>
        </div>
      </InfoCard>
    );
  }

  if (!assignment) {
    return (
      <InfoCard title="Sales Cadence" icon={<Target size={20} />} startExpanded={true}>
        <div className={styles.cardContent}>
          {availableCadences.length > 0 ? (
            <>
              <div className={styles.formGroup}>
                <label className={cardStyles.inputLabels}>Select Cadence:</label>
                <select
                  className={styles.selectInput}
                  onChange={(e) => handleCadenceSelectChange(e.target.value)}
                  disabled={changingCadence}
                  value={selectedPreviewCadenceId || ''}
                >
                  {availableCadences.map((cadence) => (
                    <option key={cadence.id} value={cadence.id}>
                      {cadence.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview steps for selected cadence */}
              {previewSteps.length > 0 && (
                <div className={styles.stepsSection}>
                  <h4 className={cardStyles.defaultText}>Cadence Steps:</h4>
                  <div className={styles.stepsList}>
                    {previewSteps.map((step, index) => (
                      <div
                        key={step.id}
                        className={styles.stepItem}
                      >
                        <div className={styles.stepIcon}>
                          {getActionIcon(step.action_type)}
                        </div>

                        <div className={styles.stepContent}>
                          <div className={styles.stepHeader}>
                            <span className={cardStyles.inputText}>
                              Day {step.day_number} {step.time_of_day === 'morning' ? 'Morning' : 'Afternoon'} - {ACTION_TYPE_LABELS[step.action_type]}
                            </span>
                            <div className={styles.priorityIndicator}>
                              <span className={cardStyles.inputText}>
                                {PRIORITY_LABELS[step.priority]}
                              </span>
                              <div className={`${styles.priorityDot} ${styles[`priorityDot${step.priority.charAt(0).toUpperCase() + step.priority.slice(1)}`]}`}>
                                <div className={styles.priorityDotInner} />
                              </div>
                            </div>
                          </div>
                          <div className={cardStyles.dataLabel}>
                            Target: {step.time_of_day === 'morning' ? '12PM' : '5PM'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className={cardStyles.lightText}>No sales cadences available for this company.</p>
          )}
        </div>
      </InfoCard>
    );
  }

  const completedCount = getCompletedCount();
  const totalCount = getTotalCount();
  const progressPercentage = getProgressPercentage();
  const nextStep = getNextIncompleteStep();
  const isPaused = !!assignment?.paused_at;
  const allStepsComplete = completedCount === totalCount && totalCount > 0;

  return (
    <>
      <ConfirmCadenceChangeModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmChange}
        onCancel={handleCancelChange}
      />

      <InfoCard title="Sales Cadence" icon={<Target size={20} />} startExpanded={true}>
        <div className={styles.cardContent}>
        {/* Progress Bar */}
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span className={cardStyles.defaultText}>Progress</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isPaused && (
                <span
                  style={{
                    padding: '2px 8px',
                    backgroundColor: 'var(--gray-300)',
                    color: 'var(--gray-700)',
                    fontSize: '12px',
                    fontWeight: '500',
                    borderRadius: '4px',
                  }}
                >
                  Paused
                </span>
              )}
              <span className={cardStyles.dataLabel}>
                {completedCount} of {totalCount} complete
              </span>
            </div>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Cadence Selector */}
        <div className={styles.formGroup}>
          <label className={cardStyles.inputLabels}>Active Cadence:</label>
          <select
            className={styles.selectInput}
            value={assignment.cadence_id}
            onChange={(e) => handleCadenceSelectChange(e.target.value)}
            disabled={changingCadence}
          >
            {availableCadences.map((cadence) => (
              <option key={cadence.id} value={cadence.id}>
                {cadence.name}
              </option>
            ))}
          </select>
        </div>

        {/* Cadence Steps */}
        <div className={styles.stepsSection}>
          <h4 className={cardStyles.defaultText}>Steps:</h4>
          <div className={styles.stepsList} style={{ opacity: isPaused ? 0.6 : 1 }}>
            {assignment.cadence.steps.map((step, index) => {
              const isNext = nextStep && nextStep.id === step.id;

              return (
                <div
                  key={step.id}
                  className={`${styles.stepItem} ${isNext ? styles.stepItemNext : ''} ${
                    step.is_completed ? styles.stepItemCompleted : ''
                  }`}
                >
                  <div className={styles.stepIcon}>
                    {step.is_completed ? (
                      <div className={styles.checkIcon}>
                        <Check size={14} />
                      </div>
                    ) : (
                      getActionIcon(step.action_type)
                    )}
                  </div>

                  <div className={styles.stepContent}>
                    <div className={styles.stepHeader}>
                      <span className={cardStyles.inputText}>
                        Day {step.day_number} {step.time_of_day === 'morning' ? 'Morning' : 'Afternoon'} - {ACTION_TYPE_LABELS[step.action_type]}
                      </span>
                      <div className={styles.priorityIndicator}>
                        <span className={cardStyles.inputText}>
                          {PRIORITY_LABELS[step.priority]}
                        </span>
                        <div className={`${styles.priorityDot} ${styles[`priorityDot${step.priority.charAt(0).toUpperCase() + step.priority.slice(1)}`]}`}>
                          <div className={styles.priorityDotInner} />
                        </div>
                      </div>
                    </div>
                    {step.is_completed && step.completed_at ? (
                      <div className={styles.completedLabel}>
                        Completed: {new Date(step.completed_at).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'numeric',
                          day: 'numeric',
                        })} at {new Date(step.completed_at).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true
                        })}
                      </div>
                    ) : (
                      <div className={cardStyles.dataLabel}>
                        Target: {calculateTargetDateTime(step, assignment.started_at)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons - Only show if cadence is not complete */}
        {!allStepsComplete && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              marginTop: '16px',
            }}
          >
            <button
              onClick={handlePauseCadence}
              disabled={isPausing}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--gray-300)',
                borderRadius: '6px',
                backgroundColor: 'white',
                color: 'var(--gray-600)',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isPausing ? 'not-allowed' : 'pointer',
                opacity: isPausing ? 0.6 : 1,
              }}
            >
              {isPausing ? (isPaused ? 'Resuming...' : 'Pausing...') : (isPaused ? 'Resume Cadence' : 'Pause Cadence')}
            </button>
            <button
              onClick={handleEndCadence}
              disabled={isEnding}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: '#3b82f6',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: isEnding ? 'not-allowed' : 'pointer',
                opacity: isEnding ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CircleSlash size={16} />
              {isEnding ? 'Ending...' : 'End Cadence'}
            </button>
          </div>
        )}
      </div>
    </InfoCard>
    </>
  );
}
