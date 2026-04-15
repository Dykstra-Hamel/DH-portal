'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  RouteStopCard,
  type RouteStop,
} from '@/components/FieldMap/RouteStopCard/RouteStopCard';
import styles from './FieldMapDashboard.module.scss';

function formatDateHeader(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function useCountUp(target: number, duration = 700): number {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (target === 0) {
      setDisplay(0);
      return;
    }
    startRef.current = null;
    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return display;
}

const MapPlaceholder = ({
  message = 'Route map unavailable',
}: {
  message?: string;
}) => (
  <div className={styles.mapPlaceholder}>
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
    <p>{message}</p>
  </div>
);

export function FieldMapDashboard({
  companyId = '',
  embedded = false,
  isTechnicianOnly = false,
}: {
  companyId?: string;
  embedded?: boolean;
  isTechnicianOnly?: boolean;
}) {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const selectedDateObj = new Date(selectedDate + 'T12:00:00');
  const isToday = selectedDate === todayStr;

  type StopFilter = 'left' | 'total' | 'completed' | 'quoted' | 'won';
  const [activeFilter, setActiveFilter] = useState<StopFilter>('left');

  const [stops, setStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [inlineSrc, setInlineSrc] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    setError(null);
    setNeedsSetup(false);
    setActiveFilter('left');
    async function fetchRoute() {
      try {
        const res = await fetch(
          `/api/field-map/route?date=${selectedDate}&companyId=${companyId}`
        );
        const data = await res.json();
        if (data.needsSetup) {
          setNeedsSetup(true);
          return;
        }
        if (!res.ok) {
          setError(data.error ?? 'Failed to load route');
          return;
        }
        setStops(data.stops ?? []);
      } catch {
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    }
    fetchRoute();
  }, [selectedDate, companyId]);

  const isCompleted = (s: RouteStop) =>
    s.serviceStatus.toLowerCase().includes('complete') || s.inspectionStatus === 'done';
  const completed = stops.filter(isCompleted).length;
  const remaining = stops.length - completed;

  const quoted = stops.filter(s => s.leadStatus === 'quoted').length;
  const won = stops.filter(
    s => s.leadStatus === 'scheduling' || s.leadStatus === 'won'
  ).length;

  const techReferred = stops.filter(s => s.referredToSales).length;

  const totalDisplay = useCountUp(stops.length);
  const completedDisplay = useCountUp(completed);
  const remainingDisplay = useCountUp(remaining);
  const quotedDisplay = useCountUp(quoted);
  const wonDisplay = useCountUp(won);
  const techReferredDisplay = useCountUp(techReferred);

  const visibleStops = (() => {
    switch (activeFilter) {
      case 'total':     return stops;
      case 'completed': return stops.filter(isCompleted);
      case 'quoted':    return stops.filter(s => s.leadStatus === 'quoted');
      case 'won':       return stops.filter(s => s.leadStatus === 'scheduling' || s.leadStatus === 'won');
      default:          return stops.filter(s => !isCompleted(s)); // 'left'
    }
  })();

  // Find the next incomplete stop for inline street view (embedded mode)
  const nextIncompleteStop =
    stops.find(s => s.lat != null && s.lng != null && !isCompleted(s)) ??
    stops.find(s => s.lat != null && s.lng != null);

  useEffect(() => {
    if (!nextIncompleteStop?.lat || !nextIncompleteStop?.lng) {
      setInlineSrc(null);
      return;
    }

    const streetSrc = `/api/internal/street-view-image?latitude=${nextIncompleteStop.lat}&longitude=${nextIncompleteStop.lng}&width=640&height=280&type=streetview&marker=false`;
    const satSrc = `/api/internal/street-view-image?latitude=${nextIncompleteStop.lat}&longitude=${nextIncompleteStop.lng}&width=640&height=280&type=satellite&marker=false`;

    fetch('/api/internal/street-view-metadata', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        latitude: nextIncompleteStop.lat,
        longitude: nextIncompleteStop.lng,
      }),
    })
      .then(r => r.json())
      .then(meta => setInlineSrc(meta.available ? streetSrc : satSrc))
      .catch(() => setInlineSrc(streetSrc));
  }, [nextIncompleteStop?.lat, nextIncompleteStop?.lng]);

  return (
    <div className={styles.page}>
      <div className={`${styles.body} ${embedded ? styles.bodyEmbedded : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              {isToday ? 'Today\u2019s Route' : 'Route'}
            </h1>
            <p className={styles.date}>{formatDateHeader(selectedDateObj)}</p>
          </div>
          <input
            type="date"
            className={styles.datePicker}
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>

        {/* Stats */}
        {!loading && !needsSetup && !error && stops.length > 0 && (
          isTechnicianOnly ? (
            <div className={styles.statsRowTech}>
              <button
                className={`${styles.statCard} ${activeFilter === 'total' ? styles.statCardActive : ''}`}
                onClick={() => setActiveFilter('total')}
              >
                <span className={styles.statNumber}>{totalDisplay}</span>
                <span className={styles.statLabel}>Total</span>
              </button>
              <Link href="/tech-leads" className={styles.statCard}>
                <span className={`${styles.statNumber} ${styles.statWon}`}>
                  {techReferredDisplay}
                </span>
                <span className={styles.statLabel}>Leads Referred</span>
              </Link>
            </div>
          ) : (
            <div className={styles.statsRow}>
              <button
                className={`${styles.statCard} ${activeFilter === 'total' ? styles.statCardActive : ''}`}
                onClick={() => setActiveFilter('total')}
              >
                <span className={styles.statNumber}>{totalDisplay}</span>
                <span className={styles.statLabel}>Total</span>
              </button>
              <button
                className={`${styles.statCard} ${activeFilter === 'completed' ? styles.statCardActive : ''}`}
                onClick={() => setActiveFilter('completed')}
              >
                <span className={`${styles.statNumber} ${styles.statDone}`}>
                  {completedDisplay}
                </span>
                <span className={styles.statLabel}>Completed</span>
              </button>
              <button
                className={`${styles.statCard} ${activeFilter === 'left' ? styles.statCardActive : ''}`}
                onClick={() => setActiveFilter('left')}
              >
                <span className={`${styles.statNumber} ${styles.statRemaining}`}>
                  {remainingDisplay}
                </span>
                <span className={styles.statLabel}>Left</span>
              </button>
              <button
                className={`${styles.statCard} ${activeFilter === 'quoted' ? styles.statCardActive : ''}`}
                onClick={() => setActiveFilter('quoted')}
              >
                <span className={`${styles.statNumber} ${styles.statQuoted}`}>
                  {quotedDisplay}
                </span>
                <span className={styles.statLabel}>Quoted</span>
              </button>
              <button
                className={`${styles.statCard} ${activeFilter === 'won' ? styles.statCardActive : ''}`}
                onClick={() => setActiveFilter('won')}
              >
                <span className={`${styles.statNumber} ${styles.statWon}`}>
                  {wonDisplay}
                </span>
                <span className={styles.statLabel}>Won</span>
              </button>
            </div>
          )
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
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <circle
                  cx="12"
                  cy="9"
                  r="2.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <h2 className={styles.stateTitle}>Connect PestPac</h2>
            <p className={styles.stateText}>
              Ask your admin to add your PestPac Employee ID in your profile
              settings to see your daily route here.
            </p>
            <Link
              href="/field-ops/field-map/new"
              className={styles.stateAction}
            >
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
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="3"
                  y="4"
                  width="18"
                  height="18"
                  rx="3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M8 2v4M16 2v4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h2 className={styles.stateTitle}>No stops today</h2>
            <p className={styles.stateText}>
              Tap + to create a manual service stop.
            </p>
          </div>
        )}

        {/* Stop list */}
        {!loading && !needsSetup && !error && stops.length > 0 && (
          <div className={styles.stopList}>
            {visibleStops.map(stop => (
              <RouteStopCard
                key={stop.stopId}
                stop={stop}
                companyId={companyId}
                isTechnicianOnly={isTechnicianOnly}
                imageSrc={
                  stop.stopId === nextIncompleteStop?.stopId
                    ? (inlineSrc ?? undefined)
                    : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
