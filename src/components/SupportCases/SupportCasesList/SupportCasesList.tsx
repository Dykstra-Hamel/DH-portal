'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { SupportCase } from '@/types/support-case';
import { DataTable } from '@/components/Common/DataTable';
import {
  getSupportCaseColumns,
  getSupportCaseTabs,
} from './SupportCasesListConfig';
import { Toast } from '@/components/Common/Toast';
import styles from '@/components/Common/DataTable/DataTableTabs.module.scss';

interface SupportCasesListProps {
  supportCases: SupportCase[];
  loading?: boolean;
  onSupportCaseUpdated?: () => void;
}

export default function SupportCasesList({
  supportCases,
  loading = false,
  onSupportCaseUpdated,
}: SupportCasesListProps) {
  // Tab and search state
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Toast state
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const router = useRouter();

  // Get tabs configuration
  const tabs = useMemo(() => getSupportCaseTabs(), []);

  // Handle tab change
  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
  }, []);

  // Handle search change
  const handleSearchChange = useCallback((newQuery: string) => {
    setSearchQuery(newQuery);
  }, []);

  // Handle item actions
  const handleItemAction = (action: string, supportCase: SupportCase) => {
    // Handle any support case specific actions here
    if (action === 'view') {
      // Navigate to the support case detail page
      router.push(`/tickets/customer-service/${supportCase.id}`);
    }
  };

  // Handle toast
  const handleShowToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleToastClose = () => {
    setShowToast(false);
    setToastMessage('');
  };

  // Sort unassigned first, then oldest to newest
  const sortedCases = useMemo(() => {
    return supportCases
      .slice()
      .sort((a, b) => {
        const aWeight = a.assigned_to ? 1 : 0;
        const bWeight = b.assigned_to ? 1 : 0;
        if (aWeight !== bWeight) return aWeight - bWeight;
        return (
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime()
        );
      });
  }, [supportCases]);

  // Filter data based on active tab
  const filteredByTab = useMemo(() => {
    if (!tabs || tabs.length === 0) return sortedCases;
    const activeTabConfig = tabs.find(tab => tab.key === activeTab);
    if (!activeTabConfig) return sortedCases;
    return activeTabConfig.filter(sortedCases);
  }, [sortedCases, activeTab, tabs]);

  // Apply search filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return filteredByTab;

    const query = searchQuery.toLowerCase();
    return filteredByTab.filter(supportCase => {
      // Search in customer name
      const customerName =
        `${supportCase.customer?.first_name || ''} ${supportCase.customer?.last_name || ''}`.toLowerCase();
      if (customerName.includes(query)) return true;

      // Search in phone
      if (supportCase.customer?.phone?.toLowerCase().includes(query)) return true;

      // Search in summary
      if (supportCase.summary?.toLowerCase().includes(query)) return true;

      // Search in status
      if (supportCase.status?.toLowerCase().includes(query)) return true;

      return false;
    });
  }, [filteredByTab, searchQuery]);

  return (
    <>
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={handleToastClose}
      />

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
                    {tab.getCount(sortedCases)}
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
        title="Support Cases"
        columns={getSupportCaseColumns()}
        tableType="supportCases"
        onItemAction={handleItemAction}
        onDataUpdated={onSupportCaseUpdated}
        customComponents={{}}
        emptyStateMessage="No support cases found for this category."
        onShowToast={handleShowToast}
        searchEnabled={false}
      />
    </>
  );
}
