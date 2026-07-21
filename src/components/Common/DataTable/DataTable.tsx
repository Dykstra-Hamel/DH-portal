'use client';

import React, {
  useState,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from 'react';
import SortableColumnHeader from '@/components/Common/SortableColumnHeader/SortableColumnHeader';
import { Toast } from '@/components/Common/Toast';
import DefaultItemRow from './DefaultItemRow';
import CardItemRow from './CardItemRow';
import { DataTableProps, SortConfig } from './DataTable.types';
import styles from './DataTable.module.scss';

// Watches a max-width media query and returns whether it currently matches.
// Initialized to `false` so server-rendered markup (desktop) matches the
// client's first paint, then flips on mount if the viewport is narrow.
function useIsNarrow(breakpoint: number): boolean {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia(`(max-width: ${breakpoint}px)`);
    setNarrow(mq.matches);
    const handler = (e: MediaQueryListEvent) => setNarrow(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [breakpoint]);
  return narrow;
}

export default function DataTable<T>({
  data,
  loading = false,
  title,
  columns,
  tabs,
  onItemAction,
  onDataUpdated,
  infiniteScrollEnabled = false,
  visibleCount,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  preserveWindowScrollAnchor = false,
  searchEnabled = true,
  searchPlaceholder = 'Search...',
  customComponents,
  className = '',
  emptyStateMessage = 'No items found for this category.',
  tableType = 'tickets',
  customColumnWidths,
  cardView,
  cardBreakpoint = 1280,
  defaultSort,
  pinnedSortFn,
  onShowToast,
  // Callbacks
  onTabChange,
  onSortChange,
  onSearchChange,
}: DataTableProps<T>) {
  const isNarrow = useIsNarrow(cardBreakpoint);
  const useCardView = !!cardView;

  // Internal state - DataTable manages its own UI state
  const [activeTab, setActiveTab] = useState<string>(tabs?.[0]?.key || 'all');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(
    defaultSort || null
  );
  // Tracks whether the user has explicitly clicked a column header to sort.
  // When false, pinnedSortFn (e.g. urgent-first) still applies alongside defaultSort.
  // When true, the user's chosen sort takes full control.
  const [userHasSorted, setUserHasSorted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Handler functions - update internal state AND notify parent
  const handleTabChange = useCallback(
    (newTab: string) => {
      setActiveTab(newTab);
      onTabChange?.(newTab); // Notify parent to fetch new data
    },
    [onTabChange]
  );

  const handleSearchChange = useCallback(
    (newQuery: string) => {
      setSearchQuery(newQuery);
      onSearchChange?.(newQuery); // Notify parent to fetch filtered data
    },
    [onSearchChange]
  );

  // Keep search visible when there's a query
  useEffect(() => {
    if (searchQuery) {
      setIsSearchOpen(true);
    }
  }, [searchQuery]);

  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Infinite scroll refs and state
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const dataRowsRef = useRef<HTMLDivElement>(null);
  const anchorRowRef = useRef<{ rowKey: string; top: number } | null>(null);
  const prevLoadingMoreRef = useRef(loadingMore);

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
  const handleSort = useCallback(
    (key: string) => {
      setSortConfig(prevSort => {
        let newSort: SortConfig | null;
        if (!prevSort || prevSort.key !== key) {
          newSort = { key, direction: 'asc' };
        } else if (prevSort.direction === 'asc') {
          newSort = { key, direction: 'desc' };
        } else {
          newSort = null; // Clear sort
        }

        // Track whether the user has actively chosen a sort column.
        // Cleared back to false when the user cycles back to no sort.
        setUserHasSorted(newSort !== null);

        return newSort;
      });

      // Calculate the new sort outside of setState for immediate callback
      const prevSort = sortConfig;
      let newSort: SortConfig | null;
      if (!prevSort || prevSort.key !== key) {
        newSort = { key, direction: 'asc' };
      } else if (prevSort.direction === 'asc') {
        newSort = { key, direction: 'desc' };
      } else {
        newSort = null; // Clear sort
      }

      // Always notify parent of sort change (including when clearing)
      if (newSort) {
        onSortChange?.(newSort.key, newSort.direction);
      } else if (onSortChange) {
        // When clearing sort, notify parent with default sort or no sort
        // For now, we'll just call with the original key and 'asc' to reset
        onSortChange(key, 'asc');
      }
    },
    [sortConfig, onSortChange]
  );

  // Sort data based on current sort configuration
  const sortedData = useMemo(() => {
    // User has explicitly clicked a column — their sort takes full control
    if (userHasSorted && sortConfig) {
      return [...searchedData].sort((a, b) => {
        const modifier = sortConfig.direction === 'asc' ? 1 : -1;

        const column = columns.find(
          col => col.sortKey === sortConfig.key || col.key === sortConfig.key
        );
        const sortKey = column?.sortKey || sortConfig.key;

        const getNestedValue = (obj: any, path: string): any =>
          path.split('.').reduce((current, key) => current?.[key], obj);

        const aValue = getNestedValue(a, String(sortKey));
        const bValue = getNestedValue(b, String(sortKey));

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue) * modifier;
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return (aValue - bValue) * modifier;
        }
        if (aValue instanceof Date && bValue instanceof Date) {
          return (aValue.getTime() - bValue.getTime()) * modifier;
        }
        const aStr = String(aValue || '');
        const bStr = String(bValue || '');
        return aStr.localeCompare(bStr) * modifier;
      });
    }

    // Default state (page load / sort cleared) — pinnedSortFn wins, defaultSort as tiebreaker
    if (!pinnedSortFn && !sortConfig) return searchedData;

    return [...searchedData].sort((a, b) => {
      if (pinnedSortFn) {
        const pinnedResult = pinnedSortFn(a, b);
        if (pinnedResult !== 0) return pinnedResult;
      }

      if (!sortConfig) return 0;

      const modifier = sortConfig.direction === 'asc' ? 1 : -1;

      // Get the column definition to check for a custom sort key
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
  }, [searchedData, sortConfig, columns, pinnedSortFn, userHasSorted]);

  const visibleSortedData = useMemo(() => {
    if (
      !infiniteScrollEnabled ||
      typeof visibleCount !== 'number' ||
      visibleCount < 0
    ) {
      return sortedData;
    }

    return sortedData.slice(0, visibleCount);
  }, [infiniteScrollEnabled, sortedData, visibleCount]);

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

    // Check if element is already in viewport after observer creation
    // This handles the case where tab changes result in the trigger being already visible
    const checkIfInViewport = setTimeout(() => {
      if (!currentLoadMoreRef) return;

      const rect = currentLoadMoreRef.getBoundingClientRect();
      const viewportHeight =
        window.innerHeight || document.documentElement.clientHeight;
      const isInViewport = rect.top >= 0 && rect.bottom <= viewportHeight;

      if (isInViewport) {
        handleLoadMore();
      }
    }, 150); // Small delay to ensure state has updated

    return () => {
      clearTimeout(checkIfInViewport);
      if (currentLoadMoreRef) {
        observer.unobserve(currentLoadMoreRef);
      }
    };
  }, [handleLoadMore, infiniteScrollEnabled]);

  useLayoutEffect(() => {
    if (
      !preserveWindowScrollAnchor ||
      !infiniteScrollEnabled ||
      !dataRowsRef.current
    ) {
      prevLoadingMoreRef.current = loadingMore;
      if (!loadingMore) {
        anchorRowRef.current = null;
      }
      return;
    }

    const getRows = () =>
      Array.from(
        dataRowsRef.current!.querySelectorAll<HTMLElement>('[data-row-key]')
      );

    const findAnchorRow = () => {
      const rows = getRows();
      if (rows.length === 0) return null;

      // Use the first row currently visible in viewport as anchor.
      const candidate =
        rows.find(row => row.getBoundingClientRect().bottom >= 0) || rows[0];

      const rowKey = candidate.dataset.rowKey;
      if (!rowKey) return null;

      return { rowKey, top: candidate.getBoundingClientRect().top };
    };

    const applyAnchor = () => {
      const anchor = anchorRowRef.current;
      if (!anchor) return;

      const target = getRows().find(
        row => row.dataset.rowKey === anchor.rowKey
      );
      if (!target) return;

      const delta = target.getBoundingClientRect().top - anchor.top;
      if (Math.abs(delta) > 1) {
        window.scrollBy(0, delta);
      }
    };

    // Capture anchor when loading-more starts.
    if (!prevLoadingMoreRef.current && loadingMore) {
      anchorRowRef.current = findAnchorRow();
    }

    // Keep anchor steady while new rows are inserted.
    if (loadingMore && anchorRowRef.current) {
      applyAnchor();
    }

    // Final settle pass when loading completes.
    if (prevLoadingMoreRef.current && !loadingMore && anchorRowRef.current) {
      applyAnchor();
      anchorRowRef.current = null;
    }

    prevLoadingMoreRef.current = loadingMore;
  }, [
    preserveWindowScrollAnchor,
    infiniteScrollEnabled,
    loadingMore,
    visibleSortedData,
  ]);

  // Handle toast
  const handleShowToast = useCallback(
    (message: string) => {
      setToastMessage(message);
      setShowToast(true);
      onShowToast?.(message);
    },
    [onShowToast]
  );

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
  const skeletonWidths = ['40%', '55%', '45%', '65%', '35%', '50%', '30%'];
  const getRowKey = useCallback((item: T, index: number) => {
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      const id = record.id;
      const type = record._type;

      if (
        (typeof id === 'string' || typeof id === 'number') &&
        typeof type === 'string'
      ) {
        return `${type}-${id}`;
      }

      if (typeof id === 'string' || typeof id === 'number') {
        return String(id);
      }
    }

    return `row-${index}`;
  }, []);

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
        {/* Content Area */}
        <div className={styles.contentArea}>
          {/* Live Bar Component */}
          {customComponents?.liveBar && (
            <customComponents.liveBar data={data} />
          )}

          {loading ? (
            <div className={styles.dataContainer} aria-busy="true">
              <div
                className={`${styles.headerRow} ${styles.skeletonHeaderRow}`}
              >
                {columns.map((column, index) => (
                  <div key={column.key} className={styles.skeletonCell}>
                    <span
                      className={styles.skeletonLine}
                      style={{
                        width: skeletonWidths[index % skeletonWidths.length],
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className={styles.dataRows}>
                {Array.from({ length: 5 }).map((_, rowIndex) => (
                  <div key={rowIndex} className={styles.skeletonRow}>
                    {columns.map((column, colIndex) => (
                      <div
                        key={`${column.key}-${rowIndex}`}
                        className={styles.skeletonCell}
                      >
                        <span
                          className={styles.skeletonLine}
                          style={{
                            width:
                              skeletonWidths[
                                (colIndex + rowIndex) % skeletonWidths.length
                              ],
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : sortedData.length === 0 ? (
            <div className={styles.emptyState}>{emptyStateMessage}</div>
          ) : useCardView && cardView ? (
            (() => {
              const isSingleRow =
                !cardView.summary && !cardView.avatar && !cardView.statusBar;
              const actionCol =
                isSingleRow && cardView.primaryAction
                  ? (cardView.actionColumnWidth ?? '140px')
                  : '0px';
              const fieldWidths = cardView.topFields
                .map(f => f.width ?? 'minmax(0, 1fr)')
                .join(' ');
              const gridTemplate = `${fieldWidths} ${actionCol}`;
              return (
                <div
                  className={styles.cardListContainer}
                  style={
                    {
                      '--card-cols': cardView.topFields.length,
                      '--card-action-col': actionCol,
                      '--card-grid-template': gridTemplate,
                    } as React.CSSProperties
                  }
                >
                  <div className={styles.cardListHeader}>
                    {cardView.topFields.map(field => (
                      <div
                        key={field.key}
                        className={styles.cardListHeaderCell}
                      >
                        {field.label}
                      </div>
                    ))}
                  </div>
                  <div className={styles.cardList} ref={dataRowsRef}>
                    {visibleSortedData.map((item, index) => {
                      const rowKey = getRowKey(item, index);
                      return (
                        <CardItemRow
                          key={rowKey}
                          rowKey={rowKey}
                          item={item}
                          config={cardView}
                          onAction={handleItemAction}
                        />
                      );
                    })}

                    {infiniteScrollEnabled && (
                      <div
                        ref={loadMoreRef}
                        className={styles.loadMoreIndicator}
                      >
                        {loadingMore && (
                          <div className={styles.loadMoreSpinner}>
                            <div className={styles.spinner}></div>
                            <span>Loading more...</span>
                          </div>
                        )}
                        {hasMore && !loadingMore && (
                          <div className={styles.loadMorePlaceholder} />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })()
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
                {visibleSortedData.map((item, index) => {
                  const rowKey = getRowKey(item, index);

                  // Use custom row component if provided, otherwise use default
                  if (customComponents?.itemRow) {
                    const ItemRowComponent = customComponents.itemRow;
                    return (
                      <ItemRowComponent
                        key={rowKey}
                        item={item}
                        onAction={handleItemAction}
                      />
                    );
                  }

                  return (
                    <DefaultItemRow
                      key={rowKey}
                      rowKey={rowKey}
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
