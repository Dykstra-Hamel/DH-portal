'use client';

import { useState, useEffect, useCallback } from 'react';
import AudioPlayer from '@/components/Common/AudioPlayer/AudioPlayer';
import { createClient } from '@/lib/supabase/client';
import { Archive, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from '@/components/Admin/AdminManager.module.scss';
import { useCompany } from '@/contexts/CompanyContext';
import { useDateFilter } from '@/contexts/DateFilterContext';
import { adminAPI } from '@/lib/api-client';
import {
  CallRecordWithDirection,
  PaginatedResponse,
} from '@/types/call-record';

export default function CallRecordsPage() {
  // Use global company context and date filter
  const { selectedCompany, isAdmin, isLoading: contextLoading } = useCompany();
  const { getApiDateParams } = useDateFilter();

  // Call Records State
  const [calls, setCalls] = useState<CallRecordWithDirection[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [callsLoading, setCallsLoading] = useState(false);
  const [callsError, setCallsError] = useState<string | null>(null);
  const [selectedCall, setSelectedCall] =
    useState<CallRecordWithDirection | null>(null);

  // Archive State
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [callToArchive, setCallToArchive] =
    useState<CallRecordWithDirection | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const loadCalls = useCallback(
    async (page: number = pagination.page) => {
      try {
        setCallsLoading(true);
        setCallsError(null);

        // For non-admin users, require a specific company to be selected
        if (!isAdmin && !selectedCompany) {
          setCalls([]);
          setPagination(prev => ({ ...prev, total: 0, totalPages: 0 }));
          return;
        }

        let response: PaginatedResponse<CallRecordWithDirection>;

        if (isAdmin) {
          // Admin can see all calls or filter by selected company (NO date filter - always show all)
          const filters = {
            ...(selectedCompany ? { companyId: selectedCompany.id } : {}),
            page,
            limit: pagination.limit,
          };
          response = await adminAPI.getAllCalls(filters);
        } else if (selectedCompany) {
          // Regular users see calls for their selected company only (NO date filter - always show all)
          const filters = {
            companyId: selectedCompany.id,
            page,
            limit: pagination.limit,
          };
          response = await adminAPI.getUserCalls(filters);
        } else {
          setCalls([]);
          return;
        }

        setCalls(response.data || []);
        setPagination({
          ...response.pagination,
          page, // Ensure the current page is set correctly
        });
      } catch (err) {
        setCallsError(
          err instanceof Error ? err.message : 'Failed to load calls'
        );
      } finally {
        setCallsLoading(false);
      }
    },
    [isAdmin, selectedCompany, pagination.limit]
  );

  useEffect(() => {
    if (!contextLoading) {
      loadCalls(1); // Always load first page when dependencies change
    }
  }, [contextLoading, selectedCompany, isAdmin, loadCalls]);

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadCalls(newPage);
    }
  };

  const handlePrevPage = () => {
    if (pagination.hasPrev) {
      handlePageChange(pagination.page - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination.hasNext) {
      handlePageChange(pagination.page + 1);
    }
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

  const handleArchiveClick = (call: CallRecordWithDirection) => {
    setCallToArchive(call);
    setShowArchiveModal(true);
  };

  const handleArchiveConfirm = async () => {
    if (!callToArchive) return;

    try {
      setIsArchiving(true);

      const supabase = createClient();
      const { data: session } = await supabase.auth.getSession();

      if (!session.session?.access_token) {
        throw new Error('No authentication session');
      }

      const response = await fetch(`/api/calls/${callToArchive.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ archived: true }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to archive call record');
      }

      // Refresh the calls list
      await loadCalls();

      setShowArchiveModal(false);
      setCallToArchive(null);
    } catch (error) {
      setCallsError(
        `Failed to archive call record: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsArchiving(false);
    }
  };

  const handleArchiveCancel = () => {
    setShowArchiveModal(false);
    setCallToArchive(null);
  };

  return (
    <div className={styles.adminManager}>
      <div className={styles.header}>
        <h2>Call Records</h2>
      </div>

      <div className={styles.tabContent}>
        {contextLoading ? (
          <div className={styles.loading}>Loading...</div>
        ) : callsLoading ? (
          <div className={styles.loading}>Loading call records...</div>
        ) : callsError ? (
          <div className={styles.error}>Error: {callsError}</div>
        ) : (
          <>
            <div className={styles.recordsHeader}>
              <h3>
                {selectedCompany
                  ? `${selectedCompany.name} Call Records`
                  : isAdmin
                    ? 'All Company Call Records'
                    : 'Call Records'}
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
                    <th>Direction</th>
                    <th>Service Time</th>
                    <th>Data Opt-Out</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {calls.map(call => (
                    <tr key={call.id}>
                      <td>
                        {call.start_timestamp
                          ? formatDate(call.start_timestamp)
                          : 'N/A'}
                      </td>
                      <td>
                        {(() => {
                          const customer =
                            call.leads?.customers || call.customers;
                          return customer
                            ? `${customer.first_name} ${customer.last_name}`
                            : 'Unknown';
                        })()}
                        {(() => {
                          const customer =
                            call.leads?.customers || call.customers;
                          return (
                            customer?.email && (
                              <div className={styles.subText}>
                                {customer.email}
                              </div>
                            )
                          );
                        })()}
                      </td>
                      <td>
                        {(() => {
                          // For outbound calls, show the number that was called (phone_number)
                          // For inbound calls, show the caller's number (from_number or phone_number)
                          const displayNumber =
                            call.call_direction === 'outbound'
                              ? call.phone_number // Number that was called
                              : call.from_number || call.phone_number; // Caller's number
                          return formatPhoneNumber(displayNumber);
                        })()}
                      </td>
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
                      <td>
                        {call.duration_seconds
                          ? formatDuration(call.duration_seconds)
                          : 'N/A'}
                      </td>
                      <td>
                        <span
                          className={styles.sentiment}
                          style={{
                            color: getSentimentColor(
                              call.sentiment || 'neutral'
                            ),
                          }}
                        >
                          {call.sentiment || 'N/A'}
                        </span>
                      </td>
                      <td
                        className={styles.pestIssueCell}
                        title={call.pest_issue || 'N/A'}
                      >
                        {call.pest_issue || 'N/A'}
                      </td>
                      <td>
                        <span
                          className={styles.callDirection}
                          style={{
                            color:
                              call.call_direction === 'inbound'
                                ? '#10b981'
                                : call.call_direction === 'outbound'
                                  ? '#3b82f6'
                                  : '#6b7280',
                            fontWeight: '500',
                          }}
                        >
                          {call.call_direction === 'inbound'
                            ? 'Inbound'
                            : call.call_direction === 'outbound'
                              ? 'Outbound'
                              : 'Unknown'}
                        </span>
                      </td>
                      <td>{call.preferred_service_time || 'N/A'}</td>
                      <td>
                        {call.opt_out_sensitive_data_storage ? 'Yes' : 'No'}
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
                            className={styles.callArchiveButton}
                            onClick={() => handleArchiveClick(call)}
                            title="Archive call record"
                          >
                            <Archive size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={handlePrevPage}
                  disabled={!pagination.hasPrev || callsLoading}
                  className={styles.paginationButton}
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>

                <div className={styles.pageInfo}>
                  <span>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <span className={styles.totalRecords}>
                    ({pagination.total} total calls)
                  </span>
                </div>

                <button
                  onClick={handleNextPage}
                  disabled={!pagination.hasNext || callsLoading}
                  className={styles.paginationButton}
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
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
                    const customer =
                      selectedCall.leads?.customers || selectedCall.customers;
                    return customer
                      ? `${customer.first_name} ${customer.last_name}`
                      : 'Unknown';
                  })()}
                </div>
                <div className={styles.detailItem}>
                  <strong>Phone:</strong>{' '}
                  {(() => {
                    // For outbound calls, show the number that was called (phone_number)
                    // For inbound calls, show the caller's number (from_number or phone_number)
                    const displayNumber =
                      selectedCall.call_direction === 'outbound'
                        ? selectedCall.phone_number // Number that was called
                        : selectedCall.from_number || selectedCall.phone_number; // Caller's number
                    return formatPhoneNumber(displayNumber);
                  })()}
                </div>
                <div className={styles.detailItem}>
                  <strong>From:</strong>{' '}
                  {selectedCall.from_number
                    ? formatPhoneNumber(selectedCall.from_number)
                    : 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Status:</strong> {selectedCall.call_status}
                </div>
                <div className={styles.detailItem}>
                  <strong>Start Time:</strong>{' '}
                  {selectedCall.start_timestamp
                    ? formatDate(selectedCall.start_timestamp)
                    : 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>End Time:</strong>{' '}
                  {selectedCall.end_timestamp
                    ? formatDate(selectedCall.end_timestamp)
                    : 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Duration:</strong>{' '}
                  {selectedCall.duration_seconds
                    ? formatDuration(selectedCall.duration_seconds)
                    : 'N/A'}
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

      {/* Archive Confirmation Modal */}
      {showArchiveModal && callToArchive && (
        <div className={styles.modal} onClick={handleArchiveCancel}>
          <div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>Archive Call Record</h3>
              <button
                className={styles.closeButton}
                onClick={handleArchiveCancel}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Are you sure you want to archive this call record? Archived
                calls will be hidden from the main view but can be restored if
                needed.
              </p>
              <div className={styles.callInfo}>
                <strong>Call ID:</strong> {callToArchive.call_id}
                <br />
                <strong>Phone:</strong>{' '}
                {(() => {
                  // For outbound calls, show the number that was called (phone_number)
                  // For inbound calls, show the caller's number (from_number or phone_number)
                  const displayNumber =
                    callToArchive.call_direction === 'outbound'
                      ? callToArchive.phone_number // Number that was called
                      : callToArchive.from_number || callToArchive.phone_number; // Caller's number
                  return formatPhoneNumber(displayNumber);
                })()}
                <br />
                <strong>Date:</strong>{' '}
                {callToArchive.start_timestamp
                  ? formatDate(callToArchive.start_timestamp)
                  : 'N/A'}
                <br />
                <strong>Customer:</strong>{' '}
                {(() => {
                  const customer =
                    callToArchive.leads?.customers || callToArchive.customers;
                  return customer
                    ? `${customer.first_name} ${customer.last_name}`
                    : 'Unknown';
                })()}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                onClick={handleArchiveCancel}
                className={styles.cancelButton}
                disabled={isArchiving}
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveConfirm}
                className={styles.confirmArchiveButton}
                disabled={isArchiving}
              >
                {isArchiving ? 'Archiving...' : 'Archive Call Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
