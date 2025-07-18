'use client';

import React from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { SortDirection } from '@/types/common';
import styles from './SortableTableHeader.module.scss';

interface SortableTableHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey?: string;
  currentSortDirection?: SortDirection;
  onSort: (key: string) => void;
  className?: string;
}

const SortableTableHeader: React.FC<SortableTableHeaderProps> = ({
  label,
  sortKey,
  currentSortKey,
  currentSortDirection,
  onSort,
  className = ''
}) => {
  const isActive = currentSortKey === sortKey;
  const isAscending = currentSortDirection === 'asc';

  const handleClick = () => {
    onSort(sortKey);
  };

  return (
    <th className={`${styles.sortableHeader} ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className={`${styles.sortButton} ${isActive ? styles.active : ''}`}
      >
        <span className={styles.label}>{label}</span>
        <div className={styles.sortIcons}>
          {isActive ? (
            isAscending ? (
              <ChevronUp className={styles.activeIcon} size={16} />
            ) : (
              <ChevronDown className={styles.activeIcon} size={16} />
            )
          ) : (
            <div className={styles.inactiveIcons}>
              <ChevronUp className={styles.inactiveIcon} size={12} />
              <ChevronDown className={styles.inactiveIcon} size={12} />
            </div>
          )}
        </div>
      </button>
    </th>
  );
};

export default SortableTableHeader;