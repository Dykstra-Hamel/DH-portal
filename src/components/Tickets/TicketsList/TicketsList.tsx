'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Ticket } from '@/types/ticket';
import LiveCallBar from '@/components/Common/LiveCallBar/LiveCallBar';
import { DataTable } from '@/components/Common/DataTable';
import { TicketReviewModal } from '@/components/Tickets/TicketReviewModal';
import { getTicketColumns, getTicketTabs } from './TicketsListConfig';
import { Toast } from '@/components/Common/Toast';
import {
  createTicketReviewChannel,
  subscribeToTicketReviewUpdates,
  TicketReviewPayload,
} from '@/lib/realtime/ticket-review-channel';
import { RealtimeChannel } from '@supabase/supabase-js';

interface TicketsListProps {
  tickets: Ticket[];
  liveTickets: Ticket[]; // Live tickets for LiveCallBar
  callRecords?: any[]; // For hang-up calls filtering
  loading?: boolean;
  onTicketUpdated?: () => void;
  // Infinite scroll props
  infiniteScrollEnabled?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  // Tab counts
  tabCounts?: { all: number; incoming: number; outbound: number; forms: number };
  // Callbacks for data fetching
  onTabChange?: (tab: string) => void;
  onSortChange?: (field: string, order: 'asc' | 'desc') => void;
  onSearchChange?: (query: string) => void;
}

