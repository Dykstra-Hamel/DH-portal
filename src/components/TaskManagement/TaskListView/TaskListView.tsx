import React, { useState, useMemo } from 'react';
import { Task, Project, TaskStatus, TaskPriority, getClientById, getUserById } from '@/types/taskManagement';
import { StatusBadge } from '../shared/StatusBadge';
import { PriorityBadge } from '../shared/PriorityBadge';
import { ProjectBadge } from '../shared/ProjectBadge';
import { UserAvatar } from '../shared/UserAvatar';
import styles from './TaskListView.module.scss';

interface TaskListViewProps {
  tasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function TaskListView({ tasks, projects, onTaskClick, onDeleteTask }: TaskListViewProps) {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Get project for a task
  const getProjectForTask = (taskProjectId?: string) => {
    if (!taskProjectId) return null;
    return projects.find(p => p.id === taskProjectId);
  };

  // Filter and sort tasks
  const filteredTasks = useMemo(() => {
    return tasks
      .filter(task => {
        // Status filter
        if (statusFilter !== 'all' && task.status !== statusFilter) {
          return false;
        }

        // Priority filter
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
          return false;
        }

        // Search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const project = getProjectForTask(task.project_id);
          const client = project ? getClientById(project.client_id) : null;
          return (
            task.title.toLowerCase().includes(query) ||
            project?.name.toLowerCase().includes(query) ||
            client?.company.toLowerCase().includes(query)
          );
        }

        return true;
      })
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [tasks, statusFilter, priorityFilter, searchQuery, projects]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Reset time for comparison
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);

    if (taskDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (taskDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = (dueDate: string, status: TaskStatus): boolean => {
    if (status === 'completed') return false;
    return new Date(dueDate) < new Date();
  };

  return (
    <div className={styles.tasksContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Tasks</h1>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
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
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
        >
          <option value="all">All Status</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="review">Review</option>
          <option value="completed">Completed</option>
        </select>

        <select
          className={styles.filterSelect}
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'all')}
        >
          <option value="all">All Priority</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </select>
      </div>

      {/* Tasks Table */}
      <div className={styles.tasksTable}>
        <div className={styles.tableHeader}>
          <div className={styles.headerCell}>Task Title</div>
          <div className={styles.headerCell}>Project</div>
          <div className={styles.headerCell}>Client</div>
          <div className={styles.headerCell}>Status</div>
          <div className={styles.headerCell}>Priority</div>
          <div className={styles.headerCell}>Assigned To</div>
          <div className={styles.headerCell}>Due Date</div>
          <div className={styles.headerCell}>Actions</div>
        </div>

        <div className={styles.tableBody}>
          {filteredTasks.length === 0 ? (
            <div className={styles.emptyState}>
              <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                <path
                  d="M50 16H14C11.7909 16 10 17.7909 10 20V44C10 46.2091 11.7909 48 14 48H50C52.2091 48 54 46.2091 54 44V20C54 17.7909 52.2091 16 50 16Z"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M10 26H54M22 16V26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              <h3>No tasks found</h3>
              <p>Try adjusting your filters or create a new task</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const project = getProjectForTask(task.project_id);
              const client = project ? getClientById(project.client_id) : (task.client_id ? getClientById(task.client_id) : null);
              const assignedUser = task.assigned_to ? getUserById(task.assigned_to) : null;
              const overdue = isOverdue(task.due_date, task.status);

              return (
                <div key={task.id} className={styles.tableRow} onClick={() => onTaskClick(task)}>
                  <div className={styles.cell}>
                    <div className={styles.taskTitle}>{task.title}</div>
                  </div>
                  <div className={styles.cell}>
                    {project ? (
                      <ProjectBadge projectName={project.name} projectType={project.type} size="small" />
                    ) : (
                      <span className={styles.noProject}>No Project</span>
                    )}
                  </div>
                  <div className={styles.cell}>
                    <div className={styles.clientName}>{client?.company || '—'}</div>
                  </div>
                  <div className={styles.cell}>
                    <StatusBadge status={task.status} />
                  </div>
                  <div className={styles.cell}>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <div className={styles.cell}>
                    {assignedUser ? (
                      <UserAvatar user={assignedUser} size="small" showName={false} />
                    ) : (
                      <span className={styles.unassigned}>—</span>
                    )}
                  </div>
                  <div className={styles.cell}>
                    <div className={`${styles.dueDate} ${overdue ? styles.overdue : ''}`}>
                      {formatDate(task.due_date)}
                    </div>
                  </div>
                  <div className={styles.cell}>
                    <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                      <button
                        className={styles.actionButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTaskClick(task);
                        }}
                        title="Edit task"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M11.3333 2.00004C11.5084 1.82494 11.716 1.68605 11.9445 1.59129C12.1731 1.49653 12.4183 1.44775 12.6666 1.44775C12.9149 1.44775 13.1602 1.49653 13.3887 1.59129C13.6172 1.68605 13.8249 1.82494 14 2.00004C14.1751 2.17513 14.314 2.38278 14.4087 2.61131C14.5035 2.83984 14.5523 3.08507 14.5523 3.33337C14.5523 3.58168 14.5035 3.82691 14.4087 4.05544C14.314 4.28397 14.1751 4.49162 14 4.66671L5 13.6667L1.33333 14.6667L2.33333 11L11.3333 2.00004Z"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                      {onDeleteTask && (
                        <button
                          className={styles.actionButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteTask(task.id);
                          }}
                          title="Delete task"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path
                              d="M2 4H3.33333H14"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              d="M5.33333 4V2.66667C5.33333 2.31304 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31304 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31304 10.6667 2.66667V4M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31304 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4H12.6667Z"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
