'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  SalesCadenceWithSteps,
  ACTION_TYPE_LABELS,
  TIME_OF_DAY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '@/types/sales-cadence';
import CadenceModal from '@/components/Common/CadenceModal/CadenceModal';
import CadenceLibraryBrowser from '@/components/Automation/CadenceLibraryBrowser/CadenceLibraryBrowser';
import styles from './SalesConfigManager.module.scss';

interface SalesConfigManagerProps {
  companyId: string;
}

export default function SalesConfigManager({ companyId }: SalesConfigManagerProps) {
  const [cadences, setCadences] = useState<SalesCadenceWithSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCadenceModal, setShowCadenceModal] = useState(false);
  const [showLibraryBrowser, setShowLibraryBrowser] = useState(false);
  const [editingCadence, setEditingCadence] = useState<SalesCadenceWithSteps | null>(null);
  const [expandedCadence, setExpandedCadence] = useState<string | null>(null);
  const [defaultCadences, setDefaultCadences] = useState({
    default_initial_contact_cadence_id: '',
    default_quote_followup_cadence_id: '',
    default_scheduling_followup_cadence_id: '',
  });
  const [savingDefaults, setSavingDefaults] = useState(false);

  useEffect(() => {
    loadCadences();
    loadDefaultCadences();
  }, [companyId]);

  const loadDefaultCadences = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}/settings`);
      if (!response.ok) return;
      const { settings } = await response.json();
      setDefaultCadences({
        default_initial_contact_cadence_id: settings?.default_initial_contact_cadence_id?.value ?? '',
        default_quote_followup_cadence_id: settings?.default_quote_followup_cadence_id?.value ?? '',
        default_scheduling_followup_cadence_id: settings?.default_scheduling_followup_cadence_id?.value ?? '',
      });
    } catch {
      // Non-critical — silently ignore
    }
  };

  const handleSaveDefaults = async () => {
    try {
      setSavingDefaults(true);
      setError(null);

      const response = await fetch(`/api/companies/${companyId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            default_initial_contact_cadence_id: {
              value: defaultCadences.default_initial_contact_cadence_id,
              type: 'string',
            },
            default_quote_followup_cadence_id: {
              value: defaultCadences.default_quote_followup_cadence_id,
              type: 'string',
            },
            default_scheduling_followup_cadence_id: {
              value: defaultCadences.default_scheduling_followup_cadence_id,
              type: 'string',
            },
          },
        }),
      });

      if (!response.ok) {
        const { error: errorMsg } = await response.json();
        throw new Error(errorMsg || 'Failed to save default cadences');
      }

      setSuccess('Default cadences saved successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save default cadences');
    } finally {
      setSavingDefaults(false);
    }
  };

  const loadCadences = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/companies/${companyId}/sales-cadences`);
      if (!response.ok) {
        throw new Error('Failed to load sales cadences');
      }

      const { data } = await response.json();
      setCadences(data);
    } catch (err) {
      console.error('Error loading sales cadences:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sales cadences');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCadence = () => {
    setEditingCadence(null);
    setShowCadenceModal(true);
  };

  const handleEditCadence = (cadence: SalesCadenceWithSteps) => {
    setEditingCadence(cadence);
    setShowCadenceModal(true);
  };

  const handleDeleteCadence = async (cadenceId: string) => {
    if (!confirm('Are you sure you want to delete this sales cadence? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/companies/${companyId}/sales-cadences/${cadenceId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const { error: errorMsg } = await response.json();
        throw new Error(errorMsg || 'Failed to delete sales cadence');
      }

      setSuccess('Sales cadence deleted successfully');
      await loadCadences();
    } catch (err) {
      console.error('Error deleting sales cadence:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete sales cadence');
    } finally {
      setSaving(false);
    }
  };

  const toggleCadenceExpansion = (cadenceId: string) => {
    setExpandedCadence(expandedCadence === cadenceId ? null : cadenceId);
  };

  if (loading) {
    return <div className={styles.loading}>Loading sales cadences...</div>;
  }

  const activeCadences = cadences.filter((c) => c.is_active);

  const DEFAULT_CADENCE_ROWS = [
    {
      key: 'default_initial_contact_cadence_id' as const,
      label: 'Initial Lead Contacting',
      description: 'Applied when a new lead enters the pipeline',
    },
    {
      key: 'default_quote_followup_cadence_id' as const,
      label: 'Quote Follow-up',
      description: 'Applied after a quote has been sent',
    },
    {
      key: 'default_scheduling_followup_cadence_id' as const,
      label: 'Scheduling Follow-up',
      description: 'Applied after scheduling a service',
    },
  ];

  return (
    <div className={styles.salesConfigManager}>
      <div className={styles.defaultCadencesCard}>
        <div className={styles.defaultCadencesHeader}>
          <h3>Automation Default Cadences</h3>
          <p>Select which cadence is automatically assigned for each automation workflow.</p>
        </div>

        {DEFAULT_CADENCE_ROWS.map((row, index) => (
          <div
            key={row.key}
            className={styles.defaultCadenceRow}
            data-last={index === DEFAULT_CADENCE_ROWS.length - 1 ? 'true' : undefined}
          >
            <div className={styles.defaultCadenceLabel}>
              <span className={styles.defaultCadenceName}>{row.label}</span>
              <span className={styles.defaultCadenceDesc}>{row.description}</span>
            </div>
            <select
              value={defaultCadences[row.key]}
              onChange={(e) =>
                setDefaultCadences((prev) => ({ ...prev, [row.key]: e.target.value }))
              }
              disabled={loading || savingDefaults}
              className={styles.defaultCadenceSelect}
            >
              <option value="">— No default —</option>
              {activeCadences.map((cadence) => (
                <option key={cadence.id} value={cadence.id}>
                  {cadence.name}
                </option>
              ))}
            </select>
          </div>
        ))}

        <div className={styles.defaultCadencesFooter}>
          <button
            onClick={handleSaveDefaults}
            className={styles.saveButton}
            disabled={loading || savingDefaults}
          >
            {savingDefaults ? 'Saving...' : 'Save Defaults'}
          </button>
        </div>
      </div>

      <div className={styles.header}>
        <h2>Sales Cadence Configuration</h2>
        <div className={styles.headerActions}>
          <button
            onClick={() => setShowLibraryBrowser(true)}
            className={styles.importButton}
            disabled={saving}
          >
            Import from Library
          </button>
          <button onClick={handleCreateCadence} className={styles.createButton} disabled={saving}>
            <Plus size={16} />
            Create Cadence
          </button>
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div className={styles.successMessage}>
          <strong>Success:</strong> {success}
        </div>
      )}

      {cadences.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No sales cadences configured yet.</p>
          <p>Create your first cadence to get started.</p>
        </div>
      ) : (
        <div className={styles.cadenceList}>
          {cadences.map((cadence) => (
            <div key={cadence.id} className={styles.cadenceCard}>
              <div className={styles.cadenceHeader}>
                <div className={styles.cadenceInfo}>
                  <h3>{cadence.name}</h3>
                  {cadence.description && <p>{cadence.description}</p>}
                  <div className={styles.cadenceMeta}>
                    <span>{cadence.steps?.length || 0} steps</span>
                    {cadence.is_default && <span className={styles.badge}>Default</span>}
                    {cadence.is_active ? (
                      <span className={styles.statusActive}>Active</span>
                    ) : (
                      <span className={styles.statusInactive}>Inactive</span>
                    )}
                  </div>
                </div>
                <div className={styles.cadenceActions}>
                  <button
                    onClick={() => toggleCadenceExpansion(cadence.id)}
                    className={styles.iconButton}
                    title="View Steps"
                  >
                    {expandedCadence === cadence.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <button
                    onClick={() => handleEditCadence(cadence)}
                    className={styles.iconButton}
                    disabled={saving}
                    title="Edit Cadence"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteCadence(cadence.id)}
                    className={styles.iconButton}
                    disabled={saving}
                    title="Delete Cadence"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {expandedCadence === cadence.id && cadence.steps && cadence.steps.length > 0 && (
                <div className={styles.cadenceSteps}>
                  <h4>Cadence Steps:</h4>
                  <div className={styles.stepsTimeline}>
                    {[...cadence.steps]
                      .sort((a, b) => {
                        // Sort by day number first
                        if (a.day_number !== b.day_number) {
                          return a.day_number - b.day_number;
                        }
                        // Then sort by time of day (morning before afternoon)
                        if (a.time_of_day === 'morning' && b.time_of_day === 'afternoon') return -1;
                        if (a.time_of_day === 'afternoon' && b.time_of_day === 'morning') return 1;
                        return 0;
                      })
                      .map((step, index) => (
                      <div key={step.id} className={styles.stepItem}>
                        <div className={styles.stepNumber}>{index + 1}</div>
                        <div className={styles.stepContent}>
                          <div className={styles.stepHeader}>
                            <span className={styles.stepDay}>
                              Day {step.day_number} - {TIME_OF_DAY_LABELS[step.time_of_day]}
                            </span>
                            <span
                              className={styles.priorityBadge}
                              style={{ backgroundColor: PRIORITY_COLORS[step.priority] }}
                            >
                              {PRIORITY_LABELS[step.priority]}
                            </span>
                          </div>
                          <div className={styles.stepAction}>
                            {ACTION_TYPE_LABELS[step.action_type]}
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
            </div>
          ))}
        </div>
      )}

      {showCadenceModal && (
        <CadenceModal
          cadence={editingCadence}
          companyId={companyId}
          onClose={() => {
            setShowCadenceModal(false);
            setEditingCadence(null);
          }}
          onSuccess={() => {
            setShowCadenceModal(false);
            setEditingCadence(null);
            setSuccess(editingCadence ? 'Cadence updated successfully' : 'Cadence created successfully');
            loadCadences();
          }}
        />
      )}

      {showLibraryBrowser && (
        <CadenceLibraryBrowser
          companyId={companyId}
          onCadenceImported={() => {
            loadCadences();
          }}
          onClose={() => setShowLibraryBrowser(false)}
        />
      )}
    </div>
  );
}
