'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Phone, MessageSquare, Mail, Zap } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { useCompany } from '@/contexts/CompanyContext';
import { DataTable, ColumnDefinition } from '@/components/Common/DataTable';
import { getTaskColumns } from '@/components/Tasks/TasksList/TasksListConfig';
import { Task, TaskFormData, isTaskOverdue } from '@/types/task';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import TaskForm from '@/components/Tasks/TaskForm/TaskForm';
import {
  Modal,
  ModalTop,
  ModalMiddle,
  ModalBottom,
} from '@/components/Common/Modal/Modal';
import ModalActionButtons from '@/components/Common/Modal/ModalActionButtons';
import { usePageActions } from '@/contexts/PageActionsContext';
import { createClient } from '@/lib/supabase/client';
import {
  createTaskChannel,
  subscribeToTaskUpdates,
  TaskUpdatePayload,
} from '@/lib/realtime/task-channel';
import pageStyles from './page.module.scss';
import tabStyles from '@/components/Common/DataTable/DataTableTabs.module.scss';

type LeftPanelView = 'actions' | 'automations';
type ActionsTab = 'due_today' | 'upcoming' | 'in_the_past';
type TasksTab = 'all' | 'new' | 'pending' | 'in_progress' | 'overdue';
type AutomationsTab = 'all' | 'in_process' | 'quoted' | 'scheduling';

const AUTOMATIONS_TABS: { key: AutomationsTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_process', label: 'Working' },
  { key: 'quoted', label: 'Quoted' },
  { key: 'scheduling', label: 'Scheduling' },
];

type AutomatedActionType = 'email' | 'text_message' | 'ai_call';

// Cadence step types that should appear in the Automations tab (includes trigger_workflow for filtering)
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

interface WorkflowTimelineEntry {
  step: { type: string; delay_minutes?: number; [key: string]: unknown };
  estimatedAt: Date;
  isCompleted: boolean;
}

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

interface CadenceStep {
  id: string;
  action_type: string;
  display_order: number;
  description: string | null;
}

interface ActiveExecution {
  id: string;
  execution_status: string;
  execution_data: { stepResults?: { stepIndex: number; completedAt: string }[] } | null;
  started_at: string;
  workflow: { id: string; name: string; workflow_steps: WorkflowTimelineEntry['step'][] } | null;
}

