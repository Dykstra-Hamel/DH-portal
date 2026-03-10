import { Dispatch, SetStateAction, ReactNode } from 'react';
import styles from './DetailsCardsSidebar.module.scss';


interface DetailsCardsSidebarProps {
  children: ReactNode;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: Dispatch<SetStateAction<boolean>>;
  activeSection?: string;
  onSectionClick?: () => void;
}

export function DetailsCardsSidebar({
  children,
  isSidebarExpanded,
  setIsSidebarExpanded,
  activeSection,
  onSectionClick,
}: DetailsCardsSidebarProps) {
  return (
    <div
      className={`${styles.sidebar} ${isSidebarExpanded ? styles.expanded : styles.collapsed} ${activeSection === 'sidebar' ? styles.active : ''}`}
      onClick={onSectionClick}
    >
      <div className={styles.sidebarContent}>
        <div
          className={styles.sidebarHeader}
          role="button"
          tabIndex={0}
          title={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          onClick={() => setIsSidebarExpanded(prev => !prev)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsSidebarExpanded(prev => !prev);
            }
          }}
        >
          <h3>Details</h3>
        </div>
        <div className={styles.sidebarCardsWrapper}>{children}</div>
      </div>
    </div>
  );
}
