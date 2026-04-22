'use client';

import {
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useUserDepartments } from '@/hooks/useUserDepartments';
import { useUser } from '@/hooks/useUser';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useRealtimeCounts } from '@/hooks/useRealtimeCounts';
import { FieldMapDashboard } from '@/components/FieldMap/FieldMapDashboard/FieldMapDashboard';
import { FieldSalesLeadsDashboard } from '@/components/FieldMap/FieldSalesLeadsDashboard/FieldSalesLeadsDashboard';
import { FieldSalesNav } from '@/components/FieldMap/FieldSalesNav/FieldSalesNav';
import { TechLeadsOpportunities } from '@/components/TechLeads/TechLeadsOpportunities/TechLeadsOpportunities';
import ActionsAutomationsPanel from '@/components/Tasks/ActionsAutomationsPanel/ActionsAutomationsPanel';
import AdditionalTasksPanel from '@/components/Tasks/AdditionalTasksPanel/AdditionalTasksPanel';
import { Toast } from '@/components/Common/Toast';
import styles from './dashboard.module.scss';

type DashboardTab = 'route' | 'leads' | 'opportunities' | 'actions' | 'tasks';

export default function FieldSalesDashboard() {
  return (
    <Suspense fallback={null}>
      <FieldSalesDashboardInner />
    </Suspense>
  );
}

function FieldSalesDashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [userId, setUserId] = useState<string | null>(null);
  const { selectedCompany, isAdmin } = useCompany();
  const { departments } = useUserDepartments(
    userId ?? '',
    selectedCompany?.id ?? ''
  );
  const { profile, user } = useUser();
  const { setPageHeader } = usePageActions();
  const { counts, newItemIndicators, clearNewItemIndicator } =
    useRealtimeCounts();

  const [activeTab, setActiveTab] = useState<DashboardTab>('route');
  const [routeStops, setRouteStops] = useState(0);
  const [opportunitiesCount, setOpportunitiesCount] = useState(0);
  const [sliderStyle, setSliderStyle] = useState<{
    left: number;
    width: number;
  } | null>(null);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [createTaskTrigger, setCreateTaskTrigger] = useState(0);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const mobileDropdownRef = useRef<HTMLDivElement | null>(null);

  // Show a success toast after returning from a TechLeads wizard submission.
  useEffect(() => {
    const submitted = searchParams.get('submitted');
    if (submitted !== 'new-lead' && submitted !== 'upsell') return;
    setSuccessToast(
      submitted === 'upsell'
        ? 'Opportunity submitted successfully'
        : 'Lead submitted successfully'
    );
    const params = new URLSearchParams(searchParams.toString());
    params.delete('submitted');
    const qs = params.toString();
    router.replace(`/field-sales/dashboard${qs ? `?${qs}` : ''}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  const isTechnicianOnly =
    !isAdmin &&
    departments.includes('technician') &&
    !departments.includes('inspector');
  const isInspector = isAdmin || departments.includes('inspector');

  const TAB_ORDER = useMemo<DashboardTab[]>(
    () =>
      isTechnicianOnly
        ? ['route', 'opportunities']
        : ['route', 'leads', 'actions', 'tasks'],
    [isTechnicianOnly]
  );

  // Set page header
  useEffect(() => {
    if (!profile) return;
    const firstName = `${profile.first_name}'s` || 'Your';
    const title = `${firstName} Dashboard`;
    setPageHeader({ title, description: '' });
    return () => {
      setPageHeader(null);
    };
  }, [profile, isTechnicianOnly, setPageHeader]);

  // Fetch route stops count
  useEffect(() => {
    if (!selectedCompany?.id) return;
    const today = new Date().toISOString().split('T')[0];
    fetch(`/api/field-map/route?date=${today}&companyId=${selectedCompany.id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d =>
        setRouteStops(d && Array.isArray(d.stops) ? d.stops.length : 0)
      )
      .catch(() => setRouteStops(0));
  }, [selectedCompany?.id]);

  // Fetch opportunities count (technician-only)
  useEffect(() => {
    if (!isTechnicianOnly || !selectedCompany?.id) {
      setOpportunitiesCount(0);
      return;
    }
    fetch(`/api/tech-leads/leads?companyId=${selectedCompany.id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d =>
        setOpportunitiesCount(d && Array.isArray(d.leads) ? d.leads.length : 0)
      )
      .catch(() => setOpportunitiesCount(0));
  }, [isTechnicianOnly, selectedCompany?.id]);

  // Update slider position whenever active tab changes or the tab resizes.
  // useLayoutEffect so the slider is positioned before paint on first render.
  // ResizeObserver catches the initial 0→actual-width flip in case the tab
  // bar hasn't been laid out yet when the effect runs.
  useLayoutEffect(() => {
    const index = TAB_ORDER.indexOf(activeTab);
    const tabEl = tabRefs.current[index];
    if (!tabEl) return;

    const measure = () => {
      if (!tabEl) return;
      if (tabEl.offsetWidth === 0) return;
      setSliderStyle({
        left: tabEl.offsetLeft,
        width: tabEl.offsetWidth,
      });
    };

    measure();
    const raf = requestAnimationFrame(measure);
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(tabEl);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
    };
  }, [activeTab, TAB_ORDER, isTechnicianOnly, isInspector]);

  const handleTabClick = (tab: DashboardTab) => {
    setActiveTab(tab);
    setMobileDropdownOpen(false);
    if (tab === 'actions') clearNewItemIndicator('my_actions');
    if (tab === 'tasks') clearNewItemIndicator('my_tasks');
    if (tab === 'leads' || tab === 'opportunities')
      clearNewItemIndicator('my_leads');
  };

  useEffect(() => {
    if (!mobileDropdownOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (
        mobileDropdownRef.current &&
        !mobileDropdownRef.current.contains(e.target as Node)
      ) {
        setMobileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [mobileDropdownOpen]);

  const tabConfig: Record<
    DashboardTab,
    { label: string; count: number; isNew?: boolean }
  > = {
    route: { label: 'My Route', count: routeStops },
    leads: {
      label: 'My Leads & Sales',
      count: counts.my_leads,
      isNew: newItemIndicators.my_leads,
    },
    opportunities: {
      label: 'My Opportunities',
      count: opportunitiesCount,
    },
    actions: {
      label: 'My Actions',
      count: counts.my_actions,
      isNew: newItemIndicators.my_actions,
    },
    tasks: {
      label: 'My Tasks',
      count: counts.my_tasks,
      isNew: newItemIndicators.my_tasks,
    },
  };

  // Inspector / Admin / Technician view (with tabs)
  if (isTechnicianOnly || isInspector) {
    return (
      <div className={styles.wrapperInspector}>
        {/* Tab bar */}
        <div className={styles.tabBarWrapper}>
          <div className={styles.tabBar}>
            {/* Sliding background */}
            {sliderStyle && (
              <div
                className={styles.tabSlider}
                style={{ left: sliderStyle.left, width: sliderStyle.width }}
              />
            )}

            <button
              ref={el => {
                tabRefs.current[TAB_ORDER.indexOf('route')] = el;
              }}
              type="button"
              className={`${styles.tab} ${activeTab === 'route' ? styles.tabActive : ''}`}
              onClick={() => handleTabClick('route')}
            >
              <span className={styles.tabLabel}>My Route</span>
              <span className={styles.tabCount}>{routeStops}</span>
            </button>

            {isTechnicianOnly && (
              <button
                ref={el => {
                  tabRefs.current[TAB_ORDER.indexOf('opportunities')] = el;
                }}
                type="button"
                className={`${styles.tab} ${activeTab === 'opportunities' ? styles.tabActive : ''}`}
                onClick={() => handleTabClick('opportunities')}
              >
                <span className={styles.tabLabel}>My Opportunities</span>
                <span className={styles.tabCount}>{opportunitiesCount}</span>
              </button>
            )}

            {!isTechnicianOnly && (
              <button
                ref={el => {
                  tabRefs.current[TAB_ORDER.indexOf('leads')] = el;
                }}
                type="button"
                className={`${styles.tab} ${activeTab === 'leads' ? styles.tabActive : ''}`}
                onClick={() => handleTabClick('leads')}
              >
                <span className={styles.tabLabel}>My Leads &amp; Sales</span>
                <span
                  className={`${styles.tabCount} ${newItemIndicators.my_leads ? styles.tabCountNew : ''}`}
                >
                  {counts.my_leads}
                </span>
              </button>
            )}

            {!isTechnicianOnly && (
              <button
                ref={el => {
                  tabRefs.current[TAB_ORDER.indexOf('actions')] = el;
                }}
                type="button"
                className={`${styles.tab} ${activeTab === 'actions' ? styles.tabActive : ''}`}
                onClick={() => handleTabClick('actions')}
              >
                <span className={styles.tabLabel}>My Actions</span>
                <span
                  className={`${styles.tabCount} ${newItemIndicators.my_actions ? styles.tabCountNew : ''}`}
                >
                  {counts.my_actions}
                </span>
              </button>
            )}

            {!isTechnicianOnly && (
              <button
                ref={el => {
                  tabRefs.current[TAB_ORDER.indexOf('tasks')] = el;
                }}
                type="button"
                className={`${styles.tab} ${activeTab === 'tasks' ? styles.tabActive : ''}`}
                onClick={() => handleTabClick('tasks')}
              >
                <span className={styles.tabLabel}>My Tasks</span>
                <span
                  className={`${styles.tabCount} ${newItemIndicators.my_tasks ? styles.tabCountNew : ''}`}
                >
                  {counts.my_tasks}
                </span>
              </button>
            )}
          </div>

          {/* Mobile dropdown — visible only under 768px */}
          <div className={styles.mobileTabSelect} ref={mobileDropdownRef}>
            <button
              type="button"
              className={styles.mobileTabTrigger}
              onClick={() => setMobileDropdownOpen(prev => !prev)}
              aria-haspopup="listbox"
              aria-expanded={mobileDropdownOpen}
            >
              <span className={styles.tabLabel}>
                {tabConfig[activeTab].label}
              </span>
              <span
                className={`${styles.tabCount} ${tabConfig[activeTab].isNew ? styles.tabCountNew : ''}`}
              >
                {tabConfig[activeTab].count}
              </span>
              <span
                className={`${styles.mobileTabChevron} ${mobileDropdownOpen ? styles.mobileTabChevronOpen : ''}`}
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <path
                    d="M6 7.77734L10 12.2218L14 7.77734"
                    stroke="#6A7282"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>

            {mobileDropdownOpen && (
              <div className={styles.mobileTabMenu} role="listbox">
                {TAB_ORDER.filter(t => t !== activeTab).map(tab => (
                  <button
                    key={tab}
                    type="button"
                    role="option"
                    aria-selected={false}
                    className={styles.mobileTabMenuItem}
                    onClick={() => handleTabClick(tab)}
                  >
                    <span className={styles.tabLabel}>
                      {tabConfig[tab].label}
                    </span>
                    <span
                      className={`${styles.tabCount} ${tabConfig[tab].isNew ? styles.tabCountNew : ''}`}
                    >
                      {tabConfig[tab].count}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className={styles.contentArea}>
          {activeTab === 'route' && (
            <FieldMapDashboard
              companyId={selectedCompany?.id ?? ''}
              embedded
              isTechnicianOnly={isTechnicianOnly}
            />
          )}

          {activeTab === 'opportunities' && isTechnicianOnly && (
            <div className={styles.opportunitiesSection}>
              <TechLeadsOpportunities embedded />
            </div>
          )}

          {activeTab === 'leads' && !isTechnicianOnly && (
            <div className={styles.leadsSection}>
              <FieldSalesLeadsDashboard
                companyId={selectedCompany?.id ?? ''}
                userId={userId ?? ''}
              />
            </div>
          )}

          {activeTab === 'actions' &&
            !isTechnicianOnly &&
            user &&
            selectedCompany && (
              <div className={styles.panelSection}>
                <ActionsAutomationsPanel
                  companyId={selectedCompany.id}
                  userId={user.id}
                />
              </div>
            )}

          {activeTab === 'tasks' &&
            !isTechnicianOnly &&
            user &&
            selectedCompany && (
              <div className={styles.panelSection}>
                <div className={styles.tasksHeader}>
                  <button
                    type="button"
                    className={styles.createTaskBtn}
                    onClick={() => setCreateTaskTrigger(t => t + 1)}
                  >
                    + Create Task
                  </button>
                </div>
                <AdditionalTasksPanel
                  companyId={selectedCompany.id}
                  userId={user.id}
                  externalCreateTrigger={createTaskTrigger}
                />
              </div>
            )}
        </div>

        <FieldSalesNav />
        <Toast
          message={successToast ?? ''}
          isVisible={!!successToast}
          onClose={() => setSuccessToast(null)}
          type="success"
          centered
        />
      </div>
    );
  }

  // Fallback
  return (
    <div className={styles.wrapper}>
      <FieldSalesNav />
      <Toast
        message={successToast ?? ''}
        isVisible={!!successToast}
        onClose={() => setSuccessToast(null)}
        type="success"
      />
    </div>
  );
}
