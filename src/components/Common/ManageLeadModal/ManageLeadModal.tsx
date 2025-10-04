import { useState } from 'react';
import { CircleCheck } from 'lucide-react';
import styles from './ManageLeadModal.module.scss';

interface ManageLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed: (option: 'communication' | 'quote' | 'schedule') => void;
  currentStage: string;
}

export function ManageLeadModal({
  isOpen,
  onClose,
  onProceed,
  currentStage,
}: ManageLeadModalProps) {
  const [selectedOption, setSelectedOption] = useState<
    'communication' | 'quote' | 'schedule'
  >('communication');

  if (!isOpen) return null;

  const handleProceed = () => {
    onProceed(selectedOption);
    onClose();
  };

  const getButtonText = () => {
    switch (selectedOption) {
      case 'communication':
        return 'Proceed to Next Stage';
      case 'quote':
        return 'Jump to Quote';
      case 'schedule':
        return 'Jump to Scheduling';
      default:
        return 'Proceed to Next Stage';
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2 className={styles.title}>Choose next step:</h2>

        <div className={styles.options}>
          <label className={styles.option}>
            <input
              type="radio"
              name="leadOption"
              value="communication"
              checked={selectedOption === 'communication'}
              onChange={() => setSelectedOption('communication')}
            />
            <div className={styles.radioCustom}>
              {selectedOption === 'communication' && (
                <div className={styles.radioDot} />
              )}
            </div>
            <div className={styles.optionContent}>
              <div className={styles.optionTitle}>
                I need to work this lead.
              </div>
              <div className={styles.optionDescription}>
                Complete current stage and proceed to Communication.
              </div>
            </div>
          </label>

          <label className={styles.option}>
            <input
              type="radio"
              name="leadOption"
              value="quote"
              checked={selectedOption === 'quote'}
              onChange={() => setSelectedOption('quote')}
            />
            <div className={styles.radioCustom}>
              {selectedOption === 'quote' && (
                <div className={styles.radioDot} />
              )}
            </div>
            <div className={styles.optionContent}>
              <div className={styles.optionTitle}>
                I&apos;m ready to quote this lead.
              </div>
              <div className={styles.optionDescription}>
                Complete current stage and jump to Quote.
              </div>
            </div>
          </label>

          <label className={styles.option}>
            <input
              type="radio"
              name="leadOption"
              value="schedule"
              checked={selectedOption === 'schedule'}
              onChange={() => setSelectedOption('schedule')}
            />
            <div className={styles.radioCustom}>
              {selectedOption === 'schedule' && (
                <div className={styles.radioDot} />
              )}
            </div>
            <div className={styles.optionContent}>
              <div className={styles.optionTitle}>
                I&apos;m ready to schedule this lead.
              </div>
              <div className={styles.optionDescription}>
                Complete current stage and jump to Scheduling
              </div>
            </div>
          </label>
        </div>

        <div className={styles.actions}>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button className={styles.proceedButton} onClick={handleProceed}>
            <CircleCheck size={18} />
            {getButtonText()}
          </button>
        </div>
      </div>
    </div>
  );
}
