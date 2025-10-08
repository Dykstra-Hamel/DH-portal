'use client';

import React from 'react';
import { Ticket } from '@/types/ticket';
import { CallRecord } from '@/types/call-record';
import { ColumnDefinition, TabDefinition } from '@/components/Common/DataTable';
import { ChevronRight } from 'lucide-react';
import { getCustomerDisplayName, getPhoneDisplay } from '@/lib/display-utils';
import { MiniAvatar } from '@/components/Common/MiniAvatar';
import styles from '@/components/Common/DataTable/DataTable.module.scss';

// Helper functions for data formatting (moved from TicketRow)
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

const formatCustomerName = (ticket: Ticket): string => {
  return getCustomerDisplayName(ticket.customer);
};

const formatPhone = (phone?: string): string => {
  return getPhoneDisplay(phone);
};

const formatAddress = (ticket: Ticket): string => {
  if (!ticket.customer) return 'Unknown';

  const customer = ticket.customer;

  // Build address from components, filtering out "none" values
  const parts = [customer.city, customer.state, customer.zip_code]
    .filter(Boolean)
    .map(part => part?.trim())
    .filter(part => part && part.toLowerCase() !== 'none');

  return parts.length > 0 ? parts.join(', ') : 'Unknown';
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

const formatSource = (ticket: Ticket): string => {
  // For phone calls, show call direction
  if (ticket.type === 'phone_call') {
    if (ticket.call_direction === 'inbound') {
      return 'Inbound';
    } else if (ticket.call_direction === 'outbound') {
      return 'Outbound';
    }
  }

  // For web forms, show "Widget"
  if (ticket.type === 'web_form') {
    return 'Widget';
  }

  // For other types, use the source mapping
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
  return sourceMap[ticket.source] || ticket.source;
};

const formatServiceType = (serviceType: string): string => {
  const serviceTypeMap: { [key: string]: string } = {
    'Customer Service': 'Support',
    'customer service': 'Support',
    customer_service: 'Support',
  };
  return serviceTypeMap[serviceType] || serviceType;
};

// Define columns for tickets table
export const getTicketColumns = (
  reviewStatuses?: Map<
    string,
    {
      reviewedBy: string;
      reviewedByName?: string;
      reviewedByEmail?: string;
      reviewedByFirstName?: string;
      reviewedByLastName?: string;
      expiresAt: string;
    }
  >
): ColumnDefinition<Ticket>[] => [
  {
    key: 'created_at',
    title: 'In Queue',
    width: '120px',
    sortable: true,
    sortKey: 'created_at',
    render: (ticket: Ticket) => (
      <span className={styles.timeCell}>
        {formatTimeInQueue(ticket.created_at)}
      </span>
    ),
  },
  {
    key: 'customer.name',
    title: 'Name',
    width: '180px',
    sortable: false,
    render: (ticket: Ticket) => (
      <span className={styles.nameCell}>{formatCustomerName(ticket)}</span>
    ),
  },
  {
    key: 'customer.phone',
    title: 'Phone',
    width: '140px',
    sortable: false,
    render: (ticket: Ticket) => (
      <span className={styles.phoneCell}>
        {formatPhone(ticket.customer?.phone)}
      </span>
    ),
  },
  {
    key: 'customer.address',
    title: 'Address',
    width: '250px',
    sortable: false,
    render: (ticket: Ticket) => (
      <span className={styles.addressCell}>{formatAddress(ticket)}</span>
    ),
  },
  {
    key: 'type',
    title: 'Format',
    width: '100px',
    sortable: true,
    sortKey: 'type',
    render: (ticket: Ticket) => (
      <div className={styles.formatCell}>
        {ticket.type === 'phone_call' && (
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
        {ticket.type === 'web_form' && (
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
        {formatTicketType(ticket.type)}
      </div>
    ),
  },
  {
    key: 'source',
    title: 'Source',
    width: '120px',
    sortable: true,
    sortKey: 'source',
    render: (ticket: Ticket) => (
      <span className={styles.sourceCell}>{formatSource(ticket)}</span>
    ),
  },
  {
    key: 'service_type',
    title: 'Ticket Type',
    width: '150px',
    sortable: true,
    sortKey: 'service_type',
    render: (ticket: Ticket) => (
      <div className={styles.serviceTypeCell}>
        {ticket.service_type === 'Sales' && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="19"
            viewBox="0 0 18 19"
            fill="none"
            className={styles.salesIcon}
          >
            <path
              d="M9 4.04004V15.04M6.25 12.4569L7.05575 13.061C8.12917 13.8667 9.86992 13.8667 10.9442 13.061C12.0186 12.2552 12.0186 10.9499 10.9442 10.1441C10.408 9.74079 9.704 9.54004 9 9.54004C8.33542 9.54004 7.67083 9.33837 7.16392 8.93596C6.15008 8.13021 6.15008 6.82487 7.16392 6.01912C8.17775 5.21337 9.82225 5.21337 10.8361 6.01912L11.2165 6.32162M17.25 9.54004C17.25 10.6234 17.0366 11.6962 16.622 12.6972C16.2074 13.6981 15.5997 14.6076 14.8336 15.3737C14.0675 16.1398 13.1581 16.7474 12.1571 17.162C11.1562 17.5766 10.0834 17.79 9 17.79C7.91659 17.79 6.8438 17.5766 5.84286 17.162C4.84193 16.7474 3.93245 16.1398 3.16637 15.3737C2.40029 14.6076 1.7926 13.6981 1.37799 12.6972C0.963392 11.6962 0.75 10.6234 0.75 9.54004C0.75 7.352 1.61919 5.25358 3.16637 3.70641C4.71354 2.15923 6.81196 1.29004 9 1.29004C11.188 1.29004 13.2865 2.15923 14.8336 3.70641C16.3808 5.25358 17.25 7.352 17.25 9.54004Z"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {ticket.service_type &&
          [
            'Customer Service',
            'customer service',
            'customer_service',
            'Support',
          ].includes(ticket.service_type) && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className={styles.supportIcon}
            >
              <g clipPath="url(#clip0_1553_33225)">
                <path
                  d="M3.28671 3.28671L6.11337 6.11337M9.88671 6.11337L12.7134 3.28671M9.88671 9.88671L12.7134 12.7134M6.11337 9.88671L3.28671 12.7134M14.6667 8.00004C14.6667 11.6819 11.6819 14.6667 8.00004 14.6667C4.31814 14.6667 1.33337 11.6819 1.33337 8.00004C1.33337 4.31814 4.31814 1.33337 8.00004 1.33337C11.6819 1.33337 14.6667 4.31814 14.6667 8.00004ZM10.6667 8.00004C10.6667 9.4728 9.4728 10.6667 8.00004 10.6667C6.52728 10.6667 5.33337 9.4728 5.33337 8.00004C5.33337 6.52728 6.52728 5.33337 8.00004 5.33337C9.4728 5.33337 10.6667 6.52728 10.6667 8.00004Z"
                  stroke="#0087F5"
                  strokeWidth="1.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
              <defs>
                <clipPath id="clip0_1553_33225">
                  <rect width="16" height="16" fill="white" />
                </clipPath>
              </defs>
            </svg>
          )}
        {formatServiceType(ticket.service_type || '')}
      </div>
    ),
  },
  {
    key: 'actions',
    title: '',
    width: '150px',
    sortable: false,
    render: (
      ticket: Ticket,
      onAction?: (action: string, item: Ticket) => void
    ) => {
      const reviewStatus = reviewStatuses?.get(ticket.id);
      // Check if being reviewed - avoid creating new Date on every render
      const isBeingReviewed = reviewStatus
        ? Date.now() < new Date(reviewStatus.expiresAt).getTime()
        : false;

      if (isBeingReviewed && reviewStatus) {
        // Show "Reviewing" status with avatar
        return (
          <div className={styles.reviewingStatus}>
            <span className={styles.reviewingText}>Reviewing</span>
            <MiniAvatar
              firstName={reviewStatus.reviewedByFirstName}
              lastName={reviewStatus.reviewedByLastName}
              email={reviewStatus.reviewedByEmail || ''}
              size="small"
              showTooltip={true}
            />
          </div>
        );
      }

      // Show normal "Review Ticket" button
      return (
        <button
          className={styles.actionButton}
          onClick={e => {
            e.stopPropagation();
            onAction?.('qualify', ticket);
          }}
        >
          Review Ticket
          <ChevronRight size={18} />
        </button>
      );
    },
  },
];

// Define tabs for tickets filtering
export const getTicketTabs = (
  callRecords: CallRecord[] = []
): TabDefinition<Ticket>[] => [
  {
    key: 'all',
    label: 'All Tickets',
    filter: (tickets: Ticket[]) =>
      tickets.filter(ticket => ticket.status !== 'live' && !ticket.archived),
    getCount: (tickets: Ticket[]) =>
      tickets.filter(ticket => ticket.status !== 'live' && !ticket.archived)
        .length,
  },
  {
    key: 'incoming_calls',
    label: 'Incoming Calls',
    filter: (tickets: Ticket[]) =>
      tickets.filter(
        ticket =>
          ticket.status !== 'live' &&
          !ticket.archived &&
          ticket.type === 'phone_call' &&
          ticket.call_direction === 'inbound'
      ),
    getCount: (tickets: Ticket[]) =>
      tickets.filter(
        ticket =>
          ticket.status !== 'live' &&
          !ticket.archived &&
          ticket.type === 'phone_call' &&
          ticket.call_direction === 'inbound'
      ).length,
  },
  {
    key: 'outbound_calls',
    label: 'Outbound Calls',
    filter: (tickets: Ticket[]) =>
      tickets.filter(
        ticket =>
          ticket.status !== 'live' &&
          !ticket.archived &&
          ticket.type === 'phone_call' &&
          ticket.call_direction === 'outbound'
      ),
    getCount: (tickets: Ticket[]) =>
      tickets.filter(
        ticket =>
          ticket.status !== 'live' &&
          !ticket.archived &&
          ticket.type === 'phone_call' &&
          ticket.call_direction === 'outbound'
      ).length,
  },
  {
    key: 'forms',
    label: 'Forms',
    filter: (tickets: Ticket[]) =>
      tickets.filter(
        ticket =>
          ticket.status !== 'live' &&
          !ticket.archived &&
          ticket.type === 'web_form'
      ),
    getCount: (tickets: Ticket[]) =>
      tickets.filter(
        ticket =>
          ticket.status !== 'live' &&
          !ticket.archived &&
          ticket.type === 'web_form'
      ).length,
  },
];
