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
import { useCompanyRole } from '@/hooks/useCompanyRole';
import { useUser } from '@/hooks/useUser';
import { useViewAs } from '@/hooks/useViewAs';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useRealtimeCounts } from '@/hooks/useRealtimeCounts';
import { FieldMapDashboard } from '@/components/FieldMap/FieldMapDashboard/FieldMapDashboard';
import { FieldSalesLeadsDashboard } from '@/components/FieldMap/FieldSalesLeadsDashboard/FieldSalesLeadsDashboard';
import { FieldSalesNav } from '@/components/FieldMap/FieldSalesNav/FieldSalesNav';
import { FieldSalesAdminDashboard } from '@/components/FieldSalesAdminDashboard/FieldSalesAdminDashboard';
import { TechLeadsOpportunities } from '@/components/TechLeads/TechLeadsOpportunities/TechLeadsOpportunities';
import { TechDashboardHome } from '@/components/TechLeads/TechDashboardHome/TechDashboardHome';
import ActionsAutomationsPanel from '@/components/Tasks/ActionsAutomationsPanel/ActionsAutomationsPanel';
import AdditionalTasksPanel from '@/components/Tasks/AdditionalTasksPanel/AdditionalTasksPanel';
import { Toast } from '@/components/Common/Toast';
import styles from './dashboard.module.scss';

