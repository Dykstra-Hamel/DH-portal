'use client';

import React from 'react';
import { SupportCase } from '@/types/support-case';
import { ColumnDefinition } from '@/components/Common/DataTable';
import { ChevronRight } from 'lucide-react';
import styles from '@/components/Common/DataTable/DataTable.module.scss';

// Helper functions for data formatting
const formatIssueType = (issueType: string): string => {
  const issueTypeMap: { [key: string]: string } = {
    billing: 'Billing',
    scheduling: 'Scheduling',
    complaint: 'Complaint',
    service_quality: 'Service Quality',
    treatment_request: 'Treatment Request',
    re_service: 'Re-service',
    general_inquiry: 'General Inquiry',
    warranty_claim: 'Warranty Claim',
  };
  return issueTypeMap[issueType] || issueType;
};

const formatStatus = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    unassigned: 'Unassigned',
    in_progress: 'In Progress',
    awaiting_response: 'Awaiting Response',
    resolved: 'Resolved',
    closed: 'Closed',
  };
  return statusMap[status] || status;
};

const formatPriority = (priority: string): string => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatCaseId = (id: string): string => {
  return `#${id.slice(-8)}`;
};

// Define columns for customer support cases table
export const getCustomerSupportCaseColumns = (): ColumnDefinition<SupportCase>[] => [
  {
    key: 'id',
    title: 'Case ID',
    sortKey: 'id',
    render: (supportCase: SupportCase) => (
      <div className={styles.caseIdCell}>{formatCaseId(supportCase.id)}</div>
    ),
  },
  {
    key: 'summary',
    title: 'Summary',
    sortKey: 'summary',
    render: (supportCase: SupportCase) => (
      <div className={styles.summaryCell}>
        <div className={styles.summaryText}>{supportCase.summary}</div>
      </div>
    ),
  },
  {
    key: 'issue_type',
    title: 'Issue Type',
    sortKey: 'issue_type',
    render: (supportCase: SupportCase) => (
      <div className={styles.issueTypeCell}>
        {formatIssueType(supportCase.issue_type)}
      </div>
    ),
  },
  {
    key: 'status',
    title: 'Status',
    sortKey: 'status',
    render: (supportCase: SupportCase) => (
      <div className={`${styles.statusCell} ${styles[supportCase.status]}`}>
        {formatStatus(supportCase.status)}
      </div>
    ),
  },
  {
    key: 'priority',
    title: 'Priority',
    sortKey: 'priority',
    render: (supportCase: SupportCase) => (
      <div className={`${styles.priorityCell} ${styles[supportCase.priority]}`}>
        {formatPriority(supportCase.priority)}
      </div>
    ),
  },
  {
    key: 'created_at',
    title: 'Created',
    sortKey: 'created_at',
    render: (supportCase: SupportCase) => (
      <div className={styles.dateCell}>{formatDate(supportCase.created_at)}</div>
    ),
  },
  {
    key: 'actions',
    title: '',
    sortKey: '',
    sortable: false,
    render: () => (
      <div className={styles.actionsCell}>
        <ChevronRight size={20} className={styles.chevronIcon} />
      </div>
    ),
  },
];
