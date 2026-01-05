'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Phone, MessageSquare, Mail } from 'lucide-react';
import styles from './ActionTypeDropdown.module.scss';

export interface ActionType {
  id: string;
  label: string;
}

interface ActionTypeDropdownProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const ACTION_TYPES: ActionType[] = [
  { id: 'outbound_call', label: 'Outbound Call' },
  { id: 'text_message', label: 'Text Message' },
  { id: 'ai_call', label: 'AI Call' },
  { id: 'email', label: 'Email' },
];

export function ActionTypeDropdown({
  value,
  onChange,
  disabled = false,
}: ActionTypeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = ACTION_TYPES.find(opt => opt.id === value);
  const displayText = selectedOption?.label || 'Select action type';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getIcon = (actionId: string) => {
    switch (actionId) {
      case 'outbound_call':
      case 'ai_call':
        return <Phone size={20} />;
      case 'text_message':
        return <MessageSquare size={20} />;
      case 'email':
        return <Mail size={20} />;
      default:
        return null;
    }
  };

  const handleSelect = (actionId: string) => {
    onChange(actionId);
    setIsOpen(false);
  };

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <button
        type="button"
        className={`${styles.trigger} ${disabled ? styles.disabled : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <div className={styles.triggerContent}>
          {value && (
            <div className={styles.icon}>
              {getIcon(value)}
            </div>
          )}
          <span className={styles.label}>{displayText}</span>
        </div>
        <ChevronDown size={20} className={styles.chevron} />
      </button>

      {isOpen && (
        <div className={styles.menu}>
          {ACTION_TYPES.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`${styles.option} ${value === option.id ? styles.selected : ''}`}
              onClick={() => handleSelect(option.id)}
            >
              <div className={styles.icon}>
                {getIcon(option.id)}
              </div>
              <span className={styles.optionLabel}>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
