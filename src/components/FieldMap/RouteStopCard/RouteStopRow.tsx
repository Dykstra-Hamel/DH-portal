'use client';

import type { ReactNode } from 'react';
import styles from './RouteStopCard.module.scss';
import rowStyles from './RouteStopRow.module.scss';
import type { RouteStop, InspectionStatus } from './RouteStopCard';

interface RouteStopRowProps {
  stop: RouteStop;
  actionSlot?: ReactNode;
}

function formatTime(time: string | null): string {
  if (!time) return 'No time set';
  try {
    const timePart = time.includes('T')
      ? time.split('T')[1].replace(/Z$/i, '').split('+')[0].split('-')[0]
      : time;
    const date = new Date(`1970-01-01T${timePart}`);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return time;
  }
}

function getStatusStyle(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('complete')) return styles.statusCompleted;
  if (s.includes('progress') || s.includes('started'))
    return styles.statusInProgress;
  return styles.statusScheduled;
}

function getInspectionBadge(
  status: InspectionStatus
): { label: string; className: string } | null {
  if (status === 'not_started') return null;
  if (status === 'in_progress')
    return {
      label: 'Inspection Started',
      className: styles.inspectionInProgress,
    };
  return { label: 'Inspection Done', className: styles.inspectionDone };
}

export function RouteStopRow({ stop, actionSlot }: RouteStopRowProps) {
  const status = stop.serviceStatus.toLowerCase();
  const showActiveStatus =
    status.includes('complete') ||
    status.includes('progress') ||
    status.includes('started');
  const inspectionBadge = stop.inspectionStatus
    ? getInspectionBadge(stop.inspectionStatus)
    : null;

  return (
    <div className={`${styles.card} ${rowStyles.row}`}>
      {inspectionBadge && (
        <span
          className={`${styles.inspectionOverlay} ${inspectionBadge.className}`}
        >
          {inspectionBadge.label}
        </span>
      )}
      <div className={styles.infoRow}>
        <div className={styles.timeCol}>
          <span className={styles.time}>{formatTime(stop.scheduledTime)}</span>
        </div>
        <div className={styles.content}>
          <div className={styles.topRow}>
            <span className={styles.clientName}>
              {stop.clientName || 'Unknown Client'}
            </span>
            {showActiveStatus && (
              <div className={styles.badges}>
                <span
                  className={`${styles.status} ${getStatusStyle(stop.serviceStatus)}`}
                >
                  {stop.serviceStatus}
                </span>
              </div>
            )}
          </div>
          <p className={styles.address}>{stop.address}</p>
        </div>
      </div>
      {actionSlot && <div className={rowStyles.actions}>{actionSlot}</div>}
    </div>
  );
}
