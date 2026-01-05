'use client';

import { useEffect, useState, useRef } from 'react';
import { CheckCircle, XCircle, Clock, Loader, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  createCampaignExecutionChannel,
  subscribeToCampaignExecutionUpdates,
  CampaignExecutionUpdatePayload,
  removeCampaignExecutionChannel
} from '@/lib/realtime/campaign-execution-channel';
import styles from './CampaignExecutions.module.scss';

interface CampaignExecutionsProps {
  campaignId: string;
  companyId: string;
  companyTimezone?: string;
  onExecutionCountChange?: (count: number) => void;
}

interface Customer {
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
}

interface StepResult {
  stepIndex: number;
  stepType: string;
  completedAt: string;
  result: any;
  success: boolean;
}

interface Execution {
  id: string;
  customer_id: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  workflow_run_id: string | null;
  customers: Customer;
  step_results: StepResult[];
  cancellation_reason: string | null;
  cancelled_at_step: string | number | null;
}

export default function CampaignExecutions({ campaignId, companyId, companyTimezone = 'America/New_York', onExecutionCountChange }: CampaignExecutionsProps) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    offset: 0,
    hasMore: false,
  });

  // Track execution IDs we've seen to prevent duplicate counting
  const seenExecutionIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Clear seen IDs when campaign changes
    seenExecutionIds.current.clear();
    fetchExecutions();
  }, [campaignId, filterStatus]);

  // Notify parent when execution count changes
  useEffect(() => {
    if (onExecutionCountChange) {
      onExecutionCountChange(pagination.total);
    }
  }, [pagination.total, onExecutionCountChange]);

  // Realtime subscription for execution updates
  useEffect(() => {
    if (!campaignId) return;

    const channel = createCampaignExecutionChannel(campaignId);

    subscribeToCampaignExecutionUpdates(channel, async (payload: CampaignExecutionUpdatePayload) => {
      const { campaign_id, action, execution_id } = payload;

      // Verify this update is for the current campaign
      if (campaign_id !== campaignId) return;

      if (action === 'INSERT' || action === 'UPDATE') {
        // Fetch just the updated execution instead of all executions
        try {
          const supabase = createClient();
          const { data: execution, error } = await supabase
            .from('campaign_executions')
            .select(`
              id,
              customer_id,
              lead_id,
              execution_status,
              started_at,
              completed_at,
              automation_execution_id,
              customers(
                id,
                first_name,
                last_name,
                email,
                phone
              ),
              automation_execution:automation_executions(execution_data, error_message)
            `)
            .eq('id', execution_id)
            .single();

          if (error) {
            console.error('Error fetching updated execution:', error);
            return;
          }

          if (execution) {
            // Supabase returns foreign keys as arrays, extract first element
            const automationExec = Array.isArray(execution.automation_execution)
              ? execution.automation_execution[0]
              : execution.automation_execution;

            const customer = Array.isArray(execution.customers)
              ? execution.customers[0]
              : execution.customers;

            // Map execution_status to status for frontend compatibility (matches API mapping)
            const mappedExecution: Execution = {
              ...execution,
              customers: customer,
              status: execution.execution_status,
              workflow_run_id: execution.automation_execution_id,
              error_message: automationExec?.error_message || null,
              step_results: automationExec?.execution_data?.stepResults || [],
              cancellation_reason: automationExec?.execution_data?.cancellationReason || null,
              cancelled_at_step: automationExec?.execution_data?.cancelledAtStep || null,
            };

            setExecutions(prev => {
              const exists = prev.some(exec => exec.id === mappedExecution.id);

              let newExecutions;
              if (exists) {
                // Update existing execution
                newExecutions = prev.map(exec =>
                  exec.id === mappedExecution.id ? mappedExecution : exec
                );
              } else {
                // Add new execution to beginning of list
                newExecutions = [mappedExecution, ...prev];

                // Only increment count if this is truly a new execution we haven't seen before
                if (!seenExecutionIds.current.has(mappedExecution.id)) {
                  seenExecutionIds.current.add(mappedExecution.id);
                  setPagination(prevPag => ({
                    ...prevPag,
                    total: prevPag.total + 1,
                  }));
                }
              }

              return newExecutions;
            });
          }
        } catch (error) {
          console.error('Error handling execution update:', error);
        }
      } else if (action === 'DELETE') {
        // Remove execution from list and decrement total count
        setExecutions(prev => {
          const prevLength = prev.length;
          const filtered = prev.filter(exec => exec.id !== execution_id);

          // Only update count if array length actually changed
          if (filtered.length < prevLength && seenExecutionIds.current.has(execution_id)) {
            seenExecutionIds.current.delete(execution_id);
            setPagination(prevPag => ({
              ...prevPag,
              total: Math.max(0, prevPag.total - 1),
            }));
          }

          return filtered;
        });
      }
    });

    return () => {
      removeCampaignExecutionChannel(channel);
    };
  }, [campaignId]);

  const fetchExecutions = async (offset = 0) => {
    try {
      setLoading(true);

      const url = new URL(`/api/campaigns/${campaignId}/executions`, window.location.origin);
      url.searchParams.set('limit', '50');
      url.searchParams.set('offset', offset.toString());
      if (filterStatus !== 'all') {
        url.searchParams.set('status', filterStatus);
      }

      const response = await fetch(url.toString());
      const result = await response.json();

      console.log('Executions API response:', {
        success: result.success,
        executionsLength: result.executions?.length,
        pagination: result.pagination,
      });

      if (result.success) {
        const newExecutions = result.executions || [];

        if (offset === 0) {
          setExecutions(newExecutions);
          // Reset seen IDs when fetching fresh data
          seenExecutionIds.current = new Set(newExecutions.map((e: Execution) => e.id));
        } else {
          setExecutions(prev => [...prev, ...newExecutions]);
          // Add new IDs to seen set
          newExecutions.forEach((e: Execution) => seenExecutionIds.current.add(e.id));
        }
        setPagination(result.pagination);
      } else {
        console.error('API returned error:', result.error);
      }
    } catch (error) {
      console.error('Error fetching executions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    const newOffset = pagination.offset + pagination.limit;
    fetchExecutions(newOffset);
  };

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const getStatusIcon = (status: string) => {
    if (!status) return <Clock size={20} className={styles.iconPending} />;

    switch (status) {
      case 'completed':
        return <CheckCircle size={20} className={styles.iconCompleted} />;
      case 'failed':
        return <XCircle size={20} className={styles.iconFailed} />;
      case 'running':
        return <Loader size={20} className={styles.iconRunning} />;
      default:
        return <Clock size={20} className={styles.iconPending} />;
    }
  };

  const getStatusLabel = (status: string) => {
    if (!status) return 'Pending';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'send_email':
        return '📧';
      case 'make_call':
        return '📞';
      case 'send_sms':
        return '💬';
      case 'delay':
      case 'wait':
        return '⏱️';
      default:
        return '•';
    }
  };

  const getStepLabel = (stepType: string, result: any) => {
    switch (stepType) {
      case 'send_email':
        return `Sent Email${result?.subject ? `: ${result.subject}` : ''}`;
      case 'make_call':
        return `Made Phone Call${result?.duration ? ` (${Math.round(result.duration / 60)}min)` : ''}`;
      case 'send_sms':
        return 'Sent SMS Message';
      case 'delay':
      case 'wait':
        return `Waited${result?.duration ? ` ${result.duration} seconds` : ''}`;
      default:
        return stepType;
    }
  };

  if (loading && executions.length === 0) {
    return <div className={styles.loading}>Loading executions...</div>;
  }

  return (
    <div className={styles.executionsContainer}>
      <div className={styles.header}>
        <h2>Workflow Executions</h2>
        <div className={styles.filters}>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="failed">Failed</option>
          </select>
          <button
            onClick={() => fetchExecutions(0)}
            disabled={loading}
            className={styles.refreshButton}
            title="Refresh executions"
          >
            <RefreshCw size={16} className={loading ? styles.spinning : ''} />
          </button>
        </div>
      </div>

      {executions.length === 0 ? (
        <div className={styles.emptyState}>
          <Clock size={48} />
          <h3>No Executions</h3>
          <p>Workflow executions will appear here once the campaign starts</p>
        </div>
      ) : (
        <>
          <div className={styles.executionsList}>
            {executions.map(execution => (
              <div key={execution.id} className={styles.executionCard}>
                <div className={styles.executionHeader} onClick={() => toggleExpanded(execution.id)}>
                  <div className={styles.customerInfo}>
                    {getStatusIcon(execution.status)}
                    <div>
                      <p className={styles.customerName}>
                        {execution.customers.first_name} {execution.customers.last_name}
                      </p>
                      <p className={styles.customerContact}>
                        {execution.customers.email}
                        {execution.customers.phone && ` • ${execution.customers.phone}`}
                      </p>
                    </div>
                  </div>
                  <div className={styles.executionMeta}>
                    <span className={`${styles.statusBadge} ${styles[`status${getStatusLabel(execution.status)}`]}`}>
                      {getStatusLabel(execution.status)}
                    </span>
                    <button className={styles.expandButton}>
                      {expandedIds.has(execution.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>

                {expandedIds.has(execution.id) && (
                  <div className={styles.executionDetails}>
                    <div className={styles.detailsGrid}>
                      {execution.started_at && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Started At:</span>
                          <span className={styles.detailValue}>
                            {new Date(execution.started_at).toLocaleString('en-US', { timeZone: companyTimezone })}
                          </span>
                        </div>
                      )}
                      {execution.completed_at && (
                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Completed At:</span>
                          <span className={styles.detailValue}>
                            {new Date(execution.completed_at).toLocaleString('en-US', { timeZone: companyTimezone })}
                          </span>
                        </div>
                      )}
                    </div>

                    {execution.step_results && execution.step_results.length > 0 && (
                      <div className={styles.stepsSection}>
                        <h4 className={styles.stepsHeader}>Steps Taken:</h4>
                        <div className={styles.stepsList}>
                          {execution.step_results.map((step, idx) => (
                            <div
                              key={idx}
                              className={`${styles.stepItem} ${step.success ? styles.stepSuccess : styles.stepFailed}`}
                            >
                              <span className={styles.stepIcon}>{getStepIcon(step.stepType)}</span>
                              <span className={styles.stepLabel}>{getStepLabel(step.stepType, step.result)}</span>
                              {!step.success && step.result?.error && (
                                <span className={styles.stepError}>- {step.result.error}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {execution.status === 'cancelled' && execution.cancellation_reason && (
                      <div className={styles.cancellationMessage}>
                        <strong>Cancellation Reason:</strong> {execution.cancellation_reason}
                      </div>
                    )}

                    {execution.error_message && (
                      <div className={styles.errorMessage}>
                        <strong>Error:</strong> {execution.error_message}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {pagination.hasMore && (
            <div className={styles.loadMoreContainer}>
              <button onClick={loadMore} className={styles.loadMoreButton} disabled={loading}>
                {loading ? 'Loading...' : `Load More (${pagination.total - executions.length} remaining)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
