'use client';

import React, { useMemo } from 'react';
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
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
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
  searchQuery = '',
  onSearchChange,
  activeTab = 'all',
  onTabChange,
}: CustomersListProps) {
  // Get tabs configuration
  const tabs = useMemo(() => getCustomerTabs(tabCounts), [tabCounts]);

  // Handle item actions
  const handleItemAction = (action: string, customer: Customer) => {
    if (action === 'view') {
      onCustomerClick?.(customer);
    }
  };

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
                onClick={() => onTabChange?.(tab.key)}
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
              onChange={e => onSearchChange?.(e.target.value)}
            />
            <Search size={18} className={styles.searchIcon} />
          </div>
        </div>
      )}

      {/* DataTable Component */}
      <DataTable
        data={customers}
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