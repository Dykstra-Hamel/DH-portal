import { useState, useEffect, useRef } from 'react';
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
  primaryButtonText?: string;
  secondaryButtonText?: string;
  onPrimaryButtonClick?: () => void;
  onSecondaryButtonClick?: () => void;
  showPrimaryButton?: boolean;
  showSecondaryButton?: boolean;
  dropdownActions?: DropdownAction[];
  showDropdown?: boolean;
}

export function StepInfo({
  customerName,
  createdAt,
  updatedAt,
  primaryButtonText,
  secondaryButtonText,
  onPrimaryButtonClick,
  onSecondaryButtonClick,
  showPrimaryButton = true,
  showSecondaryButton = true,
  dropdownActions = [],
  showDropdown = false
}: StepInfoProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
      <h1 className={styles.customerName}>
        {customerName}
      </h1>
      <div className={styles.timestamps}>
        <span className={styles.timestamp}>
          Created: {formatDateForDisplay(createdAt)}
        </span>
        <span className={styles.timestamp}>
          Last Update: {formatDateForDisplay(updatedAt)}
        </span>
      </div>
      <div className={styles.actionButtons}>
        {showDropdown ? (
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
        ) : (
          <>
            {showSecondaryButton && (
              <button
                className={styles.secondaryButton}
                onClick={onSecondaryButtonClick}
              >
                {secondaryButtonText || 'Mark as Lost'}
              </button>
            )}
            {showPrimaryButton && (
              <button
                className={styles.actionButton}
                onClick={onPrimaryButtonClick}
              >
                {primaryButtonText || 'Next Step'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}