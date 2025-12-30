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

const getLeadActionButtonText = (status: string): string => {
  switch (status) {
    case 'new':
      return 'Assign Lead';
    case 'in_process':
      return 'Manage Lead';
    case 'quoted':
      return 'Manage Lead';
    case 'scheduling':
      return 'Schedule Service';
    case 'won':
      return 'View Lead';
    case 'lost':
      return 'View Lead';
    default:
      return 'Manage Lead';
  }
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

const getLeadSourceLabel = (leadType: string | null): string => {
  if (!leadType) {
    return 'Other';
  }

  switch (leadType) {
    case 'phone_call':
      return 'Call';
    case 'web_form':
      return 'Form';
    case 'bulk_add':
      return 'Bulk Add';
    default:
      // Capitalize first letter for other types
      return leadType.charAt(0).toUpperCase() + leadType.slice(1).replace(/_/g, ' ');
  }
};

// Define columns for leads table - New 5-column structure
export const getLeadColumns = (): ColumnDefinition<Lead>[] => [
  {
    key: 'created_at',
    title: 'Date Created',
    width: '180px',
    sortable: true,
    sortKey: 'created_at',
    render: (lead: Lead) => {
      const createdDate = new Date(lead.created_at);
      const now = new Date();
      const hoursDiff =
        (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60);

      let colorClass = '';
      if (hoursDiff > 24) {
        colorClass = styles.dateRed;
      } else if (hoursDiff > 12) {
        colorClass = styles.dateOrange;
      }

      return (
        <div className={`${styles.dateCell} ${colorClass}`}>
          <div className={styles.primaryDate}>
            {formatDateWithOrdinal(lead.created_at)}
          </div>
          <div className={styles.relativeTime}>
            {getTimeAgo(lead.created_at)}
          </div>
        </div>
      );
    },
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
        {lead.lead_status === 'new' ? (
          <span className={`${styles.statusBadge} ${styles.statusUnassigned}`}>
            Unassigned
          </span>
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
    key: 'lead_type',
    title: 'Source',
    width: '90px',
    sortable: true,
    sortKey: 'lead_type',
    render: (lead: Lead) => (
      <div className={styles.formatCell}>
        {lead.lead_type === 'phone_call' && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="19"
            viewBox="0 0 18 19"
            fill="none"
            className={styles.phoneIcon}
          >
            <path
              d="M10.374 13.0652C10.5289 13.1363 10.7034 13.1525 10.8688 13.1112C11.0341 13.0699 11.1805 12.9735 11.2838 12.8379L11.55 12.4892C11.6897 12.3029 11.8709 12.1517 12.0792 12.0475C12.2875 11.9434 12.5171 11.8892 12.75 11.8892H15C15.3978 11.8892 15.7794 12.0472 16.0607 12.3285C16.342 12.6098 16.5 12.9913 16.5 13.3892V15.6392C16.5 16.037 16.342 16.4185 16.0607 16.6998C15.7794 16.9811 15.3978 17.1392 15 17.1392C11.4196 17.1392 7.9858 15.7168 5.45406 13.1851C2.92232 10.6534 1.5 7.21958 1.5 3.63916C1.5 3.24134 1.65804 2.8598 1.93934 2.5785C2.22064 2.2972 2.60218 2.13916 3 2.13916H5.25C5.64782 2.13916 6.02936 2.2972 6.31066 2.5785C6.59196 2.8598 6.75 3.24134 6.75 3.63916V5.88916C6.75 6.12203 6.69578 6.3517 6.59164 6.55998C6.4875 6.76826 6.33629 6.94944 6.15 7.08916L5.799 7.35241C5.66131 7.45754 5.56426 7.6071 5.52434 7.77567C5.48442 7.94425 5.50409 8.12144 5.58 8.27716C6.60501 10.3591 8.29082 12.0428 10.374 13.0652Z"
              stroke="#0088CC"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {lead.lead_type === 'web_form' && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="19"
            viewBox="0 0 18 19"
            fill="none"
            className={styles.formIcon}
          >
            <path
              d="M9 15.6392H8.25C7.85218 15.6392 7.47064 15.4811 7.18934 15.1998C6.90804 14.9185 6.75 14.537 6.75 14.1392M6.75 14.1392C6.75 14.537 6.59196 14.9185 6.31066 15.1998C6.02936 15.4811 5.64782 15.6392 5.25 15.6392H4.5M6.75 14.1392V5.13916M9.75 6.63916H15C15.3978 6.63916 15.7794 6.7972 16.0607 7.0785C16.342 7.3598 16.5 7.74134 16.5 8.13916V11.1392C16.5 11.537 16.342 11.9185 16.0607 12.1998C15.7794 12.4811 15.3978 12.6392 15 12.6392H9.75M3.75 12.6392H3C2.60218 12.6392 2.22064 12.4811 1.93934 12.1998C1.65804 11.9185 1.5 11.537 1.5 11.1392V8.13916C1.5 7.74134 1.65804 7.3598 1.93934 7.0785C2.22064 6.7972 2.60218 6.63916 3 6.63916H3.75M4.5 3.63916H5.25C5.64782 3.63916 6.02936 3.7972 6.31066 4.0785C6.59196 4.3598 6.75 4.74134 6.75 5.13916M6.75 5.13916C6.75 4.74134 6.90804 4.3598 7.18934 4.0785C7.47064 3.7972 7.85218 3.63916 8.25 3.63916H9"
              stroke="#0088CC"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {lead.lead_type === 'bulk_add' && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="19"
            viewBox="0 0 18 19"
            fill="none"
            className={styles.bulkIcon}
          >
            <path
              d="M10.5 2.13916H4.5C4.10218 2.13916 3.72064 2.2972 3.43934 2.5785C3.15804 2.8598 3 3.24134 3 3.63916V15.6392C3 16.037 3.15804 16.4185 3.43934 16.6998C3.72064 16.9811 4.10218 17.1392 4.5 17.1392H13.5C13.8978 17.1392 14.2794 16.9811 14.5607 16.6998C14.842 16.4185 15 16.037 15 15.6392V6.63916M10.5 2.13916L15 6.63916M10.5 2.13916V6.63916H15M11.25 10.1392H6.75M11.25 13.1392H6.75M8.25 7.13916H6.75"
              stroke="#0088CC"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        <span className={styles.sourceBadge}>
          {getLeadSourceLabel(lead.lead_type)}
        </span>
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
        {getLeadActionButtonText(lead.lead_status)}
        <ChevronRight size={16} />
      </button>
    ),
  },
];

// Define tabs for leads filtering - simplified for Leads page
export const getLeadTabs = (): TabDefinition<Lead>[] => [
  {
    key: 'all',
    label: 'All Leads',
    filter: (leads: Lead[]) =>
      leads.filter(
        lead =>
          !lead.archived &&
          ['new', 'in_process', 'quoted'].includes(lead.lead_status)
      ),
    getCount: (leads: Lead[]) =>
      leads.filter(
        lead =>
          !lead.archived &&
          ['new', 'in_process', 'quoted'].includes(lead.lead_status)
      ).length,
  },
  {
    key: 'contacting',
    label: 'Contacting',
    filter: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'in_process'),
    getCount: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'in_process')
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
];

// User-specific tabs - excludes "unassigned" tab for "My Sales Leads" view
export const getUserLeadTabs = (): TabDefinition<Lead>[] => [
  {
    key: 'all',
    label: 'All My Leads',
    filter: (leads: Lead[]) =>
      leads.filter(
        lead =>
          !lead.archived && ['in_process', 'quoted', 'scheduling'].includes(lead.lead_status)
      ),
    getCount: (leads: Lead[]) =>
      leads.filter(
        lead =>
          !lead.archived && ['in_process', 'quoted', 'scheduling'].includes(lead.lead_status)
      ).length,
  },
  {
    key: 'contacting',
    label: 'Contacting',
    filter: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'in_process'),
    getCount: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'in_process')
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
    key: 'scheduling',
    label: 'Ready To Schedule',
    filter: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'scheduling'),
    getCount: (leads: Lead[]) =>
      leads.filter(lead => !lead.archived && lead.lead_status === 'scheduling')
        .length,
  },
];
