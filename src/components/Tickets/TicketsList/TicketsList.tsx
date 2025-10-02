'use client';

import React, { useState } from 'react';
import { Ticket } from '@/types/ticket';
import LiveCallBar from '@/components/Common/LiveCallBar/LiveCallBar';
import { DataTable } from '@/components/Common/DataTable';
import { TicketReviewModal } from '@/components/Tickets/TicketReviewModal';
import { getTicketColumns, getTicketTabs } from './TicketsListConfig';
import { Toast } from '@/components/Common/Toast';

interface TicketsListProps {
  tickets: Ticket[];
  callRecords?: any[]; // For hang-up calls filtering
  loading?: boolean;
  onTicketUpdated?: () => void;
}

function TicketsList({
  tickets,
  callRecords = [],
  loading = false,
  onTicketUpdated,
}: TicketsListProps) {
  // Qualify modal state
  const [showQualifyModal, setShowQualifyModal] = useState(false);
  const [qualifyingTicket, setQualifyingTicket] = useState<Ticket | null>(null);
  const [isQualifying, setIsQualifying] = useState(false);

  // Toast state for undo functionality
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [showUndoOnToast, setShowUndoOnToast] = useState(false);
  const [previousTicketState, setPreviousTicketState] = useState<any>(null);
  const [isUndoing, setIsUndoing] = useState(false);

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
        columns={getTicketColumns()}
        tabs={getTicketTabs(callRecords)}
        tableType="tickets"
        onItemAction={handleItemAction}
        onDataUpdated={onTicketUpdated}
        customComponents={{
          liveBar: ({ data }) => <LiveCallBar tickets={data} />,
        }}
        emptyStateMessage="No tickets found for this category."
        onShowToast={handleShowToast}
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
