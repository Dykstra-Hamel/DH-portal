'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useUserDepartments } from '@/hooks/useUserDepartments';
import styles from './FieldSalesNav.module.scss';

export function FieldSalesNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedCompany, isAdmin } = useCompany();
  const [userId, setUserId] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const { departments } = useUserDepartments(
    userId ?? '',
    selectedCompany?.id ?? ''
  );

  const isTechnician = departments.includes('technician');
  const isInspector = departments.includes('inspector');
  const showBothOptions = isAdmin || (isTechnician && isInspector);

  const isActive = (href: string) => {
    if (href === '/field-sales/dashboard') {
      return pathname === '/field-sales/dashboard';
    }
    return pathname.startsWith(href);
  };

  const handleNewPress = () => {
    if (showBothOptions) {
      setShowPopup(true);
    } else if (isInspector) {
      router.push('/field-sales/field-map/new');
    } else {
      router.push('/field-sales/tech-leads/new?fresh=1&type=new-lead');
    }
  };

  const thirdHref = '/field-sales/reports';
  const thirdLabel = 'Reports';

  return (
    <>
      {showPopup && (
        <div className={styles.overlay} onClick={() => setShowPopup(false)}>
          <div className={styles.sheet} onClick={e => e.stopPropagation()}>
            <p className={styles.sheetTitle}>What would you like to create?</p>
            <button
              className={styles.sheetOption}
              onClick={() => {
                setShowPopup(false);
                router.push('/field-sales/field-map/new');
              }}
            >
              <span className={styles.sheetOptionIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="9"
                    r="2.5"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
              </span>
              <span className={styles.sheetOptionText}>
                <strong>New Inspection</strong>
                <span>Start a new field map service stop</span>
              </span>
            </button>
            <button
              className={styles.sheetOption}
              onClick={() => {
                setShowPopup(false);
                router.push('/field-sales/tech-leads/new?fresh=1');
              }}
            >
              <span className={styles.sheetOptionIcon}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M5 12h14M12 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span className={styles.sheetOptionText}>
                <strong>New Lead</strong>
                <span>Capture a new tech leads opportunity</span>
              </span>
            </button>
            <button
              className={styles.sheetCancel}
              onClick={() => setShowPopup(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <nav className={styles.nav}>
        <div className={styles.navInner}>
          {/* Home */}
          <Link
            href="/field-sales/dashboard"
            className={`${styles.navItem} ${isActive('/field-sales/dashboard') ? styles.active : ''}`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
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
          <button
            type="button"
            className={styles.newItem}
            onClick={handleNewPress}
          >
            <div className={styles.newBtn}>
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="12"
                  y1="8"
                  x2="12"
                  y2="16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <line
                  x1="8"
                  y1="12"
                  x2="16"
                  y2="12"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <span className={styles.newLabel}>New</span>
          </button>

          {/* Third item: Reports */}
          <Link
            href={thirdHref}
            className={`${styles.navItem} ${isActive(thirdHref) ? styles.active : ''}`}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M3 20h18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <rect
                x="5"
                y="11"
                width="3"
                height="6"
                rx="1"
                stroke="currentColor"
                strokeWidth="2"
              />
              <rect
                x="10.5"
                y="7"
                width="3"
                height="10"
                rx="1"
                stroke="currentColor"
                strokeWidth="2"
              />
              <rect
                x="16"
                y="4"
                width="3"
                height="13"
                rx="1"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <span className={styles.label}>{thirdLabel}</span>
          </Link>
        </div>
      </nav>
    </>
  );
}
