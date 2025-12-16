'use client';

import { useState } from 'react';
import { TabCard, TabItem } from '@/components/Common/TabCard/TabCard';
import { SalesCadenceCard } from '@/components/Common/SalesCadenceCard/SalesCadenceCard';
import { Phone, MessageSquareMore, Mail } from 'lucide-react';
import { LeadContactSectionProps } from '../../types/leadStepTypes';
import styles from './LeadContactSection.module.scss';
import cadenceStyles from '@/components/Common/SalesCadenceCard/SalesCadenceCard.module.scss';
import cardStyles from '@/components/Common/InfoCard/InfoCard.module.scss';

export function LeadContactSection({
  lead,
  nextTask,
  loadingNextTask,
  hasActiveCadence,
  selectedActionType,
  activityNotes,
  isLoggingActivity,
  selectedCadenceId,
  isStartingCadence,
  onActionTypeChange,
  onActivityNotesChange,
  onLogActivity,
  onCadenceSelect,
  onStartCadence,
  onShowToast,
  onLeadUpdate,
}: LeadContactSectionProps) {
  const handleLogActivityClick = async () => {
    // Check if this activity matches the next recommended action
    const activityMatchesTask =
      nextTask && nextTask.action_type === selectedActionType;

    // Call the parent handler with match info
    await onLogActivity(
      selectedActionType,
      activityNotes || '',
      activityMatchesTask
    );
  };

  const contactingTabs: TabItem[] = [
    {
      id: 'contact',
      label: 'Contact Log',
      content: (
        <div className={styles.cardContent}>
          <div>
            <h4 className={cardStyles.defaultText}>
              Next Recommended Action:
            </h4>
            {loadingNextTask ? (
              <div className={cardStyles.dataLabel}>Loading...</div>
            ) : hasActiveCadence ? (
              // Active cadence exists - show next task or completion message
              nextTask ? (
                <div className={cadenceStyles.stepItem}>
                  <div className={cadenceStyles.stepIcon}>
                    {nextTask.action_type === 'live_call' ||
                    nextTask.action_type === 'outbound_call' ||
                    nextTask.action_type === 'ai_call' ? (
                      <Phone size={16} />
                    ) : nextTask.action_type === 'text_message' ? (
                      <MessageSquareMore size={16} />
                    ) : nextTask.action_type === 'email' ? (
                      <Mail size={16} />
                    ) : (
                      <MessageSquareMore size={16} />
                    )}
                  </div>
                  <div className={cadenceStyles.stepContent}>
                    <div className={cadenceStyles.stepHeader}>
                      <span className={cardStyles.inputText}>
                        Day {nextTask.day_number}:{' '}
                        {nextTask.time_of_day === 'AM'
                          ? 'Morning'
                          : nextTask.time_of_day === 'PM'
                            ? 'Afternoon'
                            : nextTask.time_of_day}{' '}
                        {nextTask.action_type === 'live_call'
                          ? 'Call'
                          : nextTask.action_type === 'outbound_call'
                            ? 'Outbound Call'
                            : nextTask.action_type === 'ai_call'
                              ? 'AI Call'
                              : nextTask.action_type === 'text_message'
                                ? 'Text'
                                : nextTask.action_type === 'email'
                                  ? 'Email'
                                  : nextTask.action_type}
                      </span>
                      <div className={cadenceStyles.priorityIndicator}>
                        <span className={cardStyles.inputText}>
                          {nextTask.priority.charAt(0).toUpperCase() +
                            nextTask.priority.slice(1)}
                        </span>
                        <div
                          className={`${cadenceStyles.priorityDot} ${
                            nextTask.priority === 'urgent'
                              ? cadenceStyles.priorityDotUrgent
                              : nextTask.priority === 'high'
                                ? cadenceStyles.priorityDotHigh
                                : nextTask.priority === 'low'
                                  ? cadenceStyles.priorityDotLow
                                  : cadenceStyles.priorityDotMedium
                          }`}
                        >
                          <div className={cadenceStyles.priorityDotInner} />
                        </div>
                      </div>
                    </div>
                    {nextTask.due_date && nextTask.due_time ? (
                      <div className={cardStyles.dataLabel}>
                        Target:{' '}
                        {new Date(
                          nextTask.due_date + 'T00:00:00'
                        ).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'numeric',
                          day: 'numeric',
                        })}{' '}
                        |{' '}
                        {new Date(
                          `1970-01-01T${nextTask.due_time}`
                        ).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </div>
                    ) : nextTask.due_date ? (
                      <div className={cardStyles.dataLabel}>
                        Target:{' '}
                        {new Date(
                          nextTask.due_date + 'T00:00:00'
                        ).toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'numeric',
                          day: 'numeric',
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className={cardStyles.dataLabel}>
                  All cadence steps completed! 🎉
                </div>
              )
            ) : (
              <div className={styles.infoBanner}>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="10"
                    cy="10"
                    r="9"
                    stroke="#3b82f6"
                    strokeWidth="2"
                  />
                  <path
                    d="M10 6V10M10 14H10.01"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span className={styles.infoBannerText}>
                  Select a sales cadence to automatically create and schedule
                  your tasks!
                </span>
              </div>
            )}
          </div>

          <div>
            <h4 className={cardStyles.defaultText}>
              Select activity to log:
            </h4>
            <div className={styles.tabContainer}>
              {[
                { id: 'outbound_call', label: 'Outbound Call' },
                { id: 'text_message', label: 'Text Message' },
                { id: 'ai_call', label: 'AI Call' },
                { id: 'email', label: 'Email' },
              ].map((tab, index, array) => (
                <button
                  key={tab.id}
                  onClick={() => onActionTypeChange(tab.id)}
                  className={`${styles.tabButton} ${
                    selectedActionType === tab.id
                      ? styles.active
                      : styles.inactive
                  } ${index === 0 ? styles.firstTab : ''} ${
                    index === array.length - 1 ? styles.lastTab : ''
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={styles.textareaLabel}>
              Comment <span className={styles.optionalLabel}>(optional)</span>
            </label>
            <textarea
              value={activityNotes}
              onChange={e => onActivityNotesChange(e.target.value)}
              placeholder={
                selectedActionType === 'outbound_call'
                  ? 'Add details about this call'
                  : selectedActionType === 'text_message'
                    ? 'Add details about this text message'
                    : selectedActionType === 'ai_call'
                      ? 'Add details about this AI call'
                      : selectedActionType === 'email'
                        ? 'Add details about this email'
                        : 'Add a comment to ticket history'
              }
              className={styles.activityTextarea}
            />
          </div>

          {selectedActionType && (
            <div className={styles.activityActions}>
              <button
                onClick={handleLogActivityClick}
                disabled={isLoggingActivity}
                className={styles.logActivityButton}
              >
                {isLoggingActivity ? 'Logging...' : 'Log Activity'}
              </button>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'cadence',
      label: 'Sales Cadence',
      content: (
        <SalesCadenceCard
          leadId={lead.id}
          companyId={lead.company_id}
          leadCreatedAt={lead.created_at}
          onCadenceSelect={onCadenceSelect}
          onStartCadence={onStartCadence}
          isStartingCadence={isStartingCadence}
          hideCard={true}
        />
      ),
    },
  ];

  return <TabCard tabs={contactingTabs} defaultTabId="contact" />;
}
