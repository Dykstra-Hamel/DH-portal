'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Star,
  Download,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle,
  Search,
  GitBranch,
} from 'lucide-react';
import {
  SystemSalesCadenceWithSteps,
  ACTION_TYPE_LABELS,
  PRIORITY_LABELS,
  PRIORITY_COLORS,
} from '@/types/sales-cadence';
import styles from './CadenceLibraryBrowser.module.scss';

interface CadenceLibraryBrowserProps {
  companyId: string;
  onCadenceImported?: () => void;
  onClose: () => void;
}

export default function CadenceLibraryBrowser({
  companyId,
  onCadenceImported,
  onClose,
}: CadenceLibraryBrowserProps) {
  const [cadences, setCadences] = useState<SystemSalesCadenceWithSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCadence, setExpandedCadence] = useState<string | null>(null);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [customNameFor, setCustomNameFor] = useState<string | null>(null);
  const [customName, setCustomName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchCadences();
  }, []);

  const fetchCadences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/cadence-library?active=true');
      if (response.ok) {
        const { data } = await response.json();
        setCadences(data || []);
      }
    } catch {
      // silently fail — message shown if needed
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (cadenceId: string) => {
    try {
      setImportingId(cadenceId);
      setMessage(null);

      const body: { custom_name?: string } = {};
      if (customNameFor === cadenceId && customName.trim()) {
        body.custom_name = customName.trim();
      }

      const response = await fetch(
        `/api/companies/${companyId}/sales-cadences/import/${cadenceId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Cadence imported successfully!' });
        setCustomNameFor(null);
        setCustomName('');
        onCadenceImported?.();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to import cadence' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to import cadence' });
    } finally {
      setImportingId(null);
    }
  };

  const toggleExpansion = (id: string) => {
    setExpandedCadence(expandedCadence === id ? null : id);
  };

  const startCustomName = (cadence: SystemSalesCadenceWithSteps) => {
    setCustomNameFor(cadence.id);
    setCustomName(cadence.name);
  };

  const filteredCadences = cadences.filter(
    cadence =>
      !searchTerm ||
      cadence.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cadence.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.browser} onClick={e => e.stopPropagation()}>
        <div className={styles.browserHeader}>
          <div>
            <h2>Cadence Library</h2>
            <p>Browse and import pre-built sales cadences</p>
          </div>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        <div className={styles.searchBar}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search cadences..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className={styles.cadenceList}>
          {loading && (
            <div className={styles.loadingState}>Loading cadences...</div>
          )}

          {!loading && filteredCadences.length === 0 && (
            <div className={styles.emptyState}>
              <GitBranch size={40} />
              <p>No cadences found</p>
            </div>
          )}

          {!loading &&
            filteredCadences.map(cadence => (
              <div key={cadence.id} className={styles.cadenceCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardMeta}>
                    <div className={styles.cardTitle}>
                      <h3>{cadence.name}</h3>
                      {cadence.is_featured && (
                        <span className={styles.featuredBadge}>
                          <Star size={11} />
                          Featured
                        </span>
                      )}
                    </div>
                    {cadence.description && (
                      <p className={styles.cardDescription}>{cadence.description}</p>
                    )}
                    <div className={styles.cardStats}>
                      <span>{cadence.steps?.length || 0} steps</span>
                      <span>{cadence.usage_count} import{cadence.usage_count !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className={styles.cardActions}>
                    <button
                      onClick={() => toggleExpansion(cadence.id)}
                      className={styles.previewButton}
                      title="Preview steps"
                    >
                      {expandedCadence === cadence.id ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                      Preview
                    </button>
                    {customNameFor === cadence.id ? (
                      <div className={styles.customNameInput}>
                        <input
                          type="text"
                          value={customName}
                          onChange={e => setCustomName(e.target.value)}
                          placeholder="Custom cadence name..."
                          autoFocus
                        />
                        <button
                          onClick={() => handleImport(cadence.id)}
                          className={styles.importConfirmButton}
                          disabled={importingId === cadence.id}
                        >
                          <Download size={14} />
                          {importingId === cadence.id ? 'Importing...' : 'Import'}
                        </button>
                        <button
                          onClick={() => {
                            setCustomNameFor(null);
                            setCustomName('');
                          }}
                          className={styles.cancelCustomName}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startCustomName(cadence)}
                        className={styles.importButton}
                        disabled={importingId !== null}
                      >
                        <Download size={14} />
                        Import
                      </button>
                    )}
                  </div>
                </div>

                {expandedCadence === cadence.id && cadence.steps && cadence.steps.length > 0 && (
                  <div className={styles.stepsPreview}>
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

                {expandedCadence === cadence.id &&
                  (!cadence.steps || cadence.steps.length === 0) && (
                    <div className={styles.emptySteps}>No steps configured.</div>
                  )}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
