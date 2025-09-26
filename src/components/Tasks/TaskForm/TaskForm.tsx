'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskFormData, taskStatusOptions, taskPriorityOptions, taskRelatedEntityTypeOptions, TaskRelatedEntityType } from '@/types/task';
import styles from './TaskForm.module.scss';

interface TaskFormProps {
  task?: Task; // For editing existing task
  companyId: string;
  assignableUsers?: Array<{ id: string; first_name: string; last_name: string; email: string }>;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  relatedEntity?: {
    type: TaskRelatedEntityType;
    id: string;
    name?: string;
  };
}

export default function TaskForm({
  task,
  companyId,
  assignableUsers = [],
  onSubmit,
  onCancel,
  loading = false,
  relatedEntity,
}: TaskFormProps) {
  const [formData, setFormData] = useState<TaskFormData>({
    title: task?.title || '',
    description: task?.description || '',
    notes: task?.notes || '',
    status: task?.status || 'new',
    priority: task?.priority || 'medium',
    assigned_to: task?.assigned_to || undefined,
    due_date: task?.due_date || '',
    due_time: task?.due_time || '',
    estimated_hours: task?.estimated_hours || undefined,
    actual_hours: task?.actual_hours || undefined,
    related_entity_type: task?.related_entity_type || relatedEntity?.type || undefined,
    related_entity_id: task?.related_entity_id || relatedEntity?.id || undefined,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});
  const [relatedEntities, setRelatedEntities] = useState<any[]>([]);
  const [loadingRelatedEntities, setLoadingRelatedEntities] = useState(false);

  // Load related entities when entity type changes
  useEffect(() => {
    if (formData.related_entity_type && !relatedEntity) {
      loadRelatedEntities(formData.related_entity_type);
    }
  }, [formData.related_entity_type, relatedEntity]);

  const loadRelatedEntities = async (entityType: TaskRelatedEntityType) => {
    if (!entityType) return;

    setLoadingRelatedEntities(true);
    try {
      let endpoint = '';

      switch (entityType) {
        case 'leads':
          endpoint = `/api/leads?companyId=${companyId}&limit=100`;
          break;
        case 'support_cases':
          endpoint = `/api/support-cases?companyId=${companyId}&limit=100`;
          break;
        case 'customers':
          endpoint = `/api/customers?companyId=${companyId}&limit=100`;
          break;
        case 'tickets':
          endpoint = `/api/tickets?companyId=${companyId}&limit=100`;
          break;
        case 'call_records':
          endpoint = `/api/calls?companyId=${companyId}&limit=100`;
          break;
        default:
          return;
      }

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        const entities = data[entityType] || data.data || [];
        setRelatedEntities(entities);
      }
    } catch (error) {
      console.error('Error loading related entities:', error);
    } finally {
      setLoadingRelatedEntities(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof TaskFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TaskFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.estimated_hours && formData.estimated_hours < 0) {
      newErrors.estimated_hours = 'Estimated hours must be positive';
    }

    if (formData.actual_hours && formData.actual_hours < 0) {
      newErrors.actual_hours = 'Actual hours must be positive';
    }

    if (formData.related_entity_type && !formData.related_entity_id) {
      newErrors.related_entity_id = 'Please select a related entity';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting task form:', error);
    }
  };

  const getEntityDisplayName = (entity: any, entityType: TaskRelatedEntityType) => {
    switch (entityType) {
      case 'leads':
        return entity.service_type || `Lead #${entity.id.slice(-8)}`;
      case 'support_cases':
        return entity.summary || `Case #${entity.id.slice(-8)}`;
      case 'customers':
        return `${entity.first_name} ${entity.last_name || ''}`.trim();
      case 'tickets':
        return entity.title || `Ticket #${entity.id.slice(-8)}`;
      case 'call_records':
        return `Call #${entity.id.slice(-8)}`;
      default:
        return entity.id;
    }
  };

  return (
    <div className={styles.taskForm}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.label}>
            Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className={`${styles.input} ${errors.title ? styles.inputError : ''}`}
            placeholder="Enter task title"
            disabled={loading}
          />
          {errors.title && <span className={styles.errorText}>{errors.title}</span>}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="description" className={styles.label}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className={styles.textarea}
            placeholder="Enter task description"
            rows={4}
            disabled={loading}
          />
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="status" className={styles.label}>
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleInputChange}
              className={styles.select}
              disabled={loading}
            >
              {taskStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="priority" className={styles.label}>
              Priority
            </label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleInputChange}
              className={styles.select}
              disabled={loading}
            >
              {taskPriorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="assigned_to" className={styles.label}>
            Assigned To
          </label>
          <select
            id="assigned_to"
            name="assigned_to"
            value={formData.assigned_to || ''}
            onChange={handleInputChange}
            className={styles.select}
            disabled={loading}
          >
            <option value="">Unassigned</option>
            {assignableUsers.map(user => (
              <option key={user.id} value={user.id}>
                {user.first_name} {user.last_name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="due_date" className={styles.label}>
              Due Date
            </label>
            <input
              type="date"
              id="due_date"
              name="due_date"
              value={formData.due_date}
              onChange={handleInputChange}
              className={styles.input}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="due_time" className={styles.label}>
              Due Time
            </label>
            <input
              type="time"
              id="due_time"
              name="due_time"
              value={formData.due_time}
              onChange={handleInputChange}
              className={styles.input}
              disabled={loading}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="estimated_hours" className={styles.label}>
              Estimated Hours
            </label>
            <input
              type="number"
              id="estimated_hours"
              name="estimated_hours"
              value={formData.estimated_hours || ''}
              onChange={handleInputChange}
              className={`${styles.input} ${errors.estimated_hours ? styles.inputError : ''}`}
              min="0"
              step="0.25"
              placeholder="0"
              disabled={loading}
            />
            {errors.estimated_hours && <span className={styles.errorText}>{errors.estimated_hours}</span>}
          </div>

          {task && (
            <div className={styles.formGroup}>
              <label htmlFor="actual_hours" className={styles.label}>
                Actual Hours
              </label>
              <input
                type="number"
                id="actual_hours"
                name="actual_hours"
                value={formData.actual_hours || ''}
                onChange={handleInputChange}
                className={`${styles.input} ${errors.actual_hours ? styles.inputError : ''}`}
                min="0"
                step="0.25"
                placeholder="0"
                disabled={loading}
              />
              {errors.actual_hours && <span className={styles.errorText}>{errors.actual_hours}</span>}
            </div>
          )}
        </div>

        {!relatedEntity && (
          <>
            <div className={styles.formGroup}>
              <label htmlFor="related_entity_type" className={styles.label}>
                Related To
              </label>
              <select
                id="related_entity_type"
                name="related_entity_type"
                value={formData.related_entity_type || ''}
                onChange={handleInputChange}
                className={styles.select}
                disabled={loading}
              >
                <option value="">None</option>
                {taskRelatedEntityTypeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.related_entity_type && (
              <div className={styles.formGroup}>
                <label htmlFor="related_entity_id" className={styles.label}>
                  Select {taskRelatedEntityTypeOptions.find(opt => opt.value === formData.related_entity_type)?.label}
                </label>
                <select
                  id="related_entity_id"
                  name="related_entity_id"
                  value={formData.related_entity_id || ''}
                  onChange={handleInputChange}
                  className={`${styles.select} ${errors.related_entity_id ? styles.inputError : ''}`}
                  disabled={loading || loadingRelatedEntities}
                >
                  <option value="">Select...</option>
                  {relatedEntities.map(entity => (
                    <option key={entity.id} value={entity.id}>
                      {getEntityDisplayName(entity, formData.related_entity_type!)}
                    </option>
                  ))}
                </select>
                {errors.related_entity_id && <span className={styles.errorText}>{errors.related_entity_id}</span>}
                {loadingRelatedEntities && <span className={styles.loadingText}>Loading...</span>}
              </div>
            )}
          </>
        )}

        {relatedEntity && (
          <div className={styles.formGroup}>
            <label className={styles.label}>Related To</label>
            <div className={styles.relatedEntityInfo}>
              {taskRelatedEntityTypeOptions.find(opt => opt.value === relatedEntity.type)?.label}: {relatedEntity.name || relatedEntity.id}
            </div>
          </div>
        )}

        <div className={styles.formGroup}>
          <label htmlFor="notes" className={styles.label}>
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            className={styles.textarea}
            placeholder="Additional notes or comments"
            rows={3}
            disabled={loading}
          />
        </div>

        <div className={styles.formActions}>
          <button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Saving...' : (task ? 'Update Task' : 'Create Task')}
          </button>
        </div>
      </form>
    </div>
  );
}