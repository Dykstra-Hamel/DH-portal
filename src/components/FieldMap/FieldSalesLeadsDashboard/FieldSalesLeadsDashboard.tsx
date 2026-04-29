'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getCustomerDisplayName } from '@/lib/display-utils';
import { formatAge } from '@/lib/date-utils';
import { DataTable, ColumnDefinition, CardViewConfig } from '@/components/Common/DataTable';
import { MiniAvatar } from '@/components/Common/MiniAvatar/MiniAvatar';
import tabStyles from '@/components/Common/DataTable/DataTableTabs.module.scss';
import styles from './FieldSalesLeadsDashboard.module.scss';

type LeadTab = 'new' | 'my' | 'closed';

interface FieldSalesLead {
  id: string;
  company_id: string;
  lead_status: string;
  service_type?: string;
  lead_source?: string | null;
  lead_type?: string | null;
  comments?: string | null;
  assigned_to?: string | null;
  assigned_user?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    avatar_url?: string | null;
    uploaded_avatar_url?: string | null;
  } | null;
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
  is_viewed?: boolean;
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

function getReviewLeadHref(lead: FieldSalesLead, companyId: string): string {
  const inProgress =
    lead.lead_status === 'new' || lead.lead_status === 'in_process';
  if (inProgress) {
    const params = new URLSearchParams({ leadId: lead.id });
    if (companyId) params.set('companyId', companyId);
    return `/field-sales/field-map/new?${params.toString()}`;
  }
  return `/field-sales/leads/${lead.id}`;
}

type NextTaskInfo = {
  action_type?: string | null;
  due_date?: string | null;
} | null;

