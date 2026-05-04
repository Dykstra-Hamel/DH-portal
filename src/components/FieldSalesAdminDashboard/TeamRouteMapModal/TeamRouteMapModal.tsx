'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';
import {
  APIProvider,
  Map,
  Marker,
  useMap,
} from '@vis.gl/react-google-maps';
import { authenticatedFetch } from '@/lib/api-client';
import type { RouteStop } from '@/components/FieldMap/RouteStopCard/RouteStopCard';
import { RouteStopReassignModal } from '../RouteStopReassignModal/RouteStopReassignModal';
import type { TeamMemberLite } from '../TeamMemberRouteModal/TeamMemberRouteModal';
import styles from './TeamRouteMapModal.module.scss';

const COLOR_PALETTE = [
  '#2563eb', // blue
  '#dc2626', // red
  '#16a34a', // green
  '#d97706', // amber
  '#7c3aed', // violet
  '#db2777', // pink
  '#0891b2', // cyan
  '#65a30d', // lime
  '#ea580c', // orange
  '#4338ca', // indigo
];

interface TeamMemberRouteData {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  uploadedAvatarUrl: string | null;
  departments: string[];
  stops: RouteStop[];
}

interface TeamRouteMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Manager mode: scope is the manager's direct reports.
  // Admin mode: scope is all field staff for the company (or branch).
  mode?: 'manager' | 'admin';
  // Required when mode === 'manager'
  managerUserId?: string;
  companyId: string;
  peers: TeamMemberLite[];
  // Optional in admin mode: filter to a single branch
  branchId?: string | null;
}

function todayLocal(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function FitBounds({
  positions,
  triggerKey,
}: {
  positions: { lat: number; lng: number }[];
  triggerKey: string;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map || positions.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    positions.forEach(p => bounds.extend(p));
    map.fitBounds(bounds, 64);
  }, [map, triggerKey, positions]);
  return null;
}

