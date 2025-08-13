import { LucideIcon } from 'lucide-react';
import Link from 'next/link';
import styles from './sidenav.module.scss';

interface SidebarItemProps {
  itemText: string;
  icon: LucideIcon;
  path: string;
  onLinkClick?: () => void;
}

export function SidebarSectionNavItem({
  path,
  itemText,
  icon: Icon,
  onLinkClick,
}: SidebarItemProps) {
  return (
    <Link href={path} className={styles.sidebarSectionNavItem} onClick={onLinkClick}>
      <Icon size={16} />
      {itemText}
    </Link>
  );
}
