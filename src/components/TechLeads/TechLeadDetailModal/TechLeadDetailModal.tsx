'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './TechLeadDetailModal.module.scss';

export interface TechLeadCustomer {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

export interface TechLeadServiceAddress {
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

export interface TechLeadNote {
  id: string;
  notes: string | null;
  created_at: string;
}

export interface TechLead {
  id: string;
  lead_status: string;
  created_at: string;
  comments: string | null;
  lead_type: string | null;
  lead_source: string | null;
  priority: string | null;
  service_type: string | null;
  pest_type: string | null;
  estimated_value: number | null;
  photo_urls?: string[] | null;
  customers: TechLeadCustomer | null;
  service_address: TechLeadServiceAddress | null;
  submitted_notes: TechLeadNote[];
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatStatus(status: string): string {
  return status.replace('_', ' ');
}

export function formatCurrency(amount: number | null): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatAddress(parts: Array<string | null | undefined>): string {
  const [street, city, state, zip] = parts;
  const cityStateZip = [city, state, zip].filter(Boolean).join(' ');
  return [street, cityStateZip].filter(Boolean).join(', ');
}

export function getCustomerName(lead: TechLead): string {
  if (!lead.customers) return 'No customer linked';
  const parts = [lead.customers.first_name, lead.customers.last_name].filter(
    Boolean
  );
  return parts.length > 0 ? parts.join(' ') : 'No customer linked';
}

export function getLeadAddress(lead: TechLead): string {
  const serviceAddress = lead.service_address
    ? formatAddress([
        lead.service_address.street_address,
        lead.service_address.city,
        lead.service_address.state,
        lead.service_address.zip_code,
      ])
    : '';

  if (serviceAddress) return serviceAddress;

  const customerAddress = lead.customers
    ? formatAddress([
        lead.customers.address,
        lead.customers.city,
        lead.customers.state,
        lead.customers.zip_code,
      ])
    : '';

  return customerAddress || 'No address submitted';
}

interface TechLeadDetailModalProps {
  lead: TechLead;
  onClose: () => void;
}

export function TechLeadDetailModal({ lead, onClose }: TechLeadDetailModalProps) {
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const moreDetailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (previewPhoto) setPreviewPhoto(null);
        else onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [onClose, previewPhoto]);

  const photoUrls = Array.isArray(lead.photo_urls) ? lead.photo_urls : [];

