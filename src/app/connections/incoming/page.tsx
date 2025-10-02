'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminAPI } from '@/lib/api-client';
import TicketsList from '@/components/Tickets/TicketsList/TicketsList';
import { Ticket, TicketFormData } from '@/types/ticket';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import { MetricsCard, styles as metricsStyles } from '@/components/Common/MetricsCard';
import { MetricsResponse } from '@/services/metricsService';
import { CallRecord } from '@/types/call-record';
import { TicketReviewModal } from '@/components/Tickets/TicketReviewModal';
import { Modal, ModalTop, ModalMiddle, ModalBottom } from '@/components/Common/Modal/Modal';
import ModalActionButtons from '@/components/Common/Modal/ModalActionButtons';
import TicketForm from '@/components/Tickets/TicketForm/TicketForm';
import styles from './page.module.scss';

function TicketsPageContent() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [callRecords, setCallRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Modal state for URL parameter handling
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isQualifying, setIsQualifying] = useState(false);

  // Add ticket form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<TicketFormData | null>(null);

  // Use global company context
  const { selectedCompany } = useCompany();

  // Register page actions for global header
  const { registerPageAction, unregisterPageAction } = usePageActions();

  // Get assignable users for the company
  const { users: assignableUsers } = useAssignableUsers({
    companyId: selectedCompany?.id,
    departmentType: 'all',
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketIdFromUrl = searchParams.get('ticketId');

  // Handle URL parameter for auto-opening ticket modal
  useEffect(() => {
    if (ticketIdFromUrl && tickets.length > 0) {
      const ticket = tickets.find(t => t.id === ticketIdFromUrl);
      if (ticket) {
        setSelectedTicket(ticket);
        setShowTicketModal(true);
      }
    }
  }, [ticketIdFromUrl, tickets]);

  const fetchTickets = useCallback(async (companyId: string) => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      // Fetch tickets (non-archived only for the new view)
      const ticketsData = await adminAPI.tickets.list({
        companyId,
        includeArchived: false
      });
      
      // Fetch call records for hang-up filtering
      const callsData = await adminAPI.getUserCalls({ companyId });
      
      setTickets(ticketsData);
      setCallRecords(callsData);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  }, []);


  // Granular update handlers for real-time changes (no full page refreshes)
  const handleCallRecordChange = useCallback(async (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    // Check if this call record belongs to the current company
    // We need to verify through the lead relationship
    if (newRecord?.lead_id && selectedCompany?.id) {
      try {
        const supabase = createClient();
        const { data: lead } = await supabase
          .from('leads')
          .select('company_id')
          .eq('id', newRecord.lead_id)
          .single();

        // Only process if this call belongs to the current company
        if (lead?.company_id !== selectedCompany.id) {
          return;
        }
      } catch (error) {
        console.error('Error checking call company association:', error);
        return;
      }
    }

    // Update specific ticket's call records instead of full refresh
    const updateTicketCallRecords = async (ticketId: string) => {
      if (!ticketId) return;

      try {
        const supabase = createClient();
        const { data: updatedCallRecords, error } = await supabase
          .from('call_records')
          .select('id, call_id, call_status, start_timestamp, end_timestamp, duration_seconds')
          .eq('ticket_id', ticketId);

        if (error) {
          console.error('Error fetching updated call records:', error);
          return;
        }

        // Update the specific ticket's call records in state
        setTickets(prev =>
          prev.map(ticket =>
            ticket.id === ticketId
              ? { ...ticket, call_records: updatedCallRecords || [] }
              : ticket
          )
        );
      } catch (error) {
        console.error('Error updating ticket call records:', error);
      }
    };

    switch (eventType) {
      case 'INSERT':
        if (newRecord?.ticket_id) {
          await updateTicketCallRecords(newRecord.ticket_id);
        }
        break;

      case 'UPDATE':
        if (newRecord?.ticket_id) {
          await updateTicketCallRecords(newRecord.ticket_id);
        }
        break;

      case 'DELETE':
        if (oldRecord?.ticket_id) {
          await updateTicketCallRecords(oldRecord.ticket_id);
        }
        break;
    }
  }, [selectedCompany?.id]);

  const handleTicketChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    switch (eventType) {
      case 'INSERT':
        // Add new ticket to the list - fetch full data with joins
        if (newRecord && selectedCompany?.id) {
          // Check if already exists to prevent duplicates
          const exists = tickets.some(ticket => ticket.id === newRecord.id);
          if (!exists) {
            // Fetch the full ticket data with joins
            const supabase = createClient();
            supabase
              .from('tickets')
              .select(`
                *,
                customer:customers!tickets_customer_id_fkey(
                  id,
                  first_name,
                  last_name,
                  email,
                  phone,
                  address,
                  city,
                  state,
                  zip_code
                ),
                call_records:call_records!call_records_ticket_id_fkey(
                  id,
                  call_id,
                  call_status,
                  start_timestamp,
                  end_timestamp,
                  duration_seconds
                )
              `)
              .eq('id', newRecord.id)
              .single()
              .then(({ data: fullTicket, error }) => {
                if (error) {
                  console.error('Error fetching full ticket data:', error);
                  // Fallback to basic insert
                  setTickets(prev => {
                    const exists = prev.some(ticket => ticket.id === newRecord.id);
                    if (!exists) {
                      return [newRecord, ...prev];
                    }
                    return prev;
                  });
                } else if (fullTicket) {
                  setTickets(prev => {
                    const exists = prev.some(ticket => ticket.id === fullTicket.id);
                    if (!exists) {
                      return [fullTicket, ...prev];
                    }
                    return prev;
                  });
                }
              });
          }
        }
        break;
        
      case 'UPDATE':
        // Update existing ticket - fetch full data with joins for real-time updates
        if (newRecord && selectedCompany?.id) {
          // If ticket becomes archived or resolved (from qualification), remove it from active view
          if (newRecord.archived === true || newRecord.status === 'resolved') {
            setTickets(prev => prev.filter(ticket => ticket.id !== newRecord.id));
            break;
          }

          // For non-archived updates, fetch full data with joins
          const supabase = createClient();
          supabase
            .from('tickets')
            .select(`
              *,
              customer:customers!tickets_customer_id_fkey(
                id,
                first_name,
                last_name,
                email,
                phone,
                address,
                city,
                state,
                zip_code
              ),
              call_records:call_records!call_records_ticket_id_fkey(
                id,
                call_id,
                call_status,
                start_timestamp,
                end_timestamp,
                duration_seconds
              )
            `)
            .eq('id', newRecord.id)
            .single()
            .then(({ data: fullTicket, error }) => {
              if (error) {
                console.error('Error fetching full ticket data for update:', error);
                // If ticket no longer exists or is archived, remove it
                if (error.code === 'PGRST116') { // No rows returned
                  setTickets(prev => prev.filter(ticket => ticket.id !== newRecord.id));
                } else {
                  // Fallback to basic update for other errors
                  setTickets(prev =>
                    prev.map(ticket => ticket.id === newRecord.id ? newRecord : ticket)
                  );
                }
              } else if (fullTicket) {
                // Check again if the full ticket data shows it should be removed
                if (fullTicket.archived === true || fullTicket.status === 'resolved') {
                  setTickets(prev => prev.filter(ticket => ticket.id !== fullTicket.id));
                } else {
                  setTickets(prev =>
                    prev.map(ticket => ticket.id === newRecord.id ? fullTicket : ticket)
                  );
                }
              }
            });
        }
        break;
        
      case 'DELETE':
        // Remove ticket from list
        if (oldRecord) {
          setTickets(prev => prev.filter(ticket => ticket.id !== oldRecord.id));
        }
        break;
    }
  }, [selectedCompany?.id]);

  const fetchMetrics = useCallback(async (companyId: string) => {
    if (!companyId) return;

    setMetricsLoading(true);
    try {
      const params = new URLSearchParams({
        companyId
      });

      const response = await fetch(`/api/metrics?${params}`);
      if (response.ok) {
        const metricsData = await response.json();
        setMetrics(metricsData);
      } else {
        console.error('Error fetching metrics:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // Handle modal close - clear URL parameter
  const handleModalClose = useCallback(() => {
    setShowTicketModal(false);
    setSelectedTicket(null);
    // Clear URL parameter without adding to history
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete('ticketId');
    router.replace(newUrl.pathname + newUrl.search);
  }, [router]);

  // Handle ticket qualification
  const handleQualify = useCallback(async (
    qualification: 'sales' | 'customer_service' | 'junk',
    assignedTo?: string
  ) => {
    if (!selectedTicket) return;

    setIsQualifying(true);
    try {
      const response = await fetch(
        `/api/tickets/${selectedTicket.id}/qualify`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            qualification,
            assignedTo,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to qualify ticket');
      }

      // Refresh the tickets list
      if (selectedCompany?.id) {
        fetchTickets(selectedCompany.id);
        fetchMetrics(selectedCompany.id);
      }

      handleModalClose();
    } catch (error) {
      console.error('Error qualifying ticket:', error);
      alert('Failed to qualify ticket. Please try again.');
    } finally {
      setIsQualifying(false);
    }
  }, [selectedTicket, selectedCompany, fetchTickets, fetchMetrics, handleModalClose]);

  const handleCreateTicket = useCallback(async (formData: TicketFormData & { newCustomerData?: any }) => {
    if (!selectedCompany?.id) return;

    setSubmitting(true);
    try {
      let customerId = formData.customer_id;

      // If creating a new customer, create customer first
      if (formData.newCustomerData && !customerId) {
        console.log('Creating new customer with data:', formData.newCustomerData);
        
        const customerResponse = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData.newCustomerData,
            company_id: selectedCompany.id,
          }),
        });

        if (customerResponse.ok) {
          const newCustomer = await customerResponse.json();
          customerId = newCustomer.id;
        } else {
          const errorData = await customerResponse.json().catch(() => ({}));
          console.error('Customer creation failed:', {
            status: customerResponse.status,
            statusText: customerResponse.statusText,
            errorData
          });
          throw new Error(errorData.error || 'Failed to create customer');
        }
      }

      // Create the ticket data, filtering out undefined values and non-API fields
      const { newCustomerData, ...cleanFormData } = formData;
      
      // Filter out undefined values
      const ticketData = Object.fromEntries(
        Object.entries({
          ...cleanFormData,
          customer_id: customerId,
          company_id: selectedCompany.id,
        }).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData),
      });

      if (response.ok) {
        await response.json();
        setShowCreateForm(false);
        setFormData(null);
        if (selectedCompany?.id) {
          await fetchTickets(selectedCompany.id);
          await fetchMetrics(selectedCompany.id);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Ticket creation failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          sentData: ticketData
        });
        throw new Error(errorData.error || `Failed to create ticket (${response.status})`);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [selectedCompany, fetchTickets, fetchMetrics]);

  const handleCancelForm = useCallback(() => {
    setShowCreateForm(false);
    setFormData(null);
  }, []);

  useEffect(() => {
    if (selectedCompany?.id) {
      fetchTickets(selectedCompany.id);
      fetchMetrics(selectedCompany.id);
    }
  }, [selectedCompany?.id, fetchTickets, fetchMetrics]);

  // Supabase Realtime subscription for live updates
  useEffect(() => {
    if (!selectedCompany?.id) return;

    const supabase = createClient();
    
    const channel = supabase
      .channel('live-updates')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'tickets',
          filter: `company_id=eq.${selectedCompany.id}`
        },
        (payload) => {
          const newTicket = payload.new as any;
          const oldTicket = payload.old as any;

          console.log('Ticket realtime update received:', {
            eventType: payload.eventType,
            ticketId: newTicket?.id || oldTicket?.id,
            companyId: selectedCompany.id,
            timestamp: new Date().toISOString(),
            oldData: oldTicket,
            newData: newTicket
          });
          handleTicketChange(payload);

          // Refresh metrics on ticket changes since they affect aggregates
          if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE' ||
              (payload.eventType === 'UPDATE' && (newTicket?.archived !== oldTicket?.archived))) {
            fetchMetrics(selectedCompany.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_records'
        },
        (payload) => {
          handleCallRecordChange(payload);
          
          // Refresh metrics if call status affects aggregations
          if (payload.eventType === 'UPDATE' && 
              (payload.new?.end_timestamp !== payload.old?.end_timestamp)) {
            fetchMetrics(selectedCompany.id);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Realtime tickets subscription error');
        } else if (status === 'TIMED_OUT') {
          console.warn('Realtime tickets subscription timed out');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCompany?.id, handleTicketChange, handleCallRecordChange, fetchMetrics]);

  // Register the add action for the global header button
  useEffect(() => {
    registerPageAction('add', () => setShowCreateForm(true));
    return () => unregisterPageAction('add');
  }, [registerPageAction, unregisterPageAction]);

  return (
    <div style={{ width: '100%' }}>

      {selectedCompany && (
        <>

          {/* Metrics Cards */}
          <div className={metricsStyles.metricsCardWrapper}>
            {metrics && !metricsLoading ? (
              <>
                <MetricsCard
                  title={metrics.totalCalls.title}
                  value={metrics.totalCalls.value}
                  comparisonValue={metrics.totalCalls.comparisonValue}
                  comparisonPeriod={metrics.totalCalls.comparisonPeriod}
                  trend={metrics.totalCalls.trend}
                />
                <MetricsCard
                  title={metrics.totalForms.title}
                  value={metrics.totalForms.value}
                  comparisonValue={metrics.totalForms.comparisonValue}
                  comparisonPeriod={metrics.totalForms.comparisonPeriod}
                  trend={metrics.totalForms.trend}
                />
                <MetricsCard
                  title={metrics.avgTimeToAssign.title}
                  value={metrics.avgTimeToAssign.value}
                  comparisonValue={metrics.avgTimeToAssign.comparisonValue}
                  comparisonPeriod={metrics.avgTimeToAssign.comparisonPeriod}
                  trend={metrics.avgTimeToAssign.trend}
                />
                <MetricsCard
                  title={metrics.hangupCalls.title}
                  value={metrics.hangupCalls.value}
                  comparisonValue={metrics.hangupCalls.comparisonValue}
                  comparisonPeriod={metrics.hangupCalls.comparisonPeriod}
                  trend={metrics.hangupCalls.trend}
                />
                <MetricsCard
                  title={metrics.customerServiceCalls.title}
                  value={metrics.customerServiceCalls.value}
                  comparisonValue={metrics.customerServiceCalls.comparisonValue}
                  comparisonPeriod={metrics.customerServiceCalls.comparisonPeriod}
                  trend={metrics.customerServiceCalls.trend}
                />
              </>
            ) : (
              <>
                <MetricsCard
                  title="Total Calls"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
                <MetricsCard
                  title="Total Forms"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
                <MetricsCard
                  title="Avg Time To Be Assigned"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
                <MetricsCard
                  title="Hang-up Calls"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
                <MetricsCard
                  title="Customer Service Calls"
                  value="--"
                  comparisonValue={0}
                  comparisonPeriod="previous period"
                  trend="good"
                  isLoading={true}
                />
              </>
            )}
          </div>
        </>
      )}

      {selectedCompany && (
        <TicketsList
          tickets={tickets}
          callRecords={callRecords}
          loading={loading}
          onTicketUpdated={() => {
            fetchTickets(selectedCompany.id);
            fetchMetrics(selectedCompany.id);
          }}
        />
      )}

      {!selectedCompany && (
        <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>
          Please select a company to view tickets.
        </div>
      )}

      {/* Ticket Review Modal */}
      {selectedTicket && (
        <TicketReviewModal
          ticket={selectedTicket}
          isOpen={showTicketModal}
          onClose={handleModalClose}
          onQualify={handleQualify}
          isQualifying={isQualifying}
        />
      )}

      {/* Create Ticket Modal */}
      <Modal isOpen={showCreateForm} onClose={handleCancelForm}>
        <ModalTop
          title="Create New Ticket"
          onClose={handleCancelForm}
        />
        <ModalMiddle>
          <TicketForm
            companyId={selectedCompany?.id || ''}
            assignableUsers={assignableUsers}
            onFormDataChange={setFormData}
            loading={submitting}
          />
        </ModalMiddle>
        <ModalBottom>
          <ModalActionButtons
            onBack={handleCancelForm}
            showBackButton={true}
            isFirstStep={true}
            onPrimaryAction={async () => {
              if (formData) {
                await handleCreateTicket(formData);
              }
            }}
            primaryButtonText="Create Ticket"
            primaryButtonDisabled={!formData || submitting}
            isLoading={submitting}
            loadingText="Creating..."
          />
        </ModalBottom>
      </Modal>
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TicketsPageContent />
    </Suspense>
  );
}