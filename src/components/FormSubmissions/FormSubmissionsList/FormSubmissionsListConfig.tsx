'use client';

import React from 'react';
import { FormSubmission } from '@/types/form-submission';
import { ColumnDefinition } from '@/components/Common/DataTable';
import { ChevronRight } from 'lucide-react';
import styles from '@/components/Common/DataTable/DataTable.module.scss';

// Extended FormSubmission interface for the table
export interface FormSubmissionWithCustomer extends FormSubmission {
  customers?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    company_id: string;
  };
  tickets?: {
    id: string;
    status: string;
  };
}

// Helper functions for data formatting
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const formatConfidence = (confidence: number | null) => {
  if (confidence === null || confidence === undefined) return 'N/A';
  return `${Math.round(confidence * 100)}%`;
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'processed':
      return '#10b981';
    case 'failed':
      return '#ef4444';
    case 'pending':
      return '#f59e0b';
    default:
      return '#6b7280';
  }
};

const getCustomerName = (submission: FormSubmissionWithCustomer): string => {
  const customer = submission.customers;
  return customer
    ? `${customer.first_name} ${customer.last_name}`
    : submission.normalized_data?.first_name &&
        submission.normalized_data?.last_name
      ? `${submission.normalized_data.first_name} ${submission.normalized_data.last_name}`
      : 'Unknown';
};

// Column definitions for the form submissions table
export const formSubmissionsColumns: ColumnDefinition<FormSubmissionWithCustomer>[] =
  [
    {
      key: 'created_at',
      title: 'Date Submitted',
      width: '180px',
      sortable: true,
      sortKey: 'created_at',
      render: (submission: FormSubmissionWithCustomer) => (
        <span className={styles.timeCell}>
          {formatDate(submission.created_at)}
        </span>
      ),
    },
    {
      key: 'customer',
      title: 'Customer',
      width: '200px',
      sortable: false,
      render: (submission: FormSubmissionWithCustomer) => (
        <strong className={styles.nameCell}>
          {getCustomerName(submission)}
        </strong>
      ),
    },
    {
      key: 'source_domain',
      title: 'Source',
      width: '270px',
      sortable: true,
      sortKey: 'source_domain',
      render: (submission: FormSubmissionWithCustomer) => (
        <span>{submission.source_domain || 'N/A'}</span>
      ),
    },
    {
      key: 'pest_issue',
      title: 'Pest Issue',
      width: '150px',
      sortable: false,
      render: (submission: FormSubmissionWithCustomer) => (
        <span>{submission.normalized_data?.pest_issue || 'Not specified'}</span>
      ),
    },
    {
      key: 'processing_status',
      title: 'Status',
      width: '120px',
      sortable: true,
      sortKey: 'processing_status',
      render: (submission: FormSubmissionWithCustomer) => {
        const status = submission.processing_status || 'pending';
        const color = getStatusColor(status);
        return (
          <span
            className={styles.statusBadge}
            style={{
              color: color,
              fontWeight: 600,
              textTransform: 'capitalize',
            }}
          >
            {status}
          </span>
        );
      },
    },
    {
      key: 'actions',
      title: '',
      width: '140px',
      sortable: false,
      render: (
        submission: FormSubmissionWithCustomer,
        onAction?: (action: string, item: FormSubmissionWithCustomer) => void
      ) => (
        <button
          className={styles.actionButton}
          onClick={e => {
            e.stopPropagation();
            onAction?.('view_details', submission);
          }}
        >
          View Details
          <ChevronRight size={16} />
        </button>
      ),
    },
  ];

// Define tabs for form submissions filtering
export const getFormSubmissionTabs = (tabCounts?: { all: number; processed: number; pending: number; failed: number }) => [
  {
    key: 'all',
    label: 'All Submissions',
    filter: (submissions: FormSubmissionWithCustomer[]) => submissions,
    getCount: (submissions: FormSubmissionWithCustomer[]) => tabCounts?.all ?? submissions.length,
  },
  {
    key: 'processed',
    label: 'Processed',
    filter: (submissions: FormSubmissionWithCustomer[]) =>
      submissions.filter(s => s.processing_status === 'processed'),
    getCount: (submissions: FormSubmissionWithCustomer[]) =>
      tabCounts?.processed ?? submissions.filter(s => s.processing_status === 'processed').length,
  },
  {
    key: 'pending',
    label: 'Pending',
    filter: (submissions: FormSubmissionWithCustomer[]) =>
      submissions.filter(s => s.processing_status === 'pending'),
    getCount: (submissions: FormSubmissionWithCustomer[]) =>
      tabCounts?.pending ?? submissions.filter(s => s.processing_status === 'pending').length,
  },
  {
    key: 'failed',
    label: 'Failed',
    filter: (submissions: FormSubmissionWithCustomer[]) =>
      submissions.filter(s => s.processing_status === 'failed'),
    getCount: (submissions: FormSubmissionWithCustomer[]) =>
      tabCounts?.failed ?? submissions.filter(s => s.processing_status === 'failed').length,
  },
];

export { formatDate, formatConfidence, getStatusColor, getCustomerName };
