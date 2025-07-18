'use client';

import React from 'react';
import { Edit, Trash2, Phone, Mail, MapPin, Building } from 'lucide-react';
import { Customer, customerStatusOptions, getCustomerStatusColor } from '@/types/customer';
import { SortDirection } from '@/types/common';
import SortableTableHeader from '@/components/Common/SortableTableHeader/SortableTableHeader';
import styles from './CustomersTable.module.scss';

interface CustomersTableProps {
  customers: Customer[];
  onEdit?: (customer: Customer) => void;
  onDelete?: (customerId: string) => void;
  onCustomerClick?: (customer: Customer) => void;
  showActions?: boolean;
  showCompanyColumn?: boolean;
  currentSortKey?: string;
  currentSortDirection?: SortDirection;
  onSort?: (key: string) => void;
}

const CustomersTable: React.FC<CustomersTableProps> = ({ 
  customers, 
  onEdit, 
  onDelete, 
  onCustomerClick,
  showActions = true,
  showCompanyColumn = false,
  currentSortKey,
  currentSortDirection,
  onSort
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number | null) => {
    return amount ? `$${amount.toLocaleString()}` : '$0';
  };

  const handleCustomerClick = (customer: Customer) => {
    if (onCustomerClick) {
      onCustomerClick(customer);
    }
  };

  const handleSort = (key: string) => {
    if (onSort) {
      onSort(key);
    }
  };

  if (customers.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No customers found.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            {onSort ? (
              <SortableTableHeader
                label="Name"
                sortKey="first_name"
                currentSortKey={currentSortKey}
                currentSortDirection={currentSortDirection}
                onSort={handleSort}
              />
            ) : (
              <th>Name</th>
            )}
            {showCompanyColumn && (
              onSort ? (
                <SortableTableHeader
                  label="Company"
                  sortKey="company"
                  currentSortKey={currentSortKey}
                  currentSortDirection={currentSortDirection}
                  onSort={handleSort}
                />
              ) : (
                <th>Company</th>
              )
            )}
            <th>Contact</th>
            <th>Location</th>
            {onSort ? (
              <SortableTableHeader
                label="Status"
                sortKey="customer_status"
                currentSortKey={currentSortKey}
                currentSortDirection={currentSortDirection}
                onSort={handleSort}
              />
            ) : (
              <th>Status</th>
            )}
            <th>Leads</th>
            <th>Total Value</th>
            {onSort ? (
              <SortableTableHeader
                label="Created"
                sortKey="created_at"
                currentSortKey={currentSortKey}
                currentSortDirection={currentSortDirection}
                onSort={handleSort}
              />
            ) : (
              <th>Created</th>
            )}
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id} className={styles.row}>
              <td>
                <div className={styles.customerInfo}>
                  <button
                    onClick={() => handleCustomerClick(customer)}
                    className={styles.customerName}
                  >
                    <strong>{customer.first_name} {customer.last_name}</strong>
                  </button>
                  {customer.notes && (
                    <div className={styles.notes}>
                      {customer.notes.substring(0, 50)}
                      {customer.notes.length > 50 && '...'}
                    </div>
                  )}
                </div>
              </td>
              {showCompanyColumn && (
                <td>
                  <div className={styles.companyInfo}>
                    <Building size={14} />
                    <span>{customer.company?.name || 'Unknown'}</span>
                  </div>
                </td>
              )}
              <td>
                <div className={styles.contactInfo}>
                  {customer.email && (
                    <div className={styles.contactItem}>
                      <Mail size={12} />
                      <a href={`mailto:${customer.email}`} className={styles.contactLink}>
                        {customer.email}
                      </a>
                    </div>
                  )}
                  {customer.phone && (
                    <div className={styles.contactItem}>
                      <Phone size={12} />
                      <a href={`tel:${customer.phone}`} className={styles.contactLink}>
                        {customer.phone}
                      </a>
                    </div>
                  )}
                </div>
              </td>
              <td>
                <div className={styles.locationInfo}>
                  {(customer.city || customer.state) && (
                    <div className={styles.locationItem}>
                      <MapPin size={12} />
                      <span>
                        {[customer.city, customer.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                  {customer.address && (
                    <div className={styles.address}>
                      {customer.address}
                    </div>
                  )}
                </div>
              </td>
              <td>
                <span 
                  className={styles.statusBadge}
                  style={{ backgroundColor: getCustomerStatusColor(customer.customer_status) }}
                >
                  {customerStatusOptions.find(s => s.value === customer.customer_status)?.label}
                </span>
              </td>
              <td>
                <div className={styles.leadsInfo}>
                  <div className={styles.leadCount}>
                    <strong>{customer.active_leads || 0}</strong> active
                  </div>
                  <div className={styles.totalLeads}>
                    {customer.total_leads || 0} total
                  </div>
                </div>
              </td>
              <td>
                <div className={styles.valueInfo}>
                  {formatCurrency(customer.total_value || 0)}
                </div>
              </td>
              <td>
                <div className={styles.dateInfo}>
                  {formatDate(customer.created_at)}
                </div>
              </td>
              {showActions && (
                <td>
                  <div className={styles.actions}>
                    <button 
                      onClick={() => onEdit?.(customer)}
                      className={styles.editButton}
                      title="Edit customer"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete?.(customer.id)}
                      className={styles.deleteButton}
                      title="Delete customer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default CustomersTable;