  return (
    <>
      <div
        className={styles.modalOverlay}
        onClick={event => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="tech-lead-detail-title"
        >
          <div className={styles.modalHeader}>
            <h2 id="tech-lead-detail-title" className={styles.modalTitle}>
              Opportunity Details
            </h2>
            <button
              type="button"
              className={styles.modalClose}
              onClick={onClose}
              aria-label="Close details modal"
            >
              ×
            </button>
          </div>

          <div className={styles.modalBody}>
            <div className={styles.customerInfoCard}>
              <p className={styles.customerInfoHeading}>Customer Info</p>
              <div className={styles.customerInfoGrid}>
                <div className={styles.customerInfoRow}>
                  <span className={styles.customerInfoLabel}>Name</span>
                  <span className={styles.customerInfoValue}>
                    {getCustomerName(lead)}
                  </span>
                </div>
                <div className={styles.customerInfoRow}>
                  <span className={styles.customerInfoLabel}>Phone</span>
                  <span className={styles.customerInfoValue}>
                    {lead.customers?.phone ? (
                      <a
                        href={`tel:${lead.customers.phone}`}
                        className={styles.customerInfoLink}
                      >
                        {lead.customers.phone}
                      </a>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
                <div className={styles.customerInfoRow}>
                  <span className={styles.customerInfoLabel}>Email</span>
                  <span className={styles.customerInfoValue}>
                    {lead.customers?.email ? (
                      <a
                        href={`mailto:${lead.customers.email}`}
                        className={styles.customerInfoLink}
                      >
                        {lead.customers.email}
                      </a>
                    ) : (
                      '—'
                    )}
                  </span>
                </div>
                <div className={styles.customerInfoRow}>
                  <span className={styles.customerInfoLabel}>Address</span>
                  <span className={styles.customerInfoValue}>
                    {getLeadAddress(lead)}
                  </span>
                </div>
                <div className={styles.customerInfoRow}>
                  <span className={styles.customerInfoLabel}>Submitted</span>
                  <span className={styles.customerInfoValue}>
                    {formatDateTime(lead.created_at)}
                  </span>
                </div>
              </div>
            </div>

            {photoUrls.length > 0 && (
              <div className={styles.detailSection}>
                <p className={styles.detailHeading}>Photos</p>
                <div className={styles.photoGrid}>
                  {photoUrls.map((url, idx) => (
                    <button
                      key={url + idx}
                      type="button"
                      className={styles.photoThumb}
                      onClick={() => setPreviewPhoto(url)}
                      aria-label={`View photo ${idx + 1}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Opportunity photo ${idx + 1}`}
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.detailSection}>
              <p className={styles.detailHeading}>Summary</p>
              <p className={styles.multilineValue}>
                {lead.comments ?? 'No summary submitted'}
              </p>
            </div>

            <div className={styles.detailSection}>
              <p className={styles.detailHeading}>Notes</p>
              {lead.submitted_notes.length > 0 ? (
                <div className={styles.noteList}>
                  {lead.submitted_notes.map(note => (
                    <div key={note.id} className={styles.noteCard}>
                      <p className={styles.noteDate}>
                        {formatDateTime(note.created_at)}
                      </p>
                      <p className={styles.noteText}>{note.notes ?? ''}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyValue}>No notes added</p>
              )}
            </div>

            <div className={styles.detailGrid}>
              <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
                <p className={styles.detailLabel}>Pest Type</p>
                <p className={styles.detailValue}>{lead.pest_type ?? '—'}</p>
              </div>
            </div>

            <div className={styles.moreDetailsWrapper}>
              <button
                type="button"
                className={styles.moreDetailsToggle}
                onClick={() => setShowMoreDetails(v => !v)}
                aria-expanded={showMoreDetails}
              >
                <span>More Details</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={
                    showMoreDetails ? styles.chevronOpen : styles.chevronClosed
                  }
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div
                ref={moreDetailsRef}
                className={styles.moreDetailsBody}
                style={{
                  maxHeight: showMoreDetails
                    ? `${moreDetailsRef.current?.scrollHeight ?? 600}px`
                    : '0px',
                  overflow: showMoreDetails ? 'visible' : 'hidden',
                }}
              >
                <div
                  className={styles.detailGrid}
                  style={{ paddingTop: '12px' }}
                >
                  <div className={styles.detailItem}>
                    <p className={styles.detailLabel}>Status</p>
                    <p className={styles.detailValue}>
                      {formatStatus(lead.lead_status)}
                    </p>
                  </div>
                  <div className={styles.detailItem}>
                    <p className={styles.detailLabel}>Priority</p>
                    <p className={styles.detailValue}>{lead.priority ?? '—'}</p>
                  </div>
                  <div className={styles.detailItem}>
                    <p className={styles.detailLabel}>Service Type</p>
                    <p className={styles.detailValue}>
                      {lead.service_type ?? '—'}
                    </p>
                  </div>
                  <div className={styles.detailItem}>
                    <p className={styles.detailLabel}>Estimated Value</p>
                    <p className={styles.detailValue}>
                      {formatCurrency(lead.estimated_value)}
                    </p>
                  </div>
                  <div className={styles.detailItem}>
                    <p className={styles.detailLabel}>Lead Type</p>
                    <p className={styles.detailValue}>
                      {lead.lead_type ?? '—'}
                    </p>
                  </div>
                  <div className={styles.detailItem}>
                    <p className={styles.detailLabel}>Lead Source</p>
                    <p className={styles.detailValue}>
                      {lead.lead_source ?? '—'}
                    </p>
                  </div>
                  <div
                    className={`${styles.detailItem} ${styles.detailItemFull}`}
                  >
                    <p className={styles.detailLabel}>Opportunity ID</p>
                    <p
                      className={`${styles.detailValue} ${styles.detailValueMono}`}
                    >
                      {lead.id}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {previewPhoto && (
        <div
          className={styles.photoPreviewOverlay}
          onClick={event => {
            if (event.target === event.currentTarget) setPreviewPhoto(null);
          }}
        >
          <button
            type="button"
            className={styles.photoPreviewClose}
            onClick={() => setPreviewPhoto(null)}
            aria-label="Close photo"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewPhoto}
            alt="Opportunity photo"
            className={styles.photoPreviewImage}
          />
        </div>
      )}
    </>
  );
}
