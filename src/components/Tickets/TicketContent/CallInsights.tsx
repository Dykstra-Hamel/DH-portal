import React from 'react'
import { Ticket } from '@/types/ticket'
import { CallRecord } from '@/types/call-record'
import { FormSubmission } from '@/types/form-submission'
import styles from './CallInsights.module.scss'

interface CallInsightsProps {
  ticket: Ticket
  callRecord?: CallRecord
  formSubmission?: FormSubmission
  isEditable?: boolean
  onUpdate?: (insightsData: any) => void
}

export default function CallInsights({
  ticket,
  callRecord,
  formSubmission,
}: CallInsightsProps) {
  // Determine if this is a form submission
  const isFormSubmission = ticket.type === 'web_form'
  const isFailed = formSubmission?.processing_status === 'failed'

  if (isFormSubmission) {
    return (
      <div className={styles.simpleContainer}>
        <div className={styles.singleColumn}>
          {isFailed && (
            <div className={styles.infoField}>
              <span className={styles.label}>⚠️ Processing Status</span>
              <span className={styles.value} style={{ color: '#ef4444' }}>
                AI processing failed - showing fallback summary
              </span>
            </div>
          )}

          {isFailed && formSubmission?.processing_error && (
            <div className={styles.infoField}>
              <span className={styles.label}>Error Details</span>
              <span className={styles.value} style={{ fontSize: '12px', color: '#6b7280' }}>
                {formSubmission.processing_error}
              </span>
            </div>
          )}

          {ticket.description && (
            <div className={styles.infoField}>
              <span className={styles.label}>{isFailed ? 'Fallback Summary' : 'AI Summary'}</span>
              <span className={styles.value}>{ticket.description}</span>
            </div>
          )}

          {formSubmission?.source_url && (
            <div className={styles.infoField}>
              <span className={styles.label}>Source</span>
              <span className={styles.value}>
                <a href={formSubmission.source_url} target="_blank" rel="noopener noreferrer">
                  {formSubmission.source_url}
                </a>
              </span>
            </div>
          )}

          {formSubmission?.gemini_confidence !== null && formSubmission?.gemini_confidence !== undefined && (
            <div className={styles.infoField}>
              <span className={styles.label}>AI Confidence</span>
              <span className={styles.value}>
                {Math.round((formSubmission.gemini_confidence || 0) * 100)}%
              </span>
            </div>
          )}

          <div className={styles.infoField}>
            <span className={styles.label}>Primary Pest Issue</span>
            <span className={styles.value}>
              {ticket.pest_type || formSubmission?.normalized_data?.pest_issue || 'Not specified'}
            </span>
          </div>

          {formSubmission?.normalized_data?.own_or_rent && (
            <div className={styles.infoField}>
              <span className={styles.label}>Property Status</span>
              <span className={styles.value}>
                {formSubmission.normalized_data.own_or_rent === 'own' ? 'Owner' :
                 formSubmission.normalized_data.own_or_rent === 'rent' ? 'Renter' :
                 'Unknown'}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.simpleContainer}>
      <div className={styles.singleColumn}>
        <div className={styles.infoField}>
          <span className={styles.label}>Sentiment</span>
          <span className={`${styles.value} ${styles.sentiment} ${styles[callRecord?.sentiment?.toLowerCase() || 'neutral']}`}>
            {callRecord?.sentiment || 'Neutral'}
          </span>
        </div>

        <div className={styles.infoField}>
          <span className={styles.label}>Source</span>
          <span className={styles.value}>
            {ticket.source === 'google_cpc' ? 'Paid Advertisement' :
             ticket.source === 'organic' ? 'Organic' :
             ticket.source === 'referral' ? 'Referral' :
             'Other'}
          </span>
        </div>

        <div className={styles.infoField}>
          <span className={styles.label}>Primary Pest Issue</span>
          <span className={styles.value}>
            {callRecord?.pest_issue || ticket.pest_type || 'Termites'}
          </span>
        </div>

        <div className={styles.infoField}>
          <span className={styles.label}>Preferred Service Time</span>
          <span className={styles.value}>
            {callRecord?.preferred_service_time || 'Anytime'}
          </span>
        </div>

        <div className={styles.infoField}>
          <span className={styles.label}>Disconnect Reason</span>
          <span className={styles.value}>
            {callRecord?.disconnect_reason || 'Agent Hang-up'}
          </span>
        </div>

        <div className={styles.infoField}>
          <span className={styles.label}>Data Opt-Out</span>
          <span className={styles.value}>
            {callRecord?.opt_out_sensitive_data_storage ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
    </div>
  )
}