import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Lead } from '@/types/lead';
import { CompleteTaskModal } from '@/components/Common/CompleteTaskModal/CompleteTaskModal';
import { useUser } from '@/hooks/useUser';
import { usePricingSettings } from '@/hooks/usePricingSettings';
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
import { ActiveSectionProvider } from '@/contexts/ActiveSectionContext';
import styles from './LeadStepContent.module.scss';
import { LeadDetailsSidebar } from './components/LeadDetailsSidebar/LeadDetailsSidebar';
import { LeadSchedulingSection } from './components/LeadSchedulingSection';
import { LeadContactSection } from './components/LeadContactSection';
import { LeadQuoteSection } from './components/LeadQuoteSection';

interface LeadStepContentProps {
  lead: Lead;
  isAdmin: boolean;
  onLeadUpdate?: (updatedLead?: Lead) => void;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
  onRequestUndo?: (undoHandler: () => Promise<void>) => void;
  onEmailQuote?: () => void;
  onFinalizeSale?: (handler: () => void) => void;
  onNotInterested?: () => void;
  onReadyToSchedule?: () => void;
}

export function LeadStepContent({
  lead,
  isAdmin,
  onLeadUpdate,
  onShowToast,
  onRequestUndo,
  onEmailQuote,
  onFinalizeSale,
  onNotInterested,
  onReadyToSchedule,
}: LeadStepContentProps) {
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [shouldExpandActivity, setShouldExpandActivity] = useState(false);
  const [showCompleteTaskModal, setShowCompleteTaskModal] = useState(false);
  const [pendingActivity, setPendingActivity] = useState<{
    type: string;
    notes: string;
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
  const serviceLocationCardRef = useRef<HTMLDivElement | null>(null);

  const [homeSize, setHomeSize] = useState<number | ''>('');
  const [yardSize, setYardSize] = useState<number | ''>('');
  const [linearFeet, setLinearFeet] = useState<number | ''>('');
  const [selectedHomeSizeOption, setSelectedHomeSizeOption] =
    useState<string>('');
  const [selectedYardSizeOption, setSelectedYardSizeOption] =
    useState<string>('');

  // Quote step state
  const [selectedPests, setSelectedPests] = useState<string[]>([]);
  const [additionalPests, setAdditionalPests] = useState<string[]>([]);

  const [preferredDate, setPreferredDate] = useState<string>('');
  const [preferredTime, setPreferredTime] = useState<string>('');

  // Contact Log activity state
  const [selectedActionType, setSelectedActionType] = useState<string>('');
  const [activityNotes, setActivityNotes] = useState<string>('');
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);
  const [nextTask, setNextTask] = useState<any | null>(null);
  const [loadingNextTask, setLoadingNextTask] = useState(false);
  const [hasActiveCadence, setHasActiveCadence] = useState<boolean | null>(
    null
  );
  const [selectedCadenceId, setSelectedCadenceId] = useState<string | null>(
    null
  );
  const [shouldExpandServiceLocation, setShouldExpandServiceLocation] =
    useState(false);

  const { user } = useUser();
  const { settings: pricingSettings } = usePricingSettings(lead.company_id);

  // Real-time quote updates - single source of truth
  // Enable for all statuses to allow quote building at any stage
  const {
    quote,
    isUpdating: isQuoteUpdating,
    broadcastUpdate: broadcastQuoteUpdate,
  } = useQuoteRealtime({
    leadId: lead.id,
    userId: user?.id,
    enabled: true,
    onQuoteUpdate: (updatedQuote) => {
      console.log('[LeadStepContent] Quote updated via realtime, refreshing lead data');
      // When quote updates, refresh the lead to get updated service_address
      if (onLeadUpdate) {
        onLeadUpdate();
      }
    },
  });

  // Set default assignee to current user when component loads
  useEffect(() => {
    if (user?.id && !selectedAssignee) {
      setSelectedAssignee(user.id);
    }
  }, [user?.id, selectedAssignee]);

  // Function to load cadence data and next task - made reusable for refresh after completion
  const loadCadenceData = useCallback(async () => {
    try {
      setLoadingNextTask(true);

      // Check if lead has active cadence (authenticatedFetch returns JSON directly, not Response)
      const cadenceResult = await authenticatedFetch(
        `/api/leads/${lead.id}/cadence`
      );
      const hasActiveCadence =
        cadenceResult.data !== null &&
        cadenceResult.data.completed_at === null;
      setHasActiveCadence(hasActiveCadence);

      // Only fetch next task if cadence exists
      if (hasActiveCadence) {
        const taskResult = await authenticatedFetch(
          `/api/leads/${lead.id}/next-task`
        );
        setNextTask(taskResult.data);
      } else {
        setNextTask(null);
      }
    } catch (error) {
      console.error('Error loading cadence data:', error);
      // If there's an error, assume no cadence
      setHasActiveCadence(false);
      setNextTask(null);
    } finally {
      setLoadingNextTask(false);
    }
  }, [lead.id]);

  // Load next recommended task from cadence and check if cadence exists
  useEffect(() => {
    loadCadenceData();
  }, [loadCadenceData]);

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
    subscribeToCustomerUpdates(channel, () => {
      // Empty callback - channel subscription required for broadcasting
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
    subscribeToTaskUpdates(channel, async (payload) => {
      // Check if this task is related to our lead by fetching task details
      // This prevents unnecessary reloads for tasks unrelated to this lead
      try {
        // For DELETE operations, we can't fetch the task, so we reload cadence data
        if (payload.action === 'DELETE') {
          await loadCadenceData();
          return;
        }

        // For INSERT/UPDATE, fetch the task to check if it's for this lead
        const taskResponse = await authenticatedFetch(`/api/tasks/${payload.task_id}`);

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


  const currentUser = user
    ? {
        id: user.id,
        name:
          `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
          user.email?.split('@')[0] ||
          'Unknown',
        avatar: user.user_metadata?.avatar_url,
      }
    : null;

  const handleCompleteTaskConfirm = async () => {
    if (!pendingActivity) return;

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
        }),
      });

      if (!activityResponse.ok) {
        throw new Error('Failed to log activity');
      }

      // 2. Complete the task if it exists
      if (nextTask?.task_id) {
        const taskResponse = await fetch(`/api/tasks/${nextTask.task_id}/complete`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}), // Empty body - actual_hours is optional
        });

        if (!taskResponse.ok) {
          console.error('Failed to complete task, but activity was logged');
          // Don't throw - activity was logged successfully
        }
      }

      onShowToast?.('Activity logged and task marked complete', 'success');
      setActivityNotes('');
      setSelectedActionType('');
      setPendingActivity(null);

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
      setSelectedActionType('');
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

  const handleLogActivityFromSection = async (
    type: string,
    notes: string,
    matchesTask: boolean
  ) => {
    if (matchesTask) {
      // Show modal to ask if they want to mark task complete
      setPendingActivity({ type, notes });
      setShowCompleteTaskModal(true);
      return;
    }

    // If doesn't match, just log the activity without asking
    setIsLoggingActivity(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: type,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log activity');
      }

      onShowToast?.('Activity logged successfully', 'success');
      setActivityNotes('');
      setSelectedActionType('');
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

      // Redirect to All Leads page
      window.location.href = '/tickets/leads';
    } catch (error) {
      console.error('Failed to finalize sale:', error);
      onShowToast?.('Failed to finalize sale', 'error');
      throw error;
    }
  };

  // Handle finalizing sale directly without modal
  const handleFinalizeSale = () => {
    handleConfirmAndFinalize(scheduledDate, scheduledTime, confirmationNote);
  };

  // Handle emailing quote to customer - triggers parent modal
  const handleEmailQuote = () => {
    onEmailQuote?.();
  };

  // Handle edit address button click - expand sidebar and scroll to Service Location card
  const handleEditAddress = () => {
    // Expand sidebar if collapsed
    setIsSidebarExpanded(true);

    // Set flag to expand Service Location card
    setShouldExpandServiceLocation(true);

    // Scroll to Service Location card after a brief delay to allow sidebar expansion
    setTimeout(() => {
      serviceLocationCardRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      // Reset the flag after expansion
      setTimeout(() => {
        setShouldExpandServiceLocation(false);
      }, 500);
    }, 300);
  };

  // Handle view log history button click - expand sidebar and open Activity section
  const handleViewLogHistory = () => {
    // Expand sidebar if collapsed
    setIsSidebarExpanded(true);

    // Set flag to expand Activity card
    setShouldExpandActivity(true);

    // Reset the flag after expansion
    setTimeout(() => {
      setShouldExpandActivity(false);
    }, 500);
  };

  // Render content based on lead status
  const renderContent = () => {
    // Show all sections simultaneously instead of conditionally based on status
    return (
      <div
        className={styles.leadContentWrapper}
        data-sidebar-expanded={isSidebarExpanded}
      >
        <div className={styles.contentLeft}>
          <LeadContactSection
            lead={lead}
            nextTask={nextTask}
            loadingNextTask={loadingNextTask}
            hasActiveCadence={hasActiveCadence}
            selectedActionType={selectedActionType}
            activityNotes={activityNotes}
            isLoggingActivity={isLoggingActivity}
            selectedCadenceId={selectedCadenceId}
            onActionTypeChange={setSelectedActionType}
            onActivityNotesChange={setActivityNotes}
            onLogActivity={handleLogActivityFromSection}
            onCadenceSelect={(id) => {
              setSelectedCadenceId(id);
              // Immediately reload cadence data when cadence is selected/changed
              loadCadenceData();
            }}
            onShowToast={onShowToast}
            onLeadUpdate={onLeadUpdate}
            onViewLogHistory={handleViewLogHistory}
            isSidebarExpanded={isSidebarExpanded}
          />
          <LeadQuoteSection
            lead={lead}
            quote={quote}
            isQuoteUpdating={isQuoteUpdating}
            pricingSettings={pricingSettings}
            selectedPests={selectedPests}
            additionalPests={additionalPests}
            homeSize={homeSize}
            yardSize={yardSize}
            linearFeet={linearFeet}
            selectedHomeSizeOption={selectedHomeSizeOption}
            selectedYardSizeOption={selectedYardSizeOption}
            preferredDate={preferredDate}
            preferredTime={preferredTime}
            onEmailQuote={handleEmailQuote}
            onEditAddress={handleEditAddress}
            onShowToast={onShowToast}
            onRequestUndo={onRequestUndo}
            broadcastQuoteUpdate={broadcastQuoteUpdate}
            setSelectedPests={setSelectedPests}
            setAdditionalPests={setAdditionalPests}
            setHomeSize={setHomeSize}
            setYardSize={setYardSize}
            setLinearFeet={setLinearFeet}
            setSelectedHomeSizeOption={setSelectedHomeSizeOption}
            setSelectedYardSizeOption={setSelectedYardSizeOption}
            onPreferredDateChange={setPreferredDate}
            onPreferredTimeChange={setPreferredTime}
            onNotInterested={onNotInterested || (() => {})}
            onReadyToSchedule={onReadyToSchedule || (() => {})}
            isSidebarExpanded={isSidebarExpanded}
          />
          <LeadSchedulingSection
            lead={lead}
            quote={quote}
            isQuoteUpdating={isQuoteUpdating}
            scheduledDate={scheduledDate}
            scheduledTime={scheduledTime}
            confirmationNote={confirmationNote}
            onScheduledDateChange={setScheduledDate}
            onScheduledTimeChange={setScheduledTime}
            onConfirmationNoteChange={setConfirmationNote}
            onFinalizeSale={handleFinalizeSale}
            onEmailQuote={handleEmailQuote}
            isSidebarExpanded={isSidebarExpanded}
          />
        </div>
        <LeadDetailsSidebar
          lead={lead}
          onShowToast={onShowToast}
          onLeadUpdate={onLeadUpdate}
          onRequestUndo={onRequestUndo}
          customerChannelRef={customerChannelRef}
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
          serviceLocationCardRef={serviceLocationCardRef}
          shouldExpandServiceLocation={shouldExpandServiceLocation}
          shouldExpandActivity={shouldExpandActivity}
        />
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
    </ActiveSectionProvider>
  );
}
