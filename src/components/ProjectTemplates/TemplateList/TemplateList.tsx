'use client';

import React, { useEffect, useState } from 'react';
import { ProjectTemplate } from '@/types/project';
import styles from './TemplateList.module.scss';
import { Edit, Trash2, Copy, CheckCircle, XCircle } from 'lucide-react';

interface TemplateListProps {
  onEdit: (template: ProjectTemplate) => void;
  onRefresh: number;
  searchQuery?: string;
  filterProjectType?: string;
  filterIsActive?: boolean | null;
}

const TemplateList: React.FC<TemplateListProps> = ({
  onEdit,
  onRefresh,
  searchQuery = '',
  filterProjectType = 'all',
  filterIsActive = null,
}) => {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Strip HTML tags from description for card display
  const stripHtml = (html: string | null | undefined): string => {
    if (!html) return '';
    // Create a temporary div to parse HTML
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  useEffect(() => {
    fetchTemplates();
  }, [onRefresh]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/project-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (template: ProjectTemplate) => {
    if (
      !confirm(
        `Are you sure you want to delete template "${template.name}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/project-templates/${template.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete template');
      }

      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template. Please try again.');
    }
  };

  const handleToggleActive = async (template: ProjectTemplate) => {
    try {
      const response = await fetch(`/api/admin/project-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...template,
          is_active: !template.is_active,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update template');
      }

      await fetchTemplates();
    } catch (error) {
      console.error('Error updating template:', error);
      alert('Failed to update template. Please try again.');
    }
  };

  const filteredTemplates = templates.filter((template) => {
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        template.name.toLowerCase().includes(query) ||
        template.description?.toLowerCase().includes(query) ||
        template.project_type.toLowerCase().includes(query) ||
        template.project_subtype?.toLowerCase().includes(query);

      if (!matchesSearch) return false;
    }

    // Project type filter
    if (filterProjectType !== 'all' && template.project_type !== filterProjectType) {
      return false;
    }

    // Active status filter
    if (filterIsActive !== null && template.is_active !== filterIsActive) {
      return false;
    }

    return true;
  });

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
        <p>Loading templates...</p>
      </div>
    );
  }

  return (
    <div className={styles.templateList}>
      {filteredTemplates.length === 0 ? (
        <div className={styles.emptyState}>
          <p>
            {templates.length === 0
              ? 'No templates created yet. Click "New Template" to create your first template.'
              : 'No templates match your filters.'}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredTemplates.map((template) => (
            <div key={template.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <h3>{template.name}</h3>
                  <span
                    className={
                      template.is_active ? styles.badgeActive : styles.badgeInactive
                    }
                  >
                    {template.is_active ? (
                      <>
                        <CheckCircle size={14} />
                        Active
                      </>
                    ) : (
                      <>
                        <XCircle size={14} />
                        Inactive
                      </>
                    )}
                  </span>
                </div>
                <div className={styles.cardType}>
                  {template.project_type}
                  {template.project_subtype && ` • ${template.project_subtype}`}
                </div>
              </div>

              {template.description && (
                <p className={styles.cardDescription}>{stripHtml(template.description)}</p>
              )}

              <div className={styles.cardMeta}>
                <span className={styles.taskCount}>
                  {template.tasks?.length || 0} task
                  {template.tasks?.length !== 1 ? 's' : ''}
                </span>
                <span className={styles.createdDate}>
                  Created {new Date(template.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className={styles.cardActions}>
                <button
                  onClick={() => handleToggleActive(template)}
                  className={styles.actionButton}
                  title={template.is_active ? 'Deactivate' : 'Activate'}
                >
                  {template.is_active ? (
                    <XCircle size={16} />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                </button>
                <button
                  onClick={() => onEdit(template)}
                  className={styles.actionButton}
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(template)}
                  className={styles.deleteButton}
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateList;
