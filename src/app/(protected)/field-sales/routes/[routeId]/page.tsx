'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCompany } from '@/contexts/CompanyContext';
import styles from './routeDetail.module.scss';

interface RouteStop {
  id: string;
  stop_order: number;
  status: string;
  address_display: string | null;
  service_type: string | null;
  scheduled_arrival: string | null;
  estimated_duration: number | null;
  customers: { id: string; first_name: string; last_name: string } | null;
  service_addresses: {
    id: string;
    street_address: string;
    city: string;
    state: string;
    zip: string;
  } | null;
}

interface Route {
  id: string;
  name: string | null;
  route_date: string;
  route_type: string;
  status: string;
  assigned_to: string | null;
  estimated_total_duration: number | null;
  estimated_total_distance: number | null;
  optimization_applied: boolean;
  notes: string | null;
  route_stops: RouteStop[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function formatTime(ts: string | null): string {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return ts;
  }
}

function stopStatusStyle(status: string): string {
  switch (status) {
    case 'completed': return styles.stopStatusCompleted;
    case 'in_progress': return styles.stopStatusInProgress;
    case 'skipped': return styles.stopStatusSkipped;
    default: return styles.stopStatusPending;
  }
}

function stopStatusLabel(status: string): string {
  switch (status) {
    case 'completed': return 'Completed';
    case 'in_progress': return 'In Progress';
    case 'en_route': return 'En Route';
    case 'arrived': return 'Arrived';
    case 'skipped': return 'Skipped';
    case 'rescheduled': return 'Rescheduled';
    default: return 'Pending';
  }
}

export default function RouteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { selectedCompany } = useCompany();
  const routeId = params.routeId as string;

  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeError, setOptimizeError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  function loadRoute() {
    setLoading(true);
    setError(null);
    fetch(`/api/routing/routes/${routeId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setRoute(data.route);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    if (routeId) loadRoute();
  }, [routeId]);

  async function handleOptimize() {
    setOptimizing(true);
    setOptimizeError(null);
    try {
      const res = await fetch(`/api/routing/routes/${routeId}/optimize`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setOptimizeError(data.error ?? 'Optimization failed');
        return;
      }
      loadRoute();
    } catch {
      setOptimizeError('Failed to optimize route');
    } finally {
      setOptimizing(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    setStatusUpdating(true);
    try {
      const res = await fetch(`/api/routing/routes/${routeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) loadRoute();
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleDeleteRoute() {
    if (!confirm('Delete this route? This cannot be undone.')) return;
    await fetch(`/api/routing/routes/${routeId}`, { method: 'DELETE' });
    router.push('/field-sales/routes');
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.stateBox}>
          <div className={styles.spinner} />
          <p>Loading route&hellip;</p>
        </div>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className={styles.page}>
        <div className={styles.stateBox}>
          <p className={styles.errorText}>{error ?? 'Route not found'}</p>
          <Link href="/field-sales/routes" className={styles.backLink}>
            &larr; Back to routes
          </Link>
        </div>
      </div>
    );
  }

