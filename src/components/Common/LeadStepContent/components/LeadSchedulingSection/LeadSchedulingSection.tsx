'use client';

import React from 'react';
import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { QuoteSummaryCard } from '@/components/Common/QuoteSummaryCard/QuoteSummaryCard';
import { NotesSection } from '@/components/Common/NotesSection/NotesSection';
import { CalendarCheck } from 'lucide-react';
import { useActiveSection } from '@/contexts/ActiveSectionContext';
import { useUser } from '@/hooks/useUser';
import { LeadSchedulingSectionProps } from '../../types/leadStepTypes';
import { DEFAULT_TIME_OPTIONS } from '@/lib/time-options';
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
  timeOptions,
  unwrapped,
}: LeadSchedulingSectionProps) {
  const { activeSection, setActiveSection } = useActiveSection();
  const { user } = useUser();
  // Disable finalize button if date or time is missing
  const isFinalizeSaleDisabled = !scheduledDate || !scheduledTime;

  const lineItems = quote?.line_items ?? [];
  const hasMultipleItems = lineItems.length >= 2;

  const body = (
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
          {(lead.requested_date || lead.requested_time) && (
            <div className={styles.preferenceRow}>
              <span className={styles.preferenceLabel}>Customer Preference:</span>
              {lead.requested_date && (
                <span className={styles.preferenceValue}>
                  {lead.requested_date.charAt(0).toUpperCase() + lead.requested_date.slice(1)}
                </span>
              )}
              {lead.requested_time && (
                <span className={styles.preferenceValue}>
                  {(timeOptions || DEFAULT_TIME_OPTIONS).find(o => o.value === lead.requested_time)?.label ?? lead.requested_time}
                </span>
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

        {Array.isArray(quote?.safety_checklist_responses) && quote.safety_checklist_responses.length > 0 && (() => {
          type ChecklistResponse = {
            questionId: string;
            questionText: string;
            answerType: string;
            answer: string;
            parentQuestionId?: string;
            conditionalQuestion?: string;
            conditionalAnswer?: string;
          };
          const responses: ChecklistResponse[] = quote.safety_checklist_responses;
          const rootResponses = responses.filter((r) => !r.parentQuestionId);
          const childrenOf = (id: string) => responses.filter((r) => r.parentQuestionId === id);

          const renderAnswer = (r: ChecklistResponse, isChild = false): React.ReactNode => (
            <div key={r.questionId} className={isChild ? styles.checklistConditional : undefined}>
              <div className={styles.checklistRow}>
                {isChild && <span className={styles.checklistArrow}>&#8627;</span>}
                <span className={styles.checklistQuestion}>{r.questionText}</span>
                {r.answerType === 'yes_no' ? (
                  <span className={`${styles.checklistBadge} ${r.answer === 'yes' ? styles.badgeYes : styles.badgeNo}`}>
                    {r.answer === 'yes' ? 'Yes' : 'No'}
                  </span>
                ) : (
                  <span className={styles.checklistAnswer}>{r.answer}</span>
                )}
              </div>
              {r.conditionalQuestion && r.answer === 'yes' && r.conditionalAnswer && (
                <div className={styles.checklistConditional}>
                  <div className={styles.checklistRow}>
                    <span className={styles.checklistArrow}>&#8627;</span>
                    <span className={styles.checklistQuestion}>{r.conditionalQuestion}</span>
                    <span className={styles.checklistAnswer}>{r.conditionalAnswer}</span>
                  </div>
                </div>
              )}
              {childrenOf(r.questionId).map((child) => renderAnswer(child, true))}
            </div>
          );

          return (
            <div className={styles.section}>
              <h4 className={cardStyles.defaultText}>Safety Checklist</h4>
              <div className={styles.checklistList}>
                {rootResponses.map((r, i) => (
                  <div key={r.questionId ?? i}>{renderAnswer(r)}</div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>
  );

  if (unwrapped) return body;

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
        {body}
      </InfoCard>
    </div>
  );
}
