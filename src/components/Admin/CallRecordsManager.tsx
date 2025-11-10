'use client';

import { useState, useEffect } from 'react';
import AudioPlayer from '@/components/Common/AudioPlayer/AudioPlayer';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Trash2 } from 'lucide-react';
import styles from './AdminManager.module.scss';

interface CallRecord {
  id: string;
  call_id: string;
  phone_number: string;
  from_number: string;
  call_status: string;
  start_timestamp: string;
  end_timestamp: string;
  duration_seconds: number;
  recording_url?: string;
  transcript?: string;
  sentiment: string;
  home_size: string;
  yard_size: string;
  decision_maker: string;
  pest_issue: string;
  street_address: string;
  preferred_service_time: string;
  opt_out_sensitive_data_storage: boolean;
  disconnect_reason: string;
  archived?: boolean;
  billable_duration_seconds?: number;
  created_at: string;
  leads?: {
    id: string;
    customer_id: string;
    company_id: string;
    customers?: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  };
  customers?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    company_id: string;
  };
}

interface Company {
  id: string;
  name: string;
}

export default function CallRecordsManager() {
  // Use global company context
  const { selectedCompany, isLoading: contextLoading } = useCompany();

  // State
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);


  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [callToDelete, setCallToDelete] = useState<CallRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Billing Report State
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    if (!contextLoading && selectedCompany) {
      loadCalls(selectedCompany.id);
    }
  }, [contextLoading, selectedCompany]);

  const loadCalls = async (companyId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use direct admin API call that includes archived calls
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session?.access_token) {
        throw new Error('No authentication session');
      }

      const response = await fetch('/api/admin/calls', {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch calls');
      }
      
      let data = await response.json();
      
      // Filter calls by company if a specific company is selected
      if (companyId && companyId !== 'all') {
        data = data.filter((call: CallRecord) => {
          // Check if the call's lead belongs to the selected company OR direct customer belongs to company
          const leadCompanyId = call.leads?.company_id;
          const customerCompanyId = call.customers?.company_id;
          return leadCompanyId === companyId || customerCompanyId === companyId;
        });
      }
      
      setCalls(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load calls');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatBillableDuration = (seconds: number | null | undefined) => {
    if (seconds === null || seconds === undefined) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return 'N/A';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      const number = cleaned.slice(1);
      return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return '#10b981';
      case 'failed':
        return '#ef4444';
      case 'busy':
        return '#f59e0b';
      case 'no-answer':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment?.toLowerCase()) {
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


  const handleDeleteClick = (call: CallRecord) => {
    setCallToDelete(call);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!callToDelete) return;

    try {
      setIsDeleting(true);
      
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session?.access_token) {
        throw new Error('No authentication session');
      }

      const response = await fetch(`/api/admin/calls/${callToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to delete call record');
      }

      // Refresh the calls list
      if (selectedCompany) {
        loadCalls(selectedCompany.id);
      }

      setShowDeleteModal(false);
      setCallToDelete(null);
    } catch (error) {
      setError(`Failed to delete call record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setCallToDelete(null);
  };

  const generateCSV = (reportData: any) => {
    const headers = ['Company Name', 'Period', 'Total Calls', 'Total Billable Minutes', 'Total Billable Hours'];
    const csvContent = [
      headers.join(','),
      ...reportData.breakdown.map((row: any) => [
        `"${row.companyName}"`,
        row.period,
        row.totalCalls,
        row.totalBillableMinutes,
        row.totalBillableHours
      ].join(','))
    ].join('\n');

    return csvContent;
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleGenerateReport = async () => {
    setReportError(null);

    // Validation
    if (!selectedCompany) {
      setReportError('Please select a company from the header dropdown.');
      return;
    }

    if (!reportStartDate || !reportEndDate) {
      setReportError('Please select both start and end dates.');
      return;
    }

    const start = new Date(reportStartDate);
    const end = new Date(reportEndDate);

    if (start >= end) {
      setReportError('Start date must be before end date.');
      return;
    }

    try {
      setIsGeneratingReport(true);

      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();

      if (!session.session?.access_token) {
        throw new Error('No authentication session');
      }

      const queryParams = new URLSearchParams({
        companyId: selectedCompany.id,
        startDate: reportStartDate,
        endDate: reportEndDate,
      });

      const response = await fetch(`/api/admin/calls/billing-report?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to generate billing report');
      }

      const reportData = await response.json();

      if (reportData.success) {
        // Generate CSV and download
        const csvContent = generateCSV(reportData.data);
        const companyName = reportData.data.companyName.replace(/[^a-zA-Z0-9]/g, '-');
        const filename = `billing-report-${companyName}-${reportStartDate}-${reportEndDate}.csv`;
        
        downloadCSV(csvContent, filename);
        
        // Report generated successfully - no alert needed as file downloads
      } else {
        throw new Error('Report generation failed');
      }

    } catch (error) {
      setReportError(`Failed to generate billing report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <div className={styles.adminManager}>
      <div className={styles.header}>
        <h2>Call Records</h2>
        {selectedCompany && <p>Viewing call records for {selectedCompany.name}</p>}
        <small>Use the company dropdown in the header to switch companies.</small>
      </div>

      {/* Billing Report Section */}
      {selectedCompany && (
        <div className={styles.reportSection}>
          <h3>Generate Billing Report</h3>
          <div className={styles.reportControls}>
            <div className={styles.dateInputs}>
              <div className={styles.inputGroup}>
                <label htmlFor="startDate">Start Date:</label>
                <input
                  id="startDate"
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
              <div className={styles.inputGroup}>
                <label htmlFor="endDate">End Date:</label>
                <input
                  id="endDate"
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className={styles.dateInput}
                />
              </div>
            </div>
            <button
              onClick={handleGenerateReport}
              disabled={isGeneratingReport || !reportStartDate || !reportEndDate}
              className={styles.generateReportButton}
            >
              {isGeneratingReport ? 'Generating...' : 'Generate Billing Report'}
            </button>
          </div>
          {reportError && (
            <div className={styles.reportError}>
              {reportError}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className={styles.tabContent}>
        {!selectedCompany ? (
          <div className={styles.noSelection}>
            <p>Please select a company from the header dropdown to view call records.</p>
          </div>
        ) : loading ? (
          <div className={styles.loading}>Loading call records...</div>
        ) : error ? (
          <div className={styles.error}>Error: {error}</div>
        ) : (
          <>
            <div className={styles.recordsHeader}>
              <h3>Call Records</h3>
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
                    <th>Billable</th>
                    <th>Sentiment</th>
                    <th>Pest Issue</th>
                    <th>Address</th>
                    <th>Service Time</th>
                    <th>Data Opt-Out</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map(call => (
                    <tr key={call.id}>
                      <td>{formatDate(call.start_timestamp)}</td>
                      <td>
                        {(() => {
                          const customer = call.leads?.customers || call.customers;
                          return customer
                            ? `${customer.first_name} ${customer.last_name}`
                            : 'Unknown';
                        })()}
                        {(() => {
                          const customer = call.leads?.customers || call.customers;
                          return customer?.email && (
                            <div className={styles.subText}>
                              {customer.email}
                            </div>
                          );
                        })()}
                      </td>
                      <td>{formatPhoneNumber(call.phone_number)}</td>
                      <td>
                        <span
                          className={styles.status}
                          style={{
                            backgroundColor: getStatusColor(call.call_status),
                          }}
                        >
                          {call.call_status || 'Unknown'}
                        </span>
                      </td>
                      <td>{formatDuration(call.duration_seconds)}</td>
                      <td>{formatBillableDuration(call.billable_duration_seconds)}</td>
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
                      <td>{call.opt_out_sensitive_data_storage ? 'Yes' : 'No'}</td>
                      <td>
                        <span
                          className={styles.status}
                          style={{
                            backgroundColor: call.archived ? '#6b7280' : '#10b981',
                          }}
                        >
                          {call.archived ? 'Archived' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.callActions}>
                          <button
                            className={styles.actionButton}
                            onClick={() => setSelectedCall(call)}
                          >
                            View Details
                          </button>
                          <button
                            className={styles.callDeleteButton}
                            onClick={() => handleDeleteClick(call)}
                            title="Delete call record"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {selectedCall && (
        <div className={styles.modal} onClick={() => setSelectedCall(null)}>
          <div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()}
          >
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
                  <strong>Customer:</strong>{' '}
                  {(() => {
                    const customer = selectedCall.leads?.customers || selectedCall.customers;
                    return customer
                      ? `${customer.first_name} ${customer.last_name}`
                      : 'Unknown';
                  })()}
                </div>
                <div className={styles.detailItem}>
                  <strong>Phone:</strong>{' '}
                  {formatPhoneNumber(selectedCall.phone_number)}
                </div>
                <div className={styles.detailItem}>
                  <strong>From:</strong>{' '}
                  {formatPhoneNumber(selectedCall.from_number)}
                </div>
                <div className={styles.detailItem}>
                  <strong>Status:</strong> {selectedCall.call_status}
                </div>
                <div className={styles.detailItem}>
                  <strong>Start Time:</strong>{' '}
                  {formatDate(selectedCall.start_timestamp)}
                </div>
                <div className={styles.detailItem}>
                  <strong>End Time:</strong>{' '}
                  {formatDate(selectedCall.end_timestamp)}
                </div>
                <div className={styles.detailItem}>
                  <strong>Duration:</strong>{' '}
                  {formatDuration(selectedCall.duration_seconds)}
                </div>
                <div className={styles.detailItem}>
                  <strong>Billable Duration:</strong>{' '}
                  {formatBillableDuration(selectedCall.billable_duration_seconds)}
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
                  <strong>Decision Maker:</strong>{' '}
                  {selectedCall.decision_maker || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Pest Issue:</strong>{' '}
                  {selectedCall.pest_issue || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Street Address:</strong>{' '}
                  {selectedCall.street_address || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Preferred Service Time:</strong>{' '}
                  {selectedCall.preferred_service_time || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Data Opt-Out:</strong>{' '}
                  {selectedCall.opt_out_sensitive_data_storage ? 'Yes' : 'No'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Disconnect Reason:</strong>{' '}
                  {selectedCall.disconnect_reason || 'N/A'}
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


      {/* Delete Confirmation Modal */}
      {showDeleteModal && callToDelete && (
        <div className={styles.modal} onClick={handleDeleteCancel}>
          <div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>Delete Call Record</h3>
              <button
                className={styles.closeButton}
                onClick={handleDeleteCancel}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Are you sure you want to permanently delete this call record? This action cannot be undone.
              </p>
              <div className={styles.callInfo}>
                <strong>Call ID:</strong> {callToDelete.call_id}
                <br />
                <strong>Phone:</strong> {formatPhoneNumber(callToDelete.phone_number)}
                <br />
                <strong>Date:</strong> {formatDate(callToDelete.start_timestamp)}
                <br />
                <strong>Customer:</strong> {(() => {
                  const customer = callToDelete.leads?.customers || callToDelete.customers;
                  return customer
                    ? `${customer.first_name} ${customer.last_name}`
                    : 'Unknown';
                })()}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                onClick={handleDeleteCancel}
                className={styles.cancelButton}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className={styles.confirmDeleteButton}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Call Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}