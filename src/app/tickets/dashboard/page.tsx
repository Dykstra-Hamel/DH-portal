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
import Image from 'next/image';
import {
  Ticket,
  TicketFormData,
  ticketSourceOptions,
  ticketTypeOptions,
} from '@/types/ticket';
import { Lead, leadSourceOptions, leadTypeOptions } from '@/types/lead';
import { SupportCase, supportCaseIssueTypeOptions } from '@/types/support-case';
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
import {
  createTaskChannel,
  subscribeToTaskUpdates,
  TaskUpdatePayload,
} from '@/lib/realtime/task-channel';
import { DataTable, ColumnDefinition } from '@/components/Common/DataTable';
import { TicketReviewModal } from '@/components/Tickets/TicketReviewModal';
import {
  Modal,
  ModalTop,
  ModalMiddle,
  ModalBottom,
} from '@/components/Common/Modal/Modal';
import ModalActionButtons from '@/components/Common/Modal/ModalActionButtons';
import TicketForm from '@/components/Tickets/TicketForm/TicketForm';
import QuickQuoteModal from '@/components/QuickQuote/QuickQuoteModal';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import { AnnouncementsModal } from '@/components/Common/AnnouncementsModal/AnnouncementsModal';
import ActionsTasksQuickView from '@/components/Common/ActionsTasksQuickView/ActionsTasksQuickView';
import { MiniAvatar } from '@/components/Common/MiniAvatar';
import { getCustomerDisplayName, getPhoneDisplay } from '@/lib/display-utils';
import { ChevronRight, Search, Loader2, Truck } from 'lucide-react';
import { RealtimeChannel } from '@supabase/supabase-js';
import tableStyles from '@/components/Common/DataTable/DataTable.module.scss';
import styles from './page.module.scss';

// Define tab types
type DashboardTab = 'new' | 'my' | 'closed';

interface Announcement {
  id: string;
  title: string;
  content: string;
  published_at: string;
  published_by: string;
}

type DashboardSortLabels = {
  _typeSortLabel?: string;
  _formatSortLabel?: string;
  _sourceSortLabel?: string;
};

type DashboardItem =
  | (Ticket & { _type: 'ticket' } & DashboardSortLabels)
  | (Lead & { _type: 'lead' } & DashboardSortLabels)
  | (SupportCase & { _type: 'support_case' } & DashboardSortLabels);

const DASHBOARD_OVERVIEW_COLUMN_WIDTHS =
  '120px 188px 140px 250px 120px 120px 120px 1fr';
const DASHBOARD_INITIAL_PAGE_SIZE = 25;
const TICKETS_FETCH_BATCH_SIZE = 100;
const MAX_TICKET_FETCH_PAGES = 200;
const LEADS_FETCH_BATCH_SIZE = 100;
const MAX_LEAD_FETCH_PAGES = 200;
const SUPPORT_CASES_FETCH_BATCH_SIZE = 100;
const MAX_SUPPORT_CASE_FETCH_PAGES = 200;
const INSPIRATIONAL_QUOTES = [
  { text: 'Focus on the customer, not the competition.', author: 'Jeff Bezos' },
  { text: 'Done is better than perfect.', author: 'Sheryl Sandberg' },
  { text: 'Ideas are easy. Execution is everything.', author: 'John Doerr' },
  { text: 'What gets measured gets improved.', author: 'Peter Drucker' },
  { text: 'Culture eats strategy for breakfast.', author: 'Peter Drucker' },
  {
    text: 'Innovation distinguishes a leader from a follower.',
    author: 'Steve Jobs',
  },
  { text: 'Quality is not an act, it is a habit.', author: 'Aristotle' },
  { text: 'The best marketing is a great product.', author: 'Steve Jobs' },
  { text: 'Time is the scarcest resource.', author: 'Peter Drucker' },
  { text: 'Well done is better than well said.', author: 'Benjamin Franklin' },
  { text: 'Make it simple, but significant.', author: 'Don Draper' },
  { text: 'Hire character. Train skill.', author: 'Peter Schutz' },
  { text: 'Speed beats perfection.', author: 'Unknown' },
  { text: 'Plan the work. Work the plan.', author: 'Unknown' },
  { text: 'Small improvements add up to big results.', author: 'Unknown' },
  { text: 'Make every detail count.', author: 'Walt Disney' },
  { text: 'The way to get started is to begin doing.', author: 'Walt Disney' },
  { text: 'Clarity is power.', author: 'Unknown' },
  { text: 'Great teams build great products.', author: 'Unknown' },
  { text: 'Measure twice, cut once.', author: 'Unknown' },
] as const;
let dashboardQuoteIndex: number | null = null;

const getDashboardQuote = () => {
  if (dashboardQuoteIndex === null) {
    dashboardQuoteIndex = Math.floor(
      Math.random() * INSPIRATIONAL_QUOTES.length
    );
  }
  return INSPIRATIONAL_QUOTES[dashboardQuoteIndex];
};

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

  const street = normalizeAddressPart(
    location.street_address ?? location.address
  );
  return street || 'Unknown';
};

const getDashboardItemAddress = (item: DashboardItem): string => {
  if (item._type === 'ticket') {
    return formatAddressFromLocation(
      item.service_address ??
        item.customer?.primary_service_address ??
        item.customer
    );
  }
  if (item._type === 'lead') {
    return formatAddressFromLocation(
      item.primary_service_address ?? item.customer
    );
  }
  return formatAddressFromLocation(
    item.primary_service_address ?? item.customer
  );
};

const getDashboardItemTypeLabel = (item: DashboardItem): string => {
  if (item._type === 'support_case') return 'Support';
  if (item._type === 'lead') {
    return item.lead_status === 'scheduling' ? 'Scheduling' : 'Sales';
  }
  return 'New';
};

const NA_FIELD_LABEL = 'N/A';

const getOptionLabel = (
  value: string | null | undefined,
  options: ReadonlyArray<{ value: string; label: string }>
): string => {
  if (!value) return '';
  return options.find(option => option.value === value)?.label || value;
};

const legacyTicketTypeToFormat: Record<string, string> = {
  phone_call: 'Call',
  inbound_call: 'Call',
  campaign_call: 'Call',
  web_form: 'Form',
  website_form: 'Form',
  email: 'Email',
  chat: 'Chat',
  in_person: 'In Person',
};

const getDashboardItemFormatLabel = (item: DashboardItem): string => {
  if (item._type === 'lead') {
    return getOptionLabel(item.lead_type, leadTypeOptions) || NA_FIELD_LABEL;
  }
  if (item._type === 'support_case') {
    const ticketType = item.ticket?.type;
    if (ticketType) {
      if (legacyTicketTypeToFormat[ticketType])
        return legacyTicketTypeToFormat[ticketType];
      return (
        getOptionLabel(ticketType, ticketTypeOptions) ||
        legacyTicketTypeToFormat[ticketType] ||
        NA_FIELD_LABEL
      );
    }
    return (
      getOptionLabel(item.issue_type, supportCaseIssueTypeOptions) ||
      NA_FIELD_LABEL
    );
  }
  // Ticket: use format field first, then fall back to legacy type map
  if (item.format) {
    return item.format.charAt(0).toUpperCase() + item.format.slice(1);
  }
  if (legacyTicketTypeToFormat[item.type])
    return legacyTicketTypeToFormat[item.type];
  return getOptionLabel(item.type, ticketTypeOptions) || NA_FIELD_LABEL;
};

