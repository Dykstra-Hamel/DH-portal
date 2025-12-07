'use client';

import { Modal, ModalTop, ModalMiddle, ModalBottom } from '../Modal/Modal';
import { AlertTriangle } from 'lucide-react';
import styles from './ConfirmCadenceChangeModal.module.scss';

interface ConfirmCadenceChangeModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmCadenceChangeModal({
  isOpen,
  onConfirm,
  onCancel,
}: ConfirmCadenceChangeModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onCancel} className={styles.confirmModal}>
      <ModalTop title="Confirm Cadence Change" onClose={onCancel} />

      <ModalMiddle className={styles.modalContent}>
        <div className={styles.warningIcon}>
          <AlertTriangle size={48} />
        </div>
        <p className={styles.warningText}>
          Changing this lead&apos;s cadence will wipe your current progress. Continue?
        </p>
      </ModalMiddle>

      <ModalBottom>
        <div className={styles.buttonGroup}>
          <button
            onClick={onCancel}
            className={styles.secondaryButton}
          >
            No
          </button>
          <button
            onClick={onConfirm}
            className={styles.dangerButton}
          >
            Yes
          </button>
        </div>
      </ModalBottom>
    </Modal>
  );
}
