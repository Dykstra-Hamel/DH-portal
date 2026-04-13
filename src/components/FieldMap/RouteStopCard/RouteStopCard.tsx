'use client';

import Link from 'next/link';
import styles from './RouteStopCard.module.scss';

export type InspectionStatus = 'not_started' | 'in_progress' | 'done';

export interface RouteStop {
  stopId: string;
  routeId: string;
  clientId?: string;
  locationId?: string;
  clientName: string;
  address: string;
  scheduledTime: string | null;
  serviceStatus: string;
  serviceType: string;
  serviceNotes?: string;
  accessInstructions?: string;
  lat?: number | null;
  lng?: number | null;
  inspectionStatus?: InspectionStatus;
  leadId?: string | null;
}

interface RouteStopCardProps {
  stop: RouteStop;
  companyId?: string;
}

function formatTime(time: string | null): string {
  if (!time) return 'No time set';
  try {
    const date = new Date(time.includes('T') ? time : `1970-01-01T${time}`);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return time;
  }
}

function getStatusStyle(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('complete')) return styles.statusCompleted;
  if (s.includes('progress') || s.includes('started')) return styles.statusInProgress;
  return styles.statusScheduled;
}

function getInspectionBadge(status: InspectionStatus): { label: string; className: string } | null {
  if (status === 'not_started') return null;
  if (status === 'in_progress') return { label: 'Inspection Started', className: styles.inspectionInProgress };
  return { label: 'Inspection Done', className: styles.inspectionDone };
}

export function RouteStopCard({ stop, companyId }: RouteStopCardProps) {
  const status = stop.serviceStatus.toLowerCase();
  const showStatus = !status.includes('scheduled');
  const inspectionBadge = stop.inspectionStatus ? getInspectionBadge(stop.inspectionStatus) : null;

  return (
    <Link
      href={`/field-ops/field-map/service/${stop.stopId}?routeId=${stop.routeId}${companyId ? `&companyId=${companyId}` : ''}`}
      className={styles.card}
    >
      <div className={styles.timeCol}>
        <span className={styles.time}>{formatTime(stop.scheduledTime)}</span>
      </div>
      <div className={styles.content}>
        <div className={styles.topRow}>
          <span className={styles.clientName}>{stop.clientName || 'Unknown Client'}</span>
          <div className={styles.badges}>
            {inspectionBadge && (
              <span className={`${styles.status} ${inspectionBadge.className}`}>
                {inspectionBadge.label}
              </span>
            )}
            {showStatus && (
              <span className={`${styles.status} ${getStatusStyle(stop.serviceStatus)}`}>
                {stop.serviceStatus}
              </span>
            )}
          </div>
        </div>
        <p className={styles.address}>{stop.address}</p>
        {stop.serviceType && (
          <span className={styles.serviceType}>{stop.serviceType}</span>
        )}
      </div>
      <div className={styles.chevron}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  );
}
