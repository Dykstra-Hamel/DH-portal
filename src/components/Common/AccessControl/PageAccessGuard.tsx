'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUserPageAccess, PageType } from '@/hooks/useUserDepartments';
import styles from './PageAccessGuard.module.scss';

interface PageAccessGuardProps {
  pageType: PageType;
  children: React.ReactNode;
  redirectTo?: string;
  showErrorPage?: boolean;
}

export function PageAccessGuard({
  pageType,
  children,
  redirectTo = '/tickets',
  showErrorPage = true
}: PageAccessGuardProps) {
  const { hasAccess, isLoading, error, accessReason } = useCurrentUserPageAccess(pageType);
  const router = useRouter();

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Checking access permissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.error}>
        <h2>Error Checking Access</h2>
        <p>There was an error verifying your permissions: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className={styles.retryButton}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!hasAccess) {
    if (!showErrorPage) {
      router.push(redirectTo);
      return null;
    }

    return <AccessDeniedPage pageType={pageType} />;
  }

  return <>{children}</>;
}

// Access denied component
interface AccessDeniedPageProps {
  pageType: PageType;
}

function AccessDeniedPage({ pageType }: AccessDeniedPageProps) {
  const router = useRouter();

  const pageInfo = {
    sales: {
      title: 'Sales Leads',
      description: 'sales lead management',
      department: 'Sales'
    },
    scheduling: {
      title: 'Scheduling',
      description: 'appointment and service scheduling',
      department: 'Scheduling'
    },
    support: {
      title: 'Customer Service',
      description: 'customer support and service',
      department: 'Customer Service'
    }
  };

  const info = pageInfo[pageType];

  return (
    <div className={styles.accessDenied}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <path d="M4.93 4.93l14.14 14.14"/>
          </svg>
        </div>

        <h1>Access Restricted</h1>

        <p className={styles.description}>
          You don&apos;t have permission to access the <strong>{info.title}</strong> page.
        </p>

        <div className={styles.requirements}>
          <h3>Access Requirements</h3>
          <p>To access {info.description}, you need one of the following:</p>
          <ul>
            <li>Global administrator privileges</li>
            <li>Company owner or admin role</li>
            <li>Manager or member role with <strong>{info.department}</strong> department access</li>
          </ul>
        </div>

        <div className={styles.actions}>
          <button
            onClick={() => router.push('/tickets')}
            className={styles.backButton}
          >
            Back to Tickets
          </button>
          <button
            onClick={() => router.push('/settings')}
            className={styles.settingsButton}
          >
            Contact Administrator
          </button>
        </div>
      </div>
    </div>
  );
}

// Loading component for immediate use
export function PageLoadingGuard() {
  return (
    <div className={styles.loading}>
      <div className={styles.spinner}></div>
      <p>Loading page...</p>
    </div>
  );
}