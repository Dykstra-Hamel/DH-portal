import React, { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  ChevronDown,
  LifeBuoy,
  Users,
  Sparkle,
  ReceiptText,
  SquareUserRound,
  MapPinned,
  ChevronRight,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Ticket } from '@/types/ticket';
import { CallRecord } from '@/types/call-record';
import { authenticatedFetch } from '@/lib/api-client';
import { useUser } from '@/hooks/useUser';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import {
  Modal,
  ModalTop,
  ModalMiddle,
  ModalBottom,
  ModalActionButtons,
} from '@/components/Common/Modal';
import {
  CustomerInformation,
  CallInsights,
  CallDetails,
  ServiceLocation,
} from '@/components/Tickets/TicketContent';
import {
  createTicketReviewChannel,
  broadcastTicketReviewUpdate,
  subscribeToTicketReviewUpdates,
} from '@/lib/realtime/ticket-review-channel';
import styles from './TicketReviewModal.module.scss';
import sectionStyles from '@/components/Tickets/TicketContent/SharedSection.module.scss';

// Custom Sales Lead icon
const SalesLeadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="25"
    viewBox="0 0 24 25"
    fill="none"
  >
    <path
      d="M9.75588 12.5369L11.2559 14.0369L14.2559 11.0369M5.89338 10.0019C5.78391 9.50883 5.80072 8.99607 5.94225 8.51119C6.08378 8.02632 6.34544 7.58502 6.70298 7.22823C7.06052 6.87144 7.50236 6.6107 7.98754 6.47018C8.47271 6.32967 8.98551 6.31394 9.47838 6.42444C9.74966 6.00016 10.1234 5.65101 10.5651 5.40915C11.0068 5.1673 11.5023 5.04053 12.0059 5.04053C12.5095 5.04053 13.005 5.1673 13.4467 5.40915C13.8884 5.65101 14.2621 6.00016 14.5334 6.42444C15.027 6.31346 15.5407 6.32912 16.0266 6.46997C16.5126 6.61083 16.955 6.87229 17.3128 7.23005C17.6705 7.58781 17.932 8.03024 18.0728 8.51619C18.2137 9.00214 18.2294 9.51581 18.1184 10.0094C18.5427 10.2807 18.8918 10.6544 19.1337 11.0962C19.3755 11.5379 19.5023 12.0333 19.5023 12.5369C19.5023 13.0405 19.3755 13.536 19.1337 13.9777C18.8918 14.4194 18.5427 14.7932 18.1184 15.0644C18.2289 15.5573 18.2131 16.0701 18.0726 16.5553C17.9321 17.0405 17.6714 17.4823 17.3146 17.8398C16.9578 18.1974 16.5165 18.459 16.0316 18.6006C15.5467 18.7421 15.034 18.7589 14.5409 18.6494C14.27 19.0753 13.8959 19.426 13.4535 19.6689C13.011 19.9119 12.5144 20.0392 12.0096 20.0392C11.5049 20.0392 11.0083 19.9119 10.5658 19.6689C10.1233 19.426 9.74931 19.0753 9.47838 18.6494C8.98551 18.7599 8.47271 18.7442 7.98754 18.6037C7.50236 18.4632 7.06052 18.2024 6.70298 17.8456C6.34544 17.4889 6.08378 17.0476 5.94225 16.5627C5.80072 16.0778 5.78391 15.565 5.89338 15.0719C5.46585 14.8014 5.11369 14.4271 4.86967 13.9838C4.62564 13.5406 4.49768 13.0429 4.49768 12.5369C4.49768 12.031 4.62564 11.5332 4.86967 11.09C5.11369 10.6468 5.46585 10.2725 5.89338 10.0019Z"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Custom Customer Support icon
const CustomerSupportIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
  >
    <path
      d="M6.6975 6.69896L9.8775 9.87896M14.1225 9.87896L17.3025 6.69896M14.1225 14.124L17.3025 17.304M9.8775 14.124L6.6975 17.304M19.5 12.0015C19.5 16.1436 16.1421 19.5015 12 19.5015C7.85786 19.5015 4.5 16.1436 4.5 12.0015C4.5 7.85933 7.85786 4.50146 12 4.50146C16.1421 4.50146 19.5 7.85933 19.5 12.0015ZM15 12.0015C15 13.6583 13.6569 15.0015 12 15.0015C10.3431 15.0015 9 13.6583 9 12.0015C9 10.3446 10.3431 9.00146 12 9.00146C13.6569 9.00146 15 10.3446 15 12.0015Z"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export interface TicketReviewModalProps {
  ticket: Ticket;
  isOpen: boolean;
  onClose: () => void;
  onQualify: (
    qualification: 'sales' | 'customer_service' | 'junk',
    assignedTo?: string,
    customStatus?: string
  ) => Promise<{ leadId?: string; supportCaseId?: string } | void>;
  isQualifying?: boolean;
  onSuccess?: (message: string) => void;
}

