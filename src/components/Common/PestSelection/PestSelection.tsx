'use client';

import { useState } from 'react';
import { X, Plus, PenLine, ChevronDown } from 'lucide-react';
import styles from './PestSelection.module.scss';

interface PestOption {
  id: string;
  name: string;
  custom_label?: string;
}

interface PestSelectionProps {
  selectedPestId: string | null;
  pestOptions: PestOption[];
  onPestChange: (pestId: string) => void;
  loading?: boolean;
}

export function PestSelection({
  selectedPestId,
  pestOptions,
  onPestChange,
  loading = false,
}: PestSelectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelectedPestId, setTempSelectedPestId] = useState<string | null>(
    selectedPestId
  );
  const [customPest, setCustomPest] = useState('');

  const selectedPest = pestOptions.find(p => p.id === selectedPestId);
  const selectedPestLabel =
    selectedPest?.custom_label || selectedPest?.name || '';

  const handleOpen = () => {
    setTempSelectedPestId(selectedPestId);
    setCustomPest('');
    setIsOpen(true);
  };

  const handleCancel = () => {
    setTempSelectedPestId(selectedPestId);
    setCustomPest('');
    setIsOpen(false);
  };

  const handleUpdate = () => {
    if (tempSelectedPestId) {
      onPestChange(tempSelectedPestId);
    }
    setIsOpen(false);
    setCustomPest('');
  };

  const handleRemovePest = () => {
    if (selectedPestId) {
      onPestChange('');
    }
  };

  return (
    <div className={styles.pestSelection}>
      <label className={styles.label}>Primary Concern</label>

      <div className={styles.mainRow}>
        <div className={styles.selectedPestContainer}>
          {selectedPestLabel && (
            <span className={styles.pestTag}>
              {selectedPestLabel}
              <button
                type="button"
                onClick={handleRemovePest}
                className={styles.removeButton}
                aria-label="Remove pest"
              >
                <X size={8} />
              </button>
            </span>
          )}
        </div>

        <div className={styles.buttons}>
          {selectedPestId ? (
            <button
              type="button"
              onClick={handleOpen}
              className={styles.updateButton}
              disabled={loading}
            >
              <PenLine size={18} />
              <span className={styles.buttonText}>Update</span>
              <ChevronDown size={20} className={styles.chevron} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleOpen}
              className={styles.addButton}
              disabled={loading}
            >
              <Plus size={20} />
              <span className={styles.buttonText}>Add Pest</span>
              <ChevronDown size={20} className={styles.chevron} />
            </button>
          )}
        </div>
      </div>

      {isOpen && (
        <div className={styles.selectionPanel}>
          <div className={styles.panelHeader}>Select primary pest concern</div>

          <div className={styles.pestGrid}>
            {pestOptions.map(pest => (
              <label key={pest.id} className={styles.pestOption}>
                <input
                  type="radio"
                  name="pest"
                  value={pest.id}
                  checked={tempSelectedPestId === pest.id}
                  onChange={() => {
                    setTempSelectedPestId(pest.id);
                  }}
                  className={styles.radioInput}
                />
                <span className={styles.radioCustom}></span>
                <span>{pest.custom_label || pest.name}</span>
              </label>
            ))}
          </div>

          <div className={styles.panelActions}>
            <button
              type="button"
              onClick={handleCancel}
              className={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleUpdate}
              className={styles.updateActionButton}
              disabled={!tempSelectedPestId}
            >
              Update
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
