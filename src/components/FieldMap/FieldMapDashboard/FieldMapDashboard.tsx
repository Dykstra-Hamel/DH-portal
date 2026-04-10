'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { RouteStopCard, type RouteStop } from '@/components/FieldMap/RouteStopCard/RouteStopCard';
import styles from './FieldMapDashboard.module.scss';

function formatDateHeader(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function useCountUp(target: number, duration = 700): number {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) { setDisplay(0); return; }
    startRef.current = null;
    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return display;
}

const MapPlaceholder = ({ message = 'Route map unavailable' }: { message?: string }) => (
  <div className={styles.mapPlaceholder}>
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
    <p>{message}</p>
  </div>
);

function RouteMapPreview({ stops }: { stops: RouteStop[] }) {
  // Show the first incomplete stop; fall back to the last stop when all are done
  const nextStop = stops.find(
    s => s.lat != null && s.lng != null && !s.serviceStatus.toLowerCase().includes('complete')
  ) ?? stops.find(s => s.lat != null && s.lng != null);

  if (!nextStop) return <MapPlaceholder />;

  const stopNumber = stops.indexOf(nextStop) + 1;
  const allDone = !stops.some(s => !s.serviceStatus.toLowerCase().includes('complete'));
  const label = allDone
    ? `Route Complete - Stop ${stopNumber} of ${stops.length}`
    : `Up Next - Stop ${stopNumber} of ${stops.length}`;

  const src =
    `/api/internal/street-view-image` +
    `?latitude=${nextStop.lat}&longitude=${nextStop.lng}` +
    `&width=640&height=480&type=streetview&marker=false`;

  return (
    <div className={styles.streetViewWrap}>
      <img src={src} alt={`Street view of ${nextStop.address}`} className={styles.map} />
      <div className={styles.mapOverlay} />
      <div className={styles.mapHeroContent}>
        <div className={styles.mapHeroTextCard}>
          <p className={styles.heroEyebrow}>{label}</p>
          <p className={styles.heroCustomerName}>{nextStop.clientName || 'Unknown Client'}</p>
          <p className={styles.heroAddress}>{nextStop.address}</p>
        </div>
      </div>
    </div>
  );
}

export function FieldMapDashboard() {
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);

  const today = new Date();
  const dateParam = today.toISOString().split('T')[0];

  useEffect(() => {
    async function fetchRoute() {
      try {
        const res = await fetch(`/api/field-map/route?date=${dateParam}`);
        const data = await res.json();
        if (data.needsSetup) { setNeedsSetup(true); return; }
        if (!res.ok) { setError(data.error ?? 'Failed to load route'); return; }
        setStops(data.stops ?? []);
      } catch {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    }
    fetchRoute();
  }, [dateParam]);

  const completed = stops.filter(s => s.serviceStatus.toLowerCase().includes('complete')).length;
  const remaining = stops.length - completed;

  const totalDisplay = useCountUp(stops.length);
  const completedDisplay = useCountUp(completed);
  const remainingDisplay = useCountUp(remaining);

  return (
    <div className={styles.page}>
      {/* Map hero */}
      <div className={styles.mapHero}>
        {loading ? (
          <div className={styles.mapLoading}>
            <div className={styles.spinner} />
          </div>
        ) : stops.length > 0 ? (
          <RouteMapPreview stops={stops} />
        ) : (
          <MapPlaceholder message="No stops to map today" />
        )}
      </div>

      <div className={styles.body}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <p className={styles.date}>{formatDateHeader(today)}</p>
            <h1 className={styles.title}>Today&apos;s Route</h1>
          </div>
        </div>

        {/* Stats */}
        {!loading && !needsSetup && !error && stops.length > 0 && (
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{totalDisplay}</span>
              <span className={styles.statLabel}>Total</span>
            </div>
            <div className={styles.statCard}>
              <span className={`${styles.statNumber} ${styles.statDone}`}>{completedDisplay}</span>
              <span className={styles.statLabel}>Done</span>
            </div>
            <div className={styles.statCard}>
              <span className={`${styles.statNumber} ${styles.statRemaining}`}>{remainingDisplay}</span>
              <span className={styles.statLabel}>Left</span>
            </div>
          </div>
        )}

        {/* States */}
        {loading && (
          <div className={styles.stateBox}>
            <div className={styles.spinner} />
            <p>Loading your route&hellip;</p>
          </div>
        )}

        {!loading && needsSetup && (
          <div className={styles.stateBox}>
            <div className={styles.setupIconWrap}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" stroke="currentColor" strokeWidth="1.5"/>
                <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <h2 className={styles.stateTitle}>Connect PestPac</h2>
            <p className={styles.stateText}>
              Ask your admin to add your PestPac Employee ID in your profile settings to see your daily route here.
            </p>
            <Link href="/field-ops/field-map/new" className={styles.stateAction}>
              Start a manual service stop
            </Link>
          </div>
        )}

        {!loading && !needsSetup && error && (
          <div className={styles.stateBox}>
            <p className={styles.stateError}>{error}</p>
          </div>
        )}

        {!loading && !needsSetup && !error && stops.length === 0 && (
          <div className={styles.stateBox}>
            <div className={styles.setupIconWrap}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className={styles.stateTitle}>No stops today</h2>
            <p className={styles.stateText}>Tap + to create a manual service stop.</p>
          </div>
        )}

        {/* Stop list */}
        {!loading && !needsSetup && !error && stops.length > 0 && (
          <div className={styles.stopList}>
            {stops.map(stop => (
              <RouteStopCard key={stop.stopId} stop={stop} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
