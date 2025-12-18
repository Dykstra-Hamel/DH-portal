'use client';

import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { QuoteSummaryCard } from '@/components/Common/QuoteSummaryCard/QuoteSummaryCard';
import { CalendarCheck } from 'lucide-react';
import { LeadSchedulingSectionProps } from '../../types/leadStepTypes';
import styles from './LeadSchedulingSection.module.scss';
import cardStyles from '@/components/Common/InfoCard/InfoCard.module.scss';

export function LeadSchedulingSection({
  lead,
  quote,
  isQuoteUpdating,
  scheduledDate,
  scheduledTime,
  confirmationNote,
  onScheduledDateChange,
  onScheduledTimeChange,
  onConfirmationNoteChange,
  onShowServiceConfirmationModal,
  onEmailQuote,
}: LeadSchedulingSectionProps) {
  return (
    <InfoCard
      title="Scheduling"
      icon={<CalendarCheck size={20} />}
      isCollapsible={true}
      startExpanded={true}
    >
      <div className={styles.cardContent}>
        {/* Quote Summary Section */}
        <div className={styles.section}>
          <h4 className={cardStyles.defaultText}>Quote Summary</h4>
          <QuoteSummaryCard
            quote={quote}
            lead={lead}
            isUpdating={isQuoteUpdating}
            onEmailQuote={onEmailQuote}
            hideCard={true}
          />
        </div>

        {/* Service Confirmation Section */}
        <div className={styles.section}>
          <h4 className={cardStyles.defaultText}>Service Confirmation</h4>
          <div className={styles.confirmationForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Scheduled Date</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={scheduledDate}
                  onChange={e => onScheduledDateChange(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Scheduled Time</label>
                <input
                  type="time"
                  className={styles.formInput}
                  value={scheduledTime}
                  onChange={e => onScheduledTimeChange(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Notes</label>
              <textarea
                className={styles.formTextarea}
                placeholder="Add any notes about the scheduled service..."
                rows={4}
                value={confirmationNote}
                onChange={e => onConfirmationNoteChange(e.target.value)}
              />
            </div>
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.finalizeSaleButton}
                onClick={onShowServiceConfirmationModal}
              >
                <CalendarCheck size={18} />
                Finalize Sale
              </button>
            </div>
          </div>
        </div>
      </div>
    </InfoCard>
  );
}
