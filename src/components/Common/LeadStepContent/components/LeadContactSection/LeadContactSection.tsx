'use client';

import { useState } from 'react';
import { ACTION_TYPE_LABELS } from '@/types/sales-cadence';
import { LeadContactSectionProps } from '../../types/leadStepTypes';
import { useUser } from '@/hooks/useUser';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import styles from './LeadContactSection.module.scss';
import { CircleCheckBig } from 'lucide-react';

const CALL_TYPES = new Set(['live_call', 'outbound_call']);

const STEP_ACTION_LABELS: Record<string, { present: string; past: string }> = {
  live_call: { present: 'Call Customer', past: 'Called Customer' },
  outbound_call: { present: 'Call Customer', past: 'Called Customer' },
  text_message: { present: 'Text Customer', past: 'Texted Customer' },
  email: { present: 'Email Customer', past: 'Emailed Customer' },
  ai_call: { present: 'AI Call', past: 'AI Called' },
  trigger_workflow: { present: 'Automation', past: 'Automation' },
};

const WORKFLOW_STEP_LABELS: Record<string, { present: string; past: string }> =
  {
    send_email: { present: 'Email Customer', past: 'Emailed Customer' },
    send_sms: { present: 'Text Customer', past: 'Texted Customer' },
    make_call: { present: 'Call Customer', past: 'Called Customer' },
    conditional: { present: 'Decision', past: 'Decision' },
    update_lead_status: { present: 'Update Status', past: 'Updated Status' },
  };

const WORKFLOW_ACTION_TYPES = new Set([
  'send_email',
  'send_sms',
  'make_call',
  'conditional',
  'update_lead_status',
]);
const WORKFLOW_DELAY_TYPES = new Set(['delay', 'wait']);

interface WorkflowTimelineEntry {
  step: any;
  estimatedAt: Date;
  isCompleted: boolean;
  completedAt?: string;
}

function buildWorkflowStepTimeline(
  steps: any[],
  stepResults: any[],
  startedAt: string
): WorkflowTimelineEntry[] {
  const base = new Date(startedAt);
  let accumulatedMs = 0;
  const result: WorkflowTimelineEntry[] = [];

  steps.forEach((step, index) => {
    if (WORKFLOW_DELAY_TYPES.has(step.type)) {
      const mins = step.delay_minutes || step.delay || 0;
      accumulatedMs += mins * 60 * 1000;
    } else if (WORKFLOW_ACTION_TYPES.has(step.type)) {
      // Account for the step's own delay_minutes (fires BEFORE the action)
      accumulatedMs += (step.delay_minutes || 0) * 60 * 1000;
      const completedResult = stepResults.find(
        (r: any) => r.stepIndex === index
      );
      const isCompleted = !!completedResult;
      result.push({
        step,
        estimatedAt: new Date(base.getTime() + accumulatedMs),
        isCompleted,
        completedAt: completedResult?.completedAt,
      });
    }
  });

  return result;
}

function formatWorkflowDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = String(date.getFullYear()).slice(2);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  const h = hours % 12 || 12;
  return `${month}/${day}/${year} - ${h}:${minutes}${ampm}`;
}

function formatRelativeTime(date: Date): string {
  const diffMs = date.getTime() - Date.now();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return '1 day';
  return `${diffDays} days`;
}

function formatStepDate(
  dayNumber: number,
  timeOfDay: string,
  startedAt: string
): string {
  const start = new Date(startedAt);
  const stepDate = new Date(start);
  stepDate.setDate(stepDate.getDate() + dayNumber - 1);
  const month = stepDate.getMonth() + 1;
  const day = stepDate.getDate();
  const year = String(stepDate.getFullYear()).slice(2);
  const time = timeOfDay === 'morning' ? '12:00pm' : '5:00pm';
  return `${month}/${day}/${year} - ${time}`;
}

