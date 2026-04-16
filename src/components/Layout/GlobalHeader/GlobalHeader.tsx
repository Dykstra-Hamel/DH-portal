'use client';

import { Menu, ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Breadcrumbs } from '../Breadcrumbs/Breadcrumbs';
import { SearchBar } from '../SearchBar/SearchBar';
import { NotificationIcon } from '../NotificationIcon/NotificationIcon';
import { UserAvatar } from '../UserAvatar/UserAvatar';
import { GlobalCompanyDropdown } from './CompanyDropdown/GlobalCompanyDropdown';
import { MobileCompanySwitcher } from './CompanyDropdown/MobileCompanySwitcher';
import { useWizard } from '@/contexts/WizardContext';
import { useCompany } from '@/contexts/CompanyContext';
import { usePageActions } from '@/contexts/PageActionsContext';
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
  const { wizardTitle, backInterceptor } = useWizard();
  const { isProjectManager } = useCompany();
  const { pageHeader } = usePageActions();
  const isTechLeads = pathname.startsWith('/tech-leads');
  const isFieldMap = pathname.startsWith('/field-map');
  const isFieldSales = pathname.startsWith('/field-sales');
  const isServiceWizard = pathname.startsWith('/field-sales/field-map/service/') && pathname.endsWith('/wizard');
  const isAppShell = isTechLeads || isFieldMap || isFieldSales;
  const showAppShellTitle = isAppShell && !!pageHeader?.title;
  const hideSearch =
    isAppShell ||
    pathname === '/project-management' ||
    pathname.startsWith('/project-management/') ||
    pathname === '/admin/project-management' ||
    pathname.startsWith('/admin/project-management/') ||
    pathname.startsWith('/admin/monthly-services') ||
    pathname.startsWith('/admin/content-pieces/');
  const hideCompany =
    isProjectManager ||
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
    isAppShell;

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
          {isAppShell && !isServiceWizard && (
            <button
              type="button"
              className={styles.backButton}
              onClick={() => {
                if (backInterceptor) {
                  backInterceptor();
                } else {
                  router.back();
                }
              }}
              aria-label="Go back"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          {!hideBreadcrumbs && <Breadcrumbs />}
          {showAppShellTitle && (
            <span className={styles.appShellTitle}>{pageHeader!.title}</span>
          )}
        </div>
        <div className={styles.centerSection}></div>
        <div className={styles.rightSection}>
          {rightActions}
          {!hideSearch && <SearchBar />}
          {!hideCompany && <GlobalCompanyDropdown />}
          <NotificationIcon />
          <UserAvatar />
        </div>
      </div>
    </header>
  );
}
