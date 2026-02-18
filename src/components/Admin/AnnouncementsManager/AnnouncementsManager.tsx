'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Trash2, Megaphone } from 'lucide-react';
import styles from './AnnouncementsManager.module.scss';

interface Announcement {
  id: string;
  title: string;
  content: string;
  published_at: string;
  expires_at: string | null;
  priority: number;
  is_active: boolean;
  published_by_name?: string;
}

interface AnnouncementsManagerProps {
  companyId: string;
}

export default function AnnouncementsManager({ companyId }: AnnouncementsManagerProps) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    expires_at: '',
    priority: 0,
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/companies/${companyId}/announcements?showAll=true`);
      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }

      const data = await response.json();
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching announcements';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleCreateNew = () => {
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      expires_at: '',
      priority: 0,
      is_active: true,
    });
    setShowForm(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      expires_at: announcement.expires_at
        ? new Date(announcement.expires_at).toISOString().slice(0, 16)
        : '',
      priority: announcement.priority,
      is_active: announcement.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (announcement: Announcement) => {
    const confirmed = confirm(
      `Are you sure you want to delete "${announcement.title}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/companies/${companyId}/announcements/${announcement.id}`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete announcement');
      }

      setSuccess('Announcement deleted successfully');
      fetchAnnouncements();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while deleting the announcement';
      setError(errorMessage);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Title and content are required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payload = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        expires_at: formData.expires_at || null,
        priority: formData.priority,
        is_active: formData.is_active,
      };

      const url = editingId
        ? `/api/companies/${companyId}/announcements/${editingId}`
        : `/api/companies/${companyId}/announcements`;

      const response = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save announcement');
      }

      setSuccess(editingId ? 'Announcement updated successfully' : 'Announcement created successfully');
      setShowForm(false);
      setEditingId(null);
      fetchAnnouncements();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while saving the announcement';
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      title: '',
      content: '',
      expires_at: '',
      priority: 0,
      is_active: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>Announcements</h2>
          <p>Create and manage company-wide announcements displayed on the tickets dashboard.</p>
        </div>
        {!showForm && (
          <button className={styles.createButton} onClick={handleCreateNew}>
            <Plus size={18} />
            New Announcement
          </button>
        )}
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      {showForm && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <h3>{editingId ? 'Edit Announcement' : 'Create New Announcement'}</h3>

          <div className={styles.formGroup}>
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter announcement title"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="content">Content *</label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Enter announcement content"
              rows={4}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="expires_at">Expires At (Optional)</label>
              <input
                type="datetime-local"
                id="expires_at"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="priority">Priority</label>
              <input
                type="number"
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                min={0}
                max={100}
              />
              <span className={styles.hint}>Higher = shown first</span>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              Active (visible to users)
            </label>
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={saving}
            >
              {saving ? 'Saving...' : editingId ? 'Update Announcement' : 'Create Announcement'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className={styles.loading}>Loading announcements...</div>
      ) : announcements.length === 0 ? (
        <div className={styles.emptyState}>
          <Megaphone size={48} strokeWidth={1.5} />
          <p>No announcements yet</p>
          <span>Create your first announcement to share updates with your team.</span>
        </div>
      ) : (
        <div className={styles.list}>
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className={`${styles.card} ${!announcement.is_active ? styles.inactive : ''}`}
            >
              <div className={styles.cardHeader}>
                <h4>{announcement.title}</h4>
                <div className={styles.cardActions}>
                  <button
                    className={styles.editButton}
                    onClick={() => handleEdit(announcement)}
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    className={styles.deleteButton}
                    onClick={() => handleDelete(announcement)}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className={styles.cardContent}>{announcement.content}</p>
              <div className={styles.cardMeta}>
                <span>Published: {formatDate(announcement.published_at)}</span>
                {announcement.expires_at && (
                  <span>Expires: {formatDate(announcement.expires_at)}</span>
                )}
                {announcement.published_by_name && (
                  <span>By: {announcement.published_by_name}</span>
                )}
                {!announcement.is_active && (
                  <span className={styles.inactiveTag}>Inactive</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
