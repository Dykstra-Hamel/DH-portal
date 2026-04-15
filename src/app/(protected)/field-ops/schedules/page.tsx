'use client';

import { useEffect, useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { usePageActions } from '@/contexts/PageActionsContext';
import { FieldOpsNav } from '@/components/FieldMap/FieldOpsNav/FieldOpsNav';
import styles from './schedules.module.scss';

interface RecurringSchedule {
  id: string;
  service_type: string;
  service_description: string | null;
  frequency: string;
  next_service_date: string | null;
  last_service_date: string | null;
  status: string;
  estimated_duration: number;
  customers: { id: string; first_name: string; last_name: string } | null;
  service_addresses: {
    id: string;
    street_address: string;
    city: string;
    state: string;
    zip: string;
  } | null;
}

function frequencyLabel(freq: string): string {
  const map: Record<string, string> = {
    one_time: 'One-time',
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semi_annual: 'Semi-annual',
    annual: 'Annual',
  };
  return map[freq] ?? freq;
}

function statusBadge(status: string): { label: string; className: string } {
  switch (status) {
    case 'active': return { label: 'Active', className: styles.statusActive };
    case 'paused': return { label: 'Paused', className: styles.statusPaused };
    case 'completed': return { label: 'Completed', className: styles.statusCompleted };
    case 'cancelled': return { label: 'Cancelled', className: styles.statusCancelled };
    default: return { label: status, className: styles.statusActive };
  }
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function SchedulesPage() {
  const { selectedCompany } = useCompany();
  const { setPageHeader } = usePageActions();

  const [schedules, setSchedules] = useState<RecurringSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('active');

  useEffect(() => {
    setPageHeader({ title: 'Recurring Schedules', description: '' });
    return () => setPageHeader(null);
  }, [setPageHeader]);

  useEffect(() => {
    if (!selectedCompany?.id) return;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ companyId: selectedCompany.id });
    if (statusFilter) params.set('status', statusFilter);

    fetch(`/api/routing/schedules?${params}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setSchedules(data.schedules ?? []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedCompany?.id, statusFilter]);

  async function handleCancel(scheduleId: string) {
    if (!confirm('Cancel this recurring schedule?')) return;
    await fetch(`/api/routing/schedules/${scheduleId}`, { method: 'DELETE' });
    setSchedules(prev =>
      prev.map(s => s.id === scheduleId ? { ...s, status: 'cancelled' } : s)
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className={styles.body}>
        {loading && (
          <div className={styles.stateBox}>
            <div className={styles.spinner} />
            <p>Loading schedules&hellip;</p>
          </div>
        )}

        {!loading && error && (
          <div className={styles.stateBox}>
            <p className={styles.errorText}>{error}</p>
          </div>
        )}

        {!loading && !error && schedules.length === 0 && (
          <div className={styles.stateBox}>
            <h2 className={styles.stateTitle}>No schedules found</h2>
            <p className={styles.stateText}>
              Recurring schedules define the service cadence for customers.
            </p>
          </div>
        )}

        {!loading && !error && schedules.length > 0 && (
          <div className={styles.scheduleList}>
            {schedules.map(schedule => {
              const badge = statusBadge(schedule.status);
              const customerName = schedule.customers
                ? `${schedule.customers.first_name} ${schedule.customers.last_name}`
                : null;
              const address = schedule.service_addresses
                ? `${schedule.service_addresses.street_address}, ${schedule.service_addresses.city}, ${schedule.service_addresses.state}`
                : null;

              return (
                <div key={schedule.id} className={styles.scheduleCard}>
                  <div className={styles.scheduleCardTop}>
                    <div className={styles.scheduleInfo}>
                      {customerName && (
                        <span className={styles.scheduleCustomer}>{customerName}</span>
                      )}
                      {address && (
                        <span className={styles.scheduleAddress}>{address}</span>
                      )}
                      <span className={styles.scheduleService}>{schedule.service_type}</span>
                    </div>
                    <span className={`${styles.statusBadge} ${badge.className}`}>
                      {badge.label}
                    </span>
                  </div>
                  <div className={styles.scheduleMeta}>
                    <span className={styles.metaItem}>
                      {frequencyLabel(schedule.frequency)}
                    </span>
                    <span className={styles.metaDot}>·</span>
                    <span className={styles.metaItem}>
                      {schedule.estimated_duration}m per visit
                    </span>
                    {schedule.next_service_date && (
                      <>
                        <span className={styles.metaDot}>·</span>
                        <span className={styles.metaItem}>
                          Next: {formatDate(schedule.next_service_date)}
                        </span>
                      </>
                    )}
                  </div>
                  {schedule.status === 'active' && (
                    <div className={styles.scheduleActions}>
                      <button
                        type="button"
                        className={styles.cancelBtn}
                        onClick={() => handleCancel(schedule.id)}
                      >
                        Cancel Schedule
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <FieldOpsNav />
    </div>
  );
}
