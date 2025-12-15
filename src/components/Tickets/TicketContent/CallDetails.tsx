import React from 'react';
import { Ticket } from '@/types/ticket';
import { CallRecord } from '@/types/call-record';
import { FormSubmission } from '@/types/form-submission';
import { getDetailedTimeAgo } from '@/lib/time-utils';
import AudioPlayer from '@/components/Common/AudioPlayer/AudioPlayer';
import styles from './CallDetails.module.scss';

interface CallDetailsProps {
  ticket: Ticket;
  callRecord?: CallRecord;
  formSubmission?: FormSubmission;
}

export default function CallDetails({ ticket, callRecord, formSubmission }: CallDetailsProps) {
  const isFormSubmission = ticket.type === 'web_form';

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCallTimes = () => {
    if (!callRecord?.start_timestamp) {
      return {
        started: 'N/A',
        ended: 'N/A',
      };
    }

    const startDate = new Date(callRecord.start_timestamp);
    const endDate = callRecord.end_timestamp
      ? new Date(callRecord.end_timestamp)
      : null;

    return {
      started: startDate.toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }),
      ended: endDate
        ? endDate.toLocaleString('en-US', {
            month: 'numeric',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
          })
        : 'N/A',
    };
  };

  const callTimes = getCallTimes();

  if (isFormSubmission) {
    const normalized = formSubmission?.normalized_data;
    const isFailed = formSubmission?.processing_status === 'failed';

    return (
      <div className={styles.section}>
        <div className={styles.infoGrid}>
          {isFailed && formSubmission?.id && (
            <div className={styles.infoRow}>
              <div className={styles.infoField}>
                <span className={styles.label}>⚠️ Processing Failed</span>
                <span className={styles.value}>
                  <a
                    href={`/tickets/form-submissions?submissionId=${formSubmission.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#3b82f6', textDecoration: 'underline' }}
                  >
                    View Full Form Submission
                  </a>
                </span>
              </div>
            </div>
          )}

          <div className={styles.infoRow}>
            <div className={styles.infoField}>
              <span className={styles.label}>Form Submitted</span>
              <span className={styles.value}>
                {getDetailedTimeAgo(ticket.created_at)}
              </span>
            </div>
          </div>

          {normalized?.first_name && (
            <div className={styles.infoRow}>
              <div className={styles.infoField}>
                <span className={styles.label}>First Name</span>
                <span className={styles.value}>{normalized.first_name}</span>
              </div>
              {normalized?.last_name && (
                <div className={styles.infoField}>
                  <span className={styles.label}>Last Name</span>
                  <span className={styles.value}>{normalized.last_name}</span>
                </div>
              )}
            </div>
          )}

          {normalized?.email && (
            <div className={styles.infoRow}>
              <div className={styles.infoField}>
                <span className={styles.label}>Email</span>
                <span className={styles.value}>{normalized.email}</span>
              </div>
            </div>
          )}

          {normalized?.phone_number && (
            <div className={styles.infoRow}>
              <div className={styles.infoField}>
                <span className={styles.label}>Phone Number</span>
                <span className={styles.value}>{normalized.phone_number}</span>
              </div>
            </div>
          )}

          {normalized?.street_address && (
            <div className={styles.infoRow}>
              <div className={styles.infoField}>
                <span className={styles.label}>Address</span>
                <span className={styles.value}>
                  {normalized.street_address}
                  {normalized.city && `, ${normalized.city}`}
                  {normalized.state && `, ${normalized.state}`}
                  {normalized.zip && ` ${normalized.zip}`}
                </span>
              </div>
            </div>
          )}

          {normalized?.pest_issue && (
            <div className={styles.infoRow}>
              <div className={styles.infoField}>
                <span className={styles.label}>Pest Issue</span>
                <span className={styles.value}>{normalized.pest_issue}</span>
              </div>
            </div>
          )}

          {normalized?.own_or_rent && (
            <div className={styles.infoRow}>
              <div className={styles.infoField}>
                <span className={styles.label}>Property Status</span>
                <span className={styles.value}>
                  {normalized.own_or_rent === 'own' ? 'Owner' :
                   normalized.own_or_rent === 'rent' ? 'Renter' :
                   'Unknown'}
                </span>
              </div>
            </div>
          )}

          {normalized?.additional_comments && (
            <div className={styles.infoRow}>
              <div className={styles.infoField}>
                <span className={styles.label}>Additional Comments</span>
                <div className={styles.messageBox}>
                  <p>{normalized.additional_comments}</p>
                </div>
              </div>
            </div>
          )}

          {isFailed && formSubmission?.raw_payload && (
            <div className={styles.infoRow}>
              <div className={styles.infoField}>
                <span className={styles.label}>Raw Form Data</span>
                <div className={styles.messageBox}>
                  <pre style={{ fontSize: '12px', overflow: 'auto', margin: 0 }}>
                    {JSON.stringify(formSubmission.raw_payload, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.infoGrid}>
        <div className={styles.infoRow}>
          <div className={styles.infoField}>
            <span className={styles.label}>Call Started</span>
            <span className={styles.value}>{callTimes.started}</span>
          </div>
          <div className={styles.infoField}>
            <span className={styles.label}>Call Ended</span>
            <span className={styles.value}>{callTimes.ended}</span>
          </div>
        </div>

        {callRecord?.recording_url && (
          <div className={styles.recordingSection}>
            <span className={styles.label}>Call Recording</span>
            <AudioPlayer
              src={callRecord.recording_url}
              title={`Call Recording - ${ticket.id}`}
            />
          </div>
        )}

        {callRecord?.transcript && (
          <div className={styles.transcriptSection}>
            <span className={styles.label}>Call Transcript</span>
            <div className={styles.transcriptBox}>
              <div className={styles.transcriptContent}>
                {callRecord.transcript.split('\n').map((line, index) => {
                  const [speaker, ...messageParts] = line.split(': ');
                  const message = messageParts.join(': ');

                  if (message) {
                    return (
                      <div key={index} className={styles.transcriptLine}>
                        <span className={styles.speaker}>{speaker}:</span>
                        <span className={styles.message}>{message}</span>
                      </div>
                    );
                  }

                  return (
                    <div key={index} className={styles.transcriptLine}>
                      <span className={styles.message}>{line}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
