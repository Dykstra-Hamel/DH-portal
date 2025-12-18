'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import styles from './MarkAsJunkModal.module.scss';

interface MarkAsJunkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  customerName?: string;
}

export function MarkAsJunkModal({
  isOpen,
  onClose,
  onConfirm,
  customerName = 'this lead',
}: MarkAsJunkModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(reason);
      setReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isSubmitting) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <div className={styles.iconWrapper}>
          <Trash2 size={24} className={styles.icon} />
        </div>

        <h2 className={styles.modalTitle}>Mark as Junk</h2>
        <p className={styles.modalDescription}>
          This will mark {customerName} as junk and archive it. The lead will be moved to lost status. You&apos;ll be redirected to the leads page.
        </p>

        <div className={styles.formGroup}>
          <label htmlFor="junkReason" className={styles.label}>
            Reason (Optional)
          </label>
          <textarea
            id="junkReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={styles.textarea}
            placeholder="Why is this lead being marked as junk?"
            rows={4}
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Marking as Junk...' : 'Mark as Junk'}
          </button>
        </div>
      </div>
    </div>
  );
}
