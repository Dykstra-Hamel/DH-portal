'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Search } from 'lucide-react';
import { DataTable } from '@/components/Common/DataTable';
import { formSubmissionsColumns, getFormSubmissionTabs, FormSubmissionWithCustomer } from './FormSubmissionsListConfig';
import styles from '@/components/Common/DataTable/DataTableTabs.module.scss';

interface FormSubmissionsListProps {
  submissions: FormSubmissionWithCustomer[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  onSubmissionUpdated?: () => void;
  onViewDetails?: (submission: FormSubmissionWithCustomer) => void;
  tabCounts?: { all: number; processed: number; pending: number; failed: number };
}

function FormSubmissionsList({
  submissions,
  loading = false,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  onSubmissionUpdated,
  onViewDetails,
  tabCounts,
}: FormSubmissionsListProps) {
  // Tab and search state
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get tabs configuration
  const tabs = useMemo(() => getFormSubmissionTabs(tabCounts), [tabCounts]);

  // Handle tab change
  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
  }, []);

  // Handle search change
  const handleSearchChange = useCallback((newQuery: string) => {
    setSearchQuery(newQuery);
  }, []);

  // Build grid template columns from column widths
  const customColumnWidths = useMemo(() => {
    return formSubmissionsColumns.map(col => col.width).join(' ');
  }, []);

  // Handle item actions
  const handleItemAction = (action: string, submission: FormSubmissionWithCustomer) => {
    if (action === 'view_details') {
      onViewDetails?.(submission);
    }
  };

  // Filter data based on active tab
  const filteredByTab = useMemo(() => {
    if (!tabs || tabs.length === 0) return submissions;
    const activeTabConfig = tabs.find(tab => tab.key === activeTab);
    if (!activeTabConfig) return submissions;
    return activeTabConfig.filter(submissions);
  }, [submissions, activeTab, tabs]);

  // Apply search filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return filteredByTab;

    const query = searchQuery.toLowerCase();
    return filteredByTab.filter(submission => {
      // Search in customer name
      const customerName =
        `${submission.customers?.first_name || ''} ${submission.customers?.last_name || ''}`.toLowerCase();
      if (customerName.includes(query)) return true;

      // Search in email
      if (submission.customers?.email?.toLowerCase().includes(query)) return true;

      // Search in phone
      if (submission.normalized_data?.phone_number?.toLowerCase().includes(query)) return true;

      // Search in status
      if (submission.processing_status?.toLowerCase().includes(query)) return true;

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
                    {tab.getCount(submissions)}
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
        title="Form Submissions"
        columns={formSubmissionsColumns}
        tableType="form_submissions"
        customColumnWidths={customColumnWidths}
        onItemAction={handleItemAction}
        onDataUpdated={onSubmissionUpdated}
        emptyStateMessage="No form submissions found."
        infiniteScrollEnabled={true}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        loadingMore={loadingMore}
        searchEnabled={false}
      />
    </>
  );
}

export default FormSubmissionsList;