export function LeadContactSection({
  lead,
  nextTask,
  afterNextActionType,
  loadingNextTask,
  hasActiveCadence,
  activityNotes,
  isLoggingActivity,
  availableCadences,
  cadenceSteps = [],
  cadenceStartedAt,
  activeWorkflowExecution = null,
  onNotesChange,
  onLogActivity,
  onCadenceSelect,
  onStartQuoting,
  onScheduleService,
  onShowToast,
  onLeadUpdate,
  isSidebarExpanded,
}: LeadContactSectionProps) {
  const [voicemailLeft, setVoicemailLeft] = useState(false);
  const [noVoicemail, setNoVoicemail] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [localCadenceId, setLocalCadenceId] = useState('');
  const [isStarting, setIsStarting] = useState(false);

  const { user } = useUser();
  const isNewUnassigned = lead.lead_status === 'new' && !lead.assigned_to;
  const { users: assignableUsers, loading: loadingUsers } = useAssignableUsers({
    companyId: lead.company_id,
    departmentType: 'sales',
    enabled: isNewUnassigned,
  });

  const handleTakeLead = async () => {
    if (!user) return;
    setIsAssigning(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_to: user.id,
          lead_status: 'in_process',
        }),
      });
      if (!res.ok) throw new Error('Failed');
      onLeadUpdate?.({
        ...lead,
        assigned_to: user.id,
        lead_status: 'in_process',
      });
    } catch {
      onShowToast?.('Failed to take lead', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignLead = async (userId: string) => {
    if (!userId) return;
    setIsAssigning(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assigned_to: userId,
          lead_status: 'in_process',
        }),
      });
      if (!res.ok) throw new Error('Failed');
      onLeadUpdate?.({
        ...lead,
        assigned_to: userId,
        lead_status: 'in_process',
      });
    } catch {
      onShowToast?.('Failed to assign lead', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleVoicemailLeft = () => {
    if (voicemailLeft) {
      setVoicemailLeft(false);
    } else {
      setVoicemailLeft(true);
      setNoVoicemail(false);
    }
  };

  const handleNoVoicemail = () => {
    if (noVoicemail) {
      setNoVoicemail(false);
    } else {
      setNoVoicemail(true);
      setVoicemailLeft(false);
    }
  };

  const handleNotesChange = (value: string) => {
    onNotesChange(value);
  };

  const handleStartCadence = async () => {
    if (!localCadenceId) return;
    setIsStarting(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/cadence`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cadence_id: localCadenceId }),
      });
      if (!res.ok) throw new Error('Failed');
      onCadenceSelect(localCadenceId);
    } catch {
      onShowToast?.('Failed to start cadence', 'error');
    } finally {
      setIsStarting(false);
    }
  };

  // ── New + unassigned: take or assign the lead ──────────────────────────────
  if (isNewUnassigned) {
    return (
      <div
        className={styles.cardContent}
        data-sidebar-expanded={isSidebarExpanded}
      >
        <div className={styles.assignSection}>
          <button
            type="button"
            onClick={handleTakeLead}
            disabled={isAssigning || !user}
            className={styles.takeLeadButton}
          >
            {isAssigning ? 'Assigning...' : 'Take Lead'}
          </button>
          <div className={styles.assignRow}>
            <span className={styles.assignOrText}>or assign to</span>
            <select
              className={styles.assignSelect}
              defaultValue=""
              onChange={e => handleAssignLead(e.target.value)}
              disabled={isAssigning || loadingUsers}
            >
              <option value="" disabled>
                {loadingUsers ? 'Loading...' : 'Select a rep...'}
              </option>
              {assignableUsers.map(u => (
                <option key={u.id} value={u.id}>
                  {u.display_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  // ── Loading state (checking for default cadence or next task) ──────────────
  if (loadingNextTask || hasActiveCadence === null) {
    return (
      <div
        className={styles.cardContent}
        data-sidebar-expanded={isSidebarExpanded}
      >
        <div className={styles.statusCard}>
          <span className={styles.statusText}>Loading...</span>
        </div>
      </div>
    );
  }

  // ── State A: No active cadence ──────────────────────────────────────────────
  if (!hasActiveCadence) {
    return (
      <div
        className={styles.cardContent}
        data-sidebar-expanded={isSidebarExpanded}
      >
        {availableCadences && availableCadences.length > 0 && (
          <div className={styles.cadenceStartRow}>
            <select
              className={styles.cadenceSelect}
              value={localCadenceId}
              onChange={e => setLocalCadenceId(e.target.value)}
            >
              <option value="">Select a cadence...</option>
              {availableCadences.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={styles.startCadenceButton}
              onClick={handleStartCadence}
              disabled={!localCadenceId || isStarting}
            >
              {isStarting ? 'Starting...' : 'Start Cadence'}
            </button>
          </div>
        )}
        <div className={styles.fallbackSection}>
          <label className={styles.fieldLabel}>Notes</label>
          <textarea
            value={activityNotes}
            onChange={e => handleNotesChange(e.target.value)}
            placeholder="Add a comment to ticket history..."
            className={styles.notesTextarea}
          />
          <div className={styles.logRow}>
            <button
              type="button"
              onClick={() => onLogActivity()}
              disabled={isLoggingActivity}
              className={styles.logActivityButton}
            >
              {isLoggingActivity ? 'Logging...' : 'Log Activity'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── State C: All steps completed ────────────────────────────────────────────
  if (!nextTask) {
    return (
      <div
        className={styles.cardContent}
        data-sidebar-expanded={isSidebarExpanded}
      >
        <div className={styles.completedCard}>
          <span className={styles.completedText}>
            All cadence steps completed! 🎉
          </span>
        </div>
      </div>
    );
  }

  // ── State D: Trigger workflow in progress ───────────────────────────────────
  if (nextTask.action_type === 'trigger_workflow') {
    const workflowSteps: any[] =
      activeWorkflowExecution?.workflow?.workflow_steps ?? [];
    const stepResults: any[] =
      activeWorkflowExecution?.execution_data?.stepResults ?? [];
    const startedAt: string = activeWorkflowExecution?.started_at ?? '';
    const useWorkflowSteps = workflowSteps.length > 0 && !!startedAt;

    const timeline = useWorkflowSteps
      ? buildWorkflowStepTimeline(workflowSteps, stepResults, startedAt)
      : [];

    const lastCompletedWorkflow =
      [...timeline].filter(t => t.isCompleted).slice(-1)[0] ?? null;
    const upcomingWorkflow = timeline.filter(t => !t.isCompleted);

    // Cadence-based fallback values
    const completedCadenceSteps = cadenceSteps.filter(
      (s: any) => s.is_completed
    );
    const lastCompletedCadence =
      completedCadenceSteps[completedCadenceSteps.length - 1] ?? null;
    const upcomingCadenceSteps = cadenceSteps.filter(
      (s: any) => !s.is_completed && s.action_type !== 'trigger_workflow'
    );

    const totalSteps = useWorkflowSteps ? timeline.length : cadenceSteps.length;
    const completedCount = useWorkflowSteps
      ? timeline.filter(t => t.isCompleted).length
      : completedCadenceSteps.length;

    // Header timing
    let nextActionText = '';
    if (useWorkflowSteps && upcomingWorkflow.length > 0) {
      nextActionText = formatRelativeTime(upcomingWorkflow[0].estimatedAt);
    } else if (
      upcomingCadenceSteps.length > 0 &&
      cadenceStartedAt &&
      upcomingCadenceSteps[0].day_number != null
    ) {
      const start = new Date(cadenceStartedAt);
      start.setHours(0, 0, 0, 0);
      const targetDate = new Date(start);
      targetDate.setDate(
        targetDate.getDate() + upcomingCadenceSteps[0].day_number - 1
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = Math.round(
        (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diff <= 0) nextActionText = 'today';
      else if (diff === 1) nextActionText = '1 day';
      else nextActionText = `${diff} days`;
    }

    return (
      <div
        className={styles.cardContent}
        data-sidebar-expanded={isSidebarExpanded}
      >
        <div className={styles.workflowProgressHeader}>
          <span className={styles.workflowProgressTitle}>
            <span className={styles.workflowProgressBlue}>
              Lead Automation In Progress
            </span>
            {nextActionText && (
              <span className={styles.workflowProgressSub}>
                : Next action in {nextActionText}
              </span>
            )}
          </span>
          {totalSteps > 0 && (
            <span className={styles.workflowStepCount}>
              {completedCount}/
              <span className={styles.totalCount}>{totalSteps}</span>
            </span>
          )}
        </div>

        <div className={styles.workflowStepsList}>
          {useWorkflowSteps ? (
            <>
              {lastCompletedWorkflow && (
                <div
                  className={`${styles.workflowStepRow} ${styles.workflowStepRowCompleted}`}
                >
                  <div className={styles.workflowStepInfo}>
                    <span className={styles.workflowStepDate}>
                      {formatWorkflowDate(
                        lastCompletedWorkflow.completedAt
                          ? new Date(lastCompletedWorkflow.completedAt)
                          : lastCompletedWorkflow.estimatedAt
                      )}
                    </span>
                    <span className={styles.workflowStepLabel}>
                      {WORKFLOW_STEP_LABELS[lastCompletedWorkflow.step.type]
                        ?.past ?? lastCompletedWorkflow.step.type}
                    </span>
                  </div>
                  <CircleCheckBig
                    className={styles.workflowStepCheck}
                    size={16}
                    strokeWidth={3}
                  />
                </div>
              )}
              {upcomingWorkflow.length > 0 && (
                <>
                  <div className={styles.workflowComingUpLabel}>Coming Up</div>
                  {upcomingWorkflow.map((entry, i) => (
                    <div key={i} className={styles.workflowStepRow}>
                      <div className={styles.workflowStepInfo}>
                        <span className={styles.workflowStepDate}>
                          {formatWorkflowDate(entry.estimatedAt)}
                        </span>
                        <span className={styles.workflowStepLabel}>
                          {WORKFLOW_STEP_LABELS[entry.step.type]?.present ??
                            entry.step.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          ) : (
            <>
              {lastCompletedCadence && (
                <div
                  className={`${styles.workflowStepRow} ${styles.workflowStepRowCompleted}`}
                >
                  <div className={styles.workflowStepInfo}>
                    {cadenceStartedAt &&
                      lastCompletedCadence.day_number != null && (
                        <span className={styles.workflowStepDate}>
                          {formatStepDate(
                            lastCompletedCadence.day_number,
                            lastCompletedCadence.time_of_day,
                            cadenceStartedAt
                          )}
                        </span>
                      )}
                    <span className={styles.workflowStepLabel}>
                      {STEP_ACTION_LABELS[lastCompletedCadence.action_type]
                        ?.past ?? lastCompletedCadence.action_type}
                    </span>
                  </div>
                  <svg
                    className={styles.workflowStepCheck}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M7 12l4 4 6-6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              )}
              {upcomingCadenceSteps.length > 0 && (
                <>
                  <div className={styles.workflowComingUpLabel}>Coming Up</div>
                  {upcomingCadenceSteps.map((step: any) => (
                    <div key={step.id} className={styles.workflowStepRow}>
                      <div className={styles.workflowStepInfo}>
                        {cadenceStartedAt && step.day_number != null && (
                          <span className={styles.workflowStepDate}>
                            {formatStepDate(
                              step.day_number,
                              step.time_of_day,
                              cadenceStartedAt
                            )}
                          </span>
                        )}
                        <span className={styles.workflowStepLabel}>
                          {STEP_ACTION_LABELS[step.action_type]?.present ??
                            step.action_type}
                        </span>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>

        <div className={styles.workflowActions}>
          <button
            type="button"
            onClick={onStartQuoting}
            className={styles.startQuotingButton}
          >
            Create Quote
          </button>
        </div>
      </div>
    );
  }

  // ── State B: User-action step (call/text/email/ai_call) ─────────────────────
  const isCallStep = CALL_TYPES.has(nextTask.action_type);
  const isVoicemail = voicemailLeft || noVoicemail;
  const isWorkflowNext = afterNextActionType === 'trigger_workflow';
  const isLastStep = hasActiveCadence === true && afterNextActionType === null;
  const isLastVoicemail = isLastStep && isVoicemail;
  const stepLabel =
    ACTION_TYPE_LABELS[
      nextTask.action_type as keyof typeof ACTION_TYPE_LABELS
    ] || nextTask.action_type;

  const formatDueDate = (dateStr?: string | null): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
  };

  const isDueDateOverdue = (dateStr?: string | null): boolean => {
    if (!dateStr) return false;
    const due = new Date(dateStr + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  return (
    <div
      className={styles.cardContent}
      data-sidebar-expanded={isSidebarExpanded}
    >
      <div className={styles.nextStepHeader}>
        <span className={styles.nextStepLabel}>Next Step:</span>
        <span className={styles.nextStepName}>{stepLabel}</span>
        {nextTask.day_number && (
          <span className={styles.nextStepDay}>Day {nextTask.day_number}</span>
        )}
        {nextTask.due_date && (
          <span className={`${styles.nextStepDue} ${isDueDateOverdue(nextTask.due_date) ? styles.nextStepDueOverdue : ''}`}>
            Due {formatDueDate(nextTask.due_date)}
          </span>
        )}
      </div>

      <textarea
        value={activityNotes}
        onChange={e => handleNotesChange(e.target.value)}
        placeholder="Start typing what happened..."
        className={styles.notesTextarea}
      />

      {isCallStep && (
        <div className={styles.actionRow}>
          <div className={styles.quickActions}>
            <label className={styles.quickActionLabel}>
              <input
                type="checkbox"
                checked={voicemailLeft}
                onChange={handleVoicemailLeft}
                className={styles.quickActionCheckbox}
              />
              Left Voicemail
            </label>
            <label className={styles.quickActionLabel}>
              <input
                type="checkbox"
                checked={noVoicemail}
                onChange={handleNoVoicemail}
                className={styles.quickActionCheckbox}
              />
              No Voicemail
            </label>
          </div>
          {isVoicemail ? (
            <button
              type="button"
              onClick={() =>
                onLogActivity(voicemailLeft ? 'voicemail_left' : 'no_voicemail')
              }
              disabled={
                isLoggingActivity || (isLastVoicemail && !activityNotes.trim())
              }
              className={styles.submitButton}
            >
              {isLoggingActivity
                ? 'Submitting...'
                : isLastVoicemail
                  ? 'Submit & Mark As Lost'
                  : isWorkflowNext
                    ? 'Submit & Start Automation'
                    : 'Submit'}
            </button>
          ) : lead.lead_status === 'scheduling' ? (
            <button
              type="button"
              onClick={onScheduleService}
              className={styles.startQuotingButton}
            >
              Schedule Service
            </button>
          ) : lead.lead_status === 'quoted' ? (
            <button
              type="button"
              onClick={() => onLogActivity()}
              disabled={isLoggingActivity}
              className={styles.startQuotingButton}
            >
              {isLoggingActivity ? 'Submitting...' : 'Log Call'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartQuoting}
              className={styles.startQuotingButton}
            >
              Start Quoting Process
            </button>
          )}
        </div>
      )}
    </div>
  );
}
