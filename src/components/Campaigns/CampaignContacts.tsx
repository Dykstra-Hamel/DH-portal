'use client';

import { useEffect, useState } from 'react';
import { Users, Upload, CheckCircle, XCircle, Clock, Loader } from 'lucide-react';
import ContactListUpload from './ContactListUpload';
import styles from './CampaignContacts.module.scss';

interface CampaignContactsProps {
  campaignId: string;
  companyId: string;
  campaignStatus: string;
}

interface ContactList {
  id: string;
  list_name: string;
  description: string | null;
  total_members: number;
  pending_count: number;
  processing_count: number;
  processed_count: number;
  failed_count: number;
  created_at: string;
}

export default function CampaignContacts({ campaignId, companyId, campaignStatus }: CampaignContactsProps) {
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    fetchContactLists();
  }, [campaignId]);

  const fetchContactLists = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/campaigns/${campaignId}/contact-lists`);
      const result = await response.json();

      if (result.success) {
        setContactLists(result.contactLists || []);
      }
    } catch (error) {
      console.error('Error fetching contact lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return styles.statusProcessed;
      case 'processing':
        return styles.statusProcessing;
      case 'failed':
        return styles.statusFailed;
      default:
        return styles.statusPending;
    }
  };

  const getProgressPercentage = (list: ContactList) => {
    if (list.total_members === 0) return 0;
    return Math.round((list.processed_count / list.total_members) * 100);
  };

  if (loading) {
    return <div className={styles.loading}>Loading contact lists...</div>;
  }

  return (
    <div className={styles.contactsContainer}>
      <div className={styles.header}>
        <h2>Contact Lists</h2>
        {campaignStatus !== 'running' && campaignStatus !== 'completed' && (
          <button className={styles.uploadButton} onClick={() => setShowUploadModal(true)}>
            <Upload size={16} />
            Upload Contacts
          </button>
        )}
      </div>

      {contactLists.length === 0 ? (
        <div className={styles.emptyState}>
          <Users size={48} />
          <h3>No Contact Lists</h3>
          <p>Upload a CSV file to add contacts to this campaign</p>
          {campaignStatus !== 'running' && campaignStatus !== 'completed' && (
            <button className={styles.uploadButtonLarge} onClick={() => setShowUploadModal(true)}>
              <Upload size={20} />
              Upload Contacts
            </button>
          )}
        </div>
      ) : (
        <div className={styles.listGrid}>
          {contactLists.map(list => (
            <div key={list.id} className={styles.listCard}>
              <div className={styles.listHeader}>
                <h3>{list.list_name}</h3>
                <span className={styles.memberCount}>
                  <Users size={16} />
                  {list.total_members} contacts
                </span>
              </div>

              {list.description && (
                <p className={styles.listDescription}>{list.description}</p>
              )}

              <div className={styles.statsGrid}>
                <div className={styles.stat}>
                  <Clock size={16} className={styles.iconPending} />
                  <div>
                    <p className={styles.statValue}>{list.pending_count}</p>
                    <p className={styles.statLabel}>Pending</p>
                  </div>
                </div>

                <div className={styles.stat}>
                  <Loader size={16} className={styles.iconProcessing} />
                  <div>
                    <p className={styles.statValue}>{list.processing_count}</p>
                    <p className={styles.statLabel}>Processing</p>
                  </div>
                </div>

                <div className={styles.stat}>
                  <CheckCircle size={16} className={styles.iconProcessed} />
                  <div>
                    <p className={styles.statValue}>{list.processed_count}</p>
                    <p className={styles.statLabel}>Processed</p>
                  </div>
                </div>

                <div className={styles.stat}>
                  <XCircle size={16} className={styles.iconFailed} />
                  <div>
                    <p className={styles.statValue}>{list.failed_count}</p>
                    <p className={styles.statLabel}>Failed</p>
                  </div>
                </div>
              </div>

              {list.total_members > 0 && (
                <div className={styles.progressSection}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${getProgressPercentage(list)}%` }}
                    />
                  </div>
                  <p className={styles.progressText}>
                    {getProgressPercentage(list)}% complete
                  </p>
                </div>
              )}

              <div className={styles.listFooter}>
                <span className={styles.createdDate}>
                  Uploaded {new Date(list.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && (
        <div className={styles.modal} onClick={() => setShowUploadModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Upload Contact List</h2>
              <button className={styles.closeButton} onClick={() => setShowUploadModal(false)}>
                ×
              </button>
            </div>
            <ContactListUpload
              campaignId={campaignId}
              companyId={companyId}
              onSuccess={() => {
                fetchContactLists();
                setShowUploadModal(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
