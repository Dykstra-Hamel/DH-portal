'use client';

import styles from './Step.module.scss';

export interface StepItem {
  id: string;
  label: string;
  status: 'completed' | 'current' | 'upcoming' | 'disabled';
}

interface StepProps {
  steps: StepItem[];
  currentStep: string;
  onStepClick: (stepId: string) => void;
  disabledSteps?: string[];
  className?: string;
}

export function Step({
  steps,
  currentStep,
  onStepClick,
  disabledSteps = [],
  className = '',
}: StepProps) {
  const handleStepClick = (stepId: string, status: string) => {
    if (status === 'disabled' || disabledSteps.includes(stepId)) {
      return;
    }
    onStepClick(stepId);
  };

  return (
    <div className={`${styles.stepWrapper} ${className}`}>
      <div className={styles.stepContainer}>
        {steps.map((step, index) => {
          const isDisabled = step.status === 'disabled' || disabledSteps.includes(step.id);
          const isCurrent = step.id === currentStep;

          return (
            <div key={step.id} className={styles.stepItemWrapper}>
              <button
                className={`${styles.stepItem} ${styles[step.status]} ${
                  isCurrent ? styles.active : ''
                } ${isDisabled ? styles.disabled : ''}`}
                onClick={() => handleStepClick(step.id, step.status)}
                disabled={isDisabled}
                type="button"
              >
                <span className={styles.stepNumber}>
                  {step.status === 'completed' ? (
                    <svg width="32" height="33" viewBox="0 0 32 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M23.1128 10.6367L13.7948 21.426L8.89062 16.5218" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    index + 1
                  )}
                </span>
                <span className={styles.stepLabel}>{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <div className={styles.stepSeparator}>
                  <svg width="16" height="73" viewBox="0 0 16 73" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip0_1774_691)">
                      <path d="M1 -0.943359L15 36.0566L1 73.0566" stroke="#D1D5DB" strokeLinejoin="round"/>
                    </g>
                    <defs>
                      <clipPath id="clip0_1774_691">
                        <rect width="16" height="72" fill="white" transform="translate(0 0.03125)"/>
                      </clipPath>
                    </defs>
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}