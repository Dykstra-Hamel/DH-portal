'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import styles from './ConvertToSupportModal.module.scss';

interface ConvertToSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  customerName?: string;
}

export function ConvertToSupportModal({
  isOpen,
  onClose,
  onConfirm,
  customerName = 'this customer',
}: ConvertToSupportModalProps) {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(notes);
      setNotes('');
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
          <AlertCircle size={24} className={styles.icon} />
        </div>

        <h2 className={styles.modalTitle}>Convert to Support Case?</h2>
        <p className={styles.modalDescription}>
          You&apos;re about to convert {customerName}&apos;s sales lead into a support case. Once converted:
        </p>
        <ul className={styles.warningList}>
          <li>The current lead will be archived and removed from the sales pipeline.</li>
          <li>The quote, pest selections, and any scheduling progress will <strong>not</strong> carry over to the new support case.</li>
          <li>Active sales follow-up emails and tasks tied to this lead will stop.</li>
          <li>You&apos;ll be redirected back to the leads list when this completes.</li>
        </ul>
        <p className={styles.modalDescription}>
          The archived lead will remain in the system if you need to reference it later.
        </p>

        <div className={styles.formGroup}>
          <label htmlFor="supportNotes" className={styles.label}>
            Additional Notes (Optional)
          </label>
          <textarea
            id="supportNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={styles.textarea}
            placeholder="Add any additional context for the support case..."
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
            {isSubmitting ? 'Converting...' : 'Convert to Support Case'}
          </button>
        </div>
      </div>
    </div>
  );
}
