'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  RouteStopCard,
  type RouteStop,
} from '@/components/FieldMap/RouteStopCard/RouteStopCard';
import styles from './FieldMapDashboard.module.scss';

function formatDateHeader(date: Date): string {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const rest = date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return `${weekday} - ${rest}`;
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

  type StopFilter = 'left' | 'total' | 'completed';
  const [activeFilter, setActiveFilter] = useState<StopFilter>('left');

  const [stops, setStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [inlineSrc, setInlineSrc] = useState<string | null>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  const openDatePicker = () => {
    const input = dateInputRef.current;
    if (!input) return;
    if (typeof input.showPicker === 'function') {
      input.showPicker();
    } else {
      input.click();
    }
  };

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

  const techReferred = stops.filter(s => s.referredToSales).length;

  const totalDisplay = useCountUp(stops.length);
  const completedDisplay = useCountUp(completed);
  const remainingDisplay = useCountUp(remaining);
  const techReferredDisplay = useCountUp(techReferred);

  const visibleStops = embedded
    ? stops.filter(s => !isCompleted(s))
    : (() => {
        switch (activeFilter) {
          case 'total':     return stops;
          case 'completed': return stops.filter(isCompleted);
          default:          return stops.filter(s => !isCompleted(s)); // 'left'
        }
      })();

  // Find the next incomplete stop for inline street view (embedded mode)
  const nextIncompleteStop =
    stops.find(s => s.lat != null && s.lng != null && !isCompleted(s)) ??
    stops.find(s => s.lat != null && s.lng != null);

  useEffect(() => {
    if (nextIncompleteStop?.housePhotoUrl) {
      setInlineSrc(nextIncompleteStop.housePhotoUrl);
      return;
    }

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
  }, [nextIncompleteStop?.lat, nextIncompleteStop?.lng, nextIncompleteStop?.housePhotoUrl]);

  return (
    <div className={styles.page}>
      <div className={`${styles.body} ${embedded ? styles.bodyEmbedded : ''}`}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>
            {isToday ? 'Today\u2019s Route' : 'Route'}
          </h1>
          <button
            type="button"
            className={styles.dateTrigger}
            onClick={openDatePicker}
            aria-label="Change date"
          >
            <svg
              className={styles.dateIcon}
              width="19"
              height="20"
              viewBox="0 0 21 22"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M14 1V5M19 10.75V5C19 4.46957 18.7893 3.96086 18.4142 3.58579C18.0391 3.21071 17.5304 3 17 3H3C2.46957 3 1.96086 3.21071 1.58579 3.58579C1.21071 3.96086 1 4.46957 1 5V19C1 19.5304 1.21071 20.0391 1.58579 20.4142C1.96086 20.7893 2.46957 21 3 21H10.25M20 21L18.125 19.125M1 9H19M6 1V5M19 17C19 18.6569 17.6569 20 16 20C14.3431 20 13 18.6569 13 17C13 15.3431 14.3431 14 16 14C17.6569 14 19 15.3431 19 17Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className={styles.dateLabel}>
              {formatDateHeader(selectedDateObj)}
            </span>
          </button>
          <input
            ref={dateInputRef}
            type="date"
            className={styles.hiddenDateInput}
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            tabIndex={-1}
            aria-hidden="true"
          />
        </div>

        {/* Stats */}
        {!loading && !needsSetup && !error && stops.length > 0 && (
          isTechnicianOnly ? (
            <div className={styles.statsRowTech}>
              {embedded ? (
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>{totalDisplay}</span>
                  <span className={styles.statLabel}>Total</span>
                </div>
              ) : (
                <button
                  className={`${styles.statCard} ${activeFilter === 'total' ? styles.statCardActive : ''}`}
                  onClick={() => setActiveFilter('total')}
                >
                  <span className={styles.statNumber}>{totalDisplay}</span>
                  <span className={styles.statLabel}>Total</span>
                </button>
              )}
              {embedded ? (
                <div className={styles.statCard}>
                  <span className={`${styles.statNumber} ${styles.statWon}`}>
                    {techReferredDisplay}
                  </span>
                  <span className={styles.statLabel}>Leads Referred</span>
                </div>
              ) : (
                <Link href="/tech-leads" className={styles.statCard}>
                  <span className={`${styles.statNumber} ${styles.statWon}`}>
                    {techReferredDisplay}
                  </span>
                  <span className={styles.statLabel}>Leads Referred</span>
                </Link>
              )}
            </div>
          ) : (
            <div className={styles.statsRow}>
              {embedded ? (
                <div className={styles.statCard}>
                  <span className={styles.statNumber}>{totalDisplay}</span>
                  <span className={styles.statLabel}>Total</span>
                </div>
              ) : (
                <button
                  className={`${styles.statCard} ${activeFilter === 'total' ? styles.statCardActive : ''}`}
                  onClick={() => setActiveFilter('total')}
                >
                  <span className={styles.statNumber}>{totalDisplay}</span>
                  <span className={styles.statLabel}>Total</span>
                </button>
              )}
              {embedded ? (
                <div className={styles.statCard}>
                  <span className={`${styles.statNumber} ${styles.statDone}`}>
                    {completedDisplay}
                  </span>
                  <span className={styles.statLabel}>Completed</span>
                </div>
              ) : (
                <button
                  className={`${styles.statCard} ${activeFilter === 'completed' ? styles.statCardActive : ''}`}
                  onClick={() => setActiveFilter('completed')}
                >
                  <span className={`${styles.statNumber} ${styles.statDone}`}>
                    {completedDisplay}
                  </span>
                  <span className={styles.statLabel}>Completed</span>
                </button>
              )}
              {embedded ? (
                <div className={styles.statCard}>
                  <span className={`${styles.statNumber} ${styles.statRemaining}`}>
                    {remainingDisplay}
                  </span>
                  <span className={styles.statLabel}>Left</span>
                </div>
              ) : (
                <button
                  className={`${styles.statCard} ${activeFilter === 'left' ? styles.statCardActive : ''}`}
                  onClick={() => setActiveFilter('left')}
                >
                  <span className={`${styles.statNumber} ${styles.statRemaining}`}>
                    {remainingDisplay}
                  </span>
                  <span className={styles.statLabel}>Left</span>
                </button>
              )}
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
              href="/field-sales/field-map/new"
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
          <>
            <h2 className={styles.upNextHeading}>Up Next</h2>
            <div className={styles.stopListContainer}>
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
