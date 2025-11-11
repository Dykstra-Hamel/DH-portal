'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  User as UserIcon,
  Building,
  Clock,
  DollarSign,
  Tag,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Project, statusOptions, priorityOptions } from '@/types/project';
import styles from './ProjectDetail.module.scss';

interface ProjectDetailProps {
  project: Project;
  user: User;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, user }) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusColor = (status: string) => {
    return statusOptions.find(s => s.value === status)?.color || '#6b7280';
  };

  const getPriorityColor = (priority: string) => {
    return priorityOptions.find(p => p.value === priority)?.color || '#6b7280';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'Not set';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatHours = (hours: number | null) => {
    if (!hours) return 'Not set';
    return `${hours} hours`;
  };

  const handleEdit = () => {
    // Navigate to dedicated edit page
    router.push(`/project-management/${project.id}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete project "${project.name}"? This action cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/projects/${project.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete project');
      }

      // Navigate back to list
      router.push('/project-management');
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Failed to delete project. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleBack = () => {
    router.push('/project-management');
  };

  return (
    <div className={styles.projectDetail}>
      {/* Breadcrumbs */}
      <div className={styles.breadcrumbs}>
        <button onClick={handleBack} className={styles.breadcrumbLink}>
          Project Management
        </button>
        <span className={styles.breadcrumbSeparator}>/</span>
        <span className={styles.breadcrumbCurrent}>{project.name}</span>
      </div>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={handleBack} className={styles.backButton}>
            <ArrowLeft size={20} />
            Back to Projects
          </button>
          <h1 className={styles.projectName}>{project.name}</h1>
          <div className={styles.badges}>
            <span
              className={styles.statusBadge}
              style={{ backgroundColor: getStatusColor(project.status) }}
            >
              {statusOptions.find(s => s.value === project.status)?.label}
            </span>
            <span
              className={styles.priorityBadge}
              style={{ backgroundColor: getPriorityColor(project.priority) }}
            >
              {priorityOptions.find(p => p.value === project.priority)?.label}
            </span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button onClick={handleEdit} className={styles.editButton}>
            <Edit size={18} />
            Edit
          </button>
          <button
            onClick={handleDelete}
            className={styles.deleteButton}
            disabled={isDeleting}
          >
            <Trash2 size={18} />
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={styles.content}>
        {/* Left Column */}
        <div className={styles.mainColumn}>
          {/* Description */}
          {project.description && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <FileText size={20} />
                Description
              </h2>
              <p className={styles.description}>{project.description}</p>
            </div>
          )}

          {/* Notes */}
          {project.notes && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <AlertCircle size={20} />
                Notes
              </h2>
              <p className={styles.notes}>{project.notes}</p>
            </div>
          )}

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>
                <Tag size={20} />
                Tags
              </h2>
              <div className={styles.tags}>
                {project.tags.map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Metadata */}
        <div className={styles.sideColumn}>
          {/* Project Info */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Project Information</h3>

            <div className={styles.infoItem}>
              <Building size={16} />
              <div>
                <div className={styles.infoLabel}>Company</div>
                <div className={styles.infoValue}>{project.company.name}</div>
              </div>
            </div>

            <div className={styles.infoItem}>
              <FileText size={16} />
              <div>
                <div className={styles.infoLabel}>Project Type</div>
                <div className={styles.infoValue}>{project.project_type}</div>
              </div>
            </div>

            <div className={styles.infoItem}>
              <UserIcon size={16} />
              <div>
                <div className={styles.infoLabel}>Requested By</div>
                <div className={styles.infoValue}>
                  {project.requested_by_profile.first_name}{' '}
                  {project.requested_by_profile.last_name}
                </div>
                <div className={styles.infoEmail}>
                  {project.requested_by_profile.email}
                </div>
              </div>
            </div>

            {project.assigned_to_profile && (
              <div className={styles.infoItem}>
                <UserIcon size={16} />
                <div>
                  <div className={styles.infoLabel}>Assigned To</div>
                  <div className={styles.infoValue}>
                    {project.assigned_to_profile.first_name}{' '}
                    {project.assigned_to_profile.last_name}
                  </div>
                  <div className={styles.infoEmail}>
                    {project.assigned_to_profile.email}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Timeline</h3>

            <div className={styles.infoItem}>
              <Calendar size={16} />
              <div>
                <div className={styles.infoLabel}>Due Date</div>
                <div className={styles.infoValue}>{formatDate(project.due_date)}</div>
              </div>
            </div>

            {project.start_date && (
              <div className={styles.infoItem}>
                <Calendar size={16} />
                <div>
                  <div className={styles.infoLabel}>Start Date</div>
                  <div className={styles.infoValue}>{formatDate(project.start_date)}</div>
                </div>
              </div>
            )}

            {project.completion_date && (
              <div className={styles.infoItem}>
                <Calendar size={16} />
                <div>
                  <div className={styles.infoLabel}>Completion Date</div>
                  <div className={styles.infoValue}>{formatDate(project.completion_date)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Budget & Hours */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Budget & Time</h3>

            {project.budget_amount !== null && (
              <div className={styles.infoItem}>
                <DollarSign size={16} />
                <div>
                  <div className={styles.infoLabel}>Budget</div>
                  <div className={styles.infoValue}>
                    {formatCurrency(project.budget_amount)}
                  </div>
                </div>
              </div>
            )}

            {project.estimated_hours !== null && (
              <div className={styles.infoItem}>
                <Clock size={16} />
                <div>
                  <div className={styles.infoLabel}>Estimated Hours</div>
                  <div className={styles.infoValue}>
                    {formatHours(project.estimated_hours)}
                  </div>
                </div>
              </div>
            )}

            {project.actual_hours !== null && (
              <div className={styles.infoItem}>
                <Clock size={16} />
                <div>
                  <div className={styles.infoLabel}>Actual Hours</div>
                  <div className={styles.infoValue}>
                    {formatHours(project.actual_hours)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className={styles.infoCard}>
            <h3 className={styles.infoCardTitle}>Metadata</h3>

            <div className={styles.infoItem}>
              <Calendar size={16} />
              <div>
                <div className={styles.infoLabel}>Created</div>
                <div className={styles.infoValue}>{formatDate(project.created_at)}</div>
              </div>
            </div>

            <div className={styles.infoItem}>
              <Calendar size={16} />
              <div>
                <div className={styles.infoLabel}>Last Updated</div>
                <div className={styles.infoValue}>{formatDate(project.updated_at)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
