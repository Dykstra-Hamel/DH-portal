import React, { useState, useMemo } from 'react';
import { Task, Project, getUserById, getClientById, getProjectById } from '@/types/taskManagement';
import { PriorityBadge } from '../shared/PriorityBadge';
import { ProjectBadge } from '../shared/ProjectBadge';
import { UserAvatar } from '../shared/UserAvatar';
import styles from './ArchiveView.module.scss';

interface ArchiveViewProps {
  tasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
}

type GroupByOption = 'week' | 'month' | 'project';

export function ArchiveView({ tasks, projects, onTaskClick }: ArchiveViewProps) {
  const [groupBy, setGroupBy] = useState<GroupByOption>('month');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tasks by search query
  const filteredTasks = useMemo(() => {
    if (!searchQuery.trim()) return tasks;

    const query = searchQuery.toLowerCase();
    return tasks.filter(task => {
      return (
        task.title.toLowerCase().includes(query) ||
        task.description?.toLowerCase().includes(query) ||
        task.tags.some(tag => tag.toLowerCase().includes(query))
      );
    });
  }, [tasks, searchQuery]);

  // Group tasks
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};

    filteredTasks.forEach(task => {
      let groupKey: string;

      if (groupBy === 'week') {
        const completedDate = task.completed_date ? new Date(task.completed_date) : new Date(task.updated_at);
        const weekStart = new Date(completedDate);
        weekStart.setDate(completedDate.getDate() - completedDate.getDay());
        groupKey = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      } else if (groupBy === 'month') {
        const completedDate = task.completed_date ? new Date(task.completed_date) : new Date(task.updated_at);
        groupKey = completedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } else {
        // Group by project
        if (task.project_id) {
          const project = getProjectById(task.project_id);
          groupKey = project ? project.name : 'No Project';
        } else {
          groupKey = 'No Project';
        }
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });

    // Sort groups by date (most recent first)
    const sortedGroups = Object.entries(groups).sort((a, b) => {
      const aDate = a[1][0].completed_date || a[1][0].updated_at;
      const bDate = b[1][0].completed_date || b[1][0].updated_at;
      return new Date(bDate).getTime() - new Date(aDate).getTime();
    });

    return Object.fromEntries(sortedGroups);
  }, [filteredTasks, groupBy]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalTasks = tasks.length;
    const totalHours = tasks.reduce((sum, task) => sum + task.estimated_hours, 0);

    // Calculate average time to complete (from created to completed)
    const completionTimes = tasks
      .filter(task => task.completed_date)
      .map(task => {
        const created = new Date(task.created_at).getTime();
        const completed = new Date(task.completed_date!).getTime();
        return (completed - created) / (1000 * 60 * 60 * 24); // Days
      });

    const avgDaysToComplete = completionTimes.length > 0
      ? Math.round(completionTimes.reduce((sum, days) => sum + days, 0) / completionTimes.length)
      : 0;

    return { totalTasks, totalHours, avgDaysToComplete };
  }, [tasks]);

  const formatCompletedDate = (task: Task): string => {
    const date = task.completed_date ? new Date(task.completed_date) : new Date(task.updated_at);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={styles.archiveContainer}>
      {/* Header with Stats */}
      <div className={styles.archiveHeader}>
        <div className={styles.statsCards}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.totalTasks}</div>
            <div className={styles.statLabel}>Completed Tasks</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.totalHours}h</div>
            <div className={styles.statLabel}>Total Hours</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.avgDaysToComplete}d</div>
            <div className={styles.statLabel}>Avg. Completion Time</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={styles.controls}>
        <div className={styles.searchBar}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 14L10.5 10.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="text"
            placeholder="Search completed tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              className={styles.clearButton}
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        <div className={styles.groupByButtons}>
          <span className={styles.groupByLabel}>Group by:</span>
          <button
            className={`${styles.groupByButton} ${groupBy === 'week' ? styles.active : ''}`}
            onClick={() => setGroupBy('week')}
          >
            Week
          </button>
          <button
            className={`${styles.groupByButton} ${groupBy === 'month' ? styles.active : ''}`}
            onClick={() => setGroupBy('month')}
          >
            Month
          </button>
          <button
            className={`${styles.groupByButton} ${groupBy === 'project' ? styles.active : ''}`}
            onClick={() => setGroupBy('project')}
          >
            Project
          </button>
        </div>
      </div>

      {/* Grouped Tasks */}
      <div className={styles.groupedTasks}>
        {Object.entries(groupedTasks).length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <path
                d="M32 56C45.2548 56 56 45.2548 56 32C56 18.7452 45.2548 8 32 8C18.7452 8 8 18.7452 8 32C8 45.2548 18.7452 56 32 56Z"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M24 32L28 36L40 24"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <h3>No completed tasks found</h3>
            <p>
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Completed tasks will appear here'}
            </p>
          </div>
        ) : (
          Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
            <div key={groupName} className={styles.taskGroup}>
              <div className={styles.groupHeader}>
                <h3 className={styles.groupTitle}>{groupName}</h3>
                <div className={styles.groupCount}>{groupTasks.length} tasks</div>
              </div>
              <div className={styles.taskList}>
                {groupTasks.map((task) => {
                  const project = task.project_id ? getProjectById(task.project_id) : undefined;
                  const client = task.client_id ? getClientById(task.client_id) : undefined;
                  const assignedUser = task.assigned_to ? getUserById(task.assigned_to) : undefined;

                  return (
                    <div
                      key={task.id}
                      className={styles.taskItem}
                      onClick={() => onTaskClick(task)}
                    >
                      <div className={styles.taskItemHeader}>
                        <div className={styles.taskItemTitle}>
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={styles.checkIcon}>
                            <circle cx="8" cy="8" r="7" fill="#d1fae5" />
                            <path
                              d="M5 8L7 10L11 6"
                              stroke="#065f46"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span>{task.title}</span>
                        </div>
                        <PriorityBadge priority={task.priority} size="small" />
                      </div>

                      {task.description && (
                        <p className={styles.taskItemDescription}>{task.description}</p>
                      )}

                      <div className={styles.taskItemFooter}>
                        <div className={styles.taskItemMeta}>
                          {project && (
                            <ProjectBadge
                              projectName={project.name}
                              projectType={project.type}
                              size="small"
                            />
                          )}
                          {client && (
                            <div className={styles.metaItem}>
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path
                                  d="M6 6.5C7.1 6.5 8 5.6 8 4.5C8 3.4 7.1 2.5 6 2.5C4.9 2.5 4 3.4 4 4.5C4 5.6 4.9 6.5 6 6.5ZM6 7.5C4.5 7.5 1.5 8.25 1.5 9.75V10.5H10.5V9.75C10.5 8.25 7.5 7.5 6 7.5Z"
                                  fill="currentColor"
                                />
                              </svg>
                              <span>{client.company}</span>
                            </div>
                          )}
                          <div className={styles.metaItem}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path
                                d="M6 1C3.24 1 1 3.24 1 6C1 8.76 3.24 11 6 11C8.76 11 11 8.76 11 6C11 3.24 8.76 1 6 1ZM6 10C3.79 10 2 8.21 2 6C2 3.79 3.79 2 6 2C8.21 2 10 3.79 10 6C10 8.21 8.21 10 6 10ZM6.25 3.5H5.5V6.5L8 8.24L8.375 7.635L6.25 6.175V3.5Z"
                                fill="currentColor"
                              />
                            </svg>
                            <span>{task.estimated_hours}h</span>
                          </div>
                          <div className={styles.metaItem}>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path
                                d="M9.5 1.5H9V0.5H8V1.5H4V0.5H3V1.5H2.5C1.95 1.5 1.505 1.95 1.505 2.5L1.5 10.5C1.5 11.05 1.95 11.5 2.5 11.5H9.5C10.05 11.5 10.5 11.05 10.5 10.5V2.5C10.5 1.95 10.05 1.5 9.5 1.5ZM9.5 10.5H2.5V4H9.5V10.5Z"
                                fill="currentColor"
                              />
                            </svg>
                            <span>{formatCompletedDate(task)}</span>
                          </div>
                        </div>
                        {assignedUser && (
                          <UserAvatar user={assignedUser} size="small" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
