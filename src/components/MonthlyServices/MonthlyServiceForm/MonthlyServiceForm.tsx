'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalTop,
  ModalMiddle,
  ModalBottom,
} from '@/components/Common/Modal/Modal';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import styles from './MonthlyServiceForm.module.scss';

interface Company {
  id: string;
  name: string;
}

interface User {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
}

interface TaskTemplate {
  id: string; // Temp ID for UI
  title: string;
  description: string;
  default_assigned_to: string;
  department_id: string | null;
  week_of_month: number | null;
  due_day_of_week: number | null;
  display_order: number;
}

interface DefaultTemplate {
  id: string;
  name: string;
  description: string | null;
  tasks: {
    id: string;
    title: string;
    description: string | null;
    default_assigned_to: string | null;
    department_id: string | null;
    week_of_month: number | null;
    due_day_of_week: number | null;
    display_order: number;
  }[];
}

interface Service {
  id: string;
  company_id: string;
  service_name: string;
  description: string | null;
  status: string;
  is_active: boolean;
  track_google_ads_budget?: boolean;
  default_google_ads_budget?: number;
  track_social_media_budget?: boolean;
  default_social_media_budget?: number;
  track_lsa_budget?: boolean;
  default_lsa_budget?: number;
  templates: {
    id: string;
    title: string;
    description: string | null;
    default_assigned_to: string | null;
    department_id: string | null;
    week_of_month: number | null;
    due_day_of_week: number | null;
    display_order: number;
  }[];
}

