import { Dispatch, SetStateAction, ReactNode } from 'react';
import styles from './DetailsCardsSidebar.module.scss';

// Expand sidebar icon
const ExpandIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 18 18"
    fill="none"
  >
    <path
      d="M6.00008 0.666656V16.6667M12.2223 11.3333L9.55564 8.66666L12.2223 5.99999M2.44453 0.666656H14.889C15.8708 0.666656 16.6667 1.46259 16.6667 2.44443V14.8889C16.6667 15.8707 15.8708 16.6667 14.889 16.6667H2.44453C1.46269 16.6667 0.666748 15.8707 0.666748 14.8889V2.44443C0.666748 1.46259 1.46269 0.666656 2.44453 0.666656Z"
      stroke="#020618"
      strokeWidth="1.33333"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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
          <h3>Details</h3>
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
            <ExpandIcon />
          </button>
        </div>
        <div className={styles.sidebarCardsWrapper}>{children}</div>
      </div>
    </div>
  );
}
