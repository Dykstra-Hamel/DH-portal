'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getCustomerDisplayName } from '@/lib/display-utils';
import { DataTable, ColumnDefinition } from '@/components/Common/DataTable';
import tabStyles from '@/components/Common/DataTable/DataTableTabs.module.scss';
import styles from './FieldSalesLeadsDashboard.module.scss';

type LeadTab = 'new' | 'my' | 'closed';

interface FieldSalesLead {
  id: string;
  company_id: string;
  lead_status: string;
  service_type?: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    city?: string;
    state?: string;
    customer_service_addresses?: Array<{
      is_primary_address: boolean;
      service_address: {
        street_address: string;
        apartment_unit?: string | null;
        city: string;
        state: string;
        zip_code: string;
      } | null;
    }>;
  };
  service_plan?: {
    id: string;
    plan_name: string;
    requires_quote?: boolean;
  };
}

function formatTimeInQueue(createdAt: string): string {
  const now = new Date().getTime();
  const created = new Date(createdAt).getTime();
  const diffMs = now - created;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h ${diffMinutes % 60}m`;
  return `${diffDays}d`;
}

function getAddressText(lead: FieldSalesLead): string {
  const c = lead.customer;
  if (!c) return 'Unknown';
  const primary = c.customer_service_addresses?.find(a => a.is_primary_address);
  const addr = primary?.service_address;
  if (addr) {
    const parts = [addr.street_address, addr.city, addr.state, addr.zip_code].filter(Boolean);
    return parts.join(' ');
  }
  const parts = [c.city, c.state].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : 'Unknown';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: 'New',
    in_process: 'In Process',
    quoted: 'Quoted',
    scheduling: 'Scheduling',
    won: 'Won',
    lost: 'Lost',
    closed: 'Closed',
  };
  return labels[status] ?? status;
}

function getStatusProgress(status: string): number {
  const progress: Record<string, number> = {
    new: 0,
    in_process: 25,
    quoted: 50,
    scheduling: 75,
    won: 100,
    lost: 100,
    closed: 100,
  };
  return progress[status] ?? 0;
}

interface FieldSalesLeadsDashboardProps {
  companyId: string;
  userId: string;
}

const BASE_COLUMNS: ColumnDefinition<FieldSalesLead>[] = [
  {
    key: 'created_at',
    title: 'In Queue',
    sortable: false,
    render: (lead) => (
      <span className={styles.queueTime}>{formatTimeInQueue(lead.created_at)}</span>
    ),
  },
  {
    key: 'customer',
    title: 'Name',
    sortable: false,
    render: (lead) => (
      <span className={styles.customerName}>
        {getCustomerDisplayName(lead.customer as any) ?? 'Unknown'}
      </span>
    ),
  },
  {
    key: 'address',
    title: 'Address',
    sortable: false,
    render: (lead) => {
      const c = lead.customer;
      if (!c) return <span>Unknown</span>;
      const primary = c.customer_service_addresses?.find(a => a.is_primary_address);
      const addr = primary?.service_address;
      if (addr) {
        const line1 = [addr.street_address, addr.apartment_unit].filter(Boolean).join(' ');
        const line2 = [addr.city, addr.state, addr.zip_code].filter(Boolean).join(', ');
        return (
          <span className={styles.addressCell}>
            <span>{line1}</span>
            <span>{line2}</span>
          </span>
        );
      }
      const parts = [c.city, c.state].filter(Boolean);
      return <span>{parts.length > 0 ? parts.join(', ') : 'Unknown'}</span>;
    },
  },
  {
    key: 'service_plan',
    title: 'Service',
    sortable: false,
    render: (lead) => <span>{lead.service_plan?.plan_name ?? '—'}</span>,
  },
  {
    key: 'lead_status',
    title: 'Status',
    sortable: false,
    render: (lead) => (
      <div className={`${styles.statusPill} ${styles[`status_${lead.lead_status}`]}`}>
        <div className={styles.statusTrack}>
          <div
            className={styles.statusFill}
            style={{ width: `${getStatusProgress(lead.lead_status)}%` }}
          />
        </div>
        <span className={styles.statusLabel}>{getStatusLabel(lead.lead_status)}</span>
      </div>
    ),
  },
  {
    key: 'action',
    title: '',
    sortable: false,
    render: (lead) => (
      <Link href={`/tickets/leads/${lead.id}`} className={styles.reviewBtn}>
        Review Lead
        <ChevronRight size={16} />
      </Link>
    ),
  },
];

export function FieldSalesLeadsDashboard({ companyId, userId }: FieldSalesLeadsDashboardProps) {
  const [activeTab, setActiveTab] = useState<LeadTab>('new');
  const [leads, setLeads] = useState<FieldSalesLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [counts, setCounts] = useState<Record<LeadTab, number | null>>({ new: null, my: null, closed: null });

  useEffect(() => {
    if (!companyId || !userId) return;

    const fetchCount = (type: LeadTab) => {
      const params = new URLSearchParams({ companyId, type });
      if (type === 'my' || type === 'closed') params.set('userId', userId);
      return fetch(`/api/field-sales/leads?${params}`)
        .then(r => r.json())
        .then(d => Array.isArray(d.leads) ? d.leads.length : 0)
        .catch(() => 0);
    };

    Promise.all([fetchCount('new'), fetchCount('my'), fetchCount('closed')]).then(
      ([newCount, myCount, closedCount]) => {
        setCounts({ new: newCount, my: myCount, closed: closedCount });
      }
    );
  }, [companyId, userId]);

  useEffect(() => {
    if (!companyId || !userId) return;
    setLoading(true);
    const params = new URLSearchParams({ companyId, type: activeTab });
    if (activeTab === 'my' || activeTab === 'closed') {
      params.set('userId', userId);
    }
    fetch(`/api/field-sales/leads?${params}`)
      .then(r => r.json())
      .then(d => {
        const loaded = Array.isArray(d.leads) ? d.leads : [];
        setLeads(loaded);
        setCounts(prev => ({ ...prev, [activeTab]: loaded.length }));
      })
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [companyId, userId, activeTab]);

  const columns = useMemo(() => {
    if (activeTab === 'new') {
      return BASE_COLUMNS.filter(c => c.key !== 'lead_status');
    }
    return BASE_COLUMNS;
  }, [activeTab]);

  const columnWidths = activeTab === 'new'
    ? '80px 200px 1fr 180px 1fr'
    : '80px 200px 1fr 180px 140px 1fr';

  const filteredLeads = useMemo(() => {
    if (!searchQuery.trim()) return leads;
    const q = searchQuery.toLowerCase();
    return leads.filter(lead => {
      const name = getCustomerDisplayName(lead.customer as any) ?? '';
      const address = getAddressText(lead);
      const service = lead.service_plan?.plan_name ?? '';
      const status = getStatusLabel(lead.lead_status);
      return (
        name.toLowerCase().includes(q) ||
        address.toLowerCase().includes(q) ||
        service.toLowerCase().includes(q) ||
        status.toLowerCase().includes(q)
      );
    });
  }, [leads, searchQuery]);

  return (
    <div className={styles.container}>
      <div className={tabStyles.tabsRow}>
        <div className={tabStyles.tabsSection}>
          {(['new', 'my', 'closed'] as LeadTab[]).map(tab => (
            <button
              key={tab}
              type="button"
              className={`${tabStyles.tab} ${activeTab === tab ? tabStyles.active : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'new' ? 'New Leads' : tab === 'my' ? 'My Leads' : 'Closed'}
              {counts[tab] !== null && (
                <span className={tabStyles.tabCount}>{counts[tab]}</span>
              )}
            </button>
          ))}
        </div>
        <div className={tabStyles.searchSection}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className={tabStyles.searchIcon} aria-hidden="true">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
            <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className={tabStyles.searchInput}
          />
        </div>
      </div>

      <DataTable
        data={filteredLeads}
        loading={loading}
        title="Field Ops Leads"
        columns={columns}
        customColumnWidths={columnWidths}
        searchEnabled={false}
        emptyStateMessage={
          activeTab === 'new'
            ? 'No new leads in the queue.'
            : activeTab === 'my'
            ? 'No leads assigned to you.'
            : 'No closed leads.'
        }
      />
    </div>
  );
}
