'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './CampaignExecutions.module.scss';

interface CampaignExecutionsProps {
  campaignId: string;
  companyId: string;
  companyTimezone?: string;
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
}

export default function CampaignExecutions({ campaignId, companyId, companyTimezone = 'America/New_York' }: CampaignExecutionsProps) {
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

  useEffect(() => {
    fetchExecutions();
  }, [campaignId, filterStatus]);

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
        if (offset === 0) {
          setExecutions(result.executions || []);
        } else {
          setExecutions(prev => [...prev, ...(result.executions || [])]);
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
            <option value="failed">Failed</option>
          </select>
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
