'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCompany } from '@/contexts/CompanyContext';
import { usePageActions } from '@/contexts/PageActionsContext';
import { FieldSalesNav } from '@/components/FieldMap/FieldSalesNav/FieldSalesNav';
import styles from './routing.module.scss';

interface Route {
  id: string;
  name: string | null;
  route_date: string;
  route_type: string;
  status: string;
  assigned_to: string | null;
  estimated_total_duration: number | null;
  estimated_total_distance: number | null;
  route_stops: { count: number }[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function statusLabel(status: string): { label: string; className: string } {
  switch (status) {
    case 'draft': return { label: 'Draft', className: styles.statusDraft };
    case 'scheduled': return { label: 'Scheduled', className: styles.statusScheduled };
    case 'in_progress': return { label: 'In Progress', className: styles.statusInProgress };
    case 'completed': return { label: 'Completed', className: styles.statusCompleted };
    case 'cancelled': return { label: 'Cancelled', className: styles.statusCancelled };
    default: return { label: status, className: styles.statusDraft };
  }
}

function routeTypeLabel(type: string): string {
  switch (type) {
    case 'technician': return 'Tech';
    case 'sales': return 'Sales';
    case 'inspector': return 'Inspector';
    default: return type;
  }
}

export default function RoutingPage() {
  const { selectedCompany } = useCompany();
  const { setPageHeader } = usePageActions();

  const todayStr = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 13);
    return d.toISOString().split('T')[0];
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPageHeader({ title: 'Routing', description: '' });
    return () => setPageHeader(null);
  }, [setPageHeader]);

  useEffect(() => {
    if (!selectedCompany?.id) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({
      companyId: selectedCompany.id,
      startDate,
      endDate,
    });
    if (statusFilter) params.set('status', statusFilter);

    fetch(`/api/routing/routes?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setRoutes(data.routes ?? []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedCompany?.id, startDate, endDate, statusFilter]);

  // Group routes by date
  const grouped = routes.reduce<Record<string, Route[]>>((acc, route) => {
    if (!acc[route.route_date]) acc[route.route_date] = [];
    acc[route.route_date].push(route);
    return acc;
  }, {});

  const sortedDates = Object.keys(grouped).sort();

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.dateRange}>
          <input
            type="date"
            className={styles.dateInput}
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
          <span className={styles.dateRangeSep}>to</span>
          <input
            type="date"
            className={styles.dateInput}
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <Link href="/field-sales/routes/new" className={styles.newButton}>
          + New Route
        </Link>
      </div>

      <div className={styles.body}>
        {loading && (
          <div className={styles.stateBox}>
            <div className={styles.spinner} />
            <p>Loading routes&hellip;</p>
          </div>
        )}

        {!loading && error && (
          <div className={styles.stateBox}>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}

        {!loading && !error && routes.length === 0 && (
          <div className={styles.stateBox}>
            <h2 className={styles.stateTitle}>No routes in this range</h2>
            <p className={styles.stateText}>Create a new route to get started.</p>
            <Link href="/field-sales/routes/new" className={styles.stateAction}>
              Create Route
            </Link>
          </div>
        )}

        {!loading && !error && sortedDates.map(date => (
          <div key={date} className={styles.dateGroup}>
            <h2 className={styles.dateHeader}>{formatDate(date)}</h2>
            <div className={styles.routeList}>
              {grouped[date].map(route => {
                const stopCount = route.route_stops?.[0]?.count ?? 0;
                const badge = statusLabel(route.status);
                return (
                  <Link
                    key={route.id}
                    href={`/field-sales/routes/${route.id}`}
                    className={styles.routeCard}
                  >
                    <div className={styles.routeCardLeft}>
                      <span className={styles.routeName}>
                        {route.name ?? `Route — ${formatDate(route.route_date)}`}
                      </span>
                      <div className={styles.routeMeta}>
                        <span className={styles.routeType}>
                          {routeTypeLabel(route.route_type)}
                        </span>
                        <span className={styles.stopCount}>{stopCount} stop{stopCount !== 1 ? 's' : ''}</span>
                        {route.estimated_total_duration && (
                          <span className={styles.duration}>
                            ~{Math.round(route.estimated_total_duration / 60 * 10) / 10}h
                          </span>
                        )}
                      </div>
                    </div>
                    <span className={`${styles.statusBadge} ${badge.className}`}>
                      {badge.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <FieldSalesNav />
    </div>
  );
}
