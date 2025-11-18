import React, { useState, useEffect } from 'react';
import { Modal, ModalTop, ModalMiddle, ModalBottom } from '@/components/Common/Modal/Modal';
import { ProjectTemplate } from '@/types/project';
import styles from './TemplateSelectorModal.module.scss';

interface TemplateSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (template: ProjectTemplate) => void;
}

export function TemplateSelectorModal({ isOpen, onClose, onSelectTemplate }: TemplateSelectorModalProps) {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/project-templates?is_active=true');
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

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (template.description && template.description.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = !filterType || template.project_type === filterType;
    return matchesSearch && matchesType;
  });

  const projectTypes = Array.from(new Set(templates.map((t) => t.project_type)));

  const handleSelectTemplate = (template: ProjectTemplate) => {
    onSelectTemplate(template);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className={styles.wideModal}>
      <ModalTop title="Create Project from Template" onClose={onClose} />

      <ModalMiddle className={styles.modalContent}>
        {/* Filters */}
        <div className={styles.filters}>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select
            className={styles.typeFilter}
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Types</option>
            {projectTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        {/* Template Grid */}
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No templates found</p>
            {searchQuery || filterType ? (
              <button
                className={styles.clearFiltersButton}
                onClick={() => {
                  setSearchQuery('');
                  setFilterType('');
                }}
              >
                Clear Filters
              </button>
            ) : null}
          </div>
        ) : (
          <div className={styles.templateGrid}>
            {filteredTemplates.map((template) => (
              <div key={template.id} className={styles.templateCard}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.templateName}>{template.name}</h3>
                  <div className={styles.templateMeta}>
                    <span className={styles.typeLabel}>{template.project_type}</span>
                    {template.project_subtype && (
                      <span className={styles.subtypeLabel}>{template.project_subtype}</span>
                    )}
                  </div>
                </div>

                {template.description && (
                  <p className={styles.templateDescription}>{template.description}</p>
                )}

                <div className={styles.cardFooter}>
                  <div className={styles.taskCount}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 2.5H13C13.2761 2.5 13.5 2.72386 13.5 3V13C13.5 13.2761 13.2761 13.5 13 13.5H3C2.72386 13.5 2.5 13.2761 2.5 13V3C2.5 2.72386 2.72386 2.5 3 2.5Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path d="M5 6H11M5 8.5H11M5 11H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    {template.tasks?.length || 0} tasks
                  </div>
                  <button
                    className={styles.selectButton}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    Select Template
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalMiddle>

      <ModalBottom className={styles.modalBottom}>
        <button type="button" className={styles.cancelButton} onClick={onClose}>
          Cancel
        </button>
      </ModalBottom>
    </Modal>
  );
}
