'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useUser } from '@/hooks/useUser';

interface Counts {
  tickets: number;
  leads: number;
  unassigned_leads: number; // Unassigned leads only (for red dot logic)
  cases: number;
  unassigned_cases: number; // Unassigned support cases only (for red dot logic)
  customers: number;
  scheduling: number; // Won leads count
  my_leads: number; // Leads assigned to current user
  my_cases: number; // Support cases assigned to current user
  my_tasks: number; // Tasks assigned to current user (excluding completed, no cadence_step_id)
  my_actions: number; // Actions assigned to current user (tasks with cadence_step_id)
}

interface CountAnimation {
  [key: string]: boolean;
}

interface NewItemIndicators {
  [key: string]: boolean;
}

// Helper functions for per-task seen tracking (outside component to avoid recreation)
const getSeenTaskIds = (companyId: string): string[] => {
  try {
    const key = `seenTasks_${companyId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const getSeenActionIds = (companyId: string): string[] => {
  try {
    const key = `seenActions_${companyId}`;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const setSeenTaskIds = (companyId: string, ids: string[]): void => {
  try {
    const key = `seenTasks_${companyId}`;
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // Ignore localStorage errors
  }
};

const setSeenActionIds = (companyId: string, ids: string[]): void => {
  try {
    const key = `seenActions_${companyId}`;
    localStorage.setItem(key, JSON.stringify(ids));
  } catch {
    // Ignore localStorage errors
  }
};

// Custom event for notifying all hook instances when seen status changes
const SEEN_STATUS_CHANGED_EVENT = 'seenStatusChanged';

const dispatchSeenStatusChanged = (): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SEEN_STATUS_CHANGED_EVENT));
  }
};

// Exported functions for marking tasks/actions as seen
export const markTaskAsSeen = (taskId: string, companyId: string): void => {
  const seen = getSeenTaskIds(companyId);
  if (!seen.includes(taskId)) {
    seen.push(taskId);
    setSeenTaskIds(companyId, seen);
    dispatchSeenStatusChanged();
  }
};

export const markActionAsSeen = (taskId: string, companyId: string): void => {
  const seen = getSeenActionIds(companyId);
  if (!seen.includes(taskId)) {
    seen.push(taskId);
    setSeenActionIds(companyId, seen);
    dispatchSeenStatusChanged();
  }
};

// Check if there are unseen tasks/actions
const hasUnseenTasks = (taskIds: string[], companyId: string): boolean => {
  const seen = getSeenTaskIds(companyId);
  return taskIds.some(id => !seen.includes(id));
};

const hasUnseenActions = (actionIds: string[], companyId: string): boolean => {
  const seen = getSeenActionIds(companyId);
  return actionIds.some(id => !seen.includes(id));
};

export function useRealtimeCounts() {
  const [counts, setCounts] = useState<Counts>({
    tickets: 0,
    leads: 0,
    unassigned_leads: 0,
    cases: 0,
    unassigned_cases: 0,
    customers: 0,
    scheduling: 0,
    my_leads: 0,
    my_cases: 0,
    my_tasks: 0,
    my_actions: 0,
  });

  const [animations, setAnimations] = useState<CountAnimation>({});
  const [newItemIndicators, setNewItemIndicators] = useState<NewItemIndicators>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUser();
  const { selectedCompany, isLoading: companyLoading } = useCompany();

  // Trigger animation for a specific count
  const triggerAnimation = useCallback((countType: string) => {
    setAnimations(prev => ({ ...prev, [countType]: true }));
    setTimeout(() => {
      setAnimations(prev => ({ ...prev, [countType]: false }));
    }, 300); // Animation duration
  }, []);

  // Trigger new item indicator for a specific count
  const triggerNewItemIndicator = useCallback((countType: string) => {
    setNewItemIndicators(prev => ({ ...prev, [countType]: true }));
  }, []);

  // Clear new item indicator when user visits page
  const clearNewItemIndicator = useCallback(
    (countType: string) => {
      setNewItemIndicators(prev => ({ ...prev, [countType]: false }));
      // Also update localStorage when user visits the page
      if (selectedCompany?.id) {
        setLastViewedTimestamp(countType, selectedCompany.id);
      }
    },
    [selectedCompany?.id]
  );

  // localStorage helper functions for persistent notification badges
  const getLastViewedTimestamp = useCallback(
    (pageType: string, companyId: string): number => {
      try {
        const key = `lastViewed_${pageType}_${companyId}`;
        const timestamp = localStorage.getItem(key);
        return timestamp ? parseInt(timestamp, 10) : 0;
      } catch (error) {
        console.error('Error reading from localStorage:', error);
        return 0;
      }
    },
    []
  );

  const setLastViewedTimestamp = useCallback(
    (pageType: string, companyId: string): void => {
      try {
        const key = `lastViewed_${pageType}_${companyId}`;
        const timestamp = Date.now().toString();
        localStorage.setItem(key, timestamp);
      } catch (error) {
        console.error('Error writing to localStorage:', error);
      }
    },
    []
  );

  // Check if there are new items since last view
  const hasNewItemsSinceLastView = useCallback(
    async (pageType: string, companyId: string): Promise<boolean> => {
      if (!user?.id || !companyId) return false;

      const lastViewed = getLastViewedTimestamp(pageType, companyId);
      if (lastViewed === 0) return false; // No previous view recorded, don't show badge on first visit

      try {
        let apiEndpoint = '';
        if (pageType === 'my_leads') {
          apiEndpoint = `/api/leads?companyId=${companyId}&assignedTo=${user.id}`;
        } else if (pageType === 'my_cases') {
          apiEndpoint = `/api/support-cases?companyId=${companyId}&assignedTo=${user.id}`;
        } else if (pageType === 'my_tasks' || pageType === 'my_actions') {
          apiEndpoint = `/api/tasks?companyId=${companyId}&assignedTo=${user.id}&includeArchived=false`;
        } else {
          return false;
        }

        const response = await fetch(apiEndpoint);
        if (!response.ok) return false;

        const data = await response.json();
        let items = [];

        if (pageType === 'my_tasks' || pageType === 'my_actions') {
          // Tasks API returns { tasks: [...] } structure
          items = data.tasks || [];
          // Filter out completed tasks
          items = items.filter((task: any) => task.status !== 'completed');
          // Further filter based on pageType
          if (pageType === 'my_actions') {
            // Actions are tasks with cadence_step_id
            items = items.filter((task: any) => task.cadence_step_id);
          } else {
            // Regular tasks don't have cadence_step_id
            items = items.filter((task: any) => !task.cadence_step_id);
          }
        } else {
          // Other APIs return arrays directly
          items = Array.isArray(data) ? data : [];
        }

        if (!Array.isArray(items)) return false;

        // Check if any items were created/assigned after last viewed time
        return items.some(item => {
          const itemTime = new Date(
            item.created_at || item.assigned_at || 0
          ).getTime();
          return itemTime > lastViewed;
        });
      } catch (error) {
        console.error(`Error checking new items for ${pageType}:`, error);
        return false;
      }
    },
    [user?.id, getLastViewedTimestamp]
  );

  // Update count with animation trigger
  const updateCount = useCallback(
    (countType: keyof Counts, newValue: number) => {
      setCounts(prev => {
        const oldValue = prev[countType];
        if (oldValue !== newValue) {
          triggerAnimation(countType);
          // Trigger red dot only if count increased (new items added)
          if (newValue > oldValue) {
            triggerNewItemIndicator(countType);
          }
        }
        return { ...prev, [countType]: newValue };
      });
    },
    []
  ); // Empty deps like LiveCallBar's handleTicketChange

  // Fetch initial counts
  const fetchInitialCounts = useCallback(async () => {
    if (!selectedCompany?.id || !user?.id) {
      setCounts({
        tickets: 0,
        leads: 0,
        unassigned_leads: 0,
        cases: 0,
        unassigned_cases: 0,
        customers: 0,
        scheduling: 0,
        my_leads: 0,
        my_cases: 0,
        my_tasks: 0,
        my_actions: 0,
      });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [
        ticketsResponse,
        leadsResponse,
        unassignedLeadsResponse,
        casesResponse,
        unassignedCasesResponse,
        customersResponse,
        schedulingLeadsResponse,
        myLeadsResponse,
        myCasesResponse,
        myTasksResponse,
      ] = await Promise.allSettled([
        // Active tickets - use count-only endpoint for performance
        fetch(
          `/api/tickets?companyId=${selectedCompany.id}&includeArchived=false&countOnly=true`
        ),
        // Active leads (new, in_process, quoted)
        fetch(
          `/api/leads?companyId=${selectedCompany.id}&status=new,in_process,quoted`
        ),
        // Unassigned leads with specific statuses (for red dot logic) - assigned to sales team (assigned_to IS NULL) with new, in_process, or quoted status
        fetch(
          `/api/leads?companyId=${selectedCompany.id}&unassigned=true&status=new,in_process,quoted`
        ),
        // Active support cases
        fetch(
          `/api/support-cases?companyId=${selectedCompany.id}&includeArchived=false`
        ),
        // Unassigned support cases only (for red dot logic)
        fetch(`/api/support-cases?companyId=${selectedCompany.id}&status=new`),
        // Total customers
        fetch(`/api/customers?companyId=${selectedCompany.id}`),
        // Scheduling and won leads for scheduling
        fetch(
          `/api/leads?companyId=${selectedCompany.id}&status=scheduling,won`
        ),
        // My assigned leads
        fetch(
          `/api/leads?companyId=${selectedCompany.id}&assignedTo=${user.id}`
        ),
        // My assigned support cases
        fetch(
          `/api/support-cases?companyId=${selectedCompany.id}&assignedTo=${user.id}`
        ),
        // My assigned tasks (excluding completed)
        fetch(
          `/api/tasks?companyId=${selectedCompany.id}&assignedTo=${user.id}&includeArchived=false`
        ),
      ]);

      const newCounts = {
        tickets: 0,
        leads: 0,
        unassigned_leads: 0,
        cases: 0,
        unassigned_cases: 0,
        customers: 0,
        scheduling: 0,
        my_leads: 0,
        my_cases: 0,
        my_tasks: 0,
        my_actions: 0,
      };

      // Process tickets
      if (ticketsResponse.status === 'fulfilled' && ticketsResponse.value.ok) {
        const ticketsData = await ticketsResponse.value.json();
        // Handle new paginated response format
        if (ticketsData.counts) {
          newCounts.tickets = ticketsData.counts.all || 0;
        } else {
          // Fallback for old format (array)
          newCounts.tickets = Array.isArray(ticketsData) ? ticketsData.length : 0;
        }
      }

      // Process leads
      if (leadsResponse.status === 'fulfilled' && leadsResponse.value.ok) {
        const leadsData = await leadsResponse.value.json();
        newCounts.leads = Array.isArray(leadsData) ? leadsData.length : 0;
      }

      // Process unassigned leads
      if (
        unassignedLeadsResponse.status === 'fulfilled' &&
        unassignedLeadsResponse.value.ok
      ) {
        const unassignedLeadsData = await unassignedLeadsResponse.value.json();
        newCounts.unassigned_leads = Array.isArray(unassignedLeadsData)
          ? unassignedLeadsData.length
          : 0;
      }

      // Process support cases
      if (casesResponse.status === 'fulfilled' && casesResponse.value.ok) {
        const casesData = await casesResponse.value.json();
        newCounts.cases = Array.isArray(casesData) ? casesData.length : 0;
      }

      // Process unassigned support cases
      if (
        unassignedCasesResponse.status === 'fulfilled' &&
        unassignedCasesResponse.value.ok
      ) {
        const unassignedCasesData = await unassignedCasesResponse.value.json();
        newCounts.unassigned_cases = Array.isArray(unassignedCasesData)
          ? unassignedCasesData.length
          : 0;
      }

      // Process customers
      if (
        customersResponse.status === 'fulfilled' &&
        customersResponse.value.ok
      ) {
        const customersData = await customersResponse.value.json();
        newCounts.customers = Array.isArray(customersData)
          ? customersData.length
          : 0;
      }

      // Process scheduling leads (ready_to_schedule + scheduled)
      if (
        schedulingLeadsResponse.status === 'fulfilled' &&
        schedulingLeadsResponse.value.ok
      ) {
        const schedulingLeadsData = await schedulingLeadsResponse.value.json();
        newCounts.scheduling = Array.isArray(schedulingLeadsData)
          ? schedulingLeadsData.length
          : 0;
      }

      // Process my assigned leads
      if (myLeadsResponse.status === 'fulfilled' && myLeadsResponse.value.ok) {
        const myLeadsData = await myLeadsResponse.value.json();
        newCounts.my_leads = Array.isArray(myLeadsData)
          ? myLeadsData.length
          : 0;
      }

      // Process my assigned support cases
      if (myCasesResponse.status === 'fulfilled' && myCasesResponse.value.ok) {
        const myCasesData = await myCasesResponse.value.json();
        newCounts.my_cases = Array.isArray(myCasesData)
          ? myCasesData.length
          : 0;
      }

      // Process my assigned tasks (excluding completed)
      if (myTasksResponse.status === 'fulfilled' && myTasksResponse.value.ok) {
        const myTasksData = await myTasksResponse.value.json();
        // Filter out completed tasks from the count
        const activeTasks = Array.isArray(myTasksData.tasks)
          ? myTasksData.tasks.filter((task: any) => task.status !== 'completed')
          : [];
        // Separate actions (tasks with cadence_step_id) from regular tasks
        const actions = activeTasks.filter((task: any) => task.cadence_step_id);
        const regularTasks = activeTasks.filter((task: any) => !task.cadence_step_id);
        newCounts.my_tasks = regularTasks.length;
        newCounts.my_actions = actions.length;
      }

      setCounts(newCounts);
    } catch (err) {
      console.error('Error fetching initial counts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch counts');
    } finally {
      setLoading(false);
    }
  }, [selectedCompany?.id, user?.id]);

  // Check for persistent new item indicators on initialization
  const checkPersistentIndicators = useCallback(async () => {
    if (!selectedCompany?.id || !user?.id) return;

    try {
      // Check for new leads and cases since last view (timestamp-based)
      const [hasNewLeads, hasNewCases] = await Promise.all([
        hasNewItemsSinceLastView('my_leads', selectedCompany.id),
        hasNewItemsSinceLastView('my_cases', selectedCompany.id),
      ]);

      // For tasks and actions, use per-task seen tracking
      const tasksApiEndpoint = `/api/tasks?companyId=${selectedCompany.id}&assignedTo=${user.id}&includeArchived=false`;
      const tasksResponse = await fetch(tasksApiEndpoint);

      let hasNewTasksIndicator = false;
      let hasNewActionsIndicator = false;

      if (tasksResponse.ok) {
        const data = await tasksResponse.json();
        const allTasks = data.tasks || [];

        // Filter out completed tasks
        const activeTasks = allTasks.filter((task: any) => task.status !== 'completed');

        // Separate actions (tasks with cadence_step_id) from regular tasks
        const actions = activeTasks.filter((task: any) => task.cadence_step_id);
        const regularTasks = activeTasks.filter((task: any) => !task.cadence_step_id);

        const currentTaskIds = regularTasks.map((t: any) => t.id);
        const currentActionIds = actions.map((t: any) => t.id);

        // Clean up seen lists - remove IDs that no longer exist
        const seenTasks = getSeenTaskIds(selectedCompany.id);
        const prunedSeenTasks = seenTasks.filter((id: string) => currentTaskIds.includes(id));
        setSeenTaskIds(selectedCompany.id, prunedSeenTasks);

        const seenActions = getSeenActionIds(selectedCompany.id);
        const prunedSeenActions = seenActions.filter((id: string) => currentActionIds.includes(id));
        setSeenActionIds(selectedCompany.id, prunedSeenActions);

        // Check if there are unseen tasks/actions
        hasNewTasksIndicator = hasUnseenTasks(currentTaskIds, selectedCompany.id);
        hasNewActionsIndicator = hasUnseenActions(currentActionIds, selectedCompany.id);
      }

      // Update indicators if there are new items
      setNewItemIndicators(prev => ({
        ...prev,
        my_leads: hasNewLeads,
        my_cases: hasNewCases,
        my_tasks: hasNewTasksIndicator,
        my_actions: hasNewActionsIndicator,
      }));
    } catch (error) {
      console.error('Error checking persistent indicators:', error);
    }
  }, [selectedCompany?.id, user?.id, hasNewItemsSinceLastView]);

  // Initial data fetch - separate from subscriptions
  useEffect(() => {
    if (companyLoading) return; // Wait for company to load
    fetchInitialCounts();
    checkPersistentIndicators();
  }, [companyLoading, fetchInitialCounts, checkPersistentIndicators]);

  // Re-check indicators when page becomes visible or when seen status changes
  useEffect(() => {
    if (companyLoading) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPersistentIndicators();
      }
    };

    // Listen for custom event when a task is marked as seen
    const handleSeenStatusChanged = () => {
      checkPersistentIndicators();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener(SEEN_STATUS_CHANGED_EVENT, handleSeenStatusChanged);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener(SEEN_STATUS_CHANGED_EVENT, handleSeenStatusChanged);
    };
  }, [companyLoading, checkPersistentIndicators]);

  // Broadcast-based realtime subscription for all count updates
  // This replaces individual Postgres Changes subscriptions with a single Broadcast channel
  useEffect(() => {
    if (companyLoading) return; // Wait for company to load
    if (!selectedCompany?.id || !user?.id) return;

    const channelName = `company:${selectedCompany.id}:counts`;
    const isDevelopment = process.env.NODE_ENV === 'development';

    // Track subscription state to prevent duplicate subscriptions
    let isSubscribed = true;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const setupChannel = () => {
      if (!isSubscribed) return null;

      const supabase = createClient();
      const channel = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: true, ack: true },
          },
        })
        .on('broadcast', { event: 'count_update' }, async payload => {
          const { table, company_id } = payload.payload;

          // Verify this is for our company
          if (company_id !== selectedCompany.id) {
            return;
          }

          try {
            // Update counts based on which table changed
            switch (table) {
              case 'tickets':
                const ticketsResponse = await fetch(
                  `/api/tickets?companyId=${selectedCompany.id}&includeArchived=false&countOnly=true`
                );
                if (ticketsResponse.ok) {
                  const ticketsData = await ticketsResponse.json();
                  // Handle new paginated response format
                  updateCount(
                    'tickets',
                    ticketsData.counts?.all || 0
                  );
                }
                break;

              case 'leads':
                const [
                  activeLeadsResponse,
                  unassignedLeadsResponse,
                  schedulingLeadsResponse,
                  myLeadsResponse,
                ] = await Promise.all([
                  fetch(
                    `/api/leads?companyId=${selectedCompany.id}&status=new,in_process,quoted`
                  ),
                  fetch(
                    `/api/leads?companyId=${selectedCompany.id}&unassigned=true&status=new,in_process,quoted`
                  ),
                  fetch(
                    `/api/leads?companyId=${selectedCompany.id}&status=scheduling,won`
                  ),
                  fetch(
                    `/api/leads?companyId=${selectedCompany.id}&assignedTo=${user.id}`
                  ),
                ]);

                if (activeLeadsResponse.ok) {
                  const activeLeadsData = await activeLeadsResponse.json();
                  updateCount(
                    'leads',
                    Array.isArray(activeLeadsData) ? activeLeadsData.length : 0
                  );
                }
                if (unassignedLeadsResponse.ok) {
                  const unassignedLeadsData =
                    await unassignedLeadsResponse.json();
                  updateCount(
                    'unassigned_leads',
                    Array.isArray(unassignedLeadsData)
                      ? unassignedLeadsData.length
                      : 0
                  );
                }
                if (schedulingLeadsResponse.ok) {
                  const schedulingLeadsData =
                    await schedulingLeadsResponse.json();
                  updateCount(
                    'scheduling',
                    Array.isArray(schedulingLeadsData)
                      ? schedulingLeadsData.length
                      : 0
                  );
                }
                if (myLeadsResponse.ok) {
                  const myLeadsData = await myLeadsResponse.json();
                  updateCount(
                    'my_leads',
                    Array.isArray(myLeadsData) ? myLeadsData.length : 0
                  );
                }
                break;

              case 'support_cases':
                const [casesResponse, unassignedCasesResponse, myCasesResponse] =
                  await Promise.all([
                    fetch(
                      `/api/support-cases?companyId=${selectedCompany.id}&includeArchived=false`
                    ),
                    fetch(
                      `/api/support-cases?companyId=${selectedCompany.id}&status=new`
                    ),
                    fetch(
                      `/api/support-cases?companyId=${selectedCompany.id}&assignedTo=${user.id}`
                    ),
                  ]);

                if (casesResponse.ok) {
                  const casesData = await casesResponse.json();
                  updateCount(
                    'cases',
                    Array.isArray(casesData) ? casesData.length : 0
                  );
                }
                if (unassignedCasesResponse.ok) {
                  const unassignedCasesData =
                    await unassignedCasesResponse.json();
                  updateCount(
                    'unassigned_cases',
                    Array.isArray(unassignedCasesData)
                      ? unassignedCasesData.length
                      : 0
                  );
                }
                if (myCasesResponse.ok) {
                  const myCasesData = await myCasesResponse.json();
                  updateCount(
                    'my_cases',
                    Array.isArray(myCasesData) ? myCasesData.length : 0
                  );
                }
                break;

              case 'customers':
                const customersResponse = await fetch(
                  `/api/customers?companyId=${selectedCompany.id}`
                );
                if (customersResponse.ok) {
                  const customersData = await customersResponse.json();
                  updateCount(
                    'customers',
                    Array.isArray(customersData) ? customersData.length : 0
                  );
                }
                break;

              case 'tasks':
                const tasksResponse = await fetch(
                  `/api/tasks?companyId=${selectedCompany.id}&assignedTo=${user.id}&includeArchived=false`
                );
                if (tasksResponse.ok) {
                  const tasksData = await tasksResponse.json();
                  const activeTasks = Array.isArray(tasksData.tasks)
                    ? tasksData.tasks.filter(
                        (task: any) => task.status !== 'completed'
                      )
                    : [];
                  // Separate actions (tasks with cadence_step_id) from regular tasks
                  const actions = activeTasks.filter((task: any) => task.cadence_step_id);
                  const regularTasks = activeTasks.filter((task: any) => !task.cadence_step_id);
                  updateCount('my_tasks', regularTasks.length);
                  updateCount('my_actions', actions.length);
                }
                break;

              default:
                // Unknown table - no action needed
            }
          } catch (error) {
            // Only log in development, suppress in production to reduce noise
            if (isDevelopment) {
              console.error(`Error updating ${table} count:`, error);
            }
          }
        })
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            // Successfully subscribed, reset reconnect attempts
            reconnectAttempts = 0;
          } else if (status === 'CHANNEL_ERROR') {
            // Only log error once in development, not repeatedly
            if (isDevelopment && reconnectAttempts === 0) {
              console.warn(`⚠️ Realtime counts channel error: ${channelName}`);
            }

            // Attempt to reconnect with exponential backoff
            if (reconnectAttempts < maxReconnectAttempts && isSubscribed) {
              reconnectAttempts++;
              const backoffDelay = Math.min(1000 * Math.pow(2, reconnectAttempts), 10000);

              if (isDevelopment) {
                console.log(`🔄 Reconnecting in ${backoffDelay}ms (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
              }

              reconnectTimeout = setTimeout(() => {
                if (isSubscribed) {
                  supabase.removeChannel(channel);
                  setupChannel();
                }
              }, backoffDelay);
            }
          } else if (status === 'TIMED_OUT') {
            // Only log timeout once in development
            if (isDevelopment && reconnectAttempts === 0) {
              console.warn(`⏱️ Realtime counts timed out: ${channelName}`);
            }
          } else if (status === 'CLOSED') {
            if (isDevelopment) {
              console.log(`🔌 Realtime counts channel closed: ${channelName}`);
            }
          }
        });

      return channel;
    };

    const channel = setupChannel();

    return () => {
      isSubscribed = false;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (channel) {
        const supabase = createClient();
        supabase.removeChannel(channel);
      }
    };
  }, [selectedCompany?.id, user?.id, companyLoading]);

  return {
    counts,
    animations,
    newItemIndicators,
    loading,
    error,
    refreshCounts: fetchInitialCounts,
    clearNewItemIndicator,
    refreshIndicators: checkPersistentIndicators,
  };
}
