'use client';

import { useState } from 'react';
import { X, Trash2, CircleSlash } from 'lucide-react';
import styles from './EndCadenceModal.module.scss';

interface EndCadenceModalProps {
  isOpen: boolean;
  onMarkAsLost: () => void;
  onEndOnly: () => Promise<void>;
  onCancel: () => void;
}

type EndOption = 'lost' | 'end' | null;

export function EndCadenceModal({
  isOpen,
  onMarkAsLost,
  onEndOnly,
  onCancel,
}: EndCadenceModalProps) {
  const [selectedOption, setSelectedOption] = useState<EndOption>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!selectedOption) return;

    setIsProcessing(true);
    try {
      switch (selectedOption) {
        case 'lost':
          onMarkAsLost();
          break;
        case 'end':
          await onEndOnly();
          break;
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonText = () => {
    if (isProcessing) return 'Processing...';

    switch (selectedOption) {
      case 'lost':
        return 'Mark as Lost';
      case 'end':
        return 'End Cadence';
      default:
        return 'End Cadence';
    }
  };

  const getButtonClass = () => {
    switch (selectedOption) {
      case 'lost':
        return styles.lostButton;
      case 'end':
        return styles.endButton;
      default:
        return styles.endButton;
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>End this cadence?</h3>
          <button
            onClick={onCancel}
            className={styles.closeButton}
            disabled={isProcessing}
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalContent}>
          <div className={styles.options}>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="endOption"
                value="end"
                checked={selectedOption === 'end'}
                onChange={() => setSelectedOption('end')}
                disabled={isProcessing}
                className={styles.radioInput}
              />
              <span className={styles.radioCustom}></span>
              <div className={styles.optionContent}>
                <strong>I want to try something else.</strong>
                <span className={styles.optionDescription}>
                  End cadence and remove remaining tasks.
                </span>
              </div>
            </label>

            <label className={styles.radioOption}>
              <input
                type="radio"
                name="endOption"
                value="lost"
                checked={selectedOption === 'lost'}
                onChange={() => setSelectedOption('lost')}
                disabled={isProcessing}
                className={styles.radioInput}
              />
              <span className={styles.radioCustom}></span>
              <div className={styles.optionContent}>
                <strong>This lead is not interested.</strong>
                <span className={styles.optionDescription}>
                  Mark lead as lost and end the cadence.
                </span>
              </div>
            </label>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={getButtonClass()}
            disabled={!selectedOption || isProcessing}
          >
            {selectedOption === 'lost' && <Trash2 size={18} />}
            {selectedOption === 'end' && <CircleSlash size={18} />}
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}
