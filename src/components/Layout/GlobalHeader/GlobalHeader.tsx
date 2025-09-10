'use client';

import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs';
import { SearchBar } from '../SearchBar/SearchBar';
import { NotificationIcon } from '../NotificationIcon/NotificationIcon';
import { UserAvatar } from '../UserAvatar/UserAvatar';
import { GlobalCompanyDropdown } from './CompanyDropdown/GlobalCompanyDropdown';
import styles from './GlobalHeader.module.scss';

export function GlobalHeader() {
  return (
    <header className={styles.globalHeader}>
      <div className={styles.headerContent}>
        <div className={styles.leftSection}>
          <Breadcrumbs />
        </div>
        <div className={styles.centerSection}>
        </div>
        <div className={styles.rightSection}>
          <SearchBar />
          <GlobalCompanyDropdown />
          <NotificationIcon />
          <UserAvatar />
        </div>
      </div>
    </header>
  );
}