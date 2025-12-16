'use client';

import { TabCard } from '@/components/Common/TabCard/TabCard';
import { QuoteSummaryCard } from '@/components/Common/QuoteSummaryCard/QuoteSummaryCard';
import { CalendarCheck } from 'lucide-react';
import { LeadSchedulingSectionProps } from '../../types/leadStepTypes';
import styles from './LeadSchedulingSection.module.scss';

interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

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
  const scheduleTabs: TabItem[] = [
    {
      id: 'quote_summary',
      label: 'Quote Summary',
      content: (
        <div className={styles.cardContent}>
          <QuoteSummaryCard
            quote={quote}
            lead={lead}
            isUpdating={isQuoteUpdating}
            onEmailQuote={onEmailQuote}
            hideCard={true}
          />
        </div>
      ),
    },
    {
      id: 'service_confirmation',
      label: 'Service Confirmation',
      content: (
        <div className={styles.cardContent}>
          <h3 className={styles.scheduleTabHeading}>Service Confirmation</h3>
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
      ),
    },
  ];

  return <TabCard tabs={scheduleTabs} defaultTabId="quote_summary" />;
}
