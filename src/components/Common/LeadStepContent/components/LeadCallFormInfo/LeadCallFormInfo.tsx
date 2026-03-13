'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Pencil } from 'lucide-react';
import { Lead, LeadSource } from '@/types/lead';
import AudioPlayer from '@/components/Common/AudioPlayer/AudioPlayer';
import { authenticatedFetch } from '@/lib/api-client';
import styles from './LeadCallFormInfo.module.scss';
import cardStyles from '@/components/Common/InfoCard/InfoCard.module.scss';

interface LeadCallFormInfoProps {
  lead: Lead;
}

export function LeadCallFormInfo({ lead }: LeadCallFormInfoProps) {
  const [showCallSummary, setShowCallSummary] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    lead_source: lead.lead_source || 'other',
    utm_source: lead.utm_source || '',
    utm_medium: lead.utm_medium || '',
    utm_campaign: lead.utm_campaign || '',
  });
  const [displayValues, setDisplayValues] = useState({
    lead_source: lead.lead_source || 'other',
    utm_source: lead.utm_source || '',
    utm_medium: lead.utm_medium || '',
    utm_campaign: lead.utm_campaign || '',
  });

  const capitalizeFirst = (str: string | undefined | null): string => {
    if (!str) return 'N/A';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  const getLeadSourceDisplay = (source: string): string => {
    const sourceMap: Record<string, string> = {
      // New taxonomy values
      google_ads: 'Google Ads',
      google_organic: 'Google Organic',
      facebook_ads: 'Facebook Ads',
      referral: 'Referral',
      direct: 'Direct',
      campaign: 'Campaign',
      widget: 'Widget',
      other: 'Other',
      // Legacy values
      organic: 'Google Organic',
      google_cpc: 'Google Ads',
      linkedin: 'LinkedIn',
      email_campaign: 'Email Campaign',
      cold_call: 'Cold Call',
      trade_show: 'Trade Show',
      webinar: 'Webinar',
      content_marketing: 'Content Marketing',
      widget_submission: 'Widget',
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

  const handleSaveAttribution = async () => {
    setIsSaving(true);
    try {
      await authenticatedFetch(`/api/leads/${lead.id}`, {
        method: 'PUT',
        body: JSON.stringify(editData),
      });
      setDisplayValues(editData);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {lead.format === 'form' || lead.lead_type === 'web_form' || lead.lead_type === 'website_form' || lead.lead_type === 'widget_form' ? (
        <>
          {/* Widget Details Section - only for widget submissions */}
          {(lead.lead_source === 'widget' || lead.lead_source === 'widget_submission') && (
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
              {lead.campaign ? (
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Campaign</span>
                  <Link href={`/campaigns/${lead.campaign.id}`} className={styles.campaignLink}>
                    {lead.campaign.name}
                  </Link>
                </div>
              ) : (
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>UTM Source</span>
                  <span className={cardStyles.dataText}>
                    {lead.utm_source || 'Direct'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Form Message Section */}
          {lead.comments && (
            <div className={styles.transcriptSection}>
              <div className={styles.transcriptHeader}>
                <h4 className={cardStyles.dataLabel}>
                  {lead.lead_source === 'campaign' ? 'Campaign Response Details' : 'Form Submission Details'}
                </h4>
              </div>
              <div className={styles.transcriptContent}>
                {lead.lead_source === 'campaign' ? (
                  <div className={cardStyles.transcriptText}>
                    {lead.comments.split('\n').map((line, i) =>
                      line === '' ? <br key={i} /> : <p key={i} className={styles.commentLine}>{line}</p>
                    )}
                  </div>
                ) : (
                  <span className={cardStyles.transcriptText}>{lead.comments}</span>
                )}
              </div>
            </div>
          )}
        </>
      ) : lead.lead_type === 'manual' || lead.lead_type === 'other' ? (
        <div className={styles.cardContent}>
          <div className={styles.callInsightsSection}>
            <h4 className={cardStyles.defaultText}>Attribution Details:</h4>
            {!isEditing && (
              <button
                className={styles.editButton}
                onClick={() => setIsEditing(true)}
              >
                <Pencil size={14} /> Edit
              </button>
            )}
          </div>

          {isEditing ? (
            <div className={styles.editForm}>
              <div className={styles.formGroup}>
                <label className={cardStyles.dataLabel}>How did you hear about us?</label>
                <select
                  value={editData.lead_source}
                  onChange={e => setEditData({ ...editData, lead_source: e.target.value as LeadSource })}
                >
                  <option value="organic">Organic</option>
                  <option value="referral">Referral</option>
                  <option value="google_cpc">Google CPC</option>
                  <option value="facebook_ads">Facebook Ads</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="email_campaign">Email Campaign</option>
                  <option value="cold_call">Cold Call</option>
                  <option value="trade_show">Trade Show</option>
                  <option value="webinar">Webinar</option>
                  <option value="content_marketing">Content Marketing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={cardStyles.dataLabel}>UTM Source</label>
                <input
                  type="text"
                  value={editData.utm_source}
                  onChange={e => setEditData({ ...editData, utm_source: e.target.value })}
                  placeholder="e.g. google"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={cardStyles.dataLabel}>UTM Medium</label>
                <input
                  type="text"
                  value={editData.utm_medium}
                  onChange={e => setEditData({ ...editData, utm_medium: e.target.value })}
                  placeholder="e.g. cpc"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={cardStyles.dataLabel}>UTM Campaign</label>
                <input
                  type="text"
                  value={editData.utm_campaign}
                  onChange={e => setEditData({ ...editData, utm_campaign: e.target.value })}
                  placeholder="e.g. spring_2026"
                />
              </div>
              <div className={styles.editActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setEditData({
                      lead_source: lead.lead_source || 'other',
                      utm_source: lead.utm_source || '',
                      utm_medium: lead.utm_medium || '',
                      utm_campaign: lead.utm_campaign || '',
                    });
                    setIsEditing(false);
                  }}
                >
                  Cancel
                </button>
                <button
                  className={styles.saveButton}
                  onClick={handleSaveAttribution}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.callInsightsGrid}>
              <div className={styles.callDetailItem}>
                <span className={cardStyles.dataLabel}>Source</span>
                <span className={cardStyles.dataText}>
                  {getLeadSourceDisplay(displayValues.lead_source)}
                </span>
              </div>
              {displayValues.utm_source && (
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>UTM Source</span>
                  <span className={cardStyles.dataText}>{displayValues.utm_source}</span>
                </div>
              )}
              {displayValues.utm_medium && (
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>UTM Medium</span>
                  <span className={cardStyles.dataText}>{displayValues.utm_medium}</span>
                </div>
              )}
              {displayValues.utm_campaign && (
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>UTM Campaign</span>
                  <span className={cardStyles.dataText}>{displayValues.utm_campaign}</span>
                </div>
              )}
              {!displayValues.utm_source && !displayValues.utm_medium && !displayValues.utm_campaign && (
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Attribution</span>
                  <span className={cardStyles.dataText}>Not yet recorded</span>
                </div>
              )}
            </div>
          )}
        </div>
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
