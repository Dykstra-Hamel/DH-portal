'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
import styles from './dashboard.module.scss';

type DashboardTab = 'route' | 'leads' | 'opportunities' | 'actions' | 'tasks';

export default function FieldSalesDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const { selectedCompany, isAdmin } = useCompany();
  const { departments } = useUserDepartments(
    userId ?? '',
    selectedCompany?.id ?? ''
  );
  const { profile, user } = useUser();
  const { setPageHeader, registerPageAction, unregisterPageAction } = usePageActions();
  const { counts, newItemIndicators, clearNewItemIndicator } = useRealtimeCounts();

  const [activeTab, setActiveTab] = useState<DashboardTab>('route');
  const [routeStops, setRouteStops] = useState(0);
  const [opportunitiesCount, setOpportunitiesCount] = useState(0);
  const [createTrigger, setCreateTrigger] = useState(0);
  const [sliderStyle, setSliderStyle] = useState<{ left: number; width: number } | null>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

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
        ? ['route', 'opportunities', 'tasks']
        : ['route', 'leads', 'actions', 'tasks'],
    [isTechnicianOnly]
  );

  // Set page header
  useEffect(() => {
    if (!profile) return;
    const firstName = profile.first_name || 'Your';
    const title = isTechnicianOnly
      ? `${firstName}'s Tech Dashboard`
      : `${firstName}'s Sales Dashboard`;
    setPageHeader({ title, description: '' });
    return () => {
      setPageHeader(null);
    };
  }, [profile, isTechnicianOnly, setPageHeader]);

  // Register add action when tasks tab is active
  useEffect(() => {
    if (activeTab === 'tasks') {
      registerPageAction('add', () => setCreateTrigger(prev => prev + 1));
      return () => unregisterPageAction('add');
    }
  }, [activeTab, registerPageAction, unregisterPageAction]);

  // Fetch route stops count
  useEffect(() => {
    if (!selectedCompany?.id) return;
    const today = new Date().toISOString().split('T')[0];
    fetch(`/api/field-map/route?date=${today}&companyId=${selectedCompany.id}`)
      .then(r => (r.ok ? r.json() : null))
      .then(d => setRouteStops(d && Array.isArray(d.stops) ? d.stops.length : 0))
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
    if (tab === 'actions') clearNewItemIndicator('my_actions');
    if (tab === 'tasks') clearNewItemIndicator('my_tasks');
    if (tab === 'leads' || tab === 'opportunities')
      clearNewItemIndicator('my_leads');
  };

  // Regular (non-action) tasks = total active - actions
  const regularTasksCount = Math.max(0, counts.my_tasks - counts.my_actions);

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
              ref={el => { tabRefs.current[TAB_ORDER.indexOf('route')] = el; }}
              type="button"
              className={`${styles.tab} ${activeTab === 'route' ? styles.tabActive : ''}`}
              onClick={() => handleTabClick('route')}
            >
              <span className={styles.tabLabel}>My Route</span>
              <span className={styles.tabCount}>{routeStops}</span>
            </button>

            {isTechnicianOnly && (
              <button
                ref={el => { tabRefs.current[TAB_ORDER.indexOf('opportunities')] = el; }}
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
                ref={el => { tabRefs.current[TAB_ORDER.indexOf('leads')] = el; }}
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
                ref={el => { tabRefs.current[TAB_ORDER.indexOf('actions')] = el; }}
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

            <button
              ref={el => { tabRefs.current[TAB_ORDER.indexOf('tasks')] = el; }}
              type="button"
              className={`${styles.tab} ${activeTab === 'tasks' ? styles.tabActive : ''}`}
              onClick={() => handleTabClick('tasks')}
            >
              <span className={styles.tabLabel}>My Tasks</span>
              <span
                className={`${styles.tabCount} ${newItemIndicators.my_tasks ? styles.tabCountNew : ''}`}
              >
                {regularTasksCount}
              </span>
            </button>
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

          {activeTab === 'actions' && !isTechnicianOnly && user && selectedCompany && (
            <div className={styles.panelSection}>
              <ActionsAutomationsPanel
                companyId={selectedCompany.id}
                userId={user.id}
              />
            </div>
          )}

          {activeTab === 'tasks' && user && selectedCompany && (
            <div className={styles.panelSection}>
              <AdditionalTasksPanel
                companyId={selectedCompany.id}
                userId={user.id}
                externalCreateTrigger={createTrigger}
              />
            </div>
          )}
        </div>

        <FieldSalesNav />
      </div>
    );
  }

  // Fallback
  return (
    <div className={styles.wrapper}>
      <FieldSalesNav />
    </div>
  );
}
