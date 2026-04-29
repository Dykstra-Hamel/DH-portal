'use client';

import { useEffect, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { Lead } from '@/types/lead';
import { Quote } from '@/types/quote';
import { TimeOption, DEFAULT_TIME_OPTIONS } from '@/lib/time-options';
import { formatPreferredDay } from '@/lib/date-utils';
import styles from './ScheduleServiceModal.module.scss';

interface ScheduleServiceModalProps {
  isOpen: boolean;
  lead: Lead;
  quote?: Quote | null;
  scheduledDate: string;
  scheduledTime: string;
  timeOptions?: TimeOption[];
  onScheduledDateChange: (date: string) => void;
  onScheduledTimeChange: (time: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

function formatCurrency(amount: number): string {
  return `$${Math.round(amount)}`;
}

function formatAddress(lead: Lead): string {
  const address = lead.primary_service_address;
  if (address) {
    const parts = [
      address.street_address,
      address.city,
      address.state,
      address.zip_code,
    ].filter(Boolean);
    return parts.join(', ');
  }
  const customer = lead.customer;
  if (customer) {
    const parts = [
      customer.address,
      customer.city,
      customer.state,
      customer.zip_code,
    ].filter(Boolean);
    return parts.join(', ');
  }
  return '—';
}

export function ScheduleServiceModal({
  isOpen,
  lead,
  quote,
  scheduledDate,
  scheduledTime,
  timeOptions = DEFAULT_TIME_OPTIONS,
  onScheduledDateChange,
  onScheduledTimeChange,
  onConfirm,
  onClose,
}: ScheduleServiceModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const customer = lead.customer;
  const customerName = customer
    ? `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim() || '—'
    : '—';
  const customerEmail = customer?.email || '—';
  const address = formatAddress(lead);
  const preferredDay = formatPreferredDay(lead.requested_date);
  const preferredTimeLabel = lead.requested_time
    ? (timeOptions.find(o => o.value === lead.requested_time)?.label ??
      lead.requested_time)
    : '—';

  const totalInitial = quote?.total_initial_price ?? 0;
  const totalRecurring = quote?.total_recurring_price ?? 0;
  const subtotalInitial = quote?.subtotal_initial_price ?? totalInitial;
  const subtotalRecurring = quote?.subtotal_recurring_price ?? totalRecurring;
  const discount = quote?.applied_discount ?? null;
  const initialDiscountAmount =
    discount && (discount.applies_to_price === 'initial' || discount.applies_to_price === 'both')
      ? Math.max(0, subtotalInitial - totalInitial)
      : 0;
  const recurringDiscountAmount =
    discount && (discount.applies_to_price === 'recurring' || discount.applies_to_price === 'both')
      ? Math.max(0, subtotalRecurring - totalRecurring)
      : 0;
  const hasDiscount =
    !!discount && (initialDiscountAmount > 0 || recurringDiscountAmount > 0);
  const showPricing = quote != null && (totalInitial > 0 || totalRecurring > 0);

  const isDisabled = !scheduledDate || !scheduledTime || isSubmitting;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (isDisabled) return;
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <div className={styles.header}>
          <h2 className={styles.title}>Ready to Schedule</h2>
          <p className={styles.subtitle}>
            All the details of the customer for PestPac
          </p>
        </div>

        <div className={styles.customerInfo}>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Name</span>
            <span className={styles.infoValue}>{customerName}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Email</span>
            <span className={styles.infoValue}>{customerEmail}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Address</span>
            <span className={styles.infoValue}>{address}</span>
          </div>
        </div>

        {showPricing && (
          <div className={styles.pricingCard}>
            <p className={styles.pricingTitle}>Quote Total</p>
            <div
              className={`${styles.pricingRow} ${totalRecurring > 0 ? styles.pricingRowSplit : styles.pricingRowSingle}`}
            >
              <div className={styles.pricingBlock}>
                <span className={styles.pricingLabel}>Initial</span>
                <span className={styles.pricingValue}>
                  {formatCurrency(totalInitial)}
                </span>
                {initialDiscountAmount > 0 && (
                  <span className={styles.pricingOriginal}>
                    was {formatCurrency(subtotalInitial)}
                  </span>
                )}
              </div>
              {totalRecurring > 0 && (
                <>
                  <span className={styles.pricingDivider} aria-hidden="true" />
                  <div className={styles.pricingBlock}>
                    <span className={styles.pricingLabel}>EZPay</span>
                    <span className={styles.pricingValue}>
                      {formatCurrency(totalRecurring)}
                      <span className={styles.pricingSuffix}>/mo</span>
                    </span>
                    {recurringDiscountAmount > 0 && (
                      <span className={styles.pricingOriginal}>
                        was {formatCurrency(subtotalRecurring)}/mo
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>
            {hasDiscount && discount && (
              <div className={styles.discountBanner}>
                <div className={styles.discountInfo}>
                  <span className={styles.discountName}>
                    {discount.discount_name} applied
                  </span>
                  <span className={styles.discountAmount}>
                    {initialDiscountAmount > 0 &&
                      `−${formatCurrency(initialDiscountAmount)} off initial`}
                    {initialDiscountAmount > 0 &&
                      recurringDiscountAmount > 0 &&
                      ' · '}
                    {recurringDiscountAmount > 0 &&
                      `−${formatCurrency(recurringDiscountAmount)}/mo off recurring`}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className={styles.preferences}>
          <div className={styles.preferenceCol}>
            <span className={styles.infoLabel}>Preferred time of day</span>
            <span className={styles.infoValue}>{preferredTimeLabel}</span>
          </div>
          <div className={styles.preferenceCol}>
            <span className={styles.infoLabel}>Preferred day of the week</span>
            <span className={styles.infoValue}>{preferredDay}</span>
          </div>
        </div>

        <div className={styles.scheduleSection}>
          <h3 className={styles.sectionHeading}>
            We schedule this specifically for
          </h3>
          <div className={styles.scheduleRow}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Exact Date</label>
              <input
                type="date"
                className={styles.formInput}
                value={scheduledDate}
                onChange={e => onScheduledDateChange(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Exact Time</label>
              <input
                type="time"
                step="600"
                className={styles.formInput}
                value={scheduledTime}
                onChange={e => onScheduledTimeChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={handleConfirm}
            disabled={isDisabled}
          >
            <CalendarCheck size={18} />
            {isSubmitting ? 'Sending...' : 'Done & Send Email Confirmation'}
          </button>
        </div>
      </div>
    </div>
  );
}
