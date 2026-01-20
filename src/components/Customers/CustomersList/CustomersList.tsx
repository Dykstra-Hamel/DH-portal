'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Search } from 'lucide-react';
import { Customer } from '@/types/customer';
import { DataTable } from '@/components/Common/DataTable';
import { getCustomerColumns, getCustomerTabs } from './CustomersListConfig';
import styles from '@/components/Common/DataTable/DataTableTabs.module.scss';

interface CustomersListProps {
  customers: Customer[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  onCustomerClick?: (customer: Customer) => void;
  showCompanyColumn?: boolean;
  tabCounts?: { all: number; active: number; inactive: number; archived: number };
}

function CustomersList({
  customers,
  loading = false,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  onCustomerClick,
  showCompanyColumn = false,
  tabCounts,
}: CustomersListProps) {
  // Tab and search state
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get tabs configuration
  const tabs = useMemo(() => getCustomerTabs(tabCounts), [tabCounts]);

  // Handle tab change
  const handleTabChange = useCallback((newTab: string) => {
    setActiveTab(newTab);
  }, []);

  // Handle search change
  const handleSearchChange = useCallback((newQuery: string) => {
    setSearchQuery(newQuery);
  }, []);

  // Handle item actions
  const handleItemAction = (action: string, customer: Customer) => {
    if (action === 'view') {
      onCustomerClick?.(customer);
    }
  };

  // Filter data based on active tab
  const filteredByTab = useMemo(() => {
    if (!tabs || tabs.length === 0) return customers;
    const activeTabConfig = tabs.find(tab => tab.key === activeTab);
    if (!activeTabConfig) return customers;
    return activeTabConfig.filter(customers);
  }, [customers, activeTab, tabs]);

  // Apply search filter
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return filteredByTab;

    const query = searchQuery.toLowerCase();
    return filteredByTab.filter(customer => {
      // Search in name
      const name = `${customer.first_name || ''} ${customer.last_name || ''}`.toLowerCase();
      if (name.includes(query)) return true;

      // Search in phone
      if (customer.phone?.toLowerCase().includes(query)) return true;

      // Search in email
      if (customer.email?.toLowerCase().includes(query)) return true;

      // Search in address
      const address = `${customer.address || ''} ${customer.city || ''} ${customer.state || ''}`.toLowerCase();
      if (address.includes(query)) return true;

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
                    {tab.getCount(customers)}
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
        title="Customers Overview"
        columns={getCustomerColumns(showCompanyColumn)}
        tableType={showCompanyColumn ? "customersWithCompany" : "customers"}
        onItemAction={handleItemAction}
        emptyStateMessage="No customers found for this category."
        infiniteScrollEnabled={true}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        loadingMore={loadingMore}
        searchEnabled={false}
      />
    </>
  );
}

export default CustomersList;