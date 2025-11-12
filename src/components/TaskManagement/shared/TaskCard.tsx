import React from 'react';
import { Task, getUserById, getClientById, getProjectById } from '@/types/taskManagement';
import { PriorityBadge } from './PriorityBadge';
import { ProjectBadge } from './ProjectBadge';
import { UserAvatar } from './UserAvatar';
import styles from './TaskCard.module.scss';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
  showProject?: boolean;
  showClient?: boolean;
  compact?: boolean;
}

export function TaskCard({
  task,
  onClick,
  isDragging = false,
  showProject = true,
  showClient = true,
  compact = false
}: TaskCardProps) {
  const assignedUser = task.assigned_to ? getUserById(task.assigned_to) : undefined;
  const client = task.client_id ? getClientById(task.client_id) : undefined;
  const project = task.project_id ? getProjectById(task.project_id) : undefined;

  const formatDueDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset hours for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date.getTime() === today.getTime()) {
      return 'Today';
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const isOverdue = (): boolean => {
    if (task.status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  return (
    <div
      className={`${styles.taskCard} ${isDragging ? styles.dragging : ''} ${compact ? styles.compact : ''}`}
      onClick={onClick}
    >
      <div className={styles.cardHeader}>
        <div className={styles.badges}>
          {showProject && project && (
            <ProjectBadge
              projectName={project.name}
              projectType={project.type}
              size="small"
            />
          )}
          <PriorityBadge priority={task.priority} size="small" />
          {task.recurring_frequency && task.recurring_frequency !== 'none' && (
            <span className={styles.recurringBadge} title={`Repeats ${task.recurring_frequency}`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M9 3H3.5C2.67 3 2 3.67 2 4.5V8.5C2 9.33 2.67 10 3.5 10H9C9.83 10 10.5 9.33 10.5 8.5V4.5C10.5 3.67 9.83 3 9 3Z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7.5 2V4M4.5 2V4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M2 6H10.5" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </span>
          )}
        </div>
      </div>

      <div className={styles.cardTitle}>
        {task.title}
      </div>

      {!compact && task.description && (
        <div className={styles.cardDescription}>
          {task.description.length > 120
            ? `${task.description.substring(0, 120)}...`
            : task.description}
        </div>
      )}

      <div className={styles.cardFooter}>
        <div className={styles.leftFooter}>
          {showClient && client && (
            <div className={styles.client}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 6.5C7.1 6.5 8 5.6 8 4.5C8 3.4 7.1 2.5 6 2.5C4.9 2.5 4 3.4 4 4.5C4 5.6 4.9 6.5 6 6.5ZM6 7.5C4.5 7.5 1.5 8.25 1.5 9.75V10.5H10.5V9.75C10.5 8.25 7.5 7.5 6 7.5Z"
                  fill="currentColor"
                />
              </svg>
              <span>{client.company}</span>
            </div>
          )}
          <div className={`${styles.dueDate} ${isOverdue() ? styles.overdue : ''}`}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M9.5 1.5H9V0.5H8V1.5H4V0.5H3V1.5H2.5C1.95 1.5 1.505 1.95 1.505 2.5L1.5 10.5C1.5 11.05 1.95 11.5 2.5 11.5H9.5C10.05 11.5 10.5 11.05 10.5 10.5V2.5C10.5 1.95 10.05 1.5 9.5 1.5ZM9.5 10.5H2.5V4H9.5V10.5Z"
                fill="currentColor"
              />
            </svg>
            <span>{formatDueDate(task.due_date)}</span>
          </div>
          <div className={styles.estimatedTime}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M6 1C3.24 1 1 3.24 1 6C1 8.76 3.24 11 6 11C8.76 11 11 8.76 11 6C11 3.24 8.76 1 6 1ZM6 10C3.79 10 2 8.21 2 6C2 3.79 3.79 2 6 2C8.21 2 10 3.79 10 6C10 8.21 8.21 10 6 10ZM6.25 3.5H5.5V6.5L8 8.24L8.375 7.635L6.25 6.175V3.5Z"
                fill="currentColor"
              />
            </svg>
            <span>{task.estimated_hours}h</span>
          </div>
        </div>
        <div className={styles.rightFooter}>
          {assignedUser && (
            <UserAvatar user={assignedUser} size="small" />
          )}
        </div>
      </div>
    </div>
  );
}
