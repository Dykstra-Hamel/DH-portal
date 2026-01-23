'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Edit, Trash2, Calendar, User, Tag } from 'lucide-react';
import { Project, statusOptions, priorityOptions } from '@/types/project';
import styles from './ProjectsTable.module.scss';

interface ProjectsTableProps {
  projects: Project[];
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  showActions?: boolean;
}

const ProjectsTable: React.FC<ProjectsTableProps> = ({
  projects,
  onEdit,
  onDelete,
  showActions = true,
}) => {
  const router = useRouter();

  const handleProjectClick = (projectId: string) => {
    router.push(`/admin/project-management/${projectId}`);
  };

  const getStatusColor = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || '#6b7280';
  };

  const getPriorityColor = (priority: string) => {
    return priorityOptions.find(p => p.value === priority)?.color || '#6b7280';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number | null) => {
    return amount ? `$${amount.toLocaleString()}` : '';
  };

  if (projects.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No projects found. Create your first project to get started.</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Project</th>
            <th>Company</th>
            <th>Type</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Requester</th>
            <th>Assigned To</th>
            <th>Due Date</th>
            <th>Quoted Price</th>
            {showActions && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {projects.map(project => (
            <tr key={project.id}>
              <td>
                <div className={styles.projectInfo}>
                  <strong
                    className={styles.projectName}
                    onClick={() => handleProjectClick(project.id)}
                  >
                    {project.name}
                  </strong>
                  {project.description && (
                    <div className={styles.description}>
                      {project.description.substring(0, 100)}
                      {project.description.length > 100 && '...'}
                    </div>
                  )}
                  {project.tags && project.tags.length > 0 && (
                    <div className={styles.tags}>
                      {project.tags.map((tag, index) => (
                        <span key={index} className={styles.tag}>
                          <Tag size={12} />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </td>
              <td>{project.company.name}</td>
              <td>{project.project_type}</td>
              <td>
                <span
                  className={styles.statusBadge}
                  style={{ backgroundColor: getStatusColor(project.status) }}
                >
                  {statusOptions.find(s => s.value === project.status)?.label}
                </span>
              </td>
              <td>
                <span
                  className={styles.priorityBadge}
                  style={{
                    backgroundColor: getPriorityColor(project.priority),
                  }}
                >
                  {
                    priorityOptions.find(p => p.value === project.priority)
                      ?.label
                  }
                </span>
              </td>
              <td>
                <div className={styles.userInfo}>
                  <User size={14} />
                  {project.requested_by_profile
                    ? `${project.requested_by_profile.first_name} ${project.requested_by_profile.last_name}`
                    : 'Unknown User'}
                </div>
              </td>
              <td>
                {project.assigned_to_profile ? (
                  <div className={styles.userInfo}>
                    <User size={14} />
                    {project.assigned_to_profile.first_name}{' '}
                    {project.assigned_to_profile.last_name}
                  </div>
                ) : (
                  <span className={styles.unassigned}>Unassigned</span>
                )}
              </td>
              <td>
                <div className={styles.dateInfo}>
                  <Calendar size={14} />
                  {formatDate(project.due_date)}
                </div>
              </td>
              <td>{project.is_billable && project.quoted_price ? formatCurrency(project.quoted_price) : '-'}</td>
              {showActions && (
                <td>
                  <div className={styles.actions}>
                    <button
                      onClick={() => onEdit?.(project)}
                      className={styles.editButton}
                      title="Edit project"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete?.(project.id)}
                      className={styles.deleteButton}
                      title="Delete project"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProjectsTable;
