'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCompany } from '@/contexts/CompanyContext';
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
  technician?: string;
  technicianId?: string | null;
  duration?: number | null;
  serviceClass?: string;
  programCode?: string;
  locationNotes?: string;
  serviceDate?: string | null;
  timeIn?: string | null;
  timeOut?: string | null;
  amount?: number | null;
  balanceDue?: number | null;
  accountNumber?: string;
  lastServiceDate?: string | null;
  locationType?: string;
  branch?: string;
  services?: any[];
  targets?: any[];
  attributes?: any[];
  conditions?: any[];
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

interface ServiceStopDetailProps {
  stopId: string;
}

export function ServiceStopDetail({ stopId }: ServiceStopDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeId = searchParams.get('routeId');
  const { selectedCompany } = useCompany();

  const [stop, setStop] = useState<StopDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStop() {
      try {
        const qs = new URLSearchParams();
        if (routeId) qs.set('routeId', routeId);
        if (selectedCompany?.id) qs.set('companyId', selectedCompany.id);
        const qsStr = qs.toString();
        const res = await fetch(`/api/field-map/service/${stopId}${qsStr ? `?${qsStr}` : ''}`);
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
  }, [stopId, routeId, selectedCompany?.id]);

  function handleStartService() {
    if (!stop) return;
    const params = new URLSearchParams({
      stopId: stop.stopId,
      routeId: stop.routeId ?? '',
      address: stop.address,
      clientName: stop.clientName ?? '',
      clientEmail: stop.clientEmail ?? '',
      clientPhone: stop.clientPhone ?? '',
    });
    if (selectedCompany?.id) params.set('companyId', selectedCompany.id);
    router.push(`/field-ops/field-map/service/${stopId}/wizard?${params.toString()}`);
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

  const scheduledDate = formatDate(stop.scheduledTime ?? stop.serviceDate ?? null);
  const scheduledTime = stop.timeIn
    ? `${formatTime(stop.timeIn)}${stop.timeOut ? ` – ${formatTime(stop.timeOut)}` : ''}`
    : formatTime(stop.scheduledTime);

  return (
    <div className={styles.page}>
      <div className={styles.scrollContent}>
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
            <div className={styles.mapHeroTextCard}>
              <h1 className={styles.clientName}>{stop.clientName || 'Unknown Client'}</h1>
              <p className={styles.address}>{stop.address}</p>
            </div>
          </div>
        </div>
      )}

      {/* Fallback hero when no map */}
      {!mapSrc && (
        <div className={styles.heroFallback}>
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

          {stop.serviceClass && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>Service Class</p>
              <p className={styles.cardValue}>{stop.serviceClass}</p>
            </div>
          )}

          {stop.programCode && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>Program</p>
              <p className={styles.cardValue}>{stop.programCode}</p>
            </div>
          )}

          {stop.serviceStatus && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>Status</p>
              <span className={`${styles.statusBadge} ${styles[`status_${stop.serviceStatus.toLowerCase().replace(/\s+/g, '_')}`] ?? ''}`}>
                {stop.serviceStatus}
              </span>
            </div>
          )}

          {stop.technician && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>Assigned Technician</p>
              <p className={styles.cardValue}>{stop.technician}</p>
            </div>
          )}

          {stop.duration != null && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>Estimated Duration</p>
              <p className={styles.cardValue}>{stop.duration} min</p>
            </div>
          )}

          {stop.targets && stop.targets.length > 0 && (
            <div className={`${styles.card} ${styles.cardFull}`}>
              <p className={styles.cardLabel}>Target Pests</p>
              <div className={styles.tagList}>
                {stop.targets.map((t: any, i: number) => (
                  <span key={i} className={styles.tag}>
                    {t.TargetName ?? t.targetName ?? t.Name ?? t.name ?? t.TargetCode ?? t.targetCode ?? JSON.stringify(t)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {stop.services && stop.services.length > 0 && (
            <div className={`${styles.card} ${styles.cardFull}`}>
              <p className={styles.cardLabel}>Services / Line Items</p>
              <ul className={styles.lineItemList}>
                {stop.services.map((svc: any, i: number) => {
                  const name = svc.ServiceDescription ?? svc.serviceDescription ?? svc.Description ?? svc.description ?? svc.ServiceCode ?? svc.serviceCode ?? svc.Name ?? svc.name ?? `Item ${i + 1}`;
                  const qty = svc.Quantity ?? svc.quantity ?? null;
                  const rate = svc.Rate ?? svc.rate ?? svc.Price ?? svc.price ?? null;
                  return (
                    <li key={i} className={styles.lineItem}>
                      <span className={styles.lineItemName}>{name}</span>
                      {(qty != null || rate != null) && (
                        <span className={styles.lineItemMeta}>
                          {qty != null ? `Qty: ${qty}` : ''}
                          {qty != null && rate != null ? ' · ' : ''}
                          {rate != null ? `$${Number(rate).toFixed(2)}` : ''}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {stop.conditions && stop.conditions.length > 0 && (
            <div className={`${styles.card} ${styles.cardFull}`}>
              <p className={styles.cardLabel}>Conditions</p>
              <ul className={styles.lineItemList}>
                {stop.conditions.map((c: any, i: number) => (
                  <li key={i} className={styles.lineItem}>
                    <span className={styles.lineItemName}>
                      {c.ConditionName ?? c.conditionName ?? c.Description ?? c.description ?? c.Name ?? c.name ?? JSON.stringify(c)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {stop.attributes && stop.attributes.length > 0 && (
            <div className={`${styles.card} ${styles.cardFull}`}>
              <p className={styles.cardLabel}>Order Attributes</p>
              <dl className={styles.attrGrid}>
                {stop.attributes.map((a: any, i: number) => {
                  const label = a.AttributeName ?? a.attributeName ?? a.Name ?? a.name ?? `Attribute ${i + 1}`;
                  const value = a.AttributeValue ?? a.attributeValue ?? a.Value ?? a.value ?? '—';
                  return (
                    <div key={i} className={styles.attrRow}>
                      <dt className={styles.attrLabel}>{label}</dt>
                      <dd className={styles.attrValue}>{String(value)}</dd>
                    </div>
                  );
                })}
              </dl>
            </div>
          )}

          {stop.serviceNotes && (
            <div className={`${styles.card} ${styles.cardFull}`}>
              <p className={styles.cardLabel}>Service Notes</p>
              <p className={styles.cardValue}>{stop.serviceNotes}</p>
            </div>
          )}

          {stop.locationNotes && (
            <div className={`${styles.card} ${styles.cardFull}`}>
              <p className={styles.cardLabel}>Location Notes</p>
              <p className={styles.cardValue}>{stop.locationNotes}</p>
            </div>
          )}

          {stop.accessInstructions && (
            <div className={`${styles.card} ${styles.cardFull}`}>
              <p className={styles.cardLabel}>Access Instructions</p>
              <p className={styles.cardValue}>{stop.accessInstructions}</p>
            </div>
          )}

          {(stop.clientPhone || stop.clientEmail) && (
            <div className={`${styles.card} ${styles.cardFull}`}>
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

          {stop.locationType && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>Property Type</p>
              <p className={styles.cardValue}>{stop.locationType}</p>
            </div>
          )}

          {stop.branch && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>Branch</p>
              <p className={styles.cardValue}>{stop.branch}</p>
            </div>
          )}

          {stop.lastServiceDate && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>Last Service</p>
              <p className={styles.cardValue}>{formatDate(stop.lastServiceDate)}</p>
            </div>
          )}

          {stop.amount != null && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>Order Amount</p>
              <p className={styles.cardValue}>${Number(stop.amount).toFixed(2)}</p>
            </div>
          )}

          {stop.balanceDue != null && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>Balance Due</p>
              <p className={`${styles.cardValue} ${Number(stop.balanceDue) > 0 ? styles.balanceDue : ''}`}>
                ${Number(stop.balanceDue).toFixed(2)}
              </p>
            </div>
          )}

          {stop.accountNumber && (
            <div className={styles.card}>
              <p className={styles.cardLabel}>Account #</p>
              <p className={styles.cardValue}>{stop.accountNumber}</p>
            </div>
          )}

          {stop.stopId && (
            <div className={`${styles.card} ${styles.cardFull}`}>
              <p className={styles.cardLabel}>Order ID</p>
              <p className={styles.cardValue}>{stop.stopId}</p>
            </div>
          )}
        </div>
      </div>

      </div>

      <div className={styles.footer}>
        <button onClick={handleStartService} className={styles.startBtn}>
          Start Service
        </button>
      </div>
    </div>
  );
}
