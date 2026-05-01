'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronRight } from 'lucide-react';
import { DataTable, CardViewConfig } from '@/components/Common/DataTable';
import { getTaskColumns } from '@/components/Tasks/TasksList/TasksListConfig';
import { Task, TaskFormData, isTaskOverdue, formatTaskDueDateTime } from '@/types/task';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import TaskForm from '@/components/Tasks/TaskForm/TaskForm';
import {
  Modal,
  ModalTop,
  ModalMiddle,
  ModalBottom,
} from '@/components/Common/Modal/Modal';
import ModalActionButtons from '@/components/Common/Modal/ModalActionButtons';
import { createClient } from '@/lib/supabase/client';
import {
  createTaskChannel,
  subscribeToTaskUpdates,
  TaskUpdatePayload,
} from '@/lib/realtime/task-channel';
import styles from './AdditionalTasksPanel.module.scss';
import tabStyles from '@/components/Common/DataTable/DataTableTabs.module.scss';

// ─── Types ────────────────────────────────────────────────────────────────────

type TasksTab = 'all' | 'new' | 'pending' | 'in_progress' | 'overdue';

const TASKS_TABS: { key: TasksTab; label: string }[] = [
  { key: 'all', label: 'All Tasks' },
  { key: 'new', label: 'New' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'overdue', label: 'Overdue' },
];

