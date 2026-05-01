'use client';

import React from 'react';
import {
  Department,
  DepartmentType,
  DEPARTMENT_CONFIG,
  getDepartmentLabel,
  getDepartmentColor,
  getDepartmentIcon,
  validateDepartments
} from '@/types/user';
import styles from './DepartmentSelector.module.scss';

const PROPERTY_TYPE_OPTIONS: { value: DepartmentType; label: string }[] = [
  { value: 'residential', label: 'Residential' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'both', label: 'Both' },
];

interface DepartmentSelectorProps {
  selectedDepartments: Department[];
  onDepartmentChange: (departments: Department[]) => void;
  disabled?: boolean;
  error?: string;
  showLabels?: boolean;
  layout?: 'vertical' | 'horizontal';
  size?: 'small' | 'medium' | 'large';
  departmentTypes?: Partial<Record<Department, DepartmentType | null>>;
  onDepartmentTypeChange?: (department: Department, type: DepartmentType) => void;
  propertyTypeEnabled?: { technician: boolean; inspector: boolean };
  departmentTypeErrors?: Partial<Record<Department, string>>;
}

export function DepartmentSelector({
  selectedDepartments,
  onDepartmentChange,
  disabled = false,
  error,
  showLabels = true,
  layout = 'vertical',
  size = 'medium',
  departmentTypes,
  onDepartmentTypeChange,
  propertyTypeEnabled,
  departmentTypeErrors,
}: DepartmentSelectorProps) {
  const handleDepartmentToggle = (department: Department) => {
    if (disabled) return;

    const newDepartments = selectedDepartments.includes(department)
      ? selectedDepartments.filter(d => d !== department)
      : [...selectedDepartments, department];

    onDepartmentChange(newDepartments);
  };

  const validation = validateDepartments(selectedDepartments);

  const requiresPropertyType = (department: Department): boolean => {
    if (!propertyTypeEnabled) return false;
    if (department === 'technician') return Boolean(propertyTypeEnabled.technician);
    if (department === 'inspector') return Boolean(propertyTypeEnabled.inspector);
    return false;
  };

  return (
    <div className={`${styles.container} ${styles[layout]} ${styles[size]}`}>
      <div className={styles.departmentGrid}>
        {Object.entries(DEPARTMENT_CONFIG).map(([key, config]) => {
          const department = key as Department;
          const isSelected = selectedDepartments.includes(department);

          const showPropertyType = isSelected && requiresPropertyType(department);
          const selectedPropertyType = departmentTypes?.[department] ?? null;
          const propertyTypeError = departmentTypeErrors?.[department];

          return (
            <div key={department} className={styles.departmentOptionWrapper}>
              <label
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

              {showPropertyType && (
                <div className={styles.propertyTypeRow}>
                  <span className={styles.propertyTypeLabel}>Property type:</span>
                  <div
                    role="radiogroup"
                    aria-label={`${getDepartmentLabel(department)} property type`}
                    className={styles.propertyTypeOptions}
                  >
                    {PROPERTY_TYPE_OPTIONS.map((option) => {
                      const checked = selectedPropertyType === option.value;
                      return (
                        <label
                          key={option.value}
                          className={`${styles.propertyTypeOption} ${checked ? styles.propertyTypeSelected : ''} ${disabled ? styles.disabled : ''}`}
                        >
                          <input
                            type="radio"
                            name={`${department}-property-type`}
                            value={option.value}
                            checked={checked}
                            disabled={disabled}
                            onChange={() =>
                              onDepartmentTypeChange?.(department, option.value)
                            }
                          />
                          <span>{option.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  {propertyTypeError && (
                    <div className={styles.propertyTypeError}>{propertyTypeError}</div>
                  )}
                </div>
              )}
            </div>
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