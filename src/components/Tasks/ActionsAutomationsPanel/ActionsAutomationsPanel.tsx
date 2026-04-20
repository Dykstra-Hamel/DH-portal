'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, MessageSquare, Mail, Zap, ChevronRight } from 'lucide-react';
import { DataTable, ColumnDefinition, CardViewConfig } from '@/components/Common/DataTable';
import { MiniAvatar } from '@/components/Common/MiniAvatar/MiniAvatar';
import { Task } from '@/types/task';
import { createClient } from '@/lib/supabase/client';
import {
  createTaskChannel,
  subscribeToTaskUpdates,
  TaskUpdatePayload,
} from '@/lib/realtime/task-channel';
import styles from './ActionsAutomationsPanel.module.scss';
import tabStyles from '@/components/Common/DataTable/DataTableTabs.module.scss';

// ─── Types ───────────────────────────────────────────────────────────────────

type LeftPanelView = 'actions' | 'automations';
type ActionsTab = 'due_today' | 'upcoming' | 'in_the_past';
type AutomationsTab = 'all' | 'in_process' | 'quoted' | 'scheduling';
type AutomatedActionType = 'email' | 'text_message' | 'ai_call';
type ActionIconType = 'phone' | 'text' | 'email' | 'other';

interface CadenceStep {
  id: string;
  action_type: string;
  display_order: number;
  description: string | null;
}

interface WorkflowTimelineEntry {
  step: { type: string; delay_minutes?: number; [key: string]: unknown };
  estimatedAt: Date;
  isCompleted: boolean;
}

interface ActiveExecution {
  id: string;
  execution_status: string;
  execution_data: { stepResults?: { stepIndex: number; completedAt: string }[] } | null;
  started_at: string;
  workflow: { id: string; name: string; workflow_steps: WorkflowTimelineEntry['step'][] } | null;
}

export interface LeadWithCadence {
  id: string;
  lead_status: string;
  customer: { first_name: string | null; last_name: string | null } | null;
  service_address: { city: string | null; state: string | null; zip_code: string | null } | null;
  cadence_assignment: {
    id: string;
    started_at: string;
    paused_at: string | null;
    completed_at: string | null;
    cadence: {
      id: string;
      name: string;
      steps: CadenceStep[];
    } | null;
  }[];
  cadence_progress: { id: string; cadence_step_id: string }[];
  active_execution: ActiveExecution[];
}

export interface LeadData {
  id: string;
  lead_status: string;
  customer: { first_name: string | null; last_name: string | null } | null;
  service_address: {
    city: string | null;
    state: string | null;
    zip_code: string | null;
  } | null;
}

