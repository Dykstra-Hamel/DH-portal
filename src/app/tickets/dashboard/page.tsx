'use client';

import { useEffect, useState, useCallback, useRef, Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket, TicketFormData } from '@/types/ticket';
import { Lead } from '@/types/lead';
import { SupportCase } from '@/types/support-case';
import { Task } from '@/types/task';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { usePageActions } from '@/contexts/PageActionsContext';
import { useUser } from '@/hooks/useUser';
import { useRealtimeCounts } from '@/hooks/useRealtimeCounts';
import {
  createTicketChannel,
  subscribeToTicketUpdates,
  TicketUpdatePayload,
} from '@/lib/realtime/ticket-channel';
import {
  createTicketReviewChannel,
  subscribeToTicketReviewUpdates,
  TicketReviewPayload,
} from '@/lib/realtime/ticket-review-channel';
import LiveCallBar from '@/components/Common/LiveCallBar/LiveCallBar';
import { DataTable, ColumnDefinition } from '@/components/Common/DataTable';
import { getTicketColumns } from '@/components/Tickets/TicketsList/TicketsListConfig';
import { getLeadColumns } from '@/components/Leads/LeadsList/LeadsListConfig';
import { getSupportCaseColumns } from '@/components/SupportCases/SupportCasesList/SupportCasesListConfig';
import { TicketReviewModal } from '@/components/Tickets/TicketReviewModal';
import {
  Modal,
  ModalTop,
  ModalMiddle,
  ModalBottom,
} from '@/components/Common/Modal/Modal';
import ModalActionButtons from '@/components/Common/Modal/ModalActionButtons';
import TicketForm from '@/components/Tickets/TicketForm/TicketForm';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import { AnnouncementsModal } from '@/components/Common/AnnouncementsModal/AnnouncementsModal';
import { MiniAvatar } from '@/components/Common/MiniAvatar';
import { getCustomerDisplayName, getPhoneDisplay } from '@/lib/display-utils';
import { ChevronRight, Search, Loader2 } from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';
import tableStyles from '@/components/Common/DataTable/DataTable.module.scss';
import styles from './page.module.scss';

// Define tab types
type UnassignedTab = 'all' | 'new' | 'sales' | 'support' | 'scheduling';
type AssignedTab = 'all_my' | 'my_sales' | 'my_scheduled' | 'my_support' | 'closed';

interface Announcement {
  id: string;
  title: string;
  content: string;
  published_at: string;
  published_by: string;
}

type DashboardItem =
  | (Ticket & { _type: 'ticket'; _typeSortLabel?: string })
  | (Lead & { _type: 'lead'; _typeSortLabel?: string })
  | (SupportCase & { _type: 'support_case'; _typeSortLabel?: string });

const DASHBOARD_OVERVIEW_COLUMN_WIDTHS = '120px 180px 140px 250px 120px 1fr';
const TICKETS_PAGE_SIZE = 25;

const formatTimeInQueue = (createdAt: string): string => {
  const now = new Date().getTime();
  const created = new Date(createdAt).getTime();
  const diffMs = now - created;

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 60) {
    return `${diffMinutes}m`;
  } else if (diffHours < 24) {
    const remainingMinutes = diffMinutes % 60;
    return `${diffHours}h ${remainingMinutes}m`;
  }
  return `${diffDays}d`;
};

const normalizeAddressPart = (part?: string | null): string | null => {
  if (!part) return null;
  const trimmed = part.trim();
  if (!trimmed || trimmed.toLowerCase() === 'none') return null;
  return trimmed;
};

const formatAddressFromLocation = (location?: {
  address?: string | null;
  street_address?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
}): string => {
  if (!location) return 'Unknown';

  const cityStateParts = [location.city, location.state, location.zip_code]
    .map(normalizeAddressPart)
    .filter((part): part is string => Boolean(part));

  if (cityStateParts.length > 0) {
    return cityStateParts.join(', ');
  }

  const street = normalizeAddressPart(location.street_address ?? location.address);
  return street || 'Unknown';
};

const getDashboardItemAddress = (item: DashboardItem): string => {
  if (item._type === 'ticket') {
    return formatAddressFromLocation(
      item.service_address ?? item.customer?.primary_service_address ?? item.customer
    );
  }
  if (item._type === 'lead') {
    return formatAddressFromLocation(item.primary_service_address ?? item.customer);
  }
  return formatAddressFromLocation(item.primary_service_address ?? item.customer);
};

const getDashboardItemTypeLabel = (item: DashboardItem): string => {
  if (item._type === 'support_case') return 'Support';
  if (item._type === 'lead') {
    return item.lead_status === 'scheduling' ? 'Scheduling' : 'Sales';
  }
  return 'New';
};

// Search filter helper - searches all string values in an object recursively
const filterBySearch = <T extends object>(items: T[], query: string): T[] => {
  if (!query.trim()) return items;
  const lowerQuery = query.toLowerCase();

  const searchInObject = (obj: unknown): boolean => {
    if (obj === null || obj === undefined) return false;
    if (Array.isArray(obj)) return obj.some(item => searchInObject(item));
    if (typeof obj === 'object') {
      return Object.values(obj as Record<string, unknown>).some(value => searchInObject(value));
    }
    return String(obj).toLowerCase().includes(lowerQuery);
  };

  return items.filter(item => searchInObject(item));
};

const DashboardSkeleton = () => (
  <div style={{ padding: '24px' }}>
    <div
      style={{
        background: '#f3f4f6',
        height: '48px',
        borderRadius: '8px',
        marginBottom: '12px',
      }}
    />
    {[...Array(5)].map((_, idx) => (
      <div
        key={idx}
        style={{
          background: '#f9fafb',
          borderRadius: '10px',
          height: '72px',
          marginBottom: '10px',
          border: '1px solid #e5e7eb',
        }}
      />
    ))}
  </div>
);

