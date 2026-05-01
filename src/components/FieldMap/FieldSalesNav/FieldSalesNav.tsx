'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { UserPlus, TrendingUp } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useUserDepartments } from '@/hooks/useUserDepartments';
import styles from './FieldSalesNav.module.scss';

interface FieldSalesNavProps {
  disableNew?: boolean;
}

export function FieldSalesNav({ disableNew = false }: FieldSalesNavProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { selectedCompany, isAdmin } = useCompany();
  const [userId, setUserId] = useState<string | null>(null);
  const [companyRole, setCompanyRole] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [showLeadTypePicker, setShowLeadTypePicker] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // Mirror the role check used by SecondarySideNav: admins/managers/owners
  // get team reporting inline on the dashboard, so the bottom-bar Reports
  // tab is disabled for them.
  useEffect(() => {
    if (!selectedCompany?.id || !userId) {
      setCompanyRole(null);
      return;
    }
    const supabase = createClient();
    supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', userId)
      .eq('company_id', selectedCompany.id)
      .maybeSingle()
      .then(({ data }) => setCompanyRole((data?.role as string | null) ?? null));
  }, [selectedCompany?.id, userId]);

  const reportsDisabled =
    isAdmin ||
    companyRole === 'owner' ||
    companyRole === 'admin' ||
    companyRole === 'manager';

  const { departments } = useUserDepartments(
    userId ?? '',
    selectedCompany?.id ?? ''
  );

  const isTechnician = departments.includes('technician');
  const isInspector = departments.includes('inspector');
  const showBothOptions = isAdmin || (isTechnician && isInspector);
  // Dashboard keeps the existing inspection-vs-lead picker. Every other page
  // (Routes, My Opportunities, Reports, etc.) needs the lead-type picker
  // (New Lead vs Upsell Opportunity) instead.
  const isDashboard = pathname === '/field-sales/dashboard';

  const isActive = (href: string) => {
    if (href === '/field-sales/dashboard') {
      return pathname === '/field-sales/dashboard';
    }
    return pathname.startsWith(href);
  };

  const handleNewPress = () => {
    // Off-dashboard pages always go through the lead-type picker so techs can
    // pick New Lead vs Upsell from anywhere in the app.
    if (!isDashboard) {
      setShowLeadTypePicker(true);
      return;
    }
    // On the dashboard, dual-role users (admin or inspector+technician) still
    // see the inspection-vs-lead picker first. Pure inspectors jump straight
    // to a new inspection. Pure technicians get the lead-type picker so they
    // can choose New Lead or Upsell instead of being forced into New Lead.
    if (showBothOptions) {
      setShowPopup(true);
    } else if (isInspector) {
      router.push('/field-sales/field-map/new');
    } else {
      setShowLeadTypePicker(true);
    }
  };

  const goToNewLeadType = (type: 'new-lead' | 'upsell') => {
    setShowLeadTypePicker(false);
    router.push(`/field-sales/tech-leads/new?type=${type}`);
  };

  const thirdHref = '/field-sales/reports';
  const thirdLabel = 'Reports';

  return (
    <>
      {showLeadTypePicker && (
        <div
          className={styles.overlay}
          onClick={() => setShowLeadTypePicker(false)}
        >
          <div className={styles.sheet} onClick={e => e.stopPropagation()}>
            <p className={styles.sheetTitle}>What would you like to create?</p>
            <button
              type="button"
              className={styles.sheetOption}
              onClick={() => goToNewLeadType('new-lead')}
            >
              <span className={styles.sheetOptionIcon}>
                <UserPlus size={22} />
              </span>
              <span className={styles.sheetOptionText}>
                <strong>New Lead</strong>
                <span>Capture a brand-new opportunity</span>
              </span>
            </button>
            <button
              type="button"
              className={styles.sheetOption}
              onClick={() => goToNewLeadType('upsell')}
            >
              <span className={styles.sheetOptionIcon}>
                <TrendingUp size={22} />
              </span>
              <span className={styles.sheetOptionText}>
                <strong>Upsell Opportunity</strong>
                <span>Add to an existing customer&apos;s service</span>
              </span>
            </button>
            <button
              type="button"
              className={styles.sheetCancel}
              onClick={() => setShowLeadTypePicker(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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
                router.push('/field-sales/tech-leads/new');
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
            className={`${styles.newItem} ${disableNew ? styles.newItemDisabled : ''}`}
            onClick={handleNewPress}
            disabled={disableNew}
            aria-disabled={disableNew}
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

          {/* Third item: Reports — disabled for admins/managers/owners,
              who get team reports inline on the dashboard. */}
          {reportsDisabled ? (
            <button
              type="button"
              disabled
              aria-disabled="true"
              className={`${styles.navItem} ${styles.navItemDisabled ?? ''}`}
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
            </button>
          ) : (
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
          )}
        </div>
      </nav>
    </>
  );
}
