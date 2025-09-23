'use client';

import React from 'react';
import { CallRecord } from '@/types/call-record';
import { ColumnDefinition, TabDefinition } from '@/components/Common/DataTable';
import { ChevronRight } from 'lucide-react';
import styles from '@/components/Common/DataTable/DataTable.module.scss';

// Extended CallRecord interface for the table
interface CallRecordWithDirection extends CallRecord {
  call_direction?: 'inbound' | 'outbound' | 'unknown';
  from_number?: string;
  archived?: boolean;
  billable_duration_seconds?: number;
  leads?: {
    id: string;
    customer_id: string;
    company_id: string;
    customers?: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  customers?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    company_id: string;
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
    hour12: true
  });
};

const formatDuration = (seconds: number) => {
  if (!seconds) return 'N/A';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const formatPhoneNumber = (phone: string | undefined) => {
  if (!phone) return 'N/A';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const number = cleaned.slice(1);
    return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return '#10b981';
    case 'failed':
      return '#ef4444';
    case 'busy':
      return '#f59e0b';
    case 'no-answer':
      return '#6b7280';
    default:
      return '#6b7280';
  }
};

const getSentimentColor = (sentiment: string) => {
  switch (sentiment?.toLowerCase()) {
    case 'positive':
      return '#10b981';
    case 'negative':
      return '#ef4444';
    case 'neutral':
      return '#6b7280';
    default:
      return '#6b7280';
  }
};

const getCustomerName = (call: CallRecordWithDirection): string => {
  const customer = call.leads?.customers || call.customers;
  return customer
    ? `${customer.first_name} ${customer.last_name}`
    : 'Unknown';
};

const getPhoneNumber = (call: CallRecordWithDirection): string => {
  // For outbound calls, show the number that was called (phone_number)
  // For inbound calls, show the caller's number (phone_number or from_number)
  const displayNumber =
    call.call_direction === 'outbound'
      ? call.phone_number // Number that was called
      : call.phone_number || call.from_number; // Caller's number (prefer normalized)
  return formatPhoneNumber(displayNumber || 'N/A');
};

// Define columns for call records table
export const getCallRecordColumns = (): ColumnDefinition<CallRecordWithDirection>[] => [
  {
    key: 'start_timestamp',
    title: 'Date',
    width: '160px',
    sortable: true,
    sortKey: 'start_timestamp',
    render: (call: CallRecordWithDirection) => (
      <span className={styles.timeCell}>
        {call.start_timestamp ? formatDate(call.start_timestamp) : 'N/A'}
      </span>
    ),
  },
  {
    key: 'customer',
    title: 'Customer',
    width: '150px',
    sortable: false,
    render: (call: CallRecordWithDirection) => (
      <strong className={styles.nameCell}>{getCustomerName(call)}</strong>
    ),
  },
  {
    key: 'phone_number',
    title: 'Phone',
    width: '140px',
    sortable: false,
    render: (call: CallRecordWithDirection) => (
      <span className={styles.phoneCell}>
        {getPhoneNumber(call)}
      </span>
    ),
  },
  {
    key: 'call_status',
    title: 'Status',
    width: '80px',
    sortable: true,
    sortKey: 'call_status',
    render: (call: CallRecordWithDirection) => (
      <span
        className={styles.statusBadge}
        style={{
          color: getStatusColor(call.call_status),
        }}
      >
        {call.call_status || 'Unknown'}
      </span>
    ),
  },
  {
    key: 'duration_seconds',
    title: 'Duration',
    width: '80px',
    sortable: true,
    sortKey: 'duration_seconds',
    render: (call: CallRecordWithDirection) => (
      <span className={styles.durationCell}>
        {call.duration_seconds ? formatDuration(call.duration_seconds) : 'N/A'}
      </span>
    ),
  },
  {
    key: 'sentiment',
    title: 'Sentiment',
    width: '100px',
    sortable: true,
    sortKey: 'sentiment',
    render: (call: CallRecordWithDirection) => (
      <span
        className={styles.sentimentBadge}
        style={{ color: getSentimentColor(call.sentiment || 'neutral') }}
      >
        {call.sentiment || 'N/A'}
      </span>
    ),
  },
  {
    key: 'call_direction',
    title: 'Direction',
    width: '80px',
    sortable: true,
    sortKey: 'call_direction',
    render: (call: CallRecordWithDirection) => (
      <span
        className={styles.directionBadge}
        style={{
          color:
            call.call_direction === 'inbound'
              ? '#10b981'
              : call.call_direction === 'outbound'
                ? '#3b82f6'
                : '#6b7280',
          fontWeight: '500',
        }}
      >
        {call.call_direction === 'inbound'
          ? 'Inbound'
          : call.call_direction === 'outbound'
            ? 'Outbound'
            : 'Unknown'}
      </span>
    ),
  },
  {
    key: 'actions',
    title: '',
    width: '140px',
    sortable: false,
    render: (
      call: CallRecordWithDirection,
      onAction?: (action: string, item: CallRecordWithDirection) => void
    ) => (
      <button
        className={styles.actionButton}
        onClick={e => {
          e.stopPropagation();
          onAction?.('view_details', call);
        }}
      >
        View Details
        <ChevronRight size={16} />
      </button>
    ),
  },
];

// Define tabs for call records filtering - simplified as requested
export const getCallRecordTabs = (): TabDefinition<CallRecordWithDirection>[] => [
  {
    key: 'all',
    label: 'All Calls',
    filter: (calls: CallRecordWithDirection[]) => calls.filter(call => !call.archived),
    getCount: (calls: CallRecordWithDirection[]) => calls.filter(call => !call.archived).length,
  },
  {
    key: 'inbound',
    label: 'Inbound',
    filter: (calls: CallRecordWithDirection[]) =>
      calls.filter(call => !call.archived && call.call_direction === 'inbound'),
    getCount: (calls: CallRecordWithDirection[]) =>
      calls.filter(call => !call.archived && call.call_direction === 'inbound').length,
  },
  {
    key: 'outbound',
    label: 'Outbound',
    filter: (calls: CallRecordWithDirection[]) =>
      calls.filter(call => !call.archived && call.call_direction === 'outbound'),
    getCount: (calls: CallRecordWithDirection[]) =>
      calls.filter(call => !call.archived && call.call_direction === 'outbound').length,
  },
];

export type { CallRecordWithDirection };