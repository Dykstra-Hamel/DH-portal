'use client';

import React, { useState } from 'react';
import { Edit, Trash2, Archive, ArchiveRestore, Calendar, Phone, Mail } from 'lucide-react';
import {
  Lead,
  leadSourceOptions,
  leadTypeOptions,
  leadStatusOptions,
  leadPriorityOptions,
} from '@/types/lead';
import { useRouter } from 'next/navigation';
import styles from './LeadsTable.module.scss';

interface LeadsTableProps {
  leads: Lead[];
  onEdit?: (lead: Lead) => void;
  onDelete?: (leadId: string) => void;
  onArchive?: (leadId: string) => void;
  onUnarchive?: (leadId: string) => void;
  showActions?: boolean;
  showCompanyColumn?: boolean;
  showArchived?: boolean;
  userProfile?: { role?: string };
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  leadName: string;
  type: 'delete' | 'archive' | 'unarchive';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  leadName,
  type,
}) => {
  if (!isOpen) return null;

  const isDelete = type === 'delete';
  const isUnarchive = type === 'unarchive';
  const actionText = isDelete ? 'Delete' : isUnarchive ? 'Restore' : 'Archive';
  const description = isDelete 
    ? 'This action cannot be undone.'
    : isUnarchive
      ? 'It will be restored to the active leads view.'
      : 'It will be hidden from the main view but can be restored later.';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3>{actionText} Lead</h3>
        <p>
          Are you sure you want to {actionText.toLowerCase()} the lead for <strong>{leadName}</strong>?
          {' '}{description}
        </p>
        <div className={styles.modalActions}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={isDelete ? styles.confirmDeleteButton : styles.confirmArchiveButton}
          >
            {actionText} Lead
          </button>
        </div>
      </div>
    </div>
  );
};

const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  showActions = true,
  showCompanyColumn = false,
  showArchived = false,
  userProfile,
}) => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [modalType, setModalType] = useState<'delete' | 'archive' | 'unarchive'>('delete');

  const handleRowClick = (leadId: string, event: React.MouseEvent) => {
    // Don't navigate if clicking on action buttons
    if ((event.target as HTMLElement).closest(`.${styles.actions}`)) {
      return;
    }
    router.push(`/leads/${leadId}`);
  };

  const handleDeleteClick = (lead: Lead) => {
    setSelectedLead(lead);
    setModalType('delete');
    setShowModal(true);
  };

  const handleArchiveClick = (lead: Lead) => {
    setSelectedLead(lead);
    setModalType('archive');
    setShowModal(true);
  };

  const handleUnarchiveClick = (lead: Lead) => {
    setSelectedLead(lead);
    setModalType('unarchive');
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (!selectedLead) return;

    if (modalType === 'delete' && onDelete) {
      onDelete(selectedLead.id);
    } else if (modalType === 'archive' && onArchive) {
      onArchive(selectedLead.id);
    } else if (modalType === 'unarchive' && onUnarchive) {
      onUnarchive(selectedLead.id);
    }

    setShowModal(false);
    setSelectedLead(null);
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedLead(null);
  };

  const getPriorityColor = (priority: string) => {
    const priorityColorMap: { [key: string]: string } = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#dc2626',
    };
    return priorityColorMap[priority] || '#6b7280';
  };

  const formatDate = (dateString: string | null | undefined) => {
    return dateString ? new Date(dateString).toLocaleDateString() : '';
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
            <th>Created</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {leads.map(lead => (
            <tr
              key={lead.id}
              className={styles.clickableRow}
              onClick={e => handleRowClick(lead.id, e)}
            >
              <td>
                <div className={styles.customerInfo}>
                  {lead.customer ? (
                    <div>
                      <strong>
                        {lead.customer.first_name} {lead.customer.last_name}
                      </strong>
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
                    <span className={styles.noCustomer}>
                      No customer linked
                    </span>
                  )}
                </div>
              </td>
              {showCompanyColumn && (
                <td>
                  <div className={styles.companyInfo}>
                    <strong>
                      {(lead as any).company?.name || 'Unknown Company'}
                    </strong>
                  </div>
                </td>
              )}
              <td>
                <span className={styles.sourceBadge}>
                  {
                    leadSourceOptions.find(s => s.value === lead.lead_source)
                      ?.label
                  }
                </span>
              </td>
              <td>
                <span className={styles.typeBadge}>
                  {leadTypeOptions.find(t => t.value === lead.lead_type)?.label}
                </span>
              </td>
              <td>
                <span className={styles.statusBadge}>
                  {
                    leadStatusOptions.find(s => s.value === lead.lead_status)
                      ?.label
                  }
                </span>
              </td>
              <td>
                <span
                  className={styles.priorityBadge}
                  style={{ backgroundColor: getPriorityColor(lead.priority) }}
                >
                  {
                    leadPriorityOptions.find(p => p.value === lead.priority)
                      ?.label
                  }
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
                <div className={styles.dateInfo}>
                  <Calendar size={14} />
                  {formatDate(lead.created_at)}
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
                    {showArchived ? (
                      <button
                        onClick={() => handleUnarchiveClick(lead)}
                        className={styles.archiveButton}
                        title="Restore lead"
                      >
                        <ArchiveRestore size={16} />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleArchiveClick(lead)}
                        className={styles.archiveButton}
                        title="Archive lead"
                      >
                        <Archive size={16} />
                      </button>
                    )}
                    {userProfile?.role === 'admin' && (
                      <button
                        onClick={() => handleDeleteClick(lead)}
                        className={styles.deleteButton}
                        title="Delete lead"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      
      <ConfirmationModal
        isOpen={showModal}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        leadName={
          selectedLead?.customer
            ? `${selectedLead.customer.first_name} ${selectedLead.customer.last_name}`
            : 'this lead'
        }
        type={modalType}
      />
    </div>
  );
};

export default LeadsTable;
