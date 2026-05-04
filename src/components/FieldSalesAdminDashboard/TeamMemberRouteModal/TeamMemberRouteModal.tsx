'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { authenticatedFetch } from '@/lib/api-client';
import { RouteStopRow } from '@/components/FieldMap/RouteStopCard/RouteStopRow';
import type { RouteStop } from '@/components/FieldMap/RouteStopCard/RouteStopCard';
import { RouteStopReassignModal } from '../RouteStopReassignModal/RouteStopReassignModal';
import styles from './TeamMemberRouteModal.module.scss';

export interface TeamMemberLite {
  userId: string;
  fullName: string;
  email?: string | null;
  avatarUrl?: string | null;
  uploadedAvatarUrl?: string | null;
  departments: string[];
}

interface TeamMemberRouteModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: TeamMemberLite;
  companyId: string;
  peers: TeamMemberLite[];
}

function todayLocal(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function isCompleted(stop: RouteStop): boolean {
  return (
    stop.serviceStatus.toLowerCase().includes('complete') ||
    stop.inspectionStatus === 'done'
  );
}

function roleLabel(departments: string[]): string {
  const set = new Set(departments.map(d => d.toLowerCase()));
  if (set.has('inspector')) return 'Inspector';
  if (set.has('technician')) return 'Technician';
  return 'Member';
}

export function TeamMemberRouteModal({
  isOpen,
  onClose,
  member,
  companyId,
  peers,
}: TeamMemberRouteModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(todayLocal());
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reassignStop, setReassignStop] = useState<RouteStop | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedDate(todayLocal());
  }, [isOpen, member.userId]);

  useEffect(() => {
    if (!isOpen || !companyId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    authenticatedFetch(
      `/api/users/${member.userId}/route-stops?companyId=${companyId}&date=${selectedDate}`
    )
      .then((data: any) => {
        if (cancelled) return;
        setStops(Array.isArray(data?.stops) ? data.stops : []);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setError(err.message || 'Failed to load route');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, companyId, member.userId, selectedDate]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const stats = useMemo(() => {
    const total = stops.length;
    const completed = stops.filter(isCompleted).length;
    return { total, completed, remaining: total - completed };
  }, [stops]);

  const refetch = async () => {
    if (!companyId) return;
    try {
      const data: any = await authenticatedFetch(
        `/api/users/${member.userId}/route-stops?companyId=${companyId}&date=${selectedDate}`
      );
      setStops(Array.isArray(data?.stops) ? data.stops : []);
    } catch {
      // Silently leave the stale list — the user can hit the date picker again.
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className={styles.backdrop}
        onClick={onClose}
        role="presentation"
      >
        <div
          className={styles.card}
          role="dialog"
          aria-modal="true"
          aria-label={`${member.fullName} route`}
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.header}>
            <div className={styles.identity}>
              <h3 className={styles.title}>{member.fullName}</h3>
              <span className={styles.roleChip}>
                {roleLabel(member.departments)}
              </span>
            </div>
            <div className={styles.headerRight}>
              <input
                type="date"
                className={styles.dateInput}
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                aria-label="Route date"
              />
              <button
                type="button"
                onClick={onClose}
                className={styles.closeBtn}
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className={styles.body}>
            {!loading && !error && stops.length > 0 && (
              <div className={styles.statsRow}>
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>{stats.total}</span>
                  <span className={styles.statLabel}>Total</span>
                </div>
                <div className={styles.statCard}>
                  <span
                    className={`${styles.statNumber} ${styles.statCompleted}`}
                  >
                    {stats.completed}
                  </span>
                  <span className={styles.statLabel}>Completed</span>
                </div>
                <div className={styles.statCard}>
                  <span
                    className={`${styles.statNumber} ${styles.statRemaining}`}
                  >
                    {stats.remaining}
                  </span>
                  <span className={styles.statLabel}>Remaining</span>
                </div>
              </div>
            )}

            {loading && <div className={styles.empty}>Loading…</div>}

            {!loading && error && (
              <div className={styles.empty}>{error}</div>
            )}

            {!loading && !error && stops.length === 0 && (
              <div className={styles.empty}>
                No route stops scheduled for this date.
              </div>
            )}

            {!loading && !error && stops.length > 0 && (
              <div className={styles.stopList}>
                {stops.map(stop => (
                  <RouteStopRow
                    key={stop.routeStopId ?? stop.stopId}
                    stop={stop}
                    actionSlot={
                      <button
                        type="button"
                        className={styles.reassignBtn}
                        onClick={() => setReassignStop(stop)}
                        disabled={!stop.routeStopId}
                      >
                        Re-Assign
                      </button>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {reassignStop && (
        <RouteStopReassignModal
          isOpen={!!reassignStop}
          onClose={() => setReassignStop(null)}
          stop={reassignStop}
          sourceUser={{
            userId: member.userId,
            fullName: member.fullName,
            departments: member.departments,
          }}
          peers={peers}
          date={selectedDate}
          onAssigned={() => {
            setReassignStop(null);
            refetch();
          }}
        />
      )}
    </>
  );
}
