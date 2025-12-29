'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { InfoCard } from '../InfoCard/InfoCard';
import {
  Phone,
  MessageSquareMore,
  Mail,
  Target,
  Check,
  CircleSlash,
  ChevronDown,
  Plus,
  SquarePlay,
  SquarePen,
} from 'lucide-react';
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
import CadenceModal from '../CadenceModal/CadenceModal';
import { CadenceEditMode } from './CadenceEditMode';
import { SaveCadenceModal } from '../SaveCadenceModal/SaveCadenceModal';
import { EndCadenceModal } from '../EndCadenceModal/EndCadenceModal';
import { NotInterestedModal } from '../NotInterestedModal/NotInterestedModal';
import styles from './SalesCadenceCard.module.scss';
import cardStyles from '../InfoCard/InfoCard.module.scss';

interface SalesCadenceCardProps {
  leadId: string;
  companyId: string;
  leadCreatedAt: string;
  onCadenceSelect?: (cadenceId: string | null) => void;
  hideCard?: boolean;
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
  hideCard = false,
}: SalesCadenceCardProps) {
  const router = useRouter();
  const [assignment, setAssignment] = useState<CadenceAssignment | null>(null);
  const [availableCadences, setAvailableCadences] = useState<
    SalesCadenceWithSteps[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [changingCadence, setChangingCadence] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingCadenceId, setPendingCadenceId] = useState<string | null>(null);
  const [isPausing, setIsPausing] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [selectedPreviewCadenceId, setSelectedPreviewCadenceId] = useState<
    string | null
  >(null);
  const [previewSteps, setPreviewSteps] = useState<SalesCadenceStep[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [showCadenceModal, setShowCadenceModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingSteps, setEditingSteps] = useState<SalesCadenceStep[]>([]);
  const [expandedDays, setExpandedDays] = useState<Set<number>>(
    new Set([1, 2, 3])
  );
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [pendingSaveSteps, setPendingSaveSteps] = useState<SalesCadenceStep[]>(
    []
  );
  const [showEndModal, setShowEndModal] = useState(false);
  const [showNotInterestedModal, setShowNotInterestedModal] = useState(false);
  const [companyTimezone, setCompanyTimezone] =
    useState<string>('America/New_York');

  useEffect(() => {
    loadData();
  }, [leadId, companyId]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      const cadencesRes = await fetch(
        `/api/companies/${companyId}/sales-cadences`
      );
      if (cadencesRes.ok) {
        const { data } = await cadencesRes.json();
        const activeCadences = data.filter((c: any) => c.is_active);
        setAvailableCadences(activeCadences);
      }

      // Load company timezone
      const settingsRes = await fetch(`/api/companies/${companyId}/settings`);
      if (settingsRes.ok) {
        const { data: settings } = await settingsRes.json();
        const timezoneSetting = settings?.find(
          (s: any) => s.setting_key === 'company_timezone'
        );
        if (timezoneSetting?.setting_value) {
          setCompanyTimezone(timezoneSetting.setting_value);
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
      // No active assignment - immediately activate the selected cadence
      handleCadenceChange(cadenceId);
      setIsDropdownOpen(false);
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

      // Notify parent component of cadence selection
      onCadenceSelect?.(cadenceId);
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

  const calculateTargetDateTime = (
    step: SalesCadenceStep,
    startedAt: string
  ) => {
    // Parse the started_at date
    const startDate = new Date(startedAt);

    // Calculate the base due date (started_at + day_number - 1 days)
    const baseDueDate = new Date(startDate);
    baseDueDate.setDate(baseDueDate.getDate() + (step.day_number - 1));

    // Set the time based on time_of_day (12PM for morning, 5PM for afternoon)
    const dueHour = step.time_of_day === 'morning' ? 12 : 17;
    baseDueDate.setHours(dueHour, 0, 0, 0);

    // Check if Day 1 Morning would be in the past
    // If so, shift the entire cadence forward by 1 day to preserve morning/afternoon pattern
    const day1Morning = new Date(startDate);
    day1Morning.setHours(12, 0, 0, 0);
    const now = new Date();

    const dueDate =
      day1Morning < now
        ? new Date(baseDueDate.getTime() + 24 * 60 * 60 * 1000)
        : baseDueDate;

    // Format the display string
    const timeStr = dueDate.getHours() === 12 ? '12PM' : '5PM';
    const dateStr = dueDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'numeric',
      day: 'numeric',
    });

    return `${dateStr} | ${timeStr}`;
  };

  const getCompletedCount = () => {
    if (!assignment?.cadence?.steps) return 0;
    return assignment.cadence.steps.filter(s => s.is_completed).length;
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
    return assignment?.cadence?.steps?.find(s => !s.is_completed) || null;
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

  const handleEndCadence = () => {
    setShowEndModal(true);
  };

  const endCadenceOnly = async () => {
    try {
      setIsEnding(true);

      const response = await fetch(`/api/leads/${leadId}/cadence`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to end cadence');
      }

      setShowEndModal(false);
      await loadData();
    } catch (error) {
      console.error('Error ending cadence:', error);
      alert('Failed to end cadence');
    } finally {
      setIsEnding(false);
    }
  };

  const handleMarkAsLost = () => {
    setShowEndModal(false);
    setShowNotInterestedModal(true);
  };

  const handleNotInterestedSubmit = async (reason: string) => {
    try {
      // First fetch the lead to get current status
      const leadResponse = await fetch(`/api/leads/${leadId}`);
      const leadData = await leadResponse.json();
      const currentStatus = leadData.lead_status;

      // End the cadence first
      await fetch(`/api/leads/${leadId}/cadence`, {
        method: 'DELETE',
      });

      // Mark lead as lost with lost_stage
      await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_status: 'lost',
          lost_reason: reason,
          lost_stage: currentStatus,
        }),
      });

      setShowNotInterestedModal(false);

      // Redirect to leads page
      router.push('/tickets/leads');
    } catch (error) {
      console.error('Error marking lead as not interested:', error);
      alert('Failed to mark lead as not interested');
      throw error;
    }
  };

  if (loading) {
    const loadingContent = (
      <div className={styles.cardContent}>
        <p className={cardStyles.lightText}>Loading...</p>
      </div>
    );

    return hideCard ? (
      loadingContent
    ) : (
      <InfoCard
        title="Sales Cadence"
        icon={<Target size={20} />}
        startExpanded={true}
      >
        {loadingContent}
      </InfoCard>
    );
  }

  if (!assignment) {
    const selectedCadence = availableCadences.find(
      c => c.id === selectedPreviewCadenceId
    );

    const noAssignmentContent = (
      <div className={styles.cardContent}>
        {availableCadences.length > 0 ? (
          <>
            <div className={styles.formGroup}>
              <div ref={dropdownRef} className={styles.dropdownWrapper}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={changingCadence}
                  className={`${styles.dropdownButton} ${selectedCadence ? styles.hasSelection : styles.placeholder}`}
                >
                  <span>
                    {selectedCadence
                      ? selectedCadence.name
                      : 'Select a sales cadence'}
                  </span>
                  <ChevronDown size={16} className={styles.dropdownChevron} />
                </button>

                {isDropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    {availableCadences.map(cadence => (
                      <button
                        key={cadence.id}
                        type="button"
                        onClick={() => handleCadenceSelectChange(cadence.id)}
                        className={`${styles.dropdownOption} ${selectedPreviewCadenceId === cadence.id ? styles.selected : ''}`}
                      >
                        <span>{cadence.name}</span>
                        {selectedPreviewCadenceId === cadence.id && (
                          <Check size={16} />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {selectedPreviewCadenceId && selectedCadence && !isEditMode && (
              <>
                {/* Progress Section */}
                <div className={styles.progressSection}>
                  <div className={styles.progressHeader}>
                    <span className={cardStyles.defaultText}>
                      0 of {selectedCadence.steps?.length || 0} steps complete
                    </span>
                  </div>
                  <div className={styles.progressBar}></div>
                </div>

                {/* Cadence Steps Preview */}
                <div className={styles.stepsSection}>
                  <h4 className={cardStyles.defaultText}>Cadence Progress:</h4>
                  <div className={styles.stepsList}>
                    {selectedCadence.steps
                      ?.sort((a, b) => a.display_order - b.display_order)
                      .map(step => (
                        <div key={step.id} className={styles.stepItem}>
                          <div className={styles.stepIcon}>
                            {getActionIcon(step.action_type)}
                          </div>

                          <div className={styles.stepContent}>
                            <div className={styles.stepHeader}>
                              <span className={cardStyles.inputText}>
                                Day {step.day_number}:{' '}
                                {step.time_of_day === 'morning'
                                  ? 'Morning'
                                  : 'Afternoon'}{' '}
                                {step.action_type === 'live_call' ||
                                step.action_type === 'outbound_call'
                                  ? 'Call'
                                  : step.action_type === 'ai_call'
                                    ? 'AI Call'
                                    : step.action_type === 'text_message'
                                      ? 'Text'
                                      : step.action_type === 'email'
                                        ? 'Email'
                                        : step.action_type}
                              </span>
                              <div className={styles.priorityIndicator}>
                                <span className={cardStyles.inputText}>
                                  {PRIORITY_LABELS[step.priority]}
                                </span>
                                <div
                                  className={`${styles.priorityDot} ${styles[`priorityDot${step.priority.charAt(0).toUpperCase() + step.priority.slice(1)}`]}`}
                                >
                                  <div className={styles.priorityDotInner} />
                                </div>
                              </div>
                            </div>
                            <div className={cardStyles.dataLabel}>
                              Target:{' '}
                              {calculateTargetDateTime(
                                step,
                                new Date().toISOString()
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}

            {/* Edit Mode UI */}
            {selectedPreviewCadenceId && selectedCadence && isEditMode && (
              <CadenceEditMode
                steps={editingSteps}
                cadenceName={selectedCadence.name}
                onSaveClick={updatedSteps => {
                  setPendingSaveSteps(updatedSteps);
                  setShowSaveModal(true);
                }}
                onCancel={() => {
                  setIsEditMode(false);
                  setEditingSteps([]);
                }}
                onDelete={async () => {
                  if (
                    !confirm(
                      'Are you sure you want to delete this cadence? This action cannot be undone.'
                    )
                  ) {
                    return;
                  }

                  try {
                    const response = await fetch(
                      `/api/companies/${companyId}/sales-cadences/${selectedPreviewCadenceId}`,
                      { method: 'DELETE' }
                    );

                    if (!response.ok) {
                      throw new Error('Failed to delete cadence');
                    }

                    // Clear selection and reload
                    setSelectedPreviewCadenceId(null);
                    setIsEditMode(false);
                    await loadData();
                  } catch (error) {
                    console.error('Error deleting cadence:', error);
                    alert('Failed to delete cadence');
                  }
                }}
              />
            )}
          </>
        ) : (
          <p className={cardStyles.lightText}>
            No sales cadences available for this company.
          </p>
        )}
      </div>
    );

    return (
      <>
        {showCadenceModal && (
          <CadenceModal
            cadence={null}
            companyId={companyId}
            onClose={() => setShowCadenceModal(false)}
            onSuccess={newCadenceId => {
              setShowCadenceModal(false);
              if (newCadenceId) {
                // Auto-select the newly created cadence
                setSelectedPreviewCadenceId(newCadenceId);
                onCadenceSelect?.(newCadenceId);
              }
              // Reload available cadences
              loadData();
            }}
          />
        )}

        {selectedCadence && (
          <SaveCadenceModal
            isOpen={showSaveModal}
            currentCadenceName={selectedCadence.name}
            onSaveAsNew={async newName => {
              try {
                // Create new cadence with the new name
                const cadenceResponse = await fetch(
                  `/api/companies/${companyId}/sales-cadences`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: newName,
                      description: selectedCadence.description,
                      is_active: selectedCadence.is_active,
                      is_default: false, // Never make copies default
                    }),
                  }
                );

                if (!cadenceResponse.ok) {
                  throw new Error('Failed to create new cadence');
                }

                const { data: newCadence } = await cadenceResponse.json();

                // Sort steps by day_number, then time_of_day before creating
                const sortedSteps = [...pendingSaveSteps].sort((a, b) => {
                  if (a.day_number !== b.day_number) {
                    return a.day_number - b.day_number;
                  }
                  if (
                    a.time_of_day === 'morning' &&
                    b.time_of_day === 'afternoon'
                  )
                    return -1;
                  if (
                    a.time_of_day === 'afternoon' &&
                    b.time_of_day === 'morning'
                  )
                    return 1;
                  return 0;
                });

                // Create steps for the new cadence
                for (let i = 0; i < sortedSteps.length; i++) {
                  const { id, ...stepData } = sortedSteps[i];
                  await fetch(
                    `/api/companies/${companyId}/sales-cadences/${newCadence.id}/steps`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...stepData,
                        display_order: i,
                      }),
                    }
                  );
                }

                // Reload and select the new cadence
                await loadData();
                setSelectedPreviewCadenceId(newCadence.id);
                onCadenceSelect?.(newCadence.id);
                setShowSaveModal(false);
                setIsEditMode(false);
                setPendingSaveSteps([]);
              } catch (error) {
                console.error('Error saving as new cadence:', error);
                alert('Failed to save as new cadence');
                throw error;
              }
            }}
            onOverwrite={async () => {
              try {
                // Delete all existing steps
                if (selectedCadence.steps) {
                  for (const step of selectedCadence.steps) {
                    await fetch(
                      `/api/companies/${companyId}/sales-cadences/${selectedPreviewCadenceId}/steps?step_id=${step.id}`,
                      { method: 'DELETE' }
                    );
                  }
                }

                // Sort steps by day_number, then time_of_day before creating
                const sortedSteps = [...pendingSaveSteps].sort((a, b) => {
                  if (a.day_number !== b.day_number) {
                    return a.day_number - b.day_number;
                  }
                  if (
                    a.time_of_day === 'morning' &&
                    b.time_of_day === 'afternoon'
                  )
                    return -1;
                  if (
                    a.time_of_day === 'afternoon' &&
                    b.time_of_day === 'morning'
                  )
                    return 1;
                  return 0;
                });

                // Create new steps
                for (let i = 0; i < sortedSteps.length; i++) {
                  const { id, ...stepData } = sortedSteps[i];
                  await fetch(
                    `/api/companies/${companyId}/sales-cadences/${selectedPreviewCadenceId}/steps`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        ...stepData,
                        display_order: i,
                      }),
                    }
                  );
                }

                // Reload and exit edit mode
                await loadData();
                setShowSaveModal(false);
                setIsEditMode(false);
                setPendingSaveSteps([]);
              } catch (error) {
                console.error('Error overwriting cadence:', error);
                alert('Failed to save cadence');
                throw error;
              }
            }}
            onCancel={() => {
              setShowSaveModal(false);
              setPendingSaveSteps([]);
            }}
          />
        )}

        {hideCard ? (
          noAssignmentContent
        ) : (
          <InfoCard
            title="Sales Cadence"
            icon={<Target size={20} />}
            startExpanded={true}
          >
            {noAssignmentContent}
          </InfoCard>
        )}
      </>
    );
  }

  const completedCount = getCompletedCount();
  const totalCount = getTotalCount();
  const progressPercentage = getProgressPercentage();
  const nextStep = getNextIncompleteStep();
  const isPaused = !!assignment?.paused_at;
  const allStepsComplete = completedCount === totalCount && totalCount > 0;

  const cardContent = (
    <div className={styles.cardContent}>
      {/* Progress Bar */}
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span className={cardStyles.defaultText}>Progress</span>
          <div className={styles.actionButtonsRight}>
            {isPaused && <span className={styles.pausedBadge}>Paused</span>}
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
        <select
          className={styles.selectInput}
          value={assignment.cadence_id}
          onChange={e => handleCadenceSelectChange(e.target.value)}
          disabled={changingCadence}
        >
          {availableCadences.map(cadence => (
            <option key={cadence.id} value={cadence.id}>
              {cadence.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleEndCadence}
          className={styles.removeCadenceLink}
        >
          Remove Cadence
        </button>
      </div>

      {/* Cadence Steps */}
      {/* <div className={styles.stepsSection}>
        <h4 className={cardStyles.defaultText}>Steps:</h4>
        <div className={isPaused ? styles.stepsListPaused : styles.stepsList}>
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
                      Day {step.day_number}{' '}
                      {step.time_of_day === 'morning' ? 'Morning' : 'Afternoon'}{' '}
                      - {ACTION_TYPE_LABELS[step.action_type]}
                    </span>
                    <div className={styles.priorityIndicator}>
                      <span className={cardStyles.inputText}>
                        {PRIORITY_LABELS[step.priority]}
                      </span>
                      <div
                        className={`${styles.priorityDot} ${styles[`priorityDot${step.priority.charAt(0).toUpperCase() + step.priority.slice(1)}`]}`}
                      >
                        <div className={styles.priorityDotInner} />
                      </div>
                    </div>
                  </div>
                  {step.is_completed && step.completed_at ? (
                    <div className={styles.completedLabel}>
                      Completed:{' '}
                      {new Date(step.completed_at).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'numeric',
                        day: 'numeric',
                      })}{' '}
                      at{' '}
                      {new Date(step.completed_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </div>
                  ) : (
                    <div className={cardStyles.dataLabel}>
                      Target:{' '}
                      {calculateTargetDateTime(step, assignment.started_at)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div> */}

      {/* Action Buttons - Only show if cadence is not complete */}
      {/* {!allStepsComplete && (
        <div className={styles.actionButtonsContainer}>
          <button
            onClick={handlePauseCadence}
            disabled={isPausing}
            className={styles.secondaryButton}
          >
            {isPausing
              ? isPaused
                ? 'Resuming...'
                : 'Pausing...'
              : isPaused
                ? 'Resume Cadence'
                : 'Pause Cadence'}
          </button>
          <button
            onClick={handleEndCadence}
            disabled={isEnding}
            className={styles.primaryButton}
          >
            <CircleSlash size={16} />
            {isEnding ? 'Ending...' : 'End Cadence'}
          </button>
        </div>
      )} */}
    </div>
  );

  return (
    <>
      <ConfirmCadenceChangeModal
        isOpen={showConfirmModal}
        onConfirm={handleConfirmChange}
        onCancel={handleCancelChange}
      />

      <EndCadenceModal
        isOpen={showEndModal}
        onMarkAsLost={handleMarkAsLost}
        onEndOnly={endCadenceOnly}
        onCancel={() => setShowEndModal(false)}
      />

      <NotInterestedModal
        isOpen={showNotInterestedModal}
        onClose={() => setShowNotInterestedModal(false)}
        onSubmit={handleNotInterestedSubmit}
      />

      {hideCard ? (
        cardContent
      ) : (
        <InfoCard
          title="Sales Cadence"
          icon={<Target size={20} />}
          startExpanded={true}
        >
          {cardContent}
        </InfoCard>
      )}
    </>
  );
}
