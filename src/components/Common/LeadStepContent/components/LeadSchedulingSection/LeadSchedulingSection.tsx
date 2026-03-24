'use client';

import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { QuoteSummaryCard } from '@/components/Common/QuoteSummaryCard/QuoteSummaryCard';
import { NotesSection } from '@/components/Common/NotesSection/NotesSection';
import { CalendarCheck } from 'lucide-react';
import { useActiveSection } from '@/contexts/ActiveSectionContext';
import { useUser } from '@/hooks/useUser';
import { LeadSchedulingSectionProps } from '../../types/leadStepTypes';
import styles from './LeadSchedulingSection.module.scss';
import cardStyles from '@/components/Common/InfoCard/InfoCard.module.scss';

function formatCurrency(amount: number): string {
  const rounded = Math.round(amount);
  return `$${rounded}`;
}

function formatFrequency(freq: string | null | undefined): string {
  if (!freq) return '';
  return freq.charAt(0).toUpperCase() + freq.slice(1).toLowerCase();
}

export function LeadSchedulingSection({
  lead,
  quote,
  isQuoteUpdating,
  scheduledDate,
  scheduledTime,
  confirmationNote,
  customerComment,
  onScheduledDateChange,
  onScheduledTimeChange,
  onConfirmationNoteChange,
  onFinalizeSale,
  onEmailQuote,
  isSidebarExpanded,
}: LeadSchedulingSectionProps) {
  const { activeSection, setActiveSection } = useActiveSection();
  const { user } = useUser();
  // Disable finalize button if date or time is missing
  const isFinalizeSaleDisabled = !scheduledDate || !scheduledTime;

  const lineItems = quote?.line_items ?? [];
  const hasMultipleItems = lineItems.length >= 2;

  return (
    <div
      className={`${styles.sectionWrapper} ${activeSection === 'scheduling' ? styles.active : ''}`}
      onClick={() => setActiveSection('scheduling')}
    >
      <InfoCard
        title="Scheduling"
        icon={<CalendarCheck size={20} />}
        isCollapsible={true}
        startExpanded={true}
        isActive={activeSection === 'scheduling'}
      >
      <div
        className={styles.cardContent}
        data-sidebar-expanded={isSidebarExpanded}
      >
        {/* Service Confirmation Section */}
        <div className={styles.section}>
          <h4 className={cardStyles.defaultText}>Service Confirmation</h4>
          {lineItems.length > 0 && (
            <div className={styles.pricingSummary}>
              {lineItems.map((item: any, index: number) => (
                <div
                  key={index}
                  className={styles.pricingRow}
                >
                  <div className={styles.pricingName}>
                    {item.plan_name}
                    {item.service_frequency && (
                      <div className={styles.pricingFrequency}>
                        {formatFrequency(item.service_frequency)}
                      </div>
                    )}
                  </div>
                  <div className={styles.pricingInitial}>
                    {item.final_initial_price ? formatCurrency(item.final_initial_price) : '—'}
                  </div>
                  <div className={styles.pricingRecurring}>
                    {item.final_recurring_price
                      ? `${formatCurrency(item.final_recurring_price)}/${item.billing_frequency?.toLowerCase()?.charAt(0) === 'm' ? 'mo' : item.billing_frequency?.toLowerCase()?.charAt(0) ?? 'mo'}`
                      : '—'}
                  </div>
                </div>
              ))}
              {hasMultipleItems && (
                <div className={styles.pricingRowTotal}>
                  <div className={styles.pricingName}>Total</div>
                  <div className={styles.pricingInitial}>
                    {quote?.total_initial_price ? formatCurrency(quote.total_initial_price) : '—'}
                  </div>
                  <div className={styles.pricingRecurring}>
                    {quote?.total_recurring_price
                      ? `${formatCurrency(quote.total_recurring_price)}/mo`
                      : '—'}
                  </div>
                </div>
              )}
            </div>
          )}
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
                onClick={onFinalizeSale}
                disabled={isFinalizeSaleDisabled}
              >
                <CalendarCheck size={18} />
                Finalize Sale
              </button>
            </div>
          </div>
        </div>
        <div className={styles.section}>
          <h4 className={cardStyles.defaultText}>Notes</h4>
          <NotesSection
            entityType="lead"
            entityId={lead.id}
            companyId={lead.company_id}
            userId={user?.id || ''}
            customerComment={customerComment}
            readOnly
          />
        </div>
      </div>
    </InfoCard>
    </div>
  );
}
