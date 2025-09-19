'use client';

import React, { useState, useMemo } from 'react';
import SortableColumnHeader from '@/components/Common/SortableColumnHeader/SortableColumnHeader';
import { Toast } from '@/components/Common/Toast';
import DefaultItemRow from './DefaultItemRow';
import { DataTableProps, SortConfig } from './DataTable.types';
import styles from './DataTable.module.scss';

export default function DataTable<T>({
  data,
  loading = false,
  title,
  columns,
  tabs,
  onItemAction,
  onDataUpdated,
  customComponents,
  className = '',
  emptyStateMessage = 'No items found for this category.',
  tableType = 'tickets',
  onShowToast,
}: DataTableProps<T>) {
  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.key || 'all');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  
  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Filter data based on active tab
  const filteredData = useMemo(() => {
    const activeTabConfig = tabs.find(tab => tab.key === activeTab);
    if (!activeTabConfig) return data;
    return activeTabConfig.filter(data);
  }, [data, activeTab, tabs]);

  // Handle sorting
  const handleSort = (key: string) => {
    setSortConfig(prevSort => {
      if (!prevSort || prevSort.key !== key) {
        return { key, direction: 'asc' };
      }
      if (prevSort.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null; // Clear sort
    });
  };

  // Sort data based on current sort configuration
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const modifier = sortConfig.direction === 'asc' ? 1 : -1;
      
      // Get the column definition to check for custom sort key
      const column = columns.find(col => col.sortKey === sortConfig.key || col.key === sortConfig.key);
      const sortKey = column?.sortKey || sortConfig.key;
      
      // Helper function to get nested property value
      const getNestedValue = (obj: any, path: string): any => {
        return path.split('.').reduce((current, key) => current?.[key], obj);
      };
      
      const aValue = getNestedValue(a, String(sortKey));
      const bValue = getNestedValue(b, String(sortKey));
      
      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * modifier;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * modifier;
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return (aValue.getTime() - bValue.getTime()) * modifier;
      }
      
      // Convert to string for comparison as fallback
      const aStr = String(aValue || '');
      const bStr = String(bValue || '');
      return aStr.localeCompare(bStr) * modifier;
    });
  }, [filteredData, sortConfig, columns]);

  // Calculate counts for each tab
  const tabsWithCounts = useMemo(() => {
    return tabs.map(tab => ({
      ...tab,
      count: tab.getCount(data),
    }));
  }, [tabs, data]);

  // Handle toast
  const handleShowToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    onShowToast?.(message);
  };

  const handleToastClose = () => {
    setShowToast(false);
    setToastMessage('');
  };

  // Handle item actions
  const handleItemAction = (action: string, item: T) => {
    onItemAction?.(action, item);
  };

  // Get table-specific class
  const tableClass = tableType === 'supportCases' ? styles.supportCaseTable : styles.ticketTable;

  return (
    <>
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={handleToastClose}
      />
      <div className={`${styles.container} ${tableClass} ${className}`}>
        <div className={styles.topContent}>
          <h1 className={styles.pageTitle}>{title}</h1>

          {/* Tab Navigation */}
          <div className={styles.tabsContainer}>
            {tabsWithCounts.map(tab => (
              <button
                key={tab.key}
                className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                <span className={styles.tabText}>{tab.label}</span>
                <span className={styles.tabCount}>{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className={styles.contentArea}>
          {/* Live Bar Component */}
          {customComponents?.liveBar && (
            <customComponents.liveBar data={data} />
          )}
          
          {loading ? (
            <div className={styles.loading}>Loading...</div>
          ) : sortedData.length === 0 ? (
            <div className={styles.emptyState}>
              {emptyStateMessage}
            </div>
          ) : (
            <div className={styles.dataContainer}>
              {/* Header Row */}
              <div className={styles.headerRow}>
                {columns.map(column => (
                  <SortableColumnHeader
                    key={column.key}
                    title={column.title}
                    sortKey={String(column.sortKey || column.key)}
                    currentSort={sortConfig}
                    onSort={handleSort}
                    width={column.width}
                    sortable={column.sortable !== false} // Default to sortable unless explicitly disabled
                  />
                ))}
              </div>

              {/* Data Rows */}
              <div className={styles.dataRows}>
                {sortedData.map((item, index) => {
                  // Use custom row component if provided, otherwise use default
                  if (customComponents?.itemRow) {
                    const ItemRowComponent = customComponents.itemRow;
                    return (
                      <ItemRowComponent
                        key={index}
                        item={item}
                        onAction={handleItemAction}
                      />
                    );
                  }
                  
                  return (
                    <DefaultItemRow
                      key={index}
                      item={item}
                      columns={columns}
                      onAction={handleItemAction}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Custom Modal Component */}
        {customComponents?.actionModal && (
          <customComponents.actionModal
            item={null} // This would be managed by the parent component
            isOpen={false} // This would be managed by the parent component
            onClose={() => {}} // This would be managed by the parent component
            onAction={handleItemAction}
          />
        )}
      </div>
    </>
  );
}