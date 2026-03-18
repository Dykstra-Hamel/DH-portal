'use client';

import { Menu, ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs';
import { SearchBar } from '../SearchBar/SearchBar';
import { NotificationIcon } from '../NotificationIcon/NotificationIcon';
import { UserAvatar } from '../UserAvatar/UserAvatar';
import { GlobalCompanyDropdown } from './CompanyDropdown/GlobalCompanyDropdown';
import { useWizard } from '@/contexts/WizardContext';
import styles from './GlobalHeader.module.scss';

interface GlobalHeaderProps {
  onMenuToggle?: () => void;
  rightActions?: ReactNode;
}

export function GlobalHeader({
  onMenuToggle,
  rightActions,
}: GlobalHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { wizardTitle } = useWizard();
  const isTechLeads = pathname.startsWith('/tech-leads');
  const hideSearchAndCompany =
    isTechLeads ||
    pathname === '/project-management' ||
    pathname.startsWith('/project-management/') ||
    pathname === '/admin/project-management' ||
    pathname.startsWith('/admin/project-management/') ||
    pathname.startsWith('/admin/monthly-services') ||
    pathname.startsWith('/admin/content-pieces/');
  const hideBreadcrumbs =
    pathname === '/admin/project-management' ||
    pathname.startsWith('/admin/project-management/') ||
    pathname.startsWith('/admin/monthly-services') ||
    pathname.startsWith('/admin/content-pieces/') ||
    pathname.startsWith('/tech-leads');

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
          {isTechLeads && (
            <button
              type="button"
              className={styles.backButton}
              onClick={() => router.back()}
              aria-label="Go back"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          {!hideBreadcrumbs && <Breadcrumbs />}
        </div>
        <div className={[styles.centerSection, isTechLeads && wizardTitle ? styles.centerSectionVisible : ''].filter(Boolean).join(' ')}>
          {isTechLeads && wizardTitle && (
            <span className={styles.wizardTitle}>{wizardTitle}</span>
          )}
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
