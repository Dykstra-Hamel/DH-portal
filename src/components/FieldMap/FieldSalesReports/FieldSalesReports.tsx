'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Target,
  FileText,
  ArrowUpRight,
  ClipboardList,
  Route as RouteIcon,
} from 'lucide-react';
import styles from './FieldSalesReports.module.scss';

interface SparklinePoint {
  date: string;
  count: number;
}

interface RecentStop {
  id: string;
  clientName: string;
  address: string;
  serviceType: string | null;
  completedAt: string | null;
}

interface RecentLead {
  id: string;
  status: string;
  customerName: string;
  city: string | null;
  state: string | null;
  serviceType: string | null;
  pestType: string | null;
  estimatedValue: number | null;
  createdAt: string;
}

interface CompletedRoute {
  id: string;
  name: string | null;
  routeDate: string;
  stopsCompleted: number;
  stopsTotal: number;
  referredCount: number;
  durationMinutes: number | null;
}

interface ReportData {
  inspector: {
    stopsTotal: number;
    stopsToday: number;
    stopsThisWeek: number;
    stopsThisMonth: number;
    referredToSales: number;
    completedRoutes: number;
    sparkline: SparklinePoint[];
    recentStops: RecentStop[];
    completedRoutesList: CompletedRoute[];
  };
  techLeads: {
    submitted: number;
    won: number;
    lost: number;
    scheduling: number;
    quoted: number;
    inProcess: number;
    winRate: number;
    wonRevenue: number;
    submittedThisMonth: number;
    wonThisMonth: number;
    recentLeads: RecentLead[];
  };
}

interface FieldSalesReportsProps {
  companyId: string;
  showInspector: boolean;
  showTechLeads: boolean;
  greetingName?: string;
}

function formatCurrency(value: number): string {
  if (value >= 10000) {
    return `$${(value / 1000).toFixed(1)}k`;
  }
  return `$${Math.round(value).toLocaleString()}`;
}

function formatRelative(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function shortDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0);
}

function formatRouteDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function formatDuration(minutes: number | null): string | null {
  if (minutes == null) return null;
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
}

