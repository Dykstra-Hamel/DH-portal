'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import styles from './PestManager.module.scss';

interface PestCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
  pest_count?: number;
}

interface PestType {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string;
  icon_svg: string | null;
  widget_background_image: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PestFormData {
  name: string;
  slug: string;
  description: string;
  category_id: string;
  icon_svg: string;
  widget_background_image: string;
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  display_order: number;
}

export default function PestManager() {
  const [activeTab, setActiveTab] = useState<'pests' | 'categories'>('pests');
  const [pests, setPests] = useState<PestType[]>([]);
  const [categories, setCategories] = useState<PestCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingPest, setEditingPest] = useState<PestType | null>(null);
  const [editingCategory, setEditingCategory] = useState<PestCategory | null>(null);
  const [formData, setFormData] = useState<PestFormData>({
    name: '',
    slug: '',
    description: '',
    category_id: '',
    icon_svg: '',
    widget_background_image: ''
  });
  const [categoryFormData, setCategoryFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    display_order: 0
  });

  useEffect(() => {
    fetchPests();
    fetchCategories();
  }, []);

  const fetchPests = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/pest-types');
      if (!response.ok) {
        throw new Error('Failed to fetch pest types');
      }
      const result = await response.json();
      setPests(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pest types');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories?include_usage=true');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const result = await response.json();
      setCategories(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    }
  };

  const handleAdd = () => {
    setEditingPest(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      category_id: categories.length > 0 ? categories[0].id : '',
      icon_svg: '',
      widget_background_image: ''
    });
    setShowModal(true);
  };

  const handleAddCategory = () => {
    setEditingCategory(null);
    setCategoryFormData({
      name: '',
      slug: '',
      description: '',
      display_order: categories.length
    });
    setShowCategoryModal(true);
  };

  const handleEdit = (pest: PestType) => {
    setEditingPest(pest);
    setFormData({
      name: pest.name,
      slug: pest.slug,
      description: pest.description || '',
      category_id: pest.category_id,
      icon_svg: pest.icon_svg || '',
      widget_background_image: pest.widget_background_image || ''
    });
    setShowModal(true);
  };

  const handleEditCategory = (category: PestCategory) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      display_order: category.display_order
    });
    setShowCategoryModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const url = editingPest 
        ? `/api/admin/pest-types`
        : `/api/admin/pest-types`;
      
      const method = editingPest ? 'PUT' : 'POST';
      
      const payload = editingPest 
        ? { ...formData, id: editingPest.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save pest type');
      }

      setSuccess(editingPest ? 'Pest type updated successfully' : 'Pest type created successfully');
      setShowModal(false);
      fetchPests();
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save pest type');
    }
  };

  const handleToggleActive = async (pest: PestType) => {
    try {
      setError(null);
      const response = await fetch('/api/admin/pest-types', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: pest.id,
          name: pest.name,
          slug: pest.slug,
          description: pest.description,
          category_id: pest.category_id,
          icon_svg: pest.icon_svg,
          is_active: !pest.is_active
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle pest type status');
      }

      setSuccess(`Pest type ${!pest.is_active ? 'activated' : 'deactivated'} successfully`);
      fetchPests();
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle pest type status');
    }
  };

  const handleDelete = async (pest: PestType) => {
    if (!confirm(`Are you sure you want to delete "${pest.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/admin/pest-types?id=${pest.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete pest type');
      }

      setSuccess('Pest type deleted successfully');
      fetchPests();
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete pest type');
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }));
  };

  const handleCategoryNameChange = (name: string) => {
    setCategoryFormData(prev => ({
      ...prev,
      name,
      slug: prev.slug || generateSlug(name)
    }));
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const url = '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      
      const payload = editingCategory 
        ? { ...categoryFormData, id: editingCategory.id }
        : categoryFormData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save category');
      }

      setSuccess(editingCategory ? 'Category updated successfully' : 'Category created successfully');
      setShowCategoryModal(false);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save category');
    }
  };

  const handleToggleCategoryActive = async (category: PestCategory) => {
    try {
      setError(null);
      const response = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: category.id,
          name: category.name,
          slug: category.slug,
          description: category.description,
          display_order: category.display_order,
          is_active: !category.is_active
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle category status');
      }

      setSuccess(`Category ${!category.is_active ? 'activated' : 'deactivated'} successfully`);
      fetchCategories();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle category status');
    }
  };

  const handleDeleteCategory = async (category: PestCategory) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"? This will affect any pest types using this category.`)) {
      return;
    }

    try {
      setError(null);
      const response = await fetch(`/api/admin/categories?id=${category.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete category');
      }

      setSuccess('Category deleted successfully');
      fetchCategories();
      fetchPests(); // Refresh pests in case some were affected
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  };

  // File upload utilities
  const createAssetPath = (
    pestName: string,
    category: string,
    fileName: string
  ): string => {
    const cleanPestName = pestName
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();

    const cleanFileName = fileName
      .split('.')
      .slice(0, -1)
      .join('.')
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .toLowerCase();

    const fileExt = fileName.split('.').pop()?.toLowerCase() || '';
    const timestamp = Date.now();
    const finalFileName = `${cleanFileName}_${timestamp}.${fileExt}`;

    return `pest-types/${cleanPestName}/${category}/${finalFileName}`;
  };

  const uploadFile = async (
    file: File,
    bucket: string,
    category: string,
    pestName: string
  ): Promise<string | null> => {
    try {
      const supabase = createClient();
      const filePath = createAssetPath(pestName, category, file.name);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return null;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const deleteFileFromStorage = async (fileUrl: string): Promise<boolean> => {
    try {
      const supabase = createClient();
      const urlParts = fileUrl.split('/storage/v1/object/public/brand-assets/');
      if (urlParts.length !== 2) {
        console.error('Invalid file URL format:', fileUrl);
        return false;
      }

      const filePath = urlParts[1];
      const { error } = await supabase.storage
        .from('brand-assets')
        .remove([filePath]);

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  };

  // Widget Background Image Upload Handler
  const handleWidgetBackgroundUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // If there's an existing image, delete it first
      if (formData.widget_background_image) {
        await deleteFileFromStorage(formData.widget_background_image);
      }

      const url = await uploadFile(file, 'brand-assets', 'widget-backgrounds', formData.name || 'pest');
      if (url) {
        setFormData(prev => ({ ...prev, widget_background_image: url }));
        // Clear the input so the same file can be selected again if needed
        event.target.value = '';
        setSuccess('Background image uploaded successfully');
      } else {
        setError('Failed to upload background image');
      }
    } catch (error) {
      console.error('Error uploading background image:', error);
      setError('Failed to upload background image');
    }
  };

  const removeWidgetBackground = async () => {
    if (!formData.widget_background_image) return;

    if (
      !confirm(
        'Are you sure you want to delete this widget background image? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const deleted = await deleteFileFromStorage(formData.widget_background_image);

      if (deleted) {
        setFormData(prev => ({ ...prev, widget_background_image: '' }));
        setSuccess('Background image deleted successfully');
      } else {
        setError('Failed to delete background image');
      }
    } catch (error) {
      console.error('Error deleting background image:', error);
      setError('Failed to delete background image');
    }
  };

  const getCategoryName = (pest: PestType) => {
    const category = categories.find(c => c.id === pest.category_id);
    return category?.name || 'Unknown Category';
  };

  if (loading) {
    return <div className={styles.loading}>Loading pest types...</div>;
  }

  return (
    <div className={styles.pestManager}>
      <div className={styles.header}>
        <h2>Pest Management</h2>
        <p>Manage pest categories and types that companies can select from</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.tabs}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'pests' ? styles.active : ''}`}
          onClick={() => setActiveTab('pests')}
        >
          Pest Types ({pests.length})
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'categories' ? styles.active : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categories ({categories.length})
        </button>
      </div>

      {activeTab === 'pests' && (
        <>
          <div className={styles.actions}>
            <button className={styles.addButton} onClick={handleAdd}>
              Add Pest Type
            </button>
          </div>
        </>
      )}

      {activeTab === 'categories' && (
        <>
          <div className={styles.actions}>
            <button className={styles.addButton} onClick={handleAddCategory}>
              Add Category
            </button>
          </div>
        </>
      )}

      {activeTab === 'pests' && (
        <div className={styles.pestList}>
          {pests.map((pest) => (
          <div 
            key={pest.id} 
            className={`${styles.pestItem} ${!pest.is_active ? styles.inactive : ''}`}
          >
            <div className={styles.pestInfo}>
              <div className={styles.pestIcon}>
                <div dangerouslySetInnerHTML={{ __html: pest.icon_svg || '' }} />
              </div>
              <div className={styles.pestDetails}>
                <div className={styles.pestName}>{pest.name}</div>
                <div className={styles.pestMeta}>
                  <span className={styles.category}>
                    {getCategoryName(pest)}
                  </span>
                  <span className={styles.slug}>{pest.slug}</span>
                  <span>Status: {pest.is_active ? 'Active' : 'Inactive'}</span>
                </div>
                {pest.description && (
                  <div className={styles.pestDescription}>
                    {pest.description}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.pestActions}>
              <button
                className={`${styles.actionButton} ${styles.editButton}`}
                onClick={() => handleEdit(pest)}
              >
                Edit
              </button>
              <button
                className={`${styles.actionButton} ${styles.toggleButton} ${!pest.is_active ? styles.activate : ''}`}
                onClick={() => handleToggleActive(pest)}
              >
                {pest.is_active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                className={`${styles.actionButton} ${styles.deleteButton}`}
                onClick={() => handleDelete(pest)}
              >
                Delete
              </button>
            </div>
          </div>
          ))}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className={styles.pestList}>
          {categories.map((category) => (
            <div 
              key={category.id} 
              className={`${styles.pestItem} ${!category.is_active ? styles.inactive : ''}`}
            >
              <div className={styles.pestInfo}>
                <div className={styles.pestIcon}>
                  📁
                </div>
                <div className={styles.pestDetails}>
                  <div className={styles.pestName}>{category.name}</div>
                  <div className={styles.pestMeta}>
                    <span className={styles.slug}>{category.slug}</span>
                    <span>Order: {category.display_order}</span>
                    <span>Status: {category.is_active ? 'Active' : 'Inactive'}</span>
                    {category.pest_count !== undefined && (
                      <span>Pest Types: {category.pest_count}</span>
                    )}
                  </div>
                  {category.description && (
                    <div className={styles.pestDescription}>
                      {category.description}
                    </div>
                  )}
                </div>
              </div>
              <div className={styles.pestActions}>
                <button
                  className={`${styles.actionButton} ${styles.editButton}`}
                  onClick={() => handleEditCategory(category)}
                >
                  Edit
                </button>
                <button
                  className={`${styles.actionButton} ${styles.toggleButton} ${!category.is_active ? styles.activate : ''}`}
                  onClick={() => handleToggleCategoryActive(category)}
                >
                  {category.is_active ? 'Deactivate' : 'Activate'}
                </button>
                <button
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  onClick={() => handleDeleteCategory(category)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className={styles.modal} onClick={(e) => {
          if (e.target === e.currentTarget) setShowModal(false);
        }}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingPest ? 'Edit Pest Type' : 'Add Pest Type'}</h3>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Name *</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="slug">Slug *</label>
                <input
                  id="slug"
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="category_id">Category *</label>
                <select
                  id="category_id"
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    category_id: e.target.value
                  }))}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.filter(c => c.is_active).map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="icon_svg">Icon SVG</label>
                <input
                  id="icon_svg"
                  type="text"
                  value={formData.icon_svg}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon_svg: e.target.value }))}
                  placeholder="<svg>...</svg>"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this pest type..."
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="widget_background_image">Widget Background Image</label>
                <p className={styles.fieldNote}>
                  Upload a background image that will be displayed in the widget for this pest type.
                </p>
                <input
                  id="widget_background_image"
                  type="file"
                  accept="image/*"
                  onChange={handleWidgetBackgroundUpload}
                  className={styles.fileInput}
                />
                {formData.widget_background_image && (
                  <div className={styles.imagePreview}>
                    <Image
                      src={formData.widget_background_image}
                      alt="Widget background preview"
                      width={300}
                      height={200}
                      style={{
                        maxWidth: '300px',
                        maxHeight: '200px',
                        objectFit: 'contain',
                      }}
                    />
                    <button
                      type="button"
                      onClick={removeWidgetBackground}
                      className={styles.removeImageButton}
                    >
                      Remove Background Image
                    </button>
                  </div>
                )}
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={`${styles.button} ${styles.primary}`}>
                  {editingPest ? 'Update' : 'Create'}
                </button>
                <button 
                  type="button" 
                  className={`${styles.button} ${styles.secondary}`}
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCategoryModal && (
        <div className={styles.modal} onClick={(e) => {
          if (e.target === e.currentTarget) setShowCategoryModal(false);
        }}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>{editingCategory ? 'Edit Category' : 'Add Category'}</h3>
            </div>
            <form className={styles.form} onSubmit={handleCategorySubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="cat_name">Name *</label>
                <input
                  id="cat_name"
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => handleCategoryNameChange(e.target.value)}
                  required
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="cat_slug">Slug *</label>
                <input
                  id="cat_slug"
                  type="text"
                  value={categoryFormData.slug}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, slug: e.target.value }))}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="cat_display_order">Display Order</label>
                <input
                  id="cat_display_order"
                  type="number"
                  value={categoryFormData.display_order}
                  onChange={(e) => setCategoryFormData(prev => ({ 
                    ...prev, 
                    display_order: parseInt(e.target.value) || 0 
                  }))}
                  min="0"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="cat_description">Description</label>
                <textarea
                  id="cat_description"
                  value={categoryFormData.description}
                  onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this category..."
                />
              </div>

              <div className={styles.modalActions}>
                <button type="submit" className={`${styles.button} ${styles.primary}`}>
                  {editingCategory ? 'Update' : 'Create'}
                </button>
                <button 
                  type="button" 
                  className={`${styles.button} ${styles.secondary}`}
                  onClick={() => setShowCategoryModal(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}