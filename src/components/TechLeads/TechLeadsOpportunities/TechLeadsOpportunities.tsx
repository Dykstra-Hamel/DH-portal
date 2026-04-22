'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCompany } from '@/contexts/CompanyContext';
import { TechLeadsNav } from '@/components/TechLeads/TechLeadsNav/TechLeadsNav';
import {
  TechLeadDetailModal,
  type TechLead,
  getCustomerName,
  getLeadAddress,
  formatDateTime,
} from '@/components/TechLeads/TechLeadDetailModal/TechLeadDetailModal';
import styles from './TechLeadsOpportunities.module.scss';

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

function getDraftCustomerName(draft: DraftLead): string {
  if (draft.selectedCustomer) {
    const parts = [
      draft.selectedCustomer.first_name,
      draft.selectedCustomer.last_name,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(' ');
  }
  if (draft.newCustomerForm) {
    const parts = [
      draft.newCustomerForm.firstName,
      draft.newCustomerForm.lastName,
    ].filter(Boolean);
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
    1: 'Customer',
    2: 'Photos',
    3: 'AI Review',
    4: 'Service Details',
    5: 'Review',
  };
  return labels[stepIndex] ?? `Step ${stepIndex}`;
}

interface TechLeadsOpportunitiesProps {
  embedded?: boolean;
}

export function TechLeadsOpportunities({
  embedded = false,
}: TechLeadsOpportunitiesProps = {}) {
  const router = useRouter();
  const { selectedCompany } = useCompany();
  const [leads, setLeads] = useState<TechLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<TechLead | null>(null);
  const [selectedDraft, setSelectedDraft] = useState<DraftLead | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [draft, setDraft] = useState<DraftLead | null>(null);

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
        const res = await fetch(
          `/api/tech-leads/leads?companyId=${selectedCompany.id}`
        );
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
    if (!selectedDraft) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
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
  }, [selectedDraft]);

  const filteredLeads = leads.filter(lead => {
    if (activeTab === 'all') return true;
    if (activeTab === 'scheduled') return lead.lead_status === 'scheduling';
    if (activeTab === 'in-process')
      return (
        lead.lead_status !== 'won' &&
        lead.lead_status !== 'lost' &&
        lead.lead_status !== 'scheduling'
      );
    return false;
  });

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'all', label: 'All', count: leads.length },
    {
      id: 'in-process',
      label: 'In Process',
      count: leads.filter(
        l =>
          l.lead_status !== 'won' &&
          l.lead_status !== 'lost' &&
          l.lead_status !== 'scheduling'
      ).length,
    },
    {
      id: 'scheduled',
      label: 'Scheduled',
      count: leads.filter(l => l.lead_status === 'scheduling').length,
    },
    { id: 'draft', label: 'Draft', count: draft ? 1 : 0 },
  ];

  const closeModals = () => {
    setSelectedLead(null);
    setSelectedDraft(null);
  };

  return (
    <>
      <div className={styles.container}>
        <div className={styles.header}>
          {!embedded && (
            <h1 className={styles.headerTitle}>My Opportunities</h1>
          )}
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
                onClick={() => {
                  setSelectedDraft(draft);
                }}
              >
                <div className={styles.leadInfo}>
                  <p className={styles.leadName}>
                    {getDraftCustomerName(draft)}
                  </p>
                  {getDraftAddress(draft) && (
                    <p className={styles.leadAddress}>
                      {getDraftAddress(draft)}
                    </p>
                  )}
                  <p className={styles.leadDate}>
                    {draft.savedAt
                      ? `Saved ${formatDate(draft.savedAt)}`
                      : 'Unsaved draft'}
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
              {activeTab === 'all'
                ? 'No opportunities submitted yet'
                : `No ${activeTab.replace('-', ' ')} opportunities`}
            </div>
          ) : (
            filteredLeads.map(lead => {
              const customerName = getCustomerName(lead);
              const address = getLeadAddress(lead);

              return (
                <button
                  key={lead.id}
                  type="button"
                  className={styles.leadCard}
                  onClick={() => {
                    setSelectedLead(lead);
                  }}
                >
                  <div className={styles.leadInfo}>
                    <p className={styles.leadName}>{customerName}</p>
                    <p className={styles.leadAddress}>{address}</p>
                    <p className={styles.leadDate}>
                      {formatDate(lead.created_at)}
                    </p>
                  </div>
                  <span
                    className={`${styles.statusBadge} ${getStatusClass(lead.lead_status)}`}
                  >
                    {formatStatus(lead.lead_status)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {selectedLead && (
        <TechLeadDetailModal lead={selectedLead} onClose={closeModals} />
      )}

      {/* Draft detail modal */}
      {selectedDraft && (
        <div
          className={styles.modalOverlay}
          onClick={event => {
            if (event.target === event.currentTarget) closeModals();
          }}
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="draft-detail-title"
          >
            <div className={styles.modalHeader}>
              <h2 id="draft-detail-title" className={styles.modalTitle}>
                Draft Opportunity
              </h2>
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
                    {selectedDraft.leadType === 'upsell'
                      ? 'Upsell Opportunity'
                      : 'New Lead'}
                  </p>
                </div>
                <div className={styles.detailItem}>
                  <p className={styles.detailLabel}>Last Saved</p>
                  <p className={styles.detailValue}>
                    {selectedDraft.savedAt
                      ? formatDateTime(selectedDraft.savedAt)
                      : '—'}
                  </p>
                </div>
                <div className={styles.detailItem}>
                  <p className={styles.detailLabel}>Customer</p>
                  <p className={styles.detailValue}>
                    {getDraftCustomerName(selectedDraft)}
                  </p>
                </div>
                <div className={styles.detailItem}>
                  <p className={styles.detailLabel}>Stopped At</p>
                  <p className={styles.detailValue}>
                    {getStepLabel(selectedDraft.stepIndex)}
                  </p>
                </div>
                {getDraftAddress(selectedDraft) && (
                  <div
                    className={`${styles.detailItem} ${styles.detailItemFull}`}
                  >
                    <p className={styles.detailLabel}>Address</p>
                    <p className={styles.detailValue}>
                      {getDraftAddress(selectedDraft)}
                    </p>
                  </div>
                )}
              </div>

              {selectedDraft.aiResult && (
                <div className={styles.detailSection}>
                  <p className={styles.detailHeading}>AI Findings</p>
                  {selectedDraft.aiResult.issue_detected && (
                    <p className={styles.multilineValue}>
                      {selectedDraft.aiResult.issue_detected}
                    </p>
                  )}
                  {selectedDraft.aiResult.ai_summary && (
                    <p
                      className={styles.multilineValue}
                      style={{
                        marginTop: '6px',
                        color: 'var(--gray-600)',
                        fontSize: '13px',
                      }}
                    >
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
                  router.push('/field-sales/tech-leads/new?restore=1');
                }}
              >
                Restore Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {!embedded && <TechLeadsNav />}
    </>
  );
}
