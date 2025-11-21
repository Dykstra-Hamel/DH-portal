'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TrendingUp, Mail, MessageSquare, Phone, Clock, Plus } from 'lucide-react';
import WorkflowEditor from '@/components/Automation/WorkflowEditor';
import styles from './WorkflowSelector.module.scss';

interface WorkflowSelectorProps {
  companyId: string;
  selectedWorkflowId: string;
  onSelect: (workflowId: string, workflow: any) => void;
}

export default function WorkflowSelector({
  companyId,
  selectedWorkflowId,
  onSelect
}: WorkflowSelectorProps) {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<any>(null);
  const [showWorkflowEditor, setShowWorkflowEditor] = useState(false);

  useEffect(() => {
    fetchWorkflows();
  }, [companyId]);

  useEffect(() => {
    if (selectedWorkflowId && workflows.length > 0) {
      const workflow = workflows.find(w => w.id === selectedWorkflowId);
      setSelectedWorkflow(workflow);
    }
  }, [selectedWorkflowId, workflows]);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = createClient();

      const { data, error: fetchError } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (fetchError) {
        console.error('Error fetching workflows:', fetchError.message || fetchError);
        setError('Failed to load workflows. Please try again.');
        return;
      }

      setWorkflows(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching workflows:', errorMessage);
      setError('Failed to load workflows. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleWorkflowCreated = (newWorkflow: any) => {
    // Close the editor
    setShowWorkflowEditor(false);
    // Refresh workflows list
    fetchWorkflows();
    // Auto-select the newly created workflow
    if (newWorkflow?.id) {
      handleSelect(newWorkflow);
    }
  };

  const handleSelect = (workflow: any) => {
    setSelectedWorkflow(workflow);
    onSelect(workflow.id, workflow);
  };

  const getStepIcon = (stepType: string) => {
    switch (stepType) {
      case 'send_email':
        return <Mail size={14} />;
      case 'send_sms':
        return <MessageSquare size={14} />;
      case 'make_call':
        return <Phone size={14} />;
      case 'wait':
        return <Clock size={14} />;
      default:
        return <TrendingUp size={14} />;
    }
  };

  const getStepLabel = (stepType: string) => {
    const labels: Record<string, string> = {
      send_email: 'Email',
      send_sms: 'SMS',
      make_call: 'Call',
      wait: 'Wait',
      conditional: 'Branch',
      update_lead_status: 'Update Status',
    };
    return labels[stepType] || stepType;
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        Loading workflows...
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <TrendingUp size={48} />
        <h3>Error Loading Workflows</h3>
        <p>{error}</p>
        <button onClick={fetchWorkflows} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  if (workflows.length === 0) {
    return (
      <>
        <div className={styles.emptyState}>
          <TrendingUp size={48} />
          <h3>No Workflows Found</h3>
          <p>You need to create an automation workflow before creating a campaign.</p>
          <div className={styles.emptyStateActions}>
            <button onClick={() => setShowWorkflowEditor(true)} className={styles.createButton}>
              <Plus size={16} />
              Create New Workflow
            </button>
            <a href="/automation" className={styles.createLink}>
              Go to Automation Settings →
            </a>
          </div>
        </div>

        {showWorkflowEditor && (
          <WorkflowEditor
            isOpen={showWorkflowEditor}
            onClose={() => setShowWorkflowEditor(false)}
            companyId={companyId}
            onSave={handleWorkflowCreated}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className={styles.workflowSelector}>
        <div className={styles.header}>
          <div>
            <h3>Select a Workflow</h3>
            <p className={styles.description}>
              Choose the automation workflow that will be executed for each contact in this campaign.
            </p>
          </div>
          <button onClick={() => setShowWorkflowEditor(true)} className={styles.createButton}>
            <Plus size={16} />
            Create New Workflow
          </button>
        </div>

        <div className={styles.workflowsList}>
        {workflows.map(workflow => (
          <div
            key={workflow.id}
            className={`${styles.workflowCard} ${
              selectedWorkflowId === workflow.id ? styles.selected : ''
            }`}
            onClick={() => handleSelect(workflow)}
          >
            <div className={styles.cardHeader}>
              <div className={styles.cardTitle}>
                <h4>{workflow.name}</h4>
                <span className={styles.workflowType}>
                  {workflow.workflow_type.replace('_', ' ')}
                </span>
              </div>
              {selectedWorkflowId === workflow.id && (
                <div className={styles.selectedBadge}>Selected</div>
              )}
            </div>

            {workflow.description && (
              <p className={styles.cardDescription}>{workflow.description}</p>
            )}

            {workflow.workflow_steps && workflow.workflow_steps.length > 0 && (
              <div className={styles.stepsPreview}>
                <span className={styles.stepsLabel}>Steps:</span>
                <div className={styles.stepsList}>
                  {workflow.workflow_steps.map((step: any, index: number) => (
                    <div key={index} className={styles.stepBadge}>
                      {getStepIcon(step.type)}
                      <span>{getStepLabel(step.type)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedWorkflow && (
        <div className={styles.workflowDetails}>
          <h4>Workflow Details</h4>
          <div className={styles.detailsContent}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Name:</span>
              <span className={styles.detailValue}>{selectedWorkflow.name}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Type:</span>
              <span className={styles.detailValue}>
                {selectedWorkflow.workflow_type.replace('_', ' ')}
              </span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Total Steps:</span>
              <span className={styles.detailValue}>
                {selectedWorkflow.workflow_steps?.length || 0}
              </span>
            </div>
            {selectedWorkflow.description && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Description:</span>
                <span className={styles.detailValue}>{selectedWorkflow.description}</span>
              </div>
            )}
          </div>
        </div>
      )}
      </div>

      {showWorkflowEditor && (
        <WorkflowEditor
          isOpen={showWorkflowEditor}
          onClose={() => setShowWorkflowEditor(false)}
          companyId={companyId}
          onSave={handleWorkflowCreated}
        />
      )}
    </>
  );
}
