import { ChevronRight } from 'lucide-react';
import styles from './sidenav.module.scss';

interface SidebarSectionProps {
  sectionState: boolean;
  setSectionState: React.Dispatch<React.SetStateAction<boolean>>;
  sectionTitle: string;
  children: React.ReactNode;
}

export function SidebarSection({
  sectionState,
  setSectionState,
  sectionTitle,
  children,
}: SidebarSectionProps) {
  return (
    <div className={styles.sidebarSection}>
      <button
        className={styles.sidebarSectionHeader}
        onClick={() => setSectionState(!sectionState)}
      >
        <h3 className={styles.sidebarSectionTitle}>{sectionTitle}</h3>
        <ChevronRight
          className={`${styles.sidebarSectionIcon} ${sectionState ? styles.sidebarSectionIconExpanded : ''}`}
        />
      </button>
      <div
        className={`${styles.sidebarSectionContent} ${
          sectionState
            ? styles.sidebarSectionContentExpanded
            : styles.sidebarSectionContentCollapsed
        }`}
      >
        <div className={styles.sidebarSectionNav}>{children}</div>
      </div>
    </div>
  );
}
