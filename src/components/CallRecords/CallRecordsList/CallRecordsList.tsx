'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';
import { DataTable } from '@/components/Common/DataTable';
import { getCallRecordColumns, getCallRecordTabs, CallRecordWithDirection } from './CallRecordsListConfig';
import styles from '@/components/Common/DataTable/DataTableTabs.module.scss';

interface CallRecordsListProps {
  calls: CallRecordWithDirection[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  onCallUpdated?: () => void;
  onViewDetails?: (call: CallRecordWithDirection) => void;
  tabCounts?: { all: number; inbound: number; outbound: number };
}

function CallRecordsList({
  calls,
  loading = false,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  onCallUpdated,
  onViewDetails,
  tabCounts,
}: CallRecordsListProps) {
  // Tab and search state
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get tabs configuration
  const tabs = useMemo(() => getCallRecordTabs(tabCounts), [tabCounts]);

  // Handle tab change
  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
  }, []);

  // Handle search change
  const handleSearchChange = useCallback((newQuery: string) => {
    setSearchQuery(newQuery);
  }, []);

  // Handle item actions
  const handleItemAction = (action: string, call: CallRecordWithDirection) => {
    if (action === 'view_details') {
      onViewDetails?.(call);
    }
  };

  // Filter data based on active tab
  const filteredByTab = useMemo(() => {
    if (!tabs || tabs.length === 0) return calls;
    const activeTabConfig = tabs.find(tab => tab.key === activeTab);
    if (!activeTabConfig) return calls;
    return activeTabConfig.filter(calls);
  }, [calls, activeTab, tabs]);

  // Apply search filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return filteredByTab;

    const query = searchQuery.toLowerCase();
    return filteredByTab.filter(call => {
      // Search in phone number
      if (call.phone_number?.toLowerCase().includes(query)) return true;

      // Search in from number
      if (call.from_number?.toLowerCase().includes(query)) return true;

      // Search in call status
      if (call.call_status?.toLowerCase().includes(query)) return true;

      // Search in direction
      if (call.call_direction?.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [filteredByTab, searchQuery]);

  return (
    <>
      {/* Tabs and Search Row */}
      {tabs && tabs.length > 0 && (
        <div className={styles.tabsRow}>
          <div className={styles.tabsSection}>
            {tabs.map(tab => (
              <button
                key={tab.key}
                className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
                onClick={() => handleTabChange(tab.key)}
              >
                {tab.label}
                {tab.getCount && (
                  <span className={styles.tabCount}>
                    {tab.getCount(calls)}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className={styles.searchSection}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search"
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
            />
            <Search size={18} className={styles.searchIcon} />
          </div>
        </div>
      )}

      {/* DataTable Component */}
      <DataTable
        data={filteredData}
        loading={loading}
        title="Call Records"
        columns={getCallRecordColumns()}
        tableType="calls"
        onItemAction={handleItemAction}
        onDataUpdated={onCallUpdated}
        emptyStateMessage="No call records found for this category."
        infiniteScrollEnabled={true}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        loadingMore={loadingMore}
        searchEnabled={false}
      />
    </>
  );
}

export default CallRecordsList;
