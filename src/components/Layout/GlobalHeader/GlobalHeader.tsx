'use client';

import { Menu } from 'lucide-react';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs';
import { SearchBar } from '../SearchBar/SearchBar';
import { NotificationIcon } from '../NotificationIcon/NotificationIcon';
import { UserAvatar } from '../UserAvatar/UserAvatar';
import { GlobalCompanyDropdown } from './CompanyDropdown/GlobalCompanyDropdown';
import styles from './GlobalHeader.module.scss';

interface GlobalHeaderProps {
  onMenuToggle?: () => void;
  rightActions?: ReactNode;
}

export function GlobalHeader({ onMenuToggle, rightActions }: GlobalHeaderProps) {
  const pathname = usePathname();
  const hideSearchAndCompany = pathname === '/project-management';

  return (
    <header className={styles.globalHeader}>
      <div className={styles.headerContent}>
        <div className={styles.leftSection}>
          {onMenuToggle && (
            <button
              className={styles.menuButton}
              onClick={onMenuToggle}
              aria-label="Toggle navigation menu"
            >
              <Menu size={24} />
            </button>
          )}
          <Breadcrumbs />
        </div>
        <div className={styles.centerSection}>
        </div>
        <div className={styles.rightSection}>
          {rightActions}
          {!hideSearchAndCompany && <SearchBar />}
          {!hideSearchAndCompany && <GlobalCompanyDropdown />}
          <NotificationIcon />
          <UserAvatar />
        </div>
      </div>
    </header>
  );
}
