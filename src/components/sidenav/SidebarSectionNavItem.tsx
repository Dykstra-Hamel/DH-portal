import { LucideIcon } from 'lucide-react';
import styles from './sidenav.module.scss'

interface SidebarItemProps {
    itemText: string;
    icon: LucideIcon;
}

export function SidebarSectionNavItem( {itemText, icon: Icon}:SidebarItemProps ) {
    return (
        <button className={styles.sidebarSectionNavItem}>
            <Icon size={16} />
            {itemText}
        </button>
    )
}