'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  User as UserIcon,
  Save,
  X,
  CheckCircle,
  Trash2,
  Calendar,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Task, TaskFormData, taskStatusOptions, taskPriorityOptions, isTaskOverdue, formatTaskDueDateTime } from '@/types/task';
import { CallHistory } from '@/components/Calls/CallHistory/CallHistory';
import { UserSelector } from '@/components/Common/UserSelector';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
import { formatDateForDisplay } from '@/lib/utils';
import styles from './page.module.scss';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface TaskPageProps {
  params: Promise<{ id: string }>;
}

function TaskDetailPageContent({ params }: TaskPageProps) {
  const [user, setUser] = useState<User | null>(null);
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [task, setTask] = useState<Task | null>(null);
  const [taskLoading, setTaskLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [callHistoryRefresh, setCallHistoryRefresh] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [actualHours, setActualHours] = useState<number | undefined>();
  const router = useRouter();

  // Hook for fetching assignable users for tasks (all departments)
  const {
    users: assignableUsers,
    loading: loadingUsers,
    error: usersError,
  } = useAssignableUsers({
    companyId: task?.company_id,
    departmentType: 'all',
    enabled: isEditing, // Only fetch when editing
  });

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setTaskId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    const supabase = createClient();

    const getSessionAndData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profileError && profileData) {
        setProfile(profileData);
        setIsAdmin(isAuthorizedAdminSync(profileData));
      }

      setLoading(false);
    };

    getSessionAndData();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session?.user) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const fetchTask = useCallback(async () => {
    if (!taskId) return;

    try {
      setTaskLoading(true);
      const response = await fetch(`/api/tasks/${taskId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setTask(null);
          return;
        }
        throw new Error('Failed to fetch task');
      }

      const data = await response.json();
      setTask(data.task);
    } catch (error) {
      console.error('Error fetching task:', error);
      setTask(null);
    } finally {
      setTaskLoading(false);
    }
  }, [taskId]);

  // Fetch task when taskId is available
  useEffect(() => {
    if (taskId && !loading) {
      fetchTask();
    }
  }, [taskId, loading, fetchTask]);

  // Define handleEdit before the useEffect that uses it
  const handleEdit = useCallback(() => {
    if (task) {
      setEditFormData({
        title: task.title,
        description: task.description || '',
        notes: task.notes || '',
        status: task.status,
        priority: task.priority,
        assigned_to: task.assigned_to || '',
        due_date: task.due_date ? task.due_date.split('T')[0] : '',
        due_time: task.due_time || '',
        related_entity_type: task.related_entity_type,
        related_entity_id: task.related_entity_id || '',
      });
      setIsEditing(true);

      // Clear the edit URL parameter to prevent edit mode loop
      if (searchParams.get('edit') === 'true') {
        const url = new URL(window.location.href);
        url.searchParams.delete('edit');
        router.replace(url.pathname + url.search);
      }
    }
  }, [task, searchParams, router]);

  // Auto-trigger edit mode when edit=true parameter is present
  useEffect(() => {
    const shouldAutoEdit = searchParams.get('edit') === 'true';
    if (shouldAutoEdit && task && !isEditing && !taskLoading) {
      handleEdit();
    }
  }, [task, isEditing, taskLoading, handleEdit, searchParams]);

  const handleBack = () => {
    router.push('/connections/tasks');
  };

  const handleBackToRelatedEntity = () => {
    if (task?.related_entity_type && task?.related_entity_id) {
      const entityType = task.related_entity_type;
      const entityId = task.related_entity_id;
      
      switch (entityType) {
        case 'leads':
          router.push(`/connections/leads/${entityId}`);
          break;
        case 'support_cases':
          router.push(`/connections/tickets/${entityId}`);
          break;
        case 'customers':
          router.push(`/customers/${entityId}`);
          break;
        default:
          console.warn(`Navigation not implemented for entity type: ${entityType}`);
      }
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditFormData(null);
  };

  const handleSave = async () => {
    if (!taskId || !editFormData) return;

    try {
      setSaving(true);

      // Clean up the form data to handle empty strings and null values
      const cleanFormData = {
        ...editFormData,
        // Convert empty strings to null for optional fields
        due_date: editFormData.due_date || null,
        due_time: editFormData.due_time || null,
        assigned_to: editFormData.assigned_to || null,
        related_entity_id: editFormData.related_entity_id || null,
        description: editFormData.description || null,
        notes: editFormData.notes || null,
      };

      console.log('Attempting to save task:', {
        taskId,
        originalData: editFormData,
        cleanedData: cleanFormData,
        isAdmin,
        currentUser: user?.id,
      });

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanFormData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }

      const data = await response.json();
      console.log('Task save successful:', data.task);
      setTask(data.task);
      setIsEditing(false);
      setEditFormData(null);
    } catch (error: any) {
      console.error('Error updating task:', {
        error,
        taskId,
        formData: editFormData,
        errorMessage: error.message,
      });

      // Display more specific error message
      let errorMessage = 'Failed to update task. Please try again.';

      if (error.message) {
        errorMessage = `Failed to update task: ${error.message}`;
      }

      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    if (editFormData) {
      setEditFormData({
        ...editFormData,
        [field]: value,
      });
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!taskId) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete task');
      }

      // Redirect to tasks page after successful deletion
      router.push('/connections/tasks');
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Failed to delete task. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
  };

  const handleCompleteClick = () => {
    setActualHours(task?.estimated_hours || undefined);
    setShowCompleteModal(true);
  };

  const handleCompleteConfirm = async () => {
    if (!taskId) return;

    try {
      setIsCompleting(true);
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actual_hours: actualHours }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to complete task');
      }

      // Refresh task data
      await fetchTask();
      setShowCompleteModal(false);
      setActualHours(undefined);
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task. Please try again.');
      setIsCompleting(false);
    }
  };

  const handleCompleteCancel = () => {
    setShowCompleteModal(false);
    setActualHours(undefined);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      new: '#3b82f6',
      pending: '#f59e0b',
      in_progress: '#8b5cf6',
      completed: '#10b981',
    };
    return statusColors[status] || '#6b7280';
  };

  const getPriorityColor = (priority: string) => {
    const priorityColors: { [key: string]: string } = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      urgent: '#dc2626',
    };
    return priorityColors[priority] || '#6b7280';
  };

  const getTaskDisplayTitle = (task: Task) => {
    return task.title || 'Untitled Task';
  };

  if (loading || taskLoading) {
    return <div className={styles.loading}>Loading task...</div>;
  }

  if (!user || !profile) {
    return <div>Redirecting...</div>;
  }

  if (!task) {
    return (
      <div className={styles.error}>
        <h2>Task not found</h2>
        <button onClick={handleBack} className={styles.backButton}>
          <ArrowLeft size={16} />
          Back to Tasks
        </button>
      </div>
    );
  }

  const isOverdue = isTaskOverdue(task);
  const isCompleted = task.status === 'completed';

  return (
    <div className="container">
      <div className={styles.header}>
        <button onClick={handleBack} className={styles.backButton}>
          <ArrowLeft size={16} />
          Back to Tasks
        </button>
        <h1>{getTaskDisplayTitle(task)}</h1>
        <div className={styles.headerButtons}>
          {!isCompleted && (
            <button
              onClick={handleCompleteClick}
              disabled={isEditing}
              className={styles.completeButton}
            >
              <CheckCircle size={16} />
              Mark Complete
            </button>
          )}
          {isEditing ? (
            <div className={styles.editActions}>
              <button
                onClick={handleSave}
                disabled={saving}
                className={styles.saveButton}
              >
                <Save size={16} />
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelEdit}
                className={styles.cancelButton}
              >
                <X size={16} />
                Cancel
              </button>
            </div>
          ) : (
            <>
              <button onClick={handleEdit} className={styles.editButton}>
                <Edit size={16} />
                Edit Task
              </button>
              <button
                onClick={handleDeleteClick}
                className={styles.deleteButton}
                disabled={isEditing}
              >
                <Trash2 size={16} />
                Delete Task
              </button>
            </>
          )}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.leftColumn}>
          {/* Task Description */}
          {task.description && (
            <div className={styles.infoCard}>
              <h3>Description</h3>
              <div className={styles.description}>
                {task.description}
              </div>
            </div>
          )}

          {/* Related Entity Information */}
          {task.related_entity && task.related_entity_type && (
            <div className={styles.infoCard}>
              <h3>Related {task.related_entity_type === 'support_cases' ? 'Support Case' : task.related_entity_type.replace('_', ' ')}</h3>
              <div className={styles.relatedEntity}>
                <button
                  onClick={handleBackToRelatedEntity}
                  className={styles.entityLink}
                >
                  <UserIcon size={16} />
                  {task.related_entity.name || task.related_entity.title || `${task.related_entity_type} #${task.related_entity.id.slice(-8)}`}
                </button>
                {task.related_entity.status && (
                  <div className={styles.entityStatus}>
                    Status: {task.related_entity.status}
                  </div>
                )}
                {task.related_entity.type && (
                  <div className={styles.entityType}>
                    Type: {task.related_entity.type}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {task.notes && (
            <div className={styles.infoCard}>
              <h3>Notes</h3>
              <div className={styles.notes}>
                {task.notes.split('\n').map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.rightColumn}>
          {isEditing && editFormData ? (
            // Edit Form
            <div className={styles.infoCard}>
              <h3>Edit Task</h3>
              <div className={styles.editForm}>
                <div className={styles.formField}>
                  <label>Title</label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={e =>
                      handleInputChange('title', e.target.value)
                    }
                    className={styles.input}
                  />
                </div>
                <div className={styles.formField}>
                  <label>Description</label>
                  <textarea
                    value={editFormData.description}
                    onChange={e =>
                      handleInputChange('description', e.target.value)
                    }
                    className={styles.textarea}
                    rows={3}
                  />
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>Status</label>
                    <select
                      value={editFormData.status}
                      onChange={e =>
                        handleInputChange('status', e.target.value)
                      }
                      className={styles.select}
                    >
                      {taskStatusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formField}>
                    <label>Priority</label>
                    <select
                      value={editFormData.priority}
                      onChange={e =>
                        handleInputChange('priority', e.target.value)
                      }
                      className={styles.select}
                    >
                      {taskPriorityOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className={styles.formRow}>
                  <div className={styles.formField}>
                    <label>Due Date</label>
                    <input
                      type="date"
                      value={editFormData.due_date}
                      onChange={e =>
                        handleInputChange('due_date', e.target.value)
                      }
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formField}>
                    <label>Due Time</label>
                    <input
                      type="time"
                      value={editFormData.due_time}
                      onChange={e =>
                        handleInputChange('due_time', e.target.value)
                      }
                      className={styles.input}
                    />
                  </div>
                </div>
                <div className={styles.formField}>
                  <label>Assigned To</label>
                  <UserSelector
                    users={assignableUsers}
                    selectedUserId={editFormData.assigned_to}
                    onSelect={(userId) => handleInputChange('assigned_to', userId)}
                    placeholder="Select user to assign..."
                    loading={loadingUsers}
                    disabled={loadingUsers}
                    className={styles.userSelector}
                  />
                  {usersError && (
                    <div className={styles.errorMessage}>
                      Error loading users: {usersError}
                    </div>
                  )}
                </div>
                <div className={styles.formField}>
                  <label>Notes</label>
                  <textarea
                    value={editFormData.notes}
                    onChange={e =>
                      handleInputChange('notes', e.target.value)
                    }
                    className={styles.textarea}
                    rows={4}
                  />
                </div>
              </div>
            </div>
          ) : (
            // Display Mode
            <div className={styles.infoCard}>
              <h3>Task Information</h3>
              <div className={styles.taskDetails}>
                <div className={styles.detailItem}>
                  <label>Status</label>
                  <span
                    className={styles.statusBadge}
                    style={{
                      backgroundColor: getStatusColor(task.status),
                    }}
                  >
                    {task.status.charAt(0).toUpperCase() + task.status.slice(1).replace('_', ' ')}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <label>Priority</label>
                  <div className={styles.priorityContainer}>
                    <span
                      className={styles.priorityBadge}
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                    </span>
                    {isOverdue && (
                      <span className={styles.overdueIndicator}>
                        <AlertCircle size={16} />
                        Overdue
                      </span>
                    )}
                  </div>
                </div>
                <div className={styles.detailItem}>
                  <label>Assigned To</label>
                  {task.assigned_user ? (
                    <div className={styles.userInfo}>
                      <UserIcon size={16} />
                      <span>
                        {task.assigned_user.first_name}{' '}
                        {task.assigned_user.last_name}
                      </span>
                    </div>
                  ) : (
                    <span className={styles.unassigned}>Unassigned</span>
                  )}
                </div>
                {task.due_date && (
                  <div className={styles.detailItem}>
                    <label>Due Date</label>
                    <div className={styles.dueDateInfo}>
                      <Calendar size={16} />
                      <span>{formatTaskDueDateTime(task.due_date, task.due_time)}</span>
                    </div>
                  </div>
                )}
                {task.estimated_hours && (
                  <div className={styles.detailItem}>
                    <label>Estimated Hours</label>
                    <div className={styles.hoursInfo}>
                      <Clock size={16} />
                      <span>{task.estimated_hours}h</span>
                    </div>
                  </div>
                )}
                {task.actual_hours && (
                  <div className={styles.detailItem}>
                    <label>Actual Hours</label>
                    <div className={styles.hoursInfo}>
                      <Clock size={16} />
                      <span>{task.actual_hours}h</span>
                    </div>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <label>Created</label>
                  <span>{formatDate(task.created_at)}</span>
                </div>
                <div className={styles.detailItem}>
                  <label>Last Updated</label>
                  <span>{formatDate(task.updated_at)}</span>
                </div>
                {task.completed_at && (
                  <div className={styles.detailItem}>
                    <label>Completed</label>
                    <span>{formatDateTime(task.completed_at)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Complete Task Modal */}
      {showCompleteModal && (
        <div className={styles.modalOverlay} onClick={handleCompleteCancel}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Complete Task</h3>
              <button
                className={styles.closeButton}
                onClick={handleCompleteCancel}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Mark this task as completed?</p>
              <div className={styles.taskInfo}>
                <strong>Task:</strong> {task?.title || 'Untitled Task'}
                <br />
                <strong>Status:</strong> {task?.status || 'Unknown'}
              </div>
              <div className={styles.formField}>
                <label>Actual Hours Spent (optional)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={actualHours || ''}
                  onChange={e => setActualHours(parseFloat(e.target.value) || undefined)}
                  className={styles.input}
                  placeholder="Enter hours spent"
                />
                {task?.estimated_hours && (
                  <div className={styles.estimatedHours}>
                    Estimated: {task.estimated_hours} hours
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                onClick={handleCompleteCancel}
                className={styles.cancelButton}
                disabled={isCompleting}
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteConfirm}
                className={styles.completeButton}
                disabled={isCompleting}
              >
                {isCompleting ? 'Completing...' : 'Complete Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className={styles.modalOverlay} onClick={handleDeleteCancel}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Delete Task</h3>
              <button
                className={styles.closeButton}
                onClick={handleDeleteCancel}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Are you sure you want to delete this task? This action cannot be
                undone.
              </p>
              <div className={styles.taskInfo}>
                <strong>Task:</strong> {task?.title || 'Untitled Task'}
                <br />
                <strong>Status:</strong> {task?.status || 'Unknown'}
                <br />
                <strong>Priority:</strong> {task?.priority || 'Unknown'}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                onClick={handleDeleteCancel}
                className={styles.cancelButton}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className={styles.confirmDeleteButton}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskDetailPage({ params }: TaskPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TaskDetailPageContent params={params} />
    </Suspense>
  );
}