export interface AdditionalTasksPanelProps {
  companyId: string;
  userId: string;
  onCountChange?: (count: number) => void;
  /** Increment this counter each time the create modal should open */
  externalCreateTrigger?: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdditionalTasksPanel({
  companyId,
  userId,
  onCountChange,
  externalCreateTrigger,
}: AdditionalTasksPanelProps) {
  const router = useRouter();
  const [regularTasks, setRegularTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [tasksTab, setTasksTab] = useState<TasksTab>('all');
  const [tasksSearchQuery, setTasksSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<TaskFormData | null>(null);

  const { users: assignableUsers } = useAssignableUsers({
    companyId,
    departmentType: 'all',
  });

  // ── External create trigger ───────────────────────────────────────────────

  useEffect(() => {
    if (externalCreateTrigger && externalCreateTrigger > 0) {
      setShowCreateForm(true);
    }
  }, [externalCreateTrigger]);

  // ── Data fetching ─────────────────────────────────────────────────────────

  const fetchRegularTasks = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        companyId,
        assignedTo: userId,
        includeArchived: 'false',
      });

      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');

      const data = await response.json();
      const allTasks: Task[] = Array.isArray(data.tasks) ? data.tasks : [];
      const taskItems = allTasks.filter(
        t => !t.cadence_step_id && t.status !== 'completed'
      );

      setRegularTasks(taskItems);
    } catch (err) {
      console.error('Error fetching regular tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId, userId]);

  useEffect(() => {
    fetchRegularTasks();
  }, [fetchRegularTasks]);

  // ── Realtime subscription (non-cadence tasks only) ────────────────────────

  useEffect(() => {
    const channel = createTaskChannel(companyId);

    subscribeToTaskUpdates(channel, async (payload: TaskUpdatePayload) => {
      const { company_id, action, record_id } = payload;
      if (company_id !== companyId) return;

      if (action === 'INSERT' || action === 'UPDATE') {
        try {
          const supabase = createClient();
          const { data: fullTask } = await supabase
            .from('tasks')
            .select(
              `*,
              company:companies(id, name),
              assigned_user:profiles!tasks_assigned_to_fkey(id, first_name, last_name, email)`
            )
            .eq('id', record_id)
            .single();

          if (!fullTask) return;

          const isAssignedToMe = fullTask.assigned_to === userId;
          const isCompleted = fullTask.status === 'completed';
          const isAction = Boolean(fullTask.cadence_step_id);

          if (isAssignedToMe && !isCompleted && !isAction) {
            setRegularTasks(prev => {
              const exists = prev.some(t => t.id === fullTask.id);
              return exists
                ? prev.map(t => (t.id === fullTask.id ? fullTask : t))
                : [fullTask, ...prev];
            });
          } else if (!isAction) {
            setRegularTasks(prev => prev.filter(t => t.id !== record_id));
          }
        } catch (error) {
          console.error('Error handling regular task realtime update:', error);
        }
      } else if (action === 'DELETE') {
        setRegularTasks(prev => prev.filter(t => t.id !== record_id));
      }
    });

    return () => {
      createClient().removeChannel(channel);
    };
  }, [companyId, userId]);

  // ── Notify parent of count changes ────────────────────────────────────────

  useEffect(() => {
    const active = regularTasks.filter(
      t => !t.archived && t.status !== 'completed'
    );
    onCountChange?.(active.length);
  }, [regularTasks, onCountChange]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const taskTabCounts = useMemo(() => {
    const active = regularTasks.filter(
      t => !t.archived && t.status !== 'completed'
    );
    return {
      all: active.length,
      new: active.filter(t => t.status === 'new').length,
      pending: active.filter(t => t.status === 'pending').length,
      in_progress: active.filter(t => t.status === 'in_progress').length,
      overdue: active.filter(isTaskOverdue).length,
    };
  }, [regularTasks]);

  const filteredRegularTasks = useMemo(() => {
    let result = regularTasks.filter(
      t => !t.archived && t.status !== 'completed'
    );
    if (tasksTab === 'new') result = result.filter(t => t.status === 'new');
    else if (tasksTab === 'pending')
      result = result.filter(t => t.status === 'pending');
    else if (tasksTab === 'in_progress')
      result = result.filter(t => t.status === 'in_progress');
    else if (tasksTab === 'overdue') result = result.filter(isTaskOverdue);

    if (!tasksSearchQuery.trim()) return result;
    const q = tasksSearchQuery.toLowerCase();
    return result.filter(
      t =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.status?.toLowerCase().includes(q)
    );
  }, [regularTasks, tasksTab, tasksSearchQuery]);

  // ── Card view config (narrow viewports) ───────────────────────────────────

  const tasksCardView = useMemo<CardViewConfig<Task>>(() => {
    const statusLabels: Record<string, string> = {
      new: 'New',
      pending: 'Pending',
      in_progress: 'In Progress',
      completed: 'Completed',
    };
    const statusProgress: Record<string, number> = {
      new: 25,
      pending: 50,
      in_progress: 75,
      completed: 100,
    };
    return {
      topFields: [
        {
          key: 'due',
          label: 'Due',
          width: '110px',
          render: task => formatTaskDueDateTime(task.due_date, task.due_time) || '—',
        },
        {
          key: 'title',
          label: 'Title',
          width: 'minmax(140px, 1fr)',
          render: task => task.title || '—',
        },
        {
          key: 'progress',
          label: 'Progress',
          width: 'minmax(100px, 2fr)',
          render: task => {
            const isOverdue = isTaskOverdue(task);
            const pct = statusProgress[task.status] ?? 0;
            return (
              <div className={styles.progressCell}>
                <span
                  className={`${styles.progressLabel} ${isOverdue ? styles.progressLabelOverdue : ''}`}
                >
                  {statusLabels[task.status] ?? task.status}
                </span>
                <div className={styles.progressTrack}>
                  <div
                    className={`${styles.progressFill} ${isOverdue ? styles.progressFillOverdue : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          },
        },
      ],
      primaryAction: task => (
        <button
          type="button"
          className={styles.viewBtn}
          onClick={() => setViewingTask(task)}
        >
          View
          <ChevronRight size={16} />
        </button>
      ),
    };
  }, [router]);

  const regularTaskColumns = useMemo(() => {
    const cols = getTaskColumns(false, true);
    const dueDateIdx = cols.findIndex(c => c.key === 'due_date');
    if (dueDateIdx > 0) {
      const [dueDate] = cols.splice(dueDateIdx, 1);
      cols.unshift(dueDate);
    }
    return cols;
  }, []);

  // ── Event handlers ────────────────────────────────────────────────────────

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        fetchRegularTasks();
      } else {
        throw new Error('Failed to complete task');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task. Please try again.');
    }
  };

  const handleTaskAction = (action: string, task: Task) => {
    if (action === 'edit') setEditingTask(task);
    else if (action === 'view') setViewingTask(task);
    else if (action === 'complete') handleCompleteTask(task.id);
  };

  const handleCreateTask = async (taskFormData: TaskFormData) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskFormData,
          company_id: companyId,
        }),
      });
      if (response.ok) {
        setShowCreateForm(false);
        await fetchRegularTasks();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTask = async (taskFormData: TaskFormData) => {
    if (!editingTask) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskFormData),
      });
      if (response.ok) {
        setEditingTask(null);
        await fetchRegularTasks();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingTask(null);
    setViewingTask(null);
    setFormData(null);
  };

  const isFormOpen = showCreateForm || !!editingTask;

  // ── Detail modal helpers ──────────────────────────────────────────────────

  const statusLabels: Record<string, string> = {
    new: 'New',
    pending: 'Pending',
    in_progress: 'In Progress',
    completed: 'Completed',
  };

  const statusBadgeClass: Record<string, string> = {
    new: styles.badgeNew,
    pending: styles.badgePending,
    in_progress: styles.badgeInProgress,
    completed: styles.badgeCompleted,
  };

  const priorityLabels: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
  };

  const priorityBadgeClass: Record<string, string> = {
    low: styles.badgeLow,
    medium: styles.badgeMedium,
    high: styles.badgeHigh,
    urgent: styles.badgeUrgent,
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Task detail view modal */}
      <Modal isOpen={!!viewingTask} onClose={() => setViewingTask(null)}>
        <ModalTop
          title={viewingTask?.title ?? 'Task Details'}
          onClose={() => setViewingTask(null)}
        />
        <ModalMiddle>
          {viewingTask && (
            <div className={styles.detailGrid}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Status &amp; Priority</span>
                <div className={styles.detailBadges}>
                  <span
                    className={`${styles.badge} ${statusBadgeClass[viewingTask.status] ?? ''}`}
                  >
                    {statusLabels[viewingTask.status] ?? viewingTask.status}
                  </span>
                  {viewingTask.priority && (
                    <span
                      className={`${styles.badge} ${priorityBadgeClass[viewingTask.priority] ?? ''}`}
                    >
                      {priorityLabels[viewingTask.priority] ?? viewingTask.priority}
                    </span>
                  )}
                </div>
              </div>

              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Due Date</span>
                <span className={styles.detailValue}>
                  {formatTaskDueDateTime(viewingTask.due_date, viewingTask.due_time) || '—'}
                </span>
              </div>

              {viewingTask.assigned_user && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Assigned To</span>
                  <span className={styles.detailValue}>
                    {viewingTask.assigned_user.first_name}{' '}
                    {viewingTask.assigned_user.last_name}
                  </span>
                </div>
              )}

              {viewingTask.description && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Description</span>
                  <span className={styles.detailValue}>{viewingTask.description}</span>
                </div>
              )}

              {viewingTask.notes && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Notes</span>
                  <span className={styles.detailValue}>{viewingTask.notes}</span>
                </div>
              )}

              {viewingTask.related_entity && (
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Related</span>
                  <span className={styles.detailValue}>
                    {viewingTask.related_entity.title ||
                      viewingTask.related_entity.name ||
                      viewingTask.related_entity.id}
                  </span>
                </div>
              )}
            </div>
          )}
        </ModalMiddle>
        <ModalBottom>
          <ModalActionButtons
            showBackButton={true}
            isFirstStep={true}
            onBack={() => setViewingTask(null)}
            showSecondaryButton={true}
            secondaryButtonText="Edit"
            onSecondaryAction={() => {
              const task = viewingTask;
              setViewingTask(null);
              if (task) setEditingTask(task);
            }}
            onPrimaryAction={async () => {
              if (!viewingTask) return;
              await handleCompleteTask(viewingTask.id);
              setViewingTask(null);
            }}
            primaryButtonText="Mark Complete"
            primaryButtonDisabled={false}
          />
        </ModalBottom>
      </Modal>

      <Modal isOpen={isFormOpen} onClose={handleCancelForm}>
        <ModalTop
          title={editingTask ? 'Edit Task' : 'Create New Task'}
          onClose={handleCancelForm}
        />
        <ModalMiddle>
          <TaskForm
            task={editingTask || undefined}
            companyId={companyId}
            assignableUsers={assignableUsers}
            onFormDataChange={setFormData}
            loading={submitting}
            defaultAssignedTo={!editingTask ? userId : undefined}
            requireAssignedTo={!editingTask}
          />
        </ModalMiddle>
        <ModalBottom>
          <ModalActionButtons
            onBack={handleCancelForm}
            showBackButton={true}
            isFirstStep={true}
            onPrimaryAction={async () => {
              if (formData) {
                if (editingTask) await handleEditTask(formData);
                else await handleCreateTask(formData);
              }
            }}
            primaryButtonText={editingTask ? 'Update Task' : 'Create Task'}
            primaryButtonDisabled={!formData || submitting}
            isLoading={submitting}
            loadingText="Saving..."
          />
        </ModalBottom>
      </Modal>

      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <p className={styles.panelTitle}>Your Additional Tasks</p>
        </div>

        <div className={tabStyles.tabsRow}>
          <div className={tabStyles.tabsSection}>
            {TASKS_TABS.map(tab => (
              <button
                key={tab.key}
                className={`${tabStyles.tab} ${tasksTab === tab.key ? tabStyles.active : ''}`}
                onClick={() => setTasksTab(tab.key)}
              >
                {tab.label}
                <span className={tabStyles.tabCount}>
                  {taskTabCounts[tab.key]}
                </span>
              </button>
            ))}
          </div>
          <div className={tabStyles.searchSection}>
            <Search size={16} className={tabStyles.searchIcon} />
            <input
              type="text"
              className={tabStyles.searchInput}
              placeholder="Search"
              value={tasksSearchQuery}
              onChange={e => setTasksSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <DataTable<Task>
          data={filteredRegularTasks}
          title=""
          columns={regularTaskColumns}
          cardView={tasksCardView}
          loading={loading}
          emptyStateMessage="No additional tasks assigned to you."
          onItemAction={handleTaskAction}
          customColumnWidths="1fr minmax(160px, 2fr) 1fr 1fr 1.4fr"
          searchEnabled={false}
          tableType="tasks"
        />
      </div>
    </>
  );
}
