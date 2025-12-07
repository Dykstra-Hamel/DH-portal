'use client';

import React from 'react';
import {
  Department,
  DEPARTMENT_CONFIG,
  getDepartmentLabel,
  getDepartmentColor,
  getDepartmentIcon,
  validateDepartments
} from '@/types/user';
import styles from './DepartmentSelector.module.scss';

interface DepartmentSelectorProps {
  selectedDepartments: Department[];
  onDepartmentChange: (departments: Department[]) => void;
  disabled?: boolean;
  error?: string;
  showLabels?: boolean;
  layout?: 'vertical' | 'horizontal';
  size?: 'small' | 'medium' | 'large';
}

export function DepartmentSelector({
  selectedDepartments,
  onDepartmentChange,
  disabled = false,
  error,
  showLabels = true,
  layout = 'vertical',
  size = 'medium'
}: DepartmentSelectorProps) {
  const handleDepartmentToggle = (department: Department) => {
    if (disabled) return;

    const newDepartments = selectedDepartments.includes(department)
      ? selectedDepartments.filter(d => d !== department)
      : [...selectedDepartments, department];

    onDepartmentChange(newDepartments);
  };

  const validation = validateDepartments(selectedDepartments);

  return (
    <div className={`${styles.container} ${styles[layout]} ${styles[size]}`}>
      <div className={styles.departmentGrid}>
        {Object.entries(DEPARTMENT_CONFIG).map(([key, config]) => {
          const department = key as Department;
          const isSelected = selectedDepartments.includes(department);

          return (
            <label
              key={department}
              className={`${styles.departmentOption} ${isSelected ? styles.selected : ''} ${disabled ? styles.disabled : ''}`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleDepartmentToggle(department)}
                disabled={disabled}
                className={styles.checkbox}
              />

              <div className={styles.departmentContent}>
                <div
                  className={styles.departmentIcon}
                  style={{
                    backgroundColor: isSelected ? getDepartmentColor(department) : '#f3f4f6'
                  }}
                >
                  <span className={styles.icon}>
                    {getDepartmentIcon(department)}
                  </span>
                </div>

                {showLabels && (
                  <div className={styles.departmentInfo}>
                    <div className={styles.departmentLabel}>
                      {getDepartmentLabel(department)}
                    </div>
                    <div className={styles.departmentDescription}>
                      {config.description}
                    </div>
                  </div>
                )}
              </div>
            </label>
          );
        })}
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {!validation.isValid && validation.errors.length > 0 && (
        <div className={styles.validation}>
          {validation.errors.map((validationError, index) => (
            <div key={index} className={styles.validationError}>
              {validationError}
            </div>
          ))}
        </div>
      )}

      <div className={styles.summary}>
        {selectedDepartments.length === 0 ? (
          <span className={styles.noSelection}>No departments selected</span>
        ) : (
          <span className={styles.selectionSummary}>
            {selectedDepartments.length} department{selectedDepartments.length !== 1 ? 's' : ''} selected
          </span>
        )}
      </div>
    </div>
  );
}

// Compact version for displaying selected departments
interface DepartmentBadgesProps {
  departments: Department[];
  size?: 'small' | 'medium';
  showIcons?: boolean;
  maxDisplay?: number;
}

export function DepartmentBadges({
  departments,
  size = 'medium',
  showIcons = true,
  maxDisplay
}: DepartmentBadgesProps) {
  const displayDepartments = maxDisplay ? departments.slice(0, maxDisplay) : departments;
  const hasMore = maxDisplay && departments.length > maxDisplay;

  if (departments.length === 0) {
    return <span className={styles.noDepartments}>No departments</span>;
  }

  return (
    <div className={`${styles.badgeContainer} ${styles[size]}`}>
      {displayDepartments.map(department => (
        <span
          key={department}
          className={styles.departmentBadge}
          style={{
            backgroundColor: getDepartmentColor(department),
            color: 'white'
          }}
        >
          {showIcons && (
            <span className={styles.badgeIcon}>
              {getDepartmentIcon(department)}
            </span>
          )}
          {getDepartmentLabel(department)}
        </span>
      ))}
      {hasMore && (
        <span className={styles.moreBadge}>
          +{departments.length - maxDisplay!} more
        </span>
      )}
    </div>
  );
}

// Simple list version
interface DepartmentListProps {
  departments: Department[];
  showIcons?: boolean;
  separator?: string;
}

export function DepartmentList({
  departments,
  showIcons = false,
  separator = ', '
}: DepartmentListProps) {
  if (departments.length === 0) {
    return <span className={styles.emptyList}>No departments assigned</span>;
  }

  return (
    <span className={styles.departmentList}>
      {departments.map((department, index) => (
        <span key={department}>
          {showIcons && (
            <span className={styles.listIcon}>
              {getDepartmentIcon(department)}
            </span>
          )}
          {getDepartmentLabel(department)}
          {index < departments.length - 1 && separator}
        </span>
      ))}
    </span>
  );
}