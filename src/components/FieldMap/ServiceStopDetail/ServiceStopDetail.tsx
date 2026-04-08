'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './ServiceStopDetail.module.scss';

interface StopDetail {
  stopId: string;
  routeId: string;
  clientId?: string;
  locationId?: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  address: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number | null;
  lng?: number | null;
  scheduledTime: string | null;
  serviceStatus: string;
  serviceType: string;
  serviceNotes?: string;
  accessInstructions?: string;
  services?: any[];
}

function formatTime(time: string | null): string {
  if (!time) return '';
  try {
    const date = new Date(time.includes('T') ? time : `1970-01-01T${time}`);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return time;
  }
}

function formatDate(time: string | null): string {
  if (!time) return '';
  try {
    const date = new Date(time);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

function getStatusClass(status: string): string {
  const s = status.toLowerCase();
  if (s.includes('complete')) return styles.statusCompleted;
  if (s.includes('progress') || s.includes('started')) return styles.statusInProgress;
  return styles.statusScheduled;
}

interface ServiceStopDetailProps {
  stopId: string;
}

export function ServiceStopDetail({ stopId }: ServiceStopDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeId = searchParams.get('routeId');

  const [stop, setStop] = useState<StopDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStop() {
      try {
        const qs = routeId ? `?routeId=${encodeURIComponent(routeId)}` : '';
        const res = await fetch(`/api/field-map/service/${stopId}${qs}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? 'Failed to load stop');
          return;
        }
        setStop(data);
      } catch {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    }
    fetchStop();
  }, [stopId, routeId]);

  function handleStartService() {
    if (!stop) return;
    const params = new URLSearchParams({
      stopId: stop.stopId,
      routeId: stop.routeId ?? '',
      address: stop.address,
      clientName: stop.clientName ?? '',
      clientEmail: stop.clientEmail ?? '',
    });
    router.push(`/field-map/service/${stopId}/wizard?${params.toString()}`);
  }

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner} />
        <p>Loading stop details&hellip;</p>
      </div>
    );
  }

  if (error || !stop) {
    return (
      <div className={styles.errorPage}>
        <p>{error ?? 'Stop not found'}</p>
        <button onClick={() => router.back()} className={styles.errorBackBtn}>Go back</button>
      </div>
    );
  }

  const mapSrc = stop.address
    ? `/api/internal/static-map?address=${encodeURIComponent(stop.address)}`
    : null;

  const scheduledDate = formatDate(stop.scheduledTime);
  const scheduledTime = formatTime(stop.scheduledTime);

  return (
    <div className={styles.page}>
      {/* Map preview hero */}
      {mapSrc && (
        <div className={styles.mapHero}>
          <img
            src={mapSrc}
            alt={`Map of ${stop.address}`}
            className={styles.mapImage}
          />
          <div className={styles.mapOverlay} />
          <div className={styles.mapHeroContent}>
            <span className={`${styles.statusBadge} ${getStatusClass(stop.serviceStatus)}`}>
              {stop.serviceStatus}
            </span>
            <h1 className={styles.clientName}>{stop.clientName || 'Unknown Client'}</h1>
            <p className={styles.address}>{stop.address}</p>
          </div>
        </div>
      )}

      {/* Fallback hero when no map */}
      {!mapSrc && (
        <div className={styles.heroFallback}>
          <span className={`${styles.statusBadge} ${getStatusClass(stop.serviceStatus)}`}>
            {stop.serviceStatus}
          </span>
          <h1 className={styles.clientName}>{stop.clientName || 'Unknown Client'}</h1>
          <p className={styles.address}>{stop.address}</p>
        </div>
      )}

      <div className={styles.body}>
        {/* Schedule row */}
        {(scheduledDate || scheduledTime) && (
          <div className={styles.scheduleRow}>
            <div className={styles.scheduleIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
                <path d="M3 9h18" stroke="currentColor" strokeWidth="2" />
                <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              {scheduledDate && <p className={styles.scheduleDate}>{scheduledDate}</p>}
              {scheduledTime && <p className={styles.scheduleTime}>{scheduledTime}</p>}
            </div>
          </div>
        )}

        {/* Info cards */}
        <div className={styles.cards}>
          {stop.serviceType && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>Service Type</p>
              <p className={styles.cardValue}>{stop.serviceType}</p>
            </div>
          )}

          {stop.serviceNotes && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>Service Notes</p>
              <p className={styles.cardValue}>{stop.serviceNotes}</p>
            </div>
          )}

          {stop.accessInstructions && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>Access Instructions</p>
              <p className={styles.cardValue}>{stop.accessInstructions}</p>
            </div>
          )}

          {(stop.clientPhone || stop.clientEmail) && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>Contact</p>
              {stop.clientPhone && (
                <a href={`tel:${stop.clientPhone}`} className={styles.contactLink}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 11 19.79 19.79 0 01.01 2.38 2 2 0 012 .2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.05a16 16 0 006.83 6.83l1.27-1.27a2 2 0 012.11-.45 12.8 12.8 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {stop.clientPhone}
                </a>
              )}
              {stop.clientEmail && (
                <a href={`mailto:${stop.clientEmail}`} className={styles.contactLink}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {stop.clientEmail}
                </a>
              )}
            </div>
          )}

          {stop.stopId && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>Order ID</p>
              <p className={styles.cardValue}>{stop.stopId}</p>
            </div>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <button onClick={handleStartService} className={styles.startBtn}>
          Start Service
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 3l14 9-14 9V3z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
}
