'use client';

import React from 'react';
import { Lead, leadStatusOptions } from '@/types/lead';
import { ColumnDefinition, TabDefinition } from '@/components/Common/DataTable';
import { ChevronRight, Mail, Phone } from 'lucide-react';
import { formatDateWithOrdinal } from '@/lib/date-utils';
import { getTimeAgo } from '@/lib/time-utils';
import { MiniAvatar } from '@/components/Common/MiniAvatar';
import styles from '@/components/Common/DataTable/DataTable.module.scss';

// Helper functions for data formatting
const formatCustomerName = (lead: Lead): string => {
  if (!lead.customer) return 'N/A';
  const firstName = lead.customer.first_name || '';
  const lastName = lead.customer.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'N/A';
};

const formatPhone = (phone?: string): string => {
  if (!phone) return 'N/A';

  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

// Define columns for leads table - New 5-column structure
export const getLeadColumns = (): ColumnDefinition<Lead>[] => [
  {
    key: 'created_at',
    title: 'Date Created',
    width: '180px',
    sortable: true,
    sortKey: 'created_at',
    render: (lead: Lead) => (
      <div className={styles.dateCell}>
        <div className={styles.primaryDate}>
          {formatDateWithOrdinal(lead.created_at)}
        </div>
        <div className={styles.relativeTime}>{getTimeAgo(lead.created_at)}</div>
      </div>
    ),
  },
  {
    key: 'last_contacted_at',
    title: 'Last Contacted',
    width: '180px',
    sortable: true,
    sortKey: 'last_contacted_at',
    render: (lead: Lead) => (
      <div className={styles.dateCell}>
        {lead.last_contacted_at ? (
          <>
            <div className={styles.primaryDate}>
              {formatDateWithOrdinal(lead.last_contacted_at)}
            </div>
            <div className={styles.relativeTime}>
              {getTimeAgo(lead.last_contacted_at)}
            </div>
          </>
        ) : (
          <div className={styles.neverContacted}>Never</div>
        )}
      </div>
    ),
  },
  {
    key: 'customer.name',
    title: 'Name',
    width: '200px',
    sortable: false,
    render: (lead: Lead) => (
      <strong className={styles.nameCell}>{formatCustomerName(lead)}</strong>
    ),
  },
  {
    key: 'contact_info',
    title: 'Contact Info',
    width: '220px',
    sortable: false,
    render: (lead: Lead) => (
      <div className={styles.contactInfo}>
        {lead.customer?.phone && (
          <div className={styles.contactRow}>
            <Phone size={14} />
            {formatPhone(lead.customer.phone)}
          </div>
        )}
        {lead.customer?.email && (
          <div className={styles.contactRow}>
            <Mail size={14} />
            {lead.customer.email}
          </div>
        )}
        {!lead.customer?.phone && !lead.customer?.email && (
          <span className={styles.noContact}>No contact info</span>
        )}
      </div>
    ),
  },
  {
    key: 'lead_status',
    title: 'Status',
    width: '180px',
    sortable: true,
    sortKey: 'lead_status',
    render: (lead: Lead) => (
      <div className={styles.statusWithAssignment}>
        {lead.lead_status === 'unassigned' ? (
          <span className={styles.statusBadge}>Unassigned</span>
        ) : (
          <div className={styles.assignedStatus}>
            {lead.assigned_user && (
              <MiniAvatar
                firstName={lead.assigned_user.first_name}
                lastName={lead.assigned_user.last_name}
                email={lead.assigned_user.email}
                avatarUrl={lead.assigned_user.avatar_url}
                size="small"
              />
            )}
            <span className={styles.statusBadge}>
              {leadStatusOptions.find(s => s.value === lead.lead_status)?.label}
            </span>
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'actions',
    title: '',
    width: '140px',
    sortable: false,
    render: (lead: Lead, onAction?: (action: string, item: Lead) => void) => (
      <button
        className={styles.actionButton}
        onClick={e => {
          e.stopPropagation();
          onAction?.('edit', lead);
        }}
      >
        Manage Lead
        <ChevronRight size={16} />
      </button>
    ),
  },
];

// Define tabs for leads filtering - reordered with Unassigned as default
// Scheduling-related statuses (Ready To Schedule, Scheduled, Won, Lost) moved to Scheduling page
export const getLeadTabs = (): TabDefinition<Lead>[] => [
  {
    key: 'unassigned',
    label: 'Unassigned',
    filter: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'unassigned'),
    getCount: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'unassigned')
        .length,
  },
  {
    key: 'contacting',
    label: 'Contacting',
    filter: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'contacting'),
    getCount: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'contacting')
        .length,
  },
  {
    key: 'quoted',
    label: 'Quoted',
    filter: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'quoted'),
    getCount: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'quoted')
        .length,
  },
  {
    key: 'archived',
    label: 'Archived',
    filter: (leads: Lead[]) => leads.filter(lead => lead.archived),
    getCount: (leads: Lead[]) => leads.filter(lead => lead.archived).length,
  },
  {
    key: 'all',
    label: 'All Leads',
    filter: (leads: Lead[]) =>
      leads.filter(
        lead =>
          !lead.archived &&
          ['unassigned', 'contacting', 'quoted'].includes(lead.lead_status)
      ),
    getCount: (leads: Lead[]) =>
      leads.filter(
        lead =>
          !lead.archived &&
          ['unassigned', 'contacting', 'quoted'].includes(lead.lead_status)
      ).length,
  },
];
