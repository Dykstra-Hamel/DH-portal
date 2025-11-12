import React, { useState, useMemo } from 'react';
import { Project, Task, ProjectStatus, ProjectType, getClientById, getTasksByProject } from '@/types/taskManagement';
import { ProjectBadge } from '@/components/TaskManagement/shared/ProjectBadge';
import styles from './ProjectsView.module.scss';

interface ProjectsViewProps {
  projects: Project[];
  tasks: Task[];
  onEditProject: (project: Project) => void;
  onDeleteProject: (projectId: string) => void;
}

export function ProjectsView({ projects, tasks, onEditProject, onDeleteProject }: ProjectsViewProps) {
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<ProjectType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Calculate project task counts
  const getProjectTaskCount = (projectId: string) => {
    const projectTasks = tasks.filter(t => t.project_id === projectId);
    const completed = projectTasks.filter(t => t.status === 'completed').length;
    return { total: projectTasks.length, completed };
  };

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter(project => {
        // Status filter
        if (statusFilter !== 'all' && project.status !== statusFilter) {
          return false;
        }

        // Type filter
        if (typeFilter !== 'all' && project.type !== typeFilter) {
          return false;
        }

        // Search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const client = getClientById(project.client_id);
          return (
            project.name.toLowerCase().includes(query) ||
            client?.company.toLowerCase().includes(query)
          );
        }

        return true;
      })
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
  }, [projects, statusFilter, typeFilter, searchQuery]);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status: ProjectStatus) => {
    const statusConfig = {
      planning: { color: '#f3f4f6', textColor: '#6b7280', label: 'Planning' },
      active: { color: '#dbeafe', textColor: '#1e40af', label: 'Active' },
      'on-hold': { color: '#fef3c7', textColor: '#b45309', label: 'On Hold' },
      completed: { color: '#d1fae5', textColor: '#065f46', label: 'Completed' },
      archived: { color: '#f3f4f6', textColor: '#9ca3af', label: 'Archived' },
    };

    const config = statusConfig[status];
    return (
      <span
        className={styles.statusBadge}
        style={{ background: config.color, color: config.textColor }}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className={styles.projectsContainer}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Projects</h1>
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
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'all')}
        >
          <option value="all">All Status</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>

        <select
          className={styles.filterSelect}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as ProjectType | 'all')}
        >
          <option value="all">All Types</option>
          <option value="new-client-onboarding">New Client Onboarding</option>
          <option value="monthly-marketing">Monthly Marketing</option>
          <option value="website-redesign">Website Redesign</option>
          <option value="seasonal-campaign">Seasonal Campaign</option>
        </select>
      </div>

      {/* Projects Table */}
      <div className={styles.projectsTable}>
        <div className={styles.tableHeader}>
          <div className={styles.headerCell}>Project Name</div>
          <div className={styles.headerCell}>Client</div>
          <div className={styles.headerCell}>Type</div>
          <div className={styles.headerCell}>Status</div>
          <div className={styles.headerCell}>Progress</div>
          <div className={styles.headerCell}>Tasks</div>
          <div className={styles.headerCell}>Deadline</div>
          <div className={styles.headerCell}>Actions</div>
        </div>

        <div className={styles.tableBody}>
          {filteredProjects.length === 0 ? (
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
              <h3>No projects found</h3>
              <p>Try adjusting your filters or create a new project</p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const client = getClientById(project.client_id);
              const taskStats = getProjectTaskCount(project.id);

              return (
                <div key={project.id} className={styles.tableRow}>
                  <div className={styles.cell}>
                    <div className={styles.projectName}>{project.name}</div>
                  </div>
                  <div className={styles.cell}>
                    <div className={styles.clientName}>{client?.company || 'Unknown'}</div>
                  </div>
                  <div className={styles.cell}>
                    <ProjectBadge projectName={project.type} projectType={project.type} size="small" />
                  </div>
                  <div className={styles.cell}>
                    {getStatusBadge(project.status)}
                  </div>
                  <div className={styles.cell}>
                    <div className={styles.progressContainer}>
                      <div className={styles.progressBar}>
                        <div
                          className={styles.progressFill}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <span className={styles.progressText}>{project.progress}%</span>
                    </div>
                  </div>
                  <div className={styles.cell}>
                    <div className={styles.taskCount}>
                      {taskStats.completed}/{taskStats.total}
                    </div>
                  </div>
                  <div className={styles.cell}>
                    <div className={styles.deadline}>{formatDate(project.deadline)}</div>
                  </div>
                  <div className={styles.cell}>
                    <div className={styles.actions}>
                      <button
                        className={styles.actionButton}
                        onClick={() => onEditProject(project)}
                        title="Edit project"
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
                      <button
                        className={styles.actionButton}
                        onClick={() => onDeleteProject(project.id)}
                        title="Delete project"
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
