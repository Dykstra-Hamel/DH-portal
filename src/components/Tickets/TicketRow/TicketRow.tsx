'use client';

import React from 'react';
import { LifeBuoy } from 'lucide-react';
import { Ticket } from '@/types/ticket';
import styles from './TicketRow.module.scss';

interface TicketRowProps {
  ticket: Ticket;
  onClick?: (ticket: Ticket) => void;
  onQualify?: (ticket: Ticket) => void;
}

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

const formatCustomerName = (ticket: Ticket): string => {
  if (!ticket.customer) return 'N/A';
  const firstName = ticket.customer.first_name || '';
  const lastName = ticket.customer.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName || 'N/A';
};

const formatPhone = (phone?: string): string => {
  if (!phone) return 'N/A';
  
  // Basic phone formatting (adjust as needed)
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  } else if (cleaned.length === 11 && cleaned[0] === '1') {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  return phone;
};

const formatAddress = (ticket: Ticket): string => {
  if (!ticket.customer) return 'N/A';
  
  const parts = [
    ticket.customer.city,
    ticket.customer.state,
    ticket.customer.zip_code
  ].filter(Boolean);
  
  return parts.length > 0 ? parts.join(', ') : 'N/A';
};

const formatTicketType = (type: string): string => {
  const typeMap: { [key: string]: string } = {
    'phone_call': 'Call',
    'web_form': 'Form',
    'email': 'Email',
    'chat': 'Chat',
    'social_media': 'Social',
    'in_person': 'In Person',
    'internal_task': 'Internal',
    'bug_report': 'Bug',
    'feature_request': 'Feature',
    'other': 'Other'
  };
  return typeMap[type] || type;
};

const formatSource = (source: string): string => {
  const sourceMap: { [key: string]: string } = {
    'organic': 'Organic',
    'referral': 'Referral',
    'google_cpc': 'Google Ads',
    'facebook_ads': 'Facebook',
    'linkedin': 'LinkedIn',
    'email_campaign': 'Email',
    'cold_call': 'Cold Call',
    'trade_show': 'Trade Show',
    'webinar': 'Webinar',
    'content_marketing': 'Content',
    'internal': 'Internal',
    'other': 'Other'
  };
  return sourceMap[source] || source;
};

const formatServiceType = (serviceType: string): string => {
  const serviceTypeMap: { [key: string]: string } = {
    'Customer Service': 'Support',
    'customer service': 'Support',
    'customer_service': 'Support'
  };
  return serviceTypeMap[serviceType] || serviceType;
};

