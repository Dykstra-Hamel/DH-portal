'use client';

import {
  useEffect,
  useState,
  useCallback,
  useRef,
  Suspense,
  useMemo,
} from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { adminAPI } from '@/lib/api-client';
import TicketsList from '@/components/Tickets/TicketsList/TicketsList';
import { Ticket, TicketFormData } from '@/types/ticket';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import {
  MetricsCard,
  styles as metricsStyles,
} from '@/components/Common/MetricsCard';
import { MetricsResponse } from '@/services/metricsService';
import { CallRecord } from '@/types/call-record';
import { TicketReviewModal } from '@/components/Tickets/TicketReviewModal';
import {
  Modal,
  ModalTop,
  ModalMiddle,
  ModalBottom,
} from '@/components/Common/Modal/Modal';
import ModalActionButtons from '@/components/Common/Modal/ModalActionButtons';
import TicketForm from '@/components/Tickets/TicketForm/TicketForm';
import {
  createTicketChannel,
  subscribeToTicketUpdates,
  TicketUpdatePayload,
} from '@/lib/realtime/ticket-channel';
import styles from './page.module.scss';

function TicketsPageContent() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [callRecords, setCallRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [tabCounts, setTabCounts] = useState({
    all: 0,
    incoming: 0,
    outbound: 0,
    forms: 0,
  });

  // Filter/sort refs - store current values without causing re-renders
  const currentTabRef = useRef('all');
  const sortByRef = useRef('created_at');
  const sortOrderRef = useRef<'asc' | 'desc'>('desc');
  const searchQueryRef = useRef('');

  // Modal state for URL parameter handling
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isQualifying, setIsQualifying] = useState(false);

  // Add ticket form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<TicketFormData | null>(null);

  // Ref to track subscription state and prevent duplicate subscriptions
  const subscriptionActiveRef = useRef(false);
  const currentChannelRef = useRef<any>(null);
  const isFetchingRef = useRef(false);

  // Use global company context
  const { selectedCompany, isLoading: companyLoading } = useCompany();

  // Keep company ref in sync to prevent stale closures in broadcast callback
  const selectedCompanyRef = useRef(selectedCompany);
  useEffect(() => {
    selectedCompanyRef.current = selectedCompany;
  }, [selectedCompany]);

  // Clean up any stale review statuses on page load
  useEffect(() => {
    const cleanupStaleReviews = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user || !selectedCompany?.id) return;

        // Clear any tickets that this user is reviewing but shouldn't be (from interrupted sessions)
        await supabase
          .from('tickets')
          .update({
            reviewed_by: null,
            reviewed_at: null,
            review_expires_at: null,
          })
          .eq('reviewed_by', user.id)
          .eq('company_id', selectedCompany.id);
      } catch (error) {
        console.error('Error cleaning up stale reviews:', error);
      }
    };

    cleanupStaleReviews();
  }, [selectedCompany?.id]);

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

  // Function to refetch tab counts only (for real-time updates)
  const refetchTabCounts = useCallback(async (companyId: string) => {
    if (!companyId) return;

    try {
      const response = await fetch(
        `/api/tickets?companyId=${companyId}&countOnly=true`
      );
      if (response.ok) {
        const data = await response.json();
        setTabCounts(
          data.counts || { all: 0, incoming: 0, outbound: 0, forms: 0 }
        );
      }
    } catch (error) {
      console.error('Error refetching tab counts:', error);
    }
  }, []);

  const fetchTickets = useCallback(
    async (companyId: string, page: number = 1, append: boolean = false) => {
      if (!companyId) return;

      isFetchingRef.current = true;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        // Build query parameters using current ref values
        const params = new URLSearchParams({
          companyId,
          includeArchived: 'false',
          page: page.toString(),
          limit: '25',
          sortBy: sortByRef.current,
          sortOrder: sortOrderRef.current,
          tab: currentTabRef.current,
        });

        if (searchQueryRef.current) {
          params.append('search', searchQueryRef.current);
        }

        // Fetch paginated tickets
        const response = await fetch(`/api/tickets?${params}`);
        if (!response.ok) {
          throw new Error('Failed to fetch tickets');
        }

        const data = await response.json();

        // Fetch call records for hang-up filtering
        const callsData = await adminAPI.getUserCalls({ companyId });

        if (append) {
          setTickets(prev => [...prev, ...(data.tickets || [])]);
        } else {
          setTickets(data.tickets || []);
        }

        setCallRecords(callsData);
        const newHasMore = data.pagination?.hasMore || false;
        setHasMore(newHasMore);
        setTotalCount(data.pagination?.total || 0);
        setTabCounts(
          data.counts || { all: 0, incoming: 0, outbound: 0, forms: 0 }
        );
        setCurrentPage(page);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        isFetchingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [] // No dependencies - uses refs instead
  );

  // Load more tickets for infinite scroll
  const handleLoadMore = () => {
    if (!selectedCompany?.id || loadingMore || !hasMore) return;
    fetchTickets(selectedCompany.id, currentPage + 1, true);
  };

  // Handle filter changes - update refs and fetch new data
  const handleTabChange = useCallback((tab: string) => {
    if (!selectedCompany?.id) return;
    currentTabRef.current = tab;
    setCurrentPage(1);
    fetchTickets(selectedCompany.id, 1, false);
  }, [selectedCompany?.id, fetchTickets]);

  const handleSortChange = useCallback(
    (field: string, order: 'asc' | 'desc') => {
      if (!selectedCompany?.id) return;
      sortByRef.current = field;
      sortOrderRef.current = order;
      setCurrentPage(1);
      fetchTickets(selectedCompany.id, 1, false);
    },
    [selectedCompany?.id, fetchTickets]
  );

  const handleSearchChange = useCallback((query: string) => {
    if (!selectedCompany?.id) return;
    searchQueryRef.current = query;
    setCurrentPage(1);
    fetchTickets(selectedCompany.id, 1, false);
  }, [selectedCompany?.id, fetchTickets]);

  // Granular update handlers for real-time changes (no full page refreshes)
  const handleCallRecordChange = useCallback(
    async (payload: any) => {
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
            .select(
              'id, call_id, call_status, start_timestamp, end_timestamp, duration_seconds, phone_number, from_number'
            )
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
    },
    [selectedCompany?.id]
  );

  const handleTicketChange = useCallback(
    (payload: any) => {
      const { eventType, new: newRecord, old: oldRecord } = payload;

      switch (eventType) {
        case 'INSERT':
          // Prepend new ticket to the top of the list - fetch full data with joins
          if (newRecord && selectedCompany?.id) {
            // Check if already exists to prevent duplicates
            const exists = tickets.some(ticket => ticket.id === newRecord.id);
            if (!exists) {
              // Fetch the full ticket data with joins
              const supabase = createClient();
              supabase
                .from('tickets')
                .select(
                  `
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
                  duration_seconds,
                  phone_number,
                  from_number
                )
              `
                )
                .eq('id', newRecord.id)
                .single()
                .then(({ data: fullTicket, error }) => {
                  if (error) {
                    console.error('Error fetching full ticket data:', error);
                    // Fallback to basic insert - prepend to top (unless closed)
                    setTickets(prev => {
                      const exists = prev.some(
                        ticket => ticket.id === newRecord.id
                      );
                      // Don't add if ticket is closed
                      if (!exists && newRecord.status !== 'closed') {
                        return [newRecord, ...prev];
                      }
                      return prev;
                    });
                  } else if (fullTicket) {
                    // Prepend new ticket to top of list (unless closed)
                    // Don't add closed tickets to the list
                    if (fullTicket.status === 'closed') {
                      return;
                    }

                    setTickets(prev => {
                      const exists = prev.some(
                        ticket => ticket.id === fullTicket.id
                      );
                      if (!exists) {
                        return [fullTicket, ...prev];
                      }
                      return prev;
                    });
                    // Update count
                    setTotalCount(prev => prev + 1);
                  }
                });
            }
          }
          break;

        case 'UPDATE':
          // Update existing ticket - fetch full data with joins for real-time updates
          if (newRecord && selectedCompany?.id) {
            // If ticket becomes archived, resolved, or closed, remove it from active view
            if (
              newRecord.archived === true ||
              newRecord.status === 'resolved' ||
              newRecord.status === 'closed'
            ) {
              setTickets(prev =>
                prev.filter(ticket => ticket.id !== newRecord.id)
              );
              break;
            }

            // For non-archived updates, fetch full data with joins
            const supabase = createClient();
            supabase
              .from('tickets')
              .select(
                `
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
            `
              )
              .eq('id', newRecord.id)
              .single()
              .then(({ data: fullTicket, error }) => {
                if (error) {
                  console.error(
                    'Error fetching full ticket data for update:',
                    error
                  );
                  // If ticket no longer exists or is archived, remove it
                  if (error.code === 'PGRST116') {
                    // No rows returned
                    setTickets(prev =>
                      prev.filter(ticket => ticket.id !== newRecord.id)
                    );
                  } else {
                    // Fallback to basic update for other errors
                    setTickets(prev =>
                      prev.map(ticket =>
                        ticket.id === newRecord.id ? newRecord : ticket
                      )
                    );
                  }
                } else if (fullTicket) {
                  // Check again if the full ticket data shows it should be removed
                  if (
                    fullTicket.archived === true ||
                    fullTicket.status === 'resolved'
                  ) {
                    setTickets(prev =>
                      prev.filter(ticket => ticket.id !== fullTicket.id)
                    );
                  } else {
                    setTickets(prev =>
                      prev.map(ticket =>
                        ticket.id === newRecord.id ? fullTicket : ticket
                      )
                    );
                  }
                }
              });
          }
          break;

        case 'DELETE':
          // Remove ticket from list
          if (oldRecord) {
            setTickets(prev =>
              prev.filter(ticket => ticket.id !== oldRecord.id)
            );
          }
          break;
      }
    },
    [selectedCompany?.id]
  );

  const fetchMetrics = useCallback(async (companyId: string) => {
    if (!companyId) return;

    setMetricsLoading(true);
    try {
      const params = new URLSearchParams({
        companyId,
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
  const handleQualify = useCallback(
    async (
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
        }

        handleModalClose();
      } catch (error) {
        console.error('Error qualifying ticket:', error);
        alert('Failed to qualify ticket. Please try again.');
      } finally {
        setIsQualifying(false);
      }
    },
    [
      selectedTicket,
      selectedCompany,
      fetchTickets,
      fetchMetrics,
      handleModalClose,
    ]
  );

  const handleCreateTicket = useCallback(
    async (formData: TicketFormData & { newCustomerData?: any }) => {
      if (!selectedCompany?.id) return;

      setSubmitting(true);
      try {
        let customerId = formData.customer_id;

        // If creating a new customer, create customer first
        if (formData.newCustomerData && !customerId) {
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
              errorData,
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
          }).filter(
            ([_, value]) =>
              value !== undefined && value !== null && value !== ''
          )
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
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          console.error('Ticket creation failed:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            sentData: ticketData,
          });
          throw new Error(
            errorData.error || `Failed to create ticket (${response.status})`
          );
        }
      } catch (error) {
        console.error('Error creating ticket:', error);
        alert('Failed to create ticket. Please try again.');
      } finally {
        setSubmitting(false);
      }
    },
    [selectedCompany, fetchTickets, fetchMetrics]
  );

  const handleCancelForm = useCallback(() => {
    setShowCreateForm(false);
    setFormData(null);
  }, []);

  // Fetch tickets when company changes (initial load only)
  useEffect(() => {
    if (selectedCompany?.id) {
      fetchTickets(selectedCompany.id, 1, false);
      fetchMetrics(selectedCompany.id);
    }
  }, [selectedCompany?.id, fetchTickets, fetchMetrics]);

  // Supabase Realtime broadcast subscription for live updates
  useEffect(() => {
    if (!selectedCompany?.id) {
      return;
    }

    // Prevent duplicate subscriptions during Fast Refresh
    if (subscriptionActiveRef.current && currentChannelRef.current) {
      return;
    }

    const channel = createTicketChannel(selectedCompany.id);
    currentChannelRef.current = channel;

    subscribeToTicketUpdates(channel, async (payload: TicketUpdatePayload) => {

      const { table, company_id, action, record_id, ticket_id } = payload;

      // Verify this is for our selected company (use ref to avoid stale closure)
      // Allow broadcasts with ticket_id but missing company_id (call_records edge case)
      const currentCompany = selectedCompanyRef.current;
      if (
        company_id &&
        currentCompany?.id &&
        company_id !== currentCompany.id
      ) {
        return;
      }

      // Skip updates if we're actively fetching to avoid race conditions
      if (isFetchingRef.current) {
        return;
      }

      if (table === 'tickets') {
        // Handle ticket updates
        if (action === 'INSERT') {
          // Fetch full ticket data with joins
          try {
            const supabase = createClient();
            const { data: fullTicket, error: fetchError } = await supabase
              .from('tickets')
              .select(
                `
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
                  duration_seconds,
                  phone_number,
                  from_number
                )
              `
              )
              .eq('id', record_id)
              .single();

            if (fetchError) {
              return;
            }

            if (fullTicket) {
              let wasAdded = false;
              setTickets(prev => {
                const exists = prev.some(ticket => ticket.id === fullTicket.id);
                if (!exists) {
                  wasAdded = true;
                  const newTickets = [fullTicket, ...prev];
                  return newTickets;
                }
                return prev;
              });
              if (wasAdded) {
                setTotalCount(prev => prev + 1);
              }
            }
          } catch (error) {
            console.error('Error fetching new ticket:', error);
          }

          // Refetch tab counts after INSERT
          const currentCompany = selectedCompanyRef.current;
          if (currentCompany?.id) {
            refetchTabCounts(currentCompany.id);
          }
        } else if (action === 'UPDATE') {
          // Fetch updated ticket data
          try {
            const supabase = createClient();
            const { data: updatedTicket, error: fetchError } = await supabase
              .from('tickets')
              .select(
                `
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
                  duration_seconds,
                  phone_number,
                  from_number
                )
              `
              )
              .eq('id', record_id)
              .single();

            if (fetchError) {
              return;
            }

            if (updatedTicket) {
              // If ticket becomes archived or resolved, remove it from active view
              if (
                updatedTicket.archived === true ||
                updatedTicket.status === 'resolved'
              ) {
                setTickets(prev =>
                  prev.filter(ticket => ticket.id !== record_id)
                );
              } else {
                setTickets(prev =>
                  prev.map(ticket =>
                    ticket.id === updatedTicket.id ? updatedTicket : ticket
                  )
                );
              }
            }
          } catch (error) {
            console.error('Error updating ticket:', error);
          }

          // Refetch tab counts after UPDATE
          const currentCompanyUpdate = selectedCompanyRef.current;
          if (currentCompanyUpdate?.id) {
            refetchTabCounts(currentCompanyUpdate.id);
          }
        } else if (action === 'DELETE') {
          setTickets(prev =>
            prev.filter(ticket => ticket.id !== record_id)
          );

          // Refetch tab counts after DELETE
          const currentCompanyDelete = selectedCompanyRef.current;
          if (currentCompanyDelete?.id) {
            refetchTabCounts(currentCompanyDelete.id);
          }
        }
      } else if (table === 'call_records' && ticket_id) {
        // Handle call_record updates - refresh the parent ticket
        // Also refresh callRecords state for hang-up filtering
        const currentCompany = selectedCompanyRef.current;
        if (currentCompany?.id) {
          try {
            const callsData = await adminAPI.getUserCalls({
              companyId: currentCompany.id,
            });
            setCallRecords(callsData);
          } catch (error) {
            console.error('Error refreshing call records:', error);
          }
        }

        try {
          const supabase = createClient();
          const { data: updatedTicket, error: fetchError } = await supabase
            .from('tickets')
            .select(
              `
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
                duration_seconds,
                phone_number,
                from_number
              )
            `
            )
            .eq('id', ticket_id)
            .single();

          if (fetchError) {
            return;
          }

          if (updatedTicket) {
            setTickets(prev =>
              prev.map(ticket =>
                ticket.id === updatedTicket.id ? updatedTicket : ticket
              )
            );
          }
        } catch (error) {
          console.error('Error updating ticket with call record:', error);
        }
      }
    });

    // Mark subscription as active
    subscriptionActiveRef.current = true;

    return () => {
      subscriptionActiveRef.current = false;
      if (currentChannelRef.current) {
        createClient().removeChannel(currentChannelRef.current);
        currentChannelRef.current = null;
      }
    };
  }, [selectedCompany?.id]);

  // Register the add action for the global header button
  useEffect(() => {
    registerPageAction('add', () => setShowCreateForm(true));
    return () => unregisterPageAction('add');
  }, [registerPageAction, unregisterPageAction]);

  // Filter live tickets for LiveCallBar component
  const liveTickets = useMemo(
    () => tickets.filter(ticket => ticket.status === 'live'),
    [tickets]
  );

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
                  comparisonPeriod={
                    metrics.customerServiceCalls.comparisonPeriod
                  }
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
          liveTickets={liveTickets}
          callRecords={callRecords}
          loading={loading}
          onTicketUpdated={() => {
            fetchTickets(selectedCompany.id, 1, false);
          }}
          // Infinite scroll props
          infiniteScrollEnabled={true}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          loadingMore={loadingMore}
          // Tab counts
          tabCounts={tabCounts}
          // Callbacks for data fetching
          onTabChange={handleTabChange}
          onSortChange={handleSortChange}
          onSearchChange={handleSearchChange}
        />
      )}

      {/* Show loading state while company is being loaded */}
      {companyLoading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div
            style={{
              width: '100%',
              maxWidth: '800px',
              margin: '0 auto',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          >
            <div
              style={{
                height: '60px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            />
            <div
              style={{
                height: '40px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                marginBottom: '12px',
              }}
            />
            <div
              style={{
                height: '40px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
                marginBottom: '12px',
              }}
            />
            <div
              style={{
                height: '40px',
                backgroundColor: '#f3f4f6',
                borderRadius: '8px',
              }}
            />
          </div>
        </div>
      )}

      {!selectedCompany && !companyLoading && (
        <div
          style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}
        >
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
        <ModalTop title="Create New Ticket" onClose={handleCancelForm} />
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