export interface ActionsAutomationsPanelProps {
  companyId: string;
  userId: string;
  onCountChange?: (count: number) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIONS_TABS: { key: ActionsTab; label: string }[] = [
  { key: 'due_today', label: 'Due Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'in_the_past', label: 'In The Past' },
];

const AUTOMATIONS_TABS: { key: AutomationsTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_process', label: 'Working' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'scheduling', label: 'Scheduling' },
];

// Cadence step types that appear in the Automations tab
const AUTOMATED_STEP_TYPES_ALL = ['email', 'text_message', 'ai_call', 'trigger_workflow'];

const CADENCE_STEP_LABELS: Record<AutomatedActionType, string> = {
  email: 'Send Email',
  text_message: 'Send Text',
  ai_call: 'AI Call',
};

const WORKFLOW_STEP_LABELS: Record<string, string> = {
  send_email: 'Email Customer',
  send_sms: 'Text Customer',
  make_call: 'Call Customer',
  conditional: 'Decision',
  update_lead_status: 'Update Status',
};

const WORKFLOW_ACTION_TYPES = new Set(['send_email', 'send_sms', 'make_call', 'conditional', 'update_lead_status']);
const WORKFLOW_DELAY_TYPES = new Set(['delay', 'wait']);

const ACTION_ICONS: Record<ActionIconType, React.ElementType> = {
  phone: Phone,
  text: MessageSquare,
  email: Mail,
  other: Zap,
};

// ─── Pure helpers ─────────────────────────────────────────────────────────────

const toArray = <T,>(val: T | T[] | null | undefined): T[] => {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

function buildWorkflowStepTimeline(
  steps: WorkflowTimelineEntry['step'][],
  stepResults: { stepIndex: number; completedAt: string }[],
  startedAt: string
): WorkflowTimelineEntry[] {
  const base = new Date(startedAt);
  let accumulatedMs = 0;
  const result: WorkflowTimelineEntry[] = [];
  steps.forEach((step, index) => {
    if (WORKFLOW_DELAY_TYPES.has(step.type)) {
      const mins = (step.delay_minutes as number) || (step.delay as number) || 0;
      accumulatedMs += mins * 60 * 1000;
    } else if (WORKFLOW_ACTION_TYPES.has(step.type)) {
      accumulatedMs += (step.delay_minutes || 0) * 60 * 1000;
      const completedResult = stepResults.find(r => r.stepIndex === index);
      result.push({
        step,
        estimatedAt: new Date(base.getTime() + accumulatedMs),
        isCompleted: !!completedResult,
      });
    }
  });
  return result;
}

function formatWorkflowDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = String(date.getFullYear()).slice(2);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'pm' : 'am';
  const h = hours % 12 || 12;
  return `${month}/${day}/${year} - ${h}:${minutes}${ampm}`;
}

const getActiveExecution = (lead: LeadWithCadence) =>
  toArray(lead.active_execution).find(
    e => e.execution_status === 'pending' || e.execution_status === 'running'
  ) ?? null;

interface NextAutomatedAction {
  label: string;
  subtitle: string | null;
}

const getNextAutomatedAction = (lead: LeadWithCadence): NextAutomatedAction | null => {
  const activeExec = getActiveExecution(lead);
  if (activeExec) {
    if (!activeExec.workflow?.workflow_steps?.length) {
      return { label: 'Automation Running', subtitle: null };
    }
    const stepResults = activeExec.execution_data?.stepResults ?? [];
    const timeline = buildWorkflowStepTimeline(
      activeExec.workflow.workflow_steps,
      stepResults,
      activeExec.started_at
    );
    const nextWorkflowStep = timeline.find(t => !t.isCompleted);
    if (!nextWorkflowStep) return { label: 'Automation Running', subtitle: null };
    return {
      label: WORKFLOW_STEP_LABELS[nextWorkflowStep.step.type] ?? nextWorkflowStep.step.type,
      subtitle: formatWorkflowDate(nextWorkflowStep.estimatedAt),
    };
  }

  const assignments = toArray(lead.cadence_assignment);
  const activeAssignment = assignments.find(ca => ca.completed_at === null);
  if (!activeAssignment?.cadence) return null;

  const completedIds = new Set(toArray(lead.cadence_progress).map(p => p.cadence_step_id));
  const nextCadenceStep = activeAssignment.cadence.steps
    .filter(
      s =>
        !completedIds.has(s.id) &&
        (s.action_type === 'email' ||
          s.action_type === 'text_message' ||
          s.action_type === 'ai_call')
    )
    .sort((a, b) => a.display_order - b.display_order)[0] ?? null;

  if (!nextCadenceStep) return null;

  return {
    label: CADENCE_STEP_LABELS[nextCadenceStep.action_type as AutomatedActionType],
    subtitle: nextCadenceStep.description,
  };
};

const getLeadStatusProgress = (status: string): number => {
  const map: Record<string, number> = {
    new: 25,
    in_process: 50,
    quoted: 75,
    scheduling: 100,
    won: 100,
    lost: 100,
  };
  return map[status] ?? 0;
};

const getLeadStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    new: 'New',
    in_process: 'Working',
    quoted: 'Quoting',
    scheduling: 'Scheduling',
    won: 'Won',
    lost: 'Lost',
  };
  return map[status] ?? status;
};

const getOverdueDays = (dueDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + 'T00:00:00');
  return Math.max(0, Math.floor((today.getTime() - due.getTime()) / 86400000));
};

const getTodayStr = () => new Date().toISOString().split('T')[0];

const formatDueDate = (dateStr: string): string => {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
};

