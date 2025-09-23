'use client';

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminAPI } from '@/lib/api-client';
import TicketsList from '@/components/Tickets/TicketsList/TicketsList';
import { Ticket } from '@/types/ticket';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { MetricsCard, styles as metricsStyles } from '@/components/Common/MetricsCard';
import { MetricsResponse } from '@/services/metricsService';
import { CallRecord } from '@/types/call-record';
import { TicketReviewModal } from '@/components/Tickets/TicketReviewModal';
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

  // Use global company context
  const { selectedCompany } = useCompany();
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

    console.log('Call record change:', eventType, newRecord);

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
          console.log('Call record does not belong to current company, ignoring');
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
        console.log('Processing INSERT for call record:', newRecord.id);
        if (newRecord?.ticket_id) {
          await updateTicketCallRecords(newRecord.ticket_id);
        }
        break;

      case 'UPDATE':
        console.log('Processing UPDATE for call record:', newRecord.id);
        if (newRecord?.ticket_id) {
          await updateTicketCallRecords(newRecord.ticket_id);
        }
        break;

      case 'DELETE':
        console.log('Processing DELETE for call record:', oldRecord?.id);
        if (oldRecord?.ticket_id) {
          await updateTicketCallRecords(oldRecord.ticket_id);
        }
        break;
    }
  }, [selectedCompany?.id]);

  const handleTicketChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    console.log('Ticket change:', eventType, newRecord);
    
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
                // Fallback to basic update
                setTickets(prev =>
                  prev.map(ticket => ticket.id === newRecord.id ? newRecord : ticket)
                );
              } else if (fullTicket) {
                setTickets(prev =>
                  prev.map(ticket => ticket.id === newRecord.id ? fullTicket : ticket)
                );
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
          console.log('Ticket realtime update:', payload);
          handleTicketChange(payload);
          
          // Still refresh metrics on ticket changes since they affect aggregates
          if (payload.eventType === 'INSERT' || payload.eventType === 'DELETE') {
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
          console.log('Call record realtime update:', payload);
          handleCallRecordChange(payload);
          
          // Refresh metrics if call status affects aggregations
          if (payload.eventType === 'UPDATE' && 
              (payload.new?.end_timestamp !== payload.old?.end_timestamp)) {
            fetchMetrics(selectedCompany.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCompany?.id, handleTicketChange, handleCallRecordChange, fetchMetrics]);

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