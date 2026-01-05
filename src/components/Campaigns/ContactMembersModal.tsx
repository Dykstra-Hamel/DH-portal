'use client';

import { useEffect, useState, ReactElement } from 'react';
import { X, User, Mail, Phone, CheckCircle, XCircle, Clock, Loader, Eye } from 'lucide-react';
import styles from './ContactMembersModal.module.scss';

interface ContactMember {
  id: string;
  status: string;
  added_at: string;
  processed_at: string | null;
  error_message: string | null;
  first_viewed_at: string | null;
  last_viewed_at: string | null;
  view_count: number;
  redeemed_at: string | null;
  customer: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
}

interface ContactMembersModalProps {
  campaignId: string;
  listId: string;
  listName: string;
  onClose: () => void;
}

export default function ContactMembersModal({ campaignId, listId, listName, onClose }: ContactMembersModalProps) {
  const [members, setMembers] = useState<ContactMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, [campaignId, listId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/campaigns/${campaignId}/contact-lists/${listId}/members`);
      const result = await response.json();

      if (result.success) {
        setMembers(result.members || []);
      }
    } catch (error) {
      console.error('Error fetching contact members:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { icon: ReactElement; label: string; className: string }> = {
      pending: { icon: <Clock size={14} />, label: 'Pending', className: styles.statusPending },
      processing: { icon: <Loader size={14} />, label: 'Processing', className: styles.statusProcessing },
      processed: { icon: <CheckCircle size={14} />, label: 'Processed', className: styles.statusProcessed },
      failed: { icon: <XCircle size={14} />, label: 'Failed', className: styles.statusFailed },
      excluded: { icon: <XCircle size={14} />, label: 'Excluded', className: styles.statusExcluded },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span className={`${styles.statusBadge} ${config.className}`}>
        {config.icon}
        {config.label}
      </span>
    );
  };

  const formatLastViewed = (lastViewedAt: string | null) => {
    if (!lastViewedAt) {
      return <span className={styles.noData}>Never</span>;
    }

    const viewDate = new Date(lastViewedAt);
    const now = new Date();
    const diffMs = now.getTime() - viewDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    let timeAgo = '';
    if (diffDays > 0) {
      timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffMinutes > 0) {
      timeAgo = `${diffMinutes} min${diffMinutes > 1 ? 's' : ''} ago`;
    } else {
      timeAgo = 'Just now';
    }

    return (
      <span className={styles.viewedDate} title={viewDate.toLocaleString()}>
        {timeAgo}
      </span>
    );
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2>{listName}</h2>
            <p className={styles.subtitle}>
              {members.length} {members.length === 1 ? 'contact' : 'contacts'}
            </p>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className={styles.modalBody}>
          {loading ? (
            <div className={styles.loading}>
              <Loader size={32} className={styles.spinner} />
              <p>Loading contacts...</p>
            </div>
          ) : members.length === 0 ? (
            <div className={styles.emptyState}>
              <User size={48} />
              <p>No contacts in this list</p>
            </div>
          ) : (
            <div className={styles.tableContainer}>
              <table className={styles.membersTable}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Views</th>
                    <th>Last Viewed</th>
                    <th>Redeemed</th>
                    <th>Added</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(member => (
                    <tr key={member.id}>
                      <td>
                        <div className={styles.nameCell}>
                          <User size={16} />
                          <span>
                            {member.customer.first_name} {member.customer.last_name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.emailCell}>
                          <Mail size={14} />
                          <span>{member.customer.email}</span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.phoneCell}>
                          {member.customer.phone ? (
                            <>
                              <Phone size={14} />
                              <span>{member.customer.phone}</span>
                            </>
                          ) : (
                            <span className={styles.noData}>-</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div>
                          {getStatusBadge(member.status)}
                          {member.error_message && (
                            <div className={styles.errorMessage} title={member.error_message}>
                              {member.error_message}
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className={styles.viewCountCell}>
                          {member.view_count > 0 ? (
                            <>
                              <Eye size={14} />
                              <span>{member.view_count}</span>
                            </>
                          ) : (
                            <span className={styles.noData}>0</span>
                          )}
                        </div>
                      </td>
                      <td>{formatLastViewed(member.last_viewed_at)}</td>
                      <td>
                        {member.redeemed_at ? (
                          <span className={`${styles.statusBadge} ${styles.statusRedeemed}`}>
                            <CheckCircle size={14} />
                            Redeemed
                          </span>
                        ) : (
                          <span className={styles.noData}>-</span>
                        )}
                      </td>
                      <td>
                        <span className={styles.dateCell}>
                          {new Date(member.added_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
