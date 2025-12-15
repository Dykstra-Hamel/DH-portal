'use client';

import React, { useState } from 'react';
import {
  Edit,
  Trash2,
  Archive,
  ArchiveRestore,
  Calendar,
  Phone,
  Mail,
  ArrowRight,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react';
import {
  Ticket,
  ticketSourceOptions,
  ticketTypeOptions,
  ticketStatusOptions,
  ticketPriorityOptions,
} from '@/types/ticket';
import { getTimeAgo, hasLiveCall } from '@/lib/time-utils';
import { useRouter } from 'next/navigation';
import styles from './TicketsTable.module.scss';
import { TicketReviewModal } from '../TicketReviewModal';

interface TicketsTableProps {
  tickets: Ticket[];
  onEdit?: (ticket: Ticket) => void;
  onDelete?: (ticketId: string) => void;
  onArchive?: (ticketId: string) => void;
  onUnarchive?: (ticketId: string) => void;
  onTicketUpdated?: () => void; // Callback for refreshing data after conversion
  showActions?: boolean;
  showCompanyColumn?: boolean;
  showArchived?: boolean;
  userProfile?: { role?: string };
}

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  ticketDescription: string;
  type: 'delete' | 'archive' | 'unarchive';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  ticketDescription,
  type,
}) => {
  if (!isOpen) return null;

  const isDelete = type === 'delete';
  const isUnarchive = type === 'unarchive';
  const actionText = isDelete ? 'Delete' : isUnarchive ? 'Restore' : 'Archive';
  const description = isDelete
    ? 'This action cannot be undone.'
    : isUnarchive
      ? 'It will be restored to the active tickets view.'
      : 'It will be hidden from the main view but can be restored later.';

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h3>{actionText} Ticket</h3>
        <p>
          Are you sure you want to {actionText.toLowerCase()} this ticket?
          {ticketDescription && (
            <>
              <br />
              <strong>Description:</strong> {ticketDescription}
            </>
          )}
          <br />
          {description}
        </p>
        <div className={styles.modalActions}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={
              isDelete
                ? styles.confirmDeleteButton
                : styles.confirmArchiveButton
            }
          >
            {actionText} Ticket
          </button>
        </div>
      </div>
    </div>
  );
};

