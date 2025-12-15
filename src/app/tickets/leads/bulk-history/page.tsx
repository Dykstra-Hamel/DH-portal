'use client';

import { useEffect, useState } from 'react';
import { useCompany } from '@/contexts/CompanyContext';
import styles from './page.module.scss';

interface BulkUpload {
  id: string;
  file_name: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  scheduled_at: string | null;
  executed_at: string | null;
  total_rows: number;
  successful_count: number;
  failed_count: number;
  skipped_count: number;
  error_message: string | null;
  created_at: string;
  creator: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export default function BulkHistoryPage() {
  const { selectedCompany } = useCompany();
  const [uploads, setUploads] = useState<BulkUpload[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCompany?.id) {
      fetchHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany?.id]);

  const fetchHistory = async () => {
    if (!selectedCompany?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/leads/bulk/history?companyId=${selectedCompany.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch upload history');
      }

      const data = await response.json();
      setUploads(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelUpload = async (uploadId: string) => {
    if (!confirm('Are you sure you want to cancel this upload?')) {
      return;
    }

    try {
      const response = await fetch(`/api/leads/bulk/${uploadId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel upload');
      }

      // Refresh the list
      fetchHistory();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const getStatusBadge = (status: BulkUpload['status']) => {
    const statusMap = {
      pending: { label: 'Pending', className: styles.statusPending },
      processing: { label: 'Processing', className: styles.statusProcessing },
      completed: { label: 'Completed', className: styles.statusCompleted },
      failed: { label: 'Failed', className: styles.statusFailed },
      cancelled: { label: 'Cancelled', className: styles.statusCancelled },
    };

    const config = statusMap[status];

    return <span className={`${styles.statusBadge} ${config.className}`}>{config.label}</span>;
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading upload history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Bulk Upload History</h1>
        <p>View and manage your bulk lead upload history</p>
      </div>

      {uploads.length === 0 ? (
        <div className={styles.empty}>
          <p>No bulk uploads found</p>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>File Name</th>
                <th>Status</th>
                <th>Scheduled</th>
                <th>Executed</th>
                <th>Total Rows</th>
                <th>Success</th>
                <th>Failed</th>
                <th>Skipped</th>
                <th>Created By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((upload) => (
                <tr key={upload.id}>
                  <td>{upload.file_name}</td>
                  <td>{getStatusBadge(upload.status)}</td>
                  <td>
                    {upload.scheduled_at
                      ? new Date(upload.scheduled_at).toLocaleString()
                      : '-'}
                  </td>
                  <td>
                    {upload.executed_at
                      ? new Date(upload.executed_at).toLocaleString()
                      : '-'}
                  </td>
                  <td>{upload.total_rows}</td>
                  <td className={styles.success}>{upload.successful_count}</td>
                  <td className={styles.failed}>{upload.failed_count}</td>
                  <td className={styles.skipped}>{upload.skipped_count}</td>
                  <td>
                    {upload.creator.first_name} {upload.creator.last_name}
                  </td>
                  <td>
                    {upload.status === 'pending' && (
                      <button
                        onClick={() => handleCancelUpload(upload.id)}
                        className={styles.cancelButton}
                      >
                        Cancel
                      </button>
                    )}
                    {upload.status === 'failed' && upload.error_message && (
                      <span className={styles.errorIcon} title={upload.error_message}>
                        ⚠️
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
