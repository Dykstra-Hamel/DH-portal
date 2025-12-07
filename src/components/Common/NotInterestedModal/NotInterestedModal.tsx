'use client';

import { useState } from 'react';
import styles from './NotInterestedModal.module.scss';

interface NotInterestedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export function NotInterestedModal({
  isOpen,
  onClose,
  onSubmit,
}: NotInterestedModalProps) {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(reason);
    setReason('');
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Mark as Not Interested</h2>
        <p className={styles.modalDescription}>
          Please provide a reason why this lead is not interested.
        </p>

        <div className={styles.formGroup}>
          <label htmlFor="lostReason" className={styles.label}>
            Lost Reason
          </label>
          <textarea
            id="lostReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={styles.textarea}
            placeholder="Enter the reason this lead was lost..."
            rows={4}
            autoFocus
          />
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleSubmit}
          >
            Mark as Lost
          </button>
        </div>
      </div>
    </div>
  );
}
