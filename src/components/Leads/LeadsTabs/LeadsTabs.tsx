'use client';

import React from 'react';
import { LeadStatus } from '@/types/lead';
import styles from './LeadsTabs.module.scss';

type ActiveLeadStatus = 'new' | 'contacted' | 'qualified' | 'quoted' | 'unqualified';

interface LeadsTabsProps {
  activeTab: ActiveLeadStatus | 'all';
  onTabChange: (tab: ActiveLeadStatus | 'all') => void;
  leadCounts: Record<ActiveLeadStatus | 'all', number>;
}

const LeadsTabs: React.FC<LeadsTabsProps> = ({
  activeTab,
  onTabChange,
  leadCounts,
}) => {
  // Show all lead statuses including unqualified
  const leadStatusOptions = [
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'qualified', label: 'Qualified' },
    { value: 'quoted', label: 'Quoted' },
    { value: 'unqualified', label: 'Unqualified' },
  ];

  const tabs = [
    { key: 'all' as const, label: 'All Leads', count: leadCounts.all },
    ...leadStatusOptions.map(status => ({
      key: status.value as ActiveLeadStatus,
      label: status.label,
      count: leadCounts[status.value as ActiveLeadStatus],
    })),
  ];

  return (
    <div className={styles.tabsContainer}>
      <div className={styles.tabsList}>
        {tabs.map(tab => (
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

export default LeadsTabs;
