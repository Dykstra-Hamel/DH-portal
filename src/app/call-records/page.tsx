'use client';

import { useState, useEffect, useCallback } from 'react';
import AudioPlayer from '@/components/Common/AudioPlayer/AudioPlayer';
import { createClient } from '@/lib/supabase/client';
import { useIsGlobalAdmin } from '@/hooks/useCompanyRole';
import { Save, AlertCircle, CheckCircle, Eye, EyeOff, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import styles from '@/components/Admin/AdminManager.module.scss';

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
  pest_issue: string;
  street_address: string;
  preferred_service_time: string;
  opt_out_sensitive_data_storage: boolean;
  disconnect_reason: string;
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
}

interface Company {
  id: string;
  name: string;
}

export default function CallRecordsPage() {
  // Company and Admin State
  const { isGlobalAdmin, isLoading: adminCheckLoading } = useIsGlobalAdmin();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [companiesError, setCompaniesError] = useState<string | null>(null);

  // Call Records State
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [callsLoading, setCallsLoading] = useState(false);
  const [callsError, setCallsError] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  
  // Delete State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [callToDelete, setCallToDelete] = useState<CallRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCompanies = async () => {
    try {
      setCompaniesLoading(true);
      setCompaniesError(null);
      
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session?.access_token) {
        throw new Error('No authentication session');
      }
      
      const response = await fetch('/api/user-companies', {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch companies');
      }
      
      const data = await response.json();
      setCompanies(data.companies || []);

      // For non-admin users with single company, pre-select it
      if (!data.isAdmin && data.companies?.length === 1) {
        setSelectedCompanyId(data.companies[0].id);
      }
    } catch (err) {
      setCompaniesError(err instanceof Error ? err.message : 'Failed to load companies');
    } finally {
      setCompaniesLoading(false);
    }
  };

  const loadCalls = useCallback(async () => {
    try {
      setCallsLoading(true);
      setCallsError(null);
      
      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session?.access_token) {
        throw new Error('No authentication session');
      }
      
      // For non-admin users, require a specific company to be selected
      if (!isGlobalAdmin && (!selectedCompanyId || selectedCompanyId === 'all')) {
        setCalls([]);
        return;
      }
      
      const url = new URL('/api/calls', window.location.origin);
      if (selectedCompanyId && selectedCompanyId !== 'all') {
        url.searchParams.set('company_id', selectedCompanyId);
      }
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to fetch calls');
      }
      
      const data = await response.json();
      setCalls(data);
    } catch (err) {
      setCallsError(err instanceof Error ? err.message : 'Failed to load calls');
    } finally {
      setCallsLoading(false);
    }
  }, [isGlobalAdmin, selectedCompanyId]);

  useEffect(() => {
    if (!adminCheckLoading) {
      loadCompanies();
    }
  }, [adminCheckLoading, isGlobalAdmin]);

  useEffect(() => {
    if (companies.length > 0 && !adminCheckLoading) {
      loadCalls();
    }
  }, [companies, adminCheckLoading, loadCalls]);

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A';
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
    const cleaned = phone.replace(/\\D/g, '');
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

      const response = await fetch(`/api/calls/${callToDelete.id}`, {
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
      await loadCalls();

      setShowDeleteModal(false);
      setCallToDelete(null);
    } catch (error) {
      console.error('Error deleting call record:', error);
      alert(`Failed to delete call record: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setCallToDelete(null);
  };

  return (
    <div className={styles.adminManager}>
      <div className={styles.header}>
        <h2>Call Records</h2>
      </div>

      {/* Company Dropdown - Only show if admin or user has multiple companies */}
      {!adminCheckLoading && (
        <div className={styles.companySelector}>
          {companiesLoading ? (
            <div className={styles.loading}>Loading companies...</div>
          ) : companiesError ? (
            <div className={styles.error}>Error: {companiesError}</div>
          ) : (isGlobalAdmin || companies.length > 1) ? (
            <>
              <label htmlFor="company-select" className={styles.selectorLabel}>
                Select Company:
              </label>
              <select
                id="company-select"
                value={selectedCompanyId}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className={styles.companySelect}
              >
                {companies.length === 0 && (
                  <option value="">-- No Companies Available --</option>
                )}
                {isGlobalAdmin && companies.length > 0 && (
                  <option value="all">All Companies</option>
                )}
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </>
          ) : companies.length === 1 ? (
            <div className={styles.singleCompanyHeader}>
              <h3>Call Records for {companies[0].name}</h3>
            </div>
          ) : null}
        </div>
      )}

      <div className={styles.tabContent}>
        {adminCheckLoading ? (
          <div className={styles.loading}>Loading...</div>
        ) : callsLoading ? (
          <div className={styles.loading}>Loading call records...</div>
        ) : callsError ? (
          <div className={styles.error}>Error: {callsError}</div>
        ) : (
          <>
            <div className={styles.recordsHeader}>
              <h3>
                {companies.length === 1 && !isGlobalAdmin
                  ? 'Call Records' // Don't repeat company name if already shown above
                  : isGlobalAdmin && selectedCompanyId === 'all' 
                    ? 'All Company Call Records'
                    : companies.find(c => c.id === selectedCompanyId)?.name 
                      ? `${companies.find(c => c.id === selectedCompanyId)?.name} Call Records`
                      : 'Call Records'
                }
              </h3>
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
                    <th>Data Opt-Out</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map(call => (
                    <tr key={call.id}>
                      <td>{formatDate(call.start_timestamp)}</td>
                      <td>
                        {call.leads?.customers
                          ? `${call.leads.customers.first_name} ${call.leads.customers.last_name}`
                          : 'Unknown'}
                        {call.leads?.customers?.email && (
                          <div className={styles.subText}>
                            {call.leads.customers.email}
                          </div>
                        )}
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
                      <td>
                        <span
                          className={styles.sentiment}
                          style={{ color: getSentimentColor(call.sentiment) }}
                        >
                          {call.sentiment || 'N/A'}
                        </span>
                      </td>
                      <td className={styles.pestIssueCell} title={call.pest_issue || 'N/A'}>
                        {call.pest_issue || 'N/A'}
                      </td>
                      <td>{call.street_address || 'N/A'}</td>
                      <td>{call.preferred_service_time || 'N/A'}</td>
                      <td>{call.opt_out_sensitive_data_storage ? 'Yes' : 'No'}</td>
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
                  {selectedCall.leads?.customers
                    ? `${selectedCall.leads.customers.first_name} ${selectedCall.leads.customers.last_name}`
                    : 'Unknown'}
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
                  <strong>Sentiment:</strong> {selectedCall.sentiment || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Home Size:</strong> {selectedCall.home_size || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Yard Size:</strong> {selectedCall.yard_size || 'N/A'}
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
                Are you sure you want to delete this call record? This action cannot be undone.
              </p>
              <div className={styles.callInfo}>
                <strong>Call ID:</strong> {callToDelete.call_id}
                <br />
                <strong>Phone:</strong> {formatPhoneNumber(callToDelete.phone_number)}
                <br />
                <strong>Date:</strong> {formatDate(callToDelete.start_timestamp)}
                <br />
                <strong>Customer:</strong> {
                  callToDelete.leads?.customers
                    ? `${callToDelete.leads.customers.first_name} ${callToDelete.leads.customers.last_name}`
                    : 'Unknown'
                }
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