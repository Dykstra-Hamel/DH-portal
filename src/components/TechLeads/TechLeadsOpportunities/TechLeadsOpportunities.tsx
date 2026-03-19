'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
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

interface DraftLead {
  leadType: string | null;
  stepIndex: number;
  savedAt?: string;
  aiResult: {
    issue_detected?: string;
    service_category?: string;
    ai_summary?: string;
    suggested_pest_type?: string | null;
  } | null;
  notes: string;
  selectedCustomer: {
    first_name?: string | null;
    last_name?: string | null;
    address?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
  } | null;
  newCustomerForm: {
    firstName: string;
    lastName: string;
    addressInput: string;
  } | null;
}

type Tab = 'all' | 'in-process' | 'scheduled' | 'draft';

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
  if (status === 'scheduling') return styles.statusScheduled;
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

function getDraftCustomerName(draft: DraftLead): string {
  if (draft.selectedCustomer) {
    const parts = [draft.selectedCustomer.first_name, draft.selectedCustomer.last_name].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
  }
  if (draft.newCustomerForm) {
    const parts = [draft.newCustomerForm.firstName, draft.newCustomerForm.lastName].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
  }
  return 'No customer selected';
}

function getDraftAddress(draft: DraftLead): string {
  if (draft.selectedCustomer?.address) {
    return formatAddress([
      draft.selectedCustomer.address,
      draft.selectedCustomer.city,
      draft.selectedCustomer.state,
      draft.selectedCustomer.zip_code,
    ]);
  }
  if (draft.newCustomerForm?.addressInput) {
    return draft.newCustomerForm.addressInput;
  }
  return '';
}

function getStepLabel(stepIndex: number): string {
  const labels: Record<number, string> = {
    1: 'Photos',
    2: 'AI Review',
    3: 'Select Site / Customer',
    4: 'Service Details',
    5: 'Review',
  };
  return labels[stepIndex] ?? `Step ${stepIndex}`;
}

