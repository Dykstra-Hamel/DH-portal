'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Star,
  Search,
  Filter,
  AlertCircle,
  CheckCircle,
  Users,
  ChevronDown,
  ChevronUp,
  GitBranch,
} from 'lucide-react';
import {
  SystemSalesCadenceWithSteps,
  ACTION_TYPE_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '@/types/sales-cadence';
import AdminCadenceModal from './AdminCadenceModal/AdminCadenceModal';
import styles from './CadenceLibraryManager.module.scss';

export default function CadenceLibraryManager() {
  const [cadences, setCadences] = useState<SystemSalesCadenceWithSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [featuredFilter, setFeaturedFilter] = useState('all');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCadence, setEditingCadence] = useState<SystemSalesCadenceWithSteps | null>(null);
  const [expandedCadence, setExpandedCadence] = useState<string | null>(null);

  const fetchCadences = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set('search', searchTerm);

      const response = await fetch(`/api/admin/cadence-library?${params}`);
      if (response.ok) {
        const { data } = await response.json();
        setCadences(data || []);
      } else {
        setMessage({ type: 'error', text: 'Failed to load cadences' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load cadences' });
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchCadences();
  }, [fetchCadences]);

  const handleCreate = () => {
    setEditingCadence(null);
    setShowModal(true);
  };

  const handleEdit = (cadence: SystemSalesCadenceWithSteps) => {
    setEditingCadence(cadence);
    setShowModal(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/cadence-library/${id}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        setMessage({ type: 'success', text: 'Cadence deleted successfully' });
        fetchCadences();
      } else {
        const result = await response.json();
        setMessage({ type: 'error', text: result.error || 'Failed to delete cadence' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to delete cadence' });
    }
  };

  const toggleExpansion = (id: string) => {
    setExpandedCadence(expandedCadence === id ? null : id);
  };

  const filteredCadences = cadences.filter(cadence => {
    const matchesSearch =
      !searchTerm ||
      cadence.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cadence.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFeatured =
      featuredFilter === 'all' ||
      (featuredFilter === 'true' && cadence.is_featured) ||
      (featuredFilter === 'false' && !cadence.is_featured);

    return matchesSearch && matchesFeatured;
  });

  if (loading) {
    return <div className={styles.loading}>Loading cadence library...</div>;
  }

  return (
    <div className={styles.cadenceLibraryManager}>
      <div className={styles.header}>
        <div>
          <h2>Cadence Library Management</h2>
          <p>Manage global sales cadences that all companies can import</p>
        </div>
        <button className={styles.createButton} onClick={handleCreate}>
          <Plus size={16} />
          Create Cadence
        </button>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search cadences..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <select value={featuredFilter} onChange={e => setFeaturedFilter(e.target.value)}>
          <option value="all">All Cadences</option>
          <option value="true">Featured Only</option>
          <option value="false">Regular Cadences</option>
        </select>

        <button onClick={fetchCadences} className={styles.refreshButton}>
          <Filter size={16} />
          Refresh
        </button>
      </div>

      <div className={styles.cadenceList}>
        {filteredCadences.map(cadence => (
          <div key={cadence.id} className={styles.cadenceCard}>
            <div className={styles.cadenceHeader}>
              <div className={styles.cadenceMeta}>
                <div className={styles.cadenceTitle}>
                  <h3>{cadence.name}</h3>
                  {cadence.is_featured && <Star size={14} className={styles.featuredIcon} />}
                </div>
                {cadence.description && (
                  <p className={styles.description}>{cadence.description}</p>
                )}
                <div className={styles.cadenceStats}>
                  <div className={styles.stat}>
                    <GitBranch size={13} />
                    <span>{cadence.steps?.length || 0} steps</span>
                  </div>
                  <div className={styles.stat}>
                    <Users size={13} />
                    <span>{cadence.usage_count} import{cadence.usage_count !== 1 ? 's' : ''}</span>
                  </div>
                  <span
                    className={`${styles.statusBadge} ${cadence.is_active ? styles.active : styles.inactive}`}
                  >
                    {cadence.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className={styles.cadenceActions}>
                <button
                  onClick={() => toggleExpansion(cadence.id)}
                  className={styles.iconButton}
                  title="View Steps"
                >
                  {expandedCadence === cadence.id ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(cadence)}
                  className={styles.iconButton}
                  title="Edit"
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDelete(cadence.id, cadence.name)}
                  className={`${styles.iconButton} ${styles.deleteButton}`}
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>

            {expandedCadence === cadence.id && cadence.steps && cadence.steps.length > 0 && (
              <div className={styles.cadenceSteps}>
                <h4>Cadence Steps:</h4>
                <div className={styles.stepsTimeline}>
                  {[...cadence.steps]
                    .sort((a, b) => a.display_order - b.display_order)
                    .map((step, index) => (
                      <div key={step.id} className={styles.stepItem}>
                        <div className={styles.stepNumber}>{index + 1}</div>
                        <div className={styles.stepContent}>
                          <div className={styles.stepHeader}>
                            <span className={styles.stepDay}>
                              Step {index + 1}: {ACTION_TYPE_LABELS[step.action_type]}
                            </span>
                            <span
                              className={styles.priorityBadge}
                              style={{ backgroundColor: PRIORITY_COLORS[step.priority] }}
                            >
                              {PRIORITY_LABELS[step.priority]}
                            </span>
                          </div>
                          {step.description && (
                            <div className={styles.stepDescription}>{step.description}</div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {expandedCadence === cadence.id && (!cadence.steps || cadence.steps.length === 0) && (
              <div className={styles.emptySteps}>
                <p>No steps configured for this cadence.</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredCadences.length === 0 && (
        <div className={styles.emptyState}>
          <GitBranch size={48} />
          <h3>No cadences found</h3>
          <p>Create your first system cadence or adjust your filters</p>
        </div>
      )}

      {showModal && (
        <AdminCadenceModal
          cadence={editingCadence}
          onClose={() => {
            setShowModal(false);
            setEditingCadence(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingCadence(null);
            setMessage({
              type: 'success',
              text: editingCadence ? 'Cadence updated successfully' : 'Cadence created successfully',
            });
            fetchCadences();
          }}
        />
      )}
    </div>
  );
}