interface MonthlyServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  companies: Company[];
  users: User[];
  service?: Service; // Optional - if provided, form is in edit mode
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const WEEKS = [
  { value: 1, label: 'Week 1' },
  { value: 2, label: 'Week 2' },
  { value: 3, label: 'Week 3' },
  { value: 4, label: 'Week 4' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function MonthlyServiceForm({
  isOpen,
  onClose,
  onSubmit,
  companies,
  users,
  service,
}: MonthlyServiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Service fields
  const [companyId, setCompanyId] = useState('');
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');

  // Budget tracking fields
  const [trackGoogleAdsBudget, setTrackGoogleAdsBudget] = useState(false);
  const [defaultGoogleAdsBudget, setDefaultGoogleAdsBudget] = useState('');
  const [trackSocialMediaBudget, setTrackSocialMediaBudget] = useState(false);
  const [defaultSocialMediaBudget, setDefaultSocialMediaBudget] = useState('');
  const [trackLsaBudget, setTrackLsaBudget] = useState(false);
  const [defaultLsaBudget, setDefaultLsaBudget] = useState('');

  // Task templates
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [nextTempId, setNextTempId] = useState(1);
  const [collapsedTasks, setCollapsedTasks] = useState<Set<string>>(new Set());

  // Departments
  const [departments, setDepartments] = useState<{id: string; name: string; icon?: string}[]>([]);

  // Default templates
  const [defaultTemplates, setDefaultTemplates] = useState<DefaultTemplate[]>([]);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  const isEditMode = !!service;

  // Fetch departments and default templates on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch departments
        const deptResponse = await fetch('/api/admin/monthly-services/departments');
        if (deptResponse.ok) {
          const deptData = await deptResponse.json();
          setDepartments(deptData.departments || []);
        }

        // Fetch default templates (only on create, not edit)
        if (!isEditMode) {
          const templatesResponse = await fetch('/api/admin/monthly-services/default-templates');
          if (templatesResponse.ok) {
            const templatesData = await templatesResponse.json();
            setDefaultTemplates(templatesData || []);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, isEditMode]);

  // Auto-generate service name from company selection
  useEffect(() => {
    if (companyId && !isEditMode) {
      const selectedCompany = companies.find(c => c.id === companyId);
      if (selectedCompany) {
        setServiceName(`${selectedCompany.name} Monthly Services`);
      }
    }
  }, [companyId, companies, isEditMode]);

  // Initialize or reset form based on modal state
  useEffect(() => {
    if (isOpen) {
      // Modal is opening - initialize with service data if editing, or reset if creating
      if (service) {
        // Editing existing service - populate form
        setCompanyId(service.company_id);
        setServiceName(service.service_name);
        setDescription(service.description || '');
        setStatus(service.status);

        // Initialize budget tracking fields - use ?? to handle explicit false values
        setTrackGoogleAdsBudget(service.track_google_ads_budget ?? false);
        setDefaultGoogleAdsBudget(service.default_google_ads_budget?.toString() || '');
        setTrackSocialMediaBudget(service.track_social_media_budget ?? false);
        setDefaultSocialMediaBudget(service.default_social_media_budget?.toString() || '');
        setTrackLsaBudget(service.track_lsa_budget ?? false);
        setDefaultLsaBudget(service.default_lsa_budget?.toString() || '');

        // Convert existing templates to TaskTemplate format
        const templates = service.templates.map((t, index) => ({
          id: t.id,
          title: t.title,
          description: t.description || '',
          default_assigned_to: t.default_assigned_to || '',
          department_id: t.department_id || null,
          week_of_month: t.week_of_month,
          due_day_of_week: t.due_day_of_week,
          display_order: t.display_order,
        }));
        setTaskTemplates(templates);
        setNextTempId(templates.length + 1);
      } else {
        // Creating new service - reset to defaults
        setCompanyId('');
        setServiceName('');
        setDescription('');
        setStatus('active');
        setTrackGoogleAdsBudget(false);
        setDefaultGoogleAdsBudget('');
        setTrackSocialMediaBudget(false);
        setDefaultSocialMediaBudget('');
        setTrackLsaBudget(false);
        setDefaultLsaBudget('');
        setTaskTemplates([]);
        setNextTempId(1);
      }
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, service]);

  const addTaskTemplate = () => {
    const newTemplate: TaskTemplate = {
      id: isEditMode ? `temp-${nextTempId}` : `temp-${nextTempId}`,
      title: '',
      description: '',
      default_assigned_to: '',
      department_id: null,
      week_of_month: null,
      due_day_of_week: null,
      display_order: taskTemplates.length,
    };
    setTaskTemplates([...taskTemplates, newTemplate]);
    setNextTempId(nextTempId + 1);
  };

  const removeTaskTemplate = (id: string) => {
    const filtered = taskTemplates.filter(t => t.id !== id);
    // Re-index display_order
    const reindexed = filtered.map((t, index) => ({
      ...t,
      display_order: index,
    }));
    setTaskTemplates(reindexed);
  };

  const updateTaskTemplate = (
    id: string,
    field: keyof TaskTemplate,
    value: any
  ) => {
    setTaskTemplates(
      taskTemplates.map(t => (t.id === id ? { ...t, [field]: value } : t))
    );
  };

  const moveTaskTemplate = (id: string, direction: 'up' | 'down') => {
    const index = taskTemplates.findIndex(t => t.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === taskTemplates.length - 1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newTemplates = [...taskTemplates];
    [newTemplates[index], newTemplates[newIndex]] = [
      newTemplates[newIndex],
      newTemplates[index],
    ];

    // Update display_order
    const reindexed = newTemplates.map((t, i) => ({ ...t, display_order: i }));
    setTaskTemplates(reindexed);
  };

  const handleCollapseAll = () => {
    // Check if all tasks are collapsed
    const allCollapsed = taskTemplates.length > 0 && taskTemplates.every(t => collapsedTasks.has(t.id));

    if (allCollapsed) {
      // Expand all
      setCollapsedTasks(new Set());
    } else {
      // Collapse all
      setCollapsedTasks(new Set(taskTemplates.map(t => t.id)));
    }
  };

  const toggleTaskCollapse = (id: string) => {
    setCollapsedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const loadFromTemplate = (templateId: string) => {
    const template = defaultTemplates.find(t => t.id === templateId);
    if (!template) return;

    // Convert template tasks to TaskTemplate format
    const newTasks: TaskTemplate[] = template.tasks.map((task, index) => ({
      id: `temp-${nextTempId + index}`,
      title: task.title,
      description: task.description || '',
      default_assigned_to: task.default_assigned_to || '',
      department_id: task.department_id,
      week_of_month: task.week_of_month,
      due_day_of_week: task.due_day_of_week,
      display_order: index,
    }));

    setTaskTemplates(newTasks);
    setNextTempId(nextTempId + newTasks.length);
    setShowTemplateDropdown(false);
  };

  // Close template dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(`.${styles.templateDropdownContainer}`)) {
        setShowTemplateDropdown(false);
      }
    };

    if (showTemplateDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTemplateDropdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyId) {
      setError('Company is required');
      return;
    }

    // Validate task templates
    for (const template of taskTemplates) {
      if (!template.title.trim()) {
        setError('All task templates must have a title');
        return;
      }
      if (template.week_of_month === null) {
        setError('All task templates must have a week of month');
        return;
      }
      if (template.due_day_of_week === null) {
        setError('All task templates must have a day of week');
        return;
      }
      if (!template.department_id) {
        setError('All task templates must have a department');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        ...(isEditMode && { id: service!.id }),
        company_id: companyId,
        service_name: serviceName.trim(),
        description: description.trim() || null,
        status,
        is_active: status === 'active',
        track_google_ads_budget: trackGoogleAdsBudget,
        default_google_ads_budget: trackGoogleAdsBudget && defaultGoogleAdsBudget
          ? parseFloat(defaultGoogleAdsBudget)
          : null,
        track_social_media_budget: trackSocialMediaBudget,
        default_social_media_budget: trackSocialMediaBudget && defaultSocialMediaBudget
          ? parseFloat(defaultSocialMediaBudget)
          : null,
        track_lsa_budget: trackLsaBudget,
        default_lsa_budget: trackLsaBudget && defaultLsaBudget
          ? parseFloat(defaultLsaBudget)
          : null,
        task_templates: taskTemplates.map(t => ({
          ...(t.id.startsWith('temp-') ? {} : { id: t.id }), // Include ID for existing templates
          title: t.title.trim(),
          description: t.description.trim() || null,
          default_assigned_to: t.default_assigned_to || null,
          department_id: t.department_id || null,
          week_of_month: t.week_of_month,
          due_day_of_week: t.due_day_of_week,
          display_order: t.display_order,
        })),
      });

      onClose();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${isEditMode ? 'update' : 'create'} service`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserDisplayName = (user: User) => {
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    return name || user.email;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <form className={styles.addServiceForm} onSubmit={handleSubmit}>
        <ModalTop
          title={isEditMode ? 'Edit Monthly Service' : 'New Monthly Service'}
          onClose={onClose}
        />

        <ModalMiddle>
          <div className={styles.formContent}>
            {/* Service Information Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Service Information</h3>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="company" className={styles.label}>
                    Company <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="company"
                    value={companyId}
                    onChange={e => setCompanyId(e.target.value)}
                    className={styles.select}
                    required
                    disabled={isEditMode}
                  >
                    <option value="">Select a company...</option>
                    {companies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="status" className={styles.label}>
                    Status
                  </label>
                  <select
                    id="status"
                    value={status}
                    onChange={e => setStatus(e.target.value)}
                    className={styles.select}
                  >
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description" className={styles.label}>
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className={styles.textarea}
                  placeholder="Optional description of the service..."
                  rows={3}
                />
              </div>
            </div>

            {/* Budget Tracking Section */}
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Budget Tracking</h3>
              <p className={styles.sectionDescription}>
                Enable budget tracking for ad spend management. Default amounts will be used when generating monthly budgets.
              </p>

              <div className={styles.budgetTrackingGrid}>
                {/* Google Ads Budget */}
                <div className={styles.budgetTrackingItem}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={trackGoogleAdsBudget}
                      onChange={(e) => setTrackGoogleAdsBudget(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span>Track Google Ads Budget</span>
                  </label>
                  {trackGoogleAdsBudget && (
                    <div className={styles.formGroup}>
                      <label htmlFor="googleAdsBudget" className={styles.label}>
                        Default Monthly Budget
                      </label>
                      <div className={styles.inputWithPrefix}>
                        <span className={styles.inputPrefix}>$</span>
                        <input
                          type="number"
                          id="googleAdsBudget"
                          value={defaultGoogleAdsBudget}
                          onChange={(e) => setDefaultGoogleAdsBudget(e.target.value)}
                          className={styles.input}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Social Media Budget */}
                <div className={styles.budgetTrackingItem}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={trackSocialMediaBudget}
                      onChange={(e) => setTrackSocialMediaBudget(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span>Track Social Media Budget</span>
                  </label>
                  {trackSocialMediaBudget && (
                    <div className={styles.formGroup}>
                      <label htmlFor="socialMediaBudget" className={styles.label}>
                        Default Monthly Budget
                      </label>
                      <div className={styles.inputWithPrefix}>
                        <span className={styles.inputPrefix}>$</span>
                        <input
                          type="number"
                          id="socialMediaBudget"
                          value={defaultSocialMediaBudget}
                          onChange={(e) => setDefaultSocialMediaBudget(e.target.value)}
                          className={styles.input}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* LSA Budget */}
                <div className={styles.budgetTrackingItem}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={trackLsaBudget}
                      onChange={(e) => setTrackLsaBudget(e.target.checked)}
                      className={styles.checkbox}
                    />
                    <span>Track LSA Budget</span>
                  </label>
                  {trackLsaBudget && (
                    <div className={styles.formGroup}>
                      <label htmlFor="lsaBudget" className={styles.label}>
                        Default Monthly Budget
                      </label>
                      <div className={styles.inputWithPrefix}>
                        <span className={styles.inputPrefix}>$</span>
                        <input
                          type="number"
                          id="lsaBudget"
                          value={defaultLsaBudget}
                          onChange={(e) => setDefaultLsaBudget(e.target.value)}
                          className={styles.input}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Task Templates Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Task Templates</h3>
                <div className={styles.headerActions}>
                  {taskTemplates.length >= 2 && (
                    <button
                      type="button"
                      onClick={handleCollapseAll}
                      className={styles.collapseAllLink}
                    >
                      {taskTemplates.every(t => collapsedTasks.has(t.id)) ? 'Expand All' : 'Collapse All'}
                    </button>
                  )}
                  {!isEditMode && defaultTemplates.length > 0 && (
                    <div className={styles.templateDropdownContainer}>
                      <button
                        type="button"
                        onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                        className={styles.templateButton}
                      >
                        Load from Template
                        <ChevronDown size={16} />
                      </button>
                      {showTemplateDropdown && (
                        <div className={styles.templateDropdown}>
                          {defaultTemplates.map(template => (
                            <button
                              key={template.id}
                              type="button"
                              onClick={() => loadFromTemplate(template.id)}
                              className={styles.templateOption}
                            >
                              <div className={styles.templateOptionContent}>
                                <span className={styles.templateName}>{template.name}</span>
                                {template.description && (
                                  <span className={styles.templateDescription}>
                                    {template.description}
                                  </span>
                                )}
                                <span className={styles.templateTaskCount}>
                                  {template.tasks.length} task{template.tasks.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={addTaskTemplate}
                    className={styles.addButton}
                  >
                    <Plus size={16} />
                    Add Task
                  </button>
                </div>
              </div>

              {taskTemplates.length === 0 ? (
                <div
                  className={styles.emptyState}
                  onClick={addTaskTemplate}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      addTaskTemplate();
                    }
                  }}
                >
                  <p>
                    No tasks added yet. Click &quot;Add Task&quot; to create
                    task templates.
                  </p>
                </div>
              ) : (
                <>
                  <div className={styles.taskList}>
                    {taskTemplates.map((template, index) => {
                      const isCollapsed = collapsedTasks.has(template.id);
                      return (
                        <div key={template.id} className={styles.taskCard}>
                          <div className={styles.taskCardHeader}>
                            <button
                              type="button"
                              onClick={() => toggleTaskCollapse(template.id)}
                              className={styles.collapseButton}
                              title={isCollapsed ? 'Expand' : 'Collapse'}
                            >
                              {isCollapsed ? (
                                <ChevronDown size={18} />
                              ) : (
                                <ChevronUp size={18} />
                              )}
                            </button>
                            <div className={styles.taskCardTitle}>
                              <GripVertical size={18} className={styles.gripIcon} />
                              <span>Task {index + 1}</span>
                              {template.title && (
                                <span className={styles.taskCardTitlePreview}>
                                  - {template.title}
                                </span>
                              )}
                            </div>
                            <div className={styles.taskCardActions}>
                              <button
                                type="button"
                                onClick={() => moveTaskTemplate(template.id, 'up')}
                                disabled={index === 0}
                                className={styles.iconButton}
                                title="Move up"
                              >
                                ↑
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  moveTaskTemplate(template.id, 'down')
                                }
                                disabled={index === taskTemplates.length - 1}
                                className={styles.iconButton}
                                title="Move down"
                              >
                                ↓
                              </button>
                              <button
                                type="button"
                                onClick={() => removeTaskTemplate(template.id)}
                                className={styles.deleteButton}
                                title="Remove task"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {!isCollapsed && (
                            <div className={styles.taskCardBody}>
                          <div className={styles.formGroup}>
                            <label className={styles.label}>
                              Title <span className={styles.required}>*</span>
                            </label>
                            <input
                              type="text"
                              value={template.title}
                              onChange={e =>
                                updateTaskTemplate(
                                  template.id,
                                  'title',
                                  e.target.value
                                )
                              }
                              className={styles.input}
                              placeholder="e.g., Post Blog 1"
                              required
                            />
                          </div>

                          <div className={styles.formGroup}>
                            <label className={styles.label}>Description</label>
                            <textarea
                              value={template.description}
                              onChange={e =>
                                updateTaskTemplate(
                                  template.id,
                                  'description',
                                  e.target.value
                                )
                              }
                              className={styles.textarea}
                              placeholder="Optional task description..."
                              rows={2}
                            />
                          </div>

                          <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>
                                Week of Month <span className={styles.required}>*</span>
                              </label>
                              <select
                                value={template.week_of_month ?? ''}
                                onChange={e =>
                                  updateTaskTemplate(
                                    template.id,
                                    'week_of_month',
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : null
                                  )
                                }
                                className={styles.select}
                                required
                              >
                                <option value="">Select week...</option>
                                {WEEKS.map(week => (
                                  <option key={week.value} value={week.value}>
                                    {week.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className={styles.formGroup}>
                              <label className={styles.label}>
                                Day of Week <span className={styles.required}>*</span>
                              </label>
                              <select
                                value={template.due_day_of_week ?? ''}
                                onChange={e =>
                                  updateTaskTemplate(
                                    template.id,
                                    'due_day_of_week',
                                    e.target.value !== ''
                                      ? parseInt(e.target.value)
                                      : null
                                  )
                                }
                                className={styles.select}
                                required
                              >
                                <option value="">Select day...</option>
                                {DAYS_OF_WEEK.map(day => (
                                  <option key={day.value} value={day.value}>
                                    {day.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                              <label className={styles.label}>
                                Default Assignee
                              </label>
                              <select
                                value={template.default_assigned_to}
                                onChange={e =>
                                  updateTaskTemplate(
                                    template.id,
                                    'default_assigned_to',
                                    e.target.value
                                  )
                                }
                                className={styles.select}
                              >
                                <option value="">Unassigned</option>
                                {users.map(user => (
                                <option key={user.id} value={user.id}>
                                  {getUserDisplayName(user)}
                                </option>
                              ))}
                            </select>
                            </div>

                            <div className={styles.formGroup}>
                              <label className={styles.label}>
                                Department <span className={styles.required}>*</span>
                              </label>
                              <select
                                value={template.department_id || ''}
                                onChange={e =>
                                  updateTaskTemplate(
                                    template.id,
                                    'department_id',
                                    e.target.value === '' ? null : e.target.value
                                  )
                                }
                                className={styles.select}
                                required
                              >
                                <option value="">Select department...</option>
                                {departments.map(dept => (
                                  <option key={dept.id} value={dept.id}>
                                    {dept.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={addTaskTemplate}
                    className={styles.addAnotherButton}
                  >
                    <Plus size={16} />
                    Add Another Task
                  </button>
                </>
              )}
            </div>

            {error && <div className={styles.error}>{error}</div>}
          </div>
        </ModalMiddle>

        <ModalBottom>
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelButton}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isEditMode
                  ? 'Updating...'
                  : 'Creating...'
                : isEditMode
                  ? 'Update Service'
                  : 'Create Service'}
            </button>
          </div>
        </ModalBottom>
      </form>
    </Modal>
  );
}