const parseActionInfo = (title: string): { label: string; iconType: ActionIconType } => {
  const lower = title.toLowerCase();

  let time = '';
  if (lower.includes('morning')) time = 'Morning';
  else if (lower.includes('afternoon')) time = 'Afternoon';
  else if (lower.includes('evening')) time = 'Evening';
  else if (lower.includes('night')) time = 'Night';

  let type = '';
  let iconType: ActionIconType = 'other';
  if (lower.includes('call') || lower.includes('phone')) {
    type = 'Call';
    iconType = 'phone';
  } else if (lower.includes('text') || lower.includes('sms')) {
    type = 'Text';
    iconType = 'text';
  } else if (lower.includes('email')) {
    type = 'Email';
    iconType = 'email';
  }

  const label = [time, type].filter(Boolean).join(' ') || title;
  return { label, iconType };
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ActionsAutomationsPanel({
  companyId,
  userId,
  onCountChange,
}: ActionsAutomationsPanelProps) {
  const router = useRouter();
  const [actions, setActions] = useState<Task[]>([]);
  const [leadDataMap, setLeadDataMap] = useState<Record<string, LeadData>>({});
  const [loading, setLoading] = useState(true);
  const [leftPanelView, setLeftPanelView] = useState<LeftPanelView>('actions');
  const [automationExecutions, setAutomationExecutions] = useState<LeadWithCadence[]>([]);
  const [automationsLoading, setAutomationsLoading] = useState(false);
  const [automationsTab, setAutomationsTab] = useState<AutomationsTab>('all');
  const [actionsTab, setActionsTab] = useState<ActionsTab>('due_today');

  // ── Data fetching ────────────────────────────────────────────────────────

  const fetchLeadData = useCallback(async (actionTasks: Task[]) => {
    const leadIds = actionTasks
      .filter(t => t.related_entity_type === 'leads' && t.related_entity_id)
      .map(t => t.related_entity_id!);

    if (leadIds.length === 0) {
      setLeadDataMap({});
      return;
    }

    try {
      const supabase = createClient();
      const { data: leads } = await supabase
        .from('leads')
        .select(
          'id, lead_status, customer:customers(first_name, last_name), service_address:service_addresses(city, state, zip_code)'
        )
        .in('id', leadIds);

      if (leads) {
        const map: Record<string, LeadData> = {};
        (leads as unknown as LeadData[]).forEach(lead => {
          map[lead.id] = lead;
        });
        setLeadDataMap(map);
      }
    } catch (error) {
      console.error('Error fetching lead data for actions:', error);
    }
  }, []);

  const fetchAutomations = useCallback(async () => {
    try {
      setAutomationsLoading(true);
      const supabase = createClient();
      const { data } = await supabase
        .from('leads')
        .select(`
          id,
          lead_status,
          customer:customers(first_name, last_name),
          service_address:service_addresses(city, state, zip_code),
          cadence_assignment:lead_cadence_assignments(
            id, started_at, paused_at, completed_at,
            cadence:sales_cadences(id, name, steps:sales_cadence_steps(id, action_type, display_order, description))
          ),
          cadence_progress:lead_cadence_progress(id, cadence_step_id),
          active_execution:automation_executions!automation_executions_lead_id_fkey(
            id, execution_status, execution_data, started_at,
            workflow:automation_workflows(id, name, workflow_steps)
          )
        `)
        .eq('company_id', companyId)
        .eq('assigned_to', userId)
        .not('lead_status', 'in', '("won","lost")');

      if (data) {
        const filtered = (data as unknown as LeadWithCadence[]).filter(
          lead => getNextAutomatedAction(lead) !== null
        );
        setAutomationExecutions(filtered);
      }
    } catch (err) {
      console.error('Error fetching automations:', err);
    } finally {
      setAutomationsLoading(false);
    }
  }, [companyId, userId]);

  const fetchMyActions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        companyId,
        assignedTo: userId,
        includeArchived: 'false',
      });

      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');

      const data = await response.json();
      const allTasks: Task[] = Array.isArray(data.tasks) ? data.tasks : [];
      const actionTasks = allTasks.filter(
        t => t.cadence_step_id && t.status !== 'completed'
      );

      setActions(actionTasks);
      await fetchLeadData(actionTasks);
    } catch (err) {
      console.error('Error fetching action tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [companyId, userId, fetchLeadData]);

  useEffect(() => {
    fetchMyActions();
  }, [fetchMyActions]);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  // ── Realtime subscription (cadence/action tasks only) ───────────────────

  useEffect(() => {
    const channel = createTaskChannel(companyId);

    subscribeToTaskUpdates(channel, async (payload: TaskUpdatePayload) => {
      const { company_id, action, record_id } = payload;
      if (company_id !== companyId) return;

      if (action === 'INSERT' || action === 'UPDATE') {
        try {
          const supabase = createClient();
          const { data: fullTask } = await supabase
            .from('tasks')
            .select(
              `*,
              company:companies(id, name),
              assigned_user:profiles!tasks_assigned_to_fkey(id, first_name, last_name, email)`
            )
            .eq('id', record_id)
            .single();

          if (!fullTask) return;

          const isAssignedToMe = fullTask.assigned_to === userId;
          const isCompleted = fullTask.status === 'completed';
          const isAction = Boolean(fullTask.cadence_step_id);

          if (isAssignedToMe && !isCompleted && isAction) {
            setActions(prev => {
              const exists = prev.some(t => t.id === fullTask.id);
              return exists
                ? prev.map(t => (t.id === fullTask.id ? fullTask : t))
                : [fullTask, ...prev];
            });
            if (
              fullTask.related_entity_type === 'leads' &&
              fullTask.related_entity_id
            ) {
              const { data: lead } = await supabase
                .from('leads')
                .select(
                  'id, lead_status, customer:customers(first_name, last_name), service_address:service_addresses(city, state, zip_code)'
                )
                .eq('id', fullTask.related_entity_id)
                .single();
              if (lead) {
                setLeadDataMap(prev => ({
                  ...prev,
                  [(lead as unknown as LeadData).id]: lead as unknown as LeadData,
                }));
              }
            }
          } else if (isAction) {
            setActions(prev => prev.filter(t => t.id !== record_id));
          }
        } catch (error) {
          console.error('Error handling action task realtime update:', error);
        }
      } else if (action === 'DELETE') {
        setActions(prev => prev.filter(t => t.id !== record_id));
      }
    });

    return () => {
      createClient().removeChannel(channel);
    };
  }, [companyId, userId]);

  // ── Notify parent of count changes ───────────────────────────────────────

  useEffect(() => {
    onCountChange?.(actions.length);
  }, [actions.length, onCountChange]);

  // ── Derived state ─────────────────────────────────────────────────────────

  const automationsTabCounts = useMemo(
    () => ({
      all: automationExecutions.length,
      in_process: automationExecutions.filter(l => l.lead_status === 'in_process').length,
      quoted: automationExecutions.filter(l => l.lead_status === 'quoted').length,
      scheduling: automationExecutions.filter(l => l.lead_status === 'scheduling').length,
    }),
    [automationExecutions]
  );

  const filteredAutomations = useMemo(
    () =>
      automationsTab === 'all'
        ? automationExecutions
        : automationExecutions.filter(l => l.lead_status === automationsTab),
    [automationExecutions, automationsTab]
  );

  const actionTabCounts = useMemo(() => {
    const today = getTodayStr();
    return {
      due_today: actions.filter(a => a.due_date === today).length,
      upcoming: actions.filter(a => !a.due_date || a.due_date > today).length,
      in_the_past: actions.filter(a => !!a.due_date && a.due_date < today).length,
    };
  }, [actions]);

  const filteredActions = useMemo(() => {
    const today = getTodayStr();
    return actions.filter(action => {
      if (!action.due_date) return actionsTab === 'upcoming';
      if (actionsTab === 'due_today') return action.due_date === today;
      if (actionsTab === 'upcoming') return action.due_date > today;
      return action.due_date < today;
    });
  }, [actions, actionsTab]);

  // ── Event handlers ────────────────────────────────────────────────────────

  const handleActionRowClick = useCallback(
    (task: Task) => {
      if (task.related_entity_type === 'leads' && task.related_entity_id) {
        router.push(`/tickets/leads/${task.related_entity_id}`);
      } else {
        router.push(`/tickets/tasks/${task.id}`);
      }
    },
    [router]
  );

  const handleActionItemAction = useCallback(
    (action: string, task: Task) => {
      if (action === 'navigate') handleActionRowClick(task);
    },
    [handleActionRowClick]
  );

  const handleAutomationRowClick = useCallback(
    (lead: LeadWithCadence) => {
      router.push(`/tickets/leads/${lead.id}`);
    },
    [router]
  );

  const handleAutomationItemAction = useCallback(
    (action: string, lead: LeadWithCadence) => {
      if (action === 'navigate') handleAutomationRowClick(lead);
    },
    [handleAutomationRowClick]
  );

  // ── Column definitions ────────────────────────────────────────────────────

  const actionsColumns = useMemo<ColumnDefinition<Task>[]>(
    () => [
      {
        key: 'customer',
        title: 'Customer',
        render: (action: Task) => {
          const leadData = action.related_entity_id
            ? leadDataMap[action.related_entity_id]
            : null;
          const customer = leadData?.customer;
          const customerName = customer
            ? `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim()
            : '';
          const addr = leadData?.service_address;
          const addressLine = addr
            ? [addr.city, addr.state, addr.zip_code].filter(Boolean).join(', ')
            : '';
          return (
            <div className={styles.customerCell}>
              {customerName && (
                <span className={styles.customerName}>{customerName}</span>
              )}
              {addressLine && (
                <span className={styles.customerAddress}>{addressLine}</span>
              )}
            </div>
          );
        },
      },
      {
        key: 'current_action',
        title: 'Current Action',
        render: (action: Task, onAction) => {
          const today = getTodayStr();
          const isOverdue = action.due_date ? action.due_date < today : false;
          const overdueDays =
            action.due_date && isOverdue ? getOverdueDays(action.due_date) : 0;
          const { label: actionLabel, iconType } = parseActionInfo(action.title);
          const ActionIcon = ACTION_ICONS[iconType];
          return (
            <div className={styles.leadCell}>
              <button
                className={`${styles.actionBtn} ${isOverdue ? styles.actionBtnOverdue : ''}`}
                onClick={e => {
                  e.stopPropagation();
                  onAction?.('navigate', action);
                }}
              >
                <ActionIcon size={13} />
                {actionLabel}
              </button>
              {isOverdue && overdueDays > 0 && (
                <span className={styles.overdueLabel}>
                  <span className={styles.overdueCircle} />
                  Overdue {overdueDays} {overdueDays === 1 ? 'day' : 'days'}
                </span>
              )}
              {!isOverdue && action.due_date && action.due_date > today && (
                <span className={styles.dueDateLabel}>
                  Due {formatDueDate(action.due_date)}
                </span>
              )}
            </div>
          );
        },
      },
      {
        key: 'progress',
        title: 'Progress',
        render: (action: Task) => {
          const leadData = action.related_entity_id
            ? leadDataMap[action.related_entity_id]
            : null;
          const leadStatus =
            leadData?.lead_status ?? action.related_entity?.status ?? '';
          if (!leadStatus) return null;
          const today = getTodayStr();
          const isOverdue = action.due_date ? action.due_date < today : false;
          const progress = getLeadStatusProgress(leadStatus);
          return (
            <div className={styles.progressCell}>
              <span
                className={`${styles.progressLabel} ${isOverdue ? styles.progressLabelOverdue : ''}`}
              >
                {getLeadStatusLabel(leadStatus)}
              </span>
              <div className={styles.progressTrack}>
                <div
                  className={`${styles.progressFill} ${isOverdue ? styles.progressFillOverdue : ''}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        },
      },
    ],
    [leadDataMap]
  );

  const automationColumns = useMemo<ColumnDefinition<LeadWithCadence>[]>(
    () => [
      {
        key: 'customer',
        title: 'Customer',
        render: (lead: LeadWithCadence) => {
          const customer = lead.customer;
          const customerName = customer
            ? `${customer.first_name ?? ''} ${customer.last_name ?? ''}`.trim()
            : '';
          const addr = lead.service_address;
          const addressLine = addr
            ? [addr.city, addr.state, addr.zip_code].filter(Boolean).join(', ')
            : '';
          return (
            <div className={styles.customerCell}>
              {customerName && (
                <span className={styles.customerName}>{customerName}</span>
              )}
              {addressLine && (
                <span className={styles.customerAddress}>{addressLine}</span>
              )}
            </div>
          );
        },
      },
      {
        key: 'next_action',
        title: 'Next Action',
        render: (lead: LeadWithCadence) => {
          const next = getNextAutomatedAction(lead);
          if (!next) return <span>—</span>;
          return (
            <div className={styles.leadCell}>
              <span>{next.label}</span>
              {next.subtitle && (
                <span className={styles.customerAddress}>{next.subtitle}</span>
              )}
            </div>
          );
        },
      },
      {
        key: 'progress',
        title: 'Progress',
        render: (lead: LeadWithCadence) => {
          const activeExec = getActiveExecution(lead);
          if (activeExec?.workflow?.workflow_steps?.length) {
            const stepResults = activeExec.execution_data?.stepResults ?? [];
            const timeline = buildWorkflowStepTimeline(
              activeExec.workflow.workflow_steps,
              stepResults,
              activeExec.started_at
            );
            const total = timeline.length;
            const completed = timeline.filter(t => t.isCompleted).length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <div className={styles.progressCell}>
                <span className={styles.progressLabel}>
                  {completed}/{total} Steps
                </span>
                <div className={styles.progressTrack}>
                  <div
                    className={styles.progressFill}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          }

          const assignments = toArray(lead.cadence_assignment);
          const activeAssignment = assignments.find(ca => ca.completed_at === null);
          const allSteps = activeAssignment?.cadence?.steps ?? [];
          const completedIds = new Set(
            toArray(lead.cadence_progress).map(p => p.cadence_step_id)
          );
          const automatedSteps = allSteps.filter(s =>
            AUTOMATED_STEP_TYPES_ALL.includes(s.action_type)
          );
          const completedAutomated = automatedSteps.filter(s =>
            completedIds.has(s.id)
          ).length;
          const totalAutomated = automatedSteps.length;
          const pct =
            totalAutomated > 0
              ? Math.round((completedAutomated / totalAutomated) * 100)
              : 0;
          return (
            <div className={styles.progressCell}>
              <span className={styles.progressLabel}>
                {completedAutomated}/{totalAutomated} Steps
              </span>
              <div className={styles.progressTrack}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        },
      },
    ],
    []
  );

  // ── Card view configs (narrow viewports) ──────────────────────────────────

  const actionsCardView = useMemo<CardViewConfig<Task>>(() => ({
    topFields: [
      {
        key: 'due_date',
        label: 'Due',
        render: action => {
          if (!action.due_date) return '—';
          const today = getTodayStr();
          if (action.due_date < today) {
            const days = getOverdueDays(action.due_date);
            return `Overdue ${days}d`;
          }
          return formatDueDate(action.due_date);
        },
      },
      {
        key: 'customer',
        label: 'Client Name',
        render: action => {
          const leadData = action.related_entity_id
            ? leadDataMap[action.related_entity_id]
            : null;
          const c = leadData?.customer;
          const name = c ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() : '';
          return name || '—';
        },
      },
      {
        key: 'location',
        label: 'Location',
        render: action => {
          const leadData = action.related_entity_id
            ? leadDataMap[action.related_entity_id]
            : null;
          return leadData?.service_address?.city || '—';
        },
      },
      {
        key: 'action_type',
        label: 'Action',
        render: action => parseActionInfo(action.title).label,
      },
    ],
    summary: {
      label: 'Task:',
      render: action => action.description?.trim() || action.title || '—',
    },
    avatar: action => {
      const u = action.assigned_user;
      if (!u) return null;
      return (
        <MiniAvatar
          firstName={u.first_name}
          lastName={u.last_name}
          email={u.email ?? ''}
          userId={u.id}
          size="medium"
          showTooltip={false}
        />
      );
    },
    statusBar: action => {
      const leadData = action.related_entity_id
        ? leadDataMap[action.related_entity_id]
        : null;
      const leadStatus = leadData?.lead_status ?? '';
      if (!leadStatus) return null;
      const today = getTodayStr();
      const isOverdue = action.due_date ? action.due_date < today : false;
      const progress = getLeadStatusProgress(leadStatus);
      return (
        <div className={styles.progressCell}>
          <span
            className={`${styles.progressLabel} ${isOverdue ? styles.progressLabelOverdue : ''}`}
          >
            {getLeadStatusLabel(leadStatus)}
          </span>
          <div className={styles.progressTrack}>
            <div
              className={`${styles.progressFill} ${isOverdue ? styles.progressFillOverdue : ''}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      );
    },
    primaryAction: action => (
      <button
        type="button"
        className={styles.actionBtn}
        onClick={() => handleActionRowClick(action)}
      >
        View
        <ChevronRight size={16} />
      </button>
    ),
  }), [leadDataMap, handleActionRowClick]);

  const automationsCardView = useMemo<CardViewConfig<LeadWithCadence>>(() => ({
    topFields: [
      {
        key: 'client',
        label: 'Client Name',
        render: lead => {
          const c = lead.customer;
          const name = c ? `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() : '';
          return name || '—';
        },
      },
      {
        key: 'location',
        label: 'Location',
        render: lead => lead.service_address?.city || '—',
      },
      {
        key: 'next_action',
        label: 'Next Action',
        render: lead => getNextAutomatedAction(lead)?.label ?? '—',
      },
      {
        key: 'scheduled',
        label: 'Scheduled',
        render: lead => getNextAutomatedAction(lead)?.subtitle ?? '—',
      },
    ],
    summary: {
      label: 'Status:',
      render: lead => getLeadStatusLabel(lead.lead_status),
    },
    statusBar: lead => {
      const activeExec = getActiveExecution(lead);
      let completed = 0;
      let total = 0;
      if (activeExec?.workflow?.workflow_steps?.length) {
        const stepResults = activeExec.execution_data?.stepResults ?? [];
        const timeline = buildWorkflowStepTimeline(
          activeExec.workflow.workflow_steps,
          stepResults,
          activeExec.started_at
        );
        total = timeline.length;
        completed = timeline.filter(t => t.isCompleted).length;
      } else {
        const assignments = toArray(lead.cadence_assignment);
        const activeAssignment = assignments.find(ca => ca.completed_at === null);
        const allSteps = activeAssignment?.cadence?.steps ?? [];
        const completedIds = new Set(
          toArray(lead.cadence_progress).map(p => p.cadence_step_id)
        );
        const automatedSteps = allSteps.filter(s =>
          AUTOMATED_STEP_TYPES_ALL.includes(s.action_type)
        );
        total = automatedSteps.length;
        completed = automatedSteps.filter(s => completedIds.has(s.id)).length;
      }
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      return (
        <div className={styles.progressCell}>
          <span className={styles.progressLabel}>
            {completed}/{total} Steps
          </span>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    },
    primaryAction: lead => (
      <button
        type="button"
        className={styles.actionBtn}
        onClick={() => handleAutomationRowClick(lead)}
      >
        View
        <ChevronRight size={16} />
      </button>
    ),
  }), [handleAutomationRowClick]);

  const actionsEmptyMessage =
    actionsTab === 'due_today'
      ? 'No actions due today.'
      : actionsTab === 'upcoming'
        ? 'No upcoming actions.'
        : 'No past actions.';

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className={styles.panel}>
      <div className={styles.panelHeader}>
        <div className={styles.panelViewSwitcher}>
          <button
            className={`${styles.panelViewTitle} ${leftPanelView === 'actions' ? styles.panelViewTitleActive : ''}`}
            onClick={() => setLeftPanelView('actions')}
          >
            My Actions
          </button>
          <button
            className={`${styles.panelViewTitle} ${leftPanelView === 'automations' ? styles.panelViewTitleActive : ''}`}
            onClick={() => setLeftPanelView('automations')}
          >
            Automations
          </button>
        </div>
      </div>

      {leftPanelView === 'actions' ? (
        <>
          <div className={tabStyles.tabsRow}>
            <div className={tabStyles.tabsSection}>
              {ACTIONS_TABS.map(tab => (
                <button
                  key={tab.key}
                  className={`${tabStyles.tab} ${actionsTab === tab.key ? tabStyles.active : ''}`}
                  onClick={() => setActionsTab(tab.key)}
                >
                  {tab.label}
                  <span className={tabStyles.tabCount}>
                    {actionTabCounts[tab.key]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <DataTable<Task>
            data={filteredActions}
            title=""
            columns={actionsColumns}
            cardView={actionsCardView}
            loading={loading}
            emptyStateMessage={actionsEmptyMessage}
            onItemAction={handleActionItemAction}
            customColumnWidths="1fr 1fr 1.4fr"
            searchEnabled={false}
            tableType="tasks"
          />
        </>
      ) : (
        <>
          <div className={tabStyles.tabsRow}>
            <div className={tabStyles.tabsSection}>
              {AUTOMATIONS_TABS.map(tab => (
                <button
                  key={tab.key}
                  className={`${tabStyles.tab} ${automationsTab === tab.key ? tabStyles.active : ''}`}
                  onClick={() => setAutomationsTab(tab.key)}
                >
                  {tab.label}
                  <span className={tabStyles.tabCount}>
                    {automationsTabCounts[tab.key]}
                  </span>
                </button>
              ))}
            </div>
          </div>
          <DataTable<LeadWithCadence>
            data={filteredAutomations}
            title=""
            columns={automationColumns}
            cardView={automationsCardView}
            loading={automationsLoading}
            emptyStateMessage="No leads with active automations assigned to you."
            onItemAction={handleAutomationItemAction}
            customColumnWidths="1fr 1fr 1fr"
            searchEnabled={false}
            tableType="tasks"
          />
        </>
      )}
    </div>
  );
}
