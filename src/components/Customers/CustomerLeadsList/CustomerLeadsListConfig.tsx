'use client';

import React from 'react';
import { Lead } from '@/types/lead';
import { ColumnDefinition } from '@/components/Common/DataTable';
import { ChevronRight } from 'lucide-react';
import styles from '@/components/Common/DataTable/DataTable.module.scss';

// Helper functions for data formatting
const formatLeadStatus = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    unassigned: 'Unassigned',
    contacting: 'Contacting',
    quoted: 'Quoted',
    ready_to_schedule: 'Ready to Schedule',
    scheduled: 'Scheduled',
    won: 'Won',
    lost: 'Lost',
  };
  return statusMap[status] || status;
};

const formatLeadSource = (source: string): string => {
  const sourceMap: { [key: string]: string } = {
    organic: 'Organic',
    referral: 'Referral',
    google_cpc: 'Google Ads',
    facebook_ads: 'Facebook',
    linkedin: 'LinkedIn',
    email_campaign: 'Email',
    cold_call: 'Cold Call',
    trade_show: 'Trade Show',
    webinar: 'Webinar',
    content_marketing: 'Content',
    widget_submission: 'Widget',
    other: 'Other',
  };
  return sourceMap[source] || source;
};

const formatPriority = (priority: string): string => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

const formatEstimatedValue = (value?: number): string => {
  if (!value) return 'N/A';
  return `$${value.toLocaleString()}`;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

// Define columns for customer leads table
export const getCustomerLeadColumns = (): ColumnDefinition<Lead>[] => [
  {
    key: 'lead_status',
    title: 'Status',
    sortKey: 'lead_status',
    render: (lead: Lead) => (
      <div className={`${styles.statusCell} ${styles[lead.lead_status]}`}>
        {formatLeadStatus(lead.lead_status)}
      </div>
    ),
  },
  {
    key: 'priority',
    title: 'Priority',
    sortKey: 'priority',
    render: (lead: Lead) => (
      <div className={`${styles.priorityCell} ${styles[lead.priority]}`}>
        {formatPriority(lead.priority)}
      </div>
    ),
  },
  {
    key: 'lead_source',
    title: 'Source',
    sortKey: 'lead_source',
    render: (lead: Lead) => (
      <div className={styles.sourceCell}>{formatLeadSource(lead.lead_source)}</div>
    ),
  },
  {
    key: 'service_type',
    title: 'Service',
    sortKey: 'service_type',
    render: (lead: Lead) => (
      <div className={styles.serviceCell}>
        {lead.service_type || 'N/A'}
      </div>
    ),
  },
  {
    key: 'estimated_value',
    title: 'Est. Value',
    sortKey: 'estimated_value',
    render: (lead: Lead) => (
      <div className={styles.valueCell}>
        {formatEstimatedValue(lead.estimated_value)}
      </div>
    ),
  },
  {
    key: 'created_at',
    title: 'Created',
    sortKey: 'created_at',
    render: (lead: Lead) => (
      <div className={styles.dateCell}>{formatDate(lead.created_at)}</div>
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
