'use client'

import { useState, useEffect } from 'react'
import { adminAPI } from '@/lib/api-client'
import AudioPlayer from '@/components/Common/AudioPlayer/AudioPlayer'
import styles from './AdminManager.module.scss'

interface CallRecord {
  id: string
  call_id: string
  phone_number: string
  from_number: string
  call_status: string
  start_timestamp: string
  end_timestamp: string
  duration_seconds: number
  recording_url?: string
  transcript?: string
  sentiment: string
  home_size: string
  yard_size: string
  decision_maker: string
  pest_issue: string
  street_address: string
  preferred_service_time: string
  contacted_other_companies: boolean
  opt_out_sensitive_data_storage: boolean
  disconnect_reason: string
  created_at: string
  leads?: {
    id: string
    customer_id: string
    customers?: {
      id: string
      first_name: string
      last_name: string
      email: string
    }
  }
}

export default function CallsManager() {
  const [calls, setCalls] = useState<CallRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null)

  useEffect(() => {
    loadCalls()
  }, [])

  const loadCalls = async () => {
    try {
      setLoading(true)
      const data = await adminAPI.getAllCalls()
      setCalls(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calls')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A'
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'N/A'
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const number = cleaned.slice(1)
      return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
    }
    return phone
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '#10b981'
      case 'failed': return '#ef4444'
      case 'busy': return '#f59e0b'
      case 'no-answer': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
      case 'positive': return '#10b981'
      case 'negative': return '#ef4444'
      case 'neutral': return '#6b7280'
      default: return '#6b7280'
    }
  }

  if (loading) return <div className={styles.loading}>Loading calls...</div>
  if (error) return <div className={styles.error}>Error: {error}</div>

  return (
    <div className={styles.adminManager}>
      <div className={styles.header}>
        <h2>Call Records</h2>
        <p>Total: {calls.length} calls</p>
      </div>

      <div className={styles.table}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Customer</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Sentiment</th>
              <th>Pest Issue</th>
              <th>Address</th>
              <th>Service Time</th>
              <th>Called Others</th>
              <th>Data Opt-Out</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {calls.map((call) => (
              <tr key={call.id}>
                <td>{formatDate(call.start_timestamp)}</td>
                <td>
                  {call.leads?.customers ? 
                    `${call.leads.customers.first_name} ${call.leads.customers.last_name}` : 
                    'Unknown'
                  }
                  {call.leads?.customers?.email && (
                    <div className={styles.subText}>{call.leads.customers.email}</div>
                  )}
                </td>
                <td>{formatPhoneNumber(call.phone_number)}</td>
                <td>
                  <span 
                    className={styles.status}
                    style={{ backgroundColor: getStatusColor(call.call_status) }}
                  >
                    {call.call_status || 'Unknown'}
                  </span>
                </td>
                <td>{formatDuration(call.duration_seconds)}</td>
                <td>
                  <span 
                    className={styles.sentiment}
                    style={{ color: getSentimentColor(call.sentiment) }}
                  >
                    {call.sentiment || 'N/A'}
                  </span>
                </td>
                <td>{call.pest_issue || 'N/A'}</td>
                <td>{call.street_address || 'N/A'}</td>
                <td>{call.preferred_service_time || 'N/A'}</td>
                <td>{call.contacted_other_companies ? 'Yes' : 'No'}</td>
                <td>{call.opt_out_sensitive_data_storage ? 'Yes' : 'No'}</td>
                <td>
                  <button
                    className={styles.actionButton}
                    onClick={() => setSelectedCall(call)}
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedCall && (
        <div className={styles.modal} onClick={() => setSelectedCall(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Call Details</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setSelectedCall(null)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <strong>Call ID:</strong> {selectedCall.call_id}
                </div>
                <div className={styles.detailItem}>
                  <strong>Customer:</strong> {selectedCall.leads?.customers ? 
                    `${selectedCall.leads.customers.first_name} ${selectedCall.leads.customers.last_name}` : 
                    'Unknown'
                  }
                </div>
                <div className={styles.detailItem}>
                  <strong>Phone:</strong> {formatPhoneNumber(selectedCall.phone_number)}
                </div>
                <div className={styles.detailItem}>
                  <strong>From:</strong> {formatPhoneNumber(selectedCall.from_number)}
                </div>
                <div className={styles.detailItem}>
                  <strong>Status:</strong> {selectedCall.call_status}
                </div>
                <div className={styles.detailItem}>
                  <strong>Start Time:</strong> {formatDate(selectedCall.start_timestamp)}
                </div>
                <div className={styles.detailItem}>
                  <strong>End Time:</strong> {formatDate(selectedCall.end_timestamp)}
                </div>
                <div className={styles.detailItem}>
                  <strong>Duration:</strong> {formatDuration(selectedCall.duration_seconds)}
                </div>
                <div className={styles.detailItem}>
                  <strong>Sentiment:</strong> {selectedCall.sentiment || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Home Size:</strong> {selectedCall.home_size || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Yard Size:</strong> {selectedCall.yard_size || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Decision Maker:</strong> {selectedCall.decision_maker || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Pest Issue:</strong> {selectedCall.pest_issue || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Street Address:</strong> {selectedCall.street_address || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Preferred Service Time:</strong> {selectedCall.preferred_service_time || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Contacted Other Companies:</strong> {selectedCall.contacted_other_companies ? 'Yes' : 'No'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Data Opt-Out:</strong> {selectedCall.opt_out_sensitive_data_storage ? 'Yes' : 'No'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Disconnect Reason:</strong> {selectedCall.disconnect_reason || 'N/A'}
                </div>
              </div>

              {/* Call Recording Section */}
              {selectedCall.recording_url && (
                <div className={styles.recordingSection}>
                  <h4>Call Recording</h4>
                  <AudioPlayer 
                    src={selectedCall.recording_url} 
                    title={`Call Recording - ${selectedCall.call_id}`}
                    className={styles.modalAudioPlayer}
                  />
                </div>
              )}

              {/* Transcript Section */}
              {selectedCall.transcript && (
                <div className={styles.transcriptSection}>
                  <h4>Call Transcript</h4>
                  <div className={styles.transcriptContent}>
                    {selectedCall.transcript}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}