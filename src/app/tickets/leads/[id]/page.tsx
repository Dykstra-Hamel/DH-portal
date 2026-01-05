'use client';

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  Suspense,
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  Headset,
  ChevronRight,
  RefreshCcwDot,
  Plus,
  Mail,
  ExternalLink,
  CalendarCheck,
} from 'lucide-react';
import { adminAPI } from '@/lib/api-client';
import { Lead } from '@/types/lead';
import { isAuthorizedAdminSync } from '@/lib/auth-helpers';
import {
  createLeadChannel,
  subscribeToLeadUpdates,
  removeLeadChannel,
  LeadUpdatePayload,
} from '@/lib/realtime/lead-channel';
import { StepItem } from '@/components/Common/Step/Step';
import { LeadStepWrapper } from '@/components/Common/LeadStepWrapper/LeadStepWrapper';
import { LeadStepContent } from '@/components/Common/LeadStepContent/LeadStepContent';
import { ReassignModal } from '@/components/Common/ReassignModal/ReassignModal';
import { LiveCallModal } from '@/components/Common/LiveCallModal/LiveCallModal';
import { QuickTaskModal } from '@/components/Common/QuickTaskModal/QuickTaskModal';
import { NotInterestedModal } from '@/components/Common/NotInterestedModal/NotInterestedModal';
import { ReadyToScheduleModal } from '@/components/Common/ReadyToScheduleModal/ReadyToScheduleModal';
import { EmailQuoteModal } from '@/components/Common/EmailQuoteModal/EmailQuoteModal';
import { ConvertToSupportModal } from '@/components/Common/ConvertToSupportModal/ConvertToSupportModal';
import { MarkAsJunkModal } from '@/components/Common/MarkAsJunkModal/MarkAsJunkModal';
import { Toast } from '@/components/Common/Toast';
import { GlobalLowerHeader } from '@/components/Layout/GlobalLowerHeader/GlobalLowerHeader';
import { usePageActions } from '@/contexts/PageActionsContext';
import { formatHeaderDate } from '@/lib/date-utils';
import { useUser } from '@/hooks/useUser';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import styles from './page.module.scss';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface LeadPageProps {
  params: Promise<{ id: string }>;
}