type DashboardTab =
  | 'home'
  | 'route'
  | 'leads'
  | 'opportunities'
  | 'actions'
  | 'tasks';

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
  const { departments, isLoading: isDepartmentsLoading } = useUserDepartments(
    userId ?? '',
    selectedCompany?.id ?? ''
  );
  const { isCompanyAdmin, role: companyRole } = useCompanyRole(selectedCompany?.id);
  const { profile, user } = useUser();
  const { viewAs } = useViewAs();
  const [defaultManagerBranchId, setDefaultManagerBranchId] = useState<
    string | null
  >(null);

  // A global admin can preview the dashboard as a different role/user via
  // the ViewAsDropdown in the header. The override only changes which
  // branch of the routing tree we render — data access is unchanged.
  const viewAsActive =
    isAdmin && !!viewAs && viewAs.companyId === selectedCompany?.id;
  const effectiveDashboardRole: 'admin' | 'manager' | 'inspector' | 'tech' | null =
    viewAsActive ? viewAs!.role : null;
  const { setPageHeader } = usePageActions();
  const { counts, newItemIndicators, clearNewItemIndicator } =
    useRealtimeCounts();

  const [activeTab, setActiveTab] = useState<DashboardTab>('home');
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

  // Resolve a manager's default branch: their first user_branch_assignments
  // row for this company, falling back to the company's primary branch.
  // Also fired when a global admin is impersonating a manager — in that
  // case we look up the impersonated user's branches.
  useEffect(() => {
    const isManagerContext =
      effectiveDashboardRole === 'manager' || companyRole === 'manager';
    const targetUserId =
      effectiveDashboardRole === 'manager' && viewAs ? viewAs.userId : userId;
    if (!isManagerContext || !targetUserId || !selectedCompany?.id) {
      setDefaultManagerBranchId(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/users/${targetUserId}/branches?companyId=${selectedCompany.id}`
        );
        if (res.ok) {
          const data = await res.json();
          const first = (data.assignments ?? [])[0];
          if (first?.branch_id) {
            if (!cancelled) setDefaultManagerBranchId(first.branch_id);
            return;
          }
        }
        const branchesRes = await fetch(
          `/api/branches?companyId=${selectedCompany.id}`
        );
        if (branchesRes.ok && !cancelled) {
          const data = await branchesRes.json();
          const primary = (data.branches ?? []).find(
            (b: any) => b.is_primary
          );
          setDefaultManagerBranchId(primary?.id ?? null);
        }
      } catch {
        if (!cancelled) setDefaultManagerBranchId(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    companyRole,
    userId,
    selectedCompany?.id,
    effectiveDashboardRole,
    viewAs,
  ]);

  const baseTechnicianOnly =
    !isAdmin &&
    departments.includes('technician') &&
    !departments.includes('inspector');
  const baseInspector = isAdmin || departments.includes('inspector');

  // Apply view-as overrides for the inspector/tech tab views.
  const isTechnicianOnly =
    effectiveDashboardRole === 'tech'
      ? true
      : effectiveDashboardRole === 'inspector'
      ? false
      : baseTechnicianOnly;
  const isInspector =
    effectiveDashboardRole === 'inspector'
      ? true
      : effectiveDashboardRole === 'tech'
      ? false
      : baseInspector;

  // Per-user data scope. When viewing as a specific inspector/tech, swap in
  // their user_id where supported (FieldSalesLeadsDashboard, etc.). Panels
  // that read useUser() internally will still see the actual signed-in user.
  const effectiveUserId =
    viewAsActive &&
    (effectiveDashboardRole === 'inspector' ||
      effectiveDashboardRole === 'tech')
      ? viewAs!.userId
      : userId;

  const TAB_ORDER = useMemo<DashboardTab[]>(
    () =>
      isTechnicianOnly
        ? ['home', 'route', 'opportunities']
        : ['route', 'leads', 'actions', 'tasks'],
    [isTechnicianOnly]
  );

  // If the current tab isn't valid for this user (e.g. 'home' default for a
  // non-tech user), snap to the first tab in the current order. Wait for
  // userId *and* the departments fetch to finish — TAB_ORDER depends on
  // `isTechnicianOnly`, which is false while departments are still loading,
  // so running earlier would bump technicians off the 'home' default.
  useEffect(() => {
    if (!userId || isDepartmentsLoading) return;
    if (!TAB_ORDER.includes(activeTab)) {
      setActiveTab(TAB_ORDER[0]);
    }
  }, [TAB_ORDER, activeTab, userId, isDepartmentsLoading]);

  // Set page header
  useEffect(() => {
    if (!profile) return;
    const firstName = profile.first_name || 'Your';
    const title = isCompanyAdmin
      ? `${firstName}'s Team Dashboard`
      : isTechnicianOnly
        ? `${firstName}'s Tech Dashboard`
        : `${firstName}'s Sales Dashboard`;
    setPageHeader({ title, description: '' });
    return () => {
      setPageHeader(null);
    };
  }, [profile, isTechnicianOnly, isCompanyAdmin, setPageHeader]);

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
    home: { label: 'Dashboard', count: 0 },
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

  // Company admin/owner — aggregated team reports dashboard (all branches).
  // Company manager — same component but scoped to direct reports + default branch.
  // Global admin (no view-as override) — admin dashboard, even if they don't
  // have a user_companies row for the selected company.
  // Global admin (with override) — preview as the chosen role.
  const renderAdminOrManagerDashboard =
    !!selectedCompany?.id &&
    !!userId &&
    ((!viewAsActive && (isCompanyAdmin || isAdmin)) ||
      (viewAsActive &&
        (effectiveDashboardRole === 'admin' ||
          effectiveDashboardRole === 'manager')));

  if (renderAdminOrManagerDashboard && selectedCompany?.id) {
    let dashboardRole: 'admin' | 'manager';
    let managerUserIdForDashboard: string | undefined;

    if (viewAsActive && effectiveDashboardRole === 'manager') {
      dashboardRole = 'manager';
      managerUserIdForDashboard = viewAs!.userId;
    } else if (viewAsActive && effectiveDashboardRole === 'admin') {
      dashboardRole = 'admin';
      managerUserIdForDashboard = undefined;
    } else {
      dashboardRole = companyRole === 'manager' ? 'manager' : 'admin';
      managerUserIdForDashboard =
        dashboardRole === 'manager' ? userId ?? undefined : undefined;
    }

    return (
      <div className={styles.wrapperInspector}>
        <div className={styles.contentArea}>
          <FieldSalesAdminDashboard
            companyId={selectedCompany.id}
            greetingName={profile?.first_name ?? undefined}
            scopeRole={dashboardRole}
            managerUserId={managerUserIdForDashboard}
            defaultBranchId={
              dashboardRole === 'manager' ? defaultManagerBranchId : null
            }
          />
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

            {isTechnicianOnly && (
              <button
                ref={el => {
                  tabRefs.current[TAB_ORDER.indexOf('home')] = el;
                }}
                type="button"
                className={`${styles.tab} ${activeTab === 'home' ? styles.tabActive : ''}`}
                onClick={() => handleTabClick('home')}
              >
                <span className={styles.tabLabel}>Dashboard</span>
              </button>
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
              {activeTab !== 'home' && (
                <span
                  className={`${styles.tabCount} ${tabConfig[activeTab].isNew ? styles.tabCountNew : ''}`}
                >
                  {tabConfig[activeTab].count}
                </span>
              )}
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
                    {tab !== 'home' && (
                      <span
                        className={`${styles.tabCount} ${tabConfig[tab].isNew ? styles.tabCountNew : ''}`}
                      >
                        {tabConfig[tab].count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className={styles.contentArea}>
          {activeTab === 'home' && isTechnicianOnly && (
            <TechDashboardHome />
          )}

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
                userId={effectiveUserId ?? ''}
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

        <FieldSalesNav disableNew={activeTab === 'home'} />
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
