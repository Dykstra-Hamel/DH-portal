import { Step, StepItem } from '@/components/Common/Step/Step';
import { StepInfo } from '@/components/Common/StepInfo/StepInfo';
import styles from './LeadStepWrapper.module.scss';

interface LeadStepWrapperProps {
  customerName: string;
  createdAt: string;
  updatedAt: string;
  steps: StepItem[];
  currentStep: string;
  onStepClick: (stepId: string) => void;
  disabledSteps?: string[];
  onButton1Click?: () => void;
  onButton2Click?: () => void;
  onButton3Click?: () => void;
}

export function LeadStepWrapper({
  customerName,
  createdAt,
  updatedAt,
  steps,
  currentStep,
  onStepClick,
  disabledSteps,
  onButton1Click,
  onButton2Click,
  onButton3Click,
}: LeadStepWrapperProps) {
  return (
    <div className={styles.wrapper}>
      <Step
        steps={steps}
        currentStep={currentStep}
        onStepClick={onStepClick}
        disabledSteps={disabledSteps}
        className={styles.stepComponent}
      />
      <StepInfo
        customerName={customerName}
        createdAt={createdAt}
        updatedAt={updatedAt}
        onButton1Click={onButton1Click}
        onButton2Click={onButton2Click}
        onButton3Click={onButton3Click}
      />
    </div>
  );
}