  const completedStops = route.route_stops.filter(s => s.status === 'completed').length;
  const totalStops = route.route_stops.length;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <button
          type="button"
          className={styles.backBtn}
          onClick={() => router.back()}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>
            {route.name ?? `Route — ${formatDate(route.route_date)}`}
          </h1>
          <p className={styles.subtitle}>{formatDate(route.route_date)}</p>
        </div>
        {route.status === 'draft' && (
          <button
            type="button"
            className={styles.deleteBtn}
            onClick={handleDeleteRoute}
            title="Delete route"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke="currentColor"
                strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>

      <div className={styles.body}>
        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{totalStops}</span>
            <span className={styles.statLabel}>Stops</span>
          </div>
          <div className={styles.statCard}>
            <span className={`${styles.statNumber} ${styles.statDone}`}>{completedStops}</span>
            <span className={styles.statLabel}>Done</span>
          </div>
          {route.estimated_total_duration && (
            <div className={styles.statCard}>
              <span className={styles.statNumber}>
                {Math.round(route.estimated_total_duration / 60 * 10) / 10}h
              </span>
              <span className={styles.statLabel}>Est. Time</span>
            </div>
          )}
          {route.estimated_total_distance && (
            <div className={styles.statCard}>
              <span className={styles.statNumber}>
                {route.estimated_total_distance.toFixed(1)}
              </span>
              <span className={styles.statLabel}>Miles</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actionsRow}>
          {/* Status transitions */}
          {route.status === 'draft' && (
            <button
              type="button"
              className={styles.actionBtn}
              onClick={() => handleStatusChange('scheduled')}
              disabled={statusUpdating}
            >
              Mark Scheduled
            </button>
          )}
          {route.status === 'scheduled' && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
              onClick={() => handleStatusChange('in_progress')}
              disabled={statusUpdating}
            >
              Start Route
            </button>
          )}
          {route.status === 'in_progress' && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnSuccess}`}
              onClick={() => handleStatusChange('completed')}
              disabled={statusUpdating}
            >
              Complete Route
            </button>
          )}

          {/* Optimize */}
          {totalStops >= 2 && ['draft', 'scheduled'].includes(route.status) && (
            <button
              type="button"
              className={`${styles.actionBtn} ${styles.actionBtnOptimize}`}
              onClick={handleOptimize}
              disabled={optimizing}
            >
              {optimizing ? 'Optimizing\u2026' : route.optimization_applied ? 'Re-Optimize' : 'Optimize'}
            </button>
          )}
        </div>

        {optimizeError && (
          <p className={styles.optimizeError}>{optimizeError}</p>
        )}

        {route.optimization_applied && (
          <p className={styles.optimizedNote}>
            Route has been optimized for shortest drive time.
          </p>
        )}

        {/* Notes */}
        {route.notes && (
          <div className={styles.notesBox}>
            <p className={styles.notesLabel}>Notes</p>
            <p className={styles.notesText}>{route.notes}</p>
          </div>
        )}

        {/* Stops list */}
        <div className={styles.stopsSection}>
          <div className={styles.stopsSectionHeader}>
            <h2 className={styles.stopsTitle}>Stops</h2>
            {['draft', 'scheduled'].includes(route.status) && (
              <span className={styles.addStopHint}>
                Stops are added via the route builder
              </span>
            )}
          </div>

          {route.route_stops.length === 0 ? (
            <div className={styles.emptyStops}>
              <p>No stops added yet.</p>
            </div>
          ) : (
            <div className={styles.stopsList}>
              {route.route_stops.map((stop, idx) => {
                const customerName = stop.customers
                  ? `${stop.customers.first_name} ${stop.customers.last_name}`
                  : null;
                const address = stop.address_display
                  ?? (stop.service_addresses
                    ? `${stop.service_addresses.street_address}, ${stop.service_addresses.city}, ${stop.service_addresses.state}`
                    : null)
                  ?? 'Unknown address';

                return (
                  <div key={stop.id} className={styles.stopCard}>
                    <div className={styles.stopOrder}>{idx + 1}</div>
                    <div className={styles.stopInfo}>
                      {customerName && (
                        <span className={styles.stopCustomer}>{customerName}</span>
                      )}
                      <span className={styles.stopAddress}>{address}</span>
                      <div className={styles.stopMeta}>
                        {stop.scheduled_arrival && (
                          <span className={styles.stopTime}>
                            {formatTime(stop.scheduled_arrival)}
                          </span>
                        )}
                        {stop.service_type && (
                          <span className={styles.stopService}>{stop.service_type}</span>
                        )}
                        {stop.estimated_duration && (
                          <span className={styles.stopDuration}>{stop.estimated_duration}m</span>
                        )}
                      </div>
                    </div>
                    <span className={`${styles.stopStatus} ${stopStatusStyle(stop.status)}`}>
                      {stopStatusLabel(stop.status)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
