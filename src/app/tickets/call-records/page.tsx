'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import { adminAPI } from '@/lib/api-client';
import CallRecordsList from '@/components/CallRecords/CallRecordsList/CallRecordsList';
import { CallRecordWithDirection } from '@/components/CallRecords/CallRecordsList/CallRecordsListConfig';
import AudioPlayer from '@/components/Common/AudioPlayer/AudioPlayer';
import { MetricsCard, styles as metricsStyles } from '@/components/Common/MetricsCard';
import { MetricsResponse } from '@/services/metricsService';
import styles from '@/components/Admin/AdminManager.module.scss';



export default function CallRecordsPage() {
  // Use global company context
  const { selectedCompany, isAdmin, isLoading: contextLoading } = useCompany();

  // Call Records State
  const [calls, setCalls] = useState<CallRecordWithDirection[]>([]);
  const [callsLoading, setCallsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCall, setSelectedCall] = useState<CallRecordWithDirection | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);
  const [tabCounts, setTabCounts] = useState<{ all: number; inbound: number; outbound: number }>({ all: 0, inbound: 0, outbound: 0 });


  const loadCalls = useCallback(
    async (page: number = 1, isLoadMore: boolean = false) => {
      try {
        if (isLoadMore) {
          setLoadingMore(true);
        } else {
          setCallsLoading(true);
        }

        // For non-admin users, require a specific company to be selected
        if (!isAdmin && !selectedCompany) {
          setCalls([]);
          setHasMore(false);
          return;
        }

        let allCalls: CallRecordWithDirection[] = [];

        if (isAdmin) {
          // Admin can see all calls or filter by selected company
          const filters = {
            ...(selectedCompany ? { companyId: selectedCompany.id } : {}),
          };
          allCalls = await adminAPI.getAllCalls(filters);
        } else if (selectedCompany) {
          // Regular users see calls for their selected company only
          const filters = {
            companyId: selectedCompany.id,
          };
          allCalls = await adminAPI.getUserCalls(filters);
        } else {
          setCalls([]);
          return;
        }

        // Filter out archived calls on the client side
        const nonArchivedCalls = (allCalls || []).filter(call => !call.archived);

        // Compute tab counts from all non-archived calls
        const counts = {
          all: nonArchivedCalls.length,
          inbound: nonArchivedCalls.filter(call => call.call_direction === 'inbound').length,
          outbound: nonArchivedCalls.filter(call => call.call_direction === 'outbound').length,
        };
        setTabCounts(counts);

        // Client-side pagination for infinite scroll
        const limit = 20;
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedCalls = nonArchivedCalls.slice(startIndex, endIndex);

        if (isLoadMore) {
          setCalls(prev => [...prev, ...paginatedCalls]);
        } else {
          setCalls(paginatedCalls);
        }

        // Check if there are more calls to load
        setHasMore(endIndex < nonArchivedCalls.length);
        setCurrentPage(page);
      } catch (err) {
        console.error('Error loading calls:', err);
        // Keep existing calls on error
      } finally {
        setCallsLoading(false);
        setLoadingMore(false);
      }
    },
    [isAdmin, selectedCompany]
  );

  const fetchMetrics = useCallback(async (companyId: string) => {
    if (!companyId) return;

    setMetricsLoading(true);
    try {
      const params = new URLSearchParams({
        companyId
      });

      const response = await fetch(`/api/metrics?${params}`);
      if (response.ok) {
        const metricsData = await response.json();
        setMetrics(metricsData);
      } else {
        console.error('Error fetching metrics:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!contextLoading && selectedCompany?.id) {
      setCurrentPage(1);
      setCalls([]);
      setHasMore(true);
      loadCalls(1); // Always load first page when dependencies change
      fetchMetrics(selectedCompany.id);
    }
  }, [contextLoading, selectedCompany, isAdmin, loadCalls, fetchMetrics]);

  // Infinite scroll handler
  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadCalls(currentPage + 1, true);
    }
  };

  // Handle view details action
  const handleViewDetails = (call: CallRecordWithDirection) => {
    setSelectedCall(call);
  };

  // Handle call updated (refresh data)
  const handleCallUpdated = () => {
    setCurrentPage(1);
    setCalls([]);
    setHasMore(true);
    loadCalls(1);
    if (selectedCompany?.id) {
      fetchMetrics(selectedCompany.id);
    }
  };

  // Format functions for modal
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatPhoneNumber = (phone: string | undefined) => {
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

  const formatDuration = (seconds: number) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };


  return (
    <div style={{ width: '100%' }}>
      {selectedCompany && (
        <>
          {/* Metrics Cards */}
          <div className={metricsStyles.metricsCardWrapper}>
            {metrics && !metricsLoading ? (
              <>
                <MetricsCard
                  title={metrics.totalCalls.title}
                  value={metrics.totalCalls.value}
                  comparisonValue={metrics.totalCalls.comparisonValue}
                  comparisonPeriod={metrics.totalCalls.comparisonPeriod}
                  trend={metrics.totalCalls.trend}
                />
                <MetricsCard
                  title={metrics.totalForms.title}
                  value={metrics.totalForms.value}
                  comparisonValue={metrics.totalForms.comparisonValue}
                  comparisonPeriod={metrics.totalForms.comparisonPeriod}
                  trend={metrics.totalForms.trend}
                />
                <MetricsCard
                  title={metrics.avgTimeToAssign.title}
                  value={metrics.avgTimeToAssign.value}
                  comparisonValue={metrics.avgTimeToAssign.comparisonValue}
                  comparisonPeriod={metrics.avgTimeToAssign.comparisonPeriod}
                  trend={metrics.avgTimeToAssign.trend}
                />
                <MetricsCard
                  title={metrics.hangupCalls.title}
                  value={metrics.hangupCalls.value}
                  comparisonValue={metrics.hangupCalls.comparisonValue}
                  comparisonPeriod={metrics.hangupCalls.comparisonPeriod}
                  trend={metrics.hangupCalls.trend}
                />
                <MetricsCard
                  title={metrics.customerServiceCalls.title}
                  value={metrics.customerServiceCalls.value}
                  comparisonValue={metrics.customerServiceCalls.comparisonValue}
                  comparisonPeriod={metrics.customerServiceCalls.comparisonPeriod}
                  trend={metrics.customerServiceCalls.trend}
                />
              </>
            ) : (
              <>
                <MetricsCard
                  title="Total Calls"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
                <MetricsCard
                  title="Total Forms"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
                <MetricsCard
                  title="Avg Time To Be Assigned"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
                <MetricsCard
                  title="Hang-up Calls"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
                <MetricsCard
                  title="Customer Service Calls"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
              </>
            )}
          </div>
        </>
      )}

      {selectedCompany && (
        <CallRecordsList
          calls={calls}
          loading={callsLoading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          loadingMore={loadingMore}
          onCallUpdated={handleCallUpdated}
          onViewDetails={handleViewDetails}
          tabCounts={tabCounts}
        />
      )}

      {!selectedCompany && (
        <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>
          Please select a company to view call records.
        </div>
      )}

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
                  {(() => {
                    // For outbound calls, show the number that was called (phone_number)
                    // For inbound calls, show the caller's number (phone_number or from_number)
                    const displayNumber =
                      selectedCall.call_direction === 'outbound'
                        ? selectedCall.phone_number // Number that was called
                        : selectedCall.phone_number || selectedCall.from_number; // Caller's number (prefer normalized)
                    return formatPhoneNumber(displayNumber || 'N/A');
                  })()}
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

    </div>
  );
}