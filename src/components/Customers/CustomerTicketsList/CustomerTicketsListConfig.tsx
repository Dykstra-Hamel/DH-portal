'use client';

import React from 'react';
import { Ticket } from '@/types/ticket';
import { ColumnDefinition } from '@/components/Common/DataTable';
import { ChevronRight } from 'lucide-react';
import styles from '@/components/Common/DataTable/DataTable.module.scss';

// Helper functions for data formatting
const formatTimeInQueue = (createdAt: string): string => {
  const now = new Date().getTime();
  const created = new Date(createdAt).getTime();
  const diffMs = now - created;

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  } else if (diffHours < 24) {
    const remainingMinutes = diffMinutes % 60;
    return `${diffHours}h ${remainingMinutes}m`;
  } else {
    return `${diffDays}d`;
  }
};

const formatTicketType = (type: string): string => {
  const typeMap: { [key: string]: string } = {
    phone_call: 'Call',
    web_form: 'Form',
    email: 'Email',
    chat: 'Chat',
    social_media: 'Social',
    in_person: 'In Person',
    internal_task: 'Internal',
    bug_report: 'Bug',
    feature_request: 'Feature',
    other: 'Other',
  };
  return typeMap[type] || type;
};

const formatSource = (source: string): string => {
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
    internal: 'Internal',
    other: 'Other',
  };
  return sourceMap[source] || source;
};

const formatServiceType = (serviceType: string): string => {
  const serviceTypeMap: { [key: string]: string } = {
    'Customer Service': 'Support',
    'customer service': 'Support',
    customer_service: 'Support',
  };
  return serviceTypeMap[serviceType] || serviceType;
};

// Define columns for customer tickets table
export const getCustomerTicketColumns = (): ColumnDefinition<Ticket>[] => [
  {
    key: 'time_in_queue',
    title: 'In Queue',
    sortKey: 'created_at',
    render: (ticket: Ticket) => (
      <div className={styles.timeCell}>{formatTimeInQueue(ticket.created_at)}</div>
    ),
  },
  {
    key: 'source',
    title: 'Source',
    sortKey: 'source',
    render: (ticket: Ticket) => (
      <div className={styles.sourceCell}>{formatSource(ticket.source)}</div>
    ),
  },
  {
    key: 'type',
    title: 'Format',
    sortKey: 'type',
    render: (ticket: Ticket) => (
      <div className={styles.typeCell}>{formatTicketType(ticket.type)}</div>
    ),
  },
  {
    key: 'service_type',
    title: 'Ticket Type',
    sortKey: 'service_type',
    render: (ticket: Ticket) => (
      <div className={styles.serviceCell}>
        {ticket.service_type ? formatServiceType(ticket.service_type) : 'N/A'}
      </div>
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
