'use client';

import { useState } from 'react';
import { X, CircleCheck, RefreshCcwDot, CircleSlash } from 'lucide-react';
import styles from './EndCadenceModal.module.scss';

interface EndCadenceModalProps {
  isOpen: boolean;
  onProceedToQuote: () => Promise<void>;
  onConvertToAutomation: () => Promise<void>;
  onEndOnly: () => Promise<void>;
  onCancel: () => void;
}

type EndOption = 'quote' | 'automation' | 'end' | null;

export function EndCadenceModal({
  isOpen,
  onProceedToQuote,
  onConvertToAutomation,
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
        case 'quote':
          await onProceedToQuote();
          break;
        case 'automation':
          await onConvertToAutomation();
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
      case 'quote':
        return 'Proceed to Quote!';
      case 'automation':
        return 'Convert to Automation';
      case 'end':
        return 'End Cadence';
      default:
        return 'End Cadence';
    }
  };

  const getButtonClass = () => {
    switch (selectedOption) {
      case 'quote':
        return styles.proceedButton;
      case 'automation':
        return styles.convertButton;
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
                value="quote"
                checked={selectedOption === 'quote'}
                onChange={() => setSelectedOption('quote')}
                disabled={isProcessing}
                className={styles.radioInput}
              />
              <span className={styles.radioCustom}></span>
              <div className={styles.optionContent}>
                <strong>I&apos;m ready to quote this lead.</strong>
                <span className={styles.optionDescription}>
                  Complete current stage and task. Proceed to the next stage!
                </span>
              </div>
            </label>

            <label className={styles.radioOption}>
              <input
                type="radio"
                name="endOption"
                value="automation"
                checked={selectedOption === 'automation'}
                onChange={() => setSelectedOption('automation')}
                disabled={isProcessing}
                className={styles.radioInput}
              />
              <span className={styles.radioCustom}></span>
              <div className={styles.optionContent}>
                <strong>This lead is not interested.</strong>
                <span className={styles.optionDescription}>
                  Complete current stage and task. Go to automation (coming
                  soon).
                </span>
              </div>
            </label>

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
            {selectedOption === 'quote' && <CircleCheck size={18} />}
            {selectedOption === 'automation' && <RefreshCcwDot size={18} />}
            {selectedOption === 'end' && <CircleSlash size={18} />}
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}
