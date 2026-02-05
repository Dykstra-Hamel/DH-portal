'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { ProjectDepartment } from '@/types/project';
import DepartmentFormModal from './DepartmentFormModal';
import DepartmentDeleteModal from './DepartmentDeleteModal';
import styles from './DepartmentSettings.module.scss';

export default function InternalDepartmentSettings() {
  const [departments, setDepartments] = useState<ProjectDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedDepartment, setSelectedDepartment] = useState<ProjectDepartment | null>(null);
  const [projectsForDepartment, setProjectsForDepartment] = useState<Array<{ id: string; name: string; shortcode?: string }>>([]);
  const [projectCount, setProjectCount] = useState(0);

  // Fetch departments
  const fetchDepartments = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/admin/project-departments');

      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }

      const data = await response.json();
      setDepartments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load departments');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // Create new department
  const handleCreate = async (departmentData: Partial<ProjectDepartment>) => {
    const response = await fetch('/api/admin/project-departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(departmentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create department');
    }

    await fetchDepartments();
  };

  // Update existing department
  const handleUpdate = async (departmentData: Partial<ProjectDepartment>) => {
    if (!selectedDepartment) return;

    const response = await fetch(`/api/admin/project-departments/${selectedDepartment.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(departmentData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update department');
    }

    await fetchDepartments();
  };

  // Delete department
  const handleDelete = async () => {
    if (!selectedDepartment) return;

    const response = await fetch(`/api/admin/project-departments/${selectedDepartment.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to delete department');
    }

    await fetchDepartments();
  };

  // Open edit modal
  const handleEditClick = (department: ProjectDepartment) => {
    setSelectedDepartment(department);
    setFormMode('edit');
    setIsFormModalOpen(true);
  };

  // Open delete modal
  const handleDeleteClick = async (department: ProjectDepartment) => {
    setSelectedDepartment(department);

    // Check if department has projects
    try {
      const response = await fetch(`/api/admin/project-departments/${department.id}/projects`);
      if (response.ok) {
        const data = await response.json();
        setProjectsForDepartment(data.projects || []);
        setProjectCount(data.count || 0);
      } else {
        setProjectsForDepartment([]);
        setProjectCount(0);
      }
    } catch (err) {
      console.error('Failed to fetch projects for department:', err);
      setProjectsForDepartment([]);
      setProjectCount(0);
    }

    setIsDeleteModalOpen(true);
  };

  // Drag and drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggingIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDraggingIndex(null);

    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);

    if (dragIndex === dropIndex) return;

    // Reorder departments locally
    const reorderedDepartments = [...departments];
    const [removed] = reorderedDepartments.splice(dragIndex, 1);
    reorderedDepartments.splice(dropIndex, 0, removed);

    // Update sort_order values
    const updatedDepartments = reorderedDepartments.map((dept, index) => ({
      ...dept,
      sort_order: index + 1,
    }));

    setDepartments(updatedDepartments);

    // Send reorder request to backend
    try {
      const response = await fetch('/api/admin/project-departments/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          departments: updatedDepartments.map((dept) => ({
            id: dept.id,
            sort_order: dept.sort_order,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder departments');
      }
    } catch (err) {
      console.error('Failed to reorder departments:', err);
      // Revert on error
      await fetchDepartments();
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading departments...</div>;
  }

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Project Departments</h2>
          <button
            className={styles.addButton}
            onClick={() => {
              setSelectedDepartment(null);
              setFormMode('create');
              setIsFormModalOpen(true);
            }}
          >
            <Plus size={16} />
            Add Department
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {departments.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>🏢</div>
            <p className={styles.emptyStateText}>No departments yet</p>
            <p className={styles.emptyStateSubtext}>
              Create your first project department to get started
            </p>
          </div>
        ) : (
          <div className={styles.departmentsList}>
            {departments.map((department, index) => (
              <div
                key={department.id}
                className={`${styles.departmentCard} ${draggingIndex === index ? styles.dragging : ''}`}
                draggable={true}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={() => setDraggingIndex(null)}
              >
                <div
                  className={styles.dragHandle}
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <GripVertical />
                </div>

                <div className={styles.departmentInfo}>
                  <div className={styles.departmentDetails}>
                    <h3 className={styles.departmentName}>
                      {department.icon && <span className={styles.icon}>{department.icon}</span>}
                      {department.name}
                    </h3>
                  </div>

                  {department.is_system_default && (
                    <span className={styles.systemBadge}>System</span>
                  )}
                </div>

                <div className={styles.departmentActions}>
                  <button
                    className={styles.iconButton}
                    onClick={() => handleEditClick(department)}
                    title="Edit department"
                  >
                    <Edit2 />
                  </button>
                  <button
                    className={styles.iconButton}
                    onClick={() => handleDeleteClick(department)}
                    title="Delete department"
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <DepartmentFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={formMode === 'create' ? handleCreate : handleUpdate}
        department={selectedDepartment}
        mode={formMode}
      />

      <DepartmentDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDelete}
        department={selectedDepartment}
        projectsUsingDepartment={projectsForDepartment}
        projectCount={projectCount}
      />
    </div>
  );
}