interface LeadWithCadence {
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

interface LeadData {
  id: string;
  lead_status: string;
  customer: { first_name: string | null; last_name: string | null } | null;
  service_address: {
    city: string | null;
    state: string | null;
    zip_code: string | null;
  } | null;
}

const ACTIONS_TABS: { key: ActionsTab; label: string }[] = [
  { key: 'due_today', label: 'Due Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'in_the_past', label: 'In The Past' },
];

const TASKS_TABS: { key: TasksTab; label: string }[] = [
  { key: 'all', label: 'All Tasks' },
  { key: 'new', label: 'New' },
  { key: 'pending', label: 'Pending' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'overdue', label: 'Overdue' },
];

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

type ActionIconType = 'phone' | 'text' | 'email' | 'other';

const parseActionInfo = (
  title: string
): { label: string; iconType: ActionIconType } => {
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

const ACTION_ICONS: Record<ActionIconType, React.ElementType> = {
  phone: Phone,
  text: MessageSquare,
  email: Mail,
  other: Zap,
};

const toArray = <T,>(val: T | T[] | null | undefined): T[] => {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
};

interface NextAutomatedAction {
  label: string;
  subtitle: string | null;
}

const getActiveExecution = (lead: LeadWithCadence) =>
  toArray(lead.active_execution).find(
    e => e.execution_status === 'pending' || e.execution_status === 'running'
  ) ?? null;

const getNextAutomatedAction = (lead: LeadWithCadence): NextAutomatedAction | null => {
  // If a workflow execution is actively running, always show it regardless of cadence step state
  const activeExec = getActiveExecution(lead);
  if (activeExec) {
    if (!activeExec.workflow?.workflow_steps?.length) {
      return { label: 'Automation Running', subtitle: null };
    }
    const stepResults = activeExec.execution_data?.stepResults ?? [];
    const timeline = buildWorkflowStepTimeline(activeExec.workflow.workflow_steps, stepResults, activeExec.started_at);
    const nextWorkflowStep = timeline.find(t => !t.isCompleted);
    if (!nextWorkflowStep) return { label: 'Automation Running', subtitle: null };
    return {
      label: WORKFLOW_STEP_LABELS[nextWorkflowStep.step.type] ?? nextWorkflowStep.step.type,
      subtitle: formatWorkflowDate(nextWorkflowStep.estimatedAt),
    };
  }

  // Otherwise find the next pending direct automated cadence step (never show trigger_workflow without a running execution)
  const assignments = toArray(lead.cadence_assignment);
  const activeAssignment = assignments.find(ca => ca.completed_at === null);
  if (!activeAssignment?.cadence) return null;

  const completedIds = new Set(toArray(lead.cadence_progress).map(p => p.cadence_step_id));
  const nextCadenceStep = activeAssignment.cadence.steps
    .filter(s => !completedIds.has(s.id) && (s.action_type === 'email' || s.action_type === 'text_message' || s.action_type === 'ai_call'))
    .sort((a, b) => a.display_order - b.display_order)[0] ?? null;

  if (!nextCadenceStep) return null;

  return {
    label: CADENCE_STEP_LABELS[nextCadenceStep.action_type as AutomatedActionType],
    subtitle: nextCadenceStep.description,
  };
};

export default function MyTasksPage() {
  const router = useRouter();
  const [actions, setActions] = useState<Task[]>([]);
  const [regularTasks, setRegularTasks] = useState<Task[]>([]);
  const [leadDataMap, setLeadDataMap] = useState<Record<string, LeadData>>({});
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<TaskFormData | null>(null);
  const [leftPanelView, setLeftPanelView] = useState<LeftPanelView>('actions');
  const [automationExecutions, setAutomationExecutions] = useState<LeadWithCadence[]>([]);
  const [automationsLoading, setAutomationsLoading] = useState(false);
  const [automationsTab, setAutomationsTab] = useState<AutomationsTab>('all');
  const [actionsTab, setActionsTab] = useState<ActionsTab>('due_today');
  const [tasksTab, setTasksTab] = useState<TasksTab>('all');
  const [tasksSearchQuery, setTasksSearchQuery] = useState('');
  const { user } = useUser();
  const { selectedCompany } = useCompany();
  const { registerPageAction, unregisterPageAction } = usePageActions();

  const { users: assignableUsers } = useAssignableUsers({
    companyId: selectedCompany?.id,
    departmentType: 'all',
  });

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
    if (!user?.id || !selectedCompany?.id) return;

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
        .eq('company_id', selectedCompany.id)
        .eq('assigned_to', user.id)
        .not('lead_status', 'in', '("won","lost")');

      if (data) {
        const filtered = (data as unknown as LeadWithCadence[]).filter(lead =>
          getNextAutomatedAction(lead) !== null
        );
        setAutomationExecutions(filtered);
      }
    } catch (err) {
      console.error('Error fetching automations:', err);
    } finally {
      setAutomationsLoading(false);
    }
  }, [user?.id, selectedCompany?.id]);

