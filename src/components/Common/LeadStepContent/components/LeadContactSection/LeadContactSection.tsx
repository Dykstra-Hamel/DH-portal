'use client';

import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { SalesCadenceCard } from '@/components/Common/SalesCadenceCard/SalesCadenceCard';
import { ActionTypeDropdown } from '@/components/Common/ActionTypeDropdown';
import { Phone, MessageSquareMore, Mail, SquareUserRound } from 'lucide-react';
import { useActiveSection } from '@/contexts/ActiveSectionContext';
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
  onActionTypeChange,
  onActivityNotesChange,
  onLogActivity,
  onCadenceSelect,
  onShowToast,
  onLeadUpdate,
  onViewLogHistory,
  isSidebarExpanded,
}: LeadContactSectionProps) {
  const { activeSection, setActiveSection } = useActiveSection();

  const handleLogActivityClick = async () => {
    // Check if this activity matches the next recommended action
    const activityMatchesTask =
      nextTask && nextTask.action_type === selectedActionType;

    // Call the parent handler with match info
    await onLogActivity(
      selectedActionType,
      activityNotes || '',
      !!activityMatchesTask
    );
  };

  return (
    <div
      className={`${styles.sectionWrapper} ${activeSection === 'contact' ? styles.active : ''}`}
      onClick={() => setActiveSection('contact')}
    >
      <InfoCard
        title="Communication"
        icon={<SquareUserRound size={20} />}
        isCollapsible={true}
        startExpanded={true}
      >
        <div
          className={styles.cardContent}
          data-sidebar-expanded={isSidebarExpanded}
        >
          {/* 2-Column Grid Layout */}
          <div className={styles.twoColumnGrid}>
            {/* Left Column - Dropdowns */}
            <div className={styles.leftColumn}>
              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Log Attempt:</label>
                <ActionTypeDropdown
                  value={selectedActionType}
                  onChange={onActionTypeChange}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.fieldLabel}>Sales Cadence:</label>
                <SalesCadenceCard
                  leadId={lead.id}
                  companyId={lead.company_id}
                  leadCreatedAt={lead.created_at}
                  onCadenceSelect={onCadenceSelect}
                  hideCard={true}
                />
              </div>
            </div>

            {/* Right Column - Comment & Buttons */}
            <div className={styles.rightColumn}>
              <div className={styles.commentSection}>
                <label className={styles.fieldLabel}>
                  Comment{' '}
                  <span className={styles.optionalLabel}>(optional)</span>
                </label>
                <textarea
                  value={activityNotes}
                  onChange={e => onActivityNotesChange(e.target.value)}
                  placeholder="Add a comment to ticket history"
                  className={styles.activityTextarea}
                />
              </div>
            </div>
          </div>

          {/* Next Recommended Action - Full Width Below */}
          <div className={styles.fullWidthSection}>
            <div className={styles.nextActionSection}>
              <h4 className={styles.nextRecommendedHeader}>
                Next recommended action:
              </h4>
              {loadingNextTask ? (
                <div className={styles.dataLabel}>Loading...</div>
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
                          {nextTask.time_of_day === 'morning'
                            ? 'Morning'
                            : nextTask.time_of_day === 'afternoon'
                              ? 'Afternoon'
                              : nextTask.time_of_day}{' '}
                          {nextTask.action_type === 'live_call'
                            ? 'Call'
                            : nextTask.action_type === 'outbound_call'
                              ? 'Call'
                              : nextTask.action_type === 'ai_call'
                                ? 'AI Call'
                                : nextTask.action_type === 'text_message'
                                  ? 'Text'
                                  : nextTask.action_type === 'email'
                                    ? 'Email'
                                    : nextTask.action_type}
                        </span>
                      </div>
                      {nextTask.due_date && nextTask.due_time ? (
                        <div className={styles.dataLabel}>
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
                        <div className={styles.dataLabel}>
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
                  </div>
                ) : (
                  <div className={styles.dataLabel}>
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
                    className={styles.infoBannerIcon}
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
            <div className={styles.buttonGroup}>
              <button
                type="button"
                className={styles.viewHistoryButton}
                onClick={() => {
                  if (onViewLogHistory) {
                    onViewLogHistory();
                  }
                }}
              >
                View Log History
              </button>
              {selectedActionType && (
                <button
                  type="button"
                  onClick={handleLogActivityClick}
                  disabled={isLoggingActivity}
                  className={styles.logActivityButton}
                >
                  {isLoggingActivity ? 'Logging...' : 'Log Activity'}
                </button>
              )}
            </div>
          </div>
        </div>
      </InfoCard>
    </div>
  );
}
