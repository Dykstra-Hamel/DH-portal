'use client';

import { useState, useCallback } from 'react';
import { adminAPI } from '@/lib/api-client';
import { Project, ProjectFormData, ProjectFilters } from '@/types/project';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProjects = useCallback(async (filters: ProjectFilters = { status: '', priority: '', companyId: '' }) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await adminAPI.getProjects(filters);
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Failed to load projects. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createProject = useCallback(async (projectData: ProjectFormData) => {
    try {
      const processedData = {
        ...projectData,
        estimated_hours: projectData.estimated_hours ? parseFloat(projectData.estimated_hours) : null,
        actual_hours: projectData.actual_hours ? parseFloat(projectData.actual_hours) : null,
        budget_amount: projectData.budget_amount ? parseFloat(projectData.budget_amount) : null,
        tags: projectData.tags ? projectData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : null,
        start_date: projectData.start_date || null,
        completion_date: projectData.completion_date || null
      };

      const savedProject = await adminAPI.createProject(processedData);
      setProjects(prevProjects => [savedProject, ...prevProjects]);
      return savedProject;
    } catch (error) {
      console.error('Error creating project:', error);
      throw new Error('Failed to create project');
    }
  }, []);

  const updateProject = useCallback(async (projectId: string, projectData: ProjectFormData) => {
    try {
      const processedData = {
        ...projectData,
        estimated_hours: projectData.estimated_hours ? parseFloat(projectData.estimated_hours) : null,
        actual_hours: projectData.actual_hours ? parseFloat(projectData.actual_hours) : null,
        budget_amount: projectData.budget_amount ? parseFloat(projectData.budget_amount) : null,
        tags: projectData.tags ? projectData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : null,
        start_date: projectData.start_date || null,
        completion_date: projectData.completion_date || null
      };

      const updatedProject = await adminAPI.updateProject(projectId, processedData);
      setProjects(prevProjects => 
        prevProjects.map(p => p.id === projectId ? updatedProject : p)
      );
      return updatedProject;
    } catch (error) {
      console.error('Error updating project:', error);
      throw new Error('Failed to update project');
    }
  }, []);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      await adminAPI.deleteProject(projectId);
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
      throw new Error('Failed to delete project');
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    projects,
    isLoading,
    error,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    clearError
  };
};