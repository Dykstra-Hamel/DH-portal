'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Save,
  X,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Settings,
  Mail,
  Clock,
  GitBranch,
  User,
  ChevronDown,
  ChevronUp,
  Play,
  PhoneCall,
} from 'lucide-react';
import styles from './WorkflowEditor.module.scss';

interface WorkflowStep {
  id: string;
  type: 'send_email' | 'wait' | 'update_lead_status' | 'assign_lead' | 'conditional' | 'make_call';
  template_id?: string;
  delay_minutes?: number;
  new_status?: string;
  assign_to_user_id?: string;
  condition?: any;
  branches?: WorkflowBranch[];
  call_variables?: any;
  call_type?: 'immediate' | 'follow_up' | 'urgent';
  required?: boolean;
}

interface WorkflowBranch {
  id: string;
  condition_type: string;
  condition_operator: string;
  condition_value: any;
  branch_name: string;
  branch_steps: WorkflowStep[];
}

interface EmailTemplate {
  id: string;
  name: string;
  subject_line: string;
  template_type: string;
}

interface WorkflowEditorProps {
  isOpen: boolean;
  onClose: () => void;
  companyId: string;
  workflow?: any;
  onSave: (workflow: any) => void;
}

const WORKFLOW_TYPES = [
  { value: 'lead_nurturing', label: 'Lead Nurturing' },
  { value: 'email_sequence', label: 'Email Sequence' },
  { value: 'lead_scoring', label: 'Lead Scoring' },
  { value: 'follow_up', label: 'Follow-up' },
];

const TRIGGER_TYPES = [
  // { value: 'lead_created', label: 'New Lead Created' }, // Disabled - process not refined yet
  { value: 'widget_schedule_completed', label: 'Widget Schedule Form Completed' },
  { value: 'lead_updated', label: 'Lead Updated' },
  { value: 'lead_status_changed', label: 'Lead Status Changed' },
  { value: 'email_opened', label: 'Email Opened' },
  { value: 'email_clicked', label: 'Email Clicked' },
  { value: 'scheduled', label: 'Scheduled' },
];

const PEST_TYPES = [
  'ants', 'roaches', 'spiders', 'mice', 'rats', 'termites', 
  'bed bugs', 'wasps', 'mosquitoes', 'fleas', 'other'
];

const URGENCY_LEVELS = ['low', 'medium', 'high', 'urgent'];
const LEAD_SOURCES = ['organic', 'referral', 'google_cpc', 'facebook_ads', 'widget_submission', 'other'];
const LEAD_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'unqualified', label: 'Unqualified' },
];

export default function WorkflowEditor({ isOpen, onClose, companyId, workflow, onSave }: WorkflowEditorProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    workflow_type: 'lead_nurturing',
    trigger_type: 'widget_schedule_completed',
    trigger_conditions: {},
    workflow_steps: [] as WorkflowStep[],
    is_active: false,
    auto_cancel_on_status: true,
    cancel_on_statuses: ['won', 'closed_won', 'converted'],
  });
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [showTestResults, setShowTestResults] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('email_templates')
        .select('id, name, subject_line, template_type')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching templates:', error);
      } else {
        setTemplates(data || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
      if (workflow) {
        setFormData({
          name: workflow.name || '',
          description: workflow.description || '',
          workflow_type: workflow.workflow_type || 'lead_nurturing',
          trigger_type: workflow.trigger_type || 'widget_schedule_completed',
          trigger_conditions: workflow.trigger_conditions || {},
          workflow_steps: workflow.workflow_steps || [],
          is_active: workflow.is_active || false,
          auto_cancel_on_status: workflow.auto_cancel_on_status !== false,
          cancel_on_statuses: workflow.cancel_on_statuses || ['won', 'closed_won', 'converted'],
        });
      } else {
        // Reset form for new workflow
        setFormData({
          name: '',
          description: '',
          workflow_type: 'lead_nurturing',
          trigger_type: 'widget_schedule_completed',
          trigger_conditions: {},
          workflow_steps: [],
          is_active: false,
          auto_cancel_on_status: true,
          cancel_on_statuses: ['won', 'closed_won', 'converted'],
        });
      }
    }
  }, [isOpen, workflow, fetchTemplates]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Validation
      if (!formData.name.trim()) {
        setMessage({ type: 'error', text: 'Workflow name is required' });
        return;
      }

      if (formData.workflow_steps.length === 0) {
        setMessage({ type: 'error', text: 'At least one workflow step is required' });
        return;
      }

      // API call
      const url = workflow 
        ? `/api/companies/${companyId}/workflows/${workflow.id}`
        : `/api/companies/${companyId}/workflows`;
      
      const method = workflow ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        onSave(result.workflow);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
      setMessage({ type: 'error', text: 'Failed to save workflow' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setMessage(null);
      setTestResults(null);
      setShowTestResults(false);

      // Basic validation before testing
      if (!formData.name.trim()) {
        setMessage({ type: 'error', text: 'Workflow name is required for testing' });
        return;
      }

      if (formData.workflow_steps.length === 0) {
        setMessage({ type: 'error', text: 'At least one workflow step is required for testing' });
        return;
      }

      // For new workflows, we need to test the configuration as-is
      // For existing workflows, we can test the saved workflow
      const testWorkflowId = workflow?.id;
      
      if (!testWorkflowId) {
        setMessage({ type: 'error', text: 'Please save the workflow first before testing' });
        return;
      }

      const response = await fetch(`/api/companies/${companyId}/workflows/${testWorkflowId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleLead: {
            name: 'John Smith',
            email: 'john.smith@example.com',
            phone: '(555) 123-4567',
            pest_type: 'ants',
            urgency: 'high',
            lead_source: 'website'
          }
        }),
      });

      const result = await response.json();

      if (result.success) {
        setTestResults(result.testResult);
        setShowTestResults(true);
        setMessage({ type: 'success', text: `Test completed successfully! ${result.testResult.summary.totalSteps} steps executed.` });
      } else {
        if (result.validationErrors && result.validationErrors.length > 0) {
          setMessage({ 
            type: 'error', 
            text: `Workflow validation failed: ${result.validationErrors.join(', ')}` 
          });
        } else {
          setMessage({ type: 'error', text: result.error || 'Test failed' });
        }
      }
    } catch (error) {
      console.error('Error testing workflow:', error);
      setMessage({ type: 'error', text: 'Failed to test workflow' });
    } finally {
      setTesting(false);
    }
  };

  const addStep = (stepType: string) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type: stepType as any,
      required: stepType === 'send_email',
    };

    if (stepType === 'send_email') {
      newStep.delay_minutes = 0;
    } else if (stepType === 'wait') {
      newStep.delay_minutes = 60;
    } else if (stepType === 'make_call') {
      newStep.delay_minutes = 0;
      newStep.call_variables = {};
    } else if (stepType === 'conditional') {
      newStep.branches = [];
      newStep.condition = {
        field: 'urgency',
        operator: 'equals',
        value: 'high'
      };
    }

    setFormData(prev => ({
      ...prev,
      workflow_steps: [...prev.workflow_steps, newStep],
    }));
    
    // Expand the new step
    setExpandedSteps(prev => new Set(prev).add(newStep.id));
  };

  const updateStep = (stepId: string, updates: Partial<WorkflowStep>) => {
    setFormData(prev => ({
      ...prev,
      workflow_steps: prev.workflow_steps.map(step =>
        step.id === stepId ? { ...step, ...updates } : step
      ),
    }));
  };

  const deleteStep = (stepId: string) => {
    setFormData(prev => ({
      ...prev,
      workflow_steps: prev.workflow_steps.filter(step => step.id !== stepId),
    }));
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      newSet.delete(stepId);
      return newSet;
    });
  };

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    setFormData(prev => {
      const steps = [...prev.workflow_steps];
      const index = steps.findIndex(s => s.id === stepId);
      
      if (direction === 'up' && index > 0) {
        [steps[index - 1], steps[index]] = [steps[index], steps[index - 1]];
      } else if (direction === 'down' && index < steps.length - 1) {
        [steps[index], steps[index + 1]] = [steps[index + 1], steps[index]];
      }
      
      return { ...prev, workflow_steps: steps };
    });
  };

  const toggleStepExpansion = (stepId: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stepId)) {
        newSet.delete(stepId);
      } else {
        newSet.add(stepId);
      }
      return newSet;
    });
  };

  const renderStepContent = (step: WorkflowStep, index: number) => {
    const isExpanded = expandedSteps.has(step.id);
    
    return (
      <div key={step.id} className={styles.workflowStep}>
        <div className={styles.stepHeader} onClick={() => toggleStepExpansion(step.id)}>
          <div className={styles.stepInfo}>
            <div className={styles.stepIcon}>
              {step.type === 'send_email' && <Mail size={16} />}
              {step.type === 'wait' && <Clock size={16} />}
              {step.type === 'make_call' && <PhoneCall size={16} />}
              {step.type === 'conditional' && <GitBranch size={16} />}
              {step.type === 'assign_lead' && <User size={16} />}
              {step.type === 'update_lead_status' && <Settings size={16} />}
            </div>
            <div className={styles.stepDetails}>
              <span className={styles.stepTitle}>
                Step {index + 1}: {getStepTypeName(step.type)}
              </span>
              <span className={styles.stepDescription}>
                {getStepDescription(step, templates)}
              </span>
            </div>
          </div>
          <div className={styles.stepActions}>
            {index > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); moveStep(step.id, 'up'); }}
                className={styles.moveButton}
              >
                <ChevronUp size={14} />
              </button>
            )}
            {index < formData.workflow_steps.length - 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); moveStep(step.id, 'down'); }}
                className={styles.moveButton}
              >
                <ChevronDown size={14} />
              </button>
            )}
            <button 
              onClick={(e) => { e.stopPropagation(); deleteStep(step.id); }}
              className={styles.deleteButton}
            >
              <Trash2 size={14} />
            </button>
            <button className={styles.expandButton}>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className={styles.stepContent}>
            {step.type === 'send_email' && (
              <>
                <div className={styles.formGroup}>
                  <label>Email Template *</label>
                  <select
                    value={step.template_id || ''}
                    onChange={(e) => updateStep(step.id, { template_id: e.target.value })}
                  >
                    <option value="">Select a template</option>
                    {templates.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name} - {template.subject_line}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Delay (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    max="10080"
                    value={step.delay_minutes || 0}
                    onChange={(e) => updateStep(step.id, { delay_minutes: parseInt(e.target.value) || 0 })}
                  />
                  <small>0 = immediate, 60 = 1 hour, 1440 = 1 day</small>
                </div>
              </>
            )}

            {step.type === 'wait' && (
              <div className={styles.formGroup}>
                <label>Wait Duration (minutes) *</label>
                <input
                  type="number"
                  min="1"
                  max="10080"
                  value={step.delay_minutes || 60}
                  onChange={(e) => updateStep(step.id, { delay_minutes: parseInt(e.target.value) || 60 })}
                />
              </div>
            )}


            {step.type === 'make_call' && (
              <>
                <div className={styles.formGroup}>
                  <label>Call Type</label>
                  <select
                    value={step.call_type || 'immediate'}
                    onChange={(e) => updateStep(step.id, { call_type: e.target.value as 'immediate' | 'follow_up' | 'urgent' })}
                  >
                    <option value="immediate">Immediate Call</option>
                    <option value="follow_up">Follow-up Call</option>
                    <option value="urgent">Urgent Call</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Delay (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={step.delay_minutes || 0}
                    onChange={(e) => updateStep(step.id, { delay_minutes: parseInt(e.target.value) || 0 })}
                  />
                  <small>0 = immediate, up to 60 minutes for immediate calls</small>
                </div>
              </>
            )}

            {step.type === 'conditional' && (
              <>
                <div className={styles.formGroup}>
                  <label>Condition Field *</label>
                  <select
                    value={step.condition?.field || ''}
                    onChange={(e) => updateStep(step.id, { 
                      condition: { ...step.condition, field: e.target.value }
                    })}
                  >
                    <option value="">Select field</option>
                    <option value="urgency">Urgency Level</option>
                    <option value="pest_type">Pest Type</option>
                    <option value="lead_source">Lead Source</option>
                    <option value="lead_status">Lead Status</option>
                    <option value="lead_age_hours">Lead Age (Hours)</option>
                    <option value="call_outcome">Call Outcome</option>
                    <option value="email_opened">Email Opened</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Operator *</label>
                  <select
                    value={step.condition?.operator || ''}
                    onChange={(e) => updateStep(step.id, { 
                      condition: { ...step.condition, operator: e.target.value }
                    })}
                  >
                    <option value="">Select operator</option>
                    <option value="equals">Equals</option>
                    <option value="not_equals">Not Equals</option>
                    <option value="greater_than">Greater Than</option>
                    <option value="less_than">Less Than</option>
                    <option value="contains">Contains</option>
                    <option value="in_array">In Array</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Value *</label>
                  <input
                    type="text"
                    value={step.condition?.value || ''}
                    onChange={(e) => updateStep(step.id, { 
                      condition: { ...step.condition, value: e.target.value }
                    })}
                    placeholder="Enter comparison value"
                  />
                  <small>For &quot;In Array&quot;, separate values with commas</small>
                </div>
              </>
            )}

            {step.type === 'update_lead_status' && (
              <div className={styles.formGroup}>
                <label>New Lead Status *</label>
                <select
                  value={step.new_status || ''}
                  onChange={(e) => updateStep(step.id, { new_status: e.target.value })}
                >
                  <option value="">Select status</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                  <option value="quoted">Quoted</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                  <option value="unqualified">Unqualified</option>
                </select>
              </div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={step.required !== false}
                  onChange={(e) => updateStep(step.id, { required: e.target.checked })}
                />
                Required step (workflow stops if this fails)
              </label>
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{workflow ? 'Edit Workflow' : 'Create New Workflow'}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        {showTestResults && testResults && (
          <div className={styles.testResults}>
            <h3>Test Results</h3>
            <div className={styles.testSummary}>
              <div className={styles.summaryStats}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Total Steps:</span>
                  <span className={styles.statValue}>{testResults.summary.totalSteps}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Successful:</span>
                  <span className={styles.statValue}>{testResults.summary.successfulSteps}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Email Steps:</span>
                  <span className={styles.statValue}>{testResults.summary.emailSteps}</span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>Duration:</span>
                  <span className={styles.statValue}>{testResults.summary.estimatedTotalDuration} min</span>
                </div>
              </div>
            </div>
            
            {testResults.steps && testResults.steps.length > 0 && (
              <div className={styles.testSteps}>
                <h4>Step Execution Results:</h4>
                {testResults.steps.map((step: any, index: number) => (
                  <div key={index} className={`${styles.testStep} ${styles[step.status]}`}>
                    <div className={styles.stepNumber}>Step {step.stepNumber}</div>
                    <div className={styles.stepType}>{step.type.replace('_', ' ').toUpperCase()}</div>
                    <div className={styles.stepMessage}>{step.message}</div>
                    {step.status === 'success' ? (
                      <CheckCircle size={16} className={styles.stepIcon} />
                    ) : (
                      <AlertCircle size={16} className={styles.stepIcon} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {testResults.emailPreviews && testResults.emailPreviews.length > 0 && (
              <div className={styles.emailPreviews}>
                <h4>Email Previews:</h4>
                {testResults.emailPreviews.map((preview: any, index: number) => (
                  <div key={index} className={styles.emailPreview}>
                    <div className={styles.previewHeader}>
                      <span className={styles.previewTitle}>Step {preview.stepNumber}: {preview.templateName}</span>
                      {preview.delay > 0 && (
                        <span className={styles.previewDelay}>Delay: {preview.delay} min</span>
                      )}
                    </div>
                    <div className={styles.previewSubject}>
                      <strong>Subject:</strong> {preview.subject}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className={styles.modalBody}>
          <div className={styles.formSection}>
            <h3>Basic Information</h3>
            
            <div className={styles.formGroup}>
              <label>Workflow Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Lead Nurturing Sequence"
              />
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this workflow does..."
                rows={3}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Workflow Type *</label>
                <select
                  value={formData.workflow_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, workflow_type: e.target.value }))}
                >
                  {WORKFLOW_TYPES.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Trigger *</label>
                <select
                  value={formData.trigger_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, trigger_type: e.target.value }))}
                >
                  {TRIGGER_TYPES.map(trigger => (
                    <option key={trigger.value} value={trigger.value}>{trigger.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lead Status Change Conditions */}
            {formData.trigger_type === 'lead_status_changed' && (
              <div className={styles.formSection}>
                <h4>Status Change Conditions</h4>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>From Status (optional)</label>
                    <select
                      value={(formData.trigger_conditions as any)?.from_status || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        trigger_conditions: { 
                          ...prev.trigger_conditions, 
                          from_status: e.target.value || undefined 
                        } 
                      }))}
                    >
                      <option value="">Any Status</option>
                      {LEAD_STATUSES.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                    <small>Leave empty to trigger from any status</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label>To Status *</label>
                    <select
                      value={(formData.trigger_conditions as any)?.to_status || ''}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        trigger_conditions: { 
                          ...prev.trigger_conditions, 
                          to_status: e.target.value 
                        } 
                      }))}
                    >
                      <option value="">Select target status</option>
                      {LEAD_STATUSES.map(status => (
                        <option key={status.value} value={status.value}>{status.label}</option>
                      ))}
                    </select>
                    <small>Required: workflow triggers when lead reaches this status</small>
                  </div>
                </div>
              </div>
            )}

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  />
                  Active (workflow will run when triggered)
                </label>
              </div>


              <div className={styles.formGroup}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={formData.auto_cancel_on_status}
                    onChange={(e) => setFormData(prev => ({ ...prev, auto_cancel_on_status: e.target.checked }))}
                  />
                  Auto-cancel when lead reaches terminal status
                </label>
                <small className={styles.fieldHint}>
                  Automatically cancel pending workflows when lead is won, converted, or closed
                </small>
              </div>

              {formData.auto_cancel_on_status && (
                <div className={styles.formGroup}>
                  <label>Cancel on these statuses:</label>
                  <div className={styles.statusCheckboxes}>
                    {LEAD_STATUSES.map(status => (
                      <label key={status.value} className={styles.checkbox}>
                        <input
                          type="checkbox"
                          checked={formData.cancel_on_statuses.includes(status.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                cancel_on_statuses: [...prev.cancel_on_statuses, status.value]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                cancel_on_statuses: prev.cancel_on_statuses.filter(s => s !== status.value)
                              }));
                            }
                          }}
                        />
                        {status.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.formSection}>
            <h3>Workflow Steps</h3>
            
            <div className={styles.addStepButtons}>
              <button 
                onClick={() => addStep('send_email')} 
                className={styles.addStepButton}
              >
                <Mail size={16} />
                Add Email
              </button>
              <button 
                onClick={() => addStep('wait')} 
                className={styles.addStepButton}
              >
                <Clock size={16} />
                Add Wait
              </button>
              <button 
                onClick={() => addStep('make_call')} 
                className={styles.addStepButton}
              >
                <PhoneCall size={16} />
                Make Call
              </button>
              <button 
                onClick={() => addStep('conditional')} 
                className={styles.addStepButton}
              >
                <GitBranch size={16} />
                Add Branch
              </button>
              <button 
                onClick={() => addStep('update_lead_status')} 
                className={styles.addStepButton}
              >
                <Settings size={16} />
                Update Status
              </button>
            </div>

            <div className={styles.workflowSteps}>
              {formData.workflow_steps.length === 0 ? (
                <div className={styles.emptySteps}>
                  <p>No steps added yet. Click the buttons above to add workflow steps.</p>
                </div>
              ) : (
                formData.workflow_steps.map((step, index) => renderStepContent(step, index))
              )}
            </div>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.cancelButton}>
            Cancel
          </button>
          {workflow && (
            <button 
              onClick={handleTest} 
              disabled={testing}
              className={styles.testButton}
            >
              <Play size={16} />
              {testing ? 'Testing...' : 'Test Workflow'}
            </button>
          )}
          <button 
            onClick={handleSave} 
            disabled={saving}
            className={styles.saveButton}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Workflow'}
          </button>
        </div>
      </div>
    </div>
  );
}

function getStepTypeName(type: string): string {
  const names = {
    send_email: 'Send Email',
    wait: 'Wait/Delay',
    make_call: 'Make Call',
    conditional: 'Conditional Branch',
    update_lead_status: 'Update Lead Status',
    assign_lead: 'Assign Lead',
  };
  return names[type as keyof typeof names] || type;
}

function getStepDescription(step: WorkflowStep, templates: EmailTemplate[]): string {
  switch (step.type) {
    case 'send_email':
      if (step.template_id) {
        const template = templates.find(t => t.id === step.template_id);
        return `Send "${template?.name || 'Unknown'}" ${step.delay_minutes ? `after ${step.delay_minutes} minutes` : 'immediately'}`;
      }
      return 'Email template not selected';
    case 'wait':
      return `Wait ${step.delay_minutes || 60} minutes`;
    case 'make_call':
      return `Make AI call ${step.delay_minutes ? `after ${step.delay_minutes} minutes` : 'immediately'}`;
    case 'conditional':
      if (step.condition) {
        return `Branch on ${step.condition.field} ${step.condition.operator} ${step.condition.value}`;
      }
      return 'Conditional branch not configured';
    case 'update_lead_status':
      return `Update status to "${step.new_status || 'not set'}"`;
    case 'assign_lead':
      return 'Assign lead to user';
    default:
      return 'Step configuration needed';
  }
}