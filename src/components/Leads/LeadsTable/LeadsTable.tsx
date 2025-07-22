'use client';

import React from 'react';
import { Edit, Trash2, Calendar, User, Phone, Mail } from 'lucide-react';
import { Lead, leadSourceOptions, leadTypeOptions, leadStatusOptions, leadPriorityOptions } from '@/types/lead';
import { useRouter } from 'next/navigation';
import styles from './LeadsTable.module.scss';

interface LeadsTableProps {
  leads: Lead[];
  onEdit?: (lead: Lead) => void;
  onDelete?: (leadId: string) => void;
  showActions?: boolean;
  showCompanyColumn?: boolean;
}

const LeadsTable: React.FC<LeadsTableProps> = ({ 
  leads, 
  onEdit, 
  onDelete, 
  showActions = true,
  showCompanyColumn = false 
}) => {
  const router = useRouter();
  
  const handleRowClick = (leadId: string, event: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    if ((event.target as HTMLElement).closest(`.${styles.actions}`)) {
      return;
    }
    router.push(`/leads/${leadId}`);
  };
  const getStatusColor = (status: string) => {
    const statusColorMap: { [key: string]: string } = {
      'new': '#3b82f6',
      'contacted': '#f59e0b',
      'qualified': '#06b6d4',
      'quoted': '#8b5cf6',
      'won': '#10b981',
      'lost': '#ef4444',
      'unqualified': '#6b7280'
    };
    return statusColorMap[status] || '#6b7280';
  };

  const getPriorityColor = (priority: string) => {
    const priorityColorMap: { [key: string]: string } = {
      'low': '#10b981',
      'medium': '#f59e0b',
      'high': '#ef4444',
      'urgent': '#dc2626'
    };
    return priorityColorMap[priority] || '#6b7280';
  };

  const formatDate = (dateString: string | null | undefined) => {
    return dateString ? new Date(dateString).toLocaleDateString() : '';
  };

  const formatCurrency = (amount: number | null | undefined) => {
    return amount ? `$${amount.toLocaleString()}` : '';
  };

  if (leads.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No leads found. Create your first lead to get started.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Customer</th>
            {showCompanyColumn && <th>Company</th>}
            <th>Source</th>
            <th>Type</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Service</th>
            <th>Assigned To</th>
            <th>Value</th>
            <th>Created</th>
            <th>Next Follow-up</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr 
              key={lead.id} 
              className={styles.clickableRow}
              onClick={(e) => handleRowClick(lead.id, e)}
            >
              <td>
                <div className={styles.customerInfo}>
                  {lead.customer ? (
                    <div>
                      <strong>{lead.customer.first_name} {lead.customer.last_name}</strong>
                      {lead.customer.email && (
                        <div className={styles.contactInfo}>
                          <Mail size={12} />
                          {lead.customer.email}
                        </div>
                      )}
                      {lead.customer.phone && (
                        <div className={styles.contactInfo}>
                          <Phone size={12} />
                          {lead.customer.phone}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className={styles.noCustomer}>No customer linked</span>
                  )}
                </div>
              </td>
              {showCompanyColumn && (
                <td>
                  <div className={styles.companyInfo}>
                    <strong>{(lead as any).company?.name || 'Unknown Company'}</strong>
                  </div>
                </td>
              )}
              <td>
                <span className={styles.sourceBadge}>
                  {leadSourceOptions.find(s => s.value === lead.lead_source)?.label}
                </span>
              </td>
              <td>
                <span className={styles.typeBadge}>
                  {leadTypeOptions.find(t => t.value === lead.lead_type)?.label}
                </span>
              </td>
              <td>
                <span 
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(lead.lead_status) }}
                >
                  {leadStatusOptions.find(s => s.value === lead.lead_status)?.label}
                </span>
              </td>
              <td>
                <span 
                  className={styles.priorityBadge}
                  style={{ backgroundColor: getPriorityColor(lead.priority) }}
                >
                  {leadPriorityOptions.find(p => p.value === lead.priority)?.label}
                </span>
              </td>
              <td>
                <div className={styles.serviceInfo}>
                  {lead.service_type || 'Not specified'}
                  {lead.comments && (
                    <div className={styles.comments}>
                      {lead.comments.substring(0, 50)}
                      {lead.comments.length > 50 && '...'}
                    </div>
                  )}
                </div>
              </td>
              <td>
                {lead.assigned_user ? (
                  <div className={styles.userInfo}>
                    <User size={14} />
                    {lead.assigned_user.first_name} {lead.assigned_user.last_name}
                  </div>
                ) : (
                  <span className={styles.unassigned}>Unassigned</span>
                )}
              </td>
              <td>
                <div className={styles.valueInfo}>
                  {lead.estimated_value ? (
                    formatCurrency(lead.estimated_value)
                  ) : (
                    <span className={styles.noValue}>—</span>
                  )}
                </div>
              </td>
              <td>
                <div className={styles.dateInfo}>
                  <Calendar size={14} />
                  {formatDate(lead.created_at)}
                </div>
              </td>
              <td>
                <div className={styles.dateInfo}>
                  <Calendar size={14} />
                  {formatDate(lead.next_follow_up_at)}
                </div>
              </td>
              {showActions && (
                <td>
                  <div className={styles.actions}>
                    <button 
                      onClick={() => onEdit?.(lead)}
                      className={styles.editButton}
                      title="Edit lead"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => onDelete?.(lead.id)}
                      className={styles.deleteButton}
                      title="Delete lead"
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

export default LeadsTable;