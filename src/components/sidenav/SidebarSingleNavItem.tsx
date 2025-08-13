import { LucideIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './sidenav.module.scss';

interface SidebarItemProps {
  itemText: string;
  icon: LucideIcon;
  path?: string;
  onClick?: () => void;
  onLinkClick?: () => void;
}

export function SidebarSingleNavItem({
  path,
  itemText,
  icon: Icon,
  onClick,
  onLinkClick,
}: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = path ? pathname === path : false;

  // If onClick is provided, render a button instead of a link
  if (onClick) {
    return (
      <div className={styles.sidebarNavItem}>
        <button
          onClick={onClick}
          className={`${styles.sidebarNavLink} ${isActive ? styles.sidebarNavLinkActive : ''}`}
        >
          <Icon size={16} />
          {itemText}
        </button>
      </div>
    );
  }

  // Default behavior: render a Link
  return (
    <div className={styles.sidebarNavItem}>
      <Link
        href={path || '#'}
        className={`${styles.sidebarNavLink} ${isActive ? styles.sidebarNavLinkActive : ''}`}
        onClick={onLinkClick}
      >
        <Icon size={16} />
        {itemText}
      </Link>
    </div>
  );
}
