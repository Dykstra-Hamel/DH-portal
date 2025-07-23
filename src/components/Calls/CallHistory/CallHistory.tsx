'use client';

import { useState, useEffect, useCallback } from 'react';
import { Phone, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { adminAPI } from '@/lib/api-client';
import { CallRecord } from '@/types/call-record';
import AudioPlayer from '@/components/Common/AudioPlayer/AudioPlayer';
import styles from './CallHistory.module.scss';

interface CallHistoryProps {
  leadId: string;
  refreshTrigger?: number; // Optional prop to trigger refresh
  isAdmin?: boolean; // Whether user is admin
}

export function CallHistory({
  leadId,
  refreshTrigger,
  isAdmin = false,
}: CallHistoryProps) {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCalls = useCallback(async () => {
    try {
      setLoading(true);
      let callData;
      if (isAdmin) {
        callData = await adminAPI.getLeadCalls(leadId);
      } else {
        callData = await adminAPI.getUserLeadCalls(leadId);
      }
      setCalls(callData);
    } catch (error) {
      console.error('Error fetching calls:', error);
      setError('Failed to load call history');
    } finally {
      setLoading(false);
    }
  }, [leadId, isAdmin]);

  useEffect(() => {
    fetchCalls();
  }, [leadId, refreshTrigger, fetchCalls]);

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return '#10b981';
      case 'negative':
        return '#ef4444';
      case 'neutral':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} color="#10b981" />;
      case 'failed':
        return <XCircle size={16} color="#ef4444" />;
      case 'busy':
        return <AlertCircle size={16} color="#f59e0b" />;
      case 'no_answer':
        return <AlertCircle size={16} color="#f59e0b" />;
      default:
        return <AlertCircle size={16} color="#6b7280" />;
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading call history...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (calls.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Phone size={24} />
        <p>No calls recorded yet</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3>Call History ({calls.length})</h3>

      <div className={styles.callsList}>
        {calls.map(call => (
          <div key={call.id} className={styles.callCard}>
            <div className={styles.callHeader}>
              <div className={styles.callStatus}>
                {getStatusIcon(call.call_status)}
                <span className={styles.statusText}>
                  {call.call_status.charAt(0).toUpperCase() +
                    call.call_status.slice(1)}
                </span>
              </div>

              <div className={styles.callDate}>
                {call.start_timestamp && formatDate(call.start_timestamp)}
              </div>
            </div>

            <div className={styles.callDetails}>
              <div className={styles.basicInfo}>
                <div className={styles.infoItem}>
                  <Phone size={14} />
                  <span>{call.phone_number}</span>
                </div>

                {call.duration_seconds && (
                  <div className={styles.infoItem}>
                    <Clock size={14} />
                    <span>{formatDuration(call.duration_seconds)}</span>
                  </div>
                )}

                {call.sentiment && (
                  <div className={styles.infoItem}>
                    <div
                      className={styles.sentimentBadge}
                      style={{
                        backgroundColor: getSentimentColor(call.sentiment),
                      }}
                    >
                      {call.sentiment}
                    </div>
                  </div>
                )}
              </div>

              {/* Extracted Information */}
              {(call.home_size ||
                call.yard_size ||
                call.budget_range ||
                call.timeline) && (
                <div className={styles.extractedInfo}>
                  <h4>Call Insights</h4>
                  <div className={styles.insights}>
                    {call.home_size && (
                      <div className={styles.insight}>
                        <label>Home Size:</label>
                        <span>{call.home_size}</span>
                      </div>
                    )}
                    {call.yard_size && (
                      <div className={styles.insight}>
                        <label>Yard Size:</label>
                        <span>{call.yard_size}</span>
                      </div>
                    )}
                    {call.budget_range && (
                      <div className={styles.insight}>
                        <label>Budget:</label>
                        <span>{call.budget_range}</span>
                      </div>
                    )}
                    {call.timeline && (
                      <div className={styles.insight}>
                        <label>Timeline:</label>
                        <span>{call.timeline}</span>
                      </div>
                    )}
                    {call.decision_maker && (
                      <div className={styles.insight}>
                        <label>Decision Maker:</label>
                        <span>{call.decision_maker}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pain Points */}
              {call.pain_points && call.pain_points.length > 0 && (
                <div className={styles.painPoints}>
                  <h4>Pain Points</h4>
                  <ul>
                    {call.pain_points.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Call Recording */}
              {call.recording_url && (
                <div className={styles.recordingSection}>
                  <h4>Call Recording</h4>
                  <AudioPlayer
                    src={call.recording_url}
                    title={`Call Recording - ${formatDate(call.start_timestamp || '')}`}
                    className={styles.callRecording}
                  />
                </div>
              )}

              {/* Transcript */}
              {call.transcript && (
                <details className={styles.transcript}>
                  <summary>View Transcript</summary>
                  <div className={styles.transcriptContent}>
                    {call.transcript}
                  </div>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