function statusChipClass(status: string): string {
  switch (status) {
    case 'won':
      return styles.chipWon;
    case 'lost':
      return styles.chipLost;
    case 'scheduling':
    case 'quoted':
      return styles.chipScheduled;
    case 'new':
    case 'in_process':
      return styles.chipInProcess;
    default:
      return styles.chipNeutral;
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'in_process':
      return 'In Process';
    case 'won':
      return 'Won';
    case 'lost':
      return 'Lost';
    case 'scheduling':
      return 'Scheduling';
    case 'quoted':
      return 'Quoted';
    case 'new':
      return 'New';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

export function FieldSalesReports({
  companyId,
  showInspector,
  showTechLeads,
  greetingName,
}: FieldSalesReportsProps) {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/field-sales/reports?companyId=${companyId}`)
      .then(async res => {
        if (!res.ok) throw new Error('Failed to load reports');
        return res.json();
      })
      .then(json => {
        if (!cancelled) setData(json);
      })
      .catch(err => {
        if (!cancelled) setError(err.message ?? 'Failed to load reports');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Reports</h1>
          <p className={styles.subtitle}>{today}</p>
        </div>
        <div className={styles.loading}>Loading your stats…</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.title}>My Reports</h1>
          <p className={styles.subtitle}>{today}</p>
        </div>
        <div className={styles.error}>
          {error ?? 'Could not load reports right now.'}
        </div>
      </div>
    );
  }

  const { inspector, techLeads } = data;
  const maxSpark = Math.max(1, ...inspector.sparkline.map(p => p.count));

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <p className={styles.eyebrow}>{today}</p>
        <h1 className={styles.title}>
          {greetingName ? `${greetingName}'s Reports` : 'My Reports'}
        </h1>
        <p className={styles.subtitle}>
          Your personal performance across inspections and tech leads.
        </p>
      </div>

      {showInspector && (
        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <div className={styles.sectionIcon} data-variant="inspector">
              <MapPin size={18} />
            </div>
            <div className={styles.sectionHeaderText}>
              <h2 className={styles.sectionTitle}>Field Map</h2>
              <p className={styles.sectionSubtitle}>
                Your completed stops and routes
              </p>
            </div>
          </header>

          <div className={styles.kpiGrid}>
            <KpiCard
              icon={<CheckCircle2 size={18} />}
              label="Completed Today"
              value={inspector.stopsToday}
              variant="primary"
            />
            <KpiCard
              icon={<CheckCircle2 size={18} />}
              label="Completed This Week"
              value={inspector.stopsThisWeek}
            />
            <KpiCard
              icon={<CheckCircle2 size={18} />}
              label="Completed This Month"
              value={inspector.stopsThisMonth}
            />
            <KpiCard
              icon={<RouteIcon size={18} />}
              label="Routes Completed"
              value={inspector.completedRoutes}
            />
            <KpiCard
              icon={<CheckCircle2 size={18} />}
              label="Total Completed"
              value={inspector.stopsTotal}
            />
            <KpiCard
              icon={<ArrowUpRight size={18} />}
              label="Referred To Sales"
              value={inspector.referredToSales}
              variant="accent"
            />
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Last 7 Days</h3>
              <span className={styles.cardMeta}>
                {inspector.sparkline.reduce((s, p) => s + p.count, 0)} stops
              </span>
            </div>
            <div className={styles.sparkline} role="img" aria-label="Stops completed per day for the last 7 days">
              {inspector.sparkline.map(point => {
                const heightPct = (point.count / maxSpark) * 100;
                return (
                  <div className={styles.sparkCol} key={point.date}>
                    <div
                      className={styles.sparkBar}
                      style={{
                        height: point.count === 0 ? '4px' : `${Math.max(heightPct, 8)}%`,
                      }}
                    >
                      {point.count > 0 && (
                        <span className={styles.sparkBarValue}>{point.count}</span>
                      )}
                    </div>
                    <span className={styles.sparkLabel}>{shortDay(point.date)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {inspector.completedRoutesList.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Completed Routes</h3>
                <span className={styles.cardMeta}>
                  {inspector.completedRoutesList.length}
                </span>
              </div>
              <ul className={styles.list}>
                {inspector.completedRoutesList.map(route => {
                  const duration = formatDuration(route.durationMinutes);
                  return (
                    <li key={route.id} className={styles.listItem}>
                      <Link
                        href={`/field-sales/routes/${route.id}`}
                        className={styles.listItemLink}
                      >
                        <div className={styles.listItemIcon} data-variant="route">
                          <RouteIcon size={16} />
                        </div>
                        <div className={styles.listItemBody}>
                          <div className={styles.listItemTitle}>
                            {route.name ?? `Route ${formatRouteDate(route.routeDate)}`}
                          </div>
                          <div className={styles.listItemMeta}>
                            <span className={styles.metaPill}>
                              {route.stopsCompleted}/{route.stopsTotal} stops
                            </span>
                            {route.referredCount > 0 && (
                              <span
                                className={`${styles.metaPill} ${styles.metaPillAccent}`}
                              >
                                {route.referredCount} referred
                              </span>
                            )}
                            {duration && (
                              <span className={styles.metaText}>{duration}</span>
                            )}
                          </div>
                        </div>
                        <div className={styles.listItemTrailing}>
                          {formatRouteDate(route.routeDate)}
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {inspector.recentStops.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Recent Completed Stops</h3>
              </div>
              <ul className={styles.list}>
                {inspector.recentStops.map(stop => (
                  <li key={stop.id} className={styles.listItem}>
                    <div className={styles.listItemIcon}>
                      <CheckCircle2 size={16} />
                    </div>
                    <div className={styles.listItemBody}>
                      <div className={styles.listItemTitle}>
                        {stop.clientName}
                      </div>
                      <div className={styles.listItemMeta}>
                        {stop.serviceType && (
                          <span className={styles.metaPill}>
                            {stop.serviceType}
                          </span>
                        )}
                        {stop.address && (
                          <span className={styles.metaText}>{stop.address}</span>
                        )}
                      </div>
                    </div>
                    <div className={styles.listItemTrailing}>
                      {formatRelative(stop.completedAt)}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {showTechLeads && (
        <section className={styles.section}>
          <header className={styles.sectionHeader}>
            <div className={styles.sectionIcon} data-variant="tech">
              <ClipboardList size={18} />
            </div>
            <div className={styles.sectionHeaderText}>
              <h2 className={styles.sectionTitle}>Tech Leads</h2>
              <p className={styles.sectionSubtitle}>
                Opportunities you&apos;ve submitted from the field
              </p>
            </div>
          </header>

          <div className={styles.kpiGrid}>
            <KpiCard
              icon={<FileText size={18} />}
              label="Submitted"
              value={techLeads.submitted}
              variant="primary"
            />
            <KpiCard
              icon={<TrendingUp size={18} />}
              label="Won"
              value={techLeads.won}
              variant="success"
            />
            <KpiCard
              icon={<Target size={18} />}
              label="Win Rate"
              value={`${techLeads.winRate}%`}
              variant="accent"
            />
            <KpiCard
              icon={<DollarSign size={18} />}
              label="Won Revenue"
              value={formatCurrency(techLeads.wonRevenue)}
              variant="success"
            />
            <KpiCard
              icon={<FileText size={18} />}
              label="This Month"
              value={techLeads.submittedThisMonth}
            />
            <KpiCard
              icon={<TrendingUp size={18} />}
              label="Won This Mo."
              value={techLeads.wonThisMonth}
              variant="success"
            />
          </div>

          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Pipeline</h3>
            </div>
            <div className={styles.pipelineRow}>
              <PipelineStat
                label="In Process"
                value={techLeads.inProcess}
                color="neutral"
              />
              <PipelineStat
                label="Quoted"
                value={techLeads.quoted}
                color="accent"
              />
              <PipelineStat
                label="Scheduling"
                value={techLeads.scheduling}
                color="primary"
              />
              <PipelineStat
                label="Lost"
                value={techLeads.lost}
                color="danger"
              />
            </div>
          </div>

          {techLeads.recentLeads.length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>Recent Leads</h3>
              </div>
              <ul className={styles.list}>
                {techLeads.recentLeads.map(lead => (
                  <li key={lead.id} className={styles.listItem}>
                    <Link
                      href={`/field-sales/leads/${lead.id}`}
                      className={styles.listItemLink}
                    >
                      <div className={styles.listItemBody}>
                        <div className={styles.listItemTitle}>
                          {lead.customerName}
                        </div>
                        <div className={styles.listItemMeta}>
                          <span
                            className={`${styles.statusChip} ${statusChipClass(lead.status)}`}
                          >
                            {statusLabel(lead.status)}
                          </span>
                          {lead.serviceType && (
                            <span className={styles.metaPill}>
                              {lead.serviceType}
                            </span>
                          )}
                          {(lead.city || lead.state) && (
                            <span className={styles.metaText}>
                              {[lead.city, lead.state].filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className={styles.listItemTrailing}>
                        {lead.estimatedValue ? (
                          <span className={styles.money}>
                            {formatCurrency(Number(lead.estimatedValue))}
                          </span>
                        ) : null}
                        <span className={styles.relativeTime}>
                          {formatRelative(lead.createdAt)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

interface KpiCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  variant?: 'primary' | 'success' | 'accent' | 'default';
}

function KpiCard({ icon, label, value, variant = 'default' }: KpiCardProps) {
  return (
    <div className={`${styles.kpi} ${styles[`kpi-${variant}`]}`}>
      <div className={styles.kpiIcon}>{icon}</div>
      <div className={styles.kpiValue}>{value}</div>
      <div className={styles.kpiLabel}>{label}</div>
    </div>
  );
}

interface PipelineStatProps {
  label: string;
  value: number;
  color: 'primary' | 'accent' | 'neutral' | 'danger';
}

function PipelineStat({ label, value, color }: PipelineStatProps) {
  return (
    <div className={`${styles.pipelineStat} ${styles[`pipeline-${color}`]}`}>
      <span className={styles.pipelineValue}>{value}</span>
      <span className={styles.pipelineLabel}>{label}</span>
    </div>
  );
}
