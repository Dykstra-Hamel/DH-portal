'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { ProjectCategory } from '@/types/project';
import CategoryFormModal from './CategoryFormModal';
import CategoryDeleteModal from './CategoryDeleteModal';
import CategoryBadge from './CategoryBadge';
import styles from './CategorySettings.module.scss';

export default function CompanyCategorySettings() {
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | null>(null);
  const [projectsForCategory, setProjectsForCategory] = useState<Array<{ id: string; name: string }>>([]);

  // Fetch categories
  const fetchCategories = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/project-categories');

      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const data = await response.json();
      setCategories(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Create new category
  const handleCreate = async (categoryData: Partial<ProjectCategory>) => {
    const response = await fetch('/api/project-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create category');
    }

    await fetchCategories();
  };

  // Update existing category
  const handleUpdate = async (categoryData: Partial<ProjectCategory>) => {
    if (!selectedCategory) return;

    const response = await fetch(`/api/project-categories/${selectedCategory.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(categoryData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update category');
    }

    await fetchCategories();
  };

  // Delete category
  const handleDelete = async () => {
    if (!selectedCategory) return;

    const response = await fetch(`/api/project-categories/${selectedCategory.id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to delete category');
    }

    await fetchCategories();
  };

  // Open edit modal
  const handleEditClick = (category: ProjectCategory) => {
    setSelectedCategory(category);
    setFormMode('edit');
    setIsFormModalOpen(true);
  };

  // Open delete modal
  const handleDeleteClick = async (category: ProjectCategory) => {
    setSelectedCategory(category);

    // For company categories, we'd need an endpoint to check project usage
    // For now, set empty array - can be implemented later
    setProjectsForCategory([]);

    setIsDeleteModalOpen(true);
  };

  // Drag and drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);

    if (dragIndex === dropIndex) return;

    // Reorder categories locally
    const reorderedCategories = [...categories];
    const [removed] = reorderedCategories.splice(dragIndex, 1);
    reorderedCategories.splice(dropIndex, 0, removed);

    // Update sort_order values
    const updatedCategories = reorderedCategories.map((cat, index) => ({
      ...cat,
      sort_order: index + 1,
    }));

    setCategories(updatedCategories);

    // Send reorder request to backend
    try {
      const response = await fetch('/api/project-categories/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categories: updatedCategories.map((cat) => ({
            id: cat.id,
            sort_order: cat.sort_order,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder categories');
      }
    } catch (err) {
      console.error('Failed to reorder categories:', err);
      // Revert on error
      await fetchCategories();
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading categories...</div>;
  }

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Project Categories</h2>
          <button
            className={styles.addButton}
            onClick={() => {
              setSelectedCategory(null);
              setFormMode('create');
              setIsFormModalOpen(true);
            }}
          >
            <Plus size={16} />
            Add Category
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {categories.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>📁</div>
            <p className={styles.emptyStateText}>No categories yet</p>
            <p className={styles.emptyStateSubtext}>
              Create your first project category to organize your projects
            </p>
          </div>
        ) : (
          <div className={styles.categoriesList}>
            {categories.map((category, index) => (
              <div
                key={category.id}
                className={styles.categoryCard}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                <div className={styles.dragHandle}>
                  <GripVertical />
                </div>

                <div className={styles.categoryInfo}>
                  <CategoryBadge category={category} showIcon />

                  <div className={styles.categoryDetails}>
                    <h3 className={styles.categoryName}>{category.name}</h3>
                    {category.description && (
                      <p className={styles.categoryDescription}>{category.description}</p>
                    )}
                  </div>
                </div>

                <div className={styles.categoryActions}>
                  <button
                    className={styles.iconButton}
                    onClick={() => handleEditClick(category)}
                    title="Edit category"
                  >
                    <Edit2 />
                  </button>
                  <button
                    className={styles.iconButton}
                    onClick={() => handleDeleteClick(category)}
                    title="Delete category"
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
      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSave={formMode === 'create' ? handleCreate : handleUpdate}
        category={selectedCategory}
        mode={formMode}
      />

      <CategoryDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDelete={handleDelete}
        category={selectedCategory}
        projectsUsingCategory={projectsForCategory}
        isInternal={false}
      />
    </div>
  );
}
