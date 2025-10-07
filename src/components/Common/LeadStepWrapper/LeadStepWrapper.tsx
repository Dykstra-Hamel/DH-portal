import { ReactNode } from 'react';
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
  primaryButtonText?: string | ReactNode;
  secondaryButtonText?: string | ReactNode;
  middleButtonText?: string | ReactNode;
  onPrimaryButtonClick?: () => void;
  onSecondaryButtonClick?: () => void;
  onMiddleButtonClick?: () => void;
  showPrimaryButton?: boolean;
  showSecondaryButton?: boolean;
  showMiddleButton?: boolean;
  middleButtonDisabled?: boolean;
  middleButtonTooltip?: string;
  dropdownActions?: DropdownAction[];
  showDropdown?: boolean;
  primaryButtonVariant?: 'default' | 'success';
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
  middleButtonText,
  onPrimaryButtonClick,
  onSecondaryButtonClick,
  onMiddleButtonClick,
  showPrimaryButton,
  showSecondaryButton,
  showMiddleButton,
  middleButtonDisabled,
  middleButtonTooltip,
  dropdownActions,
  showDropdown,
  primaryButtonVariant,
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
        middleButtonText={middleButtonText}
        onPrimaryButtonClick={onPrimaryButtonClick}
        onSecondaryButtonClick={onSecondaryButtonClick}
        onMiddleButtonClick={onMiddleButtonClick}
        showPrimaryButton={showPrimaryButton}
        showSecondaryButton={showSecondaryButton}
        showMiddleButton={showMiddleButton}
        middleButtonDisabled={middleButtonDisabled}
        middleButtonTooltip={middleButtonTooltip}
        dropdownActions={dropdownActions}
        showDropdown={showDropdown}
        primaryButtonVariant={primaryButtonVariant}
      />
    </div>
  );
}
