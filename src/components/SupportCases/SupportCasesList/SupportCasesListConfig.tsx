'use client';

import React from 'react';
import { SupportCase, supportCaseStatusOptions } from '@/types/support-case';
import { ColumnDefinition, TabDefinition } from '@/components/Common/DataTable';
import { ChevronRight } from 'lucide-react';
import { MiniAvatar } from '@/components/Common/MiniAvatar';
import styles from '@/components/Common/DataTable/DataTable.module.scss';

// Helper functions for data formatting
const formatDateCreated = (createdAt: string): string => {
  const date = new Date(createdAt);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCustomerName = (supportCase: SupportCase): string => {
  if (!supportCase.customer) return 'N/A';
  const firstName = supportCase.customer.first_name || '';
  const lastName = supportCase.customer.last_name || '';
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

const formatIssueType = (issueType: string): string => {
  const typeMap: { [key: string]: string } = {
    billing: 'Billing',
    technical: 'Technical',
    service_issue: 'Service',
    complaint: 'Complaint',
    general_inquiry: 'General',
    account: 'Account',
    other: 'Other',
  };
  return typeMap[issueType] || issueType;
};

const formatPriority = (priority: string): string => {
  const priorityMap: { [key: string]: string } = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  };
  return priorityMap[priority] || priority;
};

const formatStatus = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    new: 'New',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    awaiting_customer: 'Awaiting Customer',
    awaiting_internal: 'Awaiting Internal',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return statusMap[status] || status;
};

// Define columns for support cases table
export const getSupportCaseColumns = (): ColumnDefinition<SupportCase>[] => [
  {
    key: 'created_at',
    title: 'Created',
    width: '120px',
    sortable: true,
    sortKey: 'created_at',
    render: (supportCase: SupportCase) => (
      <span className={styles.timeCell}>
        {formatDateCreated(supportCase.created_at)}
      </span>
    ),
  },
  {
    key: 'customer.name',
    title: 'Customer',
    width: '180px',
    sortable: false,
    render: (supportCase: SupportCase) => (
      <span className={styles.nameCell}>{formatCustomerName(supportCase)}</span>
    ),
  },
  {
    key: 'customer.phone',
    title: 'Phone',
    width: '140px',
    sortable: false,
    render: (supportCase: SupportCase) => (
      <span className={styles.phoneCell}>
        {formatPhone(supportCase.customer?.phone)}
      </span>
    ),
  },
  {
    key: 'summary',
    title: 'Summary',
    width: '250px',
    sortable: true,
    sortKey: 'summary',
    render: (supportCase: SupportCase) => (
      <span className={styles.summaryCell}>
        {supportCase.summary || 'No summary provided'}
      </span>
    ),
  },
  {
    key: 'issue_type',
    title: 'Issue Type',
    width: '120px',
    sortable: true,
    sortKey: 'issue_type',
    render: (supportCase: SupportCase) => (
      <span className={styles.issueTypeCell}>
        {formatIssueType(supportCase.issue_type)}
      </span>
    ),
  },
  {
    key: 'priority',
    title: 'Priority',
    width: '120px',
    sortable: true,
    sortKey: 'priority',
    render: (supportCase: SupportCase) => (
      <div className={`${styles.priorityCell} ${styles[supportCase.priority]}`}>
        {formatPriority(supportCase.priority)}
      </div>
    ),
  },
  {
    key: 'status',
    title: 'Status',
    width: '180px',
    sortable: true,
    sortKey: 'status',
    render: (supportCase: SupportCase) => (
      <div className={styles.statusWithAssignment}>
        {!supportCase.assigned_to ? (
          <span className={styles.statusBadge}>Unassigned</span>
        ) : (
          <div className={styles.assignedStatus}>
            {supportCase.assigned_user && (
              <MiniAvatar
                firstName={supportCase.assigned_user.first_name}
                lastName={supportCase.assigned_user.last_name}
                email={supportCase.assigned_user.email}
                avatarUrl={supportCase.assigned_user.avatar_url}
                size="small"
              />
            )}
            <span className={styles.statusBadge}>
              {supportCaseStatusOptions.find(s => s.value === supportCase.status)?.label}
            </span>
          </div>
        )}
      </div>
    ),
  },
  {
    key: 'actions',
    title: '',
    width: '100px',
    sortable: false,
    render: (
      supportCase: SupportCase,
      onAction?: (action: string, item: SupportCase) => void
    ) => (
      <button
        className={styles.actionButton}
        onClick={e => {
          e.stopPropagation();
          onAction?.('view', supportCase);
        }}
      >
        View
        <ChevronRight size={18} />
      </button>
    ),
  },
];

// Define tabs for support cases filtering
export const getSupportCaseTabs = (): TabDefinition<SupportCase>[] => [
  {
    key: 'all',
    label: 'All Cases',
    filter: (supportCases: SupportCase[]) => supportCases.filter(sc => !sc.archived),
    getCount: (supportCases: SupportCase[]) => supportCases.filter(sc => !sc.archived).length,
  },
  {
    key: 'unassigned',
    label: 'Unassigned',
    filter: (supportCases: SupportCase[]) =>
      supportCases.filter(sc => !sc.archived && !sc.assigned_to),
    getCount: (supportCases: SupportCase[]) =>
      supportCases.filter(sc => !sc.archived && !sc.assigned_to).length,
  },
  {
    key: 'in_progress',
    label: 'In Progress',
    filter: (supportCases: SupportCase[]) =>
      supportCases.filter(sc => !sc.archived && sc.status === 'in_progress'),
    getCount: (supportCases: SupportCase[]) =>
      supportCases.filter(sc => !sc.archived && sc.status === 'in_progress').length,
  },
  {
    key: 'awaiting_response',
    label: 'Awaiting Response',
    filter: (supportCases: SupportCase[]) =>
      supportCases.filter(sc => !sc.archived && sc.status === 'awaiting_response'),
    getCount: (supportCases: SupportCase[]) =>
      supportCases.filter(sc => !sc.archived && sc.status === 'awaiting_response').length,
  },
  {
    key: 'resolved',
    label: 'Resolved',
    filter: (supportCases: SupportCase[]) =>
      supportCases.filter(sc => !sc.archived && sc.status === 'resolved'),
    getCount: (supportCases: SupportCase[]) =>
      supportCases.filter(sc => !sc.archived && sc.status === 'resolved').length,
  },
];