export function TechLeadsOpportunities() {
  const router = useRouter();
  const { selectedCompany } = useCompany();
  const [leads, setLeads] = useState<TechLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<TechLead | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<DraftLead | null>(null);
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [draft, setDraft] = useState<DraftLead | null>(null);
  const moreDetailsRef = useRef<HTMLDivElement>(null);

  // Load draft from localStorage
  useEffect(() => {
    if (!selectedCompany?.id) {
      setDraft(null);
      return;
    }
    try {
      const key = `techleads_draft_${selectedCompany.id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only show if there's meaningful progress (past step 0)
        if (parsed && parsed.stepIndex > 0) {
          setDraft(parsed);
        } else {
          setDraft(null);
        }
      } else {
        setDraft(null);
      }
    } catch {
      setDraft(null);
    }
  }, [selectedCompany?.id]);

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
    if (!selectedLead && !selectedDraft) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedLead(null);
        setSelectedDraft(null);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleEscape);
    };
  }, [selectedLead, selectedDraft]);

  const filteredLeads = leads.filter(lead => {
    if (activeTab === 'all') return true;
    if (activeTab === 'scheduled') return lead.lead_status === 'scheduling';
    if (activeTab === 'in-process') return lead.lead_status !== 'won' && lead.lead_status !== 'lost' && lead.lead_status !== 'scheduling';
    return false;
  });

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'all', label: 'All', count: leads.length },
    { id: 'in-process', label: 'In Process', count: leads.filter(l => l.lead_status !== 'won' && l.lead_status !== 'lost' && l.lead_status !== 'scheduling').length },
    { id: 'scheduled', label: 'Scheduled', count: leads.filter(l => l.lead_status === 'scheduling').length },
    { id: 'draft', label: 'Draft', count: draft ? 1 : 0 },
  ];

  const closeModals = () => {
    setSelectedLead(null);
    setSelectedDraft(null);
    setShowMoreDetails(false);
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.headerTitle}>My Opportunities</h1>
          <div className={styles.tabs}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                type="button"
                className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={styles.tabCount}>{tab.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.list}>
          {loading ? (
            <div className={styles.loadingState}>
              <div className={styles.spinner} />
            </div>
          ) : activeTab === 'draft' ? (
            draft ? (
              <button
                type="button"
                className={`${styles.leadCard} ${styles.draftCard}`}
                onClick={() => { setSelectedDraft(draft); setShowMoreDetails(false); }}
              >
                <div className={styles.leadInfo}>
                  <p className={styles.leadName}>{getDraftCustomerName(draft)}</p>
                  {getDraftAddress(draft) && (
                    <p className={styles.leadAddress}>{getDraftAddress(draft)}</p>
                  )}
                  <p className={styles.leadDate}>
                    {draft.savedAt ? `Saved ${formatDate(draft.savedAt)}` : 'Unsaved draft'}
                    {' · '}Stopped at {getStepLabel(draft.stepIndex)}
                  </p>
                </div>
                <span className={`${styles.statusBadge} ${styles.statusDraft}`}>
                  {draft.leadType === 'upsell' ? 'Upsell' : 'New Lead'}
                </span>
              </button>
            ) : (
              <div className={styles.emptyState}>No drafts saved</div>
            )
          ) : filteredLeads.length === 0 ? (
            <div className={styles.emptyState}>
              {activeTab === 'all' ? 'No opportunities submitted yet' : `No ${activeTab.replace('-', ' ')} opportunities`}
            </div>
          ) : (
            filteredLeads.map((lead) => {
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

      {/* Submitted lead detail modal */}
      {selectedLead && (
        <div
          className={styles.modalOverlay}
          onClick={event => {
            if (event.target === event.currentTarget) closeModals();
          }}
        >
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="opportunity-detail-title">
            <div className={styles.modalHeader}>
              <h2 id="opportunity-detail-title" className={styles.modalTitle}>Opportunity Details</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={closeModals}
                aria-label="Close details modal"
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
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

              <div className={styles.detailSection}>
                <p className={styles.detailHeading}>Summary</p>
                <p className={styles.multilineValue}>{selectedLead.comments ?? 'No summary submitted'}</p>
              </div>

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

              <div className={styles.detailGrid}>
                <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
                  <p className={styles.detailLabel}>Pest Type</p>
                  <p className={styles.detailValue}>{selectedLead.pest_type ?? '—'}</p>
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

      {/* Draft detail modal */}
      {selectedDraft && (
        <div
          className={styles.modalOverlay}
          onClick={event => {
            if (event.target === event.currentTarget) closeModals();
          }}
        >
          <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="draft-detail-title">
            <div className={styles.modalHeader}>
              <h2 id="draft-detail-title" className={styles.modalTitle}>Draft Opportunity</h2>
              <button
                type="button"
                className={styles.modalClose}
                onClick={closeModals}
                aria-label="Close draft modal"
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <p className={styles.detailLabel}>Type</p>
                  <p className={styles.detailValue}>
                    {selectedDraft.leadType === 'upsell' ? 'Upsell Opportunity' : 'New Lead'}
                  </p>
                </div>
                <div className={styles.detailItem}>
                  <p className={styles.detailLabel}>Last Saved</p>
                  <p className={styles.detailValue}>
                    {selectedDraft.savedAt ? formatDateTime(selectedDraft.savedAt) : '—'}
                  </p>
                </div>
                <div className={styles.detailItem}>
                  <p className={styles.detailLabel}>Customer</p>
                  <p className={styles.detailValue}>{getDraftCustomerName(selectedDraft)}</p>
                </div>
                <div className={styles.detailItem}>
                  <p className={styles.detailLabel}>Stopped At</p>
                  <p className={styles.detailValue}>{getStepLabel(selectedDraft.stepIndex)}</p>
                </div>
                {getDraftAddress(selectedDraft) && (
                  <div className={`${styles.detailItem} ${styles.detailItemFull}`}>
                    <p className={styles.detailLabel}>Address</p>
                    <p className={styles.detailValue}>{getDraftAddress(selectedDraft)}</p>
                  </div>
                )}
              </div>

              {selectedDraft.aiResult && (
                <div className={styles.detailSection}>
                  <p className={styles.detailHeading}>AI Findings</p>
                  {selectedDraft.aiResult.issue_detected && (
                    <p className={styles.multilineValue}>{selectedDraft.aiResult.issue_detected}</p>
                  )}
                  {selectedDraft.aiResult.ai_summary && (
                    <p className={styles.multilineValue} style={{ marginTop: '6px', color: 'var(--gray-600)', fontSize: '13px' }}>
                      {selectedDraft.aiResult.ai_summary}
                    </p>
                  )}
                </div>
              )}

              {selectedDraft.notes && (
                <div className={styles.detailSection}>
                  <p className={styles.detailHeading}>Notes</p>
                  <p className={styles.multilineValue}>{selectedDraft.notes}</p>
                </div>
              )}

              <button
                type="button"
                className={styles.restoreDraftBtn}
                onClick={() => {
                  closeModals();
                  router.push('/tech-leads/new');
                }}
              >
                Restore Draft
              </button>
            </div>
          </div>
        </div>
      )}

      <TechLeadsNav />
    </>
  );
}
