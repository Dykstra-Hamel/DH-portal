'use client';

import { useState } from 'react';
import { CircleCheck } from 'lucide-react';
import styles from './ServiceConfirmationModal.module.scss';

interface ServiceConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (scheduledDate: string, scheduledTime: string, note: string) => void;
  scheduledDate: string;
  scheduledTime: string;
  confirmationNote: string;
  onScheduledDateChange: (value: string) => void;
  onScheduledTimeChange: (value: string) => void;
  onConfirmationNoteChange: (value: string) => void;
}

export function ServiceConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  scheduledDate,
  scheduledTime,
  confirmationNote,
  onScheduledDateChange,
  onScheduledTimeChange,
  onConfirmationNoteChange,
}: ServiceConfirmationModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(scheduledDate, scheduledTime, confirmationNote);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = scheduledDate && scheduledTime;

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <h2 className={styles.modalTitle}>Service Confirmation</h2>
        <p className={styles.modalDescription}>
          Confirm the scheduled service details to finalize this sale.
        </p>

        <div className={styles.formContainer}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Scheduled Date *</label>
              <input
                type="date"
                className={styles.formInput}
                value={scheduledDate}
                onChange={(e) => onScheduledDateChange(e.target.value)}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Scheduled Time *</label>
              <input
                type="time"
                className={styles.formInput}
                value={scheduledTime}
                onChange={(e) => onScheduledTimeChange(e.target.value)}
                required
              />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Notes (Optional)</label>
            <textarea
              className={styles.formTextarea}
              placeholder="Add any notes about the scheduled service..."
              rows={4}
              value={confirmationNote}
              onChange={(e) => onConfirmationNoteChange(e.target.value)}
            />
          </div>
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
            disabled={!isFormValid || isSubmitting}
          >
            <CircleCheck size={18} />
            {isSubmitting ? 'Finalizing...' : 'Confirm & Finalize'}
          </button>
        </div>
      </div>
    </div>
  );
}
