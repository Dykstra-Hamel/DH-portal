'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCompany } from '@/contexts/CompanyContext';
import { adminAPI } from '@/lib/api-client';
import FormSubmissionsList from '@/components/FormSubmissions/FormSubmissionsList/FormSubmissionsList';
import { FormSubmissionWithCustomer } from '@/components/FormSubmissions/FormSubmissionsList/FormSubmissionsListConfig';
import { MetricsCard, styles as metricsStyles } from '@/components/Common/MetricsCard';
import { MetricsResponse } from '@/services/metricsService';
import styles from '@/components/Admin/AdminManager.module.scss';

function FormSubmissionsContent() {
  // Use global company context
  const { selectedCompany, isAdmin, isLoading: contextLoading } = useCompany();
  const searchParams = useSearchParams();

  // Form Submissions State
  const [submissions, setSubmissions] = useState<FormSubmissionWithCustomer[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmissionWithCustomer | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const loadSubmissions = useCallback(
    async (page: number = 1, isLoadMore: boolean = false) => {
      try {
        if (isLoadMore) {
          setLoadingMore(true);
        } else {
          setSubmissionsLoading(true);
        }

        // For non-admin users, require a specific company to be selected
        if (!isAdmin && !selectedCompany) {
          setSubmissions([]);
          setHasMore(false);
          return;
        }

        let response: any;

        if (isAdmin) {
          // Admin can see all submissions or filter by selected company
          const filters = {
            ...(selectedCompany ? { companyId: selectedCompany.id } : {}),
            page,
            limit: 20,
          };
          response = await adminAPI.getAllFormSubmissions(filters);
        } else if (selectedCompany) {
          // Regular users see submissions for their selected company only
          const filters = {
            companyId: selectedCompany.id,
            page,
            limit: 20,
          };
          response = await adminAPI.getUserFormSubmissions(filters);
        } else {
          setSubmissions([]);
          return;
        }

        const newSubmissions = response.formSubmissions || [];

        if (isLoadMore) {
          setSubmissions(prev => [...prev, ...newSubmissions]);
        } else {
          setSubmissions(newSubmissions);
        }

        setHasMore(response.hasMore || false);
        setCurrentPage(page);
      } catch (err) {
        console.error('Error loading form submissions:', err);
        // Keep existing submissions on error
      } finally {
        setSubmissionsLoading(false);
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
      setSubmissions([]);
      setHasMore(true);
      loadSubmissions(1);
      fetchMetrics(selectedCompany.id);
    }
  }, [contextLoading, selectedCompany, isAdmin, loadSubmissions, fetchMetrics]);

  // Handle URL parameter to open specific submission
  useEffect(() => {
    const submissionId = searchParams.get('submissionId');
    if (submissionId && submissions.length > 0) {
      // Find the submission in the loaded submissions
      const submission = submissions.find(s => s.id === submissionId);
      if (submission) {
        setSelectedSubmission(submission);
      }
    }
  }, [searchParams, submissions]);

  // Infinite scroll handler
  const handleLoadMore = () => {
    if (hasMore && !loadingMore) {
      loadSubmissions(currentPage + 1, true);
    }
  };

  // Handle view details action
  const handleViewDetails = (submission: FormSubmissionWithCustomer) => {
    setSelectedSubmission(submission);
  };

  // Handle submission updated (refresh data)
  const handleSubmissionUpdated = () => {
    setCurrentPage(1);
    setSubmissions([]);
    setHasMore(true);
    loadSubmissions(1);
    if (selectedCompany?.id) {
      fetchMetrics(selectedCompany.id);
    }
  };

  // Format functions for modal
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div style={{ width: '100%' }}>
      {selectedCompany && (
        <>
          {/* Metrics Cards */}
          <div className={metricsStyles.metricsCardWrapper}>
            {!submissionsLoading && submissions.length > 0 ? (
              <>
                <MetricsCard
                  title="Total Forms"
                  value={submissions.length.toString()}
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                />
                <MetricsCard
                  title="Processed Forms"
                  value={submissions.filter(s => s.processing_status === 'processed').length.toString()}
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                />
                <MetricsCard
                  title="Failed Forms"
                  value={submissions.filter(s => s.processing_status === 'failed').length.toString()}
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="bad"
                />
              </>
            ) : (
              <>
                <MetricsCard
                  title="Total Forms"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
                <MetricsCard
                  title="Processed Forms"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
                <MetricsCard
                  title="Failed Forms"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="bad"
                  isLoading={true}
                />
              </>
            )}
          </div>
        </>
      )}

      {selectedCompany && (
        <FormSubmissionsList
          submissions={submissions}
          loading={submissionsLoading}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          loadingMore={loadingMore}
          onSubmissionUpdated={handleSubmissionUpdated}
          onViewDetails={handleViewDetails}
        />
      )}

      {!selectedCompany && (
        <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>
          Please select a company to view form submissions.
        </div>
      )}

      {selectedSubmission && (
        <div className={styles.modal} onClick={() => setSelectedSubmission(null)}>
          <div
            className={styles.modalContent}
            onClick={e => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h3>Form Submission Details</h3>
              <button
                className={styles.closeButton}
                onClick={() => setSelectedSubmission(null)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailGrid}>
                <div className={styles.detailItem}>
                  <strong>Submission ID:</strong> {selectedSubmission.id}
                </div>
                <div className={styles.detailItem}>
                  <strong>Customer:</strong>{' '}
                  {(() => {
                    const customer = selectedSubmission.customers;
                    return customer
                      ? `${customer.first_name} ${customer.last_name}`
                      : selectedSubmission.normalized_data?.first_name && selectedSubmission.normalized_data?.last_name
                      ? `${selectedSubmission.normalized_data.first_name} ${selectedSubmission.normalized_data.last_name}`
                      : 'Unknown';
                  })()}
                </div>
                <div className={styles.detailItem}>
                  <strong>Email:</strong>{' '}
                  {selectedSubmission.customers?.email ||
                   selectedSubmission.normalized_data?.email ||
                   'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Phone:</strong>{' '}
                  {selectedSubmission.normalized_data?.phone_number || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Source URL:</strong>{' '}
                  {selectedSubmission.source_url ? (
                    <a
                      href={selectedSubmission.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#3b82f6', textDecoration: 'underline' }}
                    >
                      {selectedSubmission.source_url}
                    </a>
                  ) : (
                    'N/A'
                  )}
                </div>
                <div className={styles.detailItem}>
                  <strong>Source Domain:</strong> {selectedSubmission.source_domain || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Submitted:</strong>{' '}
                  {formatDate(selectedSubmission.created_at)}
                </div>
                <div className={styles.detailItem}>
                  <strong>Processing Status:</strong>{' '}
                  <span style={{ textTransform: 'capitalize' }}>
                    {selectedSubmission.processing_status}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <strong>AI Confidence:</strong>{' '}
                  {selectedSubmission.gemini_confidence !== null
                    ? `${Math.round((selectedSubmission.gemini_confidence || 0) * 100)}%`
                    : 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Street Address:</strong>{' '}
                  {selectedSubmission.normalized_data?.street_address || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>City:</strong>{' '}
                  {selectedSubmission.normalized_data?.city || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>State:</strong>{' '}
                  {selectedSubmission.normalized_data?.state || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Zip:</strong>{' '}
                  {selectedSubmission.normalized_data?.zip || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Pest Issue:</strong>{' '}
                  {selectedSubmission.normalized_data?.pest_issue || 'N/A'}
                </div>
                <div className={styles.detailItem}>
                  <strong>Property Status:</strong>{' '}
                  {selectedSubmission.normalized_data?.own_or_rent === 'own'
                    ? 'Owner'
                    : selectedSubmission.normalized_data?.own_or_rent === 'rent'
                    ? 'Renter'
                    : 'Unknown'}
                </div>
                <div className={styles.detailItem}>
                  <strong>IP Address:</strong> {selectedSubmission.ip_address || 'N/A'}
                </div>
              </div>

              {/* Additional Comments Section */}
              {selectedSubmission.normalized_data?.additional_comments && (
                <div className={styles.transcriptSection}>
                  <h4>Additional Comments</h4>
                  <div className={styles.transcriptContent}>
                    {selectedSubmission.normalized_data.additional_comments}
                  </div>
                </div>
              )}

              {/* Raw Payload Section (collapsed by default) */}
              {selectedSubmission.raw_payload && (
                <details className={styles.transcriptSection}>
                  <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '10px' }}>
                    <h4 style={{ display: 'inline' }}>Raw Form Data</h4>
                  </summary>
                  <div className={styles.transcriptContent}>
                    <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                      {JSON.stringify(selectedSubmission.raw_payload, null, 2)}
                    </pre>
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FormSubmissionsPage() {
  return (
    <Suspense fallback={<div style={{ padding: '20px' }}>Loading...</div>}>
      <FormSubmissionsContent />
    </Suspense>
  );
}