function LeadDetailPageContent({ params }: LeadPageProps) {
  const [user, setUser] = useState<User | null>(null);
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [leadLoading, setLeadLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [undoHandler, setUndoHandler] = useState<(() => Promise<void>) | null>(
    null
  );
  const [isUndoing, setIsUndoing] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showLiveCallModal, setShowLiveCallModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showNotInterestedModal, setShowNotInterestedModal] = useState(false);
  const [showReadyToScheduleModal, setShowReadyToScheduleModal] =
    useState(false);
  const [showEmailQuoteModal, setShowEmailQuoteModal] = useState(false);
  const [showConvertToSupportModal, setShowConvertToSupportModal] =
    useState(false);
  const [showMarkAsJunkModal, setShowMarkAsJunkModal] = useState(false);
  const router = useRouter();
  const { setPageHeader } = usePageActions();

  // Assignment state
  const [ticketType, setTicketType] = useState('sales');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [selectedScheduler, setSelectedScheduler] = useState('');

  // Hooks
  const { user: currentUser, profile: currentProfile } = useUser();
  const { users: assignableUsers } = useAssignableUsers({
    companyId: lead?.company_id,
    departmentType: ticketType === 'support' ? 'support' : 'sales',
    enabled: ticketType !== 'junk',
  });

  // Create stable currentUser object to prevent infinite loops
  const stableCurrentUser = useMemo(() => {
    if (!currentUser || !currentProfile) return null;
    return {
      id: currentUser.id,
      name:
        `${currentProfile.first_name || ''} ${currentProfile.last_name || ''}`.trim() ||
        currentUser.email ||
        'Unknown',
      email: currentUser.email || '',
      avatar: currentProfile.avatar_url || undefined,
    };
  }, [
    currentUser?.id,
    currentUser?.email,
    currentProfile?.first_name,
    currentProfile?.last_name,
    currentProfile?.avatar_url,
  ]);

  // Create stable assignableUsers array to prevent infinite loops
  const stableAssignableUsers = useMemo(() => {
    return assignableUsers || [];
  }, [JSON.stringify(assignableUsers)]);

  // Ref to store the finalize sale modal trigger function from LeadStepContent
  const finalizeSaleModalTrigger = useRef<(() => void) | null>(null);

  // Step configuration for leads
  const leadSteps: StepItem[] = [
    {
      id: 'qualify',
      label: 'Assign Stage',
      subLabel: 'In Progress',
      status: 'upcoming',
    },
    {
      id: 'in_process',
      label: 'Communication Stage',
      subLabel: 'Pending',
      status: 'upcoming',
    },
    {
      id: 'quoted',
      label: 'Quote Stage',
      subLabel: 'Pending',
      status: 'upcoming',
    },
    {
      id: 'scheduling',
      label: 'Schedule Stage',
      subLabel: 'Pending',
      status: 'disabled',
    },
  ];

  // Handle status progression button
  const handleProgressStatus = async () => {
    if (!lead || !leadId) return;

    let newStatus: string;
    let successMessage: string;

    switch (lead.lead_status) {
      case 'new':
        newStatus = 'in_process';
        successMessage = 'Lead moved to Contact stage successfully!';
        break;
      case 'in_process':
        newStatus = 'quoted';
        successMessage = 'Lead moved to Quote stage successfully!';
        break;
      case 'quoted':
        newStatus = 'scheduling';
        successMessage = 'Lead marked as Ready to Schedule successfully!';
        break;
      default:
        return; // No progression available
    }

    try {
      if (isAdmin) {
        await adminAPI.updateLead(leadId, {
          lead_status: newStatus,
        });
      } else {
        await adminAPI.updateUserLead(leadId, {
          lead_status: newStatus,
        });
      }

      // If moving to quoted status, ensure quote exists
      if (newStatus === 'quoted') {
        try {
          const response = await fetch(`/api/leads/${leadId}/quote`, {
            method: 'GET',
          });
          const data = await response.json();

          // If no quote exists, the ensureQuoteExists will be called on the Quote step load
        } catch (error) {
          console.error('Error checking quote:', error);
        }
      }

      await fetchLead();
      handleShowToast(successMessage, 'success');
    } catch (error) {
      console.error('Error updating lead status:', error);
      handleShowToast(
        'Failed to update lead status. Please try again.',
        'error'
      );
    }
  };

  // Handle mark as lost button
  const handleMarkAsLost = async () => {
    if (!lead || !leadId) return;

    try {
      if (isAdmin) {
        await adminAPI.updateLead(leadId, {
          lead_status: 'lost',
        });
      } else {
        await adminAPI.updateUserLead(leadId, {
          lead_status: 'lost',
        });
      }
      await fetchLead();
      handleShowToast('Lead marked as lost successfully!', 'success');
    } catch (error) {
      console.error('Error marking lead as lost:', error);
      handleShowToast(
        'Failed to mark lead as lost. Please try again.',
        'error'
      );
    }
  };

  // Get dynamic button text based on current status
  const getPrimaryButtonText = () => {
    if (!lead) return 'Next Step';

    switch (lead.lead_status) {
      case 'new':
      case 'in_process':
        return (
          <>
            <Headset size={18} />
            Live Call
            <ChevronRight size={18} />
          </>
        );
      case 'quoted':
        return (
          <>
            Ready to Schedule
            <ChevronRight size={18} />
          </>
        );
      case 'scheduling':
        return (
          <>
            <CalendarCheck size={18} />
            Finalize Sale
          </>
        );
      default:
        return 'Next Step';
    }
  };

  // Get handler for primary button
  const handlePrimaryAction = () => {
    if (!lead) return;

    if (lead.lead_status === 'new' || lead.lead_status === 'in_process') {
      handleLiveCall();
    } else if (lead.lead_status === 'quoted') {
      handleReadyToSchedule();
    } else if (lead.lead_status === 'scheduling') {
      handleFinalizeSale();
    } else {
      handleProgressStatus();
    }
  };

  // Handle finalize sale - triggers the modal from LeadStepContent
  const handleFinalizeSale = () => {
    if (finalizeSaleModalTrigger.current) {
      finalizeSaleModalTrigger.current();
    }
  };

  // Determine if primary button should be shown
  const shouldShowPrimaryButton = () => {
    if (!lead) return false;
    return ['new', 'in_process', 'quoted', 'scheduling'].includes(
      lead.lead_status
    );
  };

  // Determine if secondary button should be shown
  const shouldShowSecondaryButton = () => {
    if (!lead) return false;
    return lead.lead_status !== 'lost';
  };

  // Handle reassign modal
  const handleReassign = () => {
    setShowReassignModal(true);
  };

  const handleReassignSubmit = async (assigneeId: string) => {
    if (!leadId) return;

    try {
      const updateData: any = {};
      let successMessage = 'Lead reassigned successfully!';

      if (assigneeId === 'sales_team') {
        updateData.assigned_to = null;
        // Keep current status when assigned to team
        successMessage = 'Lead assigned to sales team successfully!';
      } else {
        updateData.assigned_to = assigneeId;
        // Auto-progress status only if currently new
        if (lead?.lead_status === 'new') {
          updateData.lead_status = 'in_process';
          successMessage = 'Lead assigned and status updated to in process!';
        } else {
          successMessage = 'Lead reassigned successfully!';
        }
      }

      if (isAdmin) {
        await adminAPI.updateLead(leadId, updateData);
      } else {
        await adminAPI.updateUserLead(leadId, updateData);
      }

      await fetchLead();
      handleShowToast(successMessage, 'success');
    } catch (error) {
      console.error('Error reassigning lead:', error);
      handleShowToast('Failed to reassign lead. Please try again.', 'error');
      throw error;
    }
  };

  // Handle move to previous step
  const handleMoveToPrevious = async () => {
    if (!lead || !leadId) return;

    let previousStatus: string;
    let successMessage: string;

    switch (lead.lead_status) {
      case 'quoted':
        previousStatus = 'in_process';
        successMessage = 'Lead moved back to Contact stage successfully!';
        break;
      case 'in_process':
        previousStatus = 'new';
        successMessage = 'Lead moved back to Qualify stage successfully!';
        break;
      default:
        return; // No previous step available
    }

    try {
      if (isAdmin) {
        await adminAPI.updateLead(leadId, {
          lead_status: previousStatus,
        });
      } else {
        await adminAPI.updateUserLead(leadId, {
          lead_status: previousStatus,
        });
      }
      await fetchLead();
      handleShowToast(successMessage, 'success');
    } catch (error) {
      console.error('Error moving to previous step:', error);
      handleShowToast(
        'Failed to move to previous step. Please try again.',
        'error'
      );
    }
  };

  // Handle archive lead
  const handleArchiveLead = async () => {
    if (!leadId) return;

    try {
      if (isAdmin) {
        await adminAPI.updateLead(leadId, {
          lead_status: 'lost',
          archived: true,
        });
      } else {
        await adminAPI.updateUserLead(leadId, {
          lead_status: 'lost',
          archived: true,
        });
      }
      await fetchLead();
      handleShowToast('Lead archived successfully!', 'success');
    } catch (error) {
      console.error('Error archiving lead:', error);
      handleShowToast('Failed to archive lead. Please try again.', 'error');
    }
  };

  // Check if previous step is available
  const canMoveToPrevious = () => {
    if (!lead) return false;
    return ['quoted', 'in_process'].includes(lead.lead_status);
  };

  // Create dropdown actions
  const getDropdownActions = () => {
    if (!lead) return [];

    const actions = [];

    // Primary action
    if (shouldShowPrimaryButton()) {
      actions.push({
        label: getPrimaryButtonText(),
        onClick: handleProgressStatus,
        disabled: false,
      });
    }

    // Reassign action
    actions.push({
      label: 'Reassign Lead',
      onClick: handleReassign,
      disabled: false,
    });

    // Move to previous step
    if (canMoveToPrevious()) {
      const previousStepLabel =
        lead.lead_status === 'quoted'
          ? 'Move to Contact'
          : lead.lead_status === 'in_process'
            ? 'Move to Qualify'
            : '';
      if (previousStepLabel) {
        actions.push({
          label: previousStepLabel,
          onClick: handleMoveToPrevious,
          disabled: false,
        });
      }
    }

    // Archive lead
    if (lead.lead_status !== 'lost' && !lead.archived) {
      actions.push({
        label: 'Archive Lead',
        onClick: handleArchiveLead,
        disabled: false,
      });
    }

    return actions;
  };

  // Initialize assignment state from lead
  useEffect(() => {
    if (lead) {
      setSelectedAssignee(lead.assigned_to || '');
      setSelectedScheduler(lead.assigned_scheduler || '');
    }
  }, [lead]);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setLeadId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    const supabase = createClient();

    const getSessionAndData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        router.push('/login');
        return;
      }

      setUser(session.user);

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (!profileError && profileData) {
        setProfile(profileData);
        setIsAdmin(isAuthorizedAdminSync(profileData));
      }

      setLoading(false);
    };

    getSessionAndData();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!session?.user) {
        router.push('/login');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  const fetchLead = useCallback(
    async (updatedLead?: Lead) => {
      // If we have an updated lead passed in (optimistic update), use it directly
      if (updatedLead) {
        setLead(updatedLead);
        return;
      }

      // Otherwise fetch from API
      if (!leadId) return;

      try {
        setLeadLoading(true);
        let leadData;
        if (isAdmin) {
          leadData = await adminAPI.getLead(leadId);
        } else {
          leadData = await adminAPI.getUserLead(leadId);
        }
        setLead(leadData);
      } catch (error) {
        console.error('Error fetching lead:', error);
        setLead(null);
      } finally {
        setLeadLoading(false);
      }
    },
    [leadId, isAdmin]
  );

  // Fetch lead when leadId is available
  useEffect(() => {
    if (leadId && !loading) {
      fetchLead();
    }
  }, [leadId, loading, fetchLead]);

  // Set up realtime subscription for lead updates
  useEffect(() => {
    if (!lead?.company_id || !leadId) return;

    const channel = createLeadChannel(lead.company_id);
    const companyId = lead.company_id; // Capture for closure

    subscribeToLeadUpdates(channel, async (payload: LeadUpdatePayload) => {
      const { company_id, action, lead_id } = payload;

      // Verify this is for our company and our lead
      if (company_id !== companyId || lead_id !== leadId) {
        return;
      }

      // Handle updates by fetching only the assignment/status fields
      if (action === 'UPDATE') {
        try {
          const supabase = createClient();
          const { data: updatedLead, error } = await supabase
            .from('leads')
            .select('id, assigned_to, assigned_scheduler, lead_status')
            .eq('id', leadId)
            .single();

          if (!error && updatedLead) {
            // Update the lead state with new assignment fields
            setLead(prev => {
              if (!prev) return prev;

              // Check if values actually changed
              const changed =
                updatedLead.assigned_to !== prev.assigned_to ||
                updatedLead.assigned_scheduler !== prev.assigned_scheduler ||
                updatedLead.lead_status !== prev.lead_status;

              if (!changed) return prev;

              // Fetch the user profiles separately if assignment changed
              if (updatedLead.assigned_to !== prev.assigned_to ||
                  updatedLead.assigned_scheduler !== prev.assigned_scheduler) {
                // Fetch profiles for the new assignees
                (async () => {
                  const userIds = [
                    updatedLead.assigned_to,
                    updatedLead.assigned_scheduler
                  ].filter(Boolean) as string[];

                  if (userIds.length > 0) {
                    const { data: profiles } = await supabase
                      .from('profiles')
                      .select('id, email, first_name, last_name, avatar_url')
                      .in('id', userIds);

                    if (profiles) {
                      const profileMap = new Map(profiles.map(p => [p.id, p]));
                      setLead(current => current ? {
                        ...current,
                        assigned_user: updatedLead.assigned_to
                          ? profileMap.get(updatedLead.assigned_to)
                          : undefined,
                        scheduler_user: updatedLead.assigned_scheduler
                          ? profileMap.get(updatedLead.assigned_scheduler)
                          : undefined,
                      } : current);
                    }
                  } else {
                    // No assignees, clear the user objects
                    setLead(current => current ? {
                      ...current,
                      assigned_user: undefined,
                      scheduler_user: undefined,
                    } : current);
                  }
                })();
              }

              // Return new object with updated fields
              return {
                ...prev,
                assigned_to: updatedLead.assigned_to,
                assigned_scheduler: updatedLead.assigned_scheduler,
                lead_status: updatedLead.lead_status,
              };
            });
          }
        } catch (error) {
          console.error('Error fetching updated lead fields:', error);
        }
      } else if (action === 'DELETE') {
        // Lead was deleted, redirect to leads list
        router.push('/tickets/leads');
      }
    });

    return () => {
      removeLeadChannel(channel);
    };
  }, [lead?.company_id, leadId, router]);

  const handleBack = () => {
    router.push('/tickets/leads');
  };

  const handleShowToast = useCallback(
    (message: string, type: 'success' | 'error') => {
      setToastMessage(message);
      setToastType(type);
      setShowToast(true);
    },
    []
  );

  // Handle ticket type change (direct, no modal)
  const handleLeadTypeChange = useCallback((type: string) => {
    setTicketType(type);
    setSelectedAssignee(''); // Reset assignee when type changes
  }, []);

  // Handle ticket type change with modal for support/junk conversions
  const handleLeadTypeChangeWithModal = useCallback((type: string) => {
    // If changing to sales, just update state directly
    if (type === 'sales') {
      setTicketType(type);
      setSelectedAssignee('');
      return;
    }

    // For support, show convert to support modal
    if (type === 'support') {
      setShowConvertToSupportModal(true);
      return;
    }

    // For junk, show mark as junk modal
    if (type === 'junk') {
      setShowMarkAsJunkModal(true);
      return;
    }
  }, []);

  // Handle convert to support confirmation
  const handleConvertToSupport = useCallback(
    async (notes: string) => {
      if (!leadId || !lead || !currentUser) return;

      try {
        // Check if the currently assigned sales user also has support department access
        const assignedSalesUser = lead.assigned_to ? lead.assigned_user : null;
        const hasSupportAccess = assignedSalesUser?.departments?.includes('support') || false;

        // Create support case
        const supportCaseData = {
          customer_id: lead.customer_id,
          company_id: lead.company_id,
          issue_type: 'general_inquiry',
          summary: `Converted from sales lead${lead.customer ? ` - ${lead.customer.first_name} ${lead.customer.last_name}` : ''}`,
          description: notes || lead.comments || 'Converted from sales lead',
          status: hasSupportAccess ? 'in_progress' : 'unassigned',
          priority: 'medium',
          assigned_to: hasSupportAccess ? lead.assigned_to : null,
        };

        await adminAPI.supportCases.create(supportCaseData);

        // Archive the lead
        if (isAdmin) {
          await adminAPI.updateLead(leadId, { archived: true });
        } else {
          await adminAPI.updateUserLead(leadId, { archived: true });
        }

        const successMessage = hasSupportAccess
          ? 'Support case created and assigned to sales rep (lead archived)'
          : 'Support case created as unassigned (lead archived)';
        handleShowToast(successMessage, 'success');
        // Navigate back to leads page
        router.push('/tickets/leads');
      } catch (error) {
        console.error('Error converting to support case:', error);
        handleShowToast(
          error instanceof Error
            ? error.message
            : 'Failed to convert to support case',
          'error'
        );
        throw error; // Re-throw so modal can handle loading state
      } finally {
        setShowConvertToSupportModal(false);
      }
    },
    [leadId, lead, currentUser, isAdmin, handleShowToast, router]
  );

  // Handle mark as junk confirmation
  const handleMarkAsJunk = useCallback(
    async (reason: string) => {
      if (!leadId || !lead) return;

      try {
        // Archive the lead as junk
        const updateData: any = {
          archived: true,
          lead_status: 'lost',
          lost_reason: reason || 'junk',
        };

        if (isAdmin) {
          await adminAPI.updateLead(leadId, updateData);
        } else {
          await adminAPI.updateUserLead(leadId, updateData);
        }

        handleShowToast('Lead marked as junk and archived', 'success');
        // Navigate back to leads page
        router.push('/tickets/leads');
      } catch (error) {
        console.error('Error marking as junk:', error);
        handleShowToast(
          error instanceof Error
            ? error.message
            : 'Failed to mark lead as junk',
          'error'
        );
        throw error; // Re-throw so modal can handle loading state
      } finally {
        setShowMarkAsJunkModal(false);
      }
    },
    [leadId, lead, isAdmin, handleShowToast, router]
  );

  // Handle assignee change
  const handleAssigneeChange = useCallback(
    async (assigneeId: string) => {
      if (!leadId) return;

      setSelectedAssignee(assigneeId);

      try {
        const updateData: any = {};
        let successMessage = 'Lead assigned successfully!';

        if (ticketType === 'sales') {
          if (assigneeId === 'sales_team') {
            updateData.assigned_to = null;
            successMessage = 'Lead assigned to sales team successfully!';
          } else {
            updateData.assigned_to = assigneeId;
            // Auto-progress status only if currently new
            if (lead?.lead_status === 'new') {
              updateData.lead_status = 'in_process';
              successMessage = 'Lead assigned and status updated to in process!';
            } else {
              successMessage = 'Lead assigned successfully!';
            }
          }
        } else if (ticketType === 'support') {
          if (assigneeId === 'support_team') {
            updateData.assigned_to = null;
            successMessage = 'Case assigned to support team successfully!';
          } else {
            updateData.assigned_to = assigneeId;
            successMessage = 'Case assigned successfully!';
          }
        } else if (ticketType === 'junk') {
          updateData.lead_status = 'lost';
          updateData.lost_reason = 'junk';
          successMessage = 'Lead marked as junk successfully!';
        }

        if (isAdmin) {
          await adminAPI.updateLead(leadId, updateData);
        } else {
          await adminAPI.updateUserLead(leadId, updateData);
        }

        await fetchLead();
        handleShowToast(successMessage, 'success');
      } catch (error) {
        console.error('Error assigning lead:', error);
        handleShowToast('Failed to assign lead. Please try again.', 'error');
      }
    },
    [leadId, lead, ticketType, isAdmin, fetchLead, handleShowToast]
  );

  // Handle scheduler change
  const handleSchedulerChange = useCallback(
    async (schedulerId: string) => {
      if (!leadId) return;

      setSelectedScheduler(schedulerId);

      try {
        if (isAdmin) {
          await adminAPI.updateLead(leadId, {
            assigned_scheduler: schedulerId,
          });
        } else {
          await adminAPI.updateUserLead(leadId, {
            assigned_scheduler: schedulerId,
          });
        }

        await fetchLead();
        handleShowToast('Scheduler assigned successfully!', 'success');
      } catch (error) {
        console.error('Error assigning scheduler:', error);
        handleShowToast(
          'Failed to assign scheduler. Please try again.',
          'error'
        );
      }
    },
    [leadId, isAdmin, fetchLead, handleShowToast]
  );

  // Handle status change
  const handleStatusChange = useCallback(
    async (status: string) => {
      if (!leadId || !lead) return;

      try {
        const updateData: any = { lead_status: status };

        // If changing to "new" status, unassign users to set it back to unassigned state
        if (status === 'new') {
          updateData.assigned_to = null;
          updateData.assigned_scheduler = null;
        }

        if (isAdmin) {
          await adminAPI.updateLead(leadId, updateData);
        } else {
          await adminAPI.updateUserLead(leadId, updateData);
        }

        await fetchLead();

        const message = status === 'new'
          ? 'Lead status updated and users unassigned successfully!'
          : 'Lead status updated successfully!';
        handleShowToast(message, 'success');
      } catch (error) {
        console.error('Error updating lead status:', error);
        handleShowToast(
          'Failed to update lead status. Please try again.',
          'error'
        );
      }
    },
    [leadId, lead, isAdmin, fetchLead, handleShowToast]
  );

  // Update page header when lead data changes
  useEffect(() => {
    if (lead && lead.customer && stableCurrentUser) {
      const customerName =
        `${lead.customer.first_name || ''} ${lead.customer.last_name || ''}`.trim() ||
        'Lead Details';

      // Format timestamps with HTML formatting
      const createdDate = formatHeaderDate(lead.created_at, true);
      const updatedDate = formatHeaderDate(lead.updated_at, true);
      const description = `Created: <span>${createdDate}</span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Last update: <span>${updatedDate}</span>`;

      setPageHeader({
        title: customerName,
        description: description,
        leadAssignmentControls: {
          leadType: ticketType,
          leadStatus: lead.lead_status,
          assignedTo: lead.assigned_to || '',
          assignedScheduler: lead.assigned_scheduler || '',
          assignedUser: lead.assigned_user,
          schedulerUser: lead.scheduler_user,
          assignableUsers: stableAssignableUsers,
          currentUser: stableCurrentUser,
          onLeadTypeChange: handleLeadTypeChange,
          onLeadTypeChangeWithModal: handleLeadTypeChangeWithModal,
          onAssigneeChange: handleAssigneeChange,
          onSchedulerChange: handleSchedulerChange,
          onStatusChange: handleStatusChange,
        },
      });
    }

    // Cleanup: clear the header when component unmounts
    return () => {
      setPageHeader(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    lead,
    lead?.assigned_to,
    lead?.assigned_scheduler,
    lead?.lead_status,
    lead?.assigned_user,
    lead?.scheduler_user,
    stableCurrentUser,
    ticketType,
    stableAssignableUsers,
    // setPageHeader is intentionally omitted - it's a stable context setter
    handleLeadTypeChange,
    handleLeadTypeChangeWithModal,
    handleAssigneeChange,
    handleSchedulerChange,
    handleStatusChange,
  ]);

  const handleToastClose = () => {
    setShowToast(false);
    setUndoHandler(null);
  };

  const handleRequestUndo = (handler: () => Promise<void>) => {
    setUndoHandler(() => handler);
  };

  const handleUndo = async () => {
    if (!undoHandler) return;

    setIsUndoing(true);
    try {
      await undoHandler();
    } finally {
      setIsUndoing(false);
      setUndoHandler(null);
    }
  };

  // Handle Add Task button click
  const handleAddTask = () => {
    setShowTaskModal(true);
  };

  // Handle task creation success
  const handleTaskCreated = () => {
    handleShowToast('Task created successfully!', 'success');
  };

  // Handle Live Call button click
  const handleLiveCall = () => {
    setShowLiveCallModal(true);
  };

  // Handle Live Call modal submission
  const handleLiveCallSubmit = async (option: 'quote' | 'schedule') => {
    if (!lead || !leadId) return;

    const newStatus = option === 'quote' ? 'quoted' : 'scheduling';
    const successMessage =
      option === 'quote'
        ? 'Lead jumped to Quote stage successfully!'
        : 'Lead jumped to Schedule stage successfully!';

    try {
      if (isAdmin) {
        await adminAPI.updateLead(leadId, {
          lead_status: newStatus,
        });
      } else {
        await adminAPI.updateUserLead(leadId, {
          lead_status: newStatus,
        });
      }

      // If moving to quoted status, ensure quote exists
      if (newStatus === 'quoted') {
        try {
          const response = await fetch(`/api/leads/${leadId}/quote`, {
            method: 'GET',
          });
          const data = await response.json();

          // Quote will be created when Quote step loads if it doesn't exist
        } catch (error) {
          console.error('Error checking quote:', error);
        }
      }

      await fetchLead();
      handleShowToast(successMessage, 'success');
    } catch (error) {
      console.error('Error in live call:', error);
      handleShowToast(
        'Failed to update lead status. Please try again.',
        'error'
      );
    }
  };

  // Handle Not Interested button
  const handleNotInterested = () => {
    setShowNotInterestedModal(true);
  };

  // Handle Not Interested modal submission
  const handleNotInterestedSubmit = async (reason: string) => {
    if (!lead || !leadId) return;

    try {
      if (isAdmin) {
        await adminAPI.updateLead(leadId, {
          lead_status: 'lost',
          lost_reason: reason,
          lost_stage: lead.lead_status,
        });
      } else {
        await adminAPI.updateUserLead(leadId, {
          lead_status: 'lost',
          lost_reason: reason,
          lost_stage: lead.lead_status,
        });
      }

      handleShowToast('Lead marked as not interested', 'success');
      router.push('/tickets/leads');
    } catch (error) {
      console.error('Error marking lead as not interested:', error);
      handleShowToast('Failed to mark lead as not interested', 'error');
    }
  };

  // Handle Email Quote button
  const handleEmailQuoteButton = () => {
    setShowEmailQuoteModal(true);
  };

  // Handle Email Quote modal submission
  const handleEmailQuoteSubmit = async (
    templateId: string,
    customerEmail: string
  ) => {
    if (!leadId) return;

    try {
      // First get the quote
      const quoteResponse = await fetch(`/api/leads/${leadId}/quote`);
      const quoteData = await quoteResponse.json();

      if (!quoteData.data) {
        handleShowToast('No quote available to email', 'error');
        setShowEmailQuoteModal(false);
        return;
      }

      const quote = quoteData.data;

      // Send the email with the selected template
      const emailResponse = await fetch(`/api/quotes/${quote.id}/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          customerEmail,
        }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json();
        throw new Error(errorData.error || 'Failed to send quote email');
      }

      // Update lead status to quoted
      if (isAdmin) {
        await adminAPI.updateLead(leadId, { lead_status: 'quoted' });
      } else {
        await adminAPI.updateUserLead(leadId, { lead_status: 'quoted' });
      }
      await fetchLead(); // Refresh lead data

      setShowEmailQuoteModal(false);
      handleShowToast('Quote emailed successfully!', 'success');
    } catch (error) {
      console.error('Error emailing quote:', error);
      handleShowToast(
        error instanceof Error ? error.message : 'Failed to email quote',
        'error'
      );
    }
  };

  // Check if current assigned user has scheduling permissions
  const currentAssignedUserHasSchedulingPermissions = () => {
    if (!lead?.assigned_to) {
      // Not assigned to specific user, assigned to team
      return false;
    }

    // Find the assigned user in assignableUsers
    const assignedUser = assignableUsers.find(u => u.id === lead.assigned_to);
    if (!assignedUser) {
      return false;
    }

    // Check if user has scheduling permissions
    return (
      assignedUser.departments?.includes('scheduling') ||
      assignedUser.roles?.includes('admin') ||
      assignedUser.roles?.includes('manager')
    );
  };

  // Handle Ready To Schedule button - direct assignment
  const handleReadyToScheduleDirectly = async () => {
    if (!lead || !leadId) return;

    try {
      const updateData: any = {
        lead_status: 'scheduling',
        assigned_scheduler: null, // Assign to scheduling team bucket
      };

      if (isAdmin) {
        await adminAPI.updateLead(leadId, updateData);
      } else {
        await adminAPI.updateUserLead(leadId, updateData);
      }

      await fetchLead();
      handleShowToast('Lead assigned to scheduling team!', 'success');
      router.push('/tickets/leads');
    } catch (error) {
      console.error('Error updating lead to ready to schedule:', error);
      handleShowToast('Failed to update lead status', 'error');
    }
  };

  // Handle Ready To Schedule button
  const handleReadyToSchedule = () => {
    // Check if current assigned user has scheduling permissions
    if (currentAssignedUserHasSchedulingPermissions()) {
      // Show modal to let them choose
      setShowReadyToScheduleModal(true);
    } else {
      // Directly assign to scheduling bucket
      handleReadyToScheduleDirectly();
    }
  };

  // Handle Ready To Schedule modal submission
  const handleReadyToScheduleSubmit = async (
    option: 'now' | 'later' | 'someone_else',
    assignedTo?: string
  ) => {
    if (!lead || !leadId) return;

    try {
      const updateData: any = {
        lead_status: 'scheduling',
      };

      if (option === 'now') {
        // Assign scheduler to current assigned user (who has scheduling permissions)
        updateData.assigned_scheduler = lead.assigned_to;
      } else if (option === 'someone_else' && assignedTo) {
        // Handle team assignment (null) vs individual assignment (UUID)
        updateData.assigned_scheduler =
          assignedTo === 'scheduling_team' ? null : assignedTo;
      }

      if (isAdmin) {
        await adminAPI.updateLead(leadId, updateData);
      } else {
        await adminAPI.updateUserLead(leadId, updateData);
      }

      await fetchLead();

      if (option === 'now') {
        handleShowToast(
          'Lead ready to schedule! Proceeding to scheduling...',
          'success'
        );
        // TODO: Navigate to scheduling page when implemented
      } else if (option === 'later') {
        handleShowToast('Lead marked as ready to schedule!', 'success');
        router.push('/tickets/leads');
      } else {
        handleShowToast('Lead assigned for scheduling!', 'success');
        router.push('/tickets/leads');
      }
    } catch (error) {
      console.error('Error updating lead to ready to schedule:', error);
      handleShowToast('Failed to update lead status', 'error');
    }
  };

  if (loading || leadLoading) {
    return <div className={styles.loading}>Loading lead...</div>;
  }

  if (!user || !profile) {
    return <div>Redirecting...</div>;
  }

  if (!lead) {
    return (
      <div className={styles.error}>
        <h2>Lead not found</h2>
        <button onClick={handleBack} className={styles.backButton}>
          <ArrowLeft size={16} />
          Back to Leads
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="container">
        <div className={styles.content}>
          <LeadStepContent
            lead={lead}
            isAdmin={isAdmin}
            onLeadUpdate={fetchLead}
            onShowToast={handleShowToast}
            onRequestUndo={handleRequestUndo}
            onEmailQuote={handleEmailQuoteButton}
            onFinalizeSale={trigger => {
              finalizeSaleModalTrigger.current = trigger;
            }}
            onNotInterested={handleNotInterested}
            onReadyToSchedule={handleReadyToSchedule}
          />
        </div>

        <Toast
          message={toastMessage}
          isVisible={showToast}
          onClose={handleToastClose}
          type={toastType}
          showUndo={!!undoHandler}
          onUndo={handleUndo}
          undoLoading={isUndoing}
        />

        <ReassignModal
          isOpen={showReassignModal}
          onClose={() => setShowReassignModal(false)}
          onAssign={handleReassignSubmit}
          customerName={
            lead.customer
              ? `${lead.customer.first_name} ${lead.customer.last_name}`
              : 'No Customer Assigned'
          }
          customerEmail={lead.customer?.email}
          customerPhone={lead.customer?.phone}
          companyId={lead.company_id}
          currentAssigneeId={lead.assigned_to}
          type="lead"
        />

        <LiveCallModal
          isOpen={showLiveCallModal}
          onClose={() => setShowLiveCallModal(false)}
          onSubmit={handleLiveCallSubmit}
        />

        <QuickTaskModal
          isOpen={showTaskModal}
          onClose={() => setShowTaskModal(false)}
          onTaskCreated={handleTaskCreated}
          companyId={lead.company_id}
          relatedEntityType="leads"
          relatedEntityId={lead.id}
        />

        <NotInterestedModal
          isOpen={showNotInterestedModal}
          onClose={() => setShowNotInterestedModal(false)}
          onSubmit={handleNotInterestedSubmit}
        />

        <ReadyToScheduleModal
          isOpen={showReadyToScheduleModal}
          onClose={() => setShowReadyToScheduleModal(false)}
          onSubmit={handleReadyToScheduleSubmit}
          companyId={lead.company_id}
        />

        <EmailQuoteModal
          isOpen={showEmailQuoteModal}
          onClose={() => setShowEmailQuoteModal(false)}
          onSubmit={handleEmailQuoteSubmit}
          companyId={lead.company_id}
          customerEmail={lead.customer?.email || ''}
          customerName={
            lead.customer
              ? `${lead.customer.first_name} ${lead.customer.last_name}`
              : 'Customer'
          }
          customerFirstName={lead.customer?.first_name}
          customerLastName={lead.customer?.last_name}
        />

        <ConvertToSupportModal
          isOpen={showConvertToSupportModal}
          onClose={() => setShowConvertToSupportModal(false)}
          onConfirm={handleConvertToSupport}
          customerName={
            lead.customer
              ? `${lead.customer.first_name} ${lead.customer.last_name}`
              : 'this customer'
          }
        />

        <MarkAsJunkModal
          isOpen={showMarkAsJunkModal}
          onClose={() => setShowMarkAsJunkModal(false)}
          onConfirm={handleMarkAsJunk}
          customerName={
            lead.customer
              ? `${lead.customer.first_name} ${lead.customer.last_name}`
              : 'this lead'
          }
        />
      </div>
    </>
  );
}

export default function LeadDetailPage({ params }: LeadPageProps) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LeadDetailPageContent params={params} />
    </Suspense>
  );
}
