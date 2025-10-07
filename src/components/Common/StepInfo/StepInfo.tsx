import { useState, useEffect, useRef, ReactNode } from 'react';
import { formatDateForDisplay } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';
import styles from './StepInfo.module.scss';

interface DropdownAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

interface StepInfoProps {
  customerName: string;
  createdAt: string;
  updatedAt: string;
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

export function StepInfo({
  customerName,
  createdAt,
  updatedAt,
  primaryButtonText,
  secondaryButtonText,
  middleButtonText,
  onPrimaryButtonClick,
  onSecondaryButtonClick,
  onMiddleButtonClick,
  showPrimaryButton = true,
  showSecondaryButton = true,
  showMiddleButton = false,
  middleButtonDisabled = false,
  middleButtonTooltip,
  dropdownActions = [],
  showDropdown = false,
  primaryButtonVariant = 'default',
}: StepInfoProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleDropdownToggle = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleActionClick = (action: DropdownAction) => {
    action.onClick();
    setIsDropdownOpen(false);
  };
  return (
    <div className={styles.pageHeader}>
      <h1 className={styles.customerName}>{customerName}</h1>
      <div className={styles.timestamps}>
        <span className={styles.timestamp}>
          <span className={styles.timestampLabel}>Created:</span>{' '}
          {formatDateForDisplay(createdAt)}
        </span>
        <span className={styles.timestamp}>
          <span className={styles.timestampLabel}>Last Update:</span>{' '}
          {formatDateForDisplay(updatedAt)}
        </span>
      </div>
      <div className={styles.actionButtons}>
        {showSecondaryButton && (
          <button
            className={styles.secondaryButton}
            onClick={onSecondaryButtonClick}
          >
            {secondaryButtonText || '+ Add Task'}
          </button>
        )}
        {showMiddleButton && (
          <div
            className={styles.middleButtonContainer}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <button
              className={`${styles.middleButton} ${middleButtonDisabled ? styles.disabled : ''}`}
              onClick={onMiddleButtonClick}
              disabled={middleButtonDisabled}
            >
              {middleButtonText || 'Middle Action'}
            </button>
            {showTooltip && middleButtonTooltip && (
              <div className={styles.tooltip}>{middleButtonTooltip}</div>
            )}
          </div>
        )}
        {showPrimaryButton && (
          <button
            className={`${styles.primaryActionButton} ${primaryButtonVariant === 'success' ? styles.successButton : ''}`}
            onClick={onPrimaryButtonClick}
          >
            {primaryButtonText || 'Next Step'}
          </button>
        )}
        {showDropdown && (
          <div className={styles.dropdownContainer} ref={dropdownRef}>
            <button
              className={styles.dropdownButton}
              onClick={handleDropdownToggle}
            >
              Actions
              <ChevronDown
                size={20}
                className={`${styles.chevronIcon} ${isDropdownOpen ? styles.rotated : ''}`}
              />
            </button>
            {isDropdownOpen && (
              <div className={styles.dropdownMenu}>
                {dropdownActions.map((action, index) => (
                  <button
                    key={index}
                    className={`${styles.dropdownOption} ${action.disabled ? styles.disabled : ''}`}
                    onClick={() => handleActionClick(action)}
                    disabled={action.disabled}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
