import { useEffect } from 'react';
import { X, Mail, Phone, MapPin, User as UserIcon } from 'lucide-react';
import { Lead } from '@/types/lead';
import { formatHeaderDate } from '@/lib/date-utils';
import styles from './CustomerCardModal.module.scss';

interface CustomerCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  lead: Lead;
}

export function CustomerCardModal({
  isOpen,
  onClose,
  lead,
}: CustomerCardModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const customer = lead.customer;
  const fullName = customer
    ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim()
    : '';

  const serviceAddress = lead.primary_service_address;
  const addressLine1 =
    serviceAddress?.street_address || customer?.address || '';
  const city = serviceAddress?.city || customer?.city || '';
  const state = serviceAddress?.state || customer?.state || '';
  const zip = serviceAddress?.zip_code || customer?.zip_code || '';
  const cityStateZip = [city, state].filter(Boolean).join(', ');
  const fullAddressLine2 = [cityStateZip, zip].filter(Boolean).join(' ');

  return (
    <div
      className={styles.modalOverlay}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Customer card"
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Customer Card</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close customer card"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.nameBlock}>
            <div className={styles.avatar}>
              <UserIcon size={20} />
            </div>
            <div>
              <p className={styles.customerName}>{fullName || 'Unknown Customer'}</p>
              {customer?.customer_status && (
                <p className={styles.customerStatus}>
                  {customer.customer_status}
                </p>
              )}
            </div>
          </div>

          <ul className={styles.detailList}>
            {customer?.email && (
              <li className={styles.detailItem}>
                <Mail size={16} className={styles.detailIcon} />
                <a
                  href={`mailto:${customer.email}`}
                  className={styles.detailLink}
                >
                  {customer.email}
                </a>
              </li>
            )}
            {customer?.phone && (
              <li className={styles.detailItem}>
                <Phone size={16} className={styles.detailIcon} />
                <a
                  href={`tel:${customer.phone}`}
                  className={styles.detailLink}
                >
                  {customer.phone}
                </a>
              </li>
            )}
            {(addressLine1 || fullAddressLine2) && (
              <li className={styles.detailItem}>
                <MapPin size={16} className={styles.detailIcon} />
                <div className={styles.detailValue}>
                  {addressLine1 && <div>{addressLine1}</div>}
                  {fullAddressLine2 && <div>{fullAddressLine2}</div>}
                </div>
              </li>
            )}
          </ul>

          <div className={styles.metaRow}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Created</span>
              <span className={styles.metaValue}>
                {formatHeaderDate(lead.created_at, true)}
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Last update</span>
              <span className={styles.metaValue}>
                {formatHeaderDate(lead.updated_at, true)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
