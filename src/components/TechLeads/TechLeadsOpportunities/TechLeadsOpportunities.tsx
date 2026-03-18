'use client';

import { useEffect, useRef, useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { TechLeadsNav } from '@/components/TechLeads/TechLeadsNav/TechLeadsNav';
import styles from './TechLeadsOpportunities.module.scss';

interface Customer {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

interface ServiceAddress {
  street_address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

interface SubmittedNote {
  id: string;
  notes: string | null;
  created_at: string;
}

interface TechLead {
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
  customers: Customer | null;
  service_address: ServiceAddress | null;
  submitted_notes: SubmittedNote[];
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getStatusClass(status: string): string {
  if (status === 'won') return styles.statusWon;
  if (status === 'lost') return styles.statusLost;
  return styles.statusActive;
}

function formatStatus(status: string): string {
  return status.replace('_', ' ');
}

function formatAddress(parts: Array<string | null | undefined>): string {
  const [street, city, state, zip] = parts;
  const cityStateZip = [city, state, zip].filter(Boolean).join(' ');
  return [street, cityStateZip].filter(Boolean).join(', ');
}

function getCustomerName(lead: TechLead): string {
  if (!lead.customers) return 'No customer linked';
  const parts = [lead.customers.first_name, lead.customers.last_name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'No customer linked';
}

function getLeadAddress(lead: TechLead): string {
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

function formatCurrency(amount: number | null): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
}

export function TechLeadsOpportunities() {
  const { selectedCompany } = useCompany();
  const [leads, setLeads] = useState<TechLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<TechLead | null>(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const moreDetailsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedCompany?.id) {
      setLoading(false);
      setLeads([]);
      setSelectedLead(null);
      return;
    }

    const fetchLeads = async () => {
      try {
        setLoading(true);
        setSelectedLead(null);
        const res = await fetch(`/api/tech-leads/leads?companyId=${selectedCompany.id}`);
        if (res.ok) {
          const data = await res.json();
          setLeads(data.leads ?? []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [selectedCompany?.id]);

  useEffect(() => {
    if (!selectedLead) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedLead(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [selectedLead]);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>My Opportunities</h1>
        </div>

        <div className={styles.list}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
            </div>
          ) : leads.length === 0 ? (
            <div className={styles.emptyState}>No opportunities submitted yet</div>
          ) : (
            leads.map((lead) => {
              const customerName = getCustomerName(lead);
              const address = getLeadAddress(lead);

              return (
                <button
                  key={lead.id}
                  type="button"
                  className={styles.leadCard}
                  onClick={() => { setSelectedLead(lead); setShowMoreDetails(false); }}
                >
                  <div className={styles.leadInfo}>
                    <p className={styles.leadName}>{customerName}</p>
                    <p className={styles.leadAddress}>{address}</p>
                    <p className={styles.leadDate}>{formatDate(lead.created_at)}</p>
                  </div>
                  <span className={`${styles.statusBadge} ${getStatusClass(lead.lead_status)}`}>
                    {formatStatus(lead.lead_status)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {selectedLead && (
        <div
          className={styles.modalOverlay}
          onClick={event => {
            if (event.target === event.currentTarget) {
              setSelectedLead(null);
            }
          }}
        >
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="opportunity-detail-title">
            <div className={styles.modalHeader}>
              <h2 id="opportunity-detail-title" className={styles.modalTitle}>Opportunity Details</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setSelectedLead(null)}
                aria-label="Close details modal"
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* Primary info grid */}
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <p className={styles.detailLabel}>Customer</p>
                  <p className={styles.detailValue}>{getCustomerName(selectedLead)}</p>
                </div>
                <div className={styles.detailItem}>
                  <p className={styles.detailLabel}>Submitted</p>
                  <p className={styles.detailValue}>{formatDateTime(selectedLead.created_at)}</p>
                </div>
                <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
                  <p className={styles.detailLabel}>Address</p>
                  <p className={styles.detailValue}>{getLeadAddress(selectedLead)}</p>
                </div>
                <div className={styles.detailItem}>
                  <p className={styles.detailLabel}>Phone</p>
                  <p className={styles.detailValue}>{selectedLead.customers?.phone ?? '—'}</p>
                </div>
                <div className={styles.detailItem}>
                  <p className={styles.detailLabel}>Email</p>
                  <p className={styles.detailValue}>{selectedLead.customers?.email ?? '—'}</p>
                </div>
              </div>

              {/* Summary */}
              <div className={styles.detailSection}>
                <p className={styles.detailHeading}>Summary</p>
                <p className={styles.multilineValue}>{selectedLead.comments ?? 'No summary submitted'}</p>
              </div>

              {/* Notes */}
              <div className={styles.detailSection}>
                <p className={styles.detailHeading}>Notes</p>
                {selectedLead.submitted_notes.length > 0 ? (
                  <div className={styles.noteList}>
                    {selectedLead.submitted_notes.map(note => (
                      <div key={note.id} className={styles.noteCard}>
                        <p className={styles.noteDate}>{formatDateTime(note.created_at)}</p>
                        <p className={styles.noteText}>{note.notes ?? ''}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={styles.emptyValue}>No notes added</p>
                )}
              </div>

              {/* Pest Type */}
              <div className={styles.detailGrid}>
                <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
                  <p className={styles.detailLabel}>Pest Type</p>
                  <p className={styles.detailValue}>{selectedLead.pest_type ?? '—'}</p>
                </div>
              </div>

              {/* More Details — collapsible */}
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
                    className={showMoreDetails ? styles.chevronOpen : styles.chevronClosed}
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
                  <div className={styles.detailGrid} style={{ paddingTop: '12px' }}>
                    <div className={styles.detailItem}>
                      <p className={styles.detailLabel}>Status</p>
                      <p className={styles.detailValue}>{formatStatus(selectedLead.lead_status)}</p>
                    </div>
                    <div className={styles.detailItem}>
                      <p className={styles.detailLabel}>Priority</p>
                      <p className={styles.detailValue}>{selectedLead.priority ?? '—'}</p>
                    </div>
                    <div className={styles.detailItem}>
                      <p className={styles.detailLabel}>Service Type</p>
                      <p className={styles.detailValue}>{selectedLead.service_type ?? '—'}</p>
                    </div>
                    <div className={styles.detailItem}>
                      <p className={styles.detailLabel}>Estimated Value</p>
                      <p className={styles.detailValue}>{formatCurrency(selectedLead.estimated_value)}</p>
                    </div>
                    <div className={styles.detailItem}>
                      <p className={styles.detailLabel}>Lead Type</p>
                      <p className={styles.detailValue}>{selectedLead.lead_type ?? '—'}</p>
                    </div>
                    <div className={styles.detailItem}>
                      <p className={styles.detailLabel}>Lead Source</p>
                      <p className={styles.detailValue}>{selectedLead.lead_source ?? '—'}</p>
                    </div>
                    <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
                      <p className={styles.detailLabel}>Opportunity ID</p>
                      <p className={`${styles.detailValue} ${styles.detailValueMono}`}>{selectedLead.id}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <TechLeadsNav />
    </>
  );
}
