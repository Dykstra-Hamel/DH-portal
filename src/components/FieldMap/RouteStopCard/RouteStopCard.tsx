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
  leadStatus?: string | null;
  referredToSales?: boolean;
  routeStopId?: string | null;
  housePhotoUrl?: string | null;
}

interface RouteStopCardProps {
  stop: RouteStop;
  companyId?: string;
  imageSrc?: string;
  isTechnicianOnly?: boolean;
}

function formatTime(time: string | null): string {
  if (!time) return 'No time set';
  try {
    // Extract time portion only — strip any timezone suffix so no UTC conversion occurs.
    // PestPac times are already in company local time.
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

export function RouteStopCard({
  stop,
  companyId,
  imageSrc,
  isTechnicianOnly = false,
}: RouteStopCardProps) {
  const status = stop.serviceStatus.toLowerCase();
  const showActiveStatus =
    status.includes('complete') ||
    status.includes('progress') ||
    status.includes('started');
  const inspectionBadge = stop.inspectionStatus
    ? getInspectionBadge(stop.inspectionStatus)
    : null;

  const inspectorParams = new URLSearchParams();
  if (companyId) inspectorParams.set('companyId', companyId);
  if (stop.routeStopId) inspectorParams.set('routeStopId', stop.routeStopId);
  const inspectorQuery = inspectorParams.toString();

  const href = isTechnicianOnly
    ? `/field-sales/tech-leads/new?type=upsell${stop.routeStopId ? `&routeStopId=${stop.routeStopId}` : ''}`
    : `/field-sales/field-map/service/${stop.stopId}${inspectorQuery ? `?${inspectorQuery}` : ''}`;

  return (
    <Link href={href} className={styles.card}>
      <div className={styles.infoRow}>
        <div className={styles.timeCol}>
          <span className={styles.time}>{formatTime(stop.scheduledTime)}</span>
        </div>
        <div className={styles.content}>
          <div className={styles.topRow}>
            <span className={styles.clientName}>
              {stop.clientName || 'Unknown Client'}
            </span>
            {(inspectionBadge || showActiveStatus) && (
              <div className={styles.badges}>
                {inspectionBadge && (
                  <span
                    className={`${styles.status} ${inspectionBadge.className}`}
                  >
                    {inspectionBadge.label}
                  </span>
                )}
                {showActiveStatus && (
                  <span
                    className={`${styles.status} ${getStatusStyle(stop.serviceStatus)}`}
                  >
                    {stop.serviceStatus}
                  </span>
                )}
              </div>
            )}
          </div>
          <p className={styles.address}>{stop.address}</p>
        </div>
        {stop.serviceType && (
          <div className={styles.serviceTypeMid}>
            <span className={styles.serviceTypeChip}>{stop.serviceType}</span>
          </div>
        )}
        <div className={styles.chevronBtn}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="8"
            height="13"
            viewBox="0 0 8 13"
            fill="none"
          >
            <path
              d="M1 11.5L6.25 6.25L1 1"
              stroke="#F5F9FF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
      {imageSrc &&
        (stop.housePhotoUrl && imageSrc === stop.housePhotoUrl ? (
          <div
            className={styles.houseImageWrap}
            style={{ backgroundImage: `url(${imageSrc})` }}
          >
            <img
              src={imageSrc}
              alt={`Photo of ${stop.address}`}
              className={styles.houseImageFg}
            />
          </div>
        ) : (
          <img
            src={imageSrc}
            alt={`Street view of ${stop.address}`}
            className={styles.stopImage}
          />
        ))}
    </Link>
  );
}
