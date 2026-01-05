'use client';

import React from 'react';
import { Lead, leadStatusOptions } from '@/types/lead';
import { ColumnDefinition, TabDefinition } from '@/components/Common/DataTable';
import { Mail, Phone, RefreshCcw } from 'lucide-react';
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

// Define columns for archived leads table
export const getArchivedLeadColumns = (): ColumnDefinition<Lead>[] => [
  {
    key: 'created_at',
    title: 'Date Created',
    width: '160px',
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
    key: 'customer.name',
    title: 'Name',
    width: '160px',
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
      </div>
    ),
  },
  {
    key: 'lost_reason',
    title: 'Reason',
    width: '220px',
    sortable: false,
    render: (lead: Lead) => (
      <div className={styles.formatCell}>
        {lead.lost_reason || lead.archived ? (
          <span className={styles.lostReason}>
            {lead.lost_reason || 'Archived'}
          </span>
        ) : (
          <span className={styles.noReason}>—</span>
        )}
      </div>
    ),
  },
  {
    key: 'actions',
    title: '',
    width: '140px',
    sortable: false,
    render: (lead: Lead, onAction?: (action: string, item: Lead) => void) => {
      // Don't show recover button for won leads
      if (lead.lead_status === 'won') {
        return null;
      }

      return (
        <div className={styles.taskActions}>
          <button
            className={styles.actionButton}
            onClick={e => {
              e.stopPropagation();
              onAction?.('recover', lead);
            }}
          >
            <RefreshCcw size={16} />
            Recover Lead
          </button>
        </div>
      );
    },
  },
];

// Define tabs for archived leads
export const getArchivedLeadTabs = (): TabDefinition<Lead>[] => [
  {
    key: 'all',
    label: 'All Archived',
    filter: (leads: Lead[]) =>
      leads.filter(
        lead =>
          lead.archived ||
          lead.lead_status === 'lost' ||
          lead.lead_status === 'won'
      ),
    getCount: (leads: Lead[]) =>
      leads.filter(
        lead =>
          lead.archived ||
          lead.lead_status === 'lost' ||
          lead.lead_status === 'won'
      ).length,
  },
  {
    key: 'lost',
    label: 'Lost',
    filter: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'lost'),
    getCount: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'lost')
        .length,
  },
  {
    key: 'won',
    label: 'Won',
    filter: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'won'),
    getCount: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'won').length,
  },
  {
    key: 'archived',
    label: 'Junk',
    filter: (leads: Lead[]) => leads.filter(lead => lead.archived === true),
    getCount: (leads: Lead[]) =>
      leads.filter(lead => lead.archived === true).length,
  },
];
