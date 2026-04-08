'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './TechLeadsNav.module.scss';

interface TechLeadsNavProps {
  basePath?: string;
}

export function TechLeadsNav({ basePath = '/tech-leads' }: TechLeadsNavProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === basePath) {
      return pathname === basePath;
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.navInner}>
        {/* Home */}
        <Link
          href={basePath}
          className={`${styles.navItem} ${isActive(basePath) ? styles.active : ''}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9.5z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 21V12h6v9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.label}>Home</span>
        </Link>

        {/* New — raised center button */}
        <Link href={`${basePath}/new`} className={styles.newItem}>
          <div className={styles.newBtn}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <line x1="12" y1="8" x2="12" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <line x1="8" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className={styles.newLabel}>New</span>
        </Link>

        {/* My Opps */}
        <Link
          href={`${basePath}/opportunities`}
          className={`${styles.navItem} ${isActive(`${basePath}/opportunities`) ? styles.active : ''}`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="2" />
            <line x1="9" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="9" y1="16" x2="13" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className={styles.label}>My Opps</span>
        </Link>
      </div>
    </nav>
  );
}
