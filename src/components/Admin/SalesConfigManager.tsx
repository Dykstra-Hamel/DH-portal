'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ChevronDown, ChevronUp, GripVertical, X } from 'lucide-react';
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

type SalesTab =
  | 'quickQuote'
  | 'cadences'
  | 'leadAssignment'
  | 'safetyChecklist';

interface SafetyChecklistQuestion {
  id: string;
  text: string;
  answerType: 'yes_no' | 'text';
  order: number;
  parentId?: string; // if set, this question is a conditional child shown when parent answer = 'yes'
}

interface ZipCodeGroup {
  id: string;
  name: string;
  assigned_user_id: string | null;
  assigned_user_name: string | null;
  zip_codes: string[];
}

interface SalesConfigManagerProps {
  companyId: string;
}

export default function SalesConfigManager({
  companyId,
}: SalesConfigManagerProps) {
  const [cadences, setCadences] = useState<SalesCadenceWithSteps[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCadenceModal, setShowCadenceModal] = useState(false);
  const [showLibraryBrowser, setShowLibraryBrowser] = useState(false);
  const [editingCadence, setEditingCadence] =
    useState<SalesCadenceWithSteps | null>(null);
  const [expandedCadence, setExpandedCadence] = useState<string | null>(null);
  const [defaultCadences, setDefaultCadences] = useState({
    default_initial_contact_cadence_id: '',
    default_quote_followup_cadence_id: '',
    default_scheduling_followup_cadence_id: '',
  });
  const [savingDefaults, setSavingDefaults] = useState(false);
  const [quickQuoteStep1Script, setQuickQuoteStep1Script] = useState('');
  const [quickQuoteStep1Tips, setQuickQuoteStep1Tips] = useState('');
  const [quickQuoteStep2Script, setQuickQuoteStep2Script] = useState('');
  const [quickQuoteStep3Script, setQuickQuoteStep3Script] = useState('');
  const [savingQuickQuote, setSavingQuickQuote] = useState(false);
  const [autoAssignCustomQuoteLeads, setAutoAssignCustomQuoteLeads] =
    useState(false);
  const [technicianPropertyTypeEnabled, setTechnicianPropertyTypeEnabled] =
    useState(false);
  const [inspectorPropertyTypeEnabled, setInspectorPropertyTypeEnabled] =
    useState(false);
  const [zipCodeGroups, setZipCodeGroups] = useState<ZipCodeGroup[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [savingLeadAssignment, setSavingLeadAssignment] = useState(false);
  const [safetyChecklistEnabled, setSafetyChecklistEnabled] = useState(false);
  const [safetyChecklistQuestions, setSafetyChecklistQuestions] = useState<
    SafetyChecklistQuestion[]
  >([]);
  const [savingSafetyChecklist, setSavingSafetyChecklist] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionAnswerType, setNewQuestionAnswerType] = useState<
    'yes_no' | 'text'
  >('yes_no');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  );
  const [editText, setEditText] = useState('');
  const [editAnswerType, setEditAnswerType] = useState<'yes_no' | 'text'>(
    'yes_no'
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropBeforeId, setDropBeforeId] = useState<string | null>(null);
  const [dropParentId, setDropParentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SalesTab>('quickQuote');

  useEffect(() => {
    loadCadences();
    loadDefaultCadences();
    loadZipCodeGroups();
  }, [companyId]);

  const loadDefaultCadences = async () => {
    try {
      const response = await fetch(`/api/companies/${companyId}/settings`);
      if (!response.ok) return;
      const { settings } = await response.json();
      setDefaultCadences({
        default_initial_contact_cadence_id:
          settings?.default_initial_contact_cadence_id?.value ?? '',
        default_quote_followup_cadence_id:
          settings?.default_quote_followup_cadence_id?.value ?? '',
        default_scheduling_followup_cadence_id:
          settings?.default_scheduling_followup_cadence_id?.value ?? '',
      });
      setQuickQuoteStep1Script(settings?.quick_quote_step1_script?.value ?? '');
      setQuickQuoteStep1Tips(settings?.quick_quote_step1_tips?.value ?? '');
      setQuickQuoteStep2Script(settings?.quick_quote_step2_script?.value ?? '');
      setQuickQuoteStep3Script(settings?.quick_quote_step3_script?.value ?? '');
      setAutoAssignCustomQuoteLeads(
        settings?.auto_assign_custom_quote_leads?.value === true
      );
      setTechnicianPropertyTypeEnabled(
        settings?.technician_property_type_enabled?.value === true
      );
      setInspectorPropertyTypeEnabled(
        settings?.inspector_property_type_enabled?.value === true
      );
      setSafetyChecklistEnabled(
        settings?.safety_checklist_enabled?.value === true
      );
      const rawQuestions = settings?.safety_checklist_questions?.value;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsedRaw: any[] = rawQuestions ? JSON.parse(rawQuestions) : [];
      // Migrate old format (conditionalQuestion on parent → parentId on child)
      const migratedQuestions: SafetyChecklistQuestion[] = parsedRaw.map((q) => {
        const { conditionalQuestion, ...rest } = q;
        const parent = parsedRaw.find(
          (p: { conditionalQuestion?: { questionId?: string } }) =>
            p.conditionalQuestion?.questionId === q.id
        );
        return parent ? { ...rest, parentId: parent.id } : rest;
      });
      setSafetyChecklistQuestions(migratedQuestions);
    } catch {
      // Non-critical — silently ignore
    }
  };

  const loadZipCodeGroups = async () => {
    try {
      setLoadingGroups(true);
      const response = await fetch(
        `/api/companies/${companyId}/zip-code-groups`
      );
      if (!response.ok) return;
      const data = await response.json();
      setZipCodeGroups(Array.isArray(data) ? data : (data.groups ?? []));
    } catch {
      // Non-critical — silently ignore
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleSaveSafetyChecklist = async () => {
    try {
      setSavingSafetyChecklist(true);
      setError(null);

      const response = await fetch(`/api/companies/${companyId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            safety_checklist_enabled: {
              value: safetyChecklistEnabled ? 'true' : 'false',
              type: 'boolean',
            },
            safety_checklist_questions: {
              value: JSON.stringify(safetyChecklistQuestions),
              type: 'json',
            },
          },
        }),
      });

      if (!response.ok) {
        const { error: errorMsg } = await response.json();
        throw new Error(errorMsg || 'Failed to save Safety Checklist settings');
      }

      setSuccess('Safety Checklist settings saved successfully');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save Safety Checklist settings'
      );
    } finally {
      setSavingSafetyChecklist(false);
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    const newQuestion: SafetyChecklistQuestion = {
      id: crypto.randomUUID(),
      text: newQuestionText.trim(),
      answerType: newQuestionAnswerType,
      order: safetyChecklistQuestions.length,
    };
    setSafetyChecklistQuestions(prev => [...prev, newQuestion]);
    setNewQuestionText('');
    setNewQuestionAnswerType('yes_no');
  };

  const handleDeleteQuestion = (id: string) => {
    setSafetyChecklistQuestions((prev) =>
      prev
        .filter((q) => q.id !== id)
        .map((q, idx) => ({
          ...q,
          order: idx,
          // Un-nest any children of the deleted question
          parentId: q.parentId === id ? undefined : q.parentId,
        }))
    );
  };

  const handleUnNest = (id: string) => {
    setSafetyChecklistQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, parentId: undefined } : q))
    );
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDropBeforeId(null);
    setDropParentId(null);
  };

  const handleDropOnRoot = (e: React.DragEvent, beforeId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggingId) return;
    setSafetyChecklistQuestions((prev) => {
      const dragging = prev.find((q) => q.id === draggingId);
      if (!dragging) return prev;
      const withoutDragging = prev.filter((q) => q.id !== draggingId);
      const cleared = { ...dragging, parentId: undefined };
      if (beforeId === null) {
        return [...withoutDragging, cleared].map((q, i) => ({ ...q, order: i }));
      }
      const idx = withoutDragging.findIndex((q) => q.id === beforeId);
      const result =
        idx === -1
          ? [...withoutDragging, cleared]
          : [...withoutDragging.slice(0, idx), cleared, ...withoutDragging.slice(idx)];
      return result.map((q, i) => ({ ...q, order: i }));
    });
    handleDragEnd();
  };

  const handleDropOnConditional = (e: React.DragEvent, parentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggingId || draggingId === parentId) return;
    setSafetyChecklistQuestions((prev) =>
      prev.map((q) => (q.id === draggingId ? { ...q, parentId } : q))
    );
    handleDragEnd();
  };

  const handleMoveQuestion = (id: string, direction: 'up' | 'down') => {
    setSafetyChecklistQuestions((prev) => {
      const rootIds = prev.filter((q) => !q.parentId).map((q) => q.id);
      const rootIdx = rootIds.indexOf(id);
      if (rootIdx < 0) return prev;
      const swapRootIdx = direction === 'up' ? rootIdx - 1 : rootIdx + 1;
      if (swapRootIdx < 0 || swapRootIdx >= rootIds.length) return prev;
      const swapId = rootIds[swapRootIdx];
      const idxA = prev.findIndex((q) => q.id === id);
      const idxB = prev.findIndex((q) => q.id === swapId);
      const next = [...prev];
      [next[idxA], next[idxB]] = [next[idxB], next[idxA]];
      return next.map((q, i) => ({ ...q, order: i }));
    });
  };

  const handleStartEdit = (q: SafetyChecklistQuestion) => {
    setEditingQuestionId(q.id);
    setEditText(q.text);
    setEditAnswerType(q.answerType);
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setEditText('');
    setEditAnswerType('yes_no');
  };

  const handleSaveEdit = () => {
    if (!editingQuestionId || !editText.trim()) return;
    setSafetyChecklistQuestions((prev) =>
      prev.map((q) =>
        q.id === editingQuestionId
          ? { ...q, text: editText.trim(), answerType: editAnswerType }
          : q
      )
    );
    handleCancelEdit();
  };

  const handleSaveLeadAssignment = async () => {
    try {
      setSavingLeadAssignment(true);
      setError(null);

      const response = await fetch(`/api/companies/${companyId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            auto_assign_custom_quote_leads: {
              value: autoAssignCustomQuoteLeads ? 'true' : 'false',
              type: 'boolean',
            },
            technician_property_type_enabled: {
              value: technicianPropertyTypeEnabled ? 'true' : 'false',
              type: 'boolean',
            },
            inspector_property_type_enabled: {
              value: inspectorPropertyTypeEnabled ? 'true' : 'false',
              type: 'boolean',
            },
          },
        }),
      });

      if (!response.ok) {
        const { error: errorMsg } = await response.json();
        throw new Error(errorMsg || 'Failed to save assignment settings');
      }

      setSuccess('Assignment settings saved successfully');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save assignment settings'
      );
    } finally {
      setSavingLeadAssignment(false);
    }
  };

  const handleSaveQuickQuote = async () => {
    try {
      setSavingQuickQuote(true);
      setError(null);

      const response = await fetch(`/api/companies/${companyId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: {
            quick_quote_step1_script: {
              value: quickQuoteStep1Script,
              type: 'string',
            },
            quick_quote_step1_tips: {
              value: quickQuoteStep1Tips,
              type: 'string',
            },
            quick_quote_step2_script: {
              value: quickQuoteStep2Script,
              type: 'string',
            },
            quick_quote_step3_script: {
              value: quickQuoteStep3Script,
              type: 'string',
            },
          },
        }),
      });

      if (!response.ok) {
        const { error: errorMsg } = await response.json();
        throw new Error(errorMsg || 'Failed to save Quick Quote settings');
      }

      setSuccess('Quick Quote settings saved successfully');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save Quick Quote settings'
      );
    } finally {
      setSavingQuickQuote(false);
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
      setError(
        err instanceof Error ? err.message : 'Failed to save default cadences'
      );
    } finally {
      setSavingDefaults(false);
    }
  };

  const loadCadences = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/companies/${companyId}/sales-cadences`
      );
      if (!response.ok) {
        throw new Error('Failed to load sales cadences');
      }

      const { data } = await response.json();
      setCadences(data);
    } catch (err) {
      console.error('Error loading sales cadences:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load sales cadences'
      );
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
    if (
      !confirm(
        'Are you sure you want to delete this sales cadence? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(
        `/api/companies/${companyId}/sales-cadences/${cadenceId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        const { error: errorMsg } = await response.json();
        throw new Error(errorMsg || 'Failed to delete sales cadence');
      }

      setSuccess('Sales cadence deleted successfully');
      await loadCadences();
    } catch (err) {
      console.error('Error deleting sales cadence:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to delete sales cadence'
      );
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

  const activeCadences = cadences.filter(c => c.is_active);

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

      <div className={styles.tabs}>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'quickQuote' ? styles.active : ''}`}
          onClick={() => setActiveTab('quickQuote')}
        >
          Quick Quote
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'cadences' ? styles.active : ''}`}
          onClick={() => setActiveTab('cadences')}
        >
          Sales Cadences
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'leadAssignment' ? styles.active : ''}`}
          onClick={() => setActiveTab('leadAssignment')}
        >
          Lead Assignment
        </button>
        <button
          type="button"
          className={`${styles.tabButton} ${activeTab === 'safetyChecklist' ? styles.active : ''}`}
          onClick={() => setActiveTab('safetyChecklist')}
        >
          Safety Checklist
        </button>
      </div>

      {activeTab === 'quickQuote' && (
        <div className={styles.quickQuoteCard}>
          <div className={styles.quickQuoteCardHeader}>
            <h3>Quick Quote Script</h3>
            <p>
              Customize the sales script and tips shown to reps during the Quick
              Quote flow. Leave blank to use the default text.
            </p>
          </div>

          <div className={styles.quickQuoteStepSection}>
            <p className={styles.quickQuoteStepLabel}>
              Step 1 — Pest Selection
            </p>
            <div className={styles.quickQuoteFormGroup}>
              <label className={styles.quickQuoteLabel}>Sales Script</label>
              <textarea
                className={styles.quickQuoteTextarea}
                rows={3}
                value={quickQuoteStep1Script}
                onChange={e => setQuickQuoteStep1Script(e.target.value)}
                disabled={savingQuickQuote}
                placeholder={`"Thank you for calling us today! My name is [Your Name] and I'd be happy to help you get a quote. Can I start by asking — what kind of pest issue are you dealing with?"`}
              />
            </div>
            <div className={styles.quickQuoteFormGroup}>
              <label className={styles.quickQuoteLabel}>Sales Tips</label>
              <p className={styles.quickQuoteHint}>
                Enter one tip per line. Each line will appear as a bullet point.
              </p>
              <textarea
                className={styles.quickQuoteTextarea}
                rows={5}
                value={quickQuoteStep1Tips}
                onChange={e => setQuickQuoteStep1Tips(e.target.value)}
                disabled={savingQuickQuote}
                placeholder={`Ask how long they've been noticing the problem — longer duration often signals a bigger issue.\nConfirm property ownership — owners are more likely to commit to recurring plans.\nMention that pest pressure is high in their area to build urgency.`}
              />
            </div>
          </div>

          <div className={styles.quickQuoteStepSection}>
            <p className={styles.quickQuoteStepLabel}>Step 2 — Customer Info</p>
            <div className={styles.quickQuoteFormGroup}>
              <label className={styles.quickQuoteLabel}>Sales Script</label>
              <textarea
                className={styles.quickQuoteTextarea}
                rows={3}
                value={quickQuoteStep2Script}
                onChange={e => setQuickQuoteStep2Script(e.target.value)}
                disabled={savingQuickQuote}
                placeholder={`"Great! I just need to gather a few details. Can I get your name and the best phone number to reach you?"`}
              />
            </div>
          </div>

          <div className={styles.quickQuoteStepSection}>
            <p className={styles.quickQuoteStepLabel}>
              Step 3 — Plan Selection
            </p>
            <div className={styles.quickQuoteFormGroup}>
              <label className={styles.quickQuoteLabel}>Sales Script</label>
              <textarea
                className={styles.quickQuoteTextarea}
                rows={3}
                value={quickQuoteStep3Script}
                onChange={e => setQuickQuoteStep3Script(e.target.value)}
                disabled={savingQuickQuote}
                placeholder={`"Based on what you've described, let me walk you through a few plan options. Our plans are designed to give you the right level of protection — I'd recommend starting with our most comprehensive option."`}
              />
            </div>
          </div>

          <div className={styles.quickQuoteCardFooter}>
            <button
              onClick={handleSaveQuickQuote}
              className={styles.saveButton}
              disabled={savingQuickQuote}
            >
              {savingQuickQuote ? 'Saving...' : 'Save Quick Quote Settings'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'cadences' && (
        <>
          <div className={styles.defaultCadencesCard}>
            <div className={styles.defaultCadencesHeader}>
              <h3>Automation Default Cadences</h3>
              <p>
                Select which cadence is automatically assigned for each
                automation workflow.
              </p>
            </div>

            {DEFAULT_CADENCE_ROWS.map((row, index) => (
              <div
                key={row.key}
                className={styles.defaultCadenceRow}
                data-last={
                  index === DEFAULT_CADENCE_ROWS.length - 1 ? 'true' : undefined
                }
              >
                <div className={styles.defaultCadenceLabel}>
                  <span className={styles.defaultCadenceName}>{row.label}</span>
                  <span className={styles.defaultCadenceDesc}>
                    {row.description}
                  </span>
                </div>
                <select
                  value={defaultCadences[row.key]}
                  onChange={e =>
                    setDefaultCadences(prev => ({
                      ...prev,
                      [row.key]: e.target.value,
                    }))
                  }
                  disabled={loading || savingDefaults}
                  className={styles.defaultCadenceSelect}
                >
                  <option value="">— No default —</option>
                  {activeCadences.map(cadence => (
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
              <button
                onClick={handleCreateCadence}
                className={styles.createButton}
                disabled={saving}
              >
                <Plus size={16} />
                Create Cadence
              </button>
            </div>
          </div>

          {cadences.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No sales cadences configured yet.</p>
              <p>Create your first cadence to get started.</p>
            </div>
          ) : (
            <div className={styles.cadenceList}>
              {cadences.map(cadence => (
                <div key={cadence.id} className={styles.cadenceCard}>
                  <div className={styles.cadenceHeader}>
                    <div className={styles.cadenceInfo}>
                      <h3>{cadence.name}</h3>
                      {cadence.description && <p>{cadence.description}</p>}
                      <div className={styles.cadenceMeta}>
                        <span>{cadence.steps?.length || 0} steps</span>
                        {cadence.is_default && (
                          <span className={styles.badge}>Default</span>
                        )}
                        {cadence.is_active ? (
                          <span className={styles.statusActive}>Active</span>
                        ) : (
                          <span className={styles.statusInactive}>
                            Inactive
                          </span>
                        )}
                      </div>
                    </div>
                    <div className={styles.cadenceActions}>
                      <button
                        onClick={() => toggleCadenceExpansion(cadence.id)}
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

                  {expandedCadence === cadence.id &&
                    cadence.steps &&
                    cadence.steps.length > 0 && (
                      <div className={styles.cadenceSteps}>
                        <h4>Cadence Steps:</h4>
                        <div className={styles.stepsTimeline}>
                          {[...cadence.steps]
                            .sort((a, b) => {
                              if (a.day_number !== b.day_number) {
                                return a.day_number - b.day_number;
                              }
                              if (
                                a.time_of_day === 'morning' &&
                                b.time_of_day === 'afternoon'
                              )
                                return -1;
                              if (
                                a.time_of_day === 'afternoon' &&
                                b.time_of_day === 'morning'
                              )
                                return 1;
                              return 0;
                            })
                            .map((step, index) => (
                              <div key={step.id} className={styles.stepItem}>
                                <div className={styles.stepNumber}>
                                  {index + 1}
                                </div>
                                <div className={styles.stepContent}>
                                  <div className={styles.stepHeader}>
                                    <span className={styles.stepDay}>
                                      Day {step.day_number} -{' '}
                                      {TIME_OF_DAY_LABELS[step.time_of_day]}
                                    </span>
                                    <span
                                      className={styles.priorityBadge}
                                      style={{
                                        backgroundColor:
                                          PRIORITY_COLORS[step.priority],
                                      }}
                                    >
                                      {PRIORITY_LABELS[step.priority]}
                                    </span>
                                  </div>
                                  <div className={styles.stepAction}>
                                    {ACTION_TYPE_LABELS[step.action_type]}
                                  </div>
                                  {step.description && (
                                    <div className={styles.stepDescription}>
                                      {step.description}
                                    </div>
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
        </>
      )}

      {activeTab === 'leadAssignment' && (
        <div className={styles.leadAssignmentCard}>
          <div className={styles.leadAssignmentHeader}>
            <h3>Custom Quote Auto-Assignment</h3>
            <p>
              Automatically assign leads to the inspector who owns the matching
              zip code when the selected plan requires a custom quote.
            </p>
          </div>

          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>Enable auto-assignment</span>
            <button
              type="button"
              role="switch"
              aria-checked={autoAssignCustomQuoteLeads}
              className={`${styles.toggleSwitch} ${autoAssignCustomQuoteLeads ? styles.toggleOn : ''}`}
              onClick={() => setAutoAssignCustomQuoteLeads(v => !v)}
              disabled={savingLeadAssignment}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>

          {autoAssignCustomQuoteLeads && (
            <div className={styles.infoNote}>
              Assignment is determined by zip code groups. Configure inspector
              territories in <strong>Service Areas &rarr; Zip Codes</strong>.
            </div>
          )}

          <div className={styles.groupsTableSection}>
            <p className={styles.groupsTableTitle}>
              Current Zip Code Group Assignments
            </p>
            {loadingGroups ? (
              <p className={styles.groupsTableEmpty}>Loading groups&hellip;</p>
            ) : zipCodeGroups.length === 0 ? (
              <p className={styles.groupsTableEmpty}>
                No zip code groups configured yet. Go to Service Areas &rarr;
                Zip Codes to set them up.
              </p>
            ) : (
              <table className={styles.groupsTable}>
                <thead>
                  <tr>
                    <th>Group Name</th>
                    <th>Assigned Inspector</th>
                    <th># of Zip Codes</th>
                  </tr>
                </thead>
                <tbody>
                  {zipCodeGroups.map(group => (
                    <tr key={group.id}>
                      <td>{group.name}</td>
                      <td>
                        {group.assigned_user_name ?? (
                          <span className={styles.unassigned}>
                            &mdash; No inspector assigned &mdash;
                          </span>
                        )}
                      </td>
                      <td>{group.zip_codes.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className={styles.propertyTypeSection}>
            <div className={styles.leadAssignmentHeader}>
              <h3>Property Type Categorization</h3>
              <p>
                When enabled, technicians and inspectors must be tagged as
                responsible for residential properties, commercial properties,
                or both. Use this when you route work differently based on
                property type.
              </p>
            </div>

            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>
                Require property type for Technicians
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={technicianPropertyTypeEnabled}
                className={`${styles.toggleSwitch} ${technicianPropertyTypeEnabled ? styles.toggleOn : ''}`}
                onClick={() => setTechnicianPropertyTypeEnabled(v => !v)}
                disabled={savingLeadAssignment}
              >
                <span className={styles.toggleThumb} />
              </button>
            </div>

            <div className={styles.toggleRow}>
              <span className={styles.toggleLabel}>
                Require property type for Inspectors
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={inspectorPropertyTypeEnabled}
                className={`${styles.toggleSwitch} ${inspectorPropertyTypeEnabled ? styles.toggleOn : ''}`}
                onClick={() => setInspectorPropertyTypeEnabled(v => !v)}
                disabled={savingLeadAssignment}
              >
                <span className={styles.toggleThumb} />
              </button>
            </div>
          </div>

          <div className={styles.leadAssignmentFooter}>
            <button
              onClick={handleSaveLeadAssignment}
              className={styles.saveButton}
              disabled={savingLeadAssignment}
            >
              {savingLeadAssignment ? 'Saving...' : 'Save Assignment Settings'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'safetyChecklist' && (
        <div className={styles.safetyChecklistCard}>
          <div className={styles.safetyChecklistHeader}>
            <h3>Safety Checklist</h3>
            <p>
              Configure questions that inspectors must answer before submitting
              a quote.
            </p>
          </div>

          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>Enable Safety Checklist</span>
            <button
              type="button"
              role="switch"
              aria-checked={safetyChecklistEnabled}
              className={`${styles.toggleSwitch} ${safetyChecklistEnabled ? styles.toggleOn : ''}`}
              onClick={() => setSafetyChecklistEnabled(v => !v)}
              disabled={savingSafetyChecklist}
            >
              <span className={styles.toggleThumb} />
            </button>
          </div>

          <div className={styles.questionsSection}>
            <p className={styles.questionsSectionTitle}>Questions</p>

            {(() => {
              const rootQuestions = safetyChecklistQuestions.filter((q) => !q.parentId);
              return (
                <div
                  className={styles.questionsList}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropOnRoot(e, null)}
                >
                  {rootQuestions.length === 0 && (
                    <p className={styles.questionsEmpty}>
                      No questions added yet.
                    </p>
                  )}

                  {rootQuestions.map((q, idx) => {
                    const children = safetyChecklistQuestions.filter(
                      (q2) => q2.parentId === q.id
                    );
                    const isEditing = editingQuestionId === q.id;
                    const isDraggingThis = draggingId === q.id;
                    const isDropTarget = dropBeforeId === q.id && draggingId && draggingId !== q.id;
                    const isConditionalTarget = dropParentId === q.id;

                    return (
                      <div key={q.id} className={styles.questionGroupWrapper}>
                        {isDropTarget && (
                          <div className={styles.dropInsertLine} />
                        )}

                        <div
                          className={`${styles.questionGroup} ${isDraggingThis ? styles.dragging : ''}`}
                          draggable={!isEditing}
                          onDragStart={(e) => {
                            e.dataTransfer.effectAllowed = 'move';
                            setDraggingId(q.id);
                          }}
                          onDragEnd={handleDragEnd}
                        >
                          {isEditing ? (
                            // ── Edit mode ──────────────────────────────────
                            <div className={styles.questionEditRow}>
                              <div className={styles.questionEditFields}>
                                <div className={styles.questionEditTop}>
                                  <input
                                    type="text"
                                    className={styles.addQuestionInput}
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') handleSaveEdit();
                                      if (e.key === 'Escape') handleCancelEdit();
                                    }}
                                  />
                                  <select
                                    className={styles.addQuestionSelect}
                                    value={editAnswerType}
                                    onChange={(e) =>
                                      setEditAnswerType(e.target.value as 'yes_no' | 'text')
                                    }
                                  >
                                    <option value="yes_no">Yes / No</option>
                                    <option value="text">Text</option>
                                  </select>
                                </div>
                              </div>
                              <div className={styles.questionEditActions}>
                                <button
                                  type="button"
                                  className={styles.editSaveBtn}
                                  onClick={handleSaveEdit}
                                  disabled={!editText.trim()}
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  className={styles.editCancelBtn}
                                  onClick={handleCancelEdit}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            // ── View mode ──────────────────────────────────
                            <div
                              className={styles.questionRow}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (draggingId && draggingId !== q.id) {
                                  setDropBeforeId(q.id);
                                  setDropParentId(null);
                                }
                              }}
                              onDrop={(e) => handleDropOnRoot(e, q.id)}
                            >
                              <GripVertical size={16} className={styles.dragHandle} />
                              <span className={styles.questionRowIndex}>{idx + 1}.</span>
                              <span className={styles.questionRowLabel}>{q.text}</span>
                              <span className={styles.questionTypeBadge}>
                                {q.answerType === 'yes_no' ? 'Yes / No' : 'Text'}
                              </span>
                              <div className={styles.questionRowActions}>
                                <button
                                  type="button"
                                  className={styles.iconButton}
                                  onClick={() => handleStartEdit(q)}
                                  disabled={savingSafetyChecklist}
                                  title="Edit question"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.iconButton}
                                  onClick={() => handleMoveQuestion(q.id, 'up')}
                                  disabled={idx === 0 || savingSafetyChecklist}
                                  title="Move up"
                                >
                                  <ChevronUp size={14} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.iconButton}
                                  onClick={() => handleMoveQuestion(q.id, 'down')}
                                  disabled={idx === rootQuestions.length - 1 || savingSafetyChecklist}
                                  title="Move down"
                                >
                                  <ChevronDown size={14} />
                                </button>
                                <button
                                  type="button"
                                  className={styles.iconButton}
                                  onClick={() => handleDeleteQuestion(q.id)}
                                  disabled={savingSafetyChecklist}
                                  title="Delete question"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Conditional drop zone — only for Yes/No questions */}
                          {q.answerType === 'yes_no' && (
                            <div
                              className={`${styles.conditionalZone} ${isConditionalTarget ? styles.conditionalZoneActive : ''}`}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (draggingId && draggingId !== q.id) {
                                  setDropParentId(q.id);
                                  setDropBeforeId(null);
                                }
                              }}
                              onDragLeave={(e) => {
                                if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                  setDropParentId(null);
                                }
                              }}
                              onDrop={(e) => handleDropOnConditional(e, q.id)}
                            >
                              <p className={styles.conditionalZoneLabel}>
                                &#8627; If Yes, ask:
                              </p>

                              {children.map((child) => {
                                const isEditingChild = editingQuestionId === child.id;
                                return (
                                  <div
                                    key={child.id}
                                    className={`${styles.nestedQuestionRow} ${draggingId === child.id ? styles.dragging : ''}`}
                                    draggable={!isEditingChild}
                                    onDragStart={(e) => {
                                      e.stopPropagation();
                                      e.dataTransfer.effectAllowed = 'move';
                                      setDraggingId(child.id);
                                    }}
                                    onDragEnd={handleDragEnd}
                                  >
                                    {isEditingChild ? (
                                      <div className={styles.nestedEditRow}>
                                        <input
                                          type="text"
                                          className={styles.addQuestionInput}
                                          value={editText}
                                          onChange={(e) => setEditText(e.target.value)}
                                          autoFocus
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveEdit();
                                            if (e.key === 'Escape') handleCancelEdit();
                                          }}
                                        />
                                        <select
                                          className={styles.addQuestionSelect}
                                          value={editAnswerType}
                                          onChange={(e) =>
                                            setEditAnswerType(e.target.value as 'yes_no' | 'text')
                                          }
                                        >
                                          <option value="yes_no">Yes / No</option>
                                          <option value="text">Text</option>
                                        </select>
                                        <button
                                          type="button"
                                          className={styles.editSaveBtn}
                                          onClick={handleSaveEdit}
                                          disabled={!editText.trim()}
                                        >
                                          Save
                                        </button>
                                        <button
                                          type="button"
                                          className={styles.editCancelBtn}
                                          onClick={handleCancelEdit}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <GripVertical size={14} className={styles.dragHandle} />
                                        <span className={styles.nestedQuestionText}>
                                          {child.text}
                                        </span>
                                        <span className={styles.questionTypeBadge}>
                                          {child.answerType === 'yes_no' ? 'Yes / No' : 'Text'}
                                        </span>
                                        <div className={styles.nestedQuestionActions}>
                                          <button
                                            type="button"
                                            className={styles.iconButton}
                                            onClick={() => handleStartEdit(child)}
                                            title="Edit question"
                                          >
                                            <Edit2 size={12} />
                                          </button>
                                          <button
                                            type="button"
                                            className={styles.iconButton}
                                            onClick={() => handleUnNest(child.id)}
                                            title="Remove from conditional"
                                          >
                                            <X size={12} />
                                          </button>
                                          <button
                                            type="button"
                                            className={styles.iconButton}
                                            onClick={() => handleDeleteQuestion(child.id)}
                                            title="Delete question"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                );
                              })}

                              <p className={styles.conditionalDropHint}>
                                Drag questions here to ask when &ldquo;Yes&rdquo;
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className={styles.addQuestionForm}>
              <input
                type="text"
                className={styles.addQuestionInput}
                placeholder="Question text"
                value={newQuestionText}
                onChange={e => setNewQuestionText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddQuestion();
                }}
                disabled={savingSafetyChecklist}
              />
              <select
                className={styles.addQuestionSelect}
                value={newQuestionAnswerType}
                onChange={e =>
                  setNewQuestionAnswerType(e.target.value as 'yes_no' | 'text')
                }
                disabled={savingSafetyChecklist}
              >
                <option value="yes_no">Yes / No</option>
                <option value="text">Text</option>
              </select>
              <button
                type="button"
                className={styles.addQuestionBtn}
                onClick={handleAddQuestion}
                disabled={!newQuestionText.trim() || savingSafetyChecklist}
              >
                <Plus size={14} />
                Add
              </button>
            </div>
          </div>

          <div className={styles.safetyChecklistFooter}>
            <button
              onClick={handleSaveSafetyChecklist}
              className={styles.saveButton}
              disabled={savingSafetyChecklist}
            >
              {savingSafetyChecklist ? 'Saving...' : 'Save Safety Checklist'}
            </button>
          </div>
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
            setSuccess(
              editingCadence
                ? 'Cadence updated successfully'
                : 'Cadence created successfully'
            );
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
