'use client';

import React, { useState, useEffect } from 'react';
import { Task, TaskFormData, taskStatusOptions, taskPriorityOptions, taskRelatedEntityTypeOptions, TaskRelatedEntityType } from '@/types/task';
import styles from './TaskForm.module.scss';

interface TaskFormProps {
  task?: Task; // For editing existing task
  companyId: string;
  assignableUsers?: Array<{ id: string; first_name: string; last_name: string; email: string }>;
  onFormDataChange?: (data: TaskFormData | null) => void;
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
  onFormDataChange,
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
        default:
          return;
      }

      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        const entities = Array.isArray(data) ? data : [];
        setRelatedEntities(entities);
      } else {
        console.error('Error fetching related entities:', response.status, response.statusText);
        setRelatedEntities([]);
      }
    } catch (error) {
      console.error('Error loading related entities:', error);
      setRelatedEntities([]);
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

  const validateForm = (updateErrors: boolean = true): boolean => {
    const newErrors: Partial<Record<keyof TaskFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }


    if (formData.related_entity_type && !formData.related_entity_id) {
      newErrors.related_entity_id = 'Please select a related entity';
    }

    if (updateErrors) {
      setErrors(newErrors);
    }
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (onFormDataChange) {
      const isValid = validateForm(false);
      onFormDataChange(isValid ? formData : null);
    }
  }, [formData, onFormDataChange]);

  const getEntityDisplayName = (entity: any, entityType: TaskRelatedEntityType) => {
    switch (entityType) {
      case 'leads':
        const customerName = entity.customer 
          ? `${entity.customer.first_name} ${entity.customer.last_name || ''}`.trim()
          : 'Unknown Customer';
        const serviceType = entity.service_type || 'No Service Type';
        return `${customerName} - ${serviceType}`;
      case 'support_cases':
        const supportCustomerName = entity.customer 
          ? `${entity.customer.first_name} ${entity.customer.last_name || ''}`.trim()
          : 'Unknown Customer';
        const caseSummary = entity.summary || `Case #${entity.id.slice(-8)}`;
        return `${supportCustomerName} - ${caseSummary}`;
      case 'customers':
        return `${entity.first_name} ${entity.last_name || ''}`.trim();
      default:
        return entity.id;
    }
  };

  return (
    <div className={styles.taskForm}>
      <div className={styles.section}>
        <div className={styles.form}>
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

        </div>
      </div>
    </div>
  );
}