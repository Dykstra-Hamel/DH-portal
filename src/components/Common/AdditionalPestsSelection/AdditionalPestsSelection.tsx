'use client';

import { useState } from 'react';
import { X, Plus, ChevronDown } from 'lucide-react';
import styles from './AdditionalPestsSelection.module.scss';

interface PestOption {
  id: string;
  name: string;
  custom_label?: string;
}

interface AdditionalPestsSelectionProps {
  selectedPestIds: string[];
  pestOptions: PestOption[];
  primaryPestId?: string | null;
  onPestsChange: (pestIds: string[]) => void;
  loading?: boolean;
}

export function AdditionalPestsSelection({
  selectedPestIds,
  pestOptions,
  primaryPestId,
  onPestsChange,
  loading = false,
}: AdditionalPestsSelectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelectedPestIds, setTempSelectedPestIds] =
    useState<string[]>(selectedPestIds);

  const selectedPests = pestOptions.filter(p => selectedPestIds.includes(p.id));

  const handleOpen = () => {
    setTempSelectedPestIds(selectedPestIds);
    setIsOpen(true);
  };

  const handleCancel = () => {
    setTempSelectedPestIds(selectedPestIds);
    setIsOpen(false);
  };

  const handleAddSelected = () => {
    onPestsChange(tempSelectedPestIds);
    setIsOpen(false);
  };

  const handleRemovePest = (pestId: string) => {
    const newPests = selectedPestIds.filter(id => id !== pestId);
    onPestsChange(newPests);
  };

  const togglePest = (pestId: string) => {
    if (tempSelectedPestIds.includes(pestId)) {
      setTempSelectedPestIds(tempSelectedPestIds.filter(id => id !== pestId));
    } else {
      setTempSelectedPestIds([...tempSelectedPestIds, pestId]);
    }
  };

  // Filter out primary pest from available options
  const availablePests = pestOptions.filter(p => p.id !== primaryPestId);

  return (
    <div className={styles.additionalPestsSelection}>
      <label className={styles.label}>Additional Pest Concerns</label>

      <div className={styles.mainRow}>
        <div className={styles.selectedPestsContainer}>
          {selectedPests.map(pest => (
            <span key={pest.id} className={styles.pestTag}>
              {pest.custom_label || pest.name}
              <button
                type="button"
                onClick={() => handleRemovePest(pest.id)}
                className={styles.removeButton}
                aria-label="Remove pest"
              >
                <X size={8} />
              </button>
            </span>
          ))}
        </div>

        <div className={styles.buttons}>
          <button
            type="button"
            onClick={handleOpen}
            className={styles.addButton}
            disabled={loading}
          >
            <Plus size={18} />
            <span className={styles.buttonText}>Add Pest</span>
            <ChevronDown size={20} className={styles.chevron} />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className={styles.selectionPanel}>
          <div className={styles.panelHeader}>Select all that apply</div>

          <div className={styles.pestGrid}>
            {availablePests.map(pest => (
              <label key={pest.id} className={styles.pestOption}>
                <input
                  type="checkbox"
                  checked={tempSelectedPestIds.includes(pest.id)}
                  onChange={() => togglePest(pest.id)}
                  className={styles.checkboxInput}
                />
                <span className={styles.checkboxCustom}>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="10"
                    height="10"
                    viewBox="0 0 10 10"
                    fill="none"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M9.18301 0.68234C9.3401 0.787078 9.44915 0.949924 9.48617 1.13506C9.5232 1.32019 9.48517 1.51246 9.38045 1.66955L4.63423 8.78888C4.57578 8.87645 4.49863 8.94995 4.40834 9.00411C4.31806 9.05827 4.21689 9.09172 4.11211 9.10207C4.00734 9.11242 3.90158 9.09941 3.80244 9.06396C3.70331 9.02852 3.61327 8.97153 3.53881 8.8971L0.691075 6.04937C0.565319 5.91441 0.496857 5.73591 0.500111 5.55147C0.503365 5.36703 0.578082 5.19105 0.70852 5.06061C0.838959 4.93017 1.01493 4.85546 1.19937 4.8522C1.38381 4.84895 1.56231 4.91741 1.69727 5.04317L3.93084 7.27674L8.1958 0.878834C8.30068 0.721902 8.4636 0.613046 8.64872 0.576199C8.83385 0.539352 9.02603 0.577531 9.18301 0.68234Z"
                      fill="#00A63E"
                    />
                  </svg>
                </span>
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
              onClick={handleAddSelected}
              className={styles.addSelectedButton}
            >
              Add Selected Pests
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
