import { useState, useEffect, useRef, useCallback } from 'react';
import { Lead } from '@/types/lead';
import { TimeOption, DEFAULT_TIME_OPTIONS, parseTimeOptions } from '@/lib/time-options';
import { CompleteTaskModal } from '@/components/Common/CompleteTaskModal/CompleteTaskModal';
import { useUser } from '@/hooks/useUser';
import { useQuoteRealtime } from '@/hooks/useQuoteRealtime';
import { authenticatedFetch, adminAPI } from '@/lib/api-client';
import {
  createCustomerChannel,
  removeCustomerChannel,
  subscribeToCustomerUpdates,
} from '@/lib/realtime/customer-channel';
import {
  createTaskChannel,
  removeTaskChannel,
  subscribeToTaskUpdates,
} from '@/lib/realtime/task-channel';
import {
  subscribeToAutomationExecutions,
  removeAutomationExecutionChannel,
} from '@/lib/realtime/automation-execution-channel';
import { ActiveSectionProvider } from '@/contexts/ActiveSectionContext';
import styles from './LeadStepContent.module.scss';
import { ChevronRight, ExternalLink, Mail } from 'lucide-react';
import { LeadContactSection } from './components/LeadContactSection';
import { LeadPestPicker, type SelectedPest } from './components/LeadPestPicker';
import { LeadQuoteBuilder } from './components/LeadQuoteBuilder';
import { LeadQuickInfo } from '@/components/Common/LeadQuickInfo/LeadQuickInfo';
import { CommunicationLog } from '@/components/Common/CommunicationLog/CommunicationLog';
import { LeadTabs, LeadTabDef } from './components/LeadTabs';
import { LeadCallFormInfo } from './components/LeadCallFormInfo';
import { LeadContactDetailsPanel } from './components/LeadContactDetailsPanel';
import { LeadActivityNotesPanel } from './components/LeadActivityNotesPanel';
import { ScheduleServiceModal } from '@/components/Common/ScheduleServiceModal/ScheduleServiceModal';
import { MapPlotCanvas } from '@/components/FieldMap/MapPlot/MapPlotCanvas/MapPlotCanvas';

interface LeadStepContentProps {
  lead: Lead;
  isAdmin: boolean;
  onLeadUpdate?: (updatedLead?: Lead) => void;
  onLeadFieldUpdate?: (fields: Partial<Lead>) => void;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
  onRequestUndo?: (undoHandler: () => Promise<void>) => void;
  onEmailQuote?: () => void;
  onFinalizeSale?: (handler: () => void) => void;
  onNotInterested?: () => void;
  onReadyToSchedule?: () => void;
  onLineItemsSaved?: (itemCount: number) => void;
}

