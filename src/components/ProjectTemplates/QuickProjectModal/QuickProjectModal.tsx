import React, { useState } from 'react';
import { Modal, ModalTop, ModalMiddle, ModalBottom } from '@/components/Common/Modal/Modal';
import { ProjectTemplate, Company } from '@/types/project';
import styles from './QuickProjectModal.module.scss';

interface QuickProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: QuickProjectData) => Promise<void>;
  template: ProjectTemplate;
  companies: Company[];
}

export interface QuickProjectData {
  template_id: string;
  project_name: string;
  company_id: string;
  start_date: string;
  due_date?: string;
}

export function QuickProjectModal({ isOpen, onClose, onSubmit, template, companies }: QuickProjectModalProps) {
  const [formData, setFormData] = useState<QuickProjectData>({
    template_id: template.id,
    project_name: '',
    company_id: '',
    start_date: new Date().toISOString().split('T')[0],
    due_date: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        template_id: template.id,
        project_name: '',
        company_id: '',
        start_date: new Date().toISOString().split('T')[0],
        due_date: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setError(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={styles.modal}>
      <form onSubmit={handleSubmit}>
        <ModalTop
          title={`Create Project from "${template.name}"`}
          onClose={onClose}
        />

        <ModalMiddle className={styles.modalContent}>
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}

          <div className={styles.templateInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Template:</span>
              <span className={styles.infoValue}>{template.name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Type:</span>
              <span className={styles.infoValue}>
                {template.project_type}
                {template.project_subtype && ` - ${template.project_subtype}`}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Tasks:</span>
              <span className={styles.infoValue}>{template.tasks?.length || 0} tasks will be created</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="project_name" className={styles.label}>
              Project Name <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="project_name"
              className={styles.input}
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              placeholder="Enter a name for this project"
              required
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="company_id" className={styles.label}>
              Company <span className={styles.required}>*</span>
            </label>
            <select
              id="company_id"
              className={styles.select}
              value={formData.company_id}
              onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
              required
            >
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </div>

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
              <small className={styles.helpText}>
                Task due dates will be calculated from this date
              </small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="due_date" className={styles.label}>
                Project Due Date (Optional)
              </label>
              <input
                type="date"
                id="due_date"
                className={styles.input}
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                min={formData.start_date}
              />
            </div>
          </div>
        </ModalMiddle>

        <ModalBottom className={styles.modalBottom}>
          <div className={styles.rightButtons}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.primaryButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </ModalBottom>
      </form>
    </Modal>
  );
}
