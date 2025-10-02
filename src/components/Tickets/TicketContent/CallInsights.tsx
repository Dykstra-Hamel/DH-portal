import React from 'react'
import { Ticket } from '@/types/ticket'
import { CallRecord } from '@/types/call-record'
import styles from './CallInsights.module.scss'

interface CallInsightsProps {
  ticket: Ticket
  callRecord?: CallRecord
  isEditable?: boolean
  onUpdate?: (insightsData: any) => void
}

export default function CallInsights({
  ticket,
  callRecord,
}: CallInsightsProps) {
  // Determine if this is a form submission
  const isFormSubmission = ticket.type === 'web_form'

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

        {!isFormSubmission && (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}