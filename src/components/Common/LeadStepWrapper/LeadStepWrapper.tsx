import { Step, StepItem } from '@/components/Common/Step/Step';
import { StepInfo } from '@/components/Common/StepInfo/StepInfo';
import styles from './LeadStepWrapper.module.scss';

interface DropdownAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface LeadStepWrapperProps {
  customerName: string;
  createdAt: string;
  updatedAt: string;
  steps: StepItem[];
  currentStep: string;
  onStepClick: (stepId: string) => void;
  disabledSteps?: string[];
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryButtonClick?: () => void;
  onSecondaryButtonClick?: () => void;
  showPrimaryButton?: boolean;
  showSecondaryButton?: boolean;
  dropdownActions?: DropdownAction[];
  showDropdown?: boolean;
}

export function LeadStepWrapper({
  customerName,
  createdAt,
  updatedAt,
  steps,
  currentStep,
  onStepClick,
  disabledSteps,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryButtonClick,
  onSecondaryButtonClick,
  showPrimaryButton,
  showSecondaryButton,
  dropdownActions,
  showDropdown,
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
        primaryButtonText={primaryButtonText}
        secondaryButtonText={secondaryButtonText}
        onPrimaryButtonClick={onPrimaryButtonClick}
        onSecondaryButtonClick={onSecondaryButtonClick}
        showPrimaryButton={showPrimaryButton}
        showSecondaryButton={showSecondaryButton}
        dropdownActions={dropdownActions}
        showDropdown={showDropdown}
      />
    </div>
  );
}
