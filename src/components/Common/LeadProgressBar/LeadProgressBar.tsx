'use client';

import { Check } from 'lucide-react';
import styles from './LeadProgressBar.module.scss';

type LeadStatus = 'new' | 'in_process' | 'quoted' | 'scheduling' | 'won' | 'lost';

interface LeadProgressBarProps {
  leadStatus: LeadStatus;
  onStatusChange?: (status: LeadStatus) => void;
}

const STEPS = [
  { id: 'new', label: 'New' },
  { id: 'in_process', label: 'Working The Lead' },
  { id: 'quoted', label: 'Quoted' },
  { id: 'scheduling', label: 'Ready To Schedule' },
] as const;

const STATUS_ORDER = ['new', 'in_process', 'quoted', 'scheduling'];

export function LeadProgressBar({ leadStatus, onStatusChange }: LeadProgressBarProps) {
  const isCompleted = (stepId: string) => {
    if (leadStatus === 'won' || leadStatus === 'lost') return true;
    const stepIndex = STATUS_ORDER.indexOf(stepId);
    return stepIndex < STATUS_ORDER.indexOf(leadStatus);
  };

  const isCurrent = (stepId: string) => {
    return stepId === leadStatus;
  };

  const isFinished = leadStatus === 'won' || leadStatus === 'lost';
  const interactive = !!onStatusChange;

  return (
    <div className={styles.progressBarRow}>
      <div className={styles.stepsContainer}>
        {STEPS.map((step, i) => {
          const completed = isCompleted(step.id);
          const current = isCurrent(step.id);
          const stateClass = completed
            ? styles.stepCompleted
            : current
              ? styles.stepCurrent
              : styles.stepUpcoming;

          const stepClassName = `${styles.step} ${stateClass} ${interactive && !current ? styles.stepInteractive : ''}`;

          const displayLabel =
            step.id === 'new'
              ? leadStatus === 'new'
                ? 'Unassigned'
                : 'Assigned'
              : step.label;

          return (
            <span key={step.id} className={styles.stepWrapper}>
              {i > 0 && <span className={styles.separator} aria-hidden />}
              {interactive ? (
                <button
                  type="button"
                  className={stepClassName}
                  onClick={() =>
                    !current && onStatusChange(step.id as LeadStatus)
                  }
                  disabled={current}
                  aria-current={current ? 'step' : undefined}
                >
                  {completed && <Check size={11} strokeWidth={2.5} />}
                  <span>{displayLabel}</span>
                </button>
              ) : (
                <div className={stepClassName}>
                  {completed && <Check size={11} strokeWidth={2.5} />}
                  <span>{displayLabel}</span>
                </div>
              )}
            </span>
          );
        })}
      </div>

      <span className={styles.completedLabel}>
        {isFinished && `Ticket Completed!`}
      </span>

      <div className={styles.actionsWrapper}>
        <span
          className={`${styles.statusChip} ${leadStatus === 'lost' ? styles.lostActive : ''}`}
        >
          Lost
        </span>
        <span
          className={`${styles.statusChip} ${leadStatus === 'won' ? styles.wonActive : ''}`}
        >
          Won
        </span>
      </div>
    </div>
  );
}