export function TeamRouteMapModal({
  isOpen,
  onClose,
  mode = 'manager',
  managerUserId,
  companyId,
  peers,
  branchId = null,
}: TeamRouteMapModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>(todayLocal());
  const [members, setMembers] = useState<TeamMemberRouteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keyError, setKeyError] = useState<string | null>(null);

  const [selectedPin, setSelectedPin] = useState<
    | { stop: RouteStop; memberId: string; memberName: string; departments: string[] }
    | null
  >(null);
  const [reassignOpen, setReassignOpen] = useState(false);
  const fetchSeqRef = useRef(0);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedDate(todayLocal());
    setSelectedPin(null);
    setReassignOpen(false);
  }, [isOpen]);

  // Google Maps API key
  useEffect(() => {
    if (!isOpen || apiKey || keyError) return;
    fetch('/api/google-places-key')
      .then(r => r.json())
      .then(payload => {
        if (!payload?.apiKey) throw new Error(payload?.error || 'No key');
        setApiKey(payload.apiKey);
      })
      .catch((err: Error) => {
        setKeyError(err.message || 'Failed to load Google Maps');
      });
  }, [isOpen, apiKey, keyError]);

  const loadTeam = async () => {
    if (!isOpen || !companyId) return;
    if (mode === 'manager' && !managerUserId) return;
    const seq = ++fetchSeqRef.current;
    setLoading(true);
    setError(null);
    try {
      const url =
        mode === 'admin'
          ? `/api/field-sales/admin-team-route-stops?companyId=${companyId}&date=${selectedDate}${
              branchId ? `&branchId=${branchId}` : ''
            }`
          : `/api/users/${managerUserId}/team-route-stops?companyId=${companyId}&date=${selectedDate}`;
      const data: any = await authenticatedFetch(url);
      if (seq !== fetchSeqRef.current) return;
      setMembers(Array.isArray(data?.members) ? data.members : []);
    } catch (err: any) {
      if (seq !== fetchSeqRef.current) return;
      setError(err?.message || 'Failed to load team routes');
    } finally {
      if (seq === fetchSeqRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    void loadTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, companyId, managerUserId, selectedDate, mode, branchId]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (reassignOpen) return; // let inner modal handle
        if (selectedPin) {
          setSelectedPin(null);
          return;
        }
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, reassignOpen, selectedPin]);

  const colorByMember = useMemo(() => {
    const sorted = [...members].sort((a, b) =>
      a.userId.localeCompare(b.userId)
    );
    const map: Record<string, string> = {};
    sorted.forEach((m, i) => {
      map[m.userId] = COLOR_PALETTE[i % COLOR_PALETTE.length];
    });
    return map;
  }, [members]);

  const allPositions = useMemo(() => {
    const positions: { lat: number; lng: number }[] = [];
    members.forEach(m => {
      m.stops.forEach(s => {
        if (typeof s.lat === 'number' && typeof s.lng === 'number') {
          positions.push({ lat: s.lat, lng: s.lng });
        }
      });
    });
    return positions;
  }, [members]);

  const totalStops = useMemo(
    () => members.reduce((acc, m) => acc + m.stops.length, 0),
    [members]
  );

  if (!isOpen) return null;

  const sourceMember = selectedPin
    ? members.find(m => m.userId === selectedPin.memberId)
    : null;

  return (
    <>
      <div
        className={styles.backdrop}
        onClick={onClose}
        role="presentation"
      >
        <div
          className={styles.shell}
          role="dialog"
          aria-modal="true"
          aria-label="Team routes map"
          onClick={e => e.stopPropagation()}
        >
          <div className={styles.header}>
            <h3 className={styles.title}>Team Routes</h3>
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
                <X size={18} />
              </button>
            </div>
          </div>

          <div className={styles.body}>
            <aside className={styles.legend}>
              <div className={styles.legendHeader}>
                <span>{members.length} members</span>
                <span>{totalStops} stops</span>
              </div>
              {loading && (
                <div className={styles.legendEmpty}>Loading…</div>
              )}
              {!loading && error && (
                <div className={styles.legendEmpty}>{error}</div>
              )}
              {!loading && !error && members.length === 0 && (
                <div className={styles.legendEmpty}>No team members found.</div>
              )}
              {!loading && !error && members.length > 0 && (
                <ul className={styles.legendList}>
                  {members.map(m => (
                    <li key={m.userId} className={styles.legendItem}>
                      <span
                        className={styles.legendSwatch}
                        style={{ background: colorByMember[m.userId] }}
                      />
                      <span className={styles.legendName}>{m.fullName}</span>
                      <span className={styles.legendCount}>
                        {m.stops.length}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </aside>

            <div className={styles.mapWrap}>
              {keyError && (
                <div className={styles.mapEmpty}>{keyError}</div>
              )}
              {!apiKey && !keyError && (
                <div className={styles.mapEmpty}>Loading map…</div>
              )}
              {apiKey && (
                <APIProvider apiKey={apiKey}>
                  <Map
                    defaultCenter={{ lat: 39.8283, lng: -98.5795 }}
                    defaultZoom={4}
                    mapId={
                      process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID'
                    }
                    mapTypeId="roadmap"
                    gestureHandling="greedy"
                    disableDefaultUI={false}
                    fullscreenControl={false}
                    streetViewControl={false}
                    mapTypeControl={false}
                    className={styles.mapCanvas}
                  >
                    <FitBounds
                      positions={allPositions}
                      triggerKey={`${selectedDate}-${members.length}-${totalStops}`}
                    />
                    {members.flatMap(m =>
                      m.stops
                        .filter(
                          s =>
                            typeof s.lat === 'number' &&
                            typeof s.lng === 'number'
                        )
                        .map(s => {
                          const isSelected =
                            selectedPin?.stop.routeStopId === s.routeStopId &&
                            selectedPin?.memberId === m.userId;
                          const color = colorByMember[m.userId] ?? '#2563eb';
                          return (
                            <Marker
                              key={s.routeStopId ?? s.stopId}
                              position={{
                                lat: s.lat as number,
                                lng: s.lng as number,
                              }}
                              title={`${m.fullName} — ${s.clientName}`}
                              clickable
                              icon={{
                                path: 'M 0,0 m -8,0 a 8,8 0 1,0 16,0 a 8,8 0 1,0 -16,0',
                                fillColor: color,
                                fillOpacity: 1,
                                strokeColor: '#ffffff',
                                strokeWeight: 3,
                                scale: isSelected ? 1.4 : 1.1,
                              } as google.maps.Symbol}
                              zIndex={isSelected ? 999 : undefined}
                              onClick={() => {
                                setSelectedPin({
                                  stop: s,
                                  memberId: m.userId,
                                  memberName: m.fullName,
                                  departments: m.departments,
                                });
                              }}
                            />
                          );
                        })
                    )}
                  </Map>
                </APIProvider>
              )}

              {selectedPin && (
                <div className={styles.detailCard}>
                  <div className={styles.detailHeader}>
                    <span
                      className={styles.detailSwatch}
                      style={{
                        background: colorByMember[selectedPin.memberId],
                      }}
                    />
                    <span className={styles.detailMember}>
                      {selectedPin.memberName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPin(null)}
                      className={styles.detailClose}
                      aria-label="Close stop details"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className={styles.detailBody}>
                    <div className={styles.detailClient}>
                      {selectedPin.stop.clientName || 'Unknown Client'}
                    </div>
                    <div className={styles.detailMeta}>
                      {selectedPin.stop.address}
                    </div>
                  </div>
                  <div className={styles.detailFooter}>
                    <button
                      type="button"
                      className={styles.reassignBtn}
                      onClick={() => setReassignOpen(true)}
                      disabled={!selectedPin.stop.routeStopId}
                    >
                      Re-Assign
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedPin && reassignOpen && sourceMember && (
        <RouteStopReassignModal
          isOpen={reassignOpen}
          onClose={() => setReassignOpen(false)}
          stop={selectedPin.stop}
          sourceUser={{
            userId: sourceMember.userId,
            fullName: sourceMember.fullName,
            departments: sourceMember.departments,
          }}
          peers={peers}
          date={selectedDate}
          onAssigned={() => {
            setReassignOpen(false);
            setSelectedPin(null);
            void loadTeam();
          }}
        />
      )}
    </>
  );
}