export default function TicketRow({ ticket, onClick, onQualify }: TicketRowProps) {
  const handleClick = () => {
    // Row click should open qualify modal
    onQualify?.(ticket);
    onClick?.(ticket);
  };

  const handleQualifyClick = (e: React.MouseEvent) => {
    // Button click should also open qualify modal (same as row click)
    onQualify?.(ticket);
    onClick?.(ticket);
  };

  return (
    <div className={styles.ticketRow} onClick={handleClick}>
      <div className={`${styles.cell} ${styles.inQueue}`}>
        {formatTimeInQueue(ticket.created_at)}
      </div>
      
      <div className={`${styles.cell} ${styles.name}`}>
        {formatCustomerName(ticket)}
      </div>
      
      <div className={`${styles.cell} ${styles.phone}`}>
        {formatPhone(ticket.customer?.phone)}
      </div>
      
      <div className={`${styles.cell} ${styles.address}`}>
        {formatAddress(ticket)}
      </div>
      
      <div className={`${styles.cell} ${styles.format}`}>
        {ticket.type === 'phone_call' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="19" viewBox="0 0 18 19" fill="none">
            <path d="M10.374 13.0652C10.5289 13.1363 10.7034 13.1525 10.8688 13.1112C11.0341 13.0699 11.1805 12.9735 11.2838 12.8379L11.55 12.4892C11.6897 12.3029 11.8709 12.1517 12.0792 12.0475C12.2875 11.9434 12.5171 11.8892 12.75 11.8892H15C15.3978 11.8892 15.7794 12.0472 16.0607 12.3285C16.342 12.6098 16.5 12.9913 16.5 13.3892V15.6392C16.5 16.037 16.342 16.4185 16.0607 16.6998C15.7794 16.9811 15.3978 17.1392 15 17.1392C11.4196 17.1392 7.9858 15.7168 5.45406 13.1851C2.92232 10.6534 1.5 7.21958 1.5 3.63916C1.5 3.24134 1.65804 2.8598 1.93934 2.5785C2.22064 2.2972 2.60218 2.13916 3 2.13916H5.25C5.64782 2.13916 6.02936 2.2972 6.31066 2.5785C6.59196 2.8598 6.75 3.24134 6.75 3.63916V5.88916C6.75 6.12203 6.69578 6.3517 6.59164 6.55998C6.4875 6.76826 6.33629 6.94944 6.15 7.08916L5.799 7.35241C5.66131 7.45754 5.56426 7.6071 5.52434 7.77567C5.48442 7.94425 5.50409 8.12144 5.58 8.27716C6.60501 10.3591 8.29082 12.0428 10.374 13.0652Z" stroke="#0088CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {ticket.type === 'web_form' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="19" viewBox="0 0 18 19" fill="none">
            <path d="M9 15.6392H8.25C7.85218 15.6392 7.47064 15.4811 7.18934 15.1998C6.90804 14.9185 6.75 14.537 6.75 14.1392M6.75 14.1392C6.75 14.537 6.59196 14.9185 6.31066 15.1998C6.02936 15.4811 5.64782 15.6392 5.25 15.6392H4.5M6.75 14.1392V5.13916M9.75 6.63916H15C15.3978 6.63916 15.7794 6.7972 16.0607 7.0785C16.342 7.3598 16.5 7.74134 16.5 8.13916V11.1392C16.5 11.537 16.342 11.9185 16.0607 12.1998C15.7794 12.4811 15.3978 12.6392 15 12.6392H9.75M3.75 12.6392H3C2.60218 12.6392 2.22064 12.4811 1.93934 12.1998C1.65804 11.9185 1.5 11.537 1.5 11.1392V8.13916C1.5 7.74134 1.65804 7.3598 1.93934 7.0785C2.22064 6.7972 2.60218 6.63916 3 6.63916H3.75M4.5 3.63916H5.25C5.64782 3.63916 6.02936 3.7972 6.31066 4.0785C6.59196 4.3598 6.75 4.74134 6.75 5.13916M6.75 5.13916C6.75 4.74134 6.90804 4.3598 7.18934 4.0785C7.47064 3.7972 7.85218 3.63916 8.25 3.63916H9" stroke="#0088CC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {formatTicketType(ticket.type)}
      </div>
      
      <div className={`${styles.cell} ${styles.source}`}>
        {formatSource(ticket.source)}
      </div>
      
      <div className={`${styles.cell} ${styles.ticketType}`}>
        {ticket.service_type === 'Sales' && (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="19" viewBox="0 0 18 19" fill="none" className={styles.salesIcon}>
            <path d="M9 4.04004V15.04M6.25 12.4569L7.05575 13.061C8.12917 13.8667 9.86992 13.8667 10.9442 13.061C12.0186 12.2552 12.0186 10.9499 10.9442 10.1441C10.408 9.74079 9.704 9.54004 9 9.54004C8.33542 9.54004 7.67083 9.33837 7.16392 8.93596C6.15008 8.13021 6.15008 6.82487 7.16392 6.01912C8.17775 5.21337 9.82225 5.21337 10.8361 6.01912L11.2165 6.32162M17.25 9.54004C17.25 10.6234 17.0366 11.6962 16.622 12.6972C16.2074 13.6981 15.5997 14.6076 14.8336 15.3737C14.0675 16.1398 13.1581 16.7474 12.1571 17.162C11.1562 17.5766 10.0834 17.79 9 17.79C7.91659 17.79 6.8438 17.5766 5.84286 17.162C4.84193 16.7474 3.93245 16.1398 3.16637 15.3737C2.40029 14.6076 1.7926 13.6981 1.37799 12.6972C0.963392 11.6962 0.75 10.6234 0.75 9.54004C0.75 7.352 1.61919 5.25358 3.16637 3.70641C4.71354 2.15923 6.81196 1.29004 9 1.29004C11.188 1.29004 13.2865 2.15923 14.8336 3.70641C16.3808 5.25358 17.25 7.352 17.25 9.54004Z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
        {ticket.service_type === 'Customer Service' && (
          <LifeBuoy size={18} className={styles.supportIcon} />
        )}
        {ticket.service_type ? formatServiceType(ticket.service_type) : 'N/A'}
      </div>
      
      <button 
        className={`${styles.cell} ${styles.qualifyButton}`}
        onClick={handleQualifyClick}
      >
        Review Ticket
      </button>
    </div>
  );
}