export function LeadStepContent({
  lead,
  isAdmin,
  onLeadUpdate,
  onLeadFieldUpdate,
  onShowToast,
  onRequestUndo,
  onEmailQuote,
  onFinalizeSale,
  onNotInterested,
  onReadyToSchedule,
  onLineItemsSaved,
}: LeadStepContentProps) {
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [isCommunicationExpanded, setIsCommunicationExpanded] = useState(true);
  const [showCompleteTaskModal, setShowCompleteTaskModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'summary' | 'quote' | 'graph' | 'contact' | 'activity'
  >(lead.lead_status === 'new' ? 'summary' : 'quote');
  const [pendingActivity, setPendingActivity] = useState<{
    type: string;
    notes: string;
    outcome?: string | null;
    isLastStep?: boolean;
  } | null>(null);

  // Scheduling state
  const [scheduledDate, setScheduledDate] = useState<string>(
    lead.scheduled_date || ''
  );
  const [scheduledTime, setScheduledTime] = useState<string>(
    lead.scheduled_time || ''
  );
  const [confirmationNote, setConfirmationNote] = useState<string>('');

  // Refs
  const customerChannelRef = useRef<any>(null);
  const taskChannelRef = useRef<any>(null);
  const executionChannelRef = useRef<any>(null);
  const quotingSectionRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef(lead);
  const onLeadUpdateRef = useRef(onLeadUpdate);

  // Quote step state — SelectedPest[] from the picker feeds the quote builder
  const [pestSelections, setPestSelections] = useState<SelectedPest[]>([]);
  const [isPestModalOpen, setIsPestModalOpen] = useState(false);
  const [isQuoteTabReady, setIsQuoteTabReady] = useState(false);

  const handlePestSelectionChange = useCallback(
    (selected: SelectedPest[]) => {
      setPestSelections(selected);
    },
    []
  );

  const handleQuoteTabReady = useCallback(() => setIsQuoteTabReady(true), []);

  const handleQuoteRealtimeUpdate = useCallback(() => {
    if (onLeadUpdateRef.current) {
      onLeadUpdateRef.current();
    }
  }, []);

  const [preferredDate, setPreferredDate] = useState<string>('');
  const [preferredTime, setPreferredTime] = useState<string>('');
  const [timeOptions, setTimeOptions] = useState<TimeOption[]>(DEFAULT_TIME_OPTIONS);

  // Contact Log activity state
  const [activityNotes, setActivityNotes] = useState<string>('');
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);
  const [nextTask, setNextTask] = useState<any | null>(null);
  const [afterNextActionType, setAfterNextActionType] = useState<string | null>(null);
  const [cadenceSteps, setCadenceSteps] = useState<any[]>([]);
  const [cadenceStartedAt, setCadenceStartedAt] = useState<string | null>(null);
  const [loadingNextTask, setLoadingNextTask] = useState(false);
  const [hasActiveCadence, setHasActiveCadence] = useState<boolean | null>(
    null
  );
  const [activeWorkflowExecution, setActiveWorkflowExecution] = useState<any | null>(null);
  const [availableCadences, setAvailableCadences] = useState<{ id: string; name: string }[]>([]);
  const [selectedCadenceId, setSelectedCadenceId] = useState<string | null>(
    null
  );
  const { user } = useUser();

  // Real-time quote updates - single source of truth
  // Enable for all statuses to allow quote building at any stage
  const {
    quote,
    isLoading: isQuoteLoading,
    broadcastUpdate: broadcastQuoteUpdate,
  } = useQuoteRealtime({
    leadId: lead.id,
    userId: user?.id,
    enabled: true,
    onQuoteUpdate: handleQuoteRealtimeUpdate,
  });

  // Set default assignee to current user when component loads
  useEffect(() => {
    if (user?.id && !selectedAssignee) {
      setSelectedAssignee(user.id);
    }
  }, [user?.id, selectedAssignee]);

  // Function to load cadence data and next task - made reusable for refresh after completion
  const loadCadenceData = useCallback(async () => {
    // Terminal leads have no active cadences or tasks — skip the API fetch entirely
    if (lead.lead_status === 'won' || lead.lead_status === 'lost') {
      setHasActiveCadence(false);
      setNextTask(null);
      setLoadingNextTask(false);
      return;
    }

    try {
      setLoadingNextTask(true);

      // Check if lead has active cadence (authenticatedFetch returns JSON directly, not Response)
      const cadenceResult = await authenticatedFetch(
        `/api/leads/${lead.id}/cadence`
      );
      const hasActiveCadence =
        cadenceResult.data !== null && cadenceResult.data.completed_at === null;
      setHasActiveCadence(hasActiveCadence);

      // Only fetch next task if cadence exists
      if (hasActiveCadence) {
        // Extract the action_type of the step after the current one (N+1 lookahead)
        const allSteps: any[] = cadenceResult.data?.cadence?.steps || [];
        const incompleteSteps = allSteps.filter((s: any) => !s.is_completed);
        setAfterNextActionType(incompleteSteps[1]?.action_type ?? null);
        setCadenceSteps(allSteps);
        setCadenceStartedAt(cadenceResult.data?.started_at ?? null);

        const taskResult = await authenticatedFetch(
          `/api/leads/${lead.id}/next-task`
        );
        setNextTask(taskResult.data);

        if (taskResult.data?.action_type === 'trigger_workflow') {
          try {
            const execResult = await authenticatedFetch(`/api/leads/${lead.id}/active-execution`);
            setActiveWorkflowExecution(execResult.data ?? null);
          } catch {
            setActiveWorkflowExecution(null);
          }
        } else {
          setActiveWorkflowExecution(null);
        }
      } else {
        setNextTask(null);
        setAfterNextActionType(null);
        setActiveWorkflowExecution(null);
      }
    } catch (error) {
      console.error('Error loading cadence data:', error);
      // If there's an error, assume no cadence
      setHasActiveCadence(false);
      setNextTask(null);
    } finally {
      setLoadingNextTask(false);
    }
  }, [lead.id, lead.lead_status, lead.assigned_scheduler]);

  // Reset cadence state immediately when status changes so we show loading
  // instead of the stale "no cadence" UI during the re-check
  useEffect(() => {
    setHasActiveCadence(null);
    setNextTask(null);
    setAfterNextActionType(null);
    setCadenceSteps([]);
    setCadenceStartedAt(null);
    setActiveWorkflowExecution(null);
  }, [lead.lead_status]);

  // Load next recommended task from cadence and check if cadence exists
  useEffect(() => {
    loadCadenceData();
  }, [loadCadenceData]);

  // Fetch available cadences in parallel (non-fatal, used for inline selector)
  useEffect(() => {
    authenticatedFetch(`/api/companies/${lead.company_id}/sales-cadences`)
      .then(result => setAvailableCadences((result.data || []).filter((c: any) => c.is_active)))
      .catch(() => {});
  }, [lead.company_id]);

  // Fetch company time options (non-fatal)
  useEffect(() => {
    authenticatedFetch(`/api/companies/${lead.company_id}/settings`)
      .then(result => setTimeOptions(parseTimeOptions(result.settings?.requested_time_options?.value)))
      .catch(() => {});
  }, [lead.company_id]);

  // Keep refs in sync with latest props so subscription callbacks never go stale
  useEffect(() => {
    leadRef.current = lead;
    onLeadUpdateRef.current = onLeadUpdate;
  });

  // Set up customer realtime channel for broadcasting updates
  useEffect(() => {
    if (!lead.customer?.id) {
      // Clean up existing channel if no customer
      if (customerChannelRef.current) {
        removeCustomerChannel(customerChannelRef.current);
        customerChannelRef.current = null;
      }
      return;
    }

    // Create customer channel for broadcasting
    const channel = createCustomerChannel(lead.customer.id);
    customerChannelRef.current = channel;

    // Must subscribe to the channel before we can broadcast on it
    subscribeToCustomerUpdates(channel, payload => {
      const currentLead = leadRef.current;
      if (!currentLead.customer) return;
      onLeadUpdateRef.current?.({
        ...currentLead,
        customer: {
          ...currentLead.customer,
          ...(payload.first_name !== undefined && { first_name: payload.first_name }),
          ...(payload.last_name !== undefined && { last_name: payload.last_name }),
          ...(payload.email !== undefined && { email: payload.email }),
          ...(payload.phone !== undefined && { phone: payload.phone }),
        },
      });
    });

    // Cleanup on unmount or when customer ID changes
    return () => {
      if (customerChannelRef.current) {
        removeCustomerChannel(customerChannelRef.current);
        customerChannelRef.current = null;
      }
    };
  }, [lead.customer?.id]);

  // Set up task realtime channel for next task updates
  useEffect(() => {
    if (!lead.company_id) {
      // Clean up existing channel if no company
      if (taskChannelRef.current) {
        removeTaskChannel(taskChannelRef.current);
        taskChannelRef.current = null;
      }
      return;
    }

    // Create task channel for this company
    const channel = createTaskChannel(lead.company_id);
    taskChannelRef.current = channel;

    // Subscribe to task updates
    subscribeToTaskUpdates(channel, async payload => {
      // Check if this task is related to our lead by fetching task details
      // This prevents unnecessary reloads for tasks unrelated to this lead
      try {
        // For DELETE operations, we can't fetch the task, so we reload cadence data
        if (payload.action === 'DELETE') {
          await loadCadenceData();
          return;
        }

        // For INSERT/UPDATE, fetch the task to check if it's for this lead
        const taskResponse = await authenticatedFetch(
          `/api/tasks/${payload.task_id}`
        );

        if (taskResponse.data?.lead_id === lead.id) {
          await loadCadenceData();
        }
      } catch (error) {
        // If we can't fetch the task (it might be deleted), reload anyway to be safe
        console.error('Error checking task:', error);
        await loadCadenceData();
      }
    });

    // Cleanup on unmount or when company ID changes
    return () => {
      if (taskChannelRef.current) {
        removeTaskChannel(taskChannelRef.current);
        taskChannelRef.current = null;
      }
    };
  }, [lead.company_id, lead.id, loadCadenceData]);

  // Subscribe to automation execution updates when a trigger_workflow step is active.
  // Fires on every step progress update and on terminal status changes so the UI
  // stays current without a manual refresh.
  useEffect(() => {
    const isWorkflowActive =
      hasActiveCadence === true && nextTask?.action_type === 'trigger_workflow';

    // Tear down any existing channel first
    if (executionChannelRef.current) {
      removeAutomationExecutionChannel(executionChannelRef.current);
      executionChannelRef.current = null;
    }

    if (!isWorkflowActive) return;

    const channel = subscribeToAutomationExecutions(lead.id, ({ executionStatus, executionData }) => {
      if (
        executionStatus === 'completed' ||
        executionStatus === 'cancelled' ||
        executionStatus === 'failed'
      ) {
        // Workflow finished — reload cadence data to advance the UI
        loadCadenceData();
      } else {
        // Step progress update — patch execution_data in place so the timeline refreshes
        setActiveWorkflowExecution((prev: any) =>
          prev ? { ...prev, execution_data: executionData } : prev
        );
      }
    });

    executionChannelRef.current = channel;

    return () => {
      if (executionChannelRef.current) {
        removeAutomationExecutionChannel(executionChannelRef.current);
        executionChannelRef.current = null;
      }
    };
  }, [lead.id, hasActiveCadence, nextTask?.action_type, loadCadenceData]);

  // Pre-fill preferred date and time from lead data
  useEffect(() => {
    // Update if lead has value AND it differs from current state
    if (lead.requested_date && lead.requested_date !== preferredDate) {
      setPreferredDate(lead.requested_date);
    }

    if (lead.requested_time && lead.requested_time !== preferredTime) {
      setPreferredTime(lead.requested_time);
    }
  }, [lead.requested_date, lead.requested_time]);
  // Removed preferredDate and preferredTime from dependencies to prevent re-run loops

  const handleCompleteTaskConfirm = async () => {
    if (!pendingActivity) return;

    const isLastStep = pendingActivity.isLastStep ?? false;
    setIsLoggingActivity(true);
    setShowCompleteTaskModal(false);

    try {
      // 1. Log the activity
      const activityResponse = await fetch(`/api/leads/${lead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: pendingActivity.type,
          notes: pendingActivity.notes || null,
          outcome: pendingActivity.outcome ?? null,
        }),
      });

      if (!activityResponse.ok) {
        throw new Error('Failed to log activity');
      }

      // 2. Complete the task if it exists
      if (nextTask?.task_id) {
        const taskResponse = await fetch(
          `/api/tasks/${nextTask.task_id}/complete`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}), // Empty body - actual_hours is optional
          }
        );

        if (!taskResponse.ok) {
          console.error('Failed to complete task, but activity was logged');
          // Don't throw - activity was logged successfully
        }
      }

      // 3. If this was the final cadence step, mark lead as lost
      if (isLastStep) {
        try {
          await fetch(`/api/leads/${lead.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lead_status: 'lost' }),
          });
        } catch (err) {
          console.error('Error marking lead as lost:', err);
        }
      }

      onShowToast?.(
        isLastStep
          ? 'Activity logged and lead marked as lost'
          : 'Activity logged and task marked complete',
        'success'
      );
      setActivityNotes('');
      setPendingActivity(null);

      if (isLastStep) {
        window.location.href = '/tickets/dashboard';
        return;
      }

      // Refresh lead and next task data
      onLeadUpdate?.();
      await loadCadenceData();
    } catch (error) {
      console.error('Error logging activity:', error);
      onShowToast?.('Failed to log activity', 'error');
    } finally {
      setIsLoggingActivity(false);
    }
  };

  const handleCompleteTaskSkip = async () => {
    if (!pendingActivity) return;

    setIsLoggingActivity(true);
    setShowCompleteTaskModal(false);

    try {
      // Log the activity WITHOUT task completion
      // TODO: We need an API parameter to skip auto-progression
      const response = await fetch(`/api/leads/${lead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: pendingActivity.type,
          notes: pendingActivity.notes || null,
          skip_task_completion: true, // Add this flag
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log activity');
      }

      onShowToast?.('Activity logged successfully', 'success');
      setActivityNotes('');
      setPendingActivity(null);
      onLeadUpdate?.();
    } catch (error) {
      console.error('Error logging activity:', error);
      onShowToast?.('Failed to log activity', 'error');
    } finally {
      setIsLoggingActivity(false);
    }
  };

  const handleCompleteTaskCancel = () => {
    setShowCompleteTaskModal(false);
    setPendingActivity(null);
  };

  const handleLogActivity = async (outcome?: string | null) => {
    if (hasActiveCadence && nextTask) {
      // Cadence active — show modal to confirm completing this step
      const activityType = nextTask.action_type || 'outbound_call';
      setPendingActivity({ type: activityType, notes: activityNotes, outcome: outcome ?? null, isLastStep: afterNextActionType === null });
      setShowCompleteTaskModal(true);
      return;
    }

    // No active cadence — log a generic activity directly
    setIsLoggingActivity(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: 'outbound_call',
          notes: activityNotes || null,
          outcome: outcome ?? null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log activity');
      }

      onShowToast?.('Activity logged successfully', 'success');
      setActivityNotes('');
      onLeadUpdate?.();
    } catch (error) {
      console.error('Error logging activity:', error);
      onShowToast?.('Failed to log activity', 'error');
    } finally {
      setIsLoggingActivity(false);
    }
  };

  // Handle confirming service and finalizing sale
  const handleConfirmAndFinalize = async (
    confirmedDate: string,
    confirmedTime: string,
    note: string
  ) => {
    try {
      // Update lead status to won and save scheduled date/time
      if (isAdmin) {
        await adminAPI.updateLead(lead.id, {
          lead_status: 'won',
          scheduled_date: confirmedDate,
          scheduled_time: confirmedTime,
        });
      } else {
        await adminAPI.updateUserLead(lead.id, {
          lead_status: 'won',
          scheduled_date: confirmedDate,
          scheduled_time: confirmedTime,
        });
      }

      // If there's a note, add it to activity log
      if (note.trim()) {
        await fetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: lead.company_id,
            entity_type: 'lead',
            entity_id: lead.id,
            activity_type: 'note_added',
            user_id: user?.id,
            notes: note.trim(),
          }),
        });
      }

      onShowToast?.('Sale finalized successfully!', 'success');
    } catch (error) {
      console.error('Failed to finalize sale:', error);
      onShowToast?.('Failed to finalize sale', 'error');
      throw error;
    }
  };

  // Handle emailing quote to customer - triggers parent modal
  const handleEmailQuote = () => {
    onEmailQuote?.();
  };

  // Open the Schedule Service modal (from top section button or Quote tab Ready to Schedule)
  const handleOpenScheduleModal = useCallback(() => {
    setShowScheduleModal(true);
  }, []);

  // Expose the modal trigger to the parent so its header "Finalize Sale" path can open it too
  useEffect(() => {
    onFinalizeSale?.(handleOpenScheduleModal);
  }, [onFinalizeSale, handleOpenScheduleModal]);

  const handleScheduleModalConfirm = useCallback(async () => {
    await handleConfirmAndFinalize(scheduledDate, scheduledTime, confirmationNote);
    try {
      await authenticatedFetch(`/api/leads/${lead.id}/service-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId: quote?.id ?? null }),
      });
    } catch (emailErr) {
      console.error('Service confirmation email failed:', emailErr);
      onShowToast?.(
        'Sale finalized, but confirmation email failed to send',
        'error'
      );
    }
    setShowScheduleModal(false);
    window.location.href = '/tickets/leads';
  // handleConfirmAndFinalize is declared above and is stable within this render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduledDate, scheduledTime, confirmationNote, lead.id, quote?.id]);

  // Switch to the Quote tab, log a "connected" activity, and scroll into view
  const handleStartQuoting = useCallback(async () => {
    try {
      await authenticatedFetch(`/api/leads/${lead.id}/activities`, {
        method: 'POST',
        body: JSON.stringify({
          activity_type: nextTask?.action_type || 'outbound_call',
          notes: activityNotes || null,
          outcome: 'connected',
        }),
      });
      setActivityNotes('');
    } catch (err) {
      console.error('Error logging activity before quoting:', err);
    }
    setIsCommunicationExpanded(false);
    setActiveTab('quote');
    setTimeout(() => {
      quotingSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }, [activityNotes, lead.id, nextTask?.action_type]);

  const tabs: ReadonlyArray<LeadTabDef<'summary' | 'quote' | 'graph' | 'contact' | 'activity'>> = [
    { id: 'summary', label: 'Summary' },
    { id: 'quote', label: 'Quote' },
    { id: 'graph', label: 'Graphing Tool' },
    { id: 'contact', label: 'Contact Details' },
    { id: 'activity', label: 'Record History' },
  ];

  const renderQuoteTab = () => (
    <div ref={quotingSectionRef} className={styles.quoteTabWrapper}>
      <LeadPestPicker
        lead={lead}
        isOpen={isPestModalOpen}
        onClose={() => setIsPestModalOpen(false)}
        onSelectionChange={handlePestSelectionChange}
        onShowToast={onShowToast}
      />
      <LeadQuoteBuilder
        lead={lead}
        selectedPests={pestSelections}
        quote={quote}
        isQuoteLoading={isQuoteLoading}
        broadcastQuoteUpdate={broadcastQuoteUpdate}
        onShowToast={onShowToast}
        onEditPests={() => setIsPestModalOpen(true)}
        onReady={handleQuoteTabReady}
        onLineItemsSaved={onLineItemsSaved}
      />
      {isQuoteTabReady && (
      <div className={styles.quoteTabActions}>
        <button
          type="button"
          onClick={handleEmailQuote}
          className={styles.emailQuoteButton}
        >
          <Mail size={18} />
          Email Quote
        </button>
        {lead.company?.slug && quote?.id && quote?.quote_token && (
          <a
            href={`/${lead.company.slug}/quote/${quote.id}?token=${quote.quote_token}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.viewQuoteLink}
          >
            <ExternalLink size={16} />
            View Quote
          </a>
        )}
        <button
          type="button"
          onClick={onNotInterested || (() => {})}
          className={styles.notInterestedButton}
        >
          Not Interested
        </button>
        <button
          type="button"
          onClick={handleOpenScheduleModal}
          className={styles.readyToScheduleButton}
        >
          Ready to Schedule
          <ChevronRight size={16} />
        </button>
      </div>
      )}
    </div>
  );

  const renderContent = () => {
    return (
      <div className={styles.leadContentWrapper}>
        {/* Full-width communication section */}
        <LeadQuickInfo
          lead={lead}
          isExpanded={isCommunicationExpanded}
          onToggle={() => setIsCommunicationExpanded(p => !p)}
        />
        {isCommunicationExpanded && (
          <div className={styles.communicationBody}>
            <div className={styles.communicationBodyInner}>
              <div className={styles.communicationLeft}>
                <LeadContactSection
                  lead={lead}
                  nextTask={nextTask}
                  afterNextActionType={afterNextActionType}
                  loadingNextTask={loadingNextTask}
                  hasActiveCadence={hasActiveCadence}
                  activityNotes={activityNotes}
                  isLoggingActivity={isLoggingActivity}
                  selectedCadenceId={selectedCadenceId}
                  availableCadences={availableCadences}
                  cadenceSteps={cadenceSteps}
                  cadenceStartedAt={cadenceStartedAt}
                  activeWorkflowExecution={activeWorkflowExecution}
                  onNotesChange={setActivityNotes}
                  onLogActivity={handleLogActivity}
                  onCadenceSelect={id => {
                    setSelectedCadenceId(id);
                    loadCadenceData();
                  }}
                  onStartQuoting={handleStartQuoting}
                  onScheduleService={handleOpenScheduleModal}
                  onShowToast={onShowToast}
                  onLeadUpdate={onLeadUpdate}
                  isSidebarExpanded={false}
                />
              </div>
              <div className={styles.communicationRight}>
                <CommunicationLog
                  entityId={lead.id}
                  companyId={lead.company_id}
                />
              </div>
            </div>
          </div>
        )}

        <LeadTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <div className={styles.tabPanel}>
          <div className={styles.tabPanelInner}>
            {activeTab === 'summary' && <LeadCallFormInfo lead={lead} quote={quote} />}
            {activeTab === 'quote' && renderQuoteTab()}
            {activeTab === 'graph' && (
              lead.map_plot_data ? (
                <MapPlotCanvas
                  mapPlotData={lead.map_plot_data}
                  onChange={() => {}}
                  isReadOnly
                  companyId={lead.company_id}
                />
              ) : (
                <div className={styles.noMapState}>No map available for this lead.</div>
              )
            )}
            {activeTab === 'contact' && (
              <LeadContactDetailsPanel
                lead={lead}
                onShowToast={onShowToast}
                onRequestUndo={onRequestUndo}
                onLeadUpdate={onLeadUpdate}
                customerChannelRef={customerChannelRef}
              />
            )}
            {activeTab === 'activity' && (
              <LeadActivityNotesPanel
                lead={lead}
                customerComment={quote?.customer_comments}
              />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <ActiveSectionProvider>
      {renderContent()}
      <CompleteTaskModal
        isOpen={showCompleteTaskModal}
        task={
          nextTask
            ? {
                day_number: nextTask.day_number,
                action_type: nextTask.action_type,
                time_of_day: nextTask.time_of_day,
                due_date: nextTask.due_date,
                due_time: nextTask.due_time,
                priority: nextTask.priority,
              }
            : null
        }
        onConfirm={handleCompleteTaskConfirm}
        onSkip={handleCompleteTaskSkip}
        onCancel={handleCompleteTaskCancel}
      />
      <ScheduleServiceModal
        isOpen={showScheduleModal}
        lead={lead}
        quote={quote}
        scheduledDate={scheduledDate}
        scheduledTime={scheduledTime}
        timeOptions={timeOptions}
        onScheduledDateChange={setScheduledDate}
        onScheduledTimeChange={setScheduledTime}
        onConfirm={handleScheduleModalConfirm}
        onClose={() => setShowScheduleModal(false)}
      />
    </ActiveSectionProvider>
  );
}
