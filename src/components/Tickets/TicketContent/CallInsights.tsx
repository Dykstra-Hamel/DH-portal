import React, { useState } from 'react'
import { Edit3 } from 'lucide-react'
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
  isEditable = false,
  onUpdate
}: CallInsightsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    sentiment: callRecord?.sentiment || 'Neutral',
    primary_pest_issue: callRecord?.pest_issue || 'Termites',
    preferred_service_time: callRecord?.preferred_service_time || 'Anytime',
    disconnect_reason: callRecord?.disconnect_reason || 'Agent Hang-up',
    opt_out_data: callRecord?.opt_out_sensitive_data_storage || false
  })

  const handleSave = () => {
    onUpdate?.(editData)
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData({
      sentiment: callRecord?.sentiment || 'Neutral',
      primary_pest_issue: callRecord?.pest_issue || 'Termites',
      preferred_service_time: callRecord?.preferred_service_time || 'Anytime',
      disconnect_reason: callRecord?.disconnect_reason || 'Agent Hang-up',
      opt_out_data: callRecord?.opt_out_sensitive_data_storage || false
    })
    setIsEditing(false)
  }

  // Determine if this is a form submission
  const isFormSubmission = ticket.type === 'web_form'

  if (isEditing) {
    return (
      <div className={`${styles.section} ${styles.editing}`}>
        <div className={`${styles.sectionHeader} ${isEditing ? styles.editing : ''}`}>
          <div className={styles.headerLeft}>
            <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13.0555 3.04004V6.37341M16.3889 6.92897V9.15122M11.3888 4.70673H14.7222M15.2778 8.0401H17.5M6.68529 13.8548L2.85955 12.445C2.75406 12.4061 2.66304 12.3357 2.59875 12.2435C2.53447 12.1512 2.5 12.0415 2.5 11.929C2.5 11.8166 2.53447 11.7068 2.59875 11.6146C2.66304 11.5223 2.75406 11.452 2.85955 11.4131L6.68529 10.0033L8.09503 6.17758C8.13397 6.07209 8.2043 5.98107 8.29656 5.91678C8.38882 5.85249 8.49856 5.81803 8.61101 5.81803C8.72345 5.81803 8.8332 5.85249 8.92546 5.91678C9.01771 5.98107 9.08805 6.07209 9.12699 6.17758L10.5367 10.0033L14.3625 11.4131C14.468 11.452 14.559 11.5223 14.6233 11.6146C14.6875 11.7068 14.722 11.8166 14.722 11.929C14.722 12.0415 14.6875 12.1512 14.6233 12.2435C14.559 12.3357 14.468 12.4061 14.3625 12.445L10.5367 13.8548L9.12699 17.6805C9.08805 17.786 9.01771 17.877 8.92546 17.9413C8.8332 18.0056 8.72345 18.04 8.61101 18.04C8.49856 18.04 8.38882 18.0056 8.29656 17.9413C8.2043 17.877 8.13397 17.786 8.09503 17.6805L6.68529 13.8548Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h3>{isFormSubmission ? 'Form Insights' : 'Call Insights'}</h3>
          </div>
        </div>

        <div className={styles.editForm}>
          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>Sentiment</label>
              <select
                value={editData.sentiment}
                onChange={(e) => setEditData({ ...editData, sentiment: e.target.value })}
                className={styles.select}
              >
                <option value="Positive">Positive</option>
                <option value="Neutral">Neutral</option>
                <option value="Negative">Negative</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label>Source</label>
              <select
                value={ticket.source}
                disabled
                className={styles.select}
              >
                <option value="paid_advertisement">Paid Advertisement</option>
                <option value="organic">Organic</option>
                <option value="referral">Referral</option>
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label>Primary Pest Issue</label>
              <select
                value={editData.primary_pest_issue}
                onChange={(e) => setEditData({ ...editData, primary_pest_issue: e.target.value })}
                className={styles.select}
              >
                <option value="Termites">Termites</option>
                <option value="Ants">Ants</option>
                <option value="Roaches">Roaches</option>
                <option value="Spiders">Spiders</option>
                <option value="Mice/Rats">Mice/Rats</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className={styles.formField}>
              <label>Preferred Service Time</label>
              <select
                value={editData.preferred_service_time}
                onChange={(e) => setEditData({ ...editData, preferred_service_time: e.target.value })}
                className={styles.select}
              >
                <option value="Anytime">Anytime</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Weekends">Weekends</option>
              </select>
            </div>
          </div>

          {!isFormSubmission && (
            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label>Disconnect Reason</label>
                <select
                  value={editData.disconnect_reason}
                  onChange={(e) => setEditData({ ...editData, disconnect_reason: e.target.value })}
                  className={styles.select}
                >
                  <option value="Agent Hang-up">Agent Hang-up</option>
                  <option value="Customer Hang-up">Customer Hang-up</option>
                  <option value="Call Completed">Call Completed</option>
                  <option value="Technical Issue">Technical Issue</option>
                </select>
              </div>
              <div className={styles.formField}>
                <label>Data Opt-Out</label>
                <select
                  value={editData.opt_out_data ? 'Yes' : 'No'}
                  onChange={(e) => setEditData({ ...editData, opt_out_data: e.target.value === 'Yes' })}
                  className={styles.select}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>
          )}

          <div className={styles.formActions}>
            <button onClick={handleCancel} className={styles.cancelButton}>
              Cancel
            </button>
            <button onClick={handleSave} className={styles.saveButton}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15.75 18.751V13.501C15.75 13.3021 15.671 13.1113 15.5303 12.9706C15.3897 12.83 15.1989 12.751 15 12.751H9C8.80109 12.751 8.61032 12.83 8.46967 12.9706C8.32902 13.1113 8.25 13.3021 8.25 13.501V18.751M8.25 5.25098V8.25098C8.25 8.44989 8.32902 8.64065 8.46967 8.78131C8.61032 8.92196 8.80109 9.00098 9 9.00098H14.25M14.4 5.25098C14.7957 5.25661 15.1731 5.41836 15.45 5.70098L18.3 8.55098C18.5826 8.82792 18.7444 9.20532 18.75 9.60098V17.251C18.75 17.6488 18.592 18.0303 18.3107 18.3116C18.0294 18.5929 17.6478 18.751 17.25 18.751H6.75C6.35218 18.751 5.97064 18.5929 5.68934 18.3116C5.40804 18.0303 5.25 17.6488 5.25 17.251V6.75098C5.25 6.35315 5.40804 5.97162 5.68934 5.69032C5.97064 5.40901 6.35218 5.25098 6.75 5.25098H14.4Z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.headerLeft}>
          <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.0555 3.04004V6.37341M16.3889 6.92897V9.15122M11.3888 4.70673H14.7222M15.2778 8.0401H17.5M6.68529 13.8548L2.85955 12.445C2.75406 12.4061 2.66304 12.3357 2.59875 12.2435C2.53447 12.1512 2.5 12.0415 2.5 11.929C2.5 11.8166 2.53447 11.7068 2.59875 11.6146C2.66304 11.5223 2.75406 11.452 2.85955 11.4131L6.68529 10.0033L8.09503 6.17758C8.13397 6.07209 8.2043 5.98107 8.29656 5.91678C8.38882 5.85249 8.49856 5.81803 8.61101 5.81803C8.72345 5.81803 8.8332 5.85249 8.92546 5.91678C9.01771 5.98107 9.08805 6.07209 9.12699 6.17758L10.5367 10.0033L14.3625 11.4131C14.468 11.452 14.559 11.5223 14.6233 11.6146C14.6875 11.7068 14.722 11.8166 14.722 11.929C14.722 12.0415 14.6875 12.1512 14.6233 12.2435C14.559 12.3357 14.468 12.4061 14.3625 12.445L10.5367 13.8548L9.12699 17.6805C9.08805 17.786 9.01771 17.877 8.92546 17.9413C8.8332 18.0056 8.72345 18.04 8.61101 18.04C8.49856 18.04 8.38882 18.0056 8.29656 17.9413C8.2043 17.877 8.13397 17.786 8.09503 17.6805L6.68529 13.8548Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h3>{isFormSubmission ? 'Form Insights' : 'Call Insights'}</h3>
        </div>
        {isEditable && (
          <button
            onClick={() => setIsEditing(true)}
            className={styles.editButton}
            aria-label={`Edit ${isFormSubmission ? 'form' : 'call'} insights`}
          >
            <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.67876 5.05777H5.16472C4.82267 5.05777 4.49462 5.19365 4.25275 5.43552C4.01088 5.67739 3.875 6.00544 3.875 6.3475V15.3756C3.875 15.7176 4.01088 16.0457 4.25275 16.2875C4.49462 16.5294 4.82267 16.6653 5.16472 16.6653H14.1928C14.5348 16.6653 14.8629 16.5294 15.1048 16.2875C15.3466 16.0457 15.4825 15.7176 15.4825 15.3756V10.8615M13.7897 4.81595C14.0463 4.55941 14.3942 4.41528 14.757 4.41528C15.1198 4.41528 15.4678 4.55941 15.7243 4.81595C15.9809 5.07249 16.125 5.42044 16.125 5.78324C16.125 6.14605 15.9809 6.49399 15.7243 6.75053L9.9122 12.5633C9.75907 12.7163 9.56991 12.8283 9.36213 12.889L7.50944 13.4307C7.45395 13.4468 7.39513 13.4478 7.33914 13.4335C7.28315 13.4191 7.23204 13.39 7.19117 13.3491C7.1503 13.3082 7.12116 13.2571 7.10682 13.2011C7.09247 13.1452 7.09344 13.0863 7.10963 13.0308L7.65131 11.1782C7.71227 10.9705 7.82448 10.7816 7.97761 10.6287L13.7897 4.81595Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Edit
          </button>
        )}
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoRow}>
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
        </div>

        <div className={styles.infoRow}>
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
        </div>

        {!isFormSubmission && (
          <div className={styles.infoRow}>
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
        )}
      </div>
    </div>
  )
}