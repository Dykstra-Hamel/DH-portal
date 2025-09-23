'use client';

import React from 'react';
import { DefaultItemRowProps } from './DataTable.types';
import styles from './DataTable.module.scss';

export default function DefaultItemRow<T>({
  item,
  columns,
  onAction
}: DefaultItemRowProps<T>) {
  
  // Helper function to get nested property value
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  // Helper function to format cell value
  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '--';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  return (
    <div className={styles.defaultRow}>
      {columns.map((column, index) => {
        const value = getNestedValue(item, column.key);
        const cellContent = column.render ? column.render(item, onAction) : formatCellValue(value);
        
        return (
          <div
            key={`${column.key}-${index}`}
            className={styles.defaultCell}
          >
            {cellContent}
          </div>
        );
      })}
    </div>
  );
}