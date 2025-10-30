'use client';

import React from 'react';
import { Customer, getCustomerStatusColor, customerStatusOptions } from '@/types/customer';
import { ColumnDefinition, TabDefinition } from '@/components/Common/DataTable';
import { ChevronRight, Mail, Phone, MapPin, Building } from 'lucide-react';
import styles from '@/components/Common/DataTable/DataTable.module.scss';

// Helper functions for data formatting
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

const formatCurrency = (amount: number | null) => {
  return amount ? `$${amount.toLocaleString()}` : '$0';
};

const getCustomerFullName = (customer: Customer): string => {
  return `${customer.first_name} ${customer.last_name}`.trim();
};

const formatCustomerAddress = (customer: Customer): string => {
  const parts = [
    customer.address,
    customer.city,
    customer.state,
    customer.zip_code,
  ].filter(Boolean);

  return parts.join(', ') || 'N/A';
};

// Define columns for customers table
export const getCustomerColumns = (showCompanyColumn: boolean = false): ColumnDefinition<Customer>[] => {
  const columns: ColumnDefinition<Customer>[] = [
    {
      key: 'customer.name',
      title: 'Customer',
      sortable: true,
      sortKey: 'first_name',
      render: (customer: Customer) => (
        <div>
          <strong className={styles.nameCell}>{getCustomerFullName(customer)}</strong>
          <div className={styles.contactInfo}>
            {customer.email && (
              <div className={styles.contactRow}>
                <Mail size={12} />
                {customer.email}
              </div>
            )}
            {customer.phone && (
              <div className={styles.contactRow}>
                <Phone size={12} />
                {customer.phone}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'address',
      title: 'Address',
      sortable: false,
      render: (customer: Customer) => {
        const hasAddress = customer.address || customer.city || customer.state || customer.zip_code;
        return (
          <div>
            {hasAddress ? (
              <>
                {customer.address && (
                  <div className={styles.addressLine}>
                    <MapPin size={14} />
                    <span>{customer.address}</span>
                  </div>
                )}
                {(customer.city || customer.state || customer.zip_code) && (
                  <div className={`${styles.addressLine} ${customer.address ? styles.indented : ''}`}>
                    {!customer.address && <MapPin size={14} />}
                    <span>
                      {[customer.city, customer.state, customer.zip_code].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.contactRow}>
                <MapPin size={14} />
                <span>N/A</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'customer_status',
      title: 'Status',
      sortable: true,
      sortKey: 'customer_status',
      render: (customer: Customer) => (
        <span
          className={styles.statusBadge}
          style={{ color: getCustomerStatusColor(customer.customer_status) }}
        >
          {customerStatusOptions.find(s => s.value === customer.customer_status)?.label || customer.customer_status}
        </span>
      ),
    },
  ];

  // Add company column for admin view
  if (showCompanyColumn) {
    columns.splice(3, 0, {
      key: 'company.name',
      title: 'Company',
      sortable: false,
      render: (customer: Customer) => (
        <div className={styles.contactRow}>
          <Building size={14} />
          <span>{customer.company?.name || 'Unknown Company'}</span>
        </div>
      ),
    });
  }

  // Add activity columns
  columns.push(
    {
      key: 'total_leads',
      title: 'Leads',
      sortable: false,
      render: (customer: Customer) => (
        <span className={styles.activityCell}>
          {customer.total_leads || customer.leads?.length || 0}
        </span>
      ),
    },
    {
      key: 'total_tickets',
      title: 'Tickets',
      sortable: false,
      render: (customer: Customer) => (
        <span className={styles.activityCell}>
          {customer.total_tickets || customer.tickets?.length || 0}
        </span>
      ),
    },
    {
      key: 'total_support_cases',
      title: 'Support Cases',
      sortable: false,
      render: (customer: Customer) => (
        <span className={styles.activityCell}>
          {customer.total_support_cases || 0}
        </span>
      ),
    },
    {
      key: 'created_at',
      title: 'Created',
      sortable: true,
      sortKey: 'created_at',
      render: (customer: Customer) => (
        <span className={styles.dateCell}>
          {formatDate(customer.created_at)}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '',
      sortable: false,
      render: (
        customer: Customer,
        onAction?: (action: string, item: Customer) => void
      ) => (
        <button
          className={styles.actionButton}
          onClick={e => {
            e.stopPropagation();
            onAction?.('view', customer);
          }}
        >
          View Customer
          <ChevronRight size={16} />
        </button>
      ),
    }
  );

  return columns;
};

// Define tabs for customers filtering
export const getCustomerTabs = (tabCounts?: { all: number; active: number; inactive: number; archived: number }): TabDefinition<Customer>[] => [
  {
    key: 'all',
    label: 'All Customers',
    filter: (customers: Customer[]) => customers,
    getCount: (customers: Customer[]) => tabCounts?.all ?? customers.length,
  },
  {
    key: 'active',
    label: 'Active',
    filter: (customers: Customer[]) => customers.filter(customer => customer.customer_status === 'active'),
    getCount: (customers: Customer[]) => tabCounts?.active ?? customers.filter(customer => customer.customer_status === 'active').length,
  },
  {
    key: 'inactive',
    label: 'Inactive',
    filter: (customers: Customer[]) => customers.filter(customer => customer.customer_status === 'inactive'),
    getCount: (customers: Customer[]) => tabCounts?.inactive ?? customers.filter(customer => customer.customer_status === 'inactive').length,
  },
  {
    key: 'archived',
    label: 'Archived',
    filter: (customers: Customer[]) => customers.filter(customer => customer.customer_status === 'archived'),
    getCount: (customers: Customer[]) => tabCounts?.archived ?? customers.filter(customer => customer.customer_status === 'archived').length,
  },
];