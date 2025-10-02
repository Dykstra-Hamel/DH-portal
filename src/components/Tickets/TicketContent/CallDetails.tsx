import React from 'react';
import { Ticket } from '@/types/ticket';
import { CallRecord } from '@/types/call-record';
import { getDetailedTimeAgo } from '@/lib/time-utils';
import AudioPlayer from '@/components/Common/AudioPlayer/AudioPlayer';
import styles from './CallDetails.module.scss';

interface CallDetailsProps {
  ticket: Ticket;
  callRecord?: CallRecord;
}

export default function CallDetails({ ticket, callRecord }: CallDetailsProps) {
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
    return (
      <div className={styles.section}>
        <div className={styles.infoGrid}>
          <div className={styles.infoRow}>
            <div className={styles.infoField}>
              <span className={styles.label}>Form Submitted</span>
              <span className={styles.value}>
                {getDetailedTimeAgo(ticket.created_at)}
              </span>
            </div>
          </div>

          {ticket.description && (
            <div className={styles.infoRow}>
              <div className={styles.infoField}>
                <span className={styles.label}>Form Message</span>
                <div className={styles.messageBox}>
                  <p>{ticket.description}</p>
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
