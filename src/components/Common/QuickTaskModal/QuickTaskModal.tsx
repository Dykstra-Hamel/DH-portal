'use client';

import { useState, useEffect } from 'react';
import { TaskCreateData, taskPriorityOptions } from '@/types/task';
import { createClient } from '@/lib/supabase/client';
import styles from './QuickTaskModal.module.scss';

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
  companyId: string;
  relatedEntityType?: 'leads' | 'support_cases' | 'customers';
  relatedEntityId?: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export function QuickTaskModal({
  isOpen,
  onClose,
  onTaskCreated,
  companyId,
  relatedEntityType = 'leads',
  relatedEntityId,
}: QuickTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');

  // Fetch users for the company
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch(`/api/companies/${companyId}/users`);
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        const userList = (data.users || []).map((user: any) => ({
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
        }));

        setUsers(userList);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };

    if (isOpen && companyId) {
      fetchUsers();
    }
  }, [isOpen, companyId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!title.trim()) {
      setError('Title is required');
      setIsSubmitting(false);
      return;
    }

    try {
      const taskData: TaskCreateData = {
        company_id: companyId,
        title: title.trim(),
        description: description.trim() || undefined,
        notes: notes.trim() || undefined,
        status: 'new',
        priority,
        assigned_to: assignedTo || null,
        due_date: dueDate || undefined,
        due_time: dueTime || undefined,
        related_entity_type: relatedEntityType,
        related_entity_id: relatedEntityId || null,
      };

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setAssignedTo('');
      setDueDate('');
      setDueTime('');
      setNotes('');

      onTaskCreated();
      onClose();
    } catch (err) {
      console.error('Error creating task:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create New Task</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label htmlFor="title" className={styles.label}>
              Title <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={styles.input}
              placeholder="Enter task title"
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
              onChange={(e) => setDescription(e.target.value)}
              className={styles.textarea}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="priority" className={styles.label}>
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className={styles.select}
              >
                {taskPriorityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="assignedTo" className={styles.label}>
                Assigned To
              </label>
              <select
                id="assignedTo"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className={styles.select}
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="dueDate" className={styles.label}>
                Due Date
              </label>
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="dueTime" className={styles.label}>
                Due Time
              </label>
              <input
                type="time"
                id="dueTime"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="notes" className={styles.label}>
              Notes
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={styles.textarea}
              placeholder="Additional notes"
              rows={2}
            />
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
