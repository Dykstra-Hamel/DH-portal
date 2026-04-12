'use client';

import { CustomDropdown } from '@/components/Common/CustomDropdown/CustomDropdown';
import styles from './QuickQuoteStep4.module.scss';

const TIME_PREFERENCE_OPTIONS = [
  { value: 'morning', label: 'Morning (8am–12pm)' },
  { value: 'afternoon', label: 'Afternoon (12pm–5pm)' },
  { value: 'evening', label: 'Evening (5pm–8pm)' },
  { value: 'anytime', label: 'Anytime' },
];

interface ServicePlan {
  id: string;
  plan_name: string;
  initial_price: number;
  recurring_price: number;
  billing_frequency: string;
  plan_category: string;
}

interface PestOption {
  name: string;
  custom_label: string | null;
}

interface CustomerData {
  firstName: string;
  lastName: string;
  streetAddress?: string;
  city?: string;
  state?: string;
}

interface QuickQuoteStep4Props {
  selectedPest: PestOption;
  selectedPlan: ServicePlan | null;
  customerData: CustomerData;
  homeSize: string;
  requestedDate: string;
  requestedTime: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submitError: string | null;
  hasSchedulingPermission: boolean;
}

function formatPrice(price: number): string {
  return `$${price.toFixed(0)}`;
}

function getBillingLabel(frequency: string): string {
  const map: Record<string, string> = {
    monthly: '/mo',
    quarterly: '/quarter',
    annually: '/year',
    'one-time': '',
  };
  return map[frequency] ?? `/${frequency}`;
}

export default function QuickQuoteStep4({
  selectedPest,
  selectedPlan,
  customerData,
  homeSize,
  requestedDate,
  requestedTime,
  onDateChange,
  onTimeChange,
  onSubmit,
  isSubmitting,
  submitError,
  hasSchedulingPermission,
}: QuickQuoteStep4Props) {
  const customerName = [customerData.firstName, customerData.lastName]
    .filter(Boolean)
    .join(' ');
  const customerAddress = [customerData.streetAddress, customerData.city, customerData.state]
    .filter(Boolean)
    .join(', ');
  const pestLabel = selectedPest.custom_label || selectedPest.name;
  const isOneTime = selectedPlan?.plan_category === 'one-time';

  // Minimum date is today
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className={styles.step}>
      <div className={styles.content}>
        {/* Summary */}
        <div className={styles.summaryCard}>
          <p className={styles.summaryTitle}>Scheduling Summary</p>
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Customer</span>
            <span className={styles.summaryValue}>{customerName || '—'}</span>
          </div>
          {customerAddress && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Address</span>
              <span className={styles.summaryValue}>{customerAddress}</span>
            </div>
          )}
          <div className={styles.summaryRow}>
            <span className={styles.summaryLabel}>Pest</span>
            <span className={styles.summaryValue}>{pestLabel}</span>
          </div>
          {selectedPlan && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Plan</span>
              <span className={styles.summaryValue}>
                {selectedPlan.plan_name} &mdash;{' '}
                {formatPrice(selectedPlan.initial_price)} initial
                {!isOneTime && selectedPlan.recurring_price > 0 && (
                  <>, {formatPrice(selectedPlan.recurring_price)}{getBillingLabel(selectedPlan.billing_frequency)}</>
                )}
              </span>
            </div>
          )}
          {homeSize && (
            <div className={styles.summaryRow}>
              <span className={styles.summaryLabel}>Home Size</span>
              <span className={styles.summaryValue}>{homeSize}</span>
            </div>
          )}
        </div>

        {/* Scheduling fields */}
        <div className={styles.formSection}>
          <p className={styles.sectionTitle}>Requested Appointment</p>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              {hasSchedulingPermission ? 'Scheduled Date' : 'Preferred Date'}
            </label>
            <input
              type="date"
              className={styles.dateInput}
              value={requestedDate}
              min={today}
              onChange={(e) => onDateChange(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              {hasSchedulingPermission ? 'Scheduled Time' : 'Time Preference'}
            </label>
            {hasSchedulingPermission ? (
              <input
                type="time"
                className={styles.dateInput}
                value={requestedTime}
                onChange={(e) => onTimeChange(e.target.value)}
              />
            ) : (
              <CustomDropdown
                options={TIME_PREFERENCE_OPTIONS}
                value={requestedTime}
                onChange={onTimeChange}
                placeholder="Select time preference"
              />
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        {submitError && (
          <span className={styles.errorText}>{submitError}</span>
        )}
        <button
          type="button"
          className={styles.primaryBtn}
          onClick={onSubmit}
          disabled={isSubmitting || !selectedPlan}
        >
          {isSubmitting
            ? (hasSchedulingPermission ? 'Scheduling\u2026' : 'Sending\u2026')
            : (hasSchedulingPermission ? 'Confirm Schedule' : 'Send to Scheduling')}
        </button>
      </div>
    </div>
  );
}
