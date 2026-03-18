'use client';

import { PrimarySideNav } from './PrimarySideNav';
import { SecondarySideNav } from './SecondarySideNav';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  collapsed?: boolean;
  isActive?: boolean;
  onLinkClick?: () => void;
  hideSecondary?: boolean;
}

export function Sidebar({ collapsed = false, isActive = false, onLinkClick, hideSecondary = false }: SidebarProps) {
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Close sidebar when clicking on the overlay (outside the nav elements)
    if (e.target === e.currentTarget && onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <div
      className={`${styles.sidebarContainer} ${isActive ? styles.active : ''} ${hideSecondary ? styles.primaryOnly : ''}`}
      onClick={handleOverlayClick}
    >
      <PrimarySideNav />
      {!hideSecondary && (
        <SecondarySideNav
          collapsed={collapsed}
          isActive={isActive}
          onLinkClick={onLinkClick}
        />
      )}
    </div>
  );
}