  const fetchMyTasks = useCallback(async () => {
    if (!user?.id || !selectedCompany?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = new URLSearchParams({
        companyId: selectedCompany.id,
        assignedTo: user.id,
        includeArchived: 'false',
      });

      const response = await fetch(`/api/tasks?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch tasks');

      const data = await response.json();
      const allTasks: Task[] = Array.isArray(data.tasks) ? data.tasks : [];
      const actionTasks = allTasks.filter(
        t => t.cadence_step_id && t.status !== 'completed'
      );
      const taskItems = allTasks.filter(
        t => !t.cadence_step_id && t.status !== 'completed'
      );

      setActions(actionTasks);
      setRegularTasks(taskItems);
      await fetchLeadData(actionTasks);
    } catch (err) {
      console.error('Error fetching my tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, selectedCompany?.id, fetchLeadData]);

  useEffect(() => {
    fetchMyTasks();
  }, [fetchMyTasks]);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  // Real-time subscription for task updates
  useEffect(() => {
    if (!selectedCompany?.id || !user?.id) return;

    const channel = createTaskChannel(selectedCompany.id);

    subscribeToTaskUpdates(channel, async (payload: TaskUpdatePayload) => {
      const { company_id, action, record_id } = payload;
      if (company_id !== selectedCompany.id) return;

      if (action === 'INSERT' || action === 'UPDATE') {
        try {
          const supabase = createClient();
          const { data: fullTask } = await supabase
            .from('tasks')
            .select(
              `
              *,
              company:companies(id, name),
              assigned_user:profiles!tasks_assigned_to_fkey(
                id, first_name, last_name, email
              )
            `
            )
            .eq('id', record_id)
            .single();

          if (!fullTask) return;

          const isAssignedToMe = fullTask.assigned_to === user.id;
          const isCompleted = fullTask.status === 'completed';
          const isAction = Boolean(fullTask.cadence_step_id);

          if (isAssignedToMe && !isCompleted) {
            if (isAction) {
              setActions(prev => {
                const exists = prev.some(t => t.id === fullTask.id);
                return exists
                  ? prev.map(t => (t.id === fullTask.id ? fullTask : t))
                  : [fullTask, ...prev];
              });
              setRegularTasks(prev => prev.filter(t => t.id !== fullTask.id));
              // Fetch lead data for this action if lead-linked
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
                    [(lead as unknown as LeadData).id]:
                      lead as unknown as LeadData,
                  }));
                }
              }
            } else {
              setRegularTasks(prev => {
                const exists = prev.some(t => t.id === fullTask.id);
                return exists
                  ? prev.map(t => (t.id === fullTask.id ? fullTask : t))
                  : [fullTask, ...prev];
              });
              setActions(prev => prev.filter(t => t.id !== fullTask.id));
            }
          } else {
            setActions(prev => prev.filter(t => t.id !== record_id));
            setRegularTasks(prev => prev.filter(t => t.id !== record_id));
          }
        } catch (error) {
          console.error('Error handling task realtime update:', error);
        }
      } else if (action === 'DELETE') {
        setActions(prev => prev.filter(t => t.id !== record_id));
        setRegularTasks(prev => prev.filter(t => t.id !== record_id));
      }
    });

    return () => {
      createClient().removeChannel(channel);
    };
  }, [selectedCompany?.id, user?.id]);

  useEffect(() => {
    registerPageAction('add', () => setShowCreateForm(true));
    return () => unregisterPageAction('add');
  }, [registerPageAction, unregisterPageAction]);

  // Automations tab counts + filtered list
  const automationsTabCounts = useMemo(() => ({
    all: automationExecutions.length,
    in_process: automationExecutions.filter(l => l.lead_status === 'in_process').length,
    quoted: automationExecutions.filter(l => l.lead_status === 'quoted').length,
    scheduling: automationExecutions.filter(l => l.lead_status === 'scheduling').length,
  }), [automationExecutions]);

  const filteredAutomations = useMemo(() =>
    automationsTab === 'all'
      ? automationExecutions
      : automationExecutions.filter(l => l.lead_status === automationsTab),
    [automationExecutions, automationsTab]
  );

  // Actions tab counts
  const actionTabCounts = useMemo(() => {
    const today = getTodayStr();
    return {
      due_today: actions.filter(a => a.due_date === today).length,
      upcoming: actions.filter(a => !a.due_date || a.due_date > today).length,
      in_the_past: actions.filter(a => !!a.due_date && a.due_date < today)
        .length,
    };
  }, [actions]);

  // Filtered actions by tab
  const filteredActions = useMemo(() => {
    const today = getTodayStr();
    return actions.filter(action => {
      if (!action.due_date) return actionsTab === 'upcoming';
      if (actionsTab === 'due_today') return action.due_date === today;
      if (actionsTab === 'upcoming') return action.due_date > today;
      return action.due_date < today;
    });
  }, [actions, actionsTab]);

  // Tasks tab counts
  const taskTabCounts = useMemo(() => {
    const active = regularTasks.filter(
      t => !t.archived && t.status !== 'completed'
    );
    return {
      all: active.length,
      new: active.filter(t => t.status === 'new').length,
      pending: active.filter(t => t.status === 'pending').length,
      in_progress: active.filter(t => t.status === 'in_progress').length,
      overdue: active.filter(isTaskOverdue).length,
    };
  }, [regularTasks]);

  // Filtered regular tasks by tab + search
  const filteredRegularTasks = useMemo(() => {
    let result = regularTasks.filter(
      t => !t.archived && t.status !== 'completed'
    );
    if (tasksTab === 'new') result = result.filter(t => t.status === 'new');
    else if (tasksTab === 'pending')
      result = result.filter(t => t.status === 'pending');
    else if (tasksTab === 'in_progress')
      result = result.filter(t => t.status === 'in_progress');
    else if (tasksTab === 'overdue') result = result.filter(isTaskOverdue);

    if (!tasksSearchQuery.trim()) return result;
    const q = tasksSearchQuery.toLowerCase();
    return result.filter(
      t =>
        t.title?.toLowerCase().includes(q) ||
        t.description?.toLowerCase().includes(q) ||
        t.status?.toLowerCase().includes(q)
    );
  }, [regularTasks, tasksTab, tasksSearchQuery]);

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

  // Column definitions for the actions DataTable
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
            <div className={pageStyles.customerCell}>
              {customerName && (
                <span className={pageStyles.customerName}>{customerName}</span>
              )}
              {addressLine && (
                <span className={pageStyles.customerAddress}>
                  {addressLine}
                </span>
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
          const { label: actionLabel, iconType } = parseActionInfo(
            action.title
          );
          const ActionIcon = ACTION_ICONS[iconType];
          return (
            <div className={pageStyles.leadCell}>
              <button
                className={`${pageStyles.actionBtn} ${isOverdue ? pageStyles.actionBtnOverdue : ''}`}
                onClick={e => {
                  e.stopPropagation();
                  onAction?.('navigate', action);
                }}
              >
                <ActionIcon size={13} />
                {actionLabel}
              </button>
              {isOverdue && overdueDays > 0 && (
                <span className={pageStyles.overdueLabel}>
                  <span className={pageStyles.overdueCircle} />
                  Overdue {overdueDays} {overdueDays === 1 ? 'day' : 'days'}
                </span>
              )}
              {!isOverdue && action.due_date && action.due_date > today && (
                <span className={pageStyles.dueDateLabel}>Due {formatDueDate(action.due_date)}</span>
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
            <div className={pageStyles.progressCell}>
              <span
                className={`${pageStyles.progressLabel} ${isOverdue ? pageStyles.progressLabelOverdue : ''}`}
              >
                {getLeadStatusLabel(leadStatus)}
              </span>
              <div className={pageStyles.progressTrack}>
                <div
                  className={`${pageStyles.progressFill} ${isOverdue ? pageStyles.progressFillOverdue : ''}`}
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

  const handleActionItemAction = useCallback(
    (action: string, task: Task) => {
      if (action === 'navigate') handleActionRowClick(task);
    },
    [handleActionRowClick]
  );

  const regularTaskColumns = useMemo(() => {
    const cols = getTaskColumns(false, true);
    const dueDateIdx = cols.findIndex(c => c.key === 'due_date');
    if (dueDateIdx > 0) {
      const [dueDate] = cols.splice(dueDateIdx, 1);
      cols.unshift(dueDate);
    }
    return cols;
  }, []);

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
            <div className={pageStyles.customerCell}>
              {customerName && (
                <span className={pageStyles.customerName}>{customerName}</span>
              )}
              {addressLine && (
                <span className={pageStyles.customerAddress}>{addressLine}</span>
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
            <div className={pageStyles.leadCell}>
              <span>{next.label}</span>
              {next.subtitle && (
                <span className={pageStyles.customerAddress}>{next.subtitle}</span>
              )}
            </div>
          );
        },
      },
      {
        key: 'progress',
        title: 'Progress',
        render: (lead: LeadWithCadence) => {
          // If a workflow is actively running, show its step progress
          const activeExec = getActiveExecution(lead);
          if (activeExec?.workflow?.workflow_steps?.length) {
            const stepResults = activeExec.execution_data?.stepResults ?? [];
            const timeline = buildWorkflowStepTimeline(activeExec.workflow.workflow_steps, stepResults, activeExec.started_at);
            const total = timeline.length;
            const completed = timeline.filter(t => t.isCompleted).length;
            const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
            return (
              <div className={pageStyles.progressCell}>
                <span className={pageStyles.progressLabel}>{completed}/{total} Steps</span>
                <div className={pageStyles.progressTrack}>
                  <div className={pageStyles.progressFill} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          }

          // Otherwise show automated cadence step progress
          const assignments = toArray(lead.cadence_assignment);
          const activeAssignment = assignments.find(ca => ca.completed_at === null);
          const allSteps = activeAssignment?.cadence?.steps ?? [];
          const completedIds = new Set(toArray(lead.cadence_progress).map(p => p.cadence_step_id));
          const automatedSteps = allSteps.filter(s => AUTOMATED_STEP_TYPES_ALL.includes(s.action_type));
          const completedAutomated = automatedSteps.filter(s => completedIds.has(s.id)).length;
          const totalAutomated = automatedSteps.length;
          const pct = totalAutomated > 0 ? Math.round((completedAutomated / totalAutomated) * 100) : 0;
          return (
            <div className={pageStyles.progressCell}>
              <span className={pageStyles.progressLabel}>
                {completedAutomated}/{totalAutomated} Steps
              </span>
              <div className={pageStyles.progressTrack}>
                <div className={pageStyles.progressFill} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        },
      },
    ],
    []
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

  const actionsEmptyMessage =
    actionsTab === 'due_today'
      ? 'No actions due today.'
      : actionsTab === 'upcoming'
        ? 'No upcoming actions.'
        : 'No past actions.';

  const handleCreateTask = async (taskFormData: TaskFormData) => {
    if (!selectedCompany?.id) return;
    setSubmitting(true);
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskFormData,
          company_id: selectedCompany.id,
        }),
      });
      if (response.ok) {
        setShowCreateForm(false);
        await fetchMyTasks();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTask = async (taskFormData: TaskFormData) => {
    if (!editingTask) return;
    setSubmitting(true);
    try {
      const response = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskFormData),
      });
      if (response.ok) {
        setEditingTask(null);
        await fetchMyTasks();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Failed to update task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/complete`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        fetchMyTasks();
      } else {
        throw new Error('Failed to complete task');
      }
    } catch (error) {
      console.error('Error completing task:', error);
      alert('Failed to complete task. Please try again.');
    }
  };

  const handleTaskAction = (action: string, task: Task) => {
    if (action === 'edit') setEditingTask(task);
    else if (action === 'view') router.push(`/tickets/tasks/${task.id}`);
    else if (action === 'complete') handleCompleteTask(task.id);
  };

  const handleCancelForm = () => {
    setShowCreateForm(false);
    setEditingTask(null);
    setFormData(null);
  };

  if (!user || !selectedCompany) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Please select a company to view your tasks.</p>
      </div>
    );
  }

  const isFormOpen = showCreateForm || !!editingTask;

  return (
    <div className={pageStyles.page}>
      <Modal isOpen={isFormOpen} onClose={handleCancelForm}>
        <ModalTop
          title={editingTask ? 'Edit Task' : 'Create New Task'}
          onClose={handleCancelForm}
        />
        <ModalMiddle>
          <TaskForm
            task={editingTask || undefined}
            companyId={selectedCompany.id}
            assignableUsers={assignableUsers}
            onFormDataChange={setFormData}
            loading={submitting}
            defaultAssignedTo={!editingTask ? user.id : undefined}
            requireAssignedTo={!editingTask}
          />
        </ModalMiddle>
        <ModalBottom>
          <ModalActionButtons
            onBack={handleCancelForm}
            showBackButton={true}
            isFirstStep={true}
            onPrimaryAction={async () => {
              if (formData) {
                if (editingTask) await handleEditTask(formData);
                else await handleCreateTask(formData);
              }
            }}
            primaryButtonText={editingTask ? 'Update Task' : 'Create Task'}
            primaryButtonDisabled={!formData || submitting}
            isLoading={submitting}
            loadingText="Saving..."
          />
        </ModalBottom>
      </Modal>

      <div className={pageStyles.layout}>
        {/* Left: Actions / Automations Panel */}
        <div className={pageStyles.panel}>
          {/* Panel-level view switcher */}
          <div className={pageStyles.panelHeader}>
            <div className={pageStyles.panelViewSwitcher}>
              <button
                className={`${pageStyles.panelViewTitle} ${leftPanelView === 'actions' ? pageStyles.panelViewTitleActive : ''}`}
                onClick={() => setLeftPanelView('actions')}
              >
                My Actions
              </button>
              <button
                className={`${pageStyles.panelViewTitle} ${leftPanelView === 'automations' ? pageStyles.panelViewTitleActive : ''}`}
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

        {/* Right: Additional Tasks Panel */}
        <div className={pageStyles.panel}>
          <div className={pageStyles.panelHeader}>
            <p className={pageStyles.panelTitle}>Your Additional Tasks</p>
          </div>

          <div className={tabStyles.tabsRow}>
            <div className={tabStyles.tabsSection}>
              {TASKS_TABS.map(tab => (
                <button
                  key={tab.key}
                  className={`${tabStyles.tab} ${tasksTab === tab.key ? tabStyles.active : ''}`}
                  onClick={() => setTasksTab(tab.key)}
                >
                  {tab.label}
                  <span className={tabStyles.tabCount}>
                    {taskTabCounts[tab.key]}
                  </span>
                </button>
              ))}
            </div>
            <div className={tabStyles.searchSection}>
              <Search size={16} className={tabStyles.searchIcon} />
              <input
                type="text"
                className={tabStyles.searchInput}
                placeholder="Search"
                value={tasksSearchQuery}
                onChange={e => setTasksSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <DataTable<Task>
            data={filteredRegularTasks}
            title=""
            columns={regularTaskColumns}
            loading={loading}
            emptyStateMessage="No additional tasks assigned to you."
            onItemAction={handleTaskAction}
            customColumnWidths="1fr minmax(160px, 2fr) 1fr 1fr 1.4fr"
            searchEnabled={false}
            tableType="tasks"
          />
        </div>
      </div>
    </div>
  );
}