function TicketsList({
  tickets,
  liveTickets,
  callRecords = [],
  loading = false,
  onTicketUpdated,
  infiniteScrollEnabled = false,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  tabCounts,
  onTabChange,
  onSortChange,
  onSearchChange,
}: TicketsListProps) {
  // Qualify modal state
  const [showQualifyModal, setShowQualifyModal] = useState(false);
  const [qualifyingTicket, setQualifyingTicket] = useState<Ticket | null>(null);
  const [isQualifying, setIsQualifying] = useState(false);

  // Review status tracking
  const [reviewStatuses, setReviewStatuses] = useState<
    Map<
      string,
      {
        reviewedBy: string;
        reviewedByName?: string;
        reviewedByEmail?: string;
        reviewedByFirstName?: string;
        reviewedByLastName?: string;
        expiresAt: string;
      }
    >
  >(new Map());
  const reviewChannelRef = useRef<RealtimeChannel | null>(null);

  // Toast state for undo functionality
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showUndoOnToast, setShowUndoOnToast] = useState(false);
  const [previousTicketState, setPreviousTicketState] = useState<any>(null);
  const [isUndoing, setIsUndoing] = useState(false);

  // Load initial review statuses from tickets and subscribe to updates
  useEffect(() => {
    // Load initial review statuses from current tickets
    const initialStatuses = new Map<
      string,
      {
        reviewedBy: string;
        reviewedByName?: string;
        reviewedByEmail?: string;
        reviewedByFirstName?: string;
        reviewedByLastName?: string;
        expiresAt: string;
      }
    >();

    tickets.forEach(ticket => {
      if (
        ticket.reviewed_by &&
        ticket.review_expires_at &&
        new Date(ticket.review_expires_at) > new Date()
      ) {
        initialStatuses.set(ticket.id, {
          reviewedBy: ticket.reviewed_by,
          reviewedByName: ticket.reviewed_by_profile
            ? `${ticket.reviewed_by_profile.first_name || ''} ${ticket.reviewed_by_profile.last_name || ''}`.trim()
            : undefined,
          reviewedByEmail: ticket.reviewed_by_profile?.email,
          reviewedByFirstName: ticket.reviewed_by_profile?.first_name,
          reviewedByLastName: ticket.reviewed_by_profile?.last_name,
          expiresAt: ticket.review_expires_at,
        });
      }
    });

    setReviewStatuses(initialStatuses);

    // Set up realtime channel
    const channel = createTicketReviewChannel();
    reviewChannelRef.current = channel;

    subscribeToTicketReviewUpdates(channel, (payload: TicketReviewPayload) => {
      setReviewStatuses(prev => {
        const updated = new Map(prev);

        if (payload.reviewed_by && payload.review_expires_at) {
          // Someone started reviewing
          updated.set(payload.ticket_id, {
            reviewedBy: payload.reviewed_by,
            reviewedByName: payload.reviewed_by_name,
            reviewedByEmail: payload.reviewed_by_email,
            reviewedByFirstName: payload.reviewed_by_first_name,
            reviewedByLastName: payload.reviewed_by_last_name,
            expiresAt: payload.review_expires_at,
          });
        } else {
          // Review ended
          updated.delete(payload.ticket_id);
        }

        return updated;
      });
    });

    return () => {
      // Channel cleanup is handled globally
    };
  }, [tickets]);

  // Auto-cleanup expired review statuses
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setReviewStatuses(prev => {
        const updated = new Map(prev);
        const now = Date.now();
        let hasChanges = false;

        // Remove expired review statuses
        updated.forEach((status, ticketId) => {
          if (new Date(status.expiresAt).getTime() < now) {
            updated.delete(ticketId);
            hasChanges = true;
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 30000); // Check every 30 seconds

    return () => clearInterval(cleanupInterval);
  }, []);

  // Handle item actions (qualify, etc.)
  const handleItemAction = (action: string, ticket: Ticket) => {
    if (action === 'qualify') {
      setQualifyingTicket(ticket);
      setShowQualifyModal(true);
    }
  };

  // Handle toast with undo functionality
  const handleShowToast = (message: string) => {
    setToastMessage(message);
    setShowToast(true);

    // Show undo button for assignment and qualification messages
    const shouldShowUndo =
      message === 'The ticket was successfully assigned.' ||
      message.includes('converted to lead') ||
      message.includes('converted to support case') ||
      message === 'Ticket has been archived';

    if (shouldShowUndo) {
      setShowUndoOnToast(true);

      // Auto-hide undo option after 15 seconds
      setTimeout(() => {
        setShowUndoOnToast(false);
        setPreviousTicketState(null);
      }, 15000);
    } else {
      setShowUndoOnToast(false);
    }
  };

  const handleToastClose = () => {
    setShowToast(false);
    setToastMessage('');
    setShowUndoOnToast(false);
    setTimeout(() => {
      setPreviousTicketState(null);
    }, 100);
  };

  const handleUndo = async () => {
    if (!previousTicketState || isUndoing) return;

    setIsUndoing(true);
    try {
      const response = await fetch(
        `/api/tickets/${previousTicketState.ticketId}/undo`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            previousState: previousTicketState.previousState,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Failed to undo ticket qualification'
        );
      }

      onTicketUpdated?.();
      setShowToast(false);
      setShowUndoOnToast(false);
      setPreviousTicketState(null);

      setTimeout(() => {
        const undoMessage = previousTicketState.qualification === 'junk' 
          ? 'Ticket restored successfully.' 
          : 'Ticket assignment undone successfully.';
        setToastMessage(undoMessage);
        setShowToast(true);
        setShowUndoOnToast(false);
      }, 300);
    } catch (error) {
      console.error('Error undoing ticket qualification:', error);
      setToastMessage(
        `Failed to undo: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      setShowToast(true);
      setShowUndoOnToast(false);
    } finally {
      setIsUndoing(false);
    }
  };

  const handleQualify = async (
    qualification: 'sales' | 'customer_service' | 'junk',
    assignedTo?: string,
    customStatus?: string
  ) => {
    if (!qualifyingTicket) return;

    const previousState = {
      status: qualifyingTicket.status,
      service_type: qualifyingTicket.service_type,
      assigned_to: qualifyingTicket.assigned_to,
      archived: qualifyingTicket.archived || false,
    };

    setIsQualifying(true);
    try {
      const response = await fetch(
        `/api/tickets/${qualifyingTicket.id}/qualify`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ qualification, assignedTo, customStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to qualify ticket');
      }

      const result = await response.json();

      setPreviousTicketState({
        ticketId: qualifyingTicket.id,
        previousState,
        qualification,
      });

      onTicketUpdated?.();

      // For live calls (customStatus provided), don't auto-close modal or show toast
      // The modal component will handle these actions
      if (!customStatus) {
        setShowQualifyModal(false);
        setQualifyingTicket(null);

        // Show success message from API response
        if (result.message) {
          handleShowToast(result.message);
        }
      }

      return result;
    } catch (error) {
      console.error('Error qualifying ticket:', error);
      alert('Failed to qualify ticket. Please try again.');
    } finally {
      setIsQualifying(false);
    }
  };

  // Memoize customComponents to prevent LiveCallBar from unmounting/remounting
  const customComponentsMemo = useMemo(() => ({
    liveBar: (_props: { data: Ticket[] }) => <LiveCallBar liveTickets={liveTickets} />,
  }), [liveTickets]);

  return (
    <>
      {/* Custom Toast with Undo */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={handleToastClose}
        showUndo={showUndoOnToast}
        onUndo={handleUndo}
        undoLoading={isUndoing}
      />

      {/* DataTable Component */}
      <DataTable
        data={tickets}
        loading={loading}
        title="Review & Qualify Your Leads"
        columns={getTicketColumns(reviewStatuses)}
        tabs={getTicketTabs(callRecords, tabCounts)}
        tableType="tickets"
        onItemAction={handleItemAction}
        onDataUpdated={onTicketUpdated}
        customComponents={customComponentsMemo}
        emptyStateMessage="No tickets found for this category."
        onShowToast={handleShowToast}
        // Infinite scroll props
        infiniteScrollEnabled={infiniteScrollEnabled}
        hasMore={hasMore}
        onLoadMore={onLoadMore}
        loadingMore={loadingMore}
        // Callbacks only - DataTable manages its own UI state
        onTabChange={onTabChange}
        onSortChange={onSortChange}
        onSearchChange={onSearchChange}
      />

      {/* Qualification Modal */}
      {qualifyingTicket && (
        <TicketReviewModal
          ticket={qualifyingTicket}
          isOpen={showQualifyModal}
          onClose={() => {
            setShowQualifyModal(false);
            setQualifyingTicket(null);
          }}
          onQualify={handleQualify}
          isQualifying={isQualifying}
          onSuccess={handleShowToast}
        />
      )}
    </>
  );
}

export default TicketsList;
