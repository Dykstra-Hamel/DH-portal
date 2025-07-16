'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { adminAPI } from '@/lib/api-client';
import { Project, ProjectFormData, User, Company, ProjectFilters as FilterValues } from '@/types/project';
import { useProjects } from '@/hooks/useProjects';
import ProjectForm from '@/components/Projects/ProjectForm/ProjectForm';
import ProjectsTable from '@/components/Projects/ProjectsTable/ProjectsTable';
import ProjectFilters from '@/components/Projects/ProjectFilters/ProjectFilters';
import styles from './ProjectsManager.module.scss';

interface ProjectsManagerProps {
  user: SupabaseUser;
}

const ProjectsManager: React.FC<ProjectsManagerProps> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [filters, setFilters] = useState<FilterValues>({
    status: '',
    priority: '',
    companyId: ''
  });

  const {
    projects,
    isLoading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    clearError
  } = useProjects();

  useEffect(() => {
    fetchData();
  }, [fetchProjects, filters]);

  const fetchData = async () => {
    try {
      const [usersData, companiesData] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getCompanies()
      ]);

      setUsers(usersData || []);
      setCompanies(companiesData || []);
      
      // Find current user's profile
      const currentProfile = usersData?.find((u: User) => u.id === user.id);
      setCurrentUserProfile(currentProfile || null);

      // Fetch projects with current filters
      await fetchProjects(filters);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleSubmit = async (formData: ProjectFormData) => {
    try {
      if (editingProject) {
        await updateProject(editingProject.id, formData);
      } else {
        await createProject(formData);
      }
      handleCloseModal();
    } catch (error) {
      // Error handling is done in the hook
      throw error;
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setIsModalOpen(true);
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await deleteProject(projectId);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleFiltersChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  if (isLoading && projects.length === 0) {
    return <div className={styles.loading}>Loading projects...</div>;
  }

  return (
    <div className={styles.manager}>
      <div className={styles.header}>
        <h2>Project Management</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className={styles.createButton}
        >
          <Plus size={20} />
          Create Project
        </button>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
          <button onClick={clearError}>×</button>
        </div>
      )}

      <ProjectFilters 
        filters={filters}
        onFiltersChange={handleFiltersChange}
        companies={companies}
      />

      {projects.length === 0 && !error && !isLoading ? (
        <div className={styles.emptyState}>
          <p>
            {(filters.status || filters.priority || filters.companyId) 
              ? 'No projects match your current filters. Try adjusting your filters or create a new project.'
              : 'No projects found. Create your first project to get started.'
            }
          </p>
        </div>
      ) : (
        <ProjectsTable
          projects={projects}
          onEdit={handleEdit}
          onDelete={handleDelete}
          showActions={true}
        />
      )}

      <ProjectForm
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        editingProject={editingProject}
        users={users}
        companies={companies}
        currentUser={user}
        currentUserProfile={currentUserProfile}
        isAdmin={true}
        mode="full"
      />
    </div>
  );
};

export default ProjectsManager;