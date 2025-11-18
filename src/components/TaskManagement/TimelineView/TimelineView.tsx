import React, { useMemo } from 'react';
import { Task, Project, getUserById, getClientById, getProjectById } from '@/types/taskManagement';
import { PriorityBadge } from '../shared/PriorityBadge';
import { StatusBadge } from '../shared/StatusBadge';
import { ProjectBadge } from '../shared/ProjectBadge';
import { UserAvatar } from '../shared/UserAvatar';
import styles from './TimelineView.module.scss';

interface TimelineViewProps {
  tasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
}

export function TimelineView({ tasks, projects, onTaskClick }: TimelineViewProps) {
  // Sort tasks by due date
  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [tasks]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (dueDate: string): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDueDate = new Date(dueDate);
    taskDueDate.setHours(0, 0, 0, 0);
    return taskDueDate < today;
  };

  return (
    <div className={styles.timelineContainer}>
      <div className={styles.verticalView}>
        {sortedTasks.map((task, index) => {
          const project = task.project_id ? getProjectById(task.project_id) : undefined;
          const client = task.client_id ? getClientById(task.client_id) : undefined;
          const assignedUser = task.assigned_to ? getUserById(task.assigned_to) : undefined;
          const overdue = isOverdue(task.due_date) && task.status !== 'completed';

          return (
            <div key={task.id} className={styles.timelineItem}>
              <div className={styles.timelineMarker}>
                <div className={`${styles.markerDot} ${styles[task.status]}`} />
                {index < sortedTasks.length - 1 && <div className={styles.markerLine} />}
              </div>
              <div className={styles.timelineContent} onClick={() => onTaskClick(task)}>
                <div className={styles.timelineDate}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M11 2H10.5V1H9.5V2H4.5V1H3.5V2H3C2.45 2 2.005 2.45 2.005 3L2 12C2 12.55 2.45 13 3 13H11C11.55 13 12 12.55 12 12V3C12 2.45 11.55 2 11 2ZM11 12H3V5H11V12Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className={overdue ? styles.overdueText : ''}>{formatDate(task.due_date)}</span>
                </div>
                <div className={styles.timelineCard}>
                  <div className={styles.timelineCardHeader}>
                    <h3 className={styles.timelineTaskTitle}>{task.title}</h3>
                    <div className={styles.timelineBadges}>
                      <StatusBadge status={task.status} size="small" />
                      <PriorityBadge priority={task.priority} size="small" />
                    </div>
                  </div>
                  {task.description && (
                    <p className={styles.timelineDescription}>{task.description}</p>
                  )}
                  <div className={styles.timelineFooter}>
                    <div className={styles.timelineMetaLeft}>
                      {project && (
                        <ProjectBadge
                          projectName={project.name}
                          projectType={project.type}
                          size="small"
                        />
                      )}
                      {client && (
                        <div className={styles.clientInfo}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path
                              d="M6 6.5C7.1 6.5 8 5.6 8 4.5C8 3.4 7.1 2.5 6 2.5C4.9 2.5 4 3.4 4 4.5C4 5.6 4.9 6.5 6 6.5ZM6 7.5C4.5 7.5 1.5 8.25 1.5 9.75V10.5H10.5V9.75C10.5 8.25 7.5 7.5 6 7.5Z"
                              fill="currentColor"
                            />
                          </svg>
                          <span>{client.company}</span>
                        </div>
                      )}
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
                    {assignedUser && (
                      <UserAvatar user={assignedUser} size="small" showName />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
