'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { ProjectFormData, User, Company } from '@/types/project';
import { useProjects } from '@/hooks/useProjects';
import ProjectForm from '@/components/Projects/ProjectForm/ProjectForm';
import styles from './ProjectRequest.module.scss';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface ProjectRequestProps {
  user: SupabaseUser;
  profile: Profile;
  selectedCompany: Company | null;
  onProjectCreated?: () => void;
}

const ProjectRequest: React.FC<ProjectRequestProps> = ({
  user,
  profile,
  selectedCompany,
  onProjectCreated,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { createProject, error, clearError } = useProjects();

  // Convert profile to User format expected by ProjectForm
  const currentUserProfile: User = {
    id: user.id,
    email: user.email || profile.email,
    profiles: {
      id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
    },
  };

  const handleSubmit = async (formData: ProjectFormData) => {
    try {
      await createProject(formData);
      handleCloseModal();
      // Refresh the projects list
      onProjectCreated?.();
    } catch (error) {
      // Error handling is done in the hook
      throw error;
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>Request New Project</h2>
          <p>
            Submit a project request
            {selectedCompany ? ` for ${selectedCompany.name}` : ''}.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className={styles.requestButton}
          disabled={!selectedCompany}
        >
          <Plus size={20} />
          Request Project
        </button>
      </div>

      {!selectedCompany && (
        <div className={styles.warning}>
          Please select a company from your dashboard to request a project.
        </div>
      )}

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={clearError}>×</button>
        </div>
      )}

      <ProjectForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        editingProject={null}
        users={[currentUserProfile]} // Only pass current user for non-admin
        companies={selectedCompany ? [selectedCompany] : []} // Only pass selected company
        currentUser={user}
        currentUserProfile={currentUserProfile}
        isAdmin={false}
        mode="request"
        userActiveCompany={selectedCompany}
      />
    </div>
  );
};

export default ProjectRequest;
