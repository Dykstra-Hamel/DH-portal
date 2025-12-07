import React, { useState, useEffect } from 'react';
import { Modal, ModalTop, ModalMiddle, ModalBottom } from '@/components/Common/Modal/Modal';
import {
  Project,
  ProjectType,
  DUMMY_USERS,
  PROJECT_TAGS,
  TaskPriority,
  ProjectStatus,
} from '@/types/taskManagement';
import { ProjectTemplate } from '@/types/project';
import { useUser } from '@/hooks/useUser';
import { TagSelector } from '@/components/Common/TagSelector/TagSelector';
import styles from './ProjectModal.module.scss';

interface Company {
  id: string;
  name: string;
}

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Partial<Project>, template?: ProjectTemplate) => void;
  project?: Project;
}

export function ProjectModal({ isOpen, onClose, onSave, project }: ProjectModalProps) {
  const { user, profile } = useUser();

  const [formData, setFormData] = useState({
    name: '',
    type: 'new-client-onboarding' as ProjectType,
    client_id: '',
    assigned_to: '',
    status: 'active' as ProjectStatus,
    priority: 'medium' as TaskPriority,
    start_date: new Date().toISOString().split('T')[0],
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    completion_date: '',
    estimated_hours: '',
    actual_hours: '',
    budget_amount: '',
    description: '',
    tags: [] as string[],
  });

  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | undefined>();
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false);

  // Fetch templates when modal opens
  useEffect(() => {
    if (isOpen && !project) {
      fetchTemplates();
    }
  }, [isOpen, project]);

  // Fetch companies when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const response = await fetch('/api/admin/project-templates?is_active=true');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const fetchCompanies = async () => {
    setIsLoadingCompanies(true);
    try {
      const response = await fetch('/api/admin/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  useEffect(() => {
    if (project) {
      setFormData({
        name: project.name,
        type: project.type,
        client_id: project.client_id,
        assigned_to: project.assigned_to || '',
        status: project.status,
        priority: project.priority,
        start_date: project.start_date.split('T')[0],
        deadline: project.deadline.split('T')[0],
        completion_date: project.completion_date?.split('T')[0] || '',
        estimated_hours: project.estimated_hours?.toString() || '',
        actual_hours: project.actual_hours?.toString() || '',
        budget_amount: project.budget_amount?.toString() || '',
        description: project.description || '',
        tags: project.tags || [],
      });
    } else {
      // Reset form when creating new
      setFormData({
        name: '',
        type: 'new-client-onboarding',
        client_id: '',
        assigned_to: '',
        status: 'active',
        priority: 'medium',
        start_date: new Date().toISOString().split('T')[0],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        completion_date: '',
        estimated_hours: '',
        actual_hours: '',
        budget_amount: '',
        description: '',
        tags: [],
      });
    }
  }, [project, isOpen]);

  useEffect(() => {
    // Find template by ID stored in formData.type (template dropdown stores template ID)
    const template = templates.find(t => t.id === formData.type);
    setSelectedTemplate(template);
  }, [formData.type, templates]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const projectData: Partial<Project> = {
      name: formData.name,
      type: formData.type,
      client_id: formData.client_id,
      requested_by: project?.requested_by || user?.id || 'user-1',
      assigned_to: formData.assigned_to || undefined,
      status: formData.status,
      priority: formData.priority,
      start_date: new Date(formData.start_date).toISOString(),
      deadline: new Date(formData.deadline).toISOString(),
      completion_date: formData.completion_date ? new Date(formData.completion_date).toISOString() : undefined,
      estimated_hours: formData.estimated_hours ? parseFloat(formData.estimated_hours) : undefined,
      actual_hours: formData.actual_hours ? parseFloat(formData.actual_hours) : undefined,
      budget_amount: formData.budget_amount ? parseFloat(formData.budget_amount) : undefined,
      description: formData.description || undefined,
      tags: formData.tags,
      progress: project?.progress || 0,
      phase: project?.phase || 'coming-up',
    };

    if (project) {
      projectData.id = project.id;
    }

    onSave(projectData, !project ? selectedTemplate : undefined);
  };

  const handleCancel = () => {
    onClose();
  };

  const requestedByUser = project ? DUMMY_USERS.find(u => u.id === project.requested_by) : undefined;
  const currentUserDisplay = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email : 'Current User';

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={styles.wideModal}>
      <form onSubmit={handleSubmit} className={styles.modalForm}>
        <ModalTop
          title={project ? 'Edit Project' : 'Create New Project'}
          onClose={onClose}
        />

        <ModalMiddle className={styles.modalContent}>
          {/* Section 1: Basic Information */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Basic Information</h3>

            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                Project Name <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                id="name"
                className={styles.input}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., BugBusters Spring Campaign"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="type" className={styles.label}>
                Project Template <span className={styles.required}>*</span>
              </label>
              <select
                id="type"
                className={styles.select}
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ProjectType })}
                disabled={!!project || isLoadingTemplates}
                required
              >
                <option value="">
                  {isLoadingTemplates ? 'Loading templates...' : 'Select a template'}
                </option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.project_type})
                  </option>
                ))}
              </select>
              {selectedTemplate && !project && (
                <div className={styles.templateDescription}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M6.3 9.7H7.7V6.3H6.3V9.7ZM7 5.6C7.21667 5.6 7.39583 5.52917 7.5375 5.3875C7.67917 5.24583 7.75 5.06667 7.75 4.85C7.75 4.63333 7.67917 4.45417 7.5375 4.3125C7.39583 4.17083 7.21667 4.1 7 4.1C6.78333 4.1 6.60417 4.17083 6.4625 4.3125C6.32083 4.45417 6.25 4.63333 6.25 4.85C6.25 5.06667 6.32083 5.24583 6.4625 5.3875C6.60417 5.52917 6.78333 5.6 7 5.6ZM7 13C6.12778 13 5.30833 12.8347 4.54167 12.5042C3.775 12.1736 3.10833 11.7264 2.54167 11.1625C1.975 10.5986 1.52778 9.93333 1.2 9.16667C0.872222 8.4 0.708333 7.58056 0.708333 6.70833C0.708333 5.83611 0.873611 5.01667 1.20417 4.25C1.53472 3.48333 1.98194 2.81667 2.54583 2.25C3.10972 1.68333 3.775 1.23611 4.54167 0.908333C5.30833 0.580556 6.12778 0.416667 7 0.416667C7.87222 0.416667 8.69167 0.581944 9.45833 0.9125C10.225 1.24306 10.8917 1.69028 11.4583 2.25417C12.025 2.81806 12.4722 3.48333 12.8 4.25C13.1278 5.01667 13.2917 5.83611 13.2917 6.70833C13.2917 7.58056 13.1264 8.4 12.7958 9.16667C12.4653 9.93333 12.0181 10.6 11.4542 11.1667C10.8903 11.7333 10.225 12.1806 9.45833 12.5083C8.69167 12.8361 7.87222 13 7 13Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>{selectedTemplate.description}</span>
                </div>
              )}
              {selectedTemplate && selectedTemplate.tasks && selectedTemplate.tasks.length > 0 && !project && (
                <div className={styles.templateTasks}>
                  <div className={styles.templateTasksHeader}>
                    This project will automatically create {selectedTemplate.tasks.length} tasks:
                  </div>
                  <ul className={styles.templateTasksList}>
                    {selectedTemplate.tasks.map((task) => (
                      <li key={task.id}>{task.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="client_id" className={styles.label}>
                Company / Client <span className={styles.required}>*</span>
              </label>
              <select
                id="client_id"
                className={styles.select}
                value={formData.client_id}
                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                disabled={isLoadingCompanies}
                required
              >
                <option value="">
                  {isLoadingCompanies ? 'Loading companies...' : 'Select a company'}
                </option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.label}>
                Description
              </label>
              <textarea
                id="description"
                className={styles.textarea}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the project goals and deliverables..."
                rows={4}
              />
            </div>
          </div>

          {/* Section 2: Team & Assignment */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Team & Assignment</h3>

            <div className={styles.formGroup}>
              <label className={styles.label}>Requested By</label>
              <input
                type="text"
                className={styles.input}
                value={requestedByUser ? `${requestedByUser.first_name} ${requestedByUser.last_name}` : currentUserDisplay}
                disabled
                readOnly
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="assigned_to" className={styles.label}>
                  Assigned To
                </label>
                <select
                  id="assigned_to"
                  className={styles.select}
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                >
                  <option value="">Unassigned</option>
                  {DUMMY_USERS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.first_name} {u.last_name}
                    </option>
                  ))}
                </select>
              </div>

              {project && (
                <div className={styles.formGroup}>
                  <label htmlFor="status" className={styles.label}>
                    Status <span className={styles.required}>*</span>
                  </label>
                  <select
                    id="status"
                    className={styles.select}
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                    required
                  >
                    <option value="planning">Planning</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="priority" className={styles.label}>
                Priority <span className={styles.required}>*</span>
              </label>
              <select
                id="priority"
                className={styles.select}
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          {/* Section 3: Timeline & Effort */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Timeline & Effort</h3>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="start_date" className={styles.label}>
                  Start Date <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  id="start_date"
                  className={styles.input}
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="deadline" className={styles.label}>
                  Due Date <span className={styles.required}>*</span>
                </label>
                <input
                  type="date"
                  id="deadline"
                  className={styles.input}
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  min={formData.start_date}
                  required
                />
              </div>
            </div>

            {formData.status === 'completed' && (
              <div className={styles.formGroup}>
                <label htmlFor="completion_date" className={styles.label}>
                  Completion Date
                </label>
                <input
                  type="date"
                  id="completion_date"
                  className={styles.input}
                  value={formData.completion_date}
                  onChange={(e) => setFormData({ ...formData, completion_date: e.target.value })}
                />
              </div>
            )}

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="estimated_hours" className={styles.label}>
                  Estimated Hours
                </label>
                <input
                  type="number"
                  id="estimated_hours"
                  className={styles.input}
                  value={formData.estimated_hours}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="0.5"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="actual_hours" className={styles.label}>
                  Actual Hours
                </label>
                <input
                  type="number"
                  id="actual_hours"
                  className={styles.input}
                  value={formData.actual_hours}
                  onChange={(e) => setFormData({ ...formData, actual_hours: e.target.value })}
                  placeholder="0"
                  min="0"
                  step="0.5"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Budget & Tags */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Budget & Tags</h3>

            <div className={styles.formGroup}>
              <label htmlFor="budget_amount" className={styles.label}>
                Budget Amount (USD)
              </label>
              <input
                type="number"
                id="budget_amount"
                className={styles.input}
                value={formData.budget_amount}
                onChange={(e) => setFormData({ ...formData, budget_amount: e.target.value })}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <TagSelector
              availableTags={PROJECT_TAGS}
              selectedTags={formData.tags}
              onChange={(tags) => setFormData({ ...formData, tags })}
              label="Project Tags"
            />
          </div>
        </ModalMiddle>

        <ModalBottom className={styles.modalBottom}>
          <button type="button" className={styles.secondaryButton} onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit" className={styles.primaryButton}>
            {project ? 'Save Changes' : 'Create Project'}
          </button>
        </ModalBottom>
      </form>
    </Modal>
  );
}
