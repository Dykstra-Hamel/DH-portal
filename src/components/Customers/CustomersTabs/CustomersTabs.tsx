'use client';

import React from 'react';
import { CustomerStatus, customerStatusOptions } from '@/types/customer';
import styles from './CustomersTabs.module.scss';

interface CustomersTabsProps {
  activeTab: CustomerStatus | 'all';
  onTabChange: (tab: CustomerStatus | 'all') => void;
  customerCounts: Record<CustomerStatus | 'all', number>;
}

const CustomersTabs: React.FC<CustomersTabsProps> = ({ 
  activeTab, 
  onTabChange, 
  customerCounts 
}) => {
  const tabs = [
    { key: 'all' as const, label: 'All Customers', count: customerCounts.all },
    ...customerStatusOptions.map(status => ({
      key: status.value,
      label: status.label,
      count: customerCounts[status.value]
    }))
  ];

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabsList}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
          >
            <span className={styles.tabLabel}>{tab.label}</span>
            <span className={styles.tabCount}>{tab.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default CustomersTabs;