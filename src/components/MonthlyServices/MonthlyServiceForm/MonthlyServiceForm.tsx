'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalTop,
  ModalMiddle,
  ModalBottom,
} from '@/components/Common/Modal/Modal';
import { Plus, Trash2, GripVertical } from 'lucide-react';
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
  week_of_month: number | null;
  due_day_of_week: number | null;
  recurrence_frequency: string;
  display_order: number;
}

interface Service {
  id: string;
  company_id: string;
  service_name: string;
  description: string | null;
  status: string;
  is_active: boolean;
  templates: {
    id: string;
    title: string;
    description: string | null;
    default_assigned_to: string | null;
    week_of_month: number | null;
    due_day_of_week: number | null;
    recurrence_frequency: string | null;
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

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Biweekly' },
  { value: 'monthly', label: 'Monthly' },
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

  // Task templates
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([]);
  const [nextTempId, setNextTempId] = useState(1);

  const isEditMode = !!service;

  // Initialize form with service data when editing
  useEffect(() => {
    if (isOpen && service) {
      setCompanyId(service.company_id);
      setServiceName(service.service_name);
      setDescription(service.description || '');
      setStatus(service.status);

      // Convert existing templates to TaskTemplate format
      const templates = service.templates.map((t, index) => ({
        id: t.id,
        title: t.title,
        description: t.description || '',
        default_assigned_to: t.default_assigned_to || '',
        week_of_month: t.week_of_month,
        due_day_of_week: t.due_day_of_week,
        recurrence_frequency: t.recurrence_frequency || 'monthly',
        display_order: t.display_order,
      }));
      setTaskTemplates(templates);
      setNextTempId(templates.length + 1);
    }
  }, [isOpen, service]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCompanyId('');
      setServiceName('');
      setDescription('');
      setStatus('active');
      setTaskTemplates([]);
      setNextTempId(1);
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const addTaskTemplate = () => {
    const newTemplate: TaskTemplate = {
      id: isEditMode ? `temp-${nextTempId}` : `temp-${nextTempId}`,
      title: '',
      description: '',
      default_assigned_to: '',
      week_of_month: null,
      due_day_of_week: null,
      recurrence_frequency: 'monthly',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!companyId || !serviceName.trim()) {
      setError('Company and Service Name are required');
      return;
    }

    // Validate task templates
    for (const template of taskTemplates) {
      if (!template.title.trim()) {
        setError('All task templates must have a title');
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
        task_templates: taskTemplates.map(t => ({
          ...(t.id.startsWith('temp-') ? {} : { id: t.id }), // Include ID for existing templates
          title: t.title.trim(),
          description: t.description.trim() || null,
          default_assigned_to: t.default_assigned_to || null,
          week_of_month: t.week_of_month,
          due_day_of_week: t.due_day_of_week,
          recurrence_frequency: t.recurrence_frequency || null,
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
                <label htmlFor="serviceName" className={styles.label}>
                  Service Name <span className={styles.required}>*</span>
                </label>
                <input
                  id="serviceName"
                  type="text"
                  value={serviceName}
                  onChange={e => setServiceName(e.target.value)}
                  className={styles.input}
                  placeholder="e.g., Standard SEO Package"
                  required
                />
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

            {/* Task Templates Section */}
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Task Templates</h3>
                <button
                  type="button"
                  onClick={addTaskTemplate}
                  className={styles.addButton}
                >
                  <Plus size={16} />
                  Add Task
                </button>
              </div>

              {taskTemplates.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>
                    No tasks added yet. Click &quot;Add Task&quot; to create
                    task templates.
                  </p>
                </div>
              ) : (
                <>
                  <div className={styles.taskList}>
                    {taskTemplates.map((template, index) => (
                      <div key={template.id} className={styles.taskCard}>
                        <div className={styles.taskCardHeader}>
                          <div className={styles.taskCardTitle}>
                            <GripVertical size={18} className={styles.gripIcon} />
                            <span>Task {index + 1}</span>
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
                                Week of Month
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
                              <label className={styles.label}>Day of Week</label>
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
                              <label className={styles.label}>Recurrence</label>
                              <select
                                value={template.recurrence_frequency}
                                onChange={e =>
                                  updateTaskTemplate(
                                    template.id,
                                    'recurrence_frequency',
                                    e.target.value
                                  )
                                }
                                className={styles.select}
                              >
                                {FREQUENCIES.map(freq => (
                                  <option key={freq.value} value={freq.value}>
                                    {freq.label}
                                  </option>
                                ))}
                              </select>
                            </div>

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
                          </div>
                        </div>
                      </div>
                    ))}
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
