'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
  X,
} from 'lucide-react';
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
  | 'salesChecklists';

interface ChecklistQuestion {
  id: string;
  text: string;
  answerType: 'yes_no' | 'text' | 'number' | 'dropdown';
  order: number;
  parentId?: string;
  minValue?: number | null;
  maxValue?: number | null;
  stepValue?: number | null;
  dropdownOptions?: string[] | null;
}

interface SalesChecklist {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  questions: ChecklistQuestion[];
  linkedPlanIds: string[];
}

interface ServicePlanOption {
  id: string;
  plan_name: string;
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
  const [salesChecklists, setSalesChecklists] = useState<SalesChecklist[]>([]);
  const [editingChecklist, setEditingChecklist] = useState<SalesChecklist | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [servicePlans, setServicePlans] = useState<ServicePlanOption[]>([]);
  const [loadingChecklists, setLoadingChecklists] = useState(false);
  const [savingChecklist, setSavingChecklist] = useState(false);
  // Edit panel state
  const [editName, setEditName] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);
  const [editLinkedPlanIds, setEditLinkedPlanIds] = useState<string[]>([]);
  const [editQuestions, setEditQuestions] = useState<ChecklistQuestion[]>([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionAnswerType, setNewQuestionAnswerType] = useState<
    'yes_no' | 'text' | 'number' | 'dropdown'
  >('yes_no');
  const [newQuestionMinValue, setNewQuestionMinValue] = useState<number | ''>('');
  const [newQuestionMaxValue, setNewQuestionMaxValue] = useState<number | ''>('');
  const [newQuestionStepValue, setNewQuestionStepValue] = useState<number | ''>('');
  const [newQuestionDropdownOptions, setNewQuestionDropdownOptions] = useState<string[]>([]);
  const [newQuestionOptionInput, setNewQuestionOptionInput] = useState('');
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null
  );
  const [editQuestionText, setEditQuestionText] = useState('');
  const [editQuestionAnswerType, setEditQuestionAnswerType] = useState<'yes_no' | 'text' | 'number' | 'dropdown'>(
    'yes_no'
  );
  const [editQuestionMinValue, setEditQuestionMinValue] = useState<number | ''>('');
  const [editQuestionMaxValue, setEditQuestionMaxValue] = useState<number | ''>('');
  const [editQuestionStepValue, setEditQuestionStepValue] = useState<number | ''>('');
  const [editQuestionDropdownOptions, setEditQuestionDropdownOptions] = useState<string[]>([]);
  const [editQuestionOptionInput, setEditQuestionOptionInput] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropBeforeId, setDropBeforeId] = useState<string | null>(null);
  const [dropParentId, setDropParentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SalesTab>('quickQuote');

  useEffect(() => {
    loadCadences();
    loadDefaultCadences();
    loadZipCodeGroups();
    loadSalesChecklists();
    loadServicePlans();
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

  const loadSalesChecklists = async () => {
    try {
      setLoadingChecklists(true);
      const res = await fetch(`/api/companies/${companyId}/sales-checklists`);
      if (!res.ok) return;
      const data = await res.json();
      setSalesChecklists(Array.isArray(data) ? data.map((cl: any) => ({
        id: cl.id,
        name: cl.name,
        displayOrder: cl.displayOrder,
        isActive: cl.isActive,
        questions: (cl.questions ?? []).map((q: any) => ({
          id: q.id,
          text: q.text,
          answerType: q.answerType,
          order: q.displayOrder,
          parentId: q.parentQuestionId ?? undefined,
          minValue: q.minValue ?? null,
          maxValue: q.maxValue ?? null,
          stepValue: q.stepValue ?? null,
          dropdownOptions: q.dropdownOptions ?? null,
        })),
        linkedPlanIds: cl.linkedPlanIds ?? [],
      })) : []);
    } catch {
      // Non-critical
    } finally {
      setLoadingChecklists(false);
    }
  };

  const loadServicePlans = async () => {
    try {
      const res = await fetch(`/api/companies/${companyId}/service-plans`);
      if (!res.ok) return;
      const data = await res.json();
      const plans = Array.isArray(data) ? data : (data.plans ?? data.data ?? []);
      setServicePlans(plans.map((p: any) => ({ id: p.id, plan_name: p.plan_name })));
    } catch {
      // Non-critical
    }
  };

  const openCreatePanel = () => {
    setEditingChecklist(null);
    setEditName('');
    setEditIsActive(true);
    setEditLinkedPlanIds([]);
    setEditQuestions([]);
    setNewQuestionText('');
    setNewQuestionAnswerType('yes_no');
    setNewQuestionMinValue('');
    setNewQuestionMaxValue('');
    setNewQuestionStepValue('');
    setNewQuestionDropdownOptions([]);
    setNewQuestionOptionInput('');
    setEditingQuestionId(null);
    setIsCreating(true);
  };

  const openEditPanel = (cl: SalesChecklist) => {
    setEditingChecklist(cl);
    setEditName(cl.name);
    setEditIsActive(cl.isActive);
    setEditLinkedPlanIds([...cl.linkedPlanIds]);
    setEditQuestions(cl.questions.map(q => ({ ...q })));
    setNewQuestionText('');
    setNewQuestionAnswerType('yes_no');
    setNewQuestionMinValue('');
    setNewQuestionMaxValue('');
    setNewQuestionStepValue('');
    setNewQuestionDropdownOptions([]);
    setNewQuestionOptionInput('');
    setEditingQuestionId(null);
    setIsCreating(true);
  };

  const closeEditPanel = () => {
    setIsCreating(false);
    setEditingChecklist(null);
  };

  const handleSaveChecklist = async () => {
    if (!editName.trim()) {
      setError('Checklist name is required');
      return;
    }
    try {
      setSavingChecklist(true);
      setError(null);

      const pendingQuestion: ChecklistQuestion | null = newQuestionText.trim()
        ? {
            id: crypto.randomUUID(),
            text: newQuestionText.trim(),
            answerType: newQuestionAnswerType,
            order: editQuestions.length,
            minValue: newQuestionAnswerType === 'number' && newQuestionMinValue !== '' ? newQuestionMinValue : null,
            maxValue: newQuestionAnswerType === 'number' && newQuestionMaxValue !== '' ? newQuestionMaxValue : null,
            stepValue: newQuestionAnswerType === 'number' && newQuestionStepValue !== '' ? newQuestionStepValue : null,
            dropdownOptions: newQuestionAnswerType === 'dropdown' ? newQuestionDropdownOptions : null,
          }
        : null;

      const effectiveQuestions = pendingQuestion
        ? [...editQuestions, pendingQuestion]
        : editQuestions;

      const payload = {
        name: editName.trim(),
        isActive: editIsActive,
        displayOrder: editingChecklist?.displayOrder ?? salesChecklists.length,
        questions: effectiveQuestions.map((q, idx) => ({
          id: q.id,
          text: q.text,
          answerType: q.answerType,
          displayOrder: idx,
          parentQuestionId: q.parentId ?? null,
          minValue: q.minValue ?? null,
          maxValue: q.maxValue ?? null,
          stepValue: q.stepValue ?? null,
          dropdownOptions: q.dropdownOptions ?? null,
        })),
        linkedPlanIds: editLinkedPlanIds,
      };
      let res: Response;
      if (editingChecklist) {
        res = await fetch(
          `/api/companies/${companyId}/sales-checklists/${editingChecklist.id}`,
          { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
        );
      } else {
        res = await fetch(
          `/api/companies/${companyId}/sales-checklists`,
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
        );
      }
      const resBody = await res.json();
      if (!res.ok) {
        throw new Error(resBody.error || 'Failed to save checklist');
      }
      setSuccess(editingChecklist ? 'Checklist updated' : 'Checklist created');
      closeEditPanel();
      await loadSalesChecklists();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save checklist');
    } finally {
      setSavingChecklist(false);
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    if (!confirm('Delete this checklist? This cannot be undone.')) return;
    try {
      setError(null);
      const res = await fetch(`/api/companies/${companyId}/sales-checklists/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccess('Checklist deleted');
      await loadSalesChecklists();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete checklist');
    }
  };

  const handleAddQuestion = () => {
    if (!newQuestionText.trim()) return;
    const newQuestion: ChecklistQuestion = {
      id: crypto.randomUUID(),
      text: newQuestionText.trim(),
      answerType: newQuestionAnswerType,
      order: editQuestions.length,
      minValue: newQuestionAnswerType === 'number' && newQuestionMinValue !== '' ? newQuestionMinValue : null,
      maxValue: newQuestionAnswerType === 'number' && newQuestionMaxValue !== '' ? newQuestionMaxValue : null,
      stepValue: newQuestionAnswerType === 'number' && newQuestionStepValue !== '' ? newQuestionStepValue : null,
      dropdownOptions: newQuestionAnswerType === 'dropdown' ? newQuestionDropdownOptions : null,
    };
    setEditQuestions(prev => [...prev, newQuestion]);
    setNewQuestionText('');
    setNewQuestionAnswerType('yes_no');
    setNewQuestionMinValue('');
    setNewQuestionMaxValue('');
    setNewQuestionStepValue('');
    setNewQuestionDropdownOptions([]);
    setNewQuestionOptionInput('');
  };

  const handleDeleteQuestion = (id: string) => {
    setEditQuestions(prev =>
      prev
        .filter(q => q.id !== id)
        .map((q, idx) => ({
          ...q,
          order: idx,
          parentId: q.parentId === id ? undefined : q.parentId,
        }))
    );
  };

  const handleUnNest = (id: string) => {
    setEditQuestions(prev =>
      prev.map(q => (q.id === id ? { ...q, parentId: undefined } : q))
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
    setEditQuestions(prev => {
      const dragging = prev.find(q => q.id === draggingId);
      if (!dragging) return prev;
      const withoutDragging = prev.filter(q => q.id !== draggingId);
      const cleared = { ...dragging, parentId: undefined };
      if (beforeId === null) {
        return [...withoutDragging, cleared].map((q, i) => ({
          ...q,
          order: i,
        }));
      }
      const idx = withoutDragging.findIndex(q => q.id === beforeId);
      const result =
        idx === -1
          ? [...withoutDragging, cleared]
          : [
              ...withoutDragging.slice(0, idx),
              cleared,
              ...withoutDragging.slice(idx),
            ];
      return result.map((q, i) => ({ ...q, order: i }));
    });
    handleDragEnd();
  };

  const handleDropOnConditional = (e: React.DragEvent, parentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggingId || draggingId === parentId) return;
    setEditQuestions(prev =>
      prev.map(q => (q.id === draggingId ? { ...q, parentId } : q))
    );
    handleDragEnd();
  };

  const handleMoveQuestion = (id: string, direction: 'up' | 'down') => {
    setEditQuestions(prev => {
      const rootIds = prev.filter(q => !q.parentId).map(q => q.id);
      const rootIdx = rootIds.indexOf(id);
      if (rootIdx < 0) return prev;
      const swapRootIdx = direction === 'up' ? rootIdx - 1 : rootIdx + 1;
      if (swapRootIdx < 0 || swapRootIdx >= rootIds.length) return prev;
      const swapId = rootIds[swapRootIdx];
      const idxA = prev.findIndex(q => q.id === id);
      const idxB = prev.findIndex(q => q.id === swapId);
      const next = [...prev];
      [next[idxA], next[idxB]] = [next[idxB], next[idxA]];
      return next.map((q, i) => ({ ...q, order: i }));
    });
  };

  const handleStartEditQuestion = (q: ChecklistQuestion) => {
    setEditingQuestionId(q.id);
    setEditQuestionText(q.text);
    setEditQuestionAnswerType(q.answerType);
    setEditQuestionMinValue(q.minValue ?? '');
    setEditQuestionMaxValue(q.maxValue ?? '');
    setEditQuestionStepValue(q.stepValue ?? '');
    setEditQuestionDropdownOptions(q.dropdownOptions ?? []);
    setEditQuestionOptionInput('');
  };

  const handleCancelEditQuestion = () => {
    setEditingQuestionId(null);
    setEditQuestionText('');
    setEditQuestionAnswerType('yes_no');
    setEditQuestionMinValue('');
    setEditQuestionMaxValue('');
    setEditQuestionStepValue('');
    setEditQuestionDropdownOptions([]);
    setEditQuestionOptionInput('');
  };

  const handleSaveEditQuestion = () => {
    if (!editingQuestionId || !editQuestionText.trim()) return;
    setEditQuestions(prev =>
      prev.map(q =>
        q.id === editingQuestionId
          ? {
              ...q,
              text: editQuestionText.trim(),
              answerType: editQuestionAnswerType,
              minValue: editQuestionAnswerType === 'number' && editQuestionMinValue !== '' ? editQuestionMinValue : null,
              maxValue: editQuestionAnswerType === 'number' && editQuestionMaxValue !== '' ? editQuestionMaxValue : null,
              stepValue: editQuestionAnswerType === 'number' && editQuestionStepValue !== '' ? editQuestionStepValue : null,
              dropdownOptions: editQuestionAnswerType === 'dropdown' ? editQuestionDropdownOptions : null,
            }
          : q
      )
    );
    handleCancelEditQuestion();
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
          className={`${styles.tabButton} ${activeTab === 'salesChecklists' ? styles.active : ''}`}
          onClick={() => setActiveTab('salesChecklists')}
        >
          Sales Checklists
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

      {activeTab === 'salesChecklists' && (
        <div className={styles.safetyChecklistCard}>
          {!isCreating ? (
            // ── List view ──────────────────────────────────────────────────
            <>
              <div className={styles.salesChecklistListHeader}>
                <div>
                  <h3>Sales Checklists</h3>
                  <p>
                    Create named checklists linked to service plans. Checklists
                    appear in the wizard when the customer&apos;s quote includes
                    a linked plan.
                  </p>
                </div>
                <button
                  type="button"
                  className={styles.saveButton}
                  onClick={openCreatePanel}
                >
                  <Plus size={14} />
                  Create Checklist
                </button>
              </div>

              {loadingChecklists ? (
                <p className={styles.questionsEmpty}>Loading&hellip;</p>
              ) : salesChecklists.length === 0 ? (
                <p className={styles.questionsEmpty}>
                  No checklists yet. Create one to get started.
                </p>
              ) : (
                <div className={styles.checklistRows}>
                  {salesChecklists.map(cl => (
                    <div key={cl.id} className={styles.checklistRow}>
                      <div className={styles.checklistRowInfo}>
                        <span className={styles.checklistRowName}>{cl.name}</span>
                        <span className={styles.checklistRowMeta}>
                          {cl.questions.filter(q => !q.parentId).length} question
                          {cl.questions.filter(q => !q.parentId).length !== 1 ? 's' : ''}
                          &nbsp;&middot;&nbsp;
                          {cl.linkedPlanIds.length} plan
                          {cl.linkedPlanIds.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {cl.isActive ? (
                        <span className={styles.activeBadge}>Active</span>
                      ) : (
                        <span className={styles.inactiveBadge}>Inactive</span>
                      )}
                      <div className={styles.checklistRowActions}>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() => openEditPanel(cl)}
                          title="Edit checklist"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          className={styles.iconButton}
                          onClick={() => handleDeleteChecklist(cl.id)}
                          title="Delete checklist"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            // ── Edit / Create panel ─────────────────────────────────────────
            <>
              <div className={styles.editPanelHeader}>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={closeEditPanel}
                >
                  &larr; Back
                </button>
                <h3>{editingChecklist ? 'Edit Checklist' : 'Create Checklist'}</h3>
              </div>

              <div className={styles.editPanelForm}>
                <div className={styles.editPanelField}>
                  <label className={styles.editPanelLabel}>Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    placeholder="e.g. Roof Safety Checklist"
                    disabled={savingChecklist}
                  />
                </div>

                <div className={styles.toggleRow}>
                  <span className={styles.toggleLabel}>Active</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={editIsActive}
                    className={`${styles.toggleSwitch} ${editIsActive ? styles.toggleOn : ''}`}
                    onClick={() => setEditIsActive(v => !v)}
                    disabled={savingChecklist}
                  >
                    <span className={styles.toggleThumb} />
                  </button>
                </div>

                {/* Linked service plans */}
                <div className={styles.editPanelSection}>
                  <p className={styles.questionsSectionTitle}>Linked Service Plans</p>
                  {servicePlans.length === 0 ? (
                    <p className={styles.questionsEmpty}>No service plans found.</p>
                  ) : (
                    <div className={styles.planCheckboxList}>
                      {servicePlans.map(plan => (
                        <label key={plan.id} className={styles.planCheckboxLabel}>
                          <input
                            type="checkbox"
                            checked={editLinkedPlanIds.includes(plan.id)}
                            onChange={e => {
                              if (e.target.checked) {
                                setEditLinkedPlanIds(prev => [...prev, plan.id]);
                              } else {
                                setEditLinkedPlanIds(prev =>
                                  prev.filter(id => id !== plan.id)
                                );
                              }
                            }}
                            disabled={savingChecklist}
                          />
                          {plan.plan_name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Questions */}
                <div className={styles.questionsSection}>
                  <p className={styles.questionsSectionTitle}>Questions</p>

                  {(() => {
                    const rootQuestions = editQuestions.filter(q => !q.parentId);
                    return (
                      <div
                        className={styles.questionsList}
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => handleDropOnRoot(e, null)}
                      >
                        {rootQuestions.length === 0 && (
                          <p className={styles.questionsEmpty}>
                            No questions added yet.
                          </p>
                        )}

                        {rootQuestions.map((q, idx) => {
                          const children = editQuestions.filter(
                            q2 => q2.parentId === q.id
                          );
                          const isEditing = editingQuestionId === q.id;
                          const isDraggingThis = draggingId === q.id;
                          const isDropTarget =
                            dropBeforeId === q.id &&
                            draggingId &&
                            draggingId !== q.id;
                          const isConditionalTarget = dropParentId === q.id;

                          return (
                            <div key={q.id} className={styles.questionGroupWrapper}>
                              {isDropTarget && (
                                <div className={styles.dropInsertLine} />
                              )}

                              <div
                                className={`${styles.questionGroup} ${isDraggingThis ? styles.dragging : ''}`}
                                draggable={!isEditing}
                                onDragStart={e => {
                                  e.dataTransfer.effectAllowed = 'move';
                                  setDraggingId(q.id);
                                }}
                                onDragEnd={handleDragEnd}
                              >
                                {isEditing ? (
                                  <div className={styles.questionEditRow}>
                                    <div className={styles.questionEditFields}>
                                      <div className={styles.questionEditTop}>
                                        <input
                                          type="text"
                                          className={styles.addQuestionInput}
                                          value={editQuestionText}
                                          onChange={e => setEditQuestionText(e.target.value)}
                                          autoFocus
                                          onKeyDown={e => {
                                            if (e.key === 'Enter') handleSaveEditQuestion();
                                            if (e.key === 'Escape') handleCancelEditQuestion();
                                          }}
                                        />
                                        <select
                                          className={styles.addQuestionSelect}
                                          value={editQuestionAnswerType}
                                          onChange={e =>
                                            setEditQuestionAnswerType(
                                              e.target.value as 'yes_no' | 'text' | 'number' | 'dropdown'
                                            )
                                          }
                                        >
                                          <option value="yes_no">Yes / No</option>
                                          <option value="text">Text</option>
                                          <option value="number">Number</option>
                                          <option value="dropdown">Dropdown</option>
                                        </select>
                                        {editQuestionAnswerType === 'number' && (
                                          <div className={styles.numberConfig}>
                                            <label>
                                              Min
                                              <input
                                                type="number"
                                                value={editQuestionMinValue}
                                                onChange={e => setEditQuestionMinValue(e.target.value === '' ? '' : Number(e.target.value))}
                                              />
                                            </label>
                                            <label>
                                              Max
                                              <input
                                                type="number"
                                                value={editQuestionMaxValue}
                                                onChange={e => setEditQuestionMaxValue(e.target.value === '' ? '' : Number(e.target.value))}
                                              />
                                            </label>
                                            <label>
                                              Step
                                              <input
                                                type="number"
                                                value={editQuestionStepValue}
                                                onChange={e => setEditQuestionStepValue(e.target.value === '' ? '' : Number(e.target.value))}
                                              />
                                            </label>
                                          </div>
                                        )}
                                        {editQuestionAnswerType === 'dropdown' && (
                                          <div className={styles.dropdownOptionsEditor}>
                                            <div className={styles.dropdownOptionsList}>
                                              {editQuestionDropdownOptions.map((opt, i) => (
                                                <span key={i} className={styles.dropdownOptionChip}>
                                                  {opt}
                                                  <button type="button" onClick={() => setEditQuestionDropdownOptions(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                                                </span>
                                              ))}
                                              {editQuestionDropdownOptions.length === 0 && (
                                                <span className={styles.dropdownOptionsEmpty}>No options added yet</span>
                                              )}
                                            </div>
                                            <div className={styles.dropdownOptionAdd}>
                                              <input
                                                type="text"
                                                placeholder="Add option..."
                                                value={editQuestionOptionInput}
                                                onChange={e => setEditQuestionOptionInput(e.target.value)}
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    if (editQuestionOptionInput.trim()) {
                                                      setEditQuestionDropdownOptions(prev => [...prev, editQuestionOptionInput.trim()]);
                                                      setEditQuestionOptionInput('');
                                                    }
                                                  }
                                                }}
                                              />
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  if (editQuestionOptionInput.trim()) {
                                                    setEditQuestionDropdownOptions(prev => [...prev, editQuestionOptionInput.trim()]);
                                                    setEditQuestionOptionInput('');
                                                  }
                                                }}
                                                disabled={!editQuestionOptionInput.trim()}
                                              >
                                                Add
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className={styles.questionEditActions}>
                                      <button
                                        type="button"
                                        className={styles.editSaveBtn}
                                        onClick={handleSaveEditQuestion}
                                        disabled={!editQuestionText.trim()}
                                      >
                                        Save
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.editCancelBtn}
                                        onClick={handleCancelEditQuestion}
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div
                                    className={styles.questionRow}
                                    onDragOver={e => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (draggingId && draggingId !== q.id) {
                                        setDropBeforeId(q.id);
                                        setDropParentId(null);
                                      }
                                    }}
                                    onDrop={e => handleDropOnRoot(e, q.id)}
                                  >
                                    <GripVertical
                                      size={16}
                                      className={styles.dragHandle}
                                    />
                                    <span className={styles.questionRowIndex}>
                                      {idx + 1}.
                                    </span>
                                    <span className={styles.questionRowLabel}>
                                      {q.text}
                                    </span>
                                    <span className={styles.questionTypeBadge}>
                                      {q.answerType === 'yes_no' ? 'Yes / No' : q.answerType === 'number' ? 'Number' : q.answerType === 'dropdown' ? 'Dropdown' : 'Text'}
                                    </span>
                                    <div className={styles.questionRowActions}>
                                      <button
                                        type="button"
                                        className={styles.iconButton}
                                        onClick={() => handleStartEditQuestion(q)}
                                        disabled={savingChecklist}
                                        title="Edit question"
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.iconButton}
                                        onClick={() => handleMoveQuestion(q.id, 'up')}
                                        disabled={idx === 0 || savingChecklist}
                                        title="Move up"
                                      >
                                        <ChevronUp size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.iconButton}
                                        onClick={() => handleMoveQuestion(q.id, 'down')}
                                        disabled={
                                          idx === rootQuestions.length - 1 ||
                                          savingChecklist
                                        }
                                        title="Move down"
                                      >
                                        <ChevronDown size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        className={styles.iconButton}
                                        onClick={() => handleDeleteQuestion(q.id)}
                                        disabled={savingChecklist}
                                        title="Delete question"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {q.answerType === 'yes_no' && (
                                  <div
                                    className={`${styles.conditionalZone} ${isConditionalTarget ? styles.conditionalZoneActive : ''}`}
                                    onDragOver={e => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (draggingId && draggingId !== q.id) {
                                        setDropParentId(q.id);
                                        setDropBeforeId(null);
                                      }
                                    }}
                                    onDragLeave={e => {
                                      if (
                                        !e.currentTarget.contains(
                                          e.relatedTarget as Node
                                        )
                                      ) {
                                        setDropParentId(null);
                                      }
                                    }}
                                    onDrop={e => handleDropOnConditional(e, q.id)}
                                  >
                                    <p className={styles.conditionalZoneLabel}>
                                      &#8627; If Yes, ask:
                                    </p>

                                    {children.map(child => {
                                      const isEditingChild =
                                        editingQuestionId === child.id;
                                      return (
                                        <div
                                          key={child.id}
                                          className={`${styles.nestedQuestionRow} ${draggingId === child.id ? styles.dragging : ''}`}
                                          draggable={!isEditingChild}
                                          onDragStart={e => {
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
                                                value={editQuestionText}
                                                onChange={e =>
                                                  setEditQuestionText(e.target.value)
                                                }
                                                autoFocus
                                                onKeyDown={e => {
                                                  if (e.key === 'Enter')
                                                    handleSaveEditQuestion();
                                                  if (e.key === 'Escape')
                                                    handleCancelEditQuestion();
                                                }}
                                              />
                                              <select
                                                className={styles.addQuestionSelect}
                                                value={editQuestionAnswerType}
                                                onChange={e =>
                                                  setEditQuestionAnswerType(
                                                    e.target.value as 'yes_no' | 'text' | 'number' | 'dropdown'
                                                  )
                                                }
                                              >
                                                <option value="yes_no">Yes / No</option>
                                                <option value="text">Text</option>
                                                <option value="number">Number</option>
                                                <option value="dropdown">Dropdown</option>
                                              </select>
                                              {editQuestionAnswerType === 'number' && (
                                                <div className={styles.numberConfig}>
                                                  <label>
                                                    Min
                                                    <input
                                                      type="number"
                                                      value={editQuestionMinValue}
                                                      onChange={e => setEditQuestionMinValue(e.target.value === '' ? '' : Number(e.target.value))}
                                                    />
                                                  </label>
                                                  <label>
                                                    Max
                                                    <input
                                                      type="number"
                                                      value={editQuestionMaxValue}
                                                      onChange={e => setEditQuestionMaxValue(e.target.value === '' ? '' : Number(e.target.value))}
                                                    />
                                                  </label>
                                                  <label>
                                                    Step
                                                    <input
                                                      type="number"
                                                      value={editQuestionStepValue}
                                                      onChange={e => setEditQuestionStepValue(e.target.value === '' ? '' : Number(e.target.value))}
                                                    />
                                                  </label>
                                                </div>
                                              )}
                                              {editQuestionAnswerType === 'dropdown' && (
                                                <div className={styles.dropdownOptionsEditor}>
                                                  <div className={styles.dropdownOptionsList}>
                                                    {editQuestionDropdownOptions.map((opt, i) => (
                                                      <span key={i} className={styles.dropdownOptionChip}>
                                                        {opt}
                                                        <button type="button" onClick={() => setEditQuestionDropdownOptions(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                                                      </span>
                                                    ))}
                                                    {editQuestionDropdownOptions.length === 0 && (
                                                      <span className={styles.dropdownOptionsEmpty}>No options added yet</span>
                                                    )}
                                                  </div>
                                                  <div className={styles.dropdownOptionAdd}>
                                                    <input
                                                      type="text"
                                                      placeholder="Add option..."
                                                      value={editQuestionOptionInput}
                                                      onChange={e => setEditQuestionOptionInput(e.target.value)}
                                                      onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                          e.preventDefault();
                                                          if (editQuestionOptionInput.trim()) {
                                                            setEditQuestionDropdownOptions(prev => [...prev, editQuestionOptionInput.trim()]);
                                                            setEditQuestionOptionInput('');
                                                          }
                                                        }
                                                      }}
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        if (editQuestionOptionInput.trim()) {
                                                          setEditQuestionDropdownOptions(prev => [...prev, editQuestionOptionInput.trim()]);
                                                          setEditQuestionOptionInput('');
                                                        }
                                                      }}
                                                      disabled={!editQuestionOptionInput.trim()}
                                                    >
                                                      Add
                                                    </button>
                                                  </div>
                                                </div>
                                              )}
                                              <button
                                                type="button"
                                                className={styles.editSaveBtn}
                                                onClick={handleSaveEditQuestion}
                                                disabled={!editQuestionText.trim()}
                                              >
                                                Save
                                              </button>
                                              <button
                                                type="button"
                                                className={styles.editCancelBtn}
                                                onClick={handleCancelEditQuestion}
                                              >
                                                Cancel
                                              </button>
                                            </div>
                                          ) : (
                                            <>
                                              <GripVertical
                                                size={14}
                                                className={styles.dragHandle}
                                              />
                                              <span className={styles.nestedQuestionText}>
                                                {child.text}
                                              </span>
                                              <span className={styles.questionTypeBadge}>
                                                {child.answerType === 'yes_no'
                                                  ? 'Yes / No'
                                                  : child.answerType === 'number'
                                                  ? 'Number'
                                                  : child.answerType === 'dropdown'
                                                  ? 'Dropdown'
                                                  : 'Text'}
                                              </span>
                                              <div className={styles.nestedQuestionActions}>
                                                <button
                                                  type="button"
                                                  className={styles.iconButton}
                                                  onClick={() => handleStartEditQuestion(child)}
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
                                                  onClick={() =>
                                                    handleDeleteQuestion(child.id)
                                                  }
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

                  <div className={styles.addQuestionFormWrapper}>
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
                        disabled={savingChecklist}
                      />
                      <select
                        className={styles.addQuestionSelect}
                        value={newQuestionAnswerType}
                        onChange={e =>
                          setNewQuestionAnswerType(e.target.value as 'yes_no' | 'text' | 'number' | 'dropdown')
                        }
                        disabled={savingChecklist}
                      >
                        <option value="yes_no">Yes / No</option>
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="dropdown">Dropdown</option>
                      </select>
                      <button
                        type="button"
                        className={styles.addQuestionBtn}
                        onClick={handleAddQuestion}
                        disabled={!newQuestionText.trim() || savingChecklist}
                      >
                        <Plus size={14} />
                        Add
                      </button>
                    </div>
                    {newQuestionAnswerType === 'number' && (
                      <div className={styles.numberConfig}>
                        <label>
                          Min
                          <input
                            type="number"
                            value={newQuestionMinValue}
                            onChange={e => setNewQuestionMinValue(e.target.value === '' ? '' : Number(e.target.value))}
                            disabled={savingChecklist}
                          />
                        </label>
                        <label>
                          Max
                          <input
                            type="number"
                            value={newQuestionMaxValue}
                            onChange={e => setNewQuestionMaxValue(e.target.value === '' ? '' : Number(e.target.value))}
                            disabled={savingChecklist}
                          />
                        </label>
                        <label>
                          Step
                          <input
                            type="number"
                            value={newQuestionStepValue}
                            onChange={e => setNewQuestionStepValue(e.target.value === '' ? '' : Number(e.target.value))}
                            disabled={savingChecklist}
                          />
                        </label>
                      </div>
                    )}
                    {newQuestionAnswerType === 'dropdown' && (
                      <div className={styles.dropdownOptionsEditor}>
                        <div className={styles.dropdownOptionsList}>
                          {newQuestionDropdownOptions.map((opt, i) => (
                            <span key={i} className={styles.dropdownOptionChip}>
                              {opt}
                              <button type="button" onClick={() => setNewQuestionDropdownOptions(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                            </span>
                          ))}
                          {newQuestionDropdownOptions.length === 0 && (
                            <span className={styles.dropdownOptionsEmpty}>No options added yet</span>
                          )}
                        </div>
                        <div className={styles.dropdownOptionAdd}>
                          <input
                            type="text"
                            placeholder="Add option..."
                            value={newQuestionOptionInput}
                            onChange={e => setNewQuestionOptionInput(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                if (newQuestionOptionInput.trim()) {
                                  setNewQuestionDropdownOptions(prev => [...prev, newQuestionOptionInput.trim()]);
                                  setNewQuestionOptionInput('');
                                }
                              }
                            }}
                            disabled={savingChecklist}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (newQuestionOptionInput.trim()) {
                                setNewQuestionDropdownOptions(prev => [...prev, newQuestionOptionInput.trim()]);
                                setNewQuestionOptionInput('');
                              }
                            }}
                            disabled={!newQuestionOptionInput.trim() || savingChecklist}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.safetyChecklistFooter}>
                <button
                  type="button"
                  className={styles.editCancelBtn}
                  onClick={closeEditPanel}
                  disabled={savingChecklist}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveChecklist}
                  className={styles.saveButton}
                  disabled={savingChecklist || !editName.trim()}
                >
                  {savingChecklist ? 'Saving...' : 'Save Checklist'}
                </button>
              </div>
            </>
          )}
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
