'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useUserDepartments } from '@/hooks/useUserDepartments';
import { useUser } from '@/hooks/useUser';
import { usePageActions } from '@/contexts/PageActionsContext';
import { FieldMapDashboard } from '@/components/FieldMap/FieldMapDashboard/FieldMapDashboard';
import { FieldOpsLeadsDashboard } from '@/components/FieldMap/FieldOpsLeadsDashboard/FieldOpsLeadsDashboard';
import { FieldOpsNav } from '@/components/FieldMap/FieldOpsNav/FieldOpsNav';
import { Route, Ticket } from 'lucide-react';
import styles from './dashboard.module.scss';

type FieldOpsView = 'leads' | 'route';

interface Counts {
  routeStops: number;
  newLeads: number;
  myLeads: number;
  myActions: number;
  myTasks: number;
}

export default function FieldOpsDashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const { selectedCompany, isAdmin } = useCompany();
  const { departments } = useUserDepartments(
    userId ?? '',
    selectedCompany?.id ?? ''
  );
  const { profile } = useUser();
  const { setPageHeader } = usePageActions();

  const [view, setView] = useState<FieldOpsView>('leads');
  const [counts, setCounts] = useState<Counts>({
    routeStops: 0,
    newLeads: 0,
    myLeads: 0,
    myActions: 0,
    myTasks: 0,
  });
  const [loadingCounts, setLoadingCounts] = useState(false);

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

  // Set page header title based on role
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

  // Fetch counts for inspector/admin cards
  useEffect(() => {
    if (!isInspector || !selectedCompany?.id || !userId) return;
    setLoadingCounts(true);

    const companyId = selectedCompany.id;
    const today = new Date().toISOString().split('T')[0];

    Promise.all([
      // Route stops count
      fetch(`/api/field-map/route?date=${today}&companyId=${companyId}`)
        .then(r => (r.ok ? r.json() : null))
        .then(d => (d && Array.isArray(d.stops) ? d.stops.length : 0))
        .catch(() => 0),

      // New leads count
      fetch(
        `/api/field-ops/leads?companyId=${companyId}&type=new&userId=${userId}`
      )
        .then(r => (r.ok ? r.json() : null))
        .then(d => (d && Array.isArray(d.leads) ? d.leads.length : 0))
        .catch(() => 0),

      // My leads count
      fetch(
        `/api/field-ops/leads?companyId=${companyId}&type=my&userId=${userId}`
      )
        .then(r => (r.ok ? r.json() : null))
        .then(d => (d && Array.isArray(d.leads) ? d.leads.length : 0))
        .catch(() => 0),

      // Tasks (actions + regular)
      fetch(
        `/api/tasks?companyId=${companyId}&assignedTo=${userId}&includeArchived=false`
      )
        .then(r => (r.ok ? r.json() : null))
        .then(d => {
          const all = d && Array.isArray(d.tasks) ? d.tasks : [];
          const actions = all.filter(
            (t: any) => t.cadence_step_id && t.status !== 'completed'
          );
          const tasks = all.filter(
            (t: any) => !t.cadence_step_id && t.status !== 'completed'
          );
          return { actions: actions.length, tasks: tasks.length };
        })
        .catch(() => ({ actions: 0, tasks: 0 })),
    ])
      .then(([routeStops, newLeads, myLeads, taskCounts]) => {
        setCounts({
          routeStops,
          newLeads,
          myLeads,
          myActions: (taskCounts as { actions: number; tasks: number }).actions,
          myTasks: (taskCounts as { actions: number; tasks: number }).tasks,
        });
      })
      .finally(() => setLoadingCounts(false));
  }, [isInspector, selectedCompany?.id, userId]);

  // Technician-only: show route directly, no cards, no toggle
  if (isTechnicianOnly) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.section}>
          <FieldMapDashboard
            companyId={selectedCompany?.id ?? ''}
            isTechnicianOnly={true}
          />
        </div>
        <FieldOpsNav />
      </div>
    );
  }

  // Inspector / Admin view
  if (isInspector) {
    return (
      <div className={styles.wrapperInspector}>
        {/* Top cards row */}
        <div className={styles.cardsRow}>
          {/* Card 1: toggle between route and leads */}
          {view === 'leads' ? (
            <button
              type="button"
              className={`${styles.card} ${styles.toggleCard}`}
              onClick={() => setView('route')}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>
                  <Route size={18} />
                  My Route
                </span>
                <span className={styles.badge}>
                  {loadingCounts ? '…' : `${counts.routeStops} Stops`}
                </span>
              </div>
              <p className={styles.cardDescription}>
                See your schedule for today, where you will be going, and when.
              </p>
            </button>
          ) : (
            <button
              type="button"
              className={`${styles.card} ${styles.toggleCard}`}
              onClick={() => setView('leads')}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>
                  <Ticket size={18} />
                  New
                </span>
                <span
                  className={`${styles.badge} ${counts.newLeads > 0 ? styles.badgeNew : ''}`}
                >
                  {loadingCounts ? '…' : counts.newLeads}
                </span>
                <span className={styles.cardTitle}>My Leads</span>
                <span className={styles.badge}>
                  {loadingCounts ? '…' : counts.myLeads}
                </span>
              </div>
              <p className={styles.cardDescription}>
                View new leads queue and assigned leads.
              </p>
            </button>
          )}

          {/* Card 2: My Actions */}
          <button
            type="button"
            className={`${styles.card} ${styles.actionCard}`}
            onClick={() => (window.location.href = '/field-ops/my-tasks')}
          >
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>My Actions</span>
              <span className={styles.badge}>
                {loadingCounts ? '…' : counts.myActions}
              </span>
            </div>
            <p className={styles.cardDescription}>
              Actions for following up assigned leads.
            </p>
          </button>

          {/* Card 3: My Tasks */}
          <button
            type="button"
            className={`${styles.card} ${styles.taskCard}`}
            onClick={() => (window.location.href = '/field-ops/my-tasks')}
          >
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>My Tasks</span>
              <span className={styles.badge}>
                {loadingCounts ? '…' : counts.myTasks}
              </span>
            </div>
            <p className={styles.cardDescription}>
              Personal tasks assigned to you.
            </p>
          </button>
        </div>

        {/* Main content area */}
        <div className={styles.contentArea}>
          {view === 'leads' ? (
            <div className={styles.leadsSection}>
              <h2 className={styles.sectionTitle}>Leads</h2>
              <FieldOpsLeadsDashboard
                companyId={selectedCompany?.id ?? ''}
                userId={userId ?? ''}
              />
            </div>
          ) : (
            <FieldMapDashboard companyId={selectedCompany?.id ?? ''} embedded />
          )}
        </div>

        <FieldOpsNav />
      </div>
    );
  }

  // Fallback for no role yet determined
  return (
    <div className={styles.wrapper}>
      <FieldOpsNav />
    </div>
  );
}