const getDashboardItemSourceLabel = (item: DashboardItem): string => {
  if (item._type === 'lead') {
    return (
      getOptionLabel(item.lead_source, leadSourceOptions) || NA_FIELD_LABEL
    );
  }
  if (item._type === 'support_case') {
    return (
      getOptionLabel(item.ticket?.source, ticketSourceOptions) || NA_FIELD_LABEL
    );
  }
  return getOptionLabel(item.source, ticketSourceOptions) || NA_FIELD_LABEL;
};

const sortByCreatedAtAsc = <T extends { created_at: string }>(
  items: T[]
): T[] =>
  [...items].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

// Search filter helper - searches all string values in an object recursively
const filterBySearch = <T extends object>(items: T[], query: string): T[] => {
  if (!query.trim()) return items;
  const lowerQuery = query.toLowerCase();

  const searchInObject = (obj: unknown): boolean => {
    if (obj === null || obj === undefined) return false;
    if (Array.isArray(obj)) return obj.some(item => searchInObject(item));
    if (typeof obj === 'object') {
      return Object.values(obj as Record<string, unknown>).some(value =>
        searchInObject(value)
      );
    }
    return String(obj).toLowerCase().includes(lowerQuery);
  };

  return items.filter(item => searchInObject(item));
};

const getAnnouncementsLastViewed = (companyId: string): number => {
  try {
    const key = `lastViewed_announcements_${companyId}`;
    const timestamp = localStorage.getItem(key);
    return timestamp ? parseInt(timestamp, 10) : 0;
  } catch {
    return 0;
  }
};

