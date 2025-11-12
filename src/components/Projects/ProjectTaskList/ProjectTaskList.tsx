'use client';

import React, { useState, useMemo } from 'react';
import { ProjectTask, taskPriorityOptions } from '@/types/project';
import { CheckCircle, Clock, Plus, Trash2 } from 'lucide-react';
import styles from './ProjectTaskList.module.scss';

interface ProjectTaskListProps {
  tasks: ProjectTask[];
  onTaskClick: (task: ProjectTask) => void;
  onCreateTask: () => void;
  onDeleteTask: (taskId: string) => void;
  onToggleComplete: (taskId: string, isCompleted: boolean) => void;
  isLoading?: boolean;
}

export default function ProjectTaskList({
  tasks,
  onTaskClick,
  onCreateTask,
  onDeleteTask,
  onToggleComplete,
  isLoading = false,
}: ProjectTaskListProps) {
  const [sortBy, setSortBy] = useState<'created_at' | 'due_date' | 'priority'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterCompleted, setFilterCompleted] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');

  const getPriorityColor = (priority: string) => {
    return taskPriorityOptions.find(p => p.value === priority)?.color || '#6b7280';
  };

  const getPriorityLabel = (priority: string) => {
    return taskPriorityOptions.find(p => p.value === priority)?.label || priority;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else if (date < today) {
      return <span className={styles.overdue}>{date.toLocaleDateString()}</span>;
    }
    return date.toLocaleDateString();
  };

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];

    // Apply filters
    if (filterCompleted === 'completed') {
      filtered = filtered.filter(task => task.is_completed);
    } else if (filterCompleted === 'active') {
      filtered = filtered.filter(task => !task.is_completed);
    }
    if (filterPriority) {
      filtered = filtered.filter(task => task.priority === filterPriority);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortBy) {
        case 'due_date':
          aVal = a.due_date ? new Date(a.due_date).getTime() : Infinity;
          bVal = b.due_date ? new Date(b.due_date).getTime() : Infinity;
          break;
        case 'priority':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aVal = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          bVal = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          break;
        case 'created_at':
        default:
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [tasks, filterCompleted, filterPriority, sortBy, sortOrder]);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleToggleComplete = (e: React.ChangeEvent<HTMLInputElement>, taskId: string) => {
    e.stopPropagation();
    onToggleComplete(taskId, e.target.checked);
  };

  const handleDelete = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this task? This will also delete all subtasks and comments.')) {
      onDeleteTask(taskId);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className={styles.taskList}>
      {/* Header with filters */}
      <div className={styles.header}>
        <div className={styles.filters}>
          <select
            value={filterCompleted}
            onChange={(e) => setFilterCompleted(e.target.value)}
            className={styles.filter}
          >
            <option value="">All Tasks</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className={styles.filter}
          >
            <option value="">All Priorities</option>
            {taskPriorityOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <div className={styles.taskCount}>
            {filteredAndSortedTasks.length} {filteredAndSortedTasks.length === 1 ? 'task' : 'tasks'}
          </div>
        </div>

        <button onClick={onCreateTask} className={styles.createButton}>
          <Plus size={18} />
          Create Task
        </button>
      </div>

      {/* Task Table */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <CheckCircle size={48} />
          </div>
          <h3>No tasks yet</h3>
          <p>Create your first task to start tracking work on this project.</p>
          <button onClick={onCreateTask} className={styles.createButtonLarge}>
            <Plus size={20} />
            Create First Task
          </button>
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.checkboxCol}></th>
                <th
                  className={styles.titleCol}
                  onClick={() => handleSort('created_at')}
                >
                  Task
                  {sortBy === 'created_at' && (
                    <span className={styles.sortIndicator}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th className={styles.assigneeCol}>Assignee</th>
                <th
                  className={styles.priorityCol}
                  onClick={() => handleSort('priority')}
                >
                  Priority
                  {sortBy === 'priority' && (
                    <span className={styles.sortIndicator}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th
                  className={styles.dueDateCol}
                  onClick={() => handleSort('due_date')}
                >
                  Due Date
                  {sortBy === 'due_date' && (
                    <span className={styles.sortIndicator}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </th>
                <th className={styles.progressCol}>Progress</th>
                <th className={styles.actionsCol}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTasks.map(task => (
                <tr
                  key={task.id}
                  onClick={() => onTaskClick(task)}
                  className={`${styles.taskRow} ${task.is_completed ? styles.completed : ''}`}
                >
                  <td className={styles.checkboxCell}>
                    <input
                      type="checkbox"
                      checked={task.is_completed}
                      onChange={(e) => handleToggleComplete(e, task.id)}
                      className={styles.checkbox}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className={styles.titleCell}>
                    <div className={styles.taskTitle}>
                      <span className={task.is_completed ? styles.completedText : ''}>
                        {task.title}
                      </span>
                    </div>
                  </td>
                  <td className={styles.assigneeCell}>
                    {task.assigned_to_profile ? (
                      <div className={styles.assignee}>
                        <div className={styles.avatar}>
                          {task.assigned_to_profile.first_name?.[0]}
                          {task.assigned_to_profile.last_name?.[0]}
                        </div>
                        <span>
                          {task.assigned_to_profile.first_name} {task.assigned_to_profile.last_name}
                        </span>
                      </div>
                    ) : (
                      <span className={styles.unassigned}>Unassigned</span>
                    )}
                  </td>
                  <td className={styles.priorityCell}>
                    <span
                      className={styles.priorityBadge}
                      style={{ backgroundColor: getPriorityColor(task.priority) }}
                    >
                      {getPriorityLabel(task.priority)}
                    </span>
                  </td>
                  <td className={styles.dueDateCell}>
                    <div className={styles.dueDate}>
                      <Clock size={14} />
                      {formatDate(task.due_date)}
                    </div>
                  </td>
                  <td className={styles.progressCell}>
                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${task.progress_percentage}%` }}
                      ></div>
                    </div>
                    <span className={styles.progressText}>
                      {task.progress_percentage}%
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <button
                      onClick={(e) => handleDelete(e, task.id)}
                      className={styles.deleteButton}
                      title="Delete task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
