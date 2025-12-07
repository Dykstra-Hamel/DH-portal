'use client';

import { useState } from 'react';
import styles from './LiveCallModal.module.scss';

interface LiveCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (option: 'quote' | 'schedule') => void;
}

export function LiveCallModal({
  isOpen,
  onClose,
  onSubmit,
}: LiveCallModalProps) {
  const [selectedOption, setSelectedOption] = useState<'quote' | 'schedule'>('quote');

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(selectedOption);
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
        <h2 className={styles.modalTitle}>Choose where to continue</h2>

        <div className={styles.optionsContainer}>
          <label className={styles.radioOption}>
            <input
              type="radio"
              name="liveCallOption"
              value="quote"
              checked={selectedOption === 'quote'}
              onChange={() => setSelectedOption('quote')}
              className={styles.radioInput}
            />
            <span className={styles.radioCustom}></span>
            <div className={styles.radioContent}>
              <span className={styles.radioLabel}>I&apos;m ready to quote this lead</span>
              <span className={styles.radioDescription}>Complete stage and jump to Quote.</span>
            </div>
          </label>

          <label className={styles.radioOption}>
            <input
              type="radio"
              name="liveCallOption"
              value="schedule"
              checked={selectedOption === 'schedule'}
              onChange={() => setSelectedOption('schedule')}
              className={styles.radioInput}
            />
            <span className={styles.radioCustom}></span>
            <div className={styles.radioContent}>
              <span className={styles.radioLabel}>I&apos;m ready to schedule this lead</span>
              <span className={styles.radioDescription}>Complete stage and jump to Scheduling.</span>
            </div>
          </label>
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
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15 7L8.5 13.5L5 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {selectedOption === 'quote' ? 'Jump to Quote' : 'Jump to Scheduling'}
          </button>
        </div>
      </div>
    </div>
  );
}
