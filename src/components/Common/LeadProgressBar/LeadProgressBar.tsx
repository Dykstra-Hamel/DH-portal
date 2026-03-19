'use client';

import { CircleCheck } from 'lucide-react';
import styles from './LeadProgressBar.module.scss';

interface LeadProgressBarProps {
  leadStatus: 'new' | 'in_process' | 'quoted' | 'scheduling' | 'won' | 'lost';
}

const STEPS = [
  { id: 'new', label: 'New' },
  { id: 'in_process', label: 'Working The Lead' },
  { id: 'quoted', label: 'Quoted' },
  { id: 'scheduling', label: 'Ready To Schedule' },
];

const STATUS_ORDER = ['new', 'in_process', 'quoted', 'scheduling'];

export function LeadProgressBar({ leadStatus }: LeadProgressBarProps) {
  const currentIndex =
    leadStatus === 'won' || leadStatus === 'lost'
      ? STATUS_ORDER.length - 1
      : STATUS_ORDER.indexOf(leadStatus);

  const progressWidth = ((currentIndex + 1) / STATUS_ORDER.length) * 100;

  const isCompleted = (stepId: string) => {
    if (leadStatus === 'won' || leadStatus === 'lost') return true;
    const stepIndex = STATUS_ORDER.indexOf(stepId);
    return stepIndex < STATUS_ORDER.indexOf(leadStatus);
  };

  const isCurrent = (stepId: string) => {
    return stepId === leadStatus;
  };

  const isFinished = leadStatus === 'won' || leadStatus === 'lost';

  return (
    <div className={styles.progressBarRow}>
      <div className={styles.stepsContainer}>
        <div
          className={styles.gradientFill}
          style={{ width: `${progressWidth}%` }}
        />
        {STEPS.map((step, i) => {
          const completed = isCompleted(step.id);
          const current = isCurrent(step.id);
          const stateClass = completed
            ? styles.stepCompleted
            : current
              ? styles.stepCurrent
              : styles.stepUpcoming;

          return (
            <div key={step.id} className={`${styles.step} ${stateClass}`}>
              {completed && <CircleCheck size={14} />}
              <span>{step.label}</span>
            </div>
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