export default function TicketReviewModal({
  ticket,
  isOpen,
  onClose,
  onQualify,
  isQualifying = false,
  onSuccess,
}: TicketReviewModalProps) {
  // Set initial qualification based on current ticket service_type
  const getInitialQualification = ():
    | 'sales'
    | 'customer_service'
    | 'spam'
    | 'other' => {
    if (
      ticket.service_type === 'Support' ||
      ticket.service_type === 'Customer Service'
    ) {
      return 'customer_service';
    }
    if (ticket.service_type === 'Spam') {
      return 'spam';
    }
    if (ticket.service_type === 'Other') {
      return 'other';
    }
    return 'sales';
  };

  const [selectedQualification, setSelectedQualification] = useState<
    'sales' | 'customer_service' | 'spam' | 'other'
  >(getInitialQualification());
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [callRecord, setCallRecord] = useState<CallRecord | undefined>();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'customer' | 'details' | 'insights' | 'location'
  >('details');
  const tabContentRef = useRef<HTMLDivElement>(null);

  // Get assignable users based on selected qualification type
  const {
    users: assignableUsers,
    loading: loadingUsers,
    error: usersError,
  } = useAssignableUsers({
    companyId: ticket.company_id,
    departmentType: selectedQualification === 'sales' ? 'sales' : 'support',
    enabled: isOpen,
  });
  const [loadingCallRecord, setLoadingCallRecord] = useState(false);
  const [isAssignmentDropdownOpen, setIsAssignmentDropdownOpen] =
    useState(false);
  const [step, setStep] = useState<'review' | 'assignment'>('review');
  const [isAnimating, setIsAnimating] = useState(false);
  const assignmentDropdownRef = useRef<HTMLDivElement>(null);
  const reasonDropdownRef = useRef<HTMLDivElement>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reviewChannelRef = useRef<any>(null);

  // Get current authenticated user
  const { getDisplayName, getAvatarUrl, getInitials, user, profile } =
    useUser();
  const router = useRouter();

  // Initialize selectedAssignee with current user ID when user is available
  useEffect(() => {
    if (user?.id && !selectedAssignee) {
      setSelectedAssignee(user.id);
    }
  }, [user?.id, selectedAssignee]);

  // Update tab content height for smooth transitions
  useEffect(() => {
    const content = tabContentRef.current;
    if (!content) return;

    const updateHeight = () => {
      // Get current height
      const currentHeight = content.offsetHeight;

      // Temporarily disable transition to measure natural height
      content.style.transition = 'none';
      content.style.height = 'auto';

      // Get the natural content height
      const newHeight = content.scrollHeight;

      // Set back to current height (starting point for transition)
      content.style.height = `${currentHeight}px`;

      // Use requestAnimationFrame to ensure the browser has painted
      requestAnimationFrame(() => {
        // Re-enable transition
        content.style.transition = '';

        // Trigger transition to new height
        content.style.height = `${newHeight}px`;
      });
    };

    // Update height after a brief delay to ensure content is rendered
    const timeoutId = setTimeout(updateHeight, 100);

    // Use MutationObserver to detect when content is fully loaded (e.g., when loading states change)
    const observer = new MutationObserver(() => {
      // Debounce the height updates
      clearTimeout(timeoutId);
      setTimeout(updateHeight, 100);
    });

    observer.observe(content, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [activeTab]);

  const currentUser = {
    name: getDisplayName(),
    avatar: getAvatarUrl(),
    initials: getInitials(),
  };

  const animateToStep = (newStep: 'review' | 'assignment') => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep(newStep);
      setIsAnimating(false);
    }, 150); // Half of the 300ms transition
  };

  const fetchCallRecord = useCallback(async () => {
    // Only fetch call records for phone calls
    if (ticket.type !== 'phone_call') {
      return;
    }

    try {
      setLoadingCallRecord(true);
      const data = await authenticatedFetch(`/api/tickets/${ticket.id}/calls`);
      if (data.callRecord) {
        setCallRecord(data.callRecord);
      }
    } catch (error) {
      console.error('Error fetching call record:', error);
    } finally {
      setLoadingCallRecord(false);
    }
  }, [ticket.id, ticket.type]);

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen && ticket.company_id) {
      fetchCallRecord();
    }
  }, [isOpen, ticket.company_id, fetchCallRecord]);

  // Reset selected assignee when qualification changes (since available users change)
  useEffect(() => {
    setSelectedAssignee('');
  }, [selectedQualification]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        assignmentDropdownRef.current &&
        !assignmentDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAssignmentDropdownOpen(false);
      }
      if (
        reasonDropdownRef.current &&
        !reasonDropdownRef.current.contains(event.target as Node)
      ) {
        setIsReasonDropdownOpen(false);
      }
    };

    if (isAssignmentDropdownOpen || isReasonDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isAssignmentDropdownOpen, isReasonDropdownOpen]);

  // Manage ticket review status
  useEffect(() => {
    if (!isOpen || !ticket.id || !user?.id) return;

    const displayName = getDisplayName();

    // Start review when modal opens
    const startReview = async () => {
      try {
        await authenticatedFetch(`/api/tickets/${ticket.id}/review-status`, {
          method: 'PUT',
          body: JSON.stringify({ action: 'start' }),
        });

        // Set up heartbeat to keep review status alive (every 60 seconds)
        heartbeatIntervalRef.current = setInterval(async () => {
          try {
            await authenticatedFetch(
              `/api/tickets/${ticket.id}/review-status`,
              {
                method: 'PUT',
                body: JSON.stringify({ action: 'heartbeat' }),
              }
            );
          } catch (error) {
            console.error('Error sending review heartbeat:', error);
          }
        }, 60000); // 60 seconds

        // Set up realtime channel
        const channel = createTicketReviewChannel();
        reviewChannelRef.current = channel;

        // Subscribe to updates from other users
        subscribeToTicketReviewUpdates(channel, payload => {
          // Channel will be used by TicketsList to update UI
        });

        // Broadcast the review start
        await broadcastTicketReviewUpdate(channel, {
          ticket_id: ticket.id,
          reviewed_by: user.id,
          reviewed_by_name: displayName,
          reviewed_by_email: user.email || profile?.email || '',
          reviewed_by_first_name: profile?.first_name,
          reviewed_by_last_name: profile?.last_name,
          reviewed_at: new Date().toISOString(),
          review_expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        console.error('Error starting ticket review:', error);
      }
    };

    startReview();

    // Function to end review (used by cleanup and beforeunload)
    const endReviewStatus = () => {
      // Clear heartbeat interval
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }

      // End review status using authenticatedFetch with keepalive
      // This works better than sendBeacon because it includes auth headers
      authenticatedFetch(`/api/tickets/${ticket.id}/review-status`, {
        method: 'PUT',
        body: JSON.stringify({ action: 'end' }),
        keepalive: true, // Keeps request alive even if page unloads
      }).catch(err => {
        // Errors are expected on page unload, ignore them
      });

      // Broadcast the review end
      if (reviewChannelRef.current) {
        broadcastTicketReviewUpdate(reviewChannelRef.current, {
          ticket_id: ticket.id,
          reviewed_by: undefined,
          timestamp: new Date().toISOString(),
        });
      }
    };

    // Add multiple event handlers for better cleanup coverage
    const handleBeforeUnload = () => {
      endReviewStatus();
    };

    const handleVisibilityChange = () => {
      // Clear review when tab becomes hidden (user might be closing/navigating)
      if (document.visibilityState === 'hidden') {
        endReviewStatus();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Clean up on unmount or modal close
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      endReviewStatus();
    };
  }, [isOpen, ticket.id, user?.id]);

  const handleClose = () => {
    setStep('review');
    setSelectedQualification(getInitialQualification());
    setSelectedAssignee(user?.id || '');
    setSelectedReason('');
    setIsAnimating(false);
    setIsAssignmentDropdownOpen(false);
    setIsReasonDropdownOpen(false);
    onClose();
  };

  const handleApprove = () => {
    animateToStep('assignment');
  };

  const handleArchive = async () => {
    try {
      // For spam/other tickets, we archive them directly with the junk qualification
      await onQualify('junk');
      handleClose();
    } catch (error) {
      console.error('Error archiving ticket:', error);
    }
  };

  const handleFinalApprove = async () => {
    try {
      // For team assignments, pass undefined to leave unassigned but still qualify the ticket
      const assigneeId = isTeamAssignment(selectedAssignee)
        ? undefined
        : selectedAssignee || undefined;

      // Map the new qualification types to the expected types
      let qualificationType: 'sales' | 'customer_service' | 'junk';
      if (selectedQualification === 'sales') {
        qualificationType = 'sales';
      } else if (selectedQualification === 'customer_service') {
        qualificationType = 'customer_service';
      } else {
        // For spam and other, we archive them as junk
        qualificationType = 'junk';
      }

      await onQualify(qualificationType, assigneeId);
      handleClose();
      // Show toast after modal closes via parent callback
      if (onSuccess) {
        setTimeout(() => {
          const message = isTeamAssignment(selectedAssignee)
            ? `The ticket was successfully assigned to ${getTeamDisplayName(selectedAssignee)}.`
            : 'The ticket was successfully assigned.';
          onSuccess(message);
        }, 300); // Wait for modal close animation to complete
      }
    } catch (error) {
      console.error('Error approving ticket:', error);
    }
  };

  const handleLiveCall = async () => {
    try {
      // selectedAssignee will always be the logged in user for live calls
      const assigneeId = user?.id;

      // Determine custom status based on qualification type
      const customStatus =
        selectedQualification === 'sales' ? 'quoted' : 'in_progress';

      // Map the qualification types to the expected types
      let qualificationType: 'sales' | 'customer_service';
      if (selectedQualification === 'sales') {
        qualificationType = 'sales';
      } else {
        qualificationType = 'customer_service';
      }

      const result = await onQualify(
        qualificationType,
        assigneeId,
        customStatus
      );
      handleClose();

      // Navigate to the new record page based on the response
      if (result && typeof result === 'object') {
        if (result.leadId) {
          router.push(`/connections/leads/${result.leadId}`);
        } else if (result.supportCaseId) {
          router.push(`/connections/customer-service/${result.supportCaseId}`);
        }
      }
    } catch (error) {
      console.error('Error handling live call:', error);
    }
  };

  const handleBack = () => {
    if (step === 'assignment') {
      animateToStep('review');
    } else {
      handleClose();
    }
  };

  const getQualificationLabel = () => {
    switch (selectedQualification) {
      case 'sales':
        return 'Sales Lead';
      case 'customer_service':
        return 'Support Case';
      case 'spam':
        return 'Spam';
      case 'other':
        return 'Other';
      default:
        return 'Sales Lead';
    }
  };

  const dropdownOptions = [
    {
      value: 'sales',
      label: 'Sales Lead',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="17"
          viewBox="0 0 18 19"
          fill="none"
        >
          <path
            d="M9 4.04004V15.04M6.25 12.4569L7.05575 13.061C8.12917 13.8667 9.86992 13.8667 10.9442 13.061C12.0186 12.2552 12.0186 10.9499 10.9442 10.1441C10.408 9.74079 9.704 9.54004 9 9.54004C8.33542 9.54004 7.67083 9.33837 7.16392 8.93596C6.15008 8.13021 6.15008 6.82487 7.16392 6.01912C8.17775 5.21337 9.82225 5.21337 10.8361 6.01912L11.2165 6.32162M17.25 9.54004C17.25 10.6234 17.0366 11.6962 16.622 12.6972C16.2074 13.6981 15.5997 14.6076 14.8336 15.3737C14.0675 16.1398 13.1581 16.7474 12.1571 17.162C11.1562 17.5766 10.0834 17.79 9 17.79C7.91659 17.79 6.8438 17.5766 5.84286 17.162C4.84193 16.7474 3.93245 16.1398 3.16637 15.3737C2.40029 14.6076 1.7926 13.6981 1.37799 12.6972C0.963392 11.6962 0.75 10.6234 0.75 9.54004C0.75 7.352 1.61919 5.25358 3.16637 3.70641C4.71354 2.15923 6.81196 1.29004 9 1.29004C11.188 1.29004 13.2865 2.15923 14.8336 3.70641C16.3808 5.25358 17.25 7.352 17.25 9.54004Z"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      value: 'customer_service',
      label: 'Support Case',
      icon: <LifeBuoy size={16} />,
    },
    {
      value: 'spam',
      label: 'Spam',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 9V13M12 17.02L12.01 16.99M22 12C22 17.523 17.523 22 12 22C6.477 22 2 17.523 2 12C2 6.477 6.477 2 12 2C17.523 2 22 6.477 22 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      value: 'other',
      label: 'Other',
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 12H12.01M8 12H8.01M16 12H16.01M21 12C21 16.418 16.97 20 12 20C11.176 20 10.389 19.874 9.658 19.641L6 21L7.359 17.342C7.126 16.611 7 15.824 7 15C7 10.582 10.03 7 12 7C16.97 7 21 10.582 21 12Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  const reasonOptions = [
    'Junk/Spam',
    'Duplicate Record',
    'Internal Call',
    'Personnel Call',
    'Training / QA Reference',
    'Non-Business Related',
  ];

  const handleOptionSelect = async (value: string) => {
    const newQualification = value as
      | 'sales'
      | 'customer_service'
      | 'spam'
      | 'other';
    setSelectedQualification(newQualification);

    // Reset reason when switching qualification types
    setSelectedReason('');

    // Update the ticket type based on the new qualification
    try {
      let newServiceType: string;
      switch (newQualification) {
        case 'sales':
          newServiceType = 'Sales';
          break;
        case 'customer_service':
          newServiceType = 'Support';
          break;
        case 'spam':
          newServiceType = 'Spam';
          animateToStep('review');
          break;
        case 'other':
          newServiceType = 'Other';
          animateToStep('review');
          break;
        default:
          newServiceType = 'Sales';
      }

      await authenticatedFetch(`/api/tickets/${ticket.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_type: newServiceType,
        }),
      });

      if (onSuccess) {
        onSuccess(`Ticket type updated to ${newServiceType}.`);
      }
    } catch (error) {
      console.error('Error updating ticket type:', error);
      if (onSuccess) {
        onSuccess('Failed to update ticket type. Please try again.');
      }
    }
  };

  const handleAssignmentDropdownToggle = () => {
    if (!isQualifying) {
      setIsAssignmentDropdownOpen(!isAssignmentDropdownOpen);
    }
  };

  const handleAssigneeSelect = (userId: string) => {
    setSelectedAssignee(userId);
    setIsAssignmentDropdownOpen(false);
  };

  const handleReasonDropdownToggle = () => {
    if (!isQualifying) {
      setIsReasonDropdownOpen(!isReasonDropdownOpen);
    }
  };

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason);
    setIsReasonDropdownOpen(false);
  };

  // Helper functions for team assignment
  const getSalesTeamCount = () => {
    return assignableUsers.filter(user => user.departments.includes('sales'))
      .length;
  };

  const getSupportTeamCount = () => {
    return assignableUsers.filter(user => user.departments.includes('support'))
      .length;
  };

  const isTeamAssignment = (assigneeId: string) => {
    return assigneeId === 'sales_team' || assigneeId === 'support_team';
  };

  const getTeamDisplayName = (assigneeId: string) => {
    switch (assigneeId) {
      case 'sales_team':
        return 'Sales Team';
      case 'support_team':
        return 'Support Team';
      default:
        return '';
    }
  };

  const getTeamMemberCount = (assigneeId: string) => {
    switch (assigneeId) {
      case 'sales_team':
        return getSalesTeamCount();
      case 'support_team':
        return getSupportTeamCount();
      default:
        return 0;
    }
  };

  const getSelectedAssigneeData = () => {
    // Handle team assignments
    if (isTeamAssignment(selectedAssignee)) {
      return {
        id: selectedAssignee,
        name: getTeamDisplayName(selectedAssignee),
        avatar: null,
        initials: '',
        display_name: getTeamDisplayName(selectedAssignee),
        isSelf: false,
        isTeam: true,
        memberCount: getTeamMemberCount(selectedAssignee),
      };
    }

    if (selectedAssignee === user?.id) {
      return {
        id: user.id,
        name: currentUser.name,
        avatar: currentUser.avatar,
        initials: currentUser.initials,
        display_name: currentUser.name,
        isSelf: true,
        isTeam: false,
      };
    }

    const assignedUser = assignableUsers.find(u => u.id === selectedAssignee);
    if (assignedUser) {
      return {
        ...assignedUser,
        name: assignedUser.display_name,
        avatar: assignedUser.avatar_url,
        initials: assignedUser.display_name
          .split(' ')
          .map(n => n[0])
          .join('')
          .toUpperCase(),
        isSelf: false,
        isTeam: false,
      };
    }

    return {
      id: user?.id || '',
      name: currentUser.name,
      avatar: currentUser.avatar,
      initials: currentUser.initials,
      display_name: currentUser.name,
      isSelf: true,
      isTeam: false,
    };
  };

  // Team avatar component
  const TeamAvatar = () => (
    <div
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: '#005194',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Users size={18} color="white" />
    </div>
  );

  const renderRadioButtons = () => (
    <div>
      <div className={styles.radioGroup}>
        {dropdownOptions.map(option => (
          <label
            key={option.value}
            className={`${styles.radioOption} ${isQualifying ? styles.disabled : ''}`}
          >
            <input
              type="radio"
              name="ticketType"
              value={option.value}
              checked={selectedQualification === option.value}
              onChange={() => handleOptionSelect(option.value)}
              disabled={isQualifying}
              className={styles.radioInput}
            />
            <span className={styles.radioCustom}></span>
            <span className={styles.radioLabel}>{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const renderReasonDropdown = () => (
    <div ref={reasonDropdownRef} className={styles.customDropdown}>
      <button
        className={`${styles.dropdownButton} ${isReasonDropdownOpen ? styles.open : ''} ${isQualifying ? styles.disabled : ''}`}
        onClick={handleReasonDropdownToggle}
        disabled={isQualifying}
      >
        <div className={styles.selectedOption}>
          <span className={styles.optionText}>
            {selectedReason || 'Select a reason...'}
          </span>
        </div>
        <ChevronDown size={16} className={styles.chevronIcon} />
      </button>

      {isReasonDropdownOpen && (
        <div className={styles.dropdownMenu}>
          {reasonOptions.map(reason => (
            <button
              key={reason}
              className={`${styles.dropdownOption} ${selectedReason === reason ? styles.selected : ''}`}
              onClick={() => handleReasonSelect(reason)}
            >
              <span className={styles.optionText}>{reason}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderAssignmentDropdown = () => {
    const selectedAssigneeData = getSelectedAssigneeData();

    return (
      <div ref={assignmentDropdownRef} className={styles.customDropdown}>
        <button
          className={`${styles.dropdownButton} ${isAssignmentDropdownOpen ? styles.open : ''} ${isQualifying ? styles.disabled : ''}`}
          onClick={handleAssignmentDropdownToggle}
          disabled={isQualifying}
        >
          <div className={styles.selectedOption}>
            <div className={styles.avatarContainer}>
              {selectedAssigneeData.isTeam ? (
                <TeamAvatar />
              ) : selectedAssigneeData.avatar ? (
                <Image
                  src={selectedAssigneeData.avatar}
                  alt={selectedAssigneeData.name}
                  width={32}
                  height={32}
                  className={styles.avatar}
                />
              ) : (
                <div className={styles.avatarInitials}>
                  {selectedAssigneeData.initials}
                </div>
              )}
            </div>
            <div className={styles.userInfo}>
              <span
                className={styles.userName}
                style={
                  selectedAssigneeData.isTeam
                    ? { fontSize: '14px', fontWeight: 700, color: '#171717' }
                    : {}
                }
              >
                {selectedAssigneeData.name}
              </span>
              {selectedAssigneeData.isSelf && (
                <span className={styles.myselfLabel}>Myself</span>
              )}
              {selectedAssigneeData.isTeam && (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: '#6A7282',
                  }}
                >
                  {selectedAssigneeData.memberCount} members
                </span>
              )}
            </div>
          </div>
          <ChevronDown size={16} className={styles.chevronIcon} />
        </button>

        {isAssignmentDropdownOpen && (
          <div className={styles.dropdownMenu}>
            {/* Current user first */}
            <button
              className={`${styles.dropdownOption} ${selectedAssignee === user?.id ? styles.selected : ''}`}
              onClick={() => handleAssigneeSelect(user?.id || '')}
            >
              <div className={styles.avatarContainer}>
                {currentUser.avatar ? (
                  <Image
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    width={32}
                    height={32}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarInitials}>
                    {currentUser.initials}
                  </div>
                )}
              </div>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{currentUser.name}</span>
                <span className={styles.myselfLabel}>Myself</span>
              </div>
            </button>

            {/* Team assignments - moved to second position */}
            {selectedQualification === 'sales' && (
              <button
                className={`${styles.dropdownOption} ${selectedAssignee === 'sales_team' ? styles.selected : ''}`}
                onClick={() => handleAssigneeSelect('sales_team')}
              >
                <div className={styles.avatarContainer}>
                  <TeamAvatar />
                </div>
                <div className={styles.userInfo}>
                  <span
                    className={styles.userName}
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#171717',
                    }}
                  >
                    Sales Team
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#6A7282',
                    }}
                  >
                    {getSalesTeamCount()} members
                  </span>
                </div>
              </button>
            )}

            {selectedQualification === 'customer_service' && (
              <button
                className={`${styles.dropdownOption} ${selectedAssignee === 'support_team' ? styles.selected : ''}`}
                onClick={() => handleAssigneeSelect('support_team')}
              >
                <div className={styles.avatarContainer}>
                  <TeamAvatar />
                </div>
                <div className={styles.userInfo}>
                  <span
                    className={styles.userName}
                    style={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#171717',
                    }}
                  >
                    Support Team
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: '#6A7282',
                    }}
                  >
                    {getSupportTeamCount()} members
                  </span>
                </div>
              </button>
            )}

            {/* Other eligible users */}
            {assignableUsers
              .filter(companyUser => companyUser.id !== user?.id)
              .map(companyUser => (
                <button
                  key={companyUser.id}
                  className={`${styles.dropdownOption} ${selectedAssignee === companyUser.id ? styles.selected : ''}`}
                  onClick={() => handleAssigneeSelect(companyUser.id)}
                >
                  <div className={styles.avatarContainer}>
                    {companyUser.avatar_url ? (
                      <Image
                        src={companyUser.avatar_url}
                        alt={companyUser.display_name}
                        width={32}
                        height={32}
                        className={styles.avatar}
                      />
                    ) : (
                      <div className={styles.avatarInitials}>
                        {companyUser.display_name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className={styles.userInfo}>
                    <span
                      className={styles.userName}
                      style={{
                        fontSize: '14px',
                        fontWeight: 700,
                        color: '#171717',
                      }}
                    >
                      {companyUser.display_name}
                    </span>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className={`${styles.ticketModal}`}
    >
      <ModalTop title="Review Ticket" onClose={handleClose} />

      <ModalMiddle className={styles.modalContent}>
        <div className={styles.ticketSummarySection}>
          <div className={styles.ticketSummary}>
            <h2 className={styles.ticketSummaryName}>
              {ticket.customer
                ? `${ticket.customer.first_name} ${ticket.customer.last_name}`
                : 'Unknown Customer'}
            </h2>
            <p>{ticket.customer?.phone || 'Phone not provided'}</p>
            {/* Show service address if available, otherwise fall back to customer address */}
            {ticket.service_address ? (
              <>
                <p>{ticket.service_address.street_address}</p>
                <p>
                  {ticket.service_address.city && (
                    <>{ticket.service_address.city}, </>
                  )}{' '}
                  {ticket.service_address.state}{' '}
                  {ticket.service_address.zip_code}
                </p>
              </>
            ) : (
              <>
                <p>{ticket.customer?.address || 'Address not provided'}</p>
                <p>
                  {ticket.customer?.city && <>{ticket.customer?.city}, </>}{' '}
                  {ticket.customer?.state} {ticket.customer?.zip_code}
                </p>
              </>
            )}
          </div>
          <div className={styles.reviewerSection}>
            <span className={styles.reviewingText}>Reviewing</span>
            <div className={styles.reviewerInfo}>
              <div className={styles.avatarContainer}>
                {currentUser.avatar ? (
                  <Image
                    src={currentUser.avatar}
                    alt={currentUser.name}
                    width={32}
                    height={32}
                    className={styles.avatar}
                  />
                ) : (
                  <div className={styles.avatarInitials}>
                    {currentUser.initials ||
                      currentUser.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {callRecord && (
          <div className={styles.callSummary}>
            <p>Call summary: {callRecord.call_analysis?.call_summary}</p>
          </div>
        )}
        <div className={styles.actionsWrapper}>
          {renderRadioButtons()}
          <div className={styles.dividerLine}></div>
          {(selectedQualification === 'sales' ||
            selectedQualification === 'customer_service') && (
            <div>
              <p>Select an action:</p>
              <ModalActionButtons
                onBack={handleClose}
                showBackButton={false}
                isFirstStep={true}
                onPrimaryAction={handleLiveCall}
                onSecondaryAction={handleApprove}
                secondaryButtonText={`Assign ${getQualificationLabel()}`}
                primaryButtonDisabled={false}
                primaryButtonText={'Take It'}
                showSecondaryButton={true}
                primaryButtonPosition="left"
                isLoading={isQualifying}
                loadingText="Processing..."
                addTaskDisabled={true}
                junkDisabled={isQualifying}
              />
            </div>
          )}
          {(selectedQualification === 'spam' ||
            selectedQualification === 'other') && (
            <div className={styles.reasonSection}>
              <label className={styles.reasonLabel}>Reason:</label>
              {renderReasonDropdown()}
            </div>
          )}
          {step === 'assignment' && (
            <>
              <div className={styles.dividerLine}></div>
              <p>Assign to:</p>
              {renderAssignmentDropdown()}
            </>
          )}
        </div>
      </ModalMiddle>

      <ModalBottom>
        {step === 'review' && (
          <>
            {(selectedQualification === 'sales' ||
              selectedQualification === 'customer_service') && (
              <div className={styles.tabbedInterface}>
                <div className={styles.tabNavigation}>
                  <button
                    className={`${styles.tabButton} ${activeTab === 'details' ? styles.active : ''}`}
                    onClick={() => setActiveTab('details')}
                  >
                    <ReceiptText size={20} />
                    Call Details
                    <ChevronRight size={20} />
                  </button>
                  <button
                    className={`${styles.tabButton} ${activeTab === 'insights' ? styles.active : ''}`}
                    onClick={() => setActiveTab('insights')}
                  >
                    <svg
                      width="20"
                      height="21"
                      viewBox="0 0 20 21"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.0555 3.04004V6.37341M16.3889 6.92897V9.15122M11.3888 4.70673H14.7222M15.2778 8.0401H17.5M6.68529 13.8548L2.85955 12.445C2.75406 12.4061 2.66304 12.3357 2.59875 12.2435C2.53447 12.1512 2.5 12.0415 2.5 11.929C2.5 11.8166 2.53447 11.7068 2.59875 11.6146C2.66304 11.5223 2.75406 11.452 2.85955 11.4131L6.68529 10.0033L8.09503 6.17758C8.13397 6.07209 8.2043 5.98107 8.29656 5.91678C8.38882 5.85249 8.49856 5.81803 8.61101 5.81803C8.72345 5.81803 8.8332 5.85249 8.92546 5.91678C9.01771 5.98107 9.08805 6.07209 9.12699 6.17758L10.5367 10.0033L14.3625 11.4131C14.468 11.452 14.559 11.5223 14.6233 11.6146C14.6875 11.7068 14.722 11.8166 14.722 11.929C14.722 12.0415 14.6875 12.1512 14.6233 12.2435C14.559 12.3357 14.468 12.4061 14.3625 12.445L10.5367 13.8548L9.12699 17.6805C9.08805 17.786 9.01771 17.877 8.92546 17.9413C8.8332 18.0056 8.72345 18.04 8.61101 18.04C8.49856 18.04 8.38882 18.0056 8.29656 17.9413C8.2043 17.877 8.13397 17.786 8.09503 17.6805L6.68529 13.8548Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Call Insights
                    <ChevronRight size={20} />
                  </button>

                  <button
                    className={`${styles.tabButton} ${activeTab === 'customer' ? styles.active : ''}`}
                    onClick={() => setActiveTab('customer')}
                  >
                    <SquareUserRound size={20} />
                    Customer Information
                    <ChevronRight size={20} />
                  </button>
                  <button
                    className={`${styles.tabButton} ${activeTab === 'location' ? styles.active : ''}`}
                    onClick={() => setActiveTab('location')}
                  >
                    <MapPinned size={20} />
                    Service Location
                    <ChevronRight size={20} />
                  </button>
                </div>
                <div className={styles.tabContent} ref={tabContentRef}>
                  {activeTab === 'customer' && (
                    <CustomerInformation
                      ticket={ticket}
                      onUpdate={_customerData => {
                        if (onSuccess) {
                          onSuccess(
                            'Customer information updated successfully.'
                          );
                        }
                      }}
                    />
                  )}
                  {activeTab === 'details' && (
                    <>
                      <CallDetails ticket={ticket} callRecord={callRecord} />
                      {loadingCallRecord && (
                        <div className={styles.loadingMessage}>
                          Loading call details...
                        </div>
                      )}
                    </>
                  )}
                  {activeTab === 'insights' && (
                    <CallInsights ticket={ticket} callRecord={callRecord} />
                  )}
                  {activeTab === 'location' && (
                    <ServiceLocation
                      ticket={ticket}
                      onUpdate={serviceAddressData => {
                        if (onSuccess) {
                          if (serviceAddressData?.serviceAddress) {
                            onSuccess(
                              'Service address created and linked to ticket successfully.'
                            );
                          } else {
                            onSuccess('Service location updated successfully.');
                          }
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            )}
            {(selectedQualification === 'spam' ||
              selectedQualification === 'other') && (
              <ModalActionButtons
                onBack={handleClose}
                showBackButton={true}
                isFirstStep={true}
                onPrimaryAction={handleArchive}
                primaryButtonDisabled={false}
                primaryButtonText={'Archive Ticket'}
                showSecondaryButton={false}
                isLoading={isQualifying}
                loadingText="Processing..."
                addTaskDisabled={true}
                junkDisabled={isQualifying}
              />
            )}
          </>
        )}
        {step === 'assignment' && (
          <ModalActionButtons
            onBack={handleBack}
            showBackButton={true}
            isFirstStep={false}
            onPrimaryAction={handleFinalApprove}
            primaryButtonText={`Continue ${getQualificationLabel()}`}
            primaryButtonDisabled={false}
            isLoading={isQualifying}
            loadingText="Processing..."
          />
        )}
      </ModalBottom>
    </Modal>
  );
}
