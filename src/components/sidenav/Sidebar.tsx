'use client';

import { PrimarySideNav } from './PrimarySideNav';
import { SecondarySideNav } from './SecondarySideNav';
import styles from './Sidebar.module.scss';

interface SidebarProps {
  collapsed?: boolean;
  isActive?: boolean;
  onLinkClick?: () => void;
}

export function Sidebar({ collapsed = false, isActive = false, onLinkClick }: SidebarProps) {
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Close sidebar when clicking on the overlay (outside the nav elements)
    if (e.target === e.currentTarget && onLinkClick) {
      onLinkClick();
    }
  };

  return (
    <div 
      className={`${styles.sidebarContainer} ${isActive ? styles.active : ''}`}
      onClick={handleOverlayClick}
    >
      <PrimarySideNav />
      <SecondarySideNav 
        collapsed={collapsed} 
        isActive={isActive} 
        onLinkClick={onLinkClick} 
      />
    </div>
  );
}