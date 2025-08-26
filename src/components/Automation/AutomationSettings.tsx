'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Save,
  AlertCircle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
  Play,
  Pause,
  Mail,
  Clock,
  Users,
  BarChart3,
  Settings,
  BookOpen,
} from 'lucide-react';
import WorkflowEditor from './WorkflowEditor';
import EmailTemplateEditor from './EmailTemplateEditor';
import ABTestManager from './ABTestManager/ABTestManager';
import TemplateLibraryBrowser from './TemplateLibraryBrowser';
import styles from './AutomationSettings.module.scss';

interface AutomationWorkflow {
  id: string;
  name: string;
  description: string;
  workflow_type: string;
  trigger_type: string;
  trigger_conditions: any;
  workflow_steps: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EmailTemplate {
  id?: string;
  name: string;
  description: string;
  template_type: string;
  subject_line: string;
  html_content: string;
  text_content: string;
  variables?: string[];
  is_active: boolean;
}

interface AutomationSettingsProps {
  companyId: string;
}

export default function AutomationSettings({ companyId }: AutomationSettingsProps) {
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'workflows' | 'templates' | 'template-library' | 'ab-testing' | 'analytics'>('overview');
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [workflowEditorOpen, setWorkflowEditorOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<AutomationWorkflow | null>(null);
  const [templateEditorOpen, setTemplateEditorOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [automationSettings, setAutomationSettings] = useState({
    automation_enabled: true,
    automation_max_emails_per_day: 10,
  });

  const fetchAutomationData = useCallback(async () => {
    if (!companyId) return;
    
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch company information
      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (company) {
        setCompanyName(company.name || '');
      }

      // Fetch workflows
      const { data: workflows } = await supabase
        .from('automation_workflows')
        .select('*')
        .eq('company_id', companyId);

      if (workflows) {
        setWorkflows(workflows);
      }

      // Fetch email templates
      const { data: templates } = await supabase
        .from('email_templates')
        .select('*')
        .eq('company_id', companyId);

      if (templates) {
        setTemplates(templates);
      }

      // Fetch automation settings via API
      try {
        const settingsResponse = await fetch(`/api/companies/${companyId}/settings`);
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          if (settingsData.success && settingsData.settings) {
            const settings = settingsData.settings;
            setAutomationSettings({
              automation_enabled: settings.automation_enabled?.value ?? true,
              automation_max_emails_per_day: settings.automation_max_emails_per_day?.value ?? 10,
            });
          }
        }
      } catch (settingsError) {
        console.error('Error fetching settings:', settingsError);
        // Keep default values if settings fetch fails
      }
    } catch (error) {
      console.error('Error fetching automation data:', error);
      setMessage({ type: 'error', text: 'Failed to load automation data' });
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchAutomationData();
  }, [fetchAutomationData]);


  const handleToggleWorkflow = async (workflowId: string, currentActive: boolean) => {
    try {
      const supabase = createClient();
      
      const { error } = await supabase
        .from('automation_workflows')
        .update({ is_active: !currentActive })
        .eq('id', workflowId)
        .eq('company_id', companyId);

      if (error) {
        throw error;
      }

      // Update local state
      setWorkflows(prev => 
        prev.map(w => 
          w.id === workflowId ? { ...w, is_active: !currentActive } : w
        )
      );

      setMessage({
        type: 'success',
        text: `Workflow ${!currentActive ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error toggling workflow:', error);
      setMessage({ type: 'error', text: 'Failed to update workflow' });
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const response = await fetch(`/api/companies/${companyId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            automation_enabled: { value: automationSettings.automation_enabled, type: 'boolean' },
            automation_max_emails_per_day: { value: automationSettings.automation_max_emails_per_day, type: 'number' },
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      setMessage({ type: 'success', text: 'Automation settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateWorkflow = () => {
    setEditingWorkflow(null);
    setWorkflowEditorOpen(true);
  };

  const handleEditWorkflow = (workflow: AutomationWorkflow) => {
    setEditingWorkflow(workflow);
    setWorkflowEditorOpen(true);
  };

  const handleWorkflowSaved = (savedWorkflow: AutomationWorkflow) => {
    if (editingWorkflow) {
      // Update existing workflow
      setWorkflows(prev => prev.map(w => w.id === savedWorkflow.id ? savedWorkflow : w));
    } else {
      // Add new workflow
      setWorkflows(prev => [savedWorkflow, ...prev]);
    }
    setWorkflowEditorOpen(false);
    setEditingWorkflow(null);
    setMessage({ type: 'success', text: 'Workflow saved successfully!' });
  };

  const handleDeleteWorkflow = async (workflowId: string, workflowName: string) => {
    if (!confirm(`Are you sure you want to delete the workflow "${workflowName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/companies/${companyId}/workflows/${workflowId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setWorkflows(prev => prev.filter(w => w.id !== workflowId));
        setMessage({ type: 'success', text: result.message });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      setMessage({ type: 'error', text: 'Failed to delete workflow' });
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateEditorOpen(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setTemplateEditorOpen(true);
  };

  const handleTemplateSaved = (savedTemplate: EmailTemplate) => {
    if (editingTemplate) {
      // Update existing template
      setTemplates(prev => prev.map(t => t.id === savedTemplate.id ? savedTemplate : t));
    } else {
      // Add new template
      setTemplates(prev => [savedTemplate, ...prev]);
    }
    setTemplateEditorOpen(false);
    setEditingTemplate(null);
    setMessage({ type: 'success', text: 'Template saved successfully!' });
  };

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    if (!confirm(`Are you sure you want to delete the template "${templateName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/companies/${companyId}/email-templates/${templateId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        setTemplates(prev => prev.filter(t => t.id && t.id !== templateId));
        setMessage({ type: 'success', text: result.message });
      } else {
        setMessage({ type: 'error', text: result.error });
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      setMessage({ type: 'error', text: 'Failed to delete template' });
    }
  };

  const getWorkflowTypeLabel = (type: string) => {
    const labels = {
      lead_nurturing: 'Lead Nurturing',
      email_sequence: 'Email Sequence',
      lead_scoring: 'Lead Scoring',
      follow_up: 'Follow-up',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getTriggerTypeLabel = (type: string) => {
    const labels = {
      lead_created: 'New Lead',
      lead_updated: 'Lead Updated',
      email_opened: 'Email Opened',
      email_clicked: 'Email Clicked',
      scheduled: 'Scheduled',
    };
    return labels[type as keyof typeof labels] || type;
  };

  const handleTemplateImported = (importedTemplate: EmailTemplate) => {
    // Add imported template to the templates list
    setTemplates(prev => [importedTemplate, ...prev]);
    setMessage({ 
      type: 'success', 
      text: `Template "${importedTemplate.name}" imported successfully!` 
    });
    
    // Switch to templates view to show the imported template
    setActiveView('templates');
  };

  if (loading) {
    return <div className={styles.loading}>Loading automation settings...</div>;
  }

  return (
    <div className={styles.automationSettings}>
      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.type === 'success' ? (
            <CheckCircle size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          {message.text}
        </div>
      )}

      {/* Navigation */}
      <div className={styles.navigation}>
        <button
          className={`${styles.navButton} ${activeView === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveView('overview')}
        >
          <BarChart3 size={16} />
          Overview
        </button>
        <button
          className={`${styles.navButton} ${activeView === 'workflows' ? styles.active : ''}`}
          onClick={() => setActiveView('workflows')}
        >
          <Settings size={16} />
          Workflows
        </button>
        <button
          className={`${styles.navButton} ${activeView === 'templates' ? styles.active : ''}`}
          onClick={() => setActiveView('templates')}
        >
          <Mail size={16} />
          Email Templates
        </button>
        <button
          className={`${styles.navButton} ${activeView === 'template-library' ? styles.active : ''}`}
          onClick={() => setActiveView('template-library')}
        >
          <BookOpen size={16} />
          Template Library
        </button>
        <button
          className={`${styles.navButton} ${activeView === 'ab-testing' ? styles.active : ''}`}
          onClick={() => setActiveView('ab-testing')}
        >
          <BarChart3 size={16} />
          A/B Testing
        </button>
      </div>

      {/* Overview */}
      {activeView === 'overview' && (
        <div className={styles.overview}>
          <div className={styles.settingGroup}>
            <h3 className={styles.groupTitle}>Automation Settings</h3>
            <p className={styles.groupDescription}>
              Configure how automation workflows behave for your company.
            </p>
            
            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Enable Automation</label>
                <p className={styles.settingDescription}>
                  Turn automation workflows on or off for your company.
                </p>
              </div>
              <div className={styles.settingControl}>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={automationSettings.automation_enabled}
                    onChange={e => setAutomationSettings(prev => ({
                      ...prev,
                      automation_enabled: e.target.checked
                    }))}
                  />
                  <span className={styles.toggleSlider}></span>
                </label>
              </div>
            </div>


            <div className={styles.setting}>
              <div className={styles.settingInfo}>
                <label className={styles.settingLabel}>Max Emails Per Day</label>
                <p className={styles.settingDescription}>
                  Maximum number of automation emails to send per day per lead.
                </p>
              </div>
              <div className={styles.settingControl}>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={automationSettings.automation_max_emails_per_day}
                  onChange={e => setAutomationSettings(prev => ({
                    ...prev,
                    automation_max_emails_per_day: parseInt(e.target.value) || 10
                  }))}
                  className={styles.numberInput}
                />
              </div>
            </div>
          </div>

          <div className={styles.stats}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Settings size={24} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>{workflows.length}</div>
                <div className={styles.statLabel}>Total Workflows</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Play size={24} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>{workflows.filter(w => w.is_active).length}</div>
                <div className={styles.statLabel}>Active Workflows</div>
              </div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>
                <Mail size={24} />
              </div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>{templates.length}</div>
                <div className={styles.statLabel}>Email Templates</div>
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className={styles.saveButton}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      )}

      {/* Workflows */}
      {activeView === 'workflows' && (
        <div className={styles.workflows}>
          <div className={styles.sectionHeader}>
            <h3>Automation Workflows</h3>
            <p>Manage your automated workflows and sequences.</p>
          </div>

          {workflows.length === 0 ? (
            <div className={styles.emptyState}>
              <Settings size={48} />
              <h4>No workflows yet</h4>
              <p>Create your first automation workflow to get started with lead nurturing.</p>
              <button 
                onClick={handleCreateWorkflow}
                className={styles.primaryButton}
              >
                <Plus size={16} />
                Create Workflow
              </button>
            </div>
          ) : (
            <div className={styles.workflowList}>
              <div className={styles.sectionActions}>
                <button 
                  onClick={handleCreateWorkflow}
                  className={styles.primaryButton}
                >
                  <Plus size={16} />
                  Create New Workflow
                </button>
              </div>
              {workflows.map(workflow => (
                <div key={workflow.id} className={styles.workflowCard}>
                  <div className={styles.workflowHeader}>
                    <div className={styles.workflowInfo}>
                      <h4 className={styles.workflowName}>{workflow.name}</h4>
                      <p className={styles.workflowDescription}>{workflow.description}</p>
                      <div className={styles.workflowMeta}>
                        <span className={styles.workflowType}>
                          {getWorkflowTypeLabel(workflow.workflow_type)}
                        </span>
                        <span className={styles.workflowTrigger}>
                          Triggered by: {getTriggerTypeLabel(workflow.trigger_type)}
                        </span>
                      </div>
                    </div>
                    <div className={styles.workflowActions}>
                      <button
                        onClick={() => handleToggleWorkflow(workflow.id, workflow.is_active)}
                        className={`${styles.toggleButton} ${workflow.is_active ? styles.active : styles.inactive}`}
                        title={workflow.is_active ? 'Deactivate workflow' : 'Activate workflow'}
                      >
                        {workflow.is_active ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button 
                        onClick={() => handleEditWorkflow(workflow)}
                        className={styles.editButton} 
                        title="Edit workflow"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteWorkflow(workflow.id, workflow.name)}
                        className={styles.deleteButton} 
                        title="Delete workflow"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.workflowSteps}>
                    <strong>Steps: </strong>
                    {workflow.workflow_steps?.length || 0} configured
                  </div>
                  
                  <div className={styles.workflowFooter}>
                    <div className={styles.workflowStatus}>
                      <span className={`${styles.statusBadge} ${workflow.is_active ? styles.active : styles.inactive}`}>
                        {workflow.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Email Templates */}
      {activeView === 'templates' && (
        <div className={styles.templates}>
          <div className={styles.sectionHeader}>
            <h3>Email Templates</h3>
            <p>Manage email templates used in your automation workflows.</p>
          </div>

          {templates.length === 0 ? (
            <div className={styles.emptyState}>
              <Mail size={48} />
              <h4>No templates yet</h4>
              <p>Create email templates to use in your automation workflows.</p>
              <button 
                onClick={handleCreateTemplate}
                className={styles.primaryButton}
              >
                <Plus size={16} />
                Create Template
              </button>
            </div>
          ) : (
            <>
              <div className={styles.sectionActions}>
                <button 
                  onClick={handleCreateTemplate}
                  className={styles.primaryButton}
                >
                  <Plus size={16} />
                  Create New Template
                </button>
              </div>
              <div className={styles.templateGrid}>
              {templates.map(template => (
                <div key={template.id} className={styles.templateCard}>
                  <div className={styles.templateHeader}>
                    <div className={styles.templateType}>
                      {template.template_type.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className={styles.templateActions}>
                      <button 
                        onClick={() => handleEditTemplate(template)}
                        className={styles.editButton}
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={() => template.id && handleDeleteTemplate(template.id, template.name)}
                        className={styles.deleteButton} 
                        title="Delete template"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.templateContent}>
                    <h4 className={styles.templateName}>{template.name}</h4>
                    <p className={styles.templateDescription}>{template.description}</p>
                    <div className={styles.templateSubject}>
                      <strong>Subject:</strong> {template.subject_line}
                    </div>
                  </div>
                  
                  <div className={styles.templateFooter}>
                    <span className={`${styles.statusBadge} ${template.is_active ? styles.active : styles.inactive}`}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            </>
          )}
        </div>
      )}

      {/* Template Library */}
      {activeView === 'template-library' && (
        <div className={styles.templateLibrary}>
          <TemplateLibraryBrowser 
            companyId={companyId} 
            companyName={companyName}
            onTemplateImported={handleTemplateImported}
          />
        </div>
      )}

      {/* A/B Testing */}
      {activeView === 'ab-testing' && (
        <div className={styles.abTesting}>
          <ABTestManager 
            companyId={companyId} 
            emailTemplates={templates}
            onRefreshTemplates={fetchAutomationData}
          />
        </div>
      )}

      {/* Workflow Editor Modal */}
      <WorkflowEditor
        isOpen={workflowEditorOpen}
        onClose={() => {
          setWorkflowEditorOpen(false);
          setEditingWorkflow(null);
        }}
        companyId={companyId}
        workflow={editingWorkflow}
        onSave={handleWorkflowSaved}
      />

      {/* Email Template Editor Modal */}
      <EmailTemplateEditor
        isOpen={templateEditorOpen}
        onClose={() => {
          setTemplateEditorOpen(false);
          setEditingTemplate(null);
        }}
        companyId={companyId}
        template={editingTemplate || undefined}
        onSave={handleTemplateSaved}
      />
    </div>
  );
}