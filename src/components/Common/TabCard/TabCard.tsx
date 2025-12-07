import { ReactNode, useState } from 'react';
import styles from './TabCard.module.scss';

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabCardProps {
  tabs: TabItem[];
  defaultTabId?: string;
  className?: string;
}

export function TabCard({ tabs, defaultTabId, className = '' }: TabCardProps) {
  const [activeTabId, setActiveTabId] = useState(defaultTabId || tabs[0]?.id);

  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <div className={`${styles.tabCard} ${className}`}>
      <div className={styles.tabHeader}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTabId === tab.id ? styles.active : ''}`}
            onClick={() => setActiveTabId(tab.id)}
            type="button"
          >
            <div className={styles.tabLabelWrapper}>{tab.label}</div>
          </button>
        ))}
      </div>
      <div className={styles.tabContent}>{activeTab?.content}</div>
    </div>
  );
}
