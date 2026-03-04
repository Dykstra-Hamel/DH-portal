'use client';

import { useState } from 'react';
import styles from './NotInterestedModal.module.scss';

const NOT_INTERESTED_REASONS = [
  'Price too high',
  'Already has a service provider',
  'Not the right time',
  'Not in service area',
  'No response / Unreachable',
  'Chose a competitor',
  'Other',
];

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
  const [selectedReason, setSelectedReason] = useState('');
  const [otherReason, setOtherReason] = useState('');

  if (!isOpen) return null;

  const isOther = selectedReason === 'Other';
  const canSubmit = selectedReason && (!isOther || otherReason.trim());

  const handleClose = () => {
    setSelectedReason('');
    setOtherReason('');
    onClose();
  };

  const handleSubmit = () => {
    const reason = isOther ? otherReason.trim() : selectedReason;
    onSubmit(reason);
    setSelectedReason('');
    setOtherReason('');
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
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
          <select
            id="lostReason"
            value={selectedReason}
            onChange={(e) => setSelectedReason(e.target.value)}
            className={styles.select}
            autoFocus
          >
            <option value="" disabled>Select a reason...</option>
            {NOT_INTERESTED_REASONS.map((reason) => (
              <option key={reason} value={reason}>{reason}</option>
            ))}
          </select>
        </div>

        {isOther && (
          <div className={styles.formGroup}>
            <label htmlFor="otherReason" className={styles.label}>
              Please specify
            </label>
            <textarea
              id="otherReason"
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              className={styles.textarea}
              placeholder="Enter the reason this lead was lost..."
              rows={4}
              autoFocus
            />
          </div>
        )}

        <div className={styles.modalActions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Mark as Lost
          </button>
        </div>
      </div>
    </div>
  );
}
