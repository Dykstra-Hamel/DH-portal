'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { useUser } from '@/hooks/useUser';

interface Counts {
  tickets: number;
  leads: number;
  cases: number;
  customers: number;
  scheduling: number; // Won leads count
  my_leads: number; // Leads assigned to current user
  my_cases: number; // Support cases assigned to current user
}

interface CountAnimation {
  [key: string]: boolean;
}

interface NewItemIndicators {
  [key: string]: boolean;
}

export function useRealtimeCounts() {
  const [counts, setCounts] = useState<Counts>({
    tickets: 0,
    leads: 0,
    cases: 0,
    customers: 0,
    scheduling: 0,
    my_leads: 0,
    my_cases: 0,
  });

  const [animations, setAnimations] = useState<CountAnimation>({});
  const [newItemIndicators, setNewItemIndicators] = useState<NewItemIndicators>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { user } = useUser();
  const { selectedCompany } = useCompany();
  const companyId = selectedCompany?.id;
  const supabase = useMemo(() => createClient(), []);

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
  const clearNewItemIndicator = useCallback((countType: string) => {
    setNewItemIndicators(prev => ({ ...prev, [countType]: false }));
    // Also update localStorage when user visits the page
    if (companyId) {
      setLastViewedTimestamp(countType, companyId);
    }
  }, [companyId]);

  // localStorage helper functions for persistent notification badges
  const getLastViewedTimestamp = useCallback((pageType: string, companyId: string): number => {
    try {
      const key = `lastViewed_${pageType}_${companyId}`;
      const timestamp = localStorage.getItem(key);
      return timestamp ? parseInt(timestamp, 10) : 0;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return 0;
    }
  }, []);

  const setLastViewedTimestamp = useCallback((pageType: string, companyId: string): void => {
    try {
      const key = `lastViewed_${pageType}_${companyId}`;
      const timestamp = Date.now().toString();
      localStorage.setItem(key, timestamp);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  }, []);

  // Check if there are new items since last view
  const hasNewItemsSinceLastView = useCallback(async (pageType: string, companyId: string): Promise<boolean> => {
    if (!user?.id || !companyId) return false;

    const lastViewed = getLastViewedTimestamp(pageType, companyId);
    if (lastViewed === 0) return false; // No previous view recorded, don't show badge on first visit

    try {
      let apiEndpoint = '';
      if (pageType === 'my_leads') {
        apiEndpoint = `/api/leads?companyId=${companyId}&assignedTo=${user.id}`;
      } else if (pageType === 'my_cases') {
        apiEndpoint = `/api/support-cases?companyId=${companyId}&assignedTo=${user.id}`;
      } else {
        return false;
      }

      const response = await fetch(apiEndpoint);
      if (!response.ok) return false;

      const items = await response.json();
      if (!Array.isArray(items)) return false;

      // Check if any items were created/assigned after last viewed time
      return items.some(item => {
        const itemTime = new Date(item.created_at || item.assigned_at || 0).getTime();
        return itemTime > lastViewed;
      });
    } catch (error) {
      console.error(`Error checking new items for ${pageType}:`, error);
      return false;
    }
  }, [user?.id, getLastViewedTimestamp]);

  // Check for persistent new item indicators on initialization
  const checkPersistentIndicators = useCallback(async () => {
    if (!companyId || !user?.id) return;

    try {
      // Check for new leads and cases since last view
      const [hasNewLeads, hasNewCases] = await Promise.all([
        hasNewItemsSinceLastView('my_leads', companyId),
        hasNewItemsSinceLastView('my_cases', companyId)
      ]);

      // Update indicators if there are new items
      setNewItemIndicators(prev => ({
        ...prev,
        my_leads: hasNewLeads,
        my_cases: hasNewCases
      }));
    } catch (error) {
      console.error('Error checking persistent indicators:', error);
    }
  }, [companyId, user?.id, hasNewItemsSinceLastView]);

  // Update count with animation trigger
  const updateCount = useCallback((countType: keyof Counts, newValue: number) => {
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
  }, [triggerAnimation, triggerNewItemIndicator]);

  // Fetch initial counts
  const fetchInitialCounts = useCallback(async () => {
    if (!companyId || !user?.id) {
      setCounts({
        tickets: 0,
        leads: 0,
        cases: 0,
        customers: 0,
        scheduling: 0,
        my_leads: 0,
        my_cases: 0,
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
        casesResponse,
        customersResponse,
        wonLeadsResponse,
        myLeadsResponse,
        myCasesResponse,
      ] = await Promise.allSettled([
        // Active tickets
        fetch(`/api/tickets?companyId=${companyId}&includeArchived=false`),
        // New leads
        fetch(`/api/leads?companyId=${companyId}&status=new`),
        // Active support cases
        fetch(`/api/support-cases?companyId=${companyId}&includeArchived=false`),
        // Total customers
        fetch(`/api/customers?companyId=${companyId}`),
        // Won leads for scheduling
        fetch(`/api/leads?companyId=${companyId}&status=won`),
        // My assigned leads
        fetch(`/api/leads?companyId=${companyId}&assignedTo=${user.id}`),
        // My assigned support cases
        fetch(`/api/support-cases?companyId=${companyId}&assignedTo=${user.id}`),
      ]);

      const newCounts = {
        tickets: 0,
        leads: 0,
        cases: 0,
        customers: 0,
        scheduling: 0,
        my_leads: 0,
        my_cases: 0,
      };

      // Process tickets
      if (ticketsResponse.status === 'fulfilled' && ticketsResponse.value.ok) {
        const ticketsData = await ticketsResponse.value.json();
        newCounts.tickets = Array.isArray(ticketsData) ? ticketsData.length : 0;
      }

      // Process leads
      if (leadsResponse.status === 'fulfilled' && leadsResponse.value.ok) {
        const leadsData = await leadsResponse.value.json();
        newCounts.leads = Array.isArray(leadsData) ? leadsData.length : 0;
      }

      // Process support cases
      if (casesResponse.status === 'fulfilled' && casesResponse.value.ok) {
        const casesData = await casesResponse.value.json();
        newCounts.cases = Array.isArray(casesData) ? casesData.length : 0;
      }

      // Process customers
      if (customersResponse.status === 'fulfilled' && customersResponse.value.ok) {
        const customersData = await customersResponse.value.json();
        newCounts.customers = Array.isArray(customersData) ? customersData.length : 0;
      }


      // Process won leads (scheduling)
      if (wonLeadsResponse.status === 'fulfilled' && wonLeadsResponse.value.ok) {
        const wonLeadsData = await wonLeadsResponse.value.json();
        newCounts.scheduling = Array.isArray(wonLeadsData) ? wonLeadsData.length : 0;
      }

      // Process my assigned leads
      if (myLeadsResponse.status === 'fulfilled' && myLeadsResponse.value.ok) {
        const myLeadsData = await myLeadsResponse.value.json();
        newCounts.my_leads = Array.isArray(myLeadsData) ? myLeadsData.length : 0;
      }

      // Process my assigned support cases
      if (myCasesResponse.status === 'fulfilled' && myCasesResponse.value.ok) {
        const myCasesData = await myCasesResponse.value.json();
        newCounts.my_cases = Array.isArray(myCasesData) ? myCasesData.length : 0;
      }

      setCounts(newCounts);
    } catch (err) {
      console.error('Error fetching initial counts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch counts');
    } finally {
      setLoading(false);
    }
  }, [companyId, user?.id]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!companyId || !user) return;

    const channels: any[] = [];

    try {
      // Subscribe to tickets changes
      const ticketsChannel = supabase
        .channel('tickets_count_channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tickets',
            filter: `company_id=eq.${companyId}`,
          },
          async (payload) => {
            // Refetch tickets count
            try {
              const response = await fetch(`/api/tickets?companyId=${companyId}&includeArchived=false`);
              if (response.ok) {
                const data = await response.json();
                updateCount('tickets', Array.isArray(data) ? data.length : 0);
              }
            } catch (error) {
              console.error('Error updating tickets count:', error);
            }
          }
        )
        .subscribe();

      // Subscribe to leads changes
      const leadsChannel = supabase
        .channel('leads_count_channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'leads',
            filter: `company_id=eq.${companyId}`,
          },
          async (payload) => {
            // Refetch new leads, won leads, and my assigned leads
            try {
              const [newLeadsResponse, wonLeadsResponse, myLeadsResponse] = await Promise.all([
                fetch(`/api/leads?companyId=${companyId}&status=new`),
                fetch(`/api/leads?companyId=${companyId}&status=won`),
                fetch(`/api/leads?companyId=${companyId}&assignedTo=${user.id}`),
              ]);

              if (newLeadsResponse.ok) {
                const newLeadsData = await newLeadsResponse.json();
                updateCount('leads', Array.isArray(newLeadsData) ? newLeadsData.length : 0);
              }

              if (wonLeadsResponse.ok) {
                const wonLeadsData = await wonLeadsResponse.json();
                updateCount('scheduling', Array.isArray(wonLeadsData) ? wonLeadsData.length : 0);
              }

              if (myLeadsResponse.ok) {
                const myLeadsData = await myLeadsResponse.json();
                updateCount('my_leads', Array.isArray(myLeadsData) ? myLeadsData.length : 0);
              }
            } catch (error) {
              console.error('Error updating leads count:', error);
            }
          }
        )
        .subscribe();

      // Subscribe to support cases changes
      const casesChannel = supabase
        .channel('support_cases_count_channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'support_cases',
            filter: `company_id=eq.${companyId}`,
          },
          async (payload) => {
            // Refetch support cases count and my assigned cases
            try {
              const [casesResponse, myCasesResponse] = await Promise.all([
                fetch(`/api/support-cases?companyId=${companyId}&includeArchived=false`),
                fetch(`/api/support-cases?companyId=${companyId}&assignedTo=${user.id}`),
              ]);

              if (casesResponse.ok) {
                const casesData = await casesResponse.json();
                updateCount('cases', Array.isArray(casesData) ? casesData.length : 0);
              }

              if (myCasesResponse.ok) {
                const myCasesData = await myCasesResponse.json();
                updateCount('my_cases', Array.isArray(myCasesData) ? myCasesData.length : 0);
              }
            } catch (error) {
              console.error('Error updating support cases count:', error);
            }
          }
        )
        .subscribe();

      // Subscribe to customers changes
      const customersChannel = supabase
        .channel('customers_count_channel')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'customers',
            filter: `company_id=eq.${companyId}`,
          },
          async (payload) => {
            // Refetch customers count
            try {
              const response = await fetch(`/api/customers?companyId=${companyId}`);
              if (response.ok) {
                const data = await response.json();
                updateCount('customers', Array.isArray(data) ? data.length : 0);
              }
            } catch (error) {
              console.error('Error updating customers count:', error);
            }
          }
        )
        .subscribe();

      channels.push(ticketsChannel, leadsChannel, casesChannel, customersChannel);

      // Initial fetch
      fetchInitialCounts();

      // Check for persistent new item indicators from localStorage
      checkPersistentIndicators();

      // Cleanup subscriptions
      return () => {
        channels.forEach(channel => {
          if (channel) {
            supabase.removeChannel(channel);
          }
        });
      };
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
      setError('Failed to set up real-time updates');
    }
  }, [companyId, user, supabase, fetchInitialCounts, updateCount, checkPersistentIndicators]);

  return {
    counts,
    animations,
    newItemIndicators,
    loading,
    error,
    refreshCounts: fetchInitialCounts,
    clearNewItemIndicator,
  };
}