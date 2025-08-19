'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './ExecutionManager.module.scss';

interface Execution {
  id: string;
  workflow_id: string;
  lead_id: string;
  execution_status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  current_step: string;
  trigger_event: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  execution_data?: any;
  workflow?: {
    id: string;
    name: string;
    workflow_type: string;
    trigger_type: string;
  };
  lead?: {
    id: string;
    customer?: {
      first_name: string;
      last_name: string;
      email: string;
    };
  };
}

interface ExecutionManagerProps {
  companyId: string;
  workflowId?: string;
  leadId?: string;
}

export default function ExecutionManager({ companyId, workflowId, leadId }: ExecutionManagerProps) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false
  });
  const [cancelling, setCancelling] = useState<Set<string>>(new Set());

  const fetchExecutions = useCallback(async (offset = 0) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: offset.toString()
      });

      if (statusFilter) params.append('status', statusFilter);
      if (workflowId) params.append('workflow_id', workflowId);
      if (leadId) params.append('lead_id', leadId);

      const response = await fetch(`/api/companies/${companyId}/executions?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch executions');
      }

      const data = await response.json();
      setExecutions(data.executions);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [companyId, statusFilter, workflowId, leadId, pagination.limit]);

  const cancelExecution = async (executionId: string, reason?: string) => {
    try {
      setCancelling(prev => new Set([...prev, executionId]));
      
      const response = await fetch(`/api/companies/${companyId}/executions/${executionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          execution_status: 'cancelled',
          cancellation_reason: reason || 'Cancelled by user'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel execution');
      }

      // Refresh executions list
      await fetchExecutions(pagination.offset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel execution');
    } finally {
      setCancelling(prev => {
        const newSet = new Set(prev);
        newSet.delete(executionId);
        return newSet;
      });
    }
  };


  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  const getStatusBadge = (status: string) => {
    const className = `${styles.statusBadge} ${styles[status]}`;
    return <span className={className}>{status.replace('_', ' ')}</span>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getCustomerName = (execution: Execution) => {
    const customer = execution.lead?.customer;
    if (!customer) return 'Unknown Customer';
    return `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email || 'Unknown';
  };

  const canCancelExecution = (execution: Execution) => {
    return ['pending', 'running'].includes(execution.execution_status);
  };

  if (loading && executions.length === 0) {
    return <div className={styles.loading}>Loading executions...</div>;
  }

  if (error) {
    return <div className={styles.error}>Error: {error}</div>;
  }

  return (
    <div className={styles.executionManager}>
      <div className={styles.header}>
        <h3>Workflow Executions</h3>
        <div className={styles.filters}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={styles.statusFilter}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {executions.length === 0 ? (
        <div className={styles.noExecutions}>
          No executions found for the selected criteria.
        </div>
      ) : (
        <>
          <div className={styles.executionsList}>
            {executions.map((execution) => (
              <div key={execution.id} className={styles.executionCard}>
                <div className={styles.executionHeader}>
                  <div className={styles.workflowInfo}>
                    <h4>{execution.workflow?.name || 'Unknown Workflow'}</h4>
                    <span className={styles.workflowType}>
                      {execution.workflow?.workflow_type} • {execution.trigger_event}
                    </span>
                  </div>
                  <div className={styles.statusAndActions}>
                    {getStatusBadge(execution.execution_status)}
                    {canCancelExecution(execution) && (
                      <button
                        onClick={() => cancelExecution(execution.id)}
                        disabled={cancelling.has(execution.id)}
                        className={styles.cancelButton}
                      >
                        {cancelling.has(execution.id) ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </div>

                <div className={styles.executionDetails}>
                  <div className={styles.customerInfo}>
                    <strong>Customer:</strong> {getCustomerName(execution)}
                  </div>
                  <div className={styles.currentStep}>
                    <strong>Current Step:</strong> {execution.current_step}
                  </div>
                  <div className={styles.timing}>
                    <div><strong>Created:</strong> {formatDate(execution.created_at)}</div>
                    <div><strong>Updated:</strong> {formatDate(execution.updated_at)}</div>
                    {execution.completed_at && (
                      <div><strong>Completed:</strong> {formatDate(execution.completed_at)}</div>
                    )}
                  </div>
                </div>

                {execution.execution_data?.cancellationReason && (
                  <div className={styles.cancellationInfo}>
                    <strong>Cancellation Reason:</strong> {execution.execution_data.cancellationReason}
                    {execution.execution_data.autoCancellation && (
                      <span className={styles.autoCancelled}> (Auto-cancelled)</span>
                    )}
                  </div>
                )}

                {execution.execution_data?.stepResults && (
                  <div className={styles.stepResults}>
                    <details>
                      <summary>Step Results ({execution.execution_data.stepResults.length} steps)</summary>
                      <div className={styles.stepsContainer}>
                        {execution.execution_data.stepResults.map((step: any, index: number) => (
                          <div key={index} className={`${styles.stepResult} ${step.success ? styles.success : styles.failed}`}>
                            <span className={styles.stepId}>{step.stepId}</span>
                            <span className={styles.stepStatus}>{step.success ? '✓' : '✗'}</span>
                            {step.error && <span className={styles.stepError}>{step.error}</span>}
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </div>
            ))}
          </div>

          {pagination.total > pagination.limit && (
            <div className={styles.pagination}>
              <button
                onClick={() => fetchExecutions(Math.max(0, pagination.offset - pagination.limit))}
                disabled={pagination.offset === 0 || loading}
                className={styles.paginationButton}
              >
                Previous
              </button>
              
              <span className={styles.paginationInfo}>
                Showing {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
              </span>
              
              <button
                onClick={() => fetchExecutions(pagination.offset + pagination.limit)}
                disabled={!pagination.hasMore || loading}
                className={styles.paginationButton}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}