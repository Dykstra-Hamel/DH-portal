'use client';

import { useState, useEffect } from 'react';
import styles from './ApplyTemplateModal.module.scss';
import { ProjectTemplate, statusOptions, Project } from '@/types/project';
import { X } from 'lucide-react';

interface ApplyTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onSuccess: () => void;
}

export default function ApplyTemplateModal({
  isOpen,
  onClose,
  projectId,
  onSuccess,
}: ApplyTemplateModalProps) {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [mergeDescription, setMergeDescription] = useState<boolean>(true);
  const [keepExistingTasks, setKeepExistingTasks] = useState<boolean>(true);
  const [useTemplateDueDate, setUseTemplateDueDate] = useState<boolean>(false);
  const [newStatus, setNewStatus] = useState<Project['status']>('in_progress');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [fetchingTemplates, setFetchingTemplates] = useState<boolean>(true);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);

  // Fetch current project and available templates
  useEffect(() => {
    if (!isOpen) return;

    const fetchData = async () => {
      try {
        setFetchingTemplates(true);

        // Fetch current project
        const projectResponse = await fetch(`/api/admin/projects/${projectId}`);
        if (projectResponse.ok) {
          const projectData = await projectResponse.json();
          setCurrentProject(projectData);
        }

        // Fetch templates
        const templatesResponse = await fetch('/api/admin/project-templates');
        if (!templatesResponse.ok) {
          throw new Error('Failed to fetch templates');
        }
        const templatesData = await templatesResponse.json();
        setTemplates(templatesData.filter((t: ProjectTemplate) => t.is_active));
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load templates');
      } finally {
        setFetchingTemplates(false);
      }
    };

    fetchData();
  }, [isOpen, projectId]);

  const handleApply = async () => {
    if (!selectedTemplateId) {
      setError('Please select a template');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/projects/${projectId}/apply-template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplateId,
          mergeDescription,
          keepExistingTasks,
          useTemplateDueDate,
          newStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply template');
      }

      onSuccess();
    } catch (err) {
      console.error('Error applying template:', err);
      setError(err instanceof Error ? err.message : 'Failed to apply template');
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  // Calculate what the due date would be if using template
  const calculateTemplateDueDate = () => {
    if (!selectedTemplate || selectedTemplate.default_due_date_offset_days === null) {
      return null;
    }

    const startDate = currentProject?.start_date
      ? new Date(currentProject.start_date)
      : new Date();

    const dueDate = new Date(startDate);
    dueDate.setDate(dueDate.getDate() + selectedTemplate.default_due_date_offset_days);

    return dueDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const templateDueDate = calculateTemplateDueDate();

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Apply Template</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {fetchingTemplates ? (
            <div className={styles.loading}>Loading templates...</div>
          ) : templates.length === 0 ? (
            <div className={styles.noTemplates}>
              No active templates available. Create a template first.
            </div>
          ) : (
            <>
              <div className={styles.field}>
                <label htmlFor="template-select">Select Template</label>
                <select
                  id="template-select"
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className={styles.select}
                >
                  <option value="">-- Choose a template --</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.project_type})
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label htmlFor="status-select">Set Project Status</label>
                <select
                  id="status-select"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as Project['status'])}
                  className={styles.select}
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <small className={styles.hint}>
                  The project status will be updated to this value after applying the template
                </small>
              </div>

              <div className={styles.toggleSection}>
                <div className={styles.toggleField}>
                  <div className={styles.toggleInfo}>
                    <label className={styles.toggleLabel}>Append Template Description</label>
                    <small className={styles.toggleHint}>
                      Add template description to existing description instead of replacing it
                    </small>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={mergeDescription}
                      onChange={(e) => setMergeDescription(e.target.checked)}
                      aria-label="Append template description"
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>

                <div className={styles.toggleField}>
                  <div className={styles.toggleInfo}>
                    <label className={styles.toggleLabel}>Keep Existing Tasks</label>
                    <small className={styles.toggleHint}>
                      Add template tasks to existing tasks instead of replacing them
                    </small>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={keepExistingTasks}
                      onChange={(e) => setKeepExistingTasks(e.target.checked)}
                      aria-label="Keep existing tasks"
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>

                {selectedTemplate && selectedTemplate.default_due_date_offset_days !== null && (
                  <div className={styles.toggleField}>
                    <div className={styles.toggleInfo}>
                      <label className={styles.toggleLabel}>Use Template Due Date</label>
                      <small className={styles.toggleHint}>
                        {templateDueDate
                          ? `Set due date to ${templateDueDate} (${selectedTemplate.default_due_date_offset_days} days from ${currentProject?.start_date ? 'project start' : 'today'})`
                          : 'Update due date based on template offset'}
                      </small>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={useTemplateDueDate}
                        onChange={(e) => setUseTemplateDueDate(e.target.checked)}
                        aria-label="Use template due date"
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                )}
              </div>

              {selectedTemplate && (
                <div className={styles.preview}>
                  <h3>What Will Be Applied</h3>
                  <div className={styles.previewContent}>
                    <div className={styles.previewRow}>
                      <strong>Template:</strong> {selectedTemplate.name}
                    </div>
                    <div className={styles.previewRow}>
                      <strong>Status:</strong> Will be set to &quot;{statusOptions.find(s => s.value === newStatus)?.label || newStatus}&quot;
                    </div>
                    {useTemplateDueDate && templateDueDate && (
                      <div className={styles.previewRow}>
                        <strong>Due Date:</strong> Will be set to {templateDueDate}
                      </div>
                    )}
                    {selectedTemplate.description && (
                      <div className={styles.previewRow}>
                        <strong>Description:</strong>{' '}
                        {mergeDescription ? 'Will be appended to existing' : 'Will replace existing'}
                      </div>
                    )}
                    {selectedTemplate.notes && (
                      <div className={styles.previewRow}>
                        <strong>Notes:</strong> Will be appended to existing
                      </div>
                    )}
                    {selectedTemplate.initial_department && (
                      <div className={styles.previewRow}>
                        <strong>Department:</strong> Will be set to &quot;{selectedTemplate.initial_department.name}&quot;
                      </div>
                    )}
                    {selectedTemplate.default_scope && (
                      <div className={styles.previewRow}>
                        <strong>Scope:</strong> Will be set to &quot;{selectedTemplate.default_scope}&quot;
                      </div>
                    )}
                    {selectedTemplate.tasks && selectedTemplate.tasks.length > 0 && (
                      <div className={styles.previewRow}>
                        <strong>Tasks:</strong> {selectedTemplate.tasks.length} new task
                        {selectedTemplate.tasks.length !== 1 ? 's' : ''} will be {keepExistingTasks ? 'added to existing tasks' : 'replace all existing tasks'}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {error && <div className={styles.error}>{error}</div>}
            </>
          )}
        </div>

        <div className={styles.actions}>
          <button
            onClick={onClose}
            className={styles.cancelButton}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className={styles.applyButton}
            disabled={loading || !selectedTemplateId || fetchingTemplates}
          >
            {loading ? 'Applying...' : 'Apply Template'}
          </button>
        </div>
      </div>
    </div>
  );
}
