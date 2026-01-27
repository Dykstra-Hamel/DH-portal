import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, TaskPriority } from '@/types/taskManagement';
import { Project } from '@/types/project';
import { PriorityBadge } from '../shared/PriorityBadge';
import { ProjectBadge } from '../shared/ProjectBadge';
import { StarButton } from '@/components/Common/StarButton/StarButton';
import styles from './TaskListView.module.scss';

type SortField = 'title' | 'project' | 'client' | 'status' | 'priority' | 'due_date';
type SortDirection = 'asc' | 'desc';
type StarredViewType = 'tasks' | 'projects';

interface TaskListViewProps {
  tasks: Task[];
  projects: Project[];
  onTaskClick: (task: Task) => void;
  onDeleteTask?: (taskId: string) => void;
  onToggleStar?: (taskId: string) => void;
  onProjectClick?: (project: Project) => void;
  onToggleStarProject?: (projectId: string) => void;
}

export function TaskListView({ tasks, projects, onTaskClick, onDeleteTask, onToggleStar, onProjectClick, onToggleStarProject }: TaskListViewProps) {
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('due_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [starredView, setStarredView] = useState<StarredViewType>('tasks');

  // Get project for a task
  const getProjectForTask = (taskProjectId?: string) => {
    if (!taskProjectId) return null;
    return projects.find(p => p.id === taskProjectId);
  };

  // Handle column sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction if clicking same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Get starred projects (exclude completed)
  const starredProjects = useMemo(() => {
    return projects.filter(p => p.is_starred && p.status !== 'complete');
  }, [projects]);

  // Separate starred and non-starred tasks
  const { starredTasks, regularTasks } = useMemo(() => {
    // Add directly starred tasks (ALWAYS exclude completed from starred section)
    const directlyStarred = tasks.filter(t => {
      return t.is_starred && t.status !== 'completed';
    });

    // Add tasks from starred projects (ALWAYS exclude completed from starred section)
    const starredTaskIds = new Set(directlyStarred.map(t => t.id));
    const starredProjectTasks = tasks.filter(t => {
      if (starredTaskIds.has(t.id)) return false; // Already included
      if (t.status === 'completed') return false; // Never show completed in starred section
      const project = getProjectForTask(t.project_id);
      return project?.is_starred;
    });

    const starred = [...directlyStarred, ...starredProjectTasks];

    // Regular tasks: show ALL tasks (including starred), exclude completed unless filtering by completed
    const regular = tasks.filter(t => {
      // Exclude completed tasks unless user is filtering by completed status
      if (statusFilter !== 'completed' && t.status === 'completed') {
        return false;
      }
      return true;
    });

    return { starredTasks: starred, regularTasks: regular };
  }, [tasks, projects, statusFilter]);

  // Filter and sort tasks
  const processedTasks = useMemo(() => {
    const filterAndSort = (taskList: Task[]) => {
      return taskList
        .filter(task => {
          // Status filter
          if (statusFilter !== 'all' && task.status !== statusFilter) {
            return false;
          }

          // Priority filter
          if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
            return false;
          }

          // Search filter - FIXED: Use real company data from project
          if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            const project = getProjectForTask(task.project_id);
            const clientName = project?.company?.name || '';
            return (
              task.title.toLowerCase().includes(query) ||
              project?.name.toLowerCase().includes(query) ||
              clientName.toLowerCase().includes(query)
            );
          }

          return true;
        })
        .sort((a, b) => {
          let comparison = 0;

          switch (sortField) {
            case 'title':
              comparison = a.title.localeCompare(b.title);
              break;
            case 'project': {
              const projectA = getProjectForTask(a.project_id)?.name || '';
              const projectB = getProjectForTask(b.project_id)?.name || '';
              comparison = projectA.localeCompare(projectB);
              break;
            }
            case 'client': {
              const clientA = getProjectForTask(a.project_id)?.company?.name || '';
              const clientB = getProjectForTask(b.project_id)?.company?.name || '';
              comparison = clientA.localeCompare(clientB);
              break;
            }
            case 'status': {
              const statusOrder = { 'todo': 0, 'in-progress': 1, 'review': 2, 'completed': 3 };
              comparison = statusOrder[a.status] - statusOrder[b.status];
              break;
            }
            case 'priority': {
              const priorityOrder = { 'low': 0, 'medium': 1, 'high': 2, 'urgent': 3 };
              comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
              break;
            }
            case 'due_date':
              comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
              break;
            default:
              comparison = 0;
          }

          return sortDirection === 'asc' ? comparison : -comparison;
        });
    };

    return {
      starred: filterAndSort(starredTasks),
      regular: filterAndSort(regularTasks),
    };
  }, [starredTasks, regularTasks, statusFilter, priorityFilter, searchQuery, projects, sortField, sortDirection]);

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

  // Render a single task row
  const renderTaskRow = (task: Task) => {
    const project = getProjectForTask(task.project_id);
    const clientName = project?.company?.name || '—'; // FIXED: Use real company data
    const overdue = isOverdue(task.due_date, task.status);

    return (
      <div key={task.id} className={styles.tableRow} onClick={() => onTaskClick(task)}>
        <div className={styles.cell}>
          <div className={styles.taskTitle}>{task.title}</div>
        </div>
        <div className={styles.cell}>
          {project ? (
            <ProjectBadge projectName={project.name} projectType={project.project_type as any} size="small" />
          ) : (
            <span className={styles.noProject}>No Project</span>
          )}
        </div>
        <div className={styles.cell}>
          <div className={styles.clientName}>{clientName}</div>
        </div>
        <div className={styles.cell}>
          <PriorityBadge priority={task.priority} />
        </div>
        <div className={styles.cell}>
          <div className={`${styles.dueDate} ${overdue ? styles.overdue : ''}`}>
            {formatDate(task.due_date)}
          </div>
        </div>
        <div className={styles.cell}>
          <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
            {onToggleStar && (
              <StarButton
                isStarred={task.is_starred || false}
                onToggle={() => onToggleStar(task.id)}
                size="medium"
              />
            )}
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
  };

  // Helper functions for project cards
  const stripHtml = (html: string): string => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const formatDateShort = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const isPastDue = (date: Date): boolean => {
    return date < new Date();
  };

  const calculateProgress = (project: Project): { completed: number; total: number; percentage: number } => {
    const completed = project.progress?.completed ?? 0;
    const total = project.progress?.total ?? 0;
    const derivedPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const percentage = project.progress
      ? derivedPercentage
      : project.progress_percentage ?? derivedPercentage;
    return { completed, total, percentage };
  };

  // Render a single project card
  const renderProjectCard = (project: Project) => {
    const progress = calculateProgress(project);

    return (
      <div
        key={project.id}
        className={styles.projectCard}
        onClick={() => onProjectClick?.(project)}
      >
        <div className={styles.cardTopRow}>
          <div
            className={`${styles.dateSection} ${
              project.due_date && isPastDue(new Date(project.due_date))
                ? styles.overdueDate
                : ''
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <span>{project.due_date ? formatDateShort(project.due_date) : 'No date'}</span>
          </div>
          <div className={styles.companySection}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" stroke="currentColor" strokeWidth="2" />
              <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>{project.company?.name || 'No company'}</span>
          </div>
        </div>

        {project.shortcode && (
          <div className={styles.projectMeta}>
            <span className={styles.projectCode}>{project.shortcode}</span>
          </div>
        )}

        <h3 className={styles.projectName}>{project.name}</h3>

        {project.description && (() => {
          const descriptionText = stripHtml(project.description);
          if (!descriptionText) return null;
          return (
            <p className={styles.projectDescription}>{descriptionText}</p>
          );
        })()}

        <div className={styles.cardMetrics}>
          <div className={styles.metricItem}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>{project.comments_count ?? 0} Comments</span>
          </div>
          <div className={styles.metricItem}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" />
              <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>{project.members_count ?? 0} Members</span>
          </div>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <div className={styles.progressLabelWithStar}>
              <span className={styles.progressLabel}>Progress</span>
              {onToggleStarProject && (
                <StarButton
                  isStarred={project.is_starred || false}
                  onToggle={() => onToggleStarProject(project.id)}
                  size="small"
                />
              )}
            </div>
            <span className={styles.progressFraction}>
              {progress.completed}/{progress.total}
            </span>
          </div>
          <div className={styles.progressBarRow}>
            <div className={styles.progressBarContainer}>
              <div
                className={styles.progressBarFill}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            {(project.scope === 'external' || project.scope === 'both') && (
              <span className={styles.externalBadge}>External</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.tasksContainer}>
      {/* Currently Working On Section */}
      {(starredTasks.length > 0 || starredProjects.length > 0) && (
        <div className={styles.currentlyWorkingOnSection}>
          <div className={styles.sectionHeaderRow}>
            <h2 className={styles.sectionTitle}>
              Currently Working On
            </h2>
            <div className={styles.viewToggle}>
              <button
                className={`${styles.toggleButton} ${starredView === 'tasks' ? styles.active : ''}`}
                onClick={() => setStarredView('tasks')}
              >
                Tasks ({starredTasks.length})
              </button>
              <button
                className={`${styles.toggleButton} ${starredView === 'projects' ? styles.active : ''}`}
                onClick={() => setStarredView('projects')}
              >
                Projects ({starredProjects.length})
              </button>
            </div>
          </div>

          {starredView === 'tasks' ? (
            <div className={styles.starredTasksTable}>
              <div className={styles.tableHeader}>
                <div className={styles.headerCell}>Task Title</div>
                <div className={styles.headerCell}>Project</div>
                <div className={styles.headerCell}>Client</div>
                <div className={styles.headerCell}>Priority</div>
                <div className={styles.headerCell}>Due Date</div>
                <div className={styles.headerCell}>Actions</div>
              </div>
              <div className={styles.tableBody}>
                {starredTasks.length === 0 ? (
                  <div className={styles.emptyStarredState}>
                    <p>No starred tasks. Star tasks to see them here.</p>
                  </div>
                ) : (
                  starredTasks.map((task) => renderTaskRow(task))
                )}
              </div>
            </div>
          ) : (
            <div className={styles.projectsGrid}>
              {starredProjects.length === 0 ? (
                <div className={styles.emptyStarredState}>
                  <p>No starred projects. Star projects to see them here.</p>
                </div>
              ) : (
                starredProjects.map((project) => renderProjectCard(project))
              )}
            </div>
          )}
        </div>
      )}

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
          <div
            className={`${styles.headerCell} ${styles.sortable}`}
            onClick={() => handleSort('title')}
          >
            Task Title
            {sortField === 'title' && (
              <span className={styles.sortIcon}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div
            className={`${styles.headerCell} ${styles.sortable}`}
            onClick={() => handleSort('project')}
          >
            Project
            {sortField === 'project' && (
              <span className={styles.sortIcon}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div
            className={`${styles.headerCell} ${styles.sortable}`}
            onClick={() => handleSort('client')}
          >
            Client
            {sortField === 'client' && (
              <span className={styles.sortIcon}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div
            className={`${styles.headerCell} ${styles.sortable}`}
            onClick={() => handleSort('priority')}
          >
            Priority
            {sortField === 'priority' && (
              <span className={styles.sortIcon}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div
            className={`${styles.headerCell} ${styles.sortable}`}
            onClick={() => handleSort('due_date')}
          >
            Due Date
            {sortField === 'due_date' && (
              <span className={styles.sortIcon}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}
          </div>
          <div className={styles.headerCell}>Actions</div>
        </div>

        <div className={styles.tableBody}>
          {processedTasks.regular.length === 0 ? (
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
            processedTasks.regular.map((task) => renderTaskRow(task))
          )}
        </div>
      </div>
    </div>
  );
}
