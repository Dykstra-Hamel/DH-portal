'use client';

import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Plus } from 'lucide-react';
import { ProjectTemplate } from '@/types/project';
import TemplateList from '@/components/ProjectTemplates/TemplateList/TemplateList';
import TemplateForm from '@/components/ProjectTemplates/TemplateForm/TemplateForm';
import styles from './TemplatesPage.module.scss';

interface TemplatesPageProps {
  user: User;
}

const TemplatesPage: React.FC<TemplatesPageProps> = ({ user }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | undefined>(undefined);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreate = () => {
    setEditingTemplate(undefined);
    setShowForm(true);
  };

  const handleEdit = (template: ProjectTemplate) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingTemplate(undefined);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingTemplate(undefined);
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Project Templates</h1>
          <p className={styles.subtitle}>
            Create and manage templates for common project types
          </p>
        </div>
        <button onClick={handleCreate} className={styles.createButton}>
          <Plus size={20} />
          Create Template
        </button>
      </div>

      <div className={styles.content}>
        <TemplateList onEdit={handleEdit} onRefresh={refreshKey} />
      </div>

      {showForm && (
        <TemplateForm
          template={editingTemplate}
          onClose={handleCloseForm}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
};

export default TemplatesPage;