function TicketsDashboardContent() {
  const router = useRouter();
  const { profile } = useUser();
  const { setPageHeader, registerPageAction, unregisterPageAction } = usePageActions();
  const { selectedCompany, isLoading: companyLoading } = useCompany();
  const { user } = useUser();
  const { newItemIndicators } = useRealtimeCounts();

  // State for different data types
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [supportCases, setSupportCases] = useState<SupportCase[]>([]);
  const [myLeads, setMyLeads] = useState<Lead[]>([]);
  const [mySupportCases, setMySupportCases] = useState<SupportCase[]>([]);
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [myActions, setMyActions] = useState<Task[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [reviewStatuses, setReviewStatuses] = useState<
    Map<
      string,
      {
        reviewedBy: string;
        reviewedByName?: string;
        reviewedByEmail?: string;
        reviewedByFirstName?: string;
        reviewedByLastName?: string;
        reviewedByAvatarUrl?: string | null;
        expiresAt: string;
      }
    >
  >(new Map());

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [loadingSupportCases, setLoadingSupportCases] = useState(false);
  const [loadingMyData, setLoadingMyData] = useState(false);

  // Tab states
  const [unassignedTab, setUnassignedTab] = useState<UnassignedTab>('all');
  const [assignedTab, setAssignedTab] = useState<AssignedTab>('all_my');

  // Search states
  const [unassignedSearch, setUnassignedSearch] = useState('');
  const [assignedSearch, setAssignedSearch] = useState('');
  const [unassignedVisibleCount, setUnassignedVisibleCount] = useState(5);
  const [ticketsHasMore, setTicketsHasMore] = useState(false);
  const [loadingTicketsMore, setLoadingTicketsMore] = useState(false);
  const ticketsPageRef = useRef(1);

  // Announcements modal state
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);

  // Create ticket modal state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<TicketFormData | null>(null);

  // Get assignable users for the company
  const { users: assignableUsers } = useAssignableUsers({
    companyId: selectedCompany?.id,
    departmentType: 'all',
  });

  useEffect(() => {
    setUnassignedVisibleCount(5);
  }, [unassignedTab]);

  // Modal state for ticket review
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isQualifying, setIsQualifying] = useState(false);

  // Ref to track subscription state
  const subscriptionActiveRef = useRef(false);
  const currentChannelRef = useRef<ReturnType<typeof createTicketChannel> | null>(null);
  const isFetchingRef = useRef(false);
  const reviewChannelRef = useRef<RealtimeChannel | null>(null);

  // Company ref for realtime updates
  const selectedCompanyRef = useRef(selectedCompany);
  useEffect(() => {
    selectedCompanyRef.current = selectedCompany;
  }, [selectedCompany]);

  // Register the 'add' action for the header button
  useEffect(() => {
    registerPageAction('add', () => {
      setShowCreateForm(true);
    });

    return () => {
      unregisterPageAction('add');
    };
  }, [registerPageAction, unregisterPageAction]);

  // Set dynamic page header with user's name
  useEffect(() => {
    const firstName = profile?.first_name || 'Your';
    setPageHeader({
      title: `${firstName}'s Ticket Dashboard`,
      description: '',
    });

    return () => {
      setPageHeader(null);
    };
  }, [profile?.first_name, setPageHeader]);

  // Load initial review statuses and subscribe to updates
  useEffect(() => {
    // Merge ticket data with existing review statuses instead of replacing
    // This preserves profile data from realtime broadcasts which may be more complete
    setReviewStatuses(prev => {
      const updated = new Map(prev);

      tickets.forEach(ticket => {
        if (
          ticket.reviewed_by &&
          ticket.review_expires_at &&
          new Date(ticket.review_expires_at) > new Date()
        ) {
          const existing = updated.get(ticket.id);
          const ticketProfileData = {
            reviewedBy: ticket.reviewed_by,
            reviewedByName: ticket.reviewed_by_profile
              ? `${ticket.reviewed_by_profile.first_name || ''} ${ticket.reviewed_by_profile.last_name || ''}`.trim()
              : undefined,
            reviewedByEmail: ticket.reviewed_by_profile?.email,
            reviewedByFirstName: ticket.reviewed_by_profile?.first_name,
            reviewedByLastName: ticket.reviewed_by_profile?.last_name,
            reviewedByAvatarUrl: ticket.reviewed_by_profile?.avatar_url,
            expiresAt: ticket.review_expires_at,
          };

          // If existing data has more complete profile info, merge it
          // Prioritize broadcast data (existing) over ticket data for profile fields
          if (existing && existing.reviewedBy === ticket.reviewed_by) {
            updated.set(ticket.id, {
              ...ticketProfileData,
              // Use existing profile data if ticket data is missing it
              reviewedByName: ticketProfileData.reviewedByName || existing.reviewedByName,
              reviewedByEmail: ticketProfileData.reviewedByEmail || existing.reviewedByEmail,
              reviewedByFirstName: ticketProfileData.reviewedByFirstName || existing.reviewedByFirstName,
              reviewedByLastName: ticketProfileData.reviewedByLastName || existing.reviewedByLastName,
              reviewedByAvatarUrl: ticketProfileData.reviewedByAvatarUrl ?? existing.reviewedByAvatarUrl,
              // Always use the latest expiry time
              expiresAt: ticket.review_expires_at,
            });
          } else {
            updated.set(ticket.id, ticketProfileData);
          }
        } else if (ticket.reviewed_by === null || !ticket.review_expires_at) {
          // Ticket is no longer being reviewed, remove from map
          updated.delete(ticket.id);
        }
      });

      return updated;
    });

    if (!reviewChannelRef.current) {
      const channel = createTicketReviewChannel();
      reviewChannelRef.current = channel;

      subscribeToTicketReviewUpdates(channel, (payload: TicketReviewPayload) => {
        setReviewStatuses(prev => {
          const updated = new Map(prev);

          if (payload.reviewed_by && payload.review_expires_at) {
            updated.set(payload.ticket_id, {
              reviewedBy: payload.reviewed_by,
              reviewedByName: payload.reviewed_by_name,
              reviewedByEmail: payload.reviewed_by_email,
              reviewedByFirstName: payload.reviewed_by_first_name,
              reviewedByLastName: payload.reviewed_by_last_name,
              reviewedByAvatarUrl: payload.reviewed_by_avatar_url,
              expiresAt: payload.review_expires_at,
            });
          } else {
            updated.delete(payload.ticket_id);
          }

          return updated;
        });
      });
    }
  }, [tickets]);

  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      setReviewStatuses(prev => {
        const updated = new Map(prev);
        const now = Date.now();
        let hasChanges = false;

        updated.forEach((status, ticketId) => {
          if (new Date(status.expiresAt).getTime() < now) {
            updated.delete(ticketId);
            hasChanges = true;
          }
        });

        return hasChanges ? updated : prev;
      });
    }, 30000);

    return () => clearInterval(cleanupInterval);
  }, []);

  // Fetch unassigned tickets AND live tickets (for LiveCallBar)
  const fetchTickets = useCallback(async (
    companyId: string,
    options?: { showLoading?: boolean; page?: number; append?: boolean }
  ) => {
    if (!companyId) return;
    if (isFetchingRef.current) return;

    const showLoading = options?.showLoading ?? true;
    const page = options?.page ?? 1;
    const append = options?.append ?? false;
    isFetchingRef.current = true;
    if (showLoading) {
      setLoading(true);
    }
    if (append) {
      setLoadingTicketsMore(true);
    }

    try {
      const supabase = createClient();

      // Fetch both regular tickets (via API) and live tickets (directly) in parallel
      const [regularResponse, liveResult] = await Promise.all([
        // Regular tickets for the list via API (oldest first)
        fetch(`/api/tickets?${new URLSearchParams({
          companyId,
          includeArchived: 'false',
          page: page.toString(),
          limit: TICKETS_PAGE_SIZE.toString(),
          sortBy: 'created_at',
          sortOrder: 'asc',
        })}`),
        // Live tickets directly from Supabase (API excludes live status)
        supabase
          .from('tickets')
          .select(`
            *,
            customer:customers!tickets_customer_id_fkey(
              id, first_name, last_name, email, phone, address, city, state, zip_code
            ),
            service_address:service_addresses!left(
              id, street_address, city, state, zip_code
            ),
            call_records:call_records!call_records_ticket_id_fkey(
              id, call_id, call_status, start_timestamp, end_timestamp,
              duration_seconds, phone_number, from_number
            )
          `)
          .eq('company_id', companyId)
          .eq('status', 'live')
          .order('created_at', { ascending: true })
          .limit(50),
      ]);

      if (!regularResponse.ok) {
        throw new Error('Failed to fetch tickets');
      }

      const regularData = await regularResponse.json();
      const regularTickets = regularData.tickets || [];
      const liveTickets = !liveResult.error && liveResult.data ? liveResult.data : [];

      setTickets(prev => {
        const previousRegular = append
          ? prev.filter(ticket => ticket.status !== 'live')
          : [];
        const mergedTickets = new Map<string, Ticket>();
        previousRegular.forEach(ticket => mergedTickets.set(ticket.id, ticket));
        regularTickets.forEach((ticket: Ticket) =>
          mergedTickets.set(ticket.id, ticket)
        );
        const mergedRegular = Array.from(mergedTickets.values()).sort(
          (a, b) =>
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );
        const uniqueLiveTickets = Array.from(
          new Map(liveTickets.map((ticket: Ticket) => [ticket.id, ticket]))
            .values()
        );

        return [...uniqueLiveTickets, ...mergedRegular];
      });
      ticketsPageRef.current = page;
      setTicketsHasMore(regularData.pagination?.hasMore ?? false);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      isFetchingRef.current = false;
      if (showLoading) {
        setLoading(false);
      }
      if (append) {
        setLoadingTicketsMore(false);
      }
    }
  }, []);

  // Fetch unassigned leads (sales + scheduling) - oldest first
  const fetchLeads = useCallback(async (companyId: string) => {
    if (!companyId) return;

    setLoadingLeads(true);
    try {
      const response = await fetch(
        `/api/leads?companyId=${companyId}&unassigned=true&status=new,in_process,quoted,scheduling&limit=50&sortBy=created_at&sortOrder=asc`
      );
      if (!response.ok) throw new Error('Failed to fetch leads');
      const data = await response.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoadingLeads(false);
    }
  }, []);

  // Fetch unassigned support cases - oldest first
  const fetchSupportCases = useCallback(async (companyId: string) => {
    if (!companyId) return;

    setLoadingSupportCases(true);
    try {
      const response = await fetch(
        `/api/support-cases?companyId=${companyId}&unassigned=true&includeArchived=false&sortBy=created_at&sortOrder=asc`
      );
      if (!response.ok) throw new Error('Failed to fetch support cases');
      const data = await response.json();
      setSupportCases(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching support cases:', error);
    } finally {
      setLoadingSupportCases(false);
    }
  }, []);

  // Fetch user&apos;s assigned data - oldest first
  const fetchMyData = useCallback(async (companyId: string, userId: string) => {
    if (!companyId || !userId) return;

    setLoadingMyData(true);
    try {
      const [leadsRes, casesRes, tasksRes] = await Promise.all([
        fetch(`/api/leads?companyId=${companyId}&assignedTo=${userId}&status=in_process,quoted,scheduling&sortBy=created_at&sortOrder=asc`),
        fetch(`/api/support-cases?companyId=${companyId}&assignedTo=${userId}&includeArchived=false&sortBy=created_at&sortOrder=asc`),
        fetch(`/api/tasks?companyId=${companyId}&assignedTo=${userId}&includeArchived=false&sortBy=created_at&sortOrder=asc`),
      ]);

      if (leadsRes.ok) {
        const data = await leadsRes.json();
        setMyLeads(Array.isArray(data) ? data : []);
      }

      if (casesRes.ok) {
        const data = await casesRes.json();
        setMySupportCases(Array.isArray(data) ? data : []);
      }

      if (tasksRes.ok) {
        const data = await tasksRes.json();
        const allTasks = data.tasks || [];
        // Separate actions (tasks with cadence_step_id) from regular tasks
        const actions = allTasks.filter((t: Task) => t.cadence_step_id && t.status !== 'completed');
        const tasks = allTasks.filter((t: Task) => !t.cadence_step_id && t.status !== 'completed');
        setMyActions(actions);
        setMyTasks(tasks);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoadingMyData(false);
    }
  }, []);

  // Fetch announcements
  const fetchAnnouncements = useCallback(async (companyId: string) => {
    if (!companyId) return;

    try {
      const response = await fetch(`/api/companies/${companyId}/announcements`);
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (selectedCompany?.id) {
      fetchTickets(selectedCompany.id);
      fetchLeads(selectedCompany.id);
      fetchSupportCases(selectedCompany.id);
      fetchAnnouncements(selectedCompany.id);

      if (user?.id) {
        fetchMyData(selectedCompany.id, user.id);
      }
    }
  }, [selectedCompany?.id, user?.id, fetchTickets, fetchLeads, fetchSupportCases, fetchMyData, fetchAnnouncements]);

  // Realtime subscription
  useEffect(() => {
    if (!selectedCompany?.id) return;

    if (subscriptionActiveRef.current && currentChannelRef.current) {
      return;
    }

    const channel = createTicketChannel(selectedCompany.id);
    currentChannelRef.current = channel;

    subscribeToTicketUpdates(channel, async (payload: TicketUpdatePayload) => {
      const { table, company_id, action, record_id, ticket_id } = payload;

      const currentCompany = selectedCompanyRef.current;
      if (company_id && currentCompany?.id && company_id !== currentCompany.id) {
        return;
      }

      if (isFetchingRef.current) {
        return;
      }

      const currentCompanyId = selectedCompanyRef.current?.id;
      if (!currentCompanyId) return;

      if (table === 'tickets') {
        const supabase = createClient();

        if (action === 'INSERT' && record_id) {
          // Fetch the new ticket with full joins and prepend to list
          try {
            const { data: fullTicket, error } = await supabase
              .from('tickets')
              .select(`
                *,
                customer:customers!tickets_customer_id_fkey(
                  id, first_name, last_name, email, phone, address, city, state, zip_code
                ),
                service_address:service_addresses!left(
                  id, street_address, city, state, zip_code
                ),
                call_records:call_records!call_records_ticket_id_fkey(
                  id, call_id, call_status, start_timestamp, end_timestamp,
                  duration_seconds, phone_number, from_number
                ),
                reviewed_by_profile:profiles!reviewed_by(
                  id, first_name, last_name, email, avatar_url
                )
              `)
              .eq('id', record_id)
              .single();

            if (!error && fullTicket && fullTicket.status !== 'closed') {
              setTickets(prev => {
                const exists = prev.some(t => t.id === fullTicket.id);
                if (!exists) {
                  const liveTickets = prev.filter(ticket => ticket.status === 'live');
                  const regularTickets = prev.filter(ticket => ticket.status !== 'live');
                  const updatedRegularTickets = [...regularTickets, fullTicket].sort(
                    (a, b) =>
                      new Date(a.created_at).getTime() -
                      new Date(b.created_at).getTime()
                  );
                  return [...liveTickets, ...updatedRegularTickets];
                }
                return prev;
              });
            }
          } catch (err) {
            console.error('Error fetching new ticket for realtime:', err);
          }
        } else if (action === 'UPDATE' && record_id) {
          // Fetch updated ticket data
          try {
            const { data: updatedTicket, error } = await supabase
              .from('tickets')
              .select(`
                *,
                customer:customers!tickets_customer_id_fkey(
                  id, first_name, last_name, email, phone, address, city, state, zip_code
                ),
                service_address:service_addresses!left(
                  id, street_address, city, state, zip_code
                ),
                call_records:call_records!call_records_ticket_id_fkey(
                  id, call_id, call_status, start_timestamp, end_timestamp,
                  duration_seconds, phone_number, from_number
                ),
                reviewed_by_profile:profiles!reviewed_by(
                  id, first_name, last_name, email, avatar_url
                )
              `)
              .eq('id', record_id)
              .single();

            if (!error && updatedTicket) {
              // If ticket becomes archived, resolved, closed, or live, remove from list
              if (
                updatedTicket.archived === true ||
                updatedTicket.status === 'resolved' ||
                updatedTicket.status === 'closed'
              ) {
                setTickets(prev => prev.filter(t => t.id !== record_id));
              } else {
                // Update existing ticket or add if not present
                setTickets(prev => {
                  const exists = prev.some(t => t.id === updatedTicket.id);
                  if (exists) {
                    return prev.map(t => t.id === updatedTicket.id ? updatedTicket : t);
                  }
                  const liveTickets = prev.filter(ticket => ticket.status === 'live');
                  const regularTickets = prev.filter(ticket => ticket.status !== 'live');
                  const updatedRegularTickets = [...regularTickets, updatedTicket].sort(
                    (a, b) =>
                      new Date(a.created_at).getTime() -
                      new Date(b.created_at).getTime()
                  );
                  return [...liveTickets, ...updatedRegularTickets];
                });
              }
            }
          } catch (err) {
            console.error('Error updating ticket for realtime:', err);
          }
        } else if (action === 'DELETE' && record_id) {
          setTickets(prev => prev.filter(t => t.id !== record_id));
        } else {
          // Fallback: refetch for unknown actions
          fetchTickets(currentCompanyId, { showLoading: false });
        }
      } else if (table === 'call_records') {
        // For call records, update the parent ticket
        if (ticket_id) {
          try {
            const supabase = createClient();
            const { data: updatedTicket, error } = await supabase
              .from('tickets')
              .select(`
                *,
                customer:customers!tickets_customer_id_fkey(
                  id, first_name, last_name, email, phone, address, city, state, zip_code
                ),
                service_address:service_addresses!left(
                  id, street_address, city, state, zip_code
                ),
                call_records:call_records!call_records_ticket_id_fkey(
                  id, call_id, call_status, start_timestamp, end_timestamp,
                  duration_seconds, phone_number, from_number
                ),
                reviewed_by_profile:profiles!reviewed_by(
                  id, first_name, last_name, email, avatar_url
                )
              `)
              .eq('id', ticket_id)
              .single();

            if (!error && updatedTicket) {
              setTickets(prev => prev.map(t => t.id === ticket_id ? updatedTicket : t));
            }
          } catch (err) {
            console.error('Error updating ticket with call record:', err);
          }
        } else {
          fetchTickets(currentCompanyId, { showLoading: false });
        }
      } else if (table === 'leads') {
        fetchLeads(currentCompanyId);
      } else if (table === 'support_cases') {
        fetchSupportCases(currentCompanyId);
      }
    });

    subscriptionActiveRef.current = true;

    return () => {
      subscriptionActiveRef.current = false;
      if (currentChannelRef.current) {
        createClient().removeChannel(currentChannelRef.current);
        currentChannelRef.current = null;
      }
    };
  }, [selectedCompany?.id, fetchTickets, fetchLeads, fetchSupportCases]);

  // Filter live tickets for LiveCallBar
  const liveTickets = useMemo(
    () => tickets.filter(ticket => ticket.status === 'live'),
    [tickets]
  );

  // Handle create ticket
  const handleCreateTicket = useCallback(
    async (ticketFormData: TicketFormData & { newCustomerData?: any }) => {
      if (!selectedCompany?.id) return;

      setSubmitting(true);
      try {
        let customerId = ticketFormData.customer_id;

        // If creating a new customer, create customer first
        if (ticketFormData.newCustomerData && !customerId) {
          const customerResponse = await fetch('/api/customers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...ticketFormData.newCustomerData,
              company_id: selectedCompany.id,
            }),
          });

          if (customerResponse.ok) {
            const newCustomer = await customerResponse.json();
            customerId = newCustomer.id;
          } else {
            const errorData = await customerResponse.json().catch(() => ({}));
            throw new Error(errorData.error || 'Failed to create customer');
          }
        }

        // Create the ticket data, filtering out undefined values and non-API fields
        const { newCustomerData, ...cleanFormData } = ticketFormData;

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
          setShowCreateForm(false);
          setFormData(null);
          // Refresh tickets list
          if (selectedCompany?.id) {
            fetchTickets(selectedCompany.id);
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
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
    [selectedCompany, fetchTickets]
  );

  const handleCancelForm = useCallback(() => {
    setShowCreateForm(false);
    setFormData(null);
  }, []);

  // Handle ticket action (review)
  const handleTicketAction = useCallback((action: string, ticket: Ticket) => {
    if (action === 'qualify') {
      setSelectedTicket(ticket);
      setShowTicketModal(true);
    }
  }, []);

  // Handle lead action
  const handleLeadAction = useCallback((action: string, lead: Lead) => {
    if (action === 'edit' || action === 'view') {
      router.push(`/tickets/leads/${lead.id}`);
    }
  }, [router]);

  // Handle support case action
  const handleSupportCaseAction = useCallback((action: string, supportCase: SupportCase) => {
    if (action === 'view') {
      router.push(`/tickets/customer-service/${supportCase.id}`);
    }
  }, [router]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setShowTicketModal(false);
    setSelectedTicket(null);
  }, []);

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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qualification, assignedTo }),
          }
        );

        if (!response.ok) throw new Error('Failed to qualify ticket');

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
    [selectedTicket, selectedCompany, fetchTickets, handleModalClose]
  );

  // Navigate to tasks page
  const handleActionsClick = useCallback(() => {
    router.push('/tickets/tasks?filter=actions');
  }, [router]);

  const handleTasksClick = useCallback(() => {
    router.push('/tickets/tasks');
  }, [router]);

  // Get columns
  const ticketColumns = useMemo(() => getTicketColumns(reviewStatuses), [reviewStatuses]);
  const leadColumns = useMemo(() => getLeadColumns(), []);
  const supportCaseColumns = useMemo(() => getSupportCaseColumns(), []);
  const unassignedTabCounts = useMemo(
    () => ({
      all:
        tickets.filter(ticket => ticket.status !== 'live').length +
        leads.length +
        supportCases.length,
      new: tickets.filter(ticket => ticket.status !== 'live').length,
      sales: leads.filter(l => l.lead_status !== 'scheduling').length,
      support: supportCases.length,
      scheduling: leads.filter(l => l.lead_status === 'scheduling').length,
    }),
    [tickets, leads, supportCases]
  );
  const assignedTabCounts = useMemo(
    () => ({
      all_my: myLeads.length + mySupportCases.length,
      my_sales: myLeads.filter(l => ['in_process', 'quoted'].includes(l.lead_status)).length,
      my_scheduled: myLeads.filter(l => l.lead_status === 'scheduling').length,
      my_support: mySupportCases.length,
      closed:
        myLeads.filter(l => ['won', 'lost'].includes(l.lead_status)).length +
        mySupportCases.filter(c => ['resolved', 'closed'].includes(c.status)).length,
    }),
    [myLeads, mySupportCases]
  );
  const dashboardOverviewColumns = useMemo<ColumnDefinition<DashboardItem>[]>(
    () => [
      {
        key: 'created_at',
        title: 'In Queue',
        width: '120px',
        sortable: true,
        sortKey: 'created_at',
        render: (item: DashboardItem) => (
          <span className={tableStyles.timeCell}>
            {formatTimeInQueue(item.created_at)}
          </span>
        ),
      },
      {
        key: 'customer.name',
        title: 'Name',
        width: '180px',
        sortable: false,
        render: (item: DashboardItem) => (
          <span className={tableStyles.nameCell}>
            {getCustomerDisplayName(item.customer)}
          </span>
        ),
      },
      {
        key: 'customer.phone',
        title: 'Phone',
        width: '140px',
        sortable: false,
        render: (item: DashboardItem) => (
          <span className={tableStyles.phoneCell}>
            {getPhoneDisplay(item.customer?.phone)}
          </span>
        ),
      },
      {
        key: 'customer.address',
        title: 'Address',
        width: '250px',
        sortable: false,
        render: (item: DashboardItem) => (
          <span className={tableStyles.addressCell}>
            {getDashboardItemAddress(item)}
          </span>
        ),
      },
      {
        key: 'type',
        title: 'Type',
        width: '120px',
        sortable: true,
        sortKey: '_typeSortLabel',
        render: (item: DashboardItem) => (
          <span className={tableStyles.formatCell}>
            {getDashboardItemTypeLabel(item)}
          </span>
        ),
      },
      {
        key: 'actions',
        title: '',
        width: '140px',
        sortable: false,
        render: (
          item: DashboardItem,
          onAction?: (action: string, item: DashboardItem) => void
        ) => {
          if (item._type === 'ticket') {
            const reviewStatus = reviewStatuses.get(item.id);
            const isBeingReviewed =
              reviewStatus &&
              Date.now() < new Date(reviewStatus.expiresAt).getTime();

            if (isBeingReviewed && reviewStatus) {
              return (
                <div className={tableStyles.reviewingStatus}>
                  <span className={tableStyles.reviewingText}>Reviewing</span>
                  <MiniAvatar
                    firstName={reviewStatus.reviewedByFirstName}
                    lastName={reviewStatus.reviewedByLastName}
                    email={reviewStatus.reviewedByEmail || ''}
                    avatarUrl={reviewStatus.reviewedByAvatarUrl}
                    size="small"
                    showTooltip={true}
                  />
                </div>
              );
            }
          }

          let label = 'View';
          if (item._type === 'ticket') {
            label = 'Review Ticket';
          } else if (item._type === 'lead') {
            label =
              item.lead_status === 'scheduling'
                ? 'Schedule Service'
                : 'Manage Lead';
          } else if (item._type === 'support_case') {
            label = 'View Issue';
          }
          return (
            <button
              className={tableStyles.actionButton}
              onClick={event => {
                event.stopPropagation();
                if (item._type === 'ticket') {
                  onAction?.('qualify', item);
                  return;
                }
                onAction?.('route', item);
              }}
            >
              {label}
              <ChevronRight size={18} />
            </button>
          );
        },
      },
    ],
    [reviewStatuses]
  );

  const handleDashboardItemRoute = useCallback(
    (item: DashboardItem) => {
      if (item._type === 'ticket') {
        router.push(`/tickets/new/${item.id}`);
        return;
      }
      if (item._type === 'lead') {
        router.push(`/tickets/leads/${item.id}`);
        return;
      }
      router.push(`/tickets/customer-service/${item.id}`);
    },
    [router]
  );

  const handleDashboardItemAction = useCallback(
    (action: string, item: DashboardItem) => {
      if (action === 'route') {
        handleDashboardItemRoute(item);
        return;
      }
      if (item._type === 'ticket') {
        const nextAction = action === 'navigate' ? 'qualify' : action;
        handleTicketAction(nextAction, item);
        return;
      }
      if (item._type === 'lead') {
        const nextAction = action === 'navigate' ? 'view' : action;
        handleLeadAction(nextAction, item);
        return;
      }
      const nextAction = action === 'navigate' ? 'view' : action;
      handleSupportCaseAction(nextAction, item);
    },
    [
      handleDashboardItemRoute,
      handleLeadAction,
      handleSupportCaseAction,
      handleTicketAction,
    ]
  );

  // Get current data for unassigned section based on tab
  const getUnassignedData = () => {
    switch (unassignedTab) {
      case 'all': {
        // Sort oldest to newest (ascending by created_at)
        // Add _typeSortLabel for sortable Type column (alphabetically: New < Sales < Scheduling < Support)
        const combinedData = [
          ...tickets
            .filter(ticket => ticket.status !== 'live')
            .map(ticket => ({
            ...ticket,
            _type: 'ticket' as const,
            _typeSortLabel: 'New',
          })),
          ...leads.map(lead => ({
            ...lead,
            _type: 'lead' as const,
            _typeSortLabel: lead.lead_status === 'scheduling' ? 'Scheduling' : 'Sales',
          })),
          ...supportCases.map(supportCase => ({
            ...supportCase,
            _type: 'support_case' as const,
            _typeSortLabel: 'Support',
          })),
        ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        return {
          data: filterBySearch(combinedData, unassignedSearch),
          columns: dashboardOverviewColumns,
          loading: loading || loadingLeads || loadingSupportCases,
          tableType: 'tickets' as const,
          customColumnWidths: DASHBOARD_OVERVIEW_COLUMN_WIDTHS,
        };
      }
      case 'new':
        return {
          data: filterBySearch(
            tickets.filter(ticket => ticket.status !== 'live'),
            unassignedSearch
          ),
          columns: ticketColumns,
          loading,
          tableType: 'tickets' as const,
          customColumnWidths: undefined,
        };
      case 'sales':
        // Show sales leads (exclude scheduling leads)
        return {
          data: filterBySearch(leads.filter(l => l.lead_status !== 'scheduling'), unassignedSearch),
          columns: leadColumns,
          loading: loadingLeads,
          tableType: 'leads' as const,
          customColumnWidths: undefined,
        };
      case 'support':
        return {
          data: filterBySearch(supportCases, unassignedSearch),
          columns: supportCaseColumns,
          loading: loadingSupportCases,
          tableType: 'supportCases' as const,
          customColumnWidths: undefined,
        };
      case 'scheduling':
        // Show only scheduling leads
        return {
          data: filterBySearch(leads.filter(l => l.lead_status === 'scheduling'), unassignedSearch),
          columns: leadColumns,
          loading: loadingLeads,
          tableType: 'leads' as const,
          customColumnWidths: undefined,
        };
      default:
        return {
          data: filterBySearch(
            tickets.filter(ticket => ticket.status !== 'live'),
            unassignedSearch
          ),
          columns: ticketColumns,
          loading,
          tableType: 'tickets' as const,
          customColumnWidths: undefined,
        };
    }
  };

  // Get current data for assigned section based on tab
  const getAssignedData = () => {
    switch (assignedTab) {
      case 'all_my': {
        // Combine leads and support cases, sort oldest to newest
        // Add _typeSortLabel for sortable Type column (alphabetically: New < Sales < Scheduling < Support)
        const combinedData = [
          ...myLeads.map(lead => ({
            ...lead,
            _type: 'lead' as const,
            _typeSortLabel: lead.lead_status === 'scheduling' ? 'Scheduling' : 'Sales',
          })),
          ...mySupportCases.map(supportCase => ({
            ...supportCase,
            _type: 'support_case' as const,
            _typeSortLabel: 'Support',
          })),
        ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        return {
          data: filterBySearch(combinedData, assignedSearch),
          columns: dashboardOverviewColumns,
          loading: loadingMyData,
          tableType: 'leads' as const,
          customColumnWidths: DASHBOARD_OVERVIEW_COLUMN_WIDTHS,
        };
      }
      case 'my_sales':
        return {
          data: filterBySearch(myLeads.filter(l => ['in_process', 'quoted'].includes(l.lead_status)), assignedSearch),
          columns: leadColumns,
          loading: loadingMyData,
          tableType: 'leads' as const,
          customColumnWidths: undefined,
        };
      case 'my_scheduled':
        return {
          data: filterBySearch(myLeads.filter(l => l.lead_status === 'scheduling'), assignedSearch),
          columns: leadColumns,
          loading: loadingMyData,
          tableType: 'leads' as const,
          customColumnWidths: undefined,
        };
      case 'my_support':
        return {
          data: filterBySearch(mySupportCases, assignedSearch),
          columns: supportCaseColumns,
          loading: loadingMyData,
          tableType: 'supportCases' as const,
          customColumnWidths: undefined,
        };
      case 'closed': {
        const closedData = [
          ...myLeads.filter(l => ['won', 'lost'].includes(l.lead_status)),
          ...mySupportCases.filter(c => ['resolved', 'closed'].includes(c.status)),
        ];
        return {
          data: filterBySearch(closedData, assignedSearch),
          columns: leadColumns,
          loading: loadingMyData,
          tableType: 'leads' as const,
          customColumnWidths: undefined,
        };
      }
      default:
        return {
          data: filterBySearch(myLeads, assignedSearch),
          columns: leadColumns,
          loading: loadingMyData,
          tableType: 'leads' as const,
          customColumnWidths: undefined,
        };
    }
  };

  const unassignedContent = getUnassignedData();
  const assignedContent = getAssignedData();
  const unassignedData = (unassignedContent.data || []) as any[];
  const unassignedVisibleData = unassignedData.slice(0, unassignedVisibleCount);
  const canLoadMoreTickets =
    (unassignedTab === 'all' || unassignedTab === 'new') && ticketsHasMore;
  const showUnassignedLoadMore =
    unassignedData.length > unassignedVisibleCount || canLoadMoreTickets;
  const handleUnassignedLoadMore = () => {
    const nextVisibleCount = unassignedVisibleCount + 5;
    setUnassignedVisibleCount(nextVisibleCount);

    if (
      canLoadMoreTickets &&
      selectedCompany?.id &&
      !loadingTicketsMore
    ) {
      fetchTickets(selectedCompany.id, {
        showLoading: false,
        page: ticketsPageRef.current + 1,
        append: true,
      });
    }
  };

  // Check for new items in actions/tasks
  const hasNewActions = newItemIndicators.my_actions || false;
  const hasNewTasks = newItemIndicators.my_tasks || false;

  return (
    <div className={styles.dashboardContainer}>
      {/* Unassigned Tickets Section */}
      <section className={`${styles.section} ${styles.sectionNoGap}`}>
        <h2 className={`${styles.sectionTitle} ${styles.sectionTitleSpaced}`}>Unassigned Tickets</h2>

        {/* Tabs */}
        <div className={styles.tabsRow}>
          <div className={styles.tabsSection}>
            <button
              className={`${styles.tab} ${unassignedTab === 'all' ? styles.active : ''}`}
              onClick={() => setUnassignedTab('all')}
            >
              All Tickets
              <span className={styles.tabCount}>{unassignedTabCounts.all}</span>
            </button>
            <button
              className={`${styles.tab} ${unassignedTab === 'new' ? styles.active : ''}`}
              onClick={() => setUnassignedTab('new')}
            >
              New
              <span className={styles.tabCount}>{unassignedTabCounts.new}</span>
            </button>
            <button
              className={`${styles.tab} ${unassignedTab === 'sales' ? styles.active : ''}`}
              onClick={() => setUnassignedTab('sales')}
            >
              Sales
              <span className={styles.tabCount}>{unassignedTabCounts.sales}</span>
            </button>
            <button
              className={`${styles.tab} ${unassignedTab === 'support' ? styles.active : ''}`}
              onClick={() => setUnassignedTab('support')}
            >
              Support
              <span className={styles.tabCount}>{unassignedTabCounts.support}</span>
            </button>
            <button
              className={`${styles.tab} ${unassignedTab === 'scheduling' ? styles.active : ''}`}
              onClick={() => setUnassignedTab('scheduling')}
            >
              Scheduling
              <span className={styles.tabCount}>{unassignedTabCounts.scheduling}</span>
            </button>
          </div>
          <div className={styles.searchSection}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search"
              value={unassignedSearch}
              onChange={e => setUnassignedSearch(e.target.value)}
            />
            <Search size={18} className={styles.searchIcon} />
          </div>
        </div>

        {/* Live Calls Bar */}
        <LiveCallBar liveTickets={liveTickets} />

        {/* Data Table */}
        {selectedCompany && (
          <Suspense fallback={<DashboardSkeleton />}>
            <DataTable
              key={`unassigned-${unassignedTab}`}
              data={unassignedVisibleData as any[]}
              loading={unassignedContent.loading}
              title="Unassigned"
              columns={unassignedContent.columns as any}
              tabs={[]}
              onItemAction={
                (unassignedTab === 'all'
                  ? handleDashboardItemAction
                  : unassignedTab === 'sales' || unassignedTab === 'scheduling'
                  ? handleLeadAction
                  : unassignedTab === 'support'
                  ? handleSupportCaseAction
                  : handleTicketAction) as any
              }
              tableType={unassignedContent.tableType}
              customColumnWidths={unassignedContent.customColumnWidths}
              searchEnabled={false}
              emptyStateMessage="No unassigned items at the moment."
            />
          </Suspense>
        )}
        {selectedCompany && showUnassignedLoadMore && (
          <div className={styles.loadMoreWrapper}>
            <button
              type="button"
              className={styles.loadMoreButton}
              onClick={handleUnassignedLoadMore}
              disabled={loadingTicketsMore}
            >
              Load more
            </button>
          </div>
        )}

      </section>

      {/* Your Action & Tasks Section */}
      <section className={`${styles.section} ${styles.sectionNoGap}`}>
        <div className={styles.actionsTasksRow}>
          {/* Left Column: Your Action & Tasks */}
          <div className={styles.actionsTasksLeftColumn}>
            <h2 className={`${styles.sectionTitle} ${styles.sectionTitleSpaced}`}>Your Actions &amp; Tasks</h2>
            <div className={styles.actionsTasksBoxes}>
              {/* My Actions Box */}
              <button className={styles.actionBox} onClick={handleActionsClick}>
              <div className={styles.boxHeader}>
                <span className={styles.boxTitle}>My Actions</span>
                {loadingMyData ? (
                  <span className={styles.badge}>
                    <Loader2 size={14} className={styles.spinner} />
                  </span>
                ) : (
                  <span className={`${styles.badge} ${hasNewActions ? styles.badgeNew : ''}`}>
                    {myActions.length}
                  </span>
                )}
              </div>
              <p className={styles.boxDescription}>
                Actions are part of any assigned cadence for sales, support or scheduling.
              </p>
            </button>

            {/* My Tasks Box */}
            <button className={styles.taskBox} onClick={handleTasksClick}>
              <div className={styles.boxHeader}>
                <span className={styles.boxTitle}>My Tasks</span>
                {loadingMyData ? (
                  <span className={styles.badge}>
                    <Loader2 size={14} className={styles.spinner} />
                  </span>
                ) : (
                  <span className={`${styles.badge} ${hasNewTasks ? styles.badgeNew : ''}`}>
                    {myTasks.length}
                  </span>
                )}
              </div>
              <p className={styles.boxDescription}>
                Tasks that are personally assigned within a given customer account or personal task.
              </p>
            </button>
            </div>
          </div>

          {/* Right Column: Important Announcements */}
          <div className={styles.announcementsSection}>
            <h2 className={`${styles.announcementsTitle} ${styles.sectionTitleSpaced}`}>Important Announcements</h2>
            {announcements.length === 0 ? (
              <p className={styles.boxDescription}>No announcements at this time.</p>
            ) : (
              <>
                <div className={styles.announcementsList}>
                  {[...announcements]
                    .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
                    .slice(0, 1)
                    .map((ann) => (
                      <div key={ann.id} className={styles.announcementItem}>
                        <strong>{ann.title}</strong>
                        <p>{ann.content}</p>
                      </div>
                    ))}
                </div>
                {announcements.length > 1 && (
                  <button
                    className={styles.expandButton}
                    onClick={() => setShowAnnouncementsModal(true)}
                  >
                    + Expand To See More ({announcements.length - 1})
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Your Assigned Tickets Section */}
      <section className={`${styles.section} ${styles.sectionNoGap}`}>
        <h2 className={`${styles.sectionTitle} ${styles.sectionTitleSpaced}`}>Your Assigned Tickets</h2>

        {/* Tabs */}
        <div className={styles.tabsContainer}>
          <div className={styles.tabsWrapper}>
            <button
              className={`${styles.tab} ${assignedTab === 'all_my' ? styles.active : ''}`}
              onClick={() => setAssignedTab('all_my')}
            >
              All My Tickets
              <span className={styles.tabCount}>{assignedTabCounts.all_my}</span>
            </button>
            <button
              className={`${styles.tab} ${assignedTab === 'my_sales' ? styles.active : ''}`}
              onClick={() => setAssignedTab('my_sales')}
            >
              My Sales Tickets
              <span className={styles.tabCount}>{assignedTabCounts.my_sales}</span>
            </button>
            <button
              className={`${styles.tab} ${assignedTab === 'my_scheduled' ? styles.active : ''}`}
              onClick={() => setAssignedTab('my_scheduled')}
            >
              My Scheduled Tickets
              <span className={styles.tabCount}>{assignedTabCounts.my_scheduled}</span>
            </button>
            <button
              className={`${styles.tab} ${assignedTab === 'my_support' ? styles.active : ''}`}
              onClick={() => setAssignedTab('my_support')}
            >
              My Support Tickets
              <span className={styles.tabCount}>{assignedTabCounts.my_support}</span>
            </button>
            <button
              className={`${styles.tab} ${assignedTab === 'closed' ? styles.active : ''}`}
              onClick={() => setAssignedTab('closed')}
            >
              Closed
              <span className={styles.tabCount}>{assignedTabCounts.closed}</span>
            </button>
          </div>
          <div className={styles.searchSection}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search"
              value={assignedSearch}
              onChange={e => setAssignedSearch(e.target.value)}
            />
            <Search size={18} className={styles.searchIcon} />
          </div>
        </div>

        {/* Data Table */}
        {selectedCompany && user && (
          <Suspense fallback={<DashboardSkeleton />}>
            <DataTable
              key={`assigned-${assignedTab}`}
              data={assignedContent.data as any[]}
              loading={assignedContent.loading}
              title="Your Tickets"
              columns={assignedContent.columns as any}
              tabs={[]}
              onItemAction={
                (assignedTab === 'all_my'
                  ? handleDashboardItemAction
                  : assignedTab === 'my_support'
                  ? handleSupportCaseAction
                  : handleLeadAction) as any
              }
              tableType={assignedContent.tableType}
              customColumnWidths={assignedContent.customColumnWidths}
              searchEnabled={false}
              emptyStateMessage="No assigned items in this category."
            />
          </Suspense>
        )}
      </section>

      {/* Loading state */}
      {companyLoading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <DashboardSkeleton />
        </div>
      )}

      {!selectedCompany && !companyLoading && (
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

      {/* Announcements Modal */}
      <AnnouncementsModal
        isOpen={showAnnouncementsModal}
        onClose={() => setShowAnnouncementsModal(false)}
        announcements={announcements}
      />

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

export default function TicketsDashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TicketsDashboardContent />
    </Suspense>
  );
}
