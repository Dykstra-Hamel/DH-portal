'use client'

import { useState, useEffect } from 'react'
import { Phone, Clock, Download, Play, Pause, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { adminAPI } from '@/lib/api-client'
import { CallRecord } from '@/types/call-record'
import styles from './CallHistory.module.scss'

interface CallHistoryProps {
  leadId: string
}

export function CallHistory({ leadId }: CallHistoryProps) {
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [playingCall, setPlayingCall] = useState<string | null>(null)

  useEffect(() => {
    fetchCalls()
  }, [leadId])

  const fetchCalls = async () => {
    try {
      setLoading(true)
      const callData = await adminAPI.getLeadCalls(leadId)
      setCalls(callData)
    } catch (error) {
      console.error('Error fetching calls:', error)
      setError('Failed to load call history')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive': return '#10b981'
      case 'negative': return '#ef4444'
      case 'neutral': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} color="#10b981" />
      case 'failed': return <XCircle size={16} color="#ef4444" />
      case 'busy': return <AlertCircle size={16} color="#f59e0b" />
      case 'no_answer': return <AlertCircle size={16} color="#f59e0b" />
      default: return <AlertCircle size={16} color="#6b7280" />
    }
  }

  const handlePlayRecording = (callId: string, recordingUrl?: string) => {
    if (!recordingUrl) return
    
    if (playingCall === callId) {
      setPlayingCall(null)
      // In a real implementation, you'd pause the audio here
    } else {
      setPlayingCall(callId)
      // In a real implementation, you'd start playing the audio here
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading call history...</div>
  }

  if (error) {
    return <div className={styles.error}>{error}</div>
  }

  if (calls.length === 0) {
    return (
      <div className={styles.emptyState}>
        <Phone size={24} />
        <p>No calls recorded yet</p>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h3>Call History ({calls.length})</h3>
      
      <div className={styles.callsList}>
        {calls.map((call) => (
          <div key={call.id} className={styles.callCard}>
            <div className={styles.callHeader}>
              <div className={styles.callStatus}>
                {getStatusIcon(call.call_status)}
                <span className={styles.statusText}>
                  {call.call_status.charAt(0).toUpperCase() + call.call_status.slice(1)}
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
                      style={{ backgroundColor: getSentimentColor(call.sentiment) }}
                    >
                      {call.sentiment}
                    </div>
                  </div>
                )}
              </div>

              {/* Extracted Information */}
              {(call.home_size || call.yard_size || call.budget_range || call.timeline) && (
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

              {/* Call Actions */}
              <div className={styles.callActions}>
                {call.recording_url && (
                  <button 
                    className={styles.playButton}
                    onClick={() => handlePlayRecording(call.id, call.recording_url)}
                  >
                    {playingCall === call.id ? <Pause size={16} /> : <Play size={16} />}
                    {playingCall === call.id ? 'Pause' : 'Play Recording'}
                  </button>
                )}
                
                {call.recording_url && (
                  <a 
                    href={call.recording_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.downloadButton}
                  >
                    <Download size={16} />
                    Download
                  </a>
                )}
              </div>

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
  )
}