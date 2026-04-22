'use client';

import { CustomDropdown } from '@/components/Common/CustomDropdown/CustomDropdown';
import { TimeOption, DEFAULT_TIME_OPTIONS, getEnabledTimeOptions } from '@/lib/time-options';
import styles from './QuickQuoteStep4.module.scss';

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
  timeOptions?: TimeOption[];
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
  timeOptions,
}: QuickQuoteStep4Props) {
  const customerName = [customerData.firstName, customerData.lastName]
    .filter(Boolean)
    .join(' ');
  const customerAddress = [customerData.streetAddress, customerData.city, customerData.state]
    .filter(Boolean)
    .join(', ');
  const pestLabel = selectedPest.custom_label || selectedPest.name;
  const isOneTime = selectedPlan?.plan_category === 'one-time';

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
            <label className={styles.label}>Preferred Day</label>
            <select
              className={styles.dateInput}
              value={requestedDate}
              onChange={(e) => onDateChange(e.target.value)}
            >
              <option value="">No preference</option>
              <option value="monday">Monday</option>
              <option value="tuesday">Tuesday</option>
              <option value="wednesday">Wednesday</option>
              <option value="thursday">Thursday</option>
              <option value="friday">Friday</option>
            </select>
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
                options={getEnabledTimeOptions(timeOptions || DEFAULT_TIME_OPTIONS)}
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