function formatNextAction(next: NextTaskInfo): string {
  if (!next) return '—';
  const verb = (() => {
    switch (next.action_type) {
      case 'live_call':
      case 'outbound_call':
      case 'ai_call':
        return 'Call';
      case 'text_message':
        return 'Text';
      case 'email':
        return 'Email';
      default:
        return null;
    }
  })();
  if (!verb) return '—';
  if (!next.due_date) return verb;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(next.due_date + 'T00:00:00');
  const diffDays = Math.round(
    (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays < 0) return `${verb} (Overdue)`;
  if (diffDays === 0) return `${verb} Today`;
  if (diffDays === 1) return `${verb} Tomorrow`;
  return `${verb} in ${diffDays} Days`;
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
      <span className={styles.queueTime}>{formatAge(lead.created_at)}</span>
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
];

function renderProgressCell(lead: FieldSalesLead) {
  const unassigned = !lead.assigned_to;
  const statusKey = unassigned ? 'unassigned' : lead.lead_status;
  const progress = unassigned ? 100 : getStatusProgress(lead.lead_status);
  const statusLabel = unassigned
    ? 'Unassigned'
    : getStatusLabel(lead.lead_status);
  const inAutomation = !!(lead as FieldSalesLead & { in_automation?: boolean })
    .in_automation;
  const u = lead.assigned_user;

  const avatarNode = u ? (
    <MiniAvatar
      firstName={u.first_name ?? undefined}
      lastName={u.last_name ?? undefined}
      email={u.email}
      userId={u.id}
      avatarUrl={u.avatar_url}
      uploadedAvatarUrl={u.uploaded_avatar_url}
      size="medium"
      showTooltip={false}
    />
  ) : (
    <div
      className={styles.unassignedAvatar}
      aria-label="Unassigned"
      title="Unassigned"
    >
      ?
    </div>
  );

  return (
    <div
      className={`${styles.progressCell} ${styles[`status_${statusKey}`]}`}
    >
      <div className={styles.progressAvatar}>{avatarNode}</div>
      <div className={styles.progressColumn}>
        <div className={styles.statusTrack}>
          <div
            className={styles.statusFill}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className={styles.statusLabel}>
          {statusLabel}
          {inAutomation && ' | Automation'}
        </span>
      </div>
    </div>
  );
}

function buildSimpleCardViewConfig(
  companyId: string,
  nextTasks?: Record<string, NextTaskInfo>
): CardViewConfig<FieldSalesLead> {
  const topFields: CardViewConfig<FieldSalesLead>['topFields'] = [
    {
      key: 'age',
      label: 'Age',
      width: '64px',
      render: lead => formatAge(lead.created_at),
    },
    {
      key: 'name',
      label: 'Client Name',
      width: 'minmax(140px, 1fr)',
      render: lead => getCustomerDisplayName(lead.customer as any) ?? 'Unknown',
    },
  ];

  if (nextTasks) {
    topFields.push({
      key: 'action',
      label: 'Action',
      width: 'minmax(140px, 1fr)',
      render: lead => formatNextAction(nextTasks[lead.id] ?? null),
    });
  }

  topFields.push({
    key: 'progress',
    label: 'Progress',
    width: 'minmax(100px, 2fr)',
    render: renderProgressCell,
  });

  return {
    topFields,
    primaryAction: lead => (
      <Link href={getReviewLeadHref(lead, companyId)} className={styles.reviewBtn}>
        Open Lead
        <ChevronRight size={16} />
      </Link>
    ),
  };
}

function buildSummaryCardViewConfig(
  companyId: string,
  viewedIds: Set<string>,
  markViewed: (leadId: string) => void,
  isMobile: boolean
): CardViewConfig<FieldSalesLead> {
  const renderSummaryAvatar = (lead: FieldSalesLead) => {
    const u = lead.assigned_user;
    return u ? (
      <MiniAvatar
        firstName={u.first_name ?? undefined}
        lastName={u.last_name ?? undefined}
        email={u.email}
        userId={u.id}
        avatarUrl={u.avatar_url}
        uploadedAvatarUrl={u.uploaded_avatar_url}
        size="medium"
        showTooltip={false}
      />
    ) : (
      <div
        className={styles.unassignedAvatar}
        aria-label="Unassigned"
        title="Unassigned"
      >
        ?
      </div>
    );
  };

  const renderStatusBar = (lead: FieldSalesLead) => {
    const progress = getStatusProgress(lead.lead_status);
    return (
      <div className={`${styles.statusPill} ${styles.status_unassigned}`}>
        <div className={styles.statusTrack}>
          <div className={styles.statusFill} style={{ width: `${progress}%` }} />
        </div>
        <span className={styles.statusLabel}>Unassigned</span>
      </div>
    );
  };

  const getLocation = (lead: FieldSalesLead): string => {
    const primary = lead.customer?.customer_service_addresses?.find(
      a => a.is_primary_address
    );
    return (
      primary?.service_address?.city ?? lead.customer?.city ?? 'Unknown'
    );
  };

  const desktopTopFields: CardViewConfig<FieldSalesLead>['topFields'] = [
    {
      key: 'age',
      label: 'Age',
      width: '56px',
      render: lead => formatAge(lead.created_at),
    },
    {
      key: 'name',
      label: 'Client Name',
      width: 'minmax(0, 2fr)',
      render: lead => getCustomerDisplayName(lead.customer as any) ?? 'Unknown',
    },
    {
      key: 'location',
      label: 'Location',
      width: 'minmax(0, 2fr)',
      render: getLocation,
    },
    {
      key: 'format',
      label: 'Format',
      width: 'minmax(0, 1fr)',
      render: lead => lead.lead_type ?? '—',
    },
    {
      key: 'source',
      label: 'Source',
      width: 'minmax(0, 1fr)',
      render: lead => lead.lead_source ?? '—',
    },
  ];

  const mobileTopFields: CardViewConfig<FieldSalesLead>['topFields'] = [
    {
      key: 'age',
      label: 'Age',
      width: '48px',
      render: lead => formatAge(lead.created_at),
    },
    {
      key: 'name',
      label: 'Client Name',
      width: 'minmax(0, 1.4fr)',
      render: lead => getCustomerDisplayName(lead.customer as any) ?? 'Unknown',
    },
    {
      key: 'details',
      label: 'Details',
      width: 'minmax(0, 1.2fr)',
      render: lead => (
        <div className={styles.detailsStack}>
          <span>{getLocation(lead)}</span>
          <span>{lead.lead_type ?? '—'}</span>
          <span>{lead.lead_source ?? '—'}</span>
        </div>
      ),
    },
  ];

  const topFields = isMobile ? mobileTopFields : desktopTopFields;

  return {
    topFields,
    summary: {
      label: 'Summary:',
      render: lead => lead.comments?.trim() || 'No Details available.',
    },
    avatar: renderSummaryAvatar,
    statusBar: renderStatusBar,
    primaryAction: lead => (
      <Link
        href={`/field-sales/leads/${lead.id}`}
        className={styles.reviewBtn}
        onClick={() => markViewed(lead.id)}
      >
        Review Lead
        <ChevronRight size={16} />
      </Link>
    ),
    unread: lead => !viewedIds.has(lead.id),
  };
}

function buildActionColumn(
  companyId: string
): ColumnDefinition<FieldSalesLead> {
  return {
    key: 'action',
    title: '',
    sortable: false,
    render: (lead) => (
      <Link
        href={getReviewLeadHref(lead, companyId)}
        className={styles.reviewBtn}
      >
        Review Lead
        <ChevronRight size={16} />
      </Link>
    ),
  };
}

export function FieldSalesLeadsDashboard({ companyId, userId }: FieldSalesLeadsDashboardProps) {
  const [activeTab, setActiveTab] = useState<LeadTab>('new');
  const [leads, setLeads] = useState<FieldSalesLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [counts, setCounts] = useState<Record<LeadTab, number | null>>({ new: null, my: null, closed: null });
  const [viewedIds, setViewedIds] = useState<Set<string>>(new Set());
  const [nextTasks, setNextTasks] = useState<Record<string, NextTaskInfo>>({});

  const markViewed = useCallback((leadId: string) => {
    setViewedIds(prev => {
      if (prev.has(leadId)) return prev;
      const next = new Set(prev);
      next.add(leadId);
      return next;
    });
    fetch(`/api/field-sales/leads/${leadId}/viewed`, { method: 'POST' }).catch(
      () => {}
    );
  }, []);

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
        const loaded: FieldSalesLead[] = Array.isArray(d.leads) ? d.leads : [];
        setLeads(loaded);
        setCounts(prev => ({ ...prev, [activeTab]: loaded.length }));
        if (activeTab === 'new') {
          setViewedIds(
            new Set(loaded.filter(l => l.is_viewed).map(l => l.id))
          );
        }
      })
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, [companyId, userId, activeTab]);

  // Fetch each lead's next cadence action for the My Leads tab. Reuses the
  // same endpoint the lead detail page uses, so the label stays consistent.
  useEffect(() => {
    if (activeTab !== 'my') {
      setNextTasks({});
      return;
    }
    if (leads.length === 0) {
      setNextTasks({});
      return;
    }
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        leads.map(async lead => {
          try {
            const r = await fetch(`/api/leads/${lead.id}/next-task`);
            const d = await r.json();
            return [lead.id, (d?.data ?? null) as NextTaskInfo] as const;
          } catch {
            return [lead.id, null as NextTaskInfo] as const;
          }
        })
      );
      if (cancelled) return;
      setNextTasks(Object.fromEntries(results));
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab, leads]);

  const columns = useMemo(() => {
    const actionColumn = buildActionColumn(companyId);
    const base =
      activeTab === 'new'
        ? BASE_COLUMNS.filter(c => c.key !== 'lead_status')
        : BASE_COLUMNS;
    return [...base, actionColumn];
  }, [activeTab, companyId]);

  const columnWidths = activeTab === 'new'
    ? '80px 200px 1fr 180px 1fr'
    : '80px 200px 1fr 180px 140px 1fr';

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const cardViewConfig = useMemo(() => {
    if (activeTab === 'new') {
      return buildSummaryCardViewConfig(
        companyId,
        viewedIds,
        markViewed,
        isMobile
      );
    }
    return buildSimpleCardViewConfig(
      companyId,
      activeTab === 'my' ? nextTasks : undefined
    );
  }, [activeTab, companyId, viewedIds, markViewed, nextTasks, isMobile]);

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
        cardView={cardViewConfig}
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
