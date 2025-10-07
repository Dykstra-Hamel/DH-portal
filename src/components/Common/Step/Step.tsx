'use client';

import styles from './Step.module.scss';

export interface StepItem {
  id: string;
  label: string;
  subLabel: string;
  status: 'completed' | 'current' | 'upcoming' | 'disabled';
  isEditing?: boolean;
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
          const isDisabled =
            step.status === 'disabled' || disabledSteps.includes(step.id);
          const isCurrent = step.id === currentStep;

          return (
            <button
              key={step.id}
              className={`${styles.stepItemWrapper} ${styles[step.status]} ${
                isCurrent ? styles.active : ''
              } ${isDisabled ? styles.disabled : ''} ${
                step.isEditing ? styles.editing : ''
              }`}
              disabled={isDisabled}
              type="button"
              onClick={() => handleStepClick(step.id, step.status)}
            >
              <div
                className={`${styles.stepItem} ${styles[step.status]} ${
                  isCurrent ? styles.active : ''
                } ${isDisabled ? styles.disabled : ''} ${
                  step.isEditing ? styles.editing : ''
                }`}
              >
                <span className={styles.stepNumber}>
                  {step.status === 'completed' ? (
                    <svg
                      width="32"
                      height="33"
                      viewBox="0 0 32 33"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className={styles.checkmark}
                    >
                      <path
                        d="M23.1128 10.6367L13.7948 21.426L8.89062 16.5218"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    index + 1
                  )}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="33"
                    viewBox="0 0 32 33"
                    fill="none"
                    className={styles.editIcon}
                  >
                    <path
                      d="M15.5804 9.70245H9.68454C9.23777 9.70245 8.8093 9.87993 8.49339 10.1958C8.17748 10.5118 8 10.9402 8 11.387V23.1787C8 23.6255 8.17748 24.054 8.49339 24.3699C8.8093 24.6858 9.23777 24.8633 9.68454 24.8633H21.4763C21.9231 24.8633 22.3515 24.6858 22.6674 24.3699C22.9834 24.054 23.1608 23.6255 23.1608 23.1787V17.2829M20.9499 9.3866C21.285 9.05152 21.7394 8.86328 22.2133 8.86328C22.6871 8.86328 23.1416 9.05152 23.4767 9.3866C23.8118 9.72167 24 10.1761 24 10.65C24 11.1239 23.8118 11.5783 23.4767 11.9134L15.8853 19.5056C15.6853 19.7054 15.4382 19.8517 15.1669 19.931L12.747 20.6385C12.6745 20.6596 12.5977 20.6609 12.5246 20.6421C12.4515 20.6234 12.3847 20.5853 12.3313 20.532C12.2779 20.4786 12.2399 20.4118 12.2211 20.3387C12.2024 20.2656 12.2037 20.1887 12.2248 20.1163L12.9323 17.6964C13.0119 17.4253 13.1585 17.1785 13.3585 16.9788L20.9499 9.3866Z"
                      stroke="white"
                      strokeWidth="1.67"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>
                  <span className={styles.stepLabel}>{step.label}</span>
                  <span className={styles.stepSubLabel}>{step.subLabel}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
