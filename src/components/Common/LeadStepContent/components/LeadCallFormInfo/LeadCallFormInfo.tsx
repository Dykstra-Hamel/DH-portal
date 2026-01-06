'use client';

import { useState } from 'react';
import { Lead } from '@/types/lead';
import AudioPlayer from '@/components/Common/AudioPlayer/AudioPlayer';
import styles from './LeadCallFormInfo.module.scss';
import cardStyles from '@/components/Common/InfoCard/InfoCard.module.scss';

interface LeadCallFormInfoProps {
  lead: Lead;
}

export function LeadCallFormInfo({ lead }: LeadCallFormInfoProps) {
  const [showCallSummary, setShowCallSummary] = useState(false);

  const capitalizeFirst = (str: string | undefined | null): string => {
    if (!str) return 'N/A';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const getLeadSourceDisplay = (source: string): string => {
    const sourceMap: Record<string, string> = {
      organic: 'Organic',
      referral: 'Referral',
      google_cpc: 'Google CPC',
      facebook_ads: 'Facebook Ads',
      linkedin: 'LinkedIn',
      email_campaign: 'Email Campaign',
      cold_call: 'Cold Call',
      trade_show: 'Trade Show',
      webinar: 'Webinar',
      content_marketing: 'Content Marketing',
      campaign: 'Campaign',
      widget_submission: 'Widget Submission',
      other: 'Other',
    };
    return sourceMap[source] || capitalizeFirst(source);
  };

  const getCallMethod = (): string => {
    if (!lead.call_record) return 'N/A';
    return 'Inbound Call';
  };

  const getAIQualification = (status: string): string => {
    const statusMap: Record<string, string> = {
      new: 'Not Qualified',
      in_process: 'Qualified',
      quoted: 'Highly Qualified',
      scheduling: 'Ready to Book',
      won: 'Converted',
      lost: 'Disqualified',
    };
    return statusMap[status] || capitalizeFirst(status);
  };

  const formatCallTimestamp = (
    timestamp: string | undefined | null
  ): string => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <>
      {lead.lead_type === 'web_form' ? (
        <>
          {/* Widget Details Section - only for widget submissions */}
          {lead.lead_source === 'widget_submission' && (
            <div className={styles.cardContent}>
              <div className={styles.callInsightsSection}>
                <h4 className={cardStyles.defaultText}>Widget Details:</h4>
              </div>
              <div className={styles.callInsightsGrid}>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Pest Type</span>
                  <span className={cardStyles.dataText}>
                    {capitalizeFirst(lead.pest_type)}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Estimated Price</span>
                  <span className={cardStyles.dataText}>
                    {lead.estimated_value
                      ? `$${lead.estimated_value.toLocaleString()}`
                      : 'Not specified'}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Selected Plan</span>
                  <span className={cardStyles.dataText}>
                    {lead.selected_plan_id ? 'Plan Selected' : 'Not selected'}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Recommended Plan</span>
                  <span className={cardStyles.dataText}>
                    {lead.recommended_plan_name || 'None provided'}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Requested Date</span>
                  <span className={cardStyles.dataText}>
                    {lead.requested_date
                      ? new Date(lead.requested_date).toLocaleDateString()
                      : 'Not specified'}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Requested Time</span>
                  <span className={cardStyles.dataText}>
                    {lead.requested_time || 'Not specified'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Attribution Details Section */}
          <div className={styles.cardContent}>
            <div className={styles.callInsightsSection}>
              <h4 className={cardStyles.defaultText}>Attribution Details:</h4>
            </div>
            <div className={styles.callInsightsGrid}>
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>Source</span>
                <span className={cardStyles.dataText}>
                  {getLeadSourceDisplay(lead.lead_source)}
                </span>
              </div>
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>UTM Source</span>
                <span className={cardStyles.dataText}>
                  {lead.utm_source || 'Direct'}
                </span>
              </div>
            </div>
          </div>

          {/* Form Message Section */}
          {lead.comments && (
            <div className={styles.transcriptSection}>
              <div className={styles.transcriptHeader}>
                <h4 className={cardStyles.dataLabel}>
                  Form Submission Details
                </h4>
              </div>
              <div className={styles.transcriptContent}>
                <span className={cardStyles.transcriptText}>
                  {lead.comments}
                </span>
              </div>
            </div>
          )}
        </>
      ) : lead.call_record ? (
        <>
          {/* Call Insights Section */}
          <div className={styles.cardContent}>
            <div className={styles.callInsightsSection}>
              <h4 className={cardStyles.defaultText}>Call Insights:</h4>
            </div>
            <div className={styles.callInsightsGrid}>
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>Method</span>
                <span className={cardStyles.dataText}>{getCallMethod()}</span>
              </div>
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>Source</span>
                <span className={cardStyles.dataText}>
                  {getLeadSourceDisplay(lead.lead_source)}
                </span>
              </div>
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>AI Qualification</span>
                <span className={cardStyles.dataText}>
                  {getAIQualification(lead.lead_status)}
                </span>
              </div>
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>Caller Sentiment</span>
                <span className={cardStyles.dataText}>
                  {capitalizeFirst(lead.call_record.sentiment)}
                </span>
              </div>
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>Primary Pest Issue</span>
                <span className={cardStyles.dataText}>
                  {capitalizeFirst(lead.call_record.pest_issue)}
                </span>
              </div>
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>
                  Preferred Service Time
                </span>
                <span className={cardStyles.dataText}>
                  {capitalizeFirst(lead.call_record.preferred_service_time)}
                </span>
              </div>
            </div>
          </div>

          {/* Call Details Section */}
          <div className={styles.callDetailsSection}>
            <div className={styles.callDetailsHeader}>
              <h4 className={cardStyles.defaultText}>Call Details:</h4>
            </div>
            <div className={styles.callInsightsGrid}>
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>Call Started</span>
                <span className={cardStyles.dataText}>
                  {formatCallTimestamp(lead.call_record.start_timestamp)}
                </span>
              </div>
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>Call Ended</span>
                <span className={cardStyles.dataText}>
                  {formatCallTimestamp(lead.call_record.end_timestamp)}
                </span>
              </div>
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>Disconnect Reason</span>
                <span className={cardStyles.dataText}>
                  {capitalizeFirst(lead.call_record.disconnect_reason)}
                </span>
              </div>
            </div>
          </div>

          {/* Call Recording Section */}
          {lead.call_record.recording_url && (
            <div className={styles.recordingSection}>
              <h4 className={cardStyles.dataLabel}>Call Recording</h4>
              <AudioPlayer src={lead.call_record.recording_url} />
            </div>
          )}

          {/* Call Transcript Section */}
          {lead.call_record.transcript && (
            <div className={styles.transcriptSection}>
              <div className={styles.transcriptHeader}>
                <h4 className={cardStyles.dataLabel}>
                  {showCallSummary ? 'Call Summary' : 'Transcript'}
                </h4>
                {lead.call_record.call_analysis?.call_summary && (
                  <div className={styles.toggleContainer}>
                    <button
                      className={`${styles.toggle} ${showCallSummary ? styles.active : ''}`}
                      onClick={() => setShowCallSummary(!showCallSummary)}
                    >
                      <div className={styles.toggleCircle}></div>
                    </button>
                    <span className={styles.toggleLabel}>Call Summary</span>
                  </div>
                )}
              </div>
              <div className={styles.transcriptContent}>
                <span className={cardStyles.transcriptText}>
                  {showCallSummary
                    ? lead.call_record.call_analysis?.call_summary
                    : lead.call_record.transcript}
                </span>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={styles.noCallData}>
          <p>No call data available for this lead.</p>
        </div>
      )}
    </>
  );
}
