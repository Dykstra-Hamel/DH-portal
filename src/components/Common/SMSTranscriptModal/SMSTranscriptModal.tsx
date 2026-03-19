'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './SMSTranscriptModal.module.scss';

interface ChatAnalysis {
  chat_summary?: string;
  user_sentiment?: string;
}

interface TranscriptData {
  transcript: string | null;
  chat_analysis: ChatAnalysis | null;
  chat_status: string | null;
  start_timestamp: number | null;
  end_timestamp: number | null;
}

interface SMSTranscriptModalProps {
  conversationId: string;
  isOpen: boolean;
  onClose: () => void;
}

function getSentimentClass(sentiment: string): string {
  const s = sentiment.toLowerCase();
  if (s === 'positive') return styles.sentimentPositive;
  if (s === 'negative') return styles.sentimentNegative;
  return styles.sentimentNeutral;
}

export function SMSTranscriptModal({
  conversationId,
  isOpen,
  onClose,
}: SMSTranscriptModalProps) {
  const [data, setData] = useState<TranscriptData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setData(null);

    fetch(`/api/sms/conversations/${conversationId}/transcript`)
      .then(res => res.json())
      .then(json => {
        if (json.success) {
          setData(json);
        } else {
          setError(json.error || 'Failed to load transcript');
        }
      })
      .catch(() => setError('Failed to load transcript'))
      .finally(() => setLoading(false));
  }, [isOpen, conversationId]);

  if (!isOpen) return null;

  // Parse transcript into messages, grouping continuation lines onto the
  // previous speaker's message (handles URLs and multi-line agent replies).
  const messages: { speaker: string; message: string }[] = [];
  if (data?.transcript) {
    for (const line of data.transcript.split('\n')) {
      const colonIndex = line.indexOf(': ');
      const speaker = colonIndex !== -1 ? line.substring(0, colonIndex) : '';
      const isKnownSpeaker =
        speaker.toLowerCase() === 'agent' || speaker.toLowerCase() === 'user';

      if (isKnownSpeaker) {
        messages.push({ speaker, message: line.substring(colonIndex + 2) });
      } else if (messages.length > 0 && line.trim()) {
        messages[messages.length - 1].message += '\n' + line;
      }
    }
  }

  const sentiment = data?.chat_analysis?.user_sentiment;

  return (
    <div
      className={styles.overlay}
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>SMS Conversation</span>
          <div className={styles.headerRight}>
            {sentiment && (
              <span
                className={`${styles.sentimentBadge} ${getSentimentClass(sentiment)}`}
              >
                {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
              </span>
            )}
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {data?.chat_analysis?.chat_summary && (
          <div className={styles.summary}>
            <span className={styles.summaryLabel}>Summary</span>
            <p className={styles.summaryText}>
              {data.chat_analysis.chat_summary}
            </p>
          </div>
        )}

        <div className={styles.messageThread}>
          {loading && <div className={styles.state}>Loading transcript...</div>}
          {error && <div className={styles.stateError}>{error}</div>}
          {!loading && !error && messages.length === 0 && (
            <div className={styles.state}>No transcript available yet</div>
          )}
          {messages.map(({ speaker, message }, index) => {
            const isAgent = speaker.toLowerCase() === 'agent';
            return (
              <div
                key={index}
                className={`${styles.message} ${isAgent ? styles.outbound : styles.inbound}`}
              >
                <p className={styles.messageText}>{message}</p>
                <span className={styles.speaker}>{speaker}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
