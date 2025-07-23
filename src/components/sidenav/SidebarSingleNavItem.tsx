import { LucideIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './sidenav.module.scss';

interface SidebarItemProps {
  itemText: string;
  icon: LucideIcon;
  path: string;
}

export function SidebarSingleNavItem({
  path,
  itemText,
  icon: Icon,
}: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === path;

  return (
    <div className={styles.sidebarNavItem}>
      <Link
        href={path}
        className={`${styles.sidebarNavLink} ${isActive ? styles.sidebarNavLinkActive : ''}`}
      >
        <Icon size={16} />
        {itemText}
      </Link>
    </div>
  );
}
