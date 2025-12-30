import { Dispatch, SetStateAction, ReactNode } from 'react';
import { ListCollapse } from 'lucide-react';
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
        <div className={styles.sidebarHeader}>
          <button
            title={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            onClick={
              isSidebarExpanded
                ? () => setIsSidebarExpanded(false)
                : () => setIsSidebarExpanded(true)
            }
            className={
              isSidebarExpanded
                ? styles.sidebarCollapseButton
                : styles.sidebarExpandButton
            }
          >
            <ListCollapse size={16} />
          </button>
          <h3>Details</h3>
        </div>
        <div className={styles.sidebarCardsWrapper}>{children}</div>
      </div>
    </div>
  );
}
