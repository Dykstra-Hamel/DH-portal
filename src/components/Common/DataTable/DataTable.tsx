'use client';

import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
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
  infiniteScrollEnabled = false,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  searchEnabled = true,
  searchPlaceholder = 'Search...',
  customComponents,
  className = '',
  emptyStateMessage = 'No items found for this category.',
  tableType = 'tickets',
  customColumnWidths,
  defaultSort,
  onShowToast,
  // Callbacks
  onTabChange,
  onSortChange,
  onSearchChange,
}: DataTableProps<T>) {
  // Internal state - DataTable manages its own UI state
  const [activeTab, setActiveTab] = useState<string>(tabs?.[0]?.key || 'all');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(defaultSort || null);
  const [searchQuery, setSearchQuery] = useState('');

  // Handler functions - update internal state AND notify parent
  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
    onTabChange?.(newTab); // Notify parent to fetch new data
  }, [onTabChange]);

  const handleSearchChange = useCallback((newQuery: string) => {
    setSearchQuery(newQuery);
    onSearchChange?.(newQuery); // Notify parent to fetch filtered data
  }, [onSearchChange]);

  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Infinite scroll refs and state
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const dataRowsRef = useRef<HTMLDivElement>(null);

  // Filter data based on active tab
  const filteredData = useMemo(() => {
    if (!tabs) return data;
    const activeTabConfig = tabs.find(tab => tab.key === activeTab);
    if (!activeTabConfig) return data;
    return activeTabConfig.filter(data);
  }, [data, activeTab, tabs]);

  // Apply search filter to data
  const searchedData = useMemo(() => {
    if (!searchEnabled || !searchQuery.trim()) return filteredData;

    const query = searchQuery.toLowerCase();

    // Recursive function to search through all values in an object
    const searchInObject = (obj: any): boolean => {
      if (obj === null || obj === undefined) return false;

      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.some(item => searchInObject(item));
      }

      // Handle objects
      if (typeof obj === 'object') {
        return Object.values(obj).some(value => searchInObject(value));
      }

      // Handle primitive values
      return String(obj).toLowerCase().includes(query);
    };

    return filteredData.filter(item => searchInObject(item));
  }, [filteredData, searchQuery, searchEnabled]);

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
    if (!sortConfig) return searchedData;

    return [...searchedData].sort((a, b) => {
      const modifier = sortConfig.direction === 'asc' ? 1 : -1;

      // Get the column definition to check for custom sort key
      const column = columns.find(
        col => col.sortKey === sortConfig.key || col.key === sortConfig.key
      );
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
  }, [searchedData, sortConfig, columns]);

  // Calculate counts for each tab
  const tabsWithCounts = useMemo(() => {
    if (!tabs) return [];
    return tabs.map(tab => ({
      ...tab,
      count: tab.getCount(data),
    }));
  }, [tabs, data]);

  // Infinite scroll intersection observer
  const handleLoadMore = useCallback(() => {
    if (infiniteScrollEnabled && hasMore && !loadingMore && onLoadMore) {
      onLoadMore();
    }
  }, [infiniteScrollEnabled, hasMore, loadingMore, onLoadMore]);

  useEffect(() => {
    if (!infiniteScrollEnabled || !loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      entries => {
        const target = entries[0];
        if (target.isIntersecting) {
          handleLoadMore();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    const currentLoadMoreRef = loadMoreRef.current;
    observer.observe(currentLoadMoreRef);

    return () => {
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [handleLoadMore, infiniteScrollEnabled]);

  // Handle toast
  const handleShowToast = useCallback((message: string) => {
    setToastMessage(message);
    setShowToast(true);
    onShowToast?.(message);
  }, [onShowToast]);

  const handleToastClose = () => {
    setShowToast(false);
    setToastMessage('');
  };

  // Handle item actions
  const handleItemAction = (action: string, item: T) => {
    onItemAction?.(action, item);
  };

  // Get table-specific class
  const getTableClass = () => {
    switch (tableType) {
      case 'supportCases':
        return styles.supportCaseTable;
      case 'leads':
        return styles.leadTable;
      case 'calls':
        return styles.callTable;
      case 'form_submissions':
        return styles.callTable; // Reuse call table styling
      case 'customers':
        return styles.customerTable;
      case 'tasks':
        return styles.taskTable;
      case 'tickets':
      default:
        return styles.ticketTable;
    }
  };
  const tableClass = getTableClass();

  return (
    <>
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={handleToastClose}
      />
      <div
        className={`${styles.container} ${tableClass} ${className}`}
        style={
          customColumnWidths
            ? ({ '--table-columns': customColumnWidths } as React.CSSProperties)
            : undefined
        }
      >
        <div className={styles.topContent}>
          <h1 className={styles.pageTitle}>{title}</h1>
          {/* Search Field */}
          {searchEnabled && (
            <div className={styles.searchContainer}>
              <input
                type="text"
                className={styles.searchInput}
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
              />
            </div>
          )}
          {/* Tab Navigation */}
          {tabs && tabs.length > 0 && (
            <div className={styles.tabsContainer}>
              {tabsWithCounts.map(tab => (
                <button
                  key={tab.key}
                  className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
                  onClick={() => handleTabChange(tab.key)}
                >
                  <span className={styles.tabText}>{tab.label}</span>
                  <span className={styles.tabCount}>{tab.count}</span>
                </button>
              ))}
            </div>
          )}
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
            <div className={styles.emptyState}>{emptyStateMessage}</div>
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
              <div className={styles.dataRows} ref={dataRowsRef}>
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

                {/* Infinite Scroll Loading Indicator */}
                {infiniteScrollEnabled && (
                  <div ref={loadMoreRef} className={styles.loadMoreIndicator}>
                    {loadingMore && (
                      <div className={styles.loadMoreSpinner}>
                        <div className={styles.spinner}></div>
                        <span>Loading more...</span>
                      </div>
                    )}
                    {hasMore && !loadingMore && (
                      <div className={styles.loadMorePlaceholder}>
                        {/* This div is used for intersection observer trigger */}
                      </div>
                    )}
                  </div>
                )}
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
