'use client';

import React from 'react';
import styles from './SortableColumnHeader.module.scss';

interface SortableColumnHeaderProps {
  title: string;
  sortKey: string;
  currentSort: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
  className?: string;
  width?: string;
  sortable?: boolean;
}

const SortIcon = ({ 
  direction, 
  isActive 
}: { 
  direction?: 'asc' | 'desc' | null; 
  isActive: boolean;
}) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="16" 
    height="16" 
    viewBox="0 0 16 16" 
    fill="none"
    className={`${styles.sortIcon} ${isActive ? styles.active : ''} ${direction ? styles[direction] : ''}`}
  >
    <path 
      d="M4.66663 10L7.99996 13.3334L11.3333 10M4.66663 6.00002L7.99996 2.66669L11.3333 6.00002" 
      stroke="#A3A3A3" 
      strokeWidth="1.33333" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
);

export default function SortableColumnHeader({
  title,
  sortKey,
  currentSort,
  onSort,
  className,
  width,
  sortable = true
}: SortableColumnHeaderProps) {
  const isActive = currentSort?.key === sortKey;
  const direction = isActive ? currentSort?.direction : null;

  const handleClick = () => {
    if (sortable) {
      onSort(sortKey);
    }
  };

  return (
    <div 
      className={`${styles.columnHeader} ${sortable ? styles.sortable : styles.nonSortable} ${className || ''}`}
      style={{ width }}
      onClick={handleClick}
    >
      <span className={styles.title}>{title}</span>
      {sortable && <SortIcon direction={direction} isActive={isActive} />}
    </div>
  );
}