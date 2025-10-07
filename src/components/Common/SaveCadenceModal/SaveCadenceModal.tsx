'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import styles from './SaveCadenceModal.module.scss';

interface SaveCadenceModalProps {
  isOpen: boolean;
  currentCadenceName: string;
  onSaveAsNew: (newName: string) => Promise<void>;
  onOverwrite: () => Promise<void>;
  onCancel: () => void;
}

export function SaveCadenceModal({
  isOpen,
  currentCadenceName,
  onSaveAsNew,
  onOverwrite,
  onCancel,
}: SaveCadenceModalProps) {
  const [saveOption, setSaveOption] = useState<'new' | 'overwrite'>('overwrite');
  const [newCadenceName, setNewCadenceName] = useState(`${currentCadenceName} (Copy)`);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (saveOption === 'new') {
        if (!newCadenceName.trim()) {
          alert('Please enter a cadence name');
          return;
        }
        await onSaveAsNew(newCadenceName.trim());
      } else {
        await onOverwrite();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Save Cadence Changes</h3>
          <button onClick={onCancel} className={styles.closeButton} disabled={isSaving}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalContent}>
          <p className={styles.description}>
            You&apos;ve made changes to <strong>{currentCadenceName}</strong>. How would you like to save these changes?
          </p>

          <div className={styles.options}>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="saveOption"
                value="overwrite"
                checked={saveOption === 'overwrite'}
                onChange={() => setSaveOption('overwrite')}
                disabled={isSaving}
                className={styles.radioInput}
              />
              <span className={styles.radioCustom}></span>
              <div className={styles.optionContent}>
                <strong>Overwrite existing cadence</strong>
                <span className={styles.optionDescription}>
                  Update &quot;{currentCadenceName}&quot; with your changes
                </span>
              </div>
            </label>

            <label className={styles.radioOption}>
              <input
                type="radio"
                name="saveOption"
                value="new"
                checked={saveOption === 'new'}
                onChange={() => setSaveOption('new')}
                disabled={isSaving}
                className={styles.radioInput}
              />
              <span className={styles.radioCustom}></span>
              <div className={styles.optionContent}>
                <strong>Save as new cadence</strong>
                <span className={styles.optionDescription}>
                  Create a new cadence and keep the original unchanged
                </span>
              </div>
            </label>

            {saveOption === 'new' && (
              <div className={styles.newNameInput}>
                <label>New Cadence Name *</label>
                <input
                  type="text"
                  value={newCadenceName}
                  onChange={(e) => setNewCadenceName(e.target.value)}
                  placeholder="Enter cadence name..."
                  disabled={isSaving}
                  autoFocus
                />
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={styles.saveButton}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
