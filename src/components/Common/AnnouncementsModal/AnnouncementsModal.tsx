import React from 'react';
import { Modal, ModalTop, ModalMiddle } from '@/components/Common/Modal/Modal';
import styles from './AnnouncementsModal.module.scss';

interface Announcement {
  id: string;
  title: string;
  content: string;
  published_at: string;
  published_by: string;
}

interface AnnouncementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcements: Announcement[];
}

export function AnnouncementsModal({
  isOpen,
  onClose,
  announcements,
}: AnnouncementsModalProps) {
  // Sort announcements by published_at (newest first)
  const sortedAnnouncements = [...announcements].sort(
    (a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="medium">
      <ModalTop title="Important Announcements" onClose={onClose} />
      <ModalMiddle className={styles.modalContent}>
        {sortedAnnouncements.length === 0 ? (
          <p className={styles.emptyState}>No announcements at this time.</p>
        ) : (
          <div className={styles.announcementsList}>
            {sortedAnnouncements.map((announcement) => (
              <div key={announcement.id} className={styles.announcementItem}>
                <div className={styles.announcementHeader}>
                  <h3 className={styles.announcementTitle}>{announcement.title}</h3>
                  <span className={styles.announcementDate}>
                    {formatDate(announcement.published_at)}
                  </span>
                </div>
                <p className={styles.announcementContent}>{announcement.content}</p>
              </div>
            ))}
          </div>
        )}
      </ModalMiddle>
    </Modal>
  );
}