const TicketsTable: React.FC<TicketsTableProps> = ({
  tickets,
  onEdit,
  onDelete,
  onArchive,
  onUnarchive,
  onTicketUpdated,
  showActions = true,
  showCompanyColumn = false,
  showArchived = false,
  userProfile,
}) => {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [modalType, setModalType] = useState<
    'delete' | 'archive' | 'unarchive'
  >('delete');
  const [showQualifyModal, setShowQualifyModal] = useState(false);
  const [qualifyingTicket, setQualifyingTicket] = useState<Ticket | null>(null);
  const [isQualifying, setIsQualifying] = useState(false);
  const [expandedTickets, setExpandedTickets] = useState<Set<string>>(
    new Set()
  );

  const handleRowClick = (ticketId: string, event: React.MouseEvent) => {
    // Don't toggle expansion if clicking on action buttons
    if ((event.target as HTMLElement).closest(`.${styles.actions}`)) {
      return;
    }

    const newExpandedTickets = new Set(expandedTickets);
    if (expandedTickets.has(ticketId)) {
      newExpandedTickets.delete(ticketId);
    } else {
      newExpandedTickets.add(ticketId);
    }
    setExpandedTickets(newExpandedTickets);
  };

  const handleDeleteClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setModalType('delete');
    setShowModal(true);
  };

  const handleArchiveClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setModalType('archive');
    setShowModal(true);
  };

  const handleUnarchiveClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setModalType('unarchive');
    setShowModal(true);
  };

  const handleConfirm = () => {
    if (!selectedTicket) return;

    if (modalType === 'delete' && onDelete) {
      onDelete(selectedTicket.id);
    } else if (modalType === 'archive' && onArchive) {
      onArchive(selectedTicket.id);
    } else if (modalType === 'unarchive' && onUnarchive) {
      onUnarchive(selectedTicket.id);
    }

    setShowModal(false);
    setSelectedTicket(null);
  };

  const handleCancel = () => {
    setShowModal(false);
    setSelectedTicket(null);
  };

  const getStatusColor = (status: string) => {
    const statusColorMap: { [key: string]: string } = {
      new: '#3b82f6',
      contacted: '#f59e0b',
      qualified: '#06b6d4',
      quoted: '#8b5cf6',
      in_progress: '#f59e0b',
      resolved: '#10b981',
      closed: '#6b7280',
      won: '#10b981',
      lost: '#ef4444',
      unqualified: '#6b7280',
    };
    return statusColorMap[status] || '#6b7280';
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
    if (!dateString) return 'Unknown';
    return (
      new Date(dateString).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
      }) +
      ' - ' +
      new Date(dateString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    );
  };

  const getTicketDisplayTitle = (ticket: Ticket) => {
    if (ticket.customer) {
      return `${ticket.customer.first_name} ${ticket.customer.last_name}&apos;s Ticket`;
    }
    if (ticket.description) {
      const preview = ticket.description.slice(0, 50);
      return ticket.description.length > 50 ? `${preview}...` : preview;
    }
    return `${ticket.type} - ${new Date(ticket.created_at || '').toLocaleDateString()}`;
  };

  const handleQualifyClick = (ticket: Ticket) => {
    setQualifyingTicket(ticket);
    setShowQualifyModal(true);
  };

  const handleQualify = async (
    qualification: 'sales' | 'customer_service' | 'junk',
    assignedTo?: string
  ) => {
    if (!qualifyingTicket) return;

    setIsQualifying(true);
    try {
      const response = await fetch(
        `/api/tickets/${qualifyingTicket.id}/qualify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ qualification, assignedTo }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Qualification failed');
      }

      const result = await response.json();

      // Refresh the tickets list
      if (onTicketUpdated) {
        onTicketUpdated();
      }

      // If converted to lead, optionally redirect
      if (qualification === 'sales' && result.lead?.id) {
        setTimeout(() => {
          router.push(`/tickets/leads/${result.lead.id}`);
        }, 1000);
      }
    } catch (error) {
      console.error('Qualification error:', error);
      alert(error instanceof Error ? error.message : 'Qualification failed');
    } finally {
      setIsQualifying(false);
      setShowQualifyModal(false);
      setQualifyingTicket(null);
    }
  };

  const formatAddress = (customer: any) => {
    if (!customer) return 'No address';

    const parts = [];
    if (customer.address) parts.push(customer.address);
    if (customer.city) parts.push(customer.city);
    if (customer.state) parts.push(customer.state);
    if (customer.zip_code) parts.push(customer.zip_code);

    return parts.length > 0 ? parts.join(', ') : 'No address';
  };

  const getCategoryDisplay = (ticket: Ticket) => {
    // Use service_type which is set by the webhook based on is_qualified
    if (ticket.service_type) {
      // Map service types to user-friendly labels
      const serviceTypeMap: Record<string, string> = {
        Sales: 'Sales',
        'Customer Service': 'Support',
        sales: 'Sales',
        customer_service: 'Support',
      };
      return serviceTypeMap[ticket.service_type] || ticket.service_type;
    }
    // If no service_type is set, show none
    return 'none';
  };

  const getOriginDisplay = (type: string) => {
    const originMap: Record<string, string> = {
      phone_call: 'Call',
      web_form: 'Form',
      email: 'Email',
      chat: 'Chat',
      sms: 'SMS',
    };
    return originMap[type] || type;
  };

  const getAssignedStatus = (ticket: Ticket) => {
    if (ticket.assigned_to) {
      return 'Assigned';
    }
    return 'Waiting...';
  };

  const isQualified = (ticket: Ticket) => {
    return ticket.status === 'qualified' || ticket.converted_to_lead_id;
  };

  const renderTicketDetails = (ticket: Ticket) => {
    if (!expandedTickets.has(ticket.id)) return null;

    return (
      <tr key={`${ticket.id}-details`} className={styles.detailsRow}>
        <td colSpan={showActions ? 9 : 8}>
          <div className={styles.ticketDetails}>
            <div className={styles.compactDetails}>
              {/* Contact Information */}
              <div className={styles.detailGroup}>
                <h4 className={styles.groupTitle}>Contact Information</h4>
                <div className={styles.compactItems}>
                  <span className={styles.compactItem}>
                    <strong>Full Name:</strong>{' '}
                    {ticket.customer
                      ? `${ticket.customer.first_name} ${ticket.customer.last_name}`
                      : 'No customer linked'}
                  </span>
                  <span className={styles.compactItem}>
                    <strong>Phone:</strong>{' '}
                    {ticket.customer?.phone || 'No phone number'}
                  </span>
                  <span className={styles.compactItem}>
                    <strong>Email:</strong>{' '}
                    {ticket.customer?.email || 'No email address'}
                  </span>
                </div>
              </div>

              {/* Lead Information */}
              <div className={styles.detailGroup}>
                <h4 className={styles.groupTitle}>Lead Information</h4>
                <div className={styles.compactItems}>
                  <span className={styles.compactItem}>
                    <strong>Source:</strong>{' '}
                    {ticketSourceOptions.find(s => s.value === ticket.source)
                      ?.label || ticket.source}
                  </span>
                  <span className={styles.compactItem}>
                    <strong>Transfer Type:</strong>{' '}
                    {getOriginDisplay(ticket.type)}
                  </span>
                  <span className={styles.compactItem}>
                    <strong>Lead Catagagory:</strong>{' '}
                    {ticketTypeOptions.find(t => t.value === ticket.type)
                      ?.label || ticket.type}
                  </span>
                </div>
              </div>

              {/* Location & Timing */}
              <div className={styles.detailGroup}>
                <h4 className={styles.groupTitle}>Location & Timing</h4>
                <div className={styles.compactItems}>
                  <span className={styles.compactItem}>
                    <strong>Received:</strong> {formatDate(ticket.created_at)} (
                    {getTimeAgo(ticket.created_at)})
                  </span>
                  <span className={styles.compactItem}>
                    <strong>Address:</strong> {formatAddress(ticket.customer)}
                  </span>
                  <span className={styles.compactItem}>
                    <strong>Priority:</strong>{' '}
                    <span
                      className={`${styles.priorityValue} ${styles[ticket.priority || 'medium']}`}
                    >
                      {ticketPriorityOptions.find(
                        p => p.value === (ticket.priority || 'medium')
                      )?.label || 'Medium'}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  if (tickets.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No tickets found. Create your first ticket to get started.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Time</th>
            <th>Name</th>
            <th>Phone</th>
            <th>Address</th>
            <th>Format</th>
            <th>Source</th>
            <th>Ticket Type</th>
            <th>Assigned</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {tickets
            .map(ticket => {
              return [
                <tr
                  key={ticket.id}
                  className={`${styles.clickableRow} ${expandedTickets.has(ticket.id) ? styles.expanded : ''} ${hasLiveCall(ticket) ? styles.liveCall : ''}`}
                  onClick={e => handleRowClick(ticket.id, e)}
                >
                  {hasLiveCall(ticket) ? (
                    // Live Call In Progress - show minimal info
                    <>
                      <td colSpan={showActions ? 8 : 7}>
                        <div className={styles.liveCallInfo}>
                          <div className={styles.liveCallIndicator}>
                            <div className={styles.pulseDot}></div>
                            <strong>📞 Live Call In Progress</strong>
                          </div>
                          <div className={styles.liveCallTime}>
                            <Clock size={12} />
                            {getTimeAgo(ticket.created_at)}
                          </div>
                        </div>
                      </td>
                    </>
                  ) : (
                    // Normal ticket display
                    <>
                      <td>
                        <div className={styles.timeInfo}>
                          <Clock size={12} />
                          {getTimeAgo(ticket.created_at)}
                        </div>
                      </td>
                      <td>
                        <div className={styles.customerInfo}>
                          {ticket.customer ? (
                            <strong>
                              {ticket.customer.first_name}{' '}
                              {ticket.customer.last_name}
                            </strong>
                          ) : (
                            <span className={styles.noCustomer}>
                              No customer
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.phoneInfo}>
                          {ticket.customer?.phone ? (
                            <div className={styles.contactInfo}>
                              <Phone size={12} />
                              {ticket.customer.phone}
                            </div>
                          ) : (
                            <span className={styles.noData}>No phone</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.addressInfo}>
                          <MapPin size={12} />
                          <span title={formatAddress(ticket.customer)}>
                            {formatAddress(ticket.customer)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.typeBadge}>
                          {
                            ticketTypeOptions.find(t => t.value === ticket.type)
                              ?.label
                          }
                        </span>
                      </td>
                      <td>
                        <span className={styles.sourceBadge}>
                          {
                            ticketSourceOptions.find(
                              s => s.value === ticket.source
                            )?.label
                          }
                        </span>
                      </td>
                      <td>
                        <span
                          className={`${styles.categoryBadge} ${styles[getCategoryDisplay(ticket).toLowerCase()]}`}
                        >
                          {getCategoryDisplay(ticket)}
                        </span>
                      </td>
                      <td>
                        <div className={styles.assignedInfo}>
                          <span
                            className={
                              ticket.assigned_to
                                ? styles.assigned
                                : styles.unassigned
                            }
                          >
                            {getAssignedStatus(ticket)}
                          </span>
                        </div>
                      </td>
                    </>
                  )}
                  {showActions && (
                    <td>
                      <div className={styles.actions}>
                        <button
                          className={styles.expandButton}
                          title={
                            expandedTickets.has(ticket.id)
                              ? 'Collapse details'
                              : 'Expand details'
                          }
                        >
                          {expandedTickets.has(ticket.id) ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                        {onEdit && (
                          <button
                            className={styles.editButton}
                            onClick={() => onEdit(ticket)}
                            title="Edit ticket"
                          >
                            <Edit size={14} />
                          </button>
                        )}
                        {!showArchived && onArchive && (
                          <button
                            className={styles.archiveButton}
                            onClick={() => handleArchiveClick(ticket)}
                            title="Archive ticket"
                          >
                            <Archive size={14} />
                          </button>
                        )}
                        {showArchived && onUnarchive && (
                          <button
                            className={styles.archiveButton}
                            onClick={() => handleUnarchiveClick(ticket)}
                            title="Restore ticket"
                          >
                            <ArchiveRestore size={14} />
                          </button>
                        )}
                        {/* Qualify Button - Always show for human review */}
                        <button
                          className={styles.qualifyButton}
                          onClick={() => handleQualifyClick(ticket)}
                          title="Qualify Ticket"
                        >
                          Qualify
                        </button>
                        {onDelete && (
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDeleteClick(ticket)}
                            title="Delete ticket"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>,
                renderTicketDetails(ticket),
              ];
            })
            .flat()}
        </tbody>
      </table>

      <ConfirmationModal
        isOpen={showModal}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        ticketDescription={
          selectedTicket
            ? selectedTicket.description ||
              getTicketDisplayTitle(selectedTicket)
            : ''
        }
        type={modalType}
      />

      {qualifyingTicket && (
        <TicketReviewModal
          ticket={qualifyingTicket}
          isOpen={showQualifyModal}
          onClose={() => {
            setShowQualifyModal(false);
            setQualifyingTicket(null);
          }}
          onQualify={handleQualify}
          isQualifying={isQualifying}
        />
      )}
    </div>
  );
};

export default TicketsTable;