const setAnnouncementsLastViewed = (companyId: string): void => {
  try {
    const key = `lastViewed_announcements_${companyId}`;
    localStorage.setItem(key, Date.now().toString());
  } catch {
    // Ignore localStorage errors
  }
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
  const searchParams = useSearchParams();
  const { profile } = useUser();
  const { setPageHeader, registerPageAction, unregisterPageAction } =
    usePageActions();
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
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [hasNewAnnouncements, setHasNewAnnouncements] = useState(false);
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
  const [loadingMoreData, setLoadingMoreData] = useState(false);
  const [ticketsHasMore, setTicketsHasMore] = useState(false);
  const [leadsHasMore, setLeadsHasMore] = useState(false);
  const [supportCasesHasMore, setSupportCasesHasMore] = useState(false);

  // Total counts for tabs (not affected by pagination)
  const [totalCounts, setTotalCounts] = useState({
    unassignedTickets: 0,
    unassignedLeads: 0,
    unassignedScheduling: 0,
    unassignedSupportCases: 0,
    myLeads: 0,
    mySupportCases: 0,
    closedLeads: 0,
    closedSupportCases: 0,
  });

  // Tab states
  const [dashboardTab, setDashboardTab] = useState<DashboardTab>('new');

  // Search states
  const [tableSearch, setTableSearch] = useState('');
  const [tableVisibleCount, setTableVisibleCount] = useState(
    DASHBOARD_INITIAL_PAGE_SIZE
  );

  // Announcements modal state
  const [showAnnouncementsModal, setShowAnnouncementsModal] = useState(false);

  // Quick Quote modal state
  const [showQuickQuote, setShowQuickQuote] = useState(false);

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
    setTableVisibleCount(DASHBOARD_INITIAL_PAGE_SIZE);
  }, [dashboardTab]);

  // Modal state for ticket review
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isQualifying, setIsQualifying] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Ref to track subscription state
  const subscriptionActiveRef = useRef(false);
  const currentChannelRef = useRef<ReturnType<
    typeof createTicketChannel
  > | null>(null);
  const isFetchingRef = useRef(false);
  const queueFullFetchEnabledRef = useRef(false);
  const pendingFullTicketFetchRef = useRef(false);
  const ticketsNextPageRef = useRef(2);
  const leadsNextPageRef = useRef(2);
  const supportCasesNextPageRef = useRef(2);
  const reviewChannelRef = useRef<RealtimeChannel | null>(null);
  const taskChannelRef = useRef<RealtimeChannel | null>(null);

  // Company ref for realtime updates
  const selectedCompanyRef = useRef(selectedCompany);
  useEffect(() => {
    selectedCompanyRef.current = selectedCompany;
  }, [selectedCompany]);

  // User ref for realtime updates
  const userIdRef = useRef(user?.id);
  useEffect(() => {
    userIdRef.current = user?.id;
  }, [user?.id]);

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
      customActions: (
        <div className={styles.headerActions}>
          <button
            type="button"
            className={styles.headerBtnGhost}
            onClick={() => setShowCreateForm(true)}
          >
            New Ticket
          </button>
          <button
            type="button"
            className={styles.headerBtnPrimary}
            onClick={() => setShowQuickQuote(true)}
          >
            Quick Quote
          </button>
        </div>
      ),
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
              reviewedByName:
                ticketProfileData.reviewedByName || existing.reviewedByName,
              reviewedByEmail:
                ticketProfileData.reviewedByEmail || existing.reviewedByEmail,
              reviewedByFirstName:
                ticketProfileData.reviewedByFirstName ||
                existing.reviewedByFirstName,
              reviewedByLastName:
                ticketProfileData.reviewedByLastName ||
                existing.reviewedByLastName,
              reviewedByAvatarUrl:
                ticketProfileData.reviewedByAvatarUrl ??
                existing.reviewedByAvatarUrl,
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

      subscribeToTicketReviewUpdates(
        channel,
        (payload: TicketReviewPayload) => {
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
        }
      );
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
  const fetchTickets = useCallback(
    async (
      companyId: string,
      options?: { showLoading?: boolean; fetchAllPages?: boolean }
    ) => {
      if (!companyId) return;
      const fetchAllPages =
        options?.fetchAllPages ?? queueFullFetchEnabledRef.current;
      if (fetchAllPages) {
        queueFullFetchEnabledRef.current = true;
      }

      if (isFetchingRef.current) {
        if (fetchAllPages) {
          pendingFullTicketFetchRef.current = true;
        }
        return;
      }

      const showLoading = options?.showLoading ?? true;
      isFetchingRef.current = true;
      pendingFullTicketFetchRef.current = false;
      if (showLoading) {
        setLoading(true);
      }

      try {
        const supabase = createClient();

        // For initial load, use page 1 only. Once sorting is engaged, load
        // all pages so client-side sorting works against the full queue.
        let ticketsPageHasMore = false;
        const regularTicketsPromise = (async () => {
          if (!fetchAllPages) {
            const response = await fetch(
              `/api/tickets?${new URLSearchParams({
                companyId,
                includeArchived: 'false',
                page: '1',
                limit: DASHBOARD_INITIAL_PAGE_SIZE.toString(),
                sortBy: 'created_at',
                sortOrder: 'asc',
              })}`
            );

            if (!response.ok) {
              throw new Error('Failed to fetch tickets');
            }

            const data = await response.json();
            ticketsPageHasMore = Boolean(data?.pagination?.hasMore);
            ticketsNextPageRef.current = 2;
            return Array.isArray(data?.tickets) ? data.tickets : [];
          }

          const allRegularTickets: Ticket[] = [];
          let page = 1;
          let hasMore = true;

          while (hasMore && page <= MAX_TICKET_FETCH_PAGES) {
            const response = await fetch(
              `/api/tickets?${new URLSearchParams({
                companyId,
                includeArchived: 'false',
                page: page.toString(),
                limit: TICKETS_FETCH_BATCH_SIZE.toString(),
                sortBy: 'created_at',
                sortOrder: 'asc',
              })}`
            );

            if (!response.ok) {
              throw new Error('Failed to fetch tickets');
            }

            const data = await response.json();
            const pageTickets = Array.isArray(data?.tickets)
              ? data.tickets
              : [];
            allRegularTickets.push(...pageTickets);

            hasMore =
              Boolean(data?.pagination?.hasMore) && pageTickets.length > 0;
            page += 1;
          }

          if (hasMore) {
            console.warn(
              '[TicketsDashboard] Reached ticket page fetch safety cap while loading queue.'
            );
          }

          return allRegularTickets;
        })();

        // Live tickets directly from Supabase (API excludes live status)
        const liveTicketsPromise = supabase
          .from('tickets')
          .select(
            `
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
        `
          )
          .eq('company_id', companyId)
          .eq('status', 'live')
          .order('created_at', { ascending: true })
          .limit(50);

        const [regularTickets, liveResult] = await Promise.all([
          regularTicketsPromise,
          liveTicketsPromise,
        ]);
        const liveTickets =
          !liveResult.error && liveResult.data ? liveResult.data : [];

        setTickets(() => {
          const mergedTickets = new Map<string, Ticket>();
          regularTickets.forEach((ticket: Ticket) =>
            mergedTickets.set(ticket.id, ticket)
          );
          const mergedRegular = Array.from(mergedTickets.values()).sort(
            (a, b) =>
              new Date(a.created_at).getTime() -
              new Date(b.created_at).getTime()
          );
          const uniqueLiveTickets = Array.from(
            new Map(
              liveTickets.map((ticket: Ticket) => [ticket.id, ticket])
            ).values()
          );

          return [...uniqueLiveTickets, ...mergedRegular];
        });
        setTicketsHasMore(ticketsPageHasMore);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        isFetchingRef.current = false;
        if (showLoading) {
          setLoading(false);
        }

        if (pendingFullTicketFetchRef.current) {
          pendingFullTicketFetchRef.current = false;
          void fetchTickets(companyId, {
            showLoading: false,
            fetchAllPages: true,
          });
        }
      }
    },
    []
  );

  // Fetch unassigned leads (sales + scheduling) - oldest first
  const fetchLeads = useCallback(
    async (companyId: string, options?: { fetchAllPages?: boolean }) => {
      if (!companyId) return;
      const fetchAllPages =
        options?.fetchAllPages ?? queueFullFetchEnabledRef.current;

      setLoadingLeads(true);
      try {
        if (!fetchAllPages) {
          const response = await fetch(
            `/api/leads?${new URLSearchParams({
              companyId,
              unassigned: 'true',
              status: 'new,in_process,quoted,scheduling',
              sortBy: 'created_at',
              sortOrder: 'asc',
              paginate: 'true',
              page: '1',
              limit: DASHBOARD_INITIAL_PAGE_SIZE.toString(),
            })}`
          );

          if (!response.ok) throw new Error('Failed to fetch leads');
          const payload = await response.json();

          if (Array.isArray(payload)) {
            setLeads(payload);
            setLeadsHasMore(false);
            return;
          }

          setLeads(Array.isArray(payload?.leads) ? payload.leads : []);
          leadsNextPageRef.current = 2;
          setLeadsHasMore(Boolean(payload?.pagination?.hasMore));
          return;
        }

        const allLeads: Lead[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= MAX_LEAD_FETCH_PAGES) {
          const response = await fetch(
            `/api/leads?${new URLSearchParams({
              companyId,
              unassigned: 'true',
              status: 'new,in_process,quoted,scheduling',
              sortBy: 'created_at',
              sortOrder: 'asc',
              paginate: 'true',
              page: page.toString(),
              limit: LEADS_FETCH_BATCH_SIZE.toString(),
            })}`
          );

          if (!response.ok) throw new Error('Failed to fetch leads');
          const payload = await response.json();

          if (Array.isArray(payload)) {
            allLeads.push(...payload);
            hasMore = false;
            break;
          }

          const pageLeads = Array.isArray(payload?.leads) ? payload.leads : [];
          allLeads.push(...pageLeads);

          hasMore =
            Boolean(payload?.pagination?.hasMore) && pageLeads.length > 0;
          page += 1;
        }

        if (hasMore) {
          console.warn(
            '[TicketsDashboard] Reached lead page fetch safety cap while loading queue.'
          );
        }

        const dedupedLeads = Array.from(
          new Map(allLeads.map(lead => [lead.id, lead])).values()
        );
        setLeads(dedupedLeads);
        setLeadsHasMore(false);
      } catch (error) {
        console.error('Error fetching leads:', error);
      } finally {
        setLoadingLeads(false);
      }
    },
    []
  );

  // Fetch unassigned support cases - oldest first
  const fetchSupportCases = useCallback(
    async (companyId: string, options?: { fetchAllPages?: boolean }) => {
      if (!companyId) return;
      const fetchAllPages =
        options?.fetchAllPages ?? queueFullFetchEnabledRef.current;

      setLoadingSupportCases(true);
      try {
        if (!fetchAllPages) {
          const response = await fetch(
            `/api/support-cases?${new URLSearchParams({
              companyId,
              unassigned: 'true',
              includeArchived: 'false',
              sortBy: 'created_at',
              sortOrder: 'asc',
              paginate: 'true',
              page: '1',
              limit: DASHBOARD_INITIAL_PAGE_SIZE.toString(),
            })}`
          );

          if (!response.ok) throw new Error('Failed to fetch support cases');
          const payload = await response.json();

          if (Array.isArray(payload)) {
            setSupportCases(payload);
            setSupportCasesHasMore(false);
            return;
          }

          setSupportCases(
            Array.isArray(payload?.supportCases) ? payload.supportCases : []
          );
          supportCasesNextPageRef.current = 2;
          setSupportCasesHasMore(Boolean(payload?.pagination?.hasMore));
          return;
        }

        const allSupportCases: SupportCase[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore && page <= MAX_SUPPORT_CASE_FETCH_PAGES) {
          const response = await fetch(
            `/api/support-cases?${new URLSearchParams({
              companyId,
              unassigned: 'true',
              includeArchived: 'false',
              sortBy: 'created_at',
              sortOrder: 'asc',
              paginate: 'true',
              page: page.toString(),
              limit: SUPPORT_CASES_FETCH_BATCH_SIZE.toString(),
            })}`
          );

          if (!response.ok) throw new Error('Failed to fetch support cases');
          const payload = await response.json();

          if (Array.isArray(payload)) {
            allSupportCases.push(...payload);
            hasMore = false;
            break;
          }

          const pageSupportCases = Array.isArray(payload?.supportCases)
            ? payload.supportCases
            : [];
          allSupportCases.push(...pageSupportCases);

          hasMore =
            Boolean(payload?.pagination?.hasMore) &&
            pageSupportCases.length > 0;
          page += 1;
        }

        if (hasMore) {
          console.warn(
            '[TicketsDashboard] Reached support case page fetch safety cap while loading queue.'
          );
        }

        const dedupedSupportCases = Array.from(
          new Map(
            allSupportCases.map(supportCase => [supportCase.id, supportCase])
          ).values()
        );
        setSupportCases(dedupedSupportCases);
        setSupportCasesHasMore(false);
      } catch (error) {
        console.error('Error fetching support cases:', error);
      } finally {
        setLoadingSupportCases(false);
      }
    },
    []
  );

  // Fetch next page of data and append to existing state
  const fetchMoreData = useCallback(
    async (
      companyId: string,
      hasMoreTickets: boolean,
      hasMoreLeads: boolean,
      hasMoreSupportCases: boolean
    ) => {
      setLoadingMoreData(true);
      try {
        const fetches: Promise<void>[] = [];

        if (hasMoreTickets) {
          const page = ticketsNextPageRef.current;
          fetches.push(
            fetch(
              `/api/tickets?${new URLSearchParams({
                companyId,
                includeArchived: 'false',
                page: page.toString(),
                limit: DASHBOARD_INITIAL_PAGE_SIZE.toString(),
                sortBy: 'created_at',
                sortOrder: 'asc',
              })}`
            )
              .then(r => r.json())
              .then(data => {
                const newTickets: Ticket[] = Array.isArray(data?.tickets)
                  ? data.tickets
                  : [];
                ticketsNextPageRef.current = page + 1;
                setTicketsHasMore(Boolean(data?.pagination?.hasMore));
                setTickets(prev => {
                  const liveTickets = prev.filter(t => t.status === 'live');
                  const merged = new Map(
                    prev.filter(t => t.status !== 'live').map(t => [t.id, t])
                  );
                  newTickets.forEach(t => merged.set(t.id, t));
                  return [
                    ...liveTickets,
                    ...Array.from(merged.values()).sort(
                      (a, b) =>
                        new Date(a.created_at).getTime() -
                        new Date(b.created_at).getTime()
                    ),
                  ];
                });
              })
          );
        }

        if (hasMoreLeads) {
          const page = leadsNextPageRef.current;
          fetches.push(
            fetch(
              `/api/leads?${new URLSearchParams({
                companyId,
                unassigned: 'true',
                status: 'new,in_process,quoted,scheduling',
                sortBy: 'created_at',
                sortOrder: 'asc',
                paginate: 'true',
                page: page.toString(),
                limit: DASHBOARD_INITIAL_PAGE_SIZE.toString(),
              })}`
            )
              .then(r => r.json())
              .then(payload => {
                const newLeads: Lead[] = Array.isArray(payload?.leads)
                  ? payload.leads
                  : Array.isArray(payload)
                    ? payload
                    : [];
                leadsNextPageRef.current = page + 1;
                setLeadsHasMore(Boolean(payload?.pagination?.hasMore));
                setLeads(prev => {
                  const merged = new Map(prev.map(l => [l.id, l]));
                  newLeads.forEach(l => merged.set(l.id, l));
                  return Array.from(merged.values()).sort(
                    (a, b) =>
                      new Date(a.created_at).getTime() -
                      new Date(b.created_at).getTime()
                  );
                });
              })
          );
        }

        if (hasMoreSupportCases) {
          const page = supportCasesNextPageRef.current;
          fetches.push(
            fetch(
              `/api/support-cases?${new URLSearchParams({
                companyId,
                unassigned: 'true',
                includeArchived: 'false',
                sortBy: 'created_at',
                sortOrder: 'asc',
                paginate: 'true',
                page: page.toString(),
                limit: DASHBOARD_INITIAL_PAGE_SIZE.toString(),
              })}`
            )
              .then(r => r.json())
              .then(payload => {
                const newCases: SupportCase[] = Array.isArray(
                  payload?.supportCases
                )
                  ? payload.supportCases
                  : Array.isArray(payload)
                    ? payload
                    : [];
                supportCasesNextPageRef.current = page + 1;
                setSupportCasesHasMore(Boolean(payload?.pagination?.hasMore));
                setSupportCases(prev => {
                  const merged = new Map(prev.map(c => [c.id, c]));
                  newCases.forEach(c => merged.set(c.id, c));
                  return Array.from(merged.values()).sort(
                    (a, b) =>
                      new Date(a.created_at).getTime() -
                      new Date(b.created_at).getTime()
                  );
                });
              })
          );
        }

        await Promise.all(fetches);
      } catch (error) {
        console.error('Error fetching more data:', error);
      } finally {
        setLoadingMoreData(false);
      }
    },
    []
  );

  // Fetch user&apos;s assigned data - oldest first
  const fetchMyData = useCallback(async (companyId: string, userId: string) => {
    if (!companyId || !userId) return;

    setLoadingMyData(true);
    try {
      const [leadsRes, casesRes, tasksRes] = await Promise.all([
        fetch(
          `/api/leads?companyId=${companyId}&assignedTo=${userId}&status=in_process,quoted,scheduling&sortBy=created_at&sortOrder=asc`
        ),
        fetch(
          `/api/support-cases?companyId=${companyId}&assignedTo=${userId}&includeArchived=false&sortBy=created_at&sortOrder=asc`
        ),
        fetch(
          `/api/tasks?companyId=${companyId}&assignedTo=${userId}&includeArchived=false&sortBy=created_at&sortOrder=asc`
        ),
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
        const actions = allTasks.filter(
          (t: Task) => t.cadence_step_id && t.status !== 'completed'
        );
        const tasks = allTasks.filter(
          (t: Task) => !t.cadence_step_id && t.status !== 'completed'
        );
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

    setLoadingAnnouncements(true);
    try {
      const response = await fetch(`/api/companies/${companyId}/announcements`);
      if (response.ok) {
        const data = await response.json();
        setAnnouncements(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoadingAnnouncements(false);
    }
  }, []);

  // Fetch total counts for tabs (not affected by pagination)
  const fetchTotalCounts = useCallback(
    async (companyId: string, userId?: string) => {
      if (!companyId) return;

      try {
        const supabase = createClient();

        // Fetch all counts in parallel
        const [
          unassignedTicketsResult,
          unassignedLeadsResult,
          unassignedSchedulingResult,
          unassignedSupportCasesResult,
          myLeadsResult,
          mySupportCasesResult,
          closedLeadsResult,
          closedSupportCasesResult,
        ] = await Promise.all([
          // Unassigned tickets (excluding live and closed)
          supabase
            .from('tickets')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .neq('status', 'live')
            .neq('status', 'closed')
            .or('archived.is.null,archived.eq.false'),
          // Unassigned leads (excluding scheduling status)
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .is('assigned_to', null)
            .in('lead_status', ['new', 'in_process', 'quoted'])
            .or('archived.is.null,archived.eq.false'),
          // Unassigned scheduling (leads with scheduling status)
          supabase
            .from('leads')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .is('assigned_to', null)
            .eq('lead_status', 'scheduling')
            .or('archived.is.null,archived.eq.false'),
          // Unassigned support cases
          supabase
            .from('support_cases')
            .select('id', { count: 'exact', head: true })
            .eq('company_id', companyId)
            .is('assigned_to', null)
            .or('archived.is.null,archived.eq.false'),
          // My leads (assigned to user, active statuses)
          userId
            ? supabase
                .from('leads')
                .select('id', { count: 'exact', head: true })
                .eq('company_id', companyId)
                .eq('assigned_to', userId)
                .in('lead_status', ['in_process', 'quoted', 'scheduling'])
                .or('archived.is.null,archived.eq.false')
            : Promise.resolve({ count: 0 }),
          // My support cases (assigned to user)
          userId
            ? supabase
                .from('support_cases')
                .select('id', { count: 'exact', head: true })
                .eq('company_id', companyId)
                .eq('assigned_to', userId)
                .or('archived.is.null,archived.eq.false')
            : Promise.resolve({ count: 0 }),
          // Closed leads (won/lost)
          userId
            ? supabase
                .from('leads')
                .select('id', { count: 'exact', head: true })
                .eq('company_id', companyId)
                .eq('assigned_to', userId)
                .in('lead_status', ['won', 'lost'])
            : Promise.resolve({ count: 0 }),
          // Closed support cases (resolved/closed)
          userId
            ? supabase
                .from('support_cases')
                .select('id', { count: 'exact', head: true })
                .eq('company_id', companyId)
                .eq('assigned_to', userId)
                .in('status', ['resolved', 'closed'])
            : Promise.resolve({ count: 0 }),
        ]);

        setTotalCounts({
          unassignedTickets: unassignedTicketsResult.count || 0,
          unassignedLeads: unassignedLeadsResult.count || 0,
          unassignedScheduling: unassignedSchedulingResult.count || 0,
          unassignedSupportCases: unassignedSupportCasesResult.count || 0,
          myLeads: myLeadsResult.count || 0,
          mySupportCases: mySupportCasesResult.count || 0,
          closedLeads: closedLeadsResult.count || 0,
          closedSupportCases: closedSupportCasesResult.count || 0,
        });
      } catch (error) {
        console.error('Error fetching total counts:', error);
      }
    },
    []
  );

  // Initial data fetch
  useEffect(() => {
    if (selectedCompany?.id) {
      queueFullFetchEnabledRef.current = false;
      pendingFullTicketFetchRef.current = false;
      fetchTickets(selectedCompany.id, { fetchAllPages: false });
      fetchLeads(selectedCompany.id, { fetchAllPages: false });
      fetchSupportCases(selectedCompany.id, { fetchAllPages: false });
      fetchAnnouncements(selectedCompany.id);
      fetchTotalCounts(selectedCompany.id, user?.id);

      if (user?.id) {
        fetchMyData(selectedCompany.id, user.id);
      }
    }
  }, [
    selectedCompany?.id,
    user?.id,
    fetchTickets,
    fetchLeads,
    fetchSupportCases,
    fetchMyData,
    fetchAnnouncements,
    fetchTotalCounts,
  ]);

  useEffect(() => {
    if (!selectedCompany?.id) {
      setHasNewAnnouncements(false);
      return;
    }
    if (announcements.length === 0) {
      setHasNewAnnouncements(false);
      return;
    }

    const lastViewed = getAnnouncementsLastViewed(selectedCompany.id);
    if (lastViewed === 0) {
      setHasNewAnnouncements(true);
      return;
    }

    const hasNew = announcements.some(
      announcement => new Date(announcement.published_at).getTime() > lastViewed
    );
    setHasNewAnnouncements(hasNew);
  }, [announcements, selectedCompany?.id]);

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
      if (
        company_id &&
        currentCompany?.id &&
        company_id !== currentCompany.id
      ) {
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
              .select(
                `
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
              `
              )
              .eq('id', record_id)
              .single();

            if (!error && fullTicket && fullTicket.status !== 'closed') {
              setTickets(prev => {
                const exists = prev.some(t => t.id === fullTicket.id);
                if (!exists) {
                  const liveTickets = prev.filter(
                    ticket => ticket.status === 'live'
                  );
                  const regularTickets = prev.filter(
                    ticket => ticket.status !== 'live'
                  );
                  const updatedRegularTickets = [
                    ...regularTickets,
                    fullTicket,
                  ].sort(
                    (a, b) =>
                      new Date(a.created_at).getTime() -
                      new Date(b.created_at).getTime()
                  );
                  return [...liveTickets, ...updatedRegularTickets];
                }
                return prev;
              });
              // Refresh counts for new ticket
              fetchTotalCounts(currentCompanyId, userIdRef.current);
            }
          } catch (err) {
            console.error('Error fetching new ticket for realtime:', err);
          }
        } else if (action === 'UPDATE' && record_id) {
          // Fetch updated ticket data
          try {
            const { data: updatedTicket, error } = await supabase
              .from('tickets')
              .select(
                `
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
              `
              )
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
                // Refresh counts when ticket is removed
                fetchTotalCounts(currentCompanyId, userIdRef.current);
              } else {
                // Update existing ticket or add if not present
                setTickets(prev => {
                  const exists = prev.some(t => t.id === updatedTicket.id);
                  if (exists) {
                    return prev.map(t =>
                      t.id === updatedTicket.id ? updatedTicket : t
                    );
                  }
                  const liveTickets = prev.filter(
                    ticket => ticket.status === 'live'
                  );
                  const regularTickets = prev.filter(
                    ticket => ticket.status !== 'live'
                  );
                  const updatedRegularTickets = [
                    ...regularTickets,
                    updatedTicket,
                  ].sort(
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
          // Refresh counts when ticket is deleted
          fetchTotalCounts(currentCompanyId, userIdRef.current);
        } else {
          // Fallback: refetch for unknown actions
          fetchTickets(currentCompanyId, { showLoading: false });
          fetchTotalCounts(currentCompanyId, userIdRef.current);
        }
      } else if (table === 'call_records') {
        // For call records, update the parent ticket
        if (ticket_id) {
          try {
            const supabase = createClient();
            const { data: updatedTicket, error } = await supabase
              .from('tickets')
              .select(
                `
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
              `
              )
              .eq('id', ticket_id)
              .single();

            if (!error && updatedTicket) {
              setTickets(prev =>
                prev.map(t => (t.id === ticket_id ? updatedTicket : t))
              );
            }
          } catch (err) {
            console.error('Error updating ticket with call record:', err);
          }
        } else {
          fetchTickets(currentCompanyId, { showLoading: false });
        }
      } else if (table === 'leads') {
        fetchLeads(currentCompanyId);
        fetchTotalCounts(currentCompanyId, userIdRef.current);
      } else if (table === 'support_cases') {
        fetchSupportCases(currentCompanyId);
        fetchTotalCounts(currentCompanyId, userIdRef.current);
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
  }, [
    selectedCompany?.id,
    user?.id,
    fetchTickets,
    fetchLeads,
    fetchSupportCases,
    fetchTotalCounts,
  ]);

  // Realtime subscription for tasks assigned to the current user
  useEffect(() => {
    if (!selectedCompany?.id || !user?.id) return;

    if (taskChannelRef.current) return;

    const channel = createTaskChannel(selectedCompany.id);
    taskChannelRef.current = channel;

    subscribeToTaskUpdates(channel, async (payload: TaskUpdatePayload) => {
      const { company_id, action, record_id } = payload;
      if (company_id !== selectedCompany.id) return;

      const supabase = createClient();
      const currentUserId = userIdRef.current;
      if (!currentUserId) return;

      if (action === 'INSERT' || action === 'UPDATE') {
        try {
          const { data: task } = await supabase
            .from('tasks')
            .select('*')
            .eq('id', record_id)
            .single();

          if (!task) return;

          const isAssignedToMe = task.assigned_to === currentUserId;
          const isCompleted = task.status === 'completed';
          const isAction = Boolean(task.cadence_step_id);

          if (isAssignedToMe && !isCompleted) {
            // Upsert into the correct list
            if (isAction) {
              setMyActions(prev => {
                const exists = prev.some(t => t.id === task.id);
                return exists
                  ? prev.map(t => (t.id === task.id ? task : t))
                  : [...prev, task];
              });
              setMyTasks(prev => prev.filter(t => t.id !== task.id));
            } else {
              setMyTasks(prev => {
                const exists = prev.some(t => t.id === task.id);
                return exists
                  ? prev.map(t => (t.id === task.id ? task : t))
                  : [...prev, task];
              });
              setMyActions(prev => prev.filter(t => t.id !== task.id));
            }
          } else {
            // No longer assigned to me or now completed — remove from both lists
            setMyActions(prev => prev.filter(t => t.id !== record_id));
            setMyTasks(prev => prev.filter(t => t.id !== record_id));
          }
        } catch (err) {
          console.error(
            'Error handling task realtime update on dashboard:',
            err
          );
        }
      } else if (action === 'DELETE') {
        setMyActions(prev => prev.filter(t => t.id !== record_id));
        setMyTasks(prev => prev.filter(t => t.id !== record_id));
      }
    });

    return () => {
      if (taskChannelRef.current) {
        createClient().removeChannel(taskChannelRef.current);
        taskChannelRef.current = null;
      }
    };
  }, [selectedCompany?.id, user?.id]);

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
  const handleLeadAction = useCallback(
    (action: string, lead: Lead) => {
      if (action === 'edit' || action === 'view') {
        router.push(`/tickets/leads/${lead.id}`);
      }
    },
    [router]
  );

  // Handle support case action
  const handleSupportCaseAction = useCallback(
    (action: string, supportCase: SupportCase) => {
      if (action === 'view') {
        router.push(`/tickets/customer-service/${supportCase.id}`);
      }
    },
    [router]
  );

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setShowTicketModal(false);
    setSelectedTicket(null);
  }, []);

  // Open a specific ticket via ?ticketId= URL param
  useEffect(() => {
    const ticketId = searchParams.get('ticketId');
    if (!ticketId) return;

    fetch(`/api/tickets/${ticketId}`)
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (data) {
          setSelectedTicket(data);
          setShowTicketModal(true);
        }
      })
      .catch(() => {
        /* silently ignore — ticket may not exist or user lacks access */
      });
  }, [searchParams]);

  // Handle ticket qualification
  const handleQualify = useCallback(
    async (
      qualification: 'sales' | 'customer_service' | 'junk',
      assignedTo?: string,
      customStatus?: string
    ) => {
      if (!selectedTicket) return;

      setIsQualifying(true);
      try {
        const response = await fetch(
          `/api/tickets/${selectedTicket.id}/qualify`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qualification, assignedTo, customStatus }),
          }
        );

        if (!response.ok) throw new Error('Failed to qualify ticket');

        const data = await response.json();

        if (data?.leadId || data?.supportCaseId) {
          // About to navigate away — show overlay immediately and skip the
          // stale table refresh so there's no visual flash behind the modal.
          setIsRedirecting(true);
        } else if (selectedCompany?.id) {
          fetchTickets(selectedCompany.id);
        }

        return data;
      } catch (error) {
        console.error('Error qualifying ticket:', error);
        alert('Failed to qualify ticket. Please try again.');
        handleModalClose();
      } finally {
        setIsQualifying(false);
      }
    },
    [selectedTicket, selectedCompany, fetchTickets, handleModalClose]
  );

  // Navigate to tasks page
  const handleActionsClick = useCallback(() => {
    router.push('/tickets/my-tasks');
  }, [router]);

  const handleTasksClick = useCallback(() => {
    router.push('/tickets/my-tasks');
  }, [router]);

  const handleActionItemClick = useCallback(
    (task: Task) => {
      if (task.related_entity_type === 'leads' && task.related_entity_id) {
        router.push(`/tickets/leads/${task.related_entity_id}`);
      } else {
        router.push('/tickets/my-tasks');
      }
    },
    [router]
  );

  const handleTaskItemClick = useCallback(
    (task: Task) => {
      router.push(`/tickets/tasks/${task.id}`);
    },
    [router]
  );

  const handleAnnouncementsOpen = useCallback(() => {
    setShowAnnouncementsModal(true);
    if (selectedCompany?.id) {
      setAnnouncementsLastViewed(selectedCompany.id);
      setHasNewAnnouncements(false);
    }
  }, [selectedCompany?.id]);

  // Get columns - use total counts for tab badges (not affected by pagination)
  const tableTabCounts = useMemo(
    () => ({
      new:
        totalCounts.unassignedTickets +
        totalCounts.unassignedLeads +
        totalCounts.unassignedScheduling +
        totalCounts.unassignedSupportCases,
      my: totalCounts.myLeads + totalCounts.mySupportCases,
      closed: totalCounts.closedLeads + totalCounts.closedSupportCases,
    }),
    [totalCounts]
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
        width: '188px',
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
        key: 'format',
        title: 'Format',
        width: '120px',
        sortable: true,
        sortKey: '_formatSortLabel',
        render: (item: DashboardItem) => {
          const label = getDashboardItemFormatLabel(item);
          const isCall =
            item._type === 'ticket' &&
            (item.format === 'call' ||
              (!item.format &&
                ['phone_call', 'inbound_call', 'campaign_call'].includes(
                  item.type
                )));
          const isForm =
            item._type === 'ticket' &&
            (item.format === 'form' ||
              (!item.format &&
                ['web_form', 'website_form'].includes(item.type)));
          return (
            <div className={tableStyles.formatCell}>
              {isCall && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="19"
                  viewBox="0 0 18 19"
                  fill="none"
                  className={tableStyles.phoneIcon}
                >
                  <path
                    d="M10.374 13.0652C10.5289 13.1363 10.7034 13.1525 10.8688 13.1112C11.0341 13.0699 11.1805 12.9735 11.2838 12.8379L11.55 12.4892C11.6897 12.3029 11.8709 12.1517 12.0792 12.0475C12.2875 11.9434 12.5171 11.8892 12.75 11.8892H15C15.3978 11.8892 15.7794 12.0472 16.0607 12.3285C16.342 12.6098 16.5 12.9913 16.5 13.3892V15.6392C16.5 16.037 16.342 16.4185 16.0607 16.6998C15.7794 16.9811 15.3978 17.1392 15 17.1392C11.4196 17.1392 7.9858 15.7168 5.45406 13.1851C2.92232 10.6534 1.5 7.21958 1.5 3.63916C1.5 3.24134 1.65804 2.8598 1.93934 2.5785C2.22064 2.2972 2.60218 2.13916 3 2.13916H5.25C5.64782 2.13916 6.02936 2.2972 6.31066 2.5785C6.59196 2.8598 6.75 3.24134 6.75 3.63916V5.88916C6.75 6.12203 6.69578 6.3517 6.59164 6.55998C6.4875 6.76826 6.33629 6.94944 6.15 7.08916L5.799 7.35241C5.66131 7.45754 5.56426 7.6071 5.52434 7.77567C5.48442 7.94425 5.50409 8.12144 5.58 8.27716C6.60501 10.3591 8.29082 12.0428 10.374 13.0652Z"
                    stroke="#0088CC"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {isForm && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="19"
                  viewBox="0 0 18 19"
                  fill="none"
                  className={tableStyles.formIcon}
                >
                  <path
                    d="M9 15.6392H8.25C7.85218 15.6392 7.47064 15.4811 7.18934 15.1998C6.90804 14.9185 6.75 14.537 6.75 14.1392M6.75 14.1392C6.75 14.537 6.59196 14.9185 6.31066 15.1998C6.02936 15.4811 5.64782 15.6392 5.25 15.6392H4.5M6.75 14.1392V5.13916M9.75 6.63916H15C15.3978 6.63916 15.7794 6.7972 16.0607 7.0785C16.342 7.3598 16.5 7.74134 16.5 8.13916V11.1392C16.5 11.537 16.342 11.9185 16.0607 12.1998C15.7794 12.4811 15.3978 12.6392 15 12.6392H9.75M3.75 12.6392H3C2.60218 12.6392 2.22064 12.4811 1.93934 12.1998C1.65804 11.9185 1.5 11.537 1.5 11.1392V8.13916C1.5 7.74134 1.65804 7.3598 1.93934 7.0785C2.22064 6.7972 2.60218 6.63916 3 6.63916H3.75M4.5 3.63916H5.25C5.64782 3.63916 6.02936 3.7972 6.31066 4.0785C6.59196 4.3598 6.75 4.74134 6.75 5.13916M6.75 5.13916C6.75 4.74134 6.90804 4.3598 7.18934 4.0785C7.47064 3.7972 7.85218 3.63916 8.25 3.63916H9"
                    stroke="#0088CC"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {label}
            </div>
          );
        },
      },
      {
        key: 'source',
        title: 'Source',
        width: '120px',
        sortable: true,
        sortKey: '_sourceSortLabel',
        render: (item: DashboardItem) => {
          const isTech =
            item._type === 'lead' && item.lead_source === 'technician';
          const label = isTech ? 'Tech' : getDashboardItemSourceLabel(item);
          return (
            <div
              className={`${tableStyles.formatCell} ${
                label === NA_FIELD_LABEL ? tableStyles.mutedText : ''
              }`}
            >
              {isTech && <Truck size={18} color="#0088CC" strokeWidth={1.5} />}
              {label}
            </div>
          );
        },
      },
      {
        key: 'type',
        title: 'Ticket Type',
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

          const label = 'Review Ticket';
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

  const handleDashboardSortChange = useCallback(
    (_field: string, _order: 'asc' | 'desc') => {
      if (dashboardTab !== 'new' || !selectedCompany?.id) {
        return;
      }

      if (queueFullFetchEnabledRef.current) {
        return;
      }

      queueFullFetchEnabledRef.current = true;
      pendingFullTicketFetchRef.current = false;
      fetchTickets(selectedCompany.id, {
        showLoading: false,
        fetchAllPages: true,
      });
      fetchLeads(selectedCompany.id, { fetchAllPages: true });
      fetchSupportCases(selectedCompany.id, { fetchAllPages: true });
    },
    [
      dashboardTab,
      selectedCompany?.id,
      fetchTickets,
      fetchLeads,
      fetchSupportCases,
    ]
  );

  const latestNewTabItems = useMemo<DashboardItem[]>(() => {
    if (!selectedCompany?.id) return [];

    return [
      ...tickets
        .filter(ticket => ticket.status !== 'live')
        .map(ticket => ({
          ...ticket,
          _type: 'ticket' as const,
          _typeSortLabel: 'New',
          _formatSortLabel:
            getOptionLabel(ticket.type, ticketTypeOptions) || NA_FIELD_LABEL,
          _sourceSortLabel:
            getOptionLabel(ticket.source, ticketSourceOptions) ||
            NA_FIELD_LABEL,
        })),
      ...leads.map(lead => ({
        ...lead,
        _type: 'lead' as const,
        _typeSortLabel:
          lead.lead_status === 'scheduling' ? 'Scheduling' : 'Sales',
        _formatSortLabel:
          getOptionLabel(lead.lead_type, leadTypeOptions) || NA_FIELD_LABEL,
        _sourceSortLabel:
          getOptionLabel(lead.lead_source, leadSourceOptions) || NA_FIELD_LABEL,
      })),
      ...supportCases.map(supportCase => ({
        ...supportCase,
        _type: 'support_case' as const,
        _typeSortLabel: 'Support',
        _formatSortLabel:
          getOptionLabel(supportCase.ticket?.type, ticketTypeOptions) ||
          getOptionLabel(supportCase.issue_type, supportCaseIssueTypeOptions) ||
          NA_FIELD_LABEL,
        _sourceSortLabel:
          getOptionLabel(supportCase.ticket?.source, ticketSourceOptions) ||
          NA_FIELD_LABEL,
      })),
    ];
  }, [tickets, leads, supportCases, selectedCompany?.id]);
  const sortedNewTabItems = useMemo(
    () => sortByCreatedAtAsc(latestNewTabItems),
    [latestNewTabItems]
  );

  // Get current data for dashboard table based on tab
  const tableContent = useMemo(() => {
    switch (dashboardTab) {
      case 'new': {
        return {
          data: filterBySearch(sortedNewTabItems, tableSearch),
          columns: dashboardOverviewColumns,
          loading:
            loading ||
            ((loadingLeads || loadingSupportCases) && !loadingMoreData),
          tableType: 'tickets' as const,
          customColumnWidths: DASHBOARD_OVERVIEW_COLUMN_WIDTHS,
        };
      }
      case 'my': {
        // Combine leads and support cases, sort oldest to newest
        // Add sortable labels for format/source/ticket type columns.
        const combinedData = [
          ...myLeads.map(lead => ({
            ...lead,
            _type: 'lead' as const,
            _typeSortLabel:
              lead.lead_status === 'scheduling' ? 'Scheduling' : 'Sales',
            _formatSortLabel:
              getOptionLabel(lead.lead_type, leadTypeOptions) || NA_FIELD_LABEL,
            _sourceSortLabel:
              getOptionLabel(lead.lead_source, leadSourceOptions) ||
              NA_FIELD_LABEL,
          })),
          ...mySupportCases.map(supportCase => ({
            ...supportCase,
            _type: 'support_case' as const,
            _typeSortLabel: 'Support',
            _formatSortLabel:
              getOptionLabel(supportCase.ticket?.type, ticketTypeOptions) ||
              getOptionLabel(
                supportCase.issue_type,
                supportCaseIssueTypeOptions
              ) ||
              NA_FIELD_LABEL,
            _sourceSortLabel:
              getOptionLabel(supportCase.ticket?.source, ticketSourceOptions) ||
              NA_FIELD_LABEL,
          })),
        ].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        return {
          data: filterBySearch(combinedData, tableSearch),
          columns: dashboardOverviewColumns,
          loading: loadingMyData,
          tableType: 'leads' as const,
          customColumnWidths: DASHBOARD_OVERVIEW_COLUMN_WIDTHS,
        };
      }
      case 'closed': {
        const combinedData = [
          ...myLeads
            .filter(l => ['won', 'lost'].includes(l.lead_status))
            .map(lead => ({
              ...lead,
              _type: 'lead' as const,
              _typeSortLabel:
                lead.lead_status === 'scheduling' ? 'Scheduling' : 'Sales',
              _formatSortLabel:
                getOptionLabel(lead.lead_type, leadTypeOptions) ||
                NA_FIELD_LABEL,
              _sourceSortLabel:
                getOptionLabel(lead.lead_source, leadSourceOptions) ||
                NA_FIELD_LABEL,
            })),
          ...mySupportCases
            .filter(c => ['resolved', 'closed'].includes(c.status))
            .map(supportCase => ({
              ...supportCase,
              _type: 'support_case' as const,
              _typeSortLabel: 'Support',
              _formatSortLabel:
                getOptionLabel(supportCase.ticket?.type, ticketTypeOptions) ||
                getOptionLabel(
                  supportCase.issue_type,
                  supportCaseIssueTypeOptions
                ) ||
                NA_FIELD_LABEL,
              _sourceSortLabel:
                getOptionLabel(
                  supportCase.ticket?.source,
                  ticketSourceOptions
                ) || NA_FIELD_LABEL,
            })),
        ].sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        return {
          data: filterBySearch(combinedData, tableSearch),
          columns: dashboardOverviewColumns,
          loading: loadingMyData,
          tableType: 'leads' as const,
          customColumnWidths: DASHBOARD_OVERVIEW_COLUMN_WIDTHS,
        };
      }
      default:
        return {
          data: filterBySearch([], tableSearch),
          columns: dashboardOverviewColumns,
          loading: false,
          tableType: 'tickets' as const,
          customColumnWidths: DASHBOARD_OVERVIEW_COLUMN_WIDTHS,
        };
    }
  }, [
    dashboardTab,
    sortedNewTabItems,
    tableSearch,
    dashboardOverviewColumns,
    loading,
    loadingLeads,
    loadingSupportCases,
    loadingMoreData,
    myLeads,
    mySupportCases,
    loadingMyData,
  ]);
  const tableData = (tableContent.data || []) as any[];
  const serverHasMore = ticketsHasMore || leadsHasMore || supportCasesHasMore;
  const tableHasMore =
    dashboardTab === 'new' &&
    (tableData.length > tableVisibleCount || loadingMoreData || serverHasMore);
  const handleTableLoadMore = useCallback(() => {
    const nextVisibleCount = tableVisibleCount + DASHBOARD_INITIAL_PAGE_SIZE;
    setTableVisibleCount(nextVisibleCount);

    if (
      !loadingMoreData &&
      nextVisibleCount >= tableData.length &&
      serverHasMore &&
      selectedCompany?.id
    ) {
      fetchMoreData(
        selectedCompany.id,
        ticketsHasMore,
        leadsHasMore,
        supportCasesHasMore
      );
    }
  }, [
    tableVisibleCount,
    tableData.length,
    loadingMoreData,
    serverHasMore,
    selectedCompany?.id,
    ticketsHasMore,
    leadsHasMore,
    supportCasesHasMore,
    fetchMoreData,
  ]);

  const tableEmptyStateMessage =
    dashboardTab === 'new'
      ? 'No unassigned items at the moment.'
      : 'No assigned items in this category.';

  // Check for new items in actions/tasks
  const hasNewActions = newItemIndicators.my_actions || false;
  const hasNewTasks = newItemIndicators.my_tasks || false;
  const [randomQuote, setRandomQuote] = useState<
    (typeof INSPIRATIONAL_QUOTES)[number] | null
  >(null);
  useEffect(() => {
    setRandomQuote(getDashboardQuote());
  }, []);

  return (
    <div className={styles.dashboardContainer}>
      {/* Your Action & Tasks Section */}
      <section className={`${styles.section} ${styles.sectionNoGap}`}>
        <div className={styles.actionsTasksCard}>
          <h2 className={`${styles.sectionTitle} ${styles.sectionTitleSpaced}`}>
            Your Actions &amp; Tasks
          </h2>
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
                  <span
                    className={`${styles.badge} ${hasNewActions ? styles.badgeNew : ''}`}
                  >
                    {myActions.length}
                  </span>
                )}
              </div>
              <p className={styles.boxDescription}>
                Actions are part of any assigned cadence for sales, support or
                scheduling.
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
                  <span
                    className={`${styles.badge} ${hasNewTasks ? styles.badgeNew : ''}`}
                  >
                    {myTasks.length}
                  </span>
                )}
              </div>
              <p className={styles.boxDescription}>
                Tasks that are personally assigned within a given customer
                account or personal task.
              </p>
            </button>

            {/* Important Announcements Box */}
            <button
              type="button"
              className={styles.announcementBox}
              onClick={handleAnnouncementsOpen}
            >
              <div className={styles.boxHeader}>
                <span className={styles.boxTitle}>Announcements</span>
                {loadingAnnouncements ? (
                  <span className={styles.badge}>
                    <Loader2 size={14} className={styles.spinner} />
                  </span>
                ) : (
                  <span
                    className={`${styles.badge} ${hasNewAnnouncements ? styles.badgeNew : ''}`}
                  >
                    {announcements.length}
                  </span>
                )}
              </div>
              {randomQuote && (
                <div className={styles.announcementsList}>
                  <div className={styles.announcementItem}>
                    <strong>{randomQuote.text}</strong>
                    <p>- {randomQuote.author}</p>
                  </div>
                </div>
              )}
              {announcements.length > 1 && (
                <span className={styles.expandButton}>
                  + Expand To See More ({announcements.length - 1})
                </span>
              )}
              <Image
                src="/images/announcements-agent.png"
                alt=""
                aria-hidden="true"
                width={128}
                height={161}
                className={styles.announcementImage}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Quick View Panel - Actions & Tasks */}
      <ActionsTasksQuickView
        loading={loadingMyData}
        actions={myActions}
        tasks={myTasks}
        onActionItemClick={handleActionItemClick}
        onTaskItemClick={handleTaskItemClick}
        onViewAllActions={handleActionsClick}
        onViewAllTasks={handleTasksClick}
      />

      {/* Tickets Table Section */}
      <section className={`${styles.section} ${styles.sectionNoGap}`}>
        <h2 className={`${styles.sectionTitle} ${styles.sectionTitleSpaced}`}>
          Tickets
        </h2>

        {/* Tabs */}
        <div className={styles.tabsRow}>
          <div className={styles.tabsSection}>
            <button
              className={`${styles.tab} ${dashboardTab === 'new' ? styles.active : ''}`}
              onClick={() => setDashboardTab('new')}
            >
              New Tickets
              <span className={styles.tabCount}>{tableTabCounts.new}</span>
            </button>
            <button
              className={`${styles.tab} ${dashboardTab === 'my' ? styles.active : ''}`}
              onClick={() => setDashboardTab('my')}
            >
              My Tickets
              <span className={styles.tabCount}>{tableTabCounts.my}</span>
            </button>
            <button
              className={`${styles.tab} ${dashboardTab === 'closed' ? styles.active : ''}`}
              onClick={() => setDashboardTab('closed')}
            >
              Closed
              <span className={styles.tabCount}>{tableTabCounts.closed}</span>
            </button>
          </div>
          <div className={styles.searchSection}>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search"
              value={tableSearch}
              onChange={e => setTableSearch(e.target.value)}
            />
            <Search size={18} className={styles.searchIcon} />
          </div>
        </div>

        {/* Data Table */}
        {selectedCompany && (
          <Suspense fallback={<DashboardSkeleton />}>
            <DataTable
              key={`dashboard-${dashboardTab}`}
              data={tableData as any[]}
              loading={tableContent.loading}
              title="Tickets"
              columns={tableContent.columns as any}
              tabs={[]}
              onItemAction={handleDashboardItemAction as any}
              infiniteScrollEnabled={dashboardTab === 'new'}
              visibleCount={
                dashboardTab === 'new' ? tableVisibleCount : undefined
              }
              hasMore={tableHasMore}
              onLoadMore={handleTableLoadMore}
              loadingMore={loadingMoreData}
              preserveWindowScrollAnchor={dashboardTab === 'new'}
              tableType={tableContent.tableType}
              customColumnWidths={tableContent.customColumnWidths}
              searchEnabled={false}
              onSortChange={handleDashboardSortChange}
              emptyStateMessage={tableEmptyStateMessage}
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

      {isRedirecting && (
        <div className={styles.redirectOverlay}>
          <Loader2 size={32} className={styles.redirectSpinner} />
          <span>Opening record&hellip;</span>
        </div>
      )}

      {/* Quick Quote Modal */}
      {showQuickQuote && selectedCompany && user && (
        <QuickQuoteModal
          companyId={selectedCompany.id}
          companyName={selectedCompany.name || ''}
          userId={user.id}
          onClose={() => setShowQuickQuote(false)}
        />
      )}
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
