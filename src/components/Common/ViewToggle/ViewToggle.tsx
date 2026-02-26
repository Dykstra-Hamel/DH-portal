'use client';

import { ReactNode } from 'react';
import styles from './ViewToggle.module.scss';

export interface ViewOption {
  value: string;
  icon: ReactNode;
  label: string;
}

interface ViewToggleProps {
  value: string;
  options: ViewOption[];
  onChange: (value: string) => void;
  className?: string;
}

export function ViewToggle({ value, options, onChange, className }: ViewToggleProps) {
  return (
    <div className={`${styles.viewToggle} ${className || ''}`}>
      {options.map((option) => (
        <button
          key={option.value}
          className={`${styles.toggleButton} ${value === option.value ? styles.active : ''}`}
          onClick={() => onChange(option.value)}
          title={option.label}
          aria-label={option.label}
          aria-pressed={value === option.value}
          type="button"
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}
