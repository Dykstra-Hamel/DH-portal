import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Lead } from '@/types/lead';
import { CompleteTaskModal } from '@/components/Common/CompleteTaskModal/CompleteTaskModal';
import { ServiceConfirmationModal } from '@/components/Common/ServiceConfirmationModal/ServiceConfirmationModal';
import { useUser } from '@/hooks/useUser';
import { usePricingSettings } from '@/hooks/usePricingSettings';
import { useQuoteRealtime } from '@/hooks/useQuoteRealtime';
import { authenticatedFetch, adminAPI } from '@/lib/api-client';
import {
  createCustomerChannel,
  removeCustomerChannel,
  subscribeToCustomerUpdates,
} from '@/lib/realtime/customer-channel';
import {
  generateHomeSizeOptions,
  generateYardSizeOptions,
  findSizeOptionByValue,
} from '@/lib/pricing-calculations';
import styles from './LeadStepContent.module.scss';
import { LeadDetailsSidebar } from './components/LeadDetailsSidebar/LeadDetailsSidebar';
import { LeadSchedulingSection } from './components/LeadSchedulingSection';
import { LeadContactSection } from './components/LeadContactSection';
import { LeadQuoteSection } from './components/LeadQuoteSection';

interface LeadStepContentProps {
  lead: Lead;
  isAdmin: boolean;
  onLeadUpdate?: (updatedLead?: Lead) => void;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
  onRequestUndo?: (undoHandler: () => Promise<void>) => void;
  onEmailQuote?: () => void;
  onFinalizeSale?: (handler: () => void) => void;
}

export function LeadStepContent({
  lead,
  isAdmin,
  onLeadUpdate,
  onShowToast,
  onRequestUndo,
  onEmailQuote,
  onFinalizeSale,
}: LeadStepContentProps) {
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [isAssignmentDropdownOpen, setIsAssignmentDropdownOpen] =
    useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  const [showCompleteTaskModal, setShowCompleteTaskModal] = useState(false);
  const [pendingActivity, setPendingActivity] = useState<{
    type: string;
    notes: string;
  } | null>(null);

  // Service Confirmation state
  const [showServiceConfirmationModal, setShowServiceConfirmationModal] =
    useState(false);
  const [scheduledDate, setScheduledDate] = useState<string>(
    lead.scheduled_date || ''
  );
  const [scheduledTime, setScheduledTime] = useState<string>(
    lead.scheduled_time || ''
  );
  const [confirmationNote, setConfirmationNote] = useState<string>('');

  // Refs
  const pestDropdownRef = useRef<HTMLDivElement>(null);
  const additionalPestDropdownRef = useRef<HTMLDivElement>(null);
  const assignmentDropdownRef = useRef<HTMLDivElement>(null);
  const customerChannelRef = useRef<any>(null);

  const [homeSize, setHomeSize] = useState<number | ''>('');
  const [yardSize, setYardSize] = useState<number | ''>('');
  const [selectedHomeSizeOption, setSelectedHomeSizeOption] =
    useState<string>('');
  const [selectedYardSizeOption, setSelectedYardSizeOption] =
    useState<string>('');

  // Quote step state
  const [selectedPests, setSelectedPests] = useState<string[]>([]);
  const [additionalPests, setAdditionalPests] = useState<string[]>([]);
  const [isPestDropdownOpen, setIsPestDropdownOpen] = useState(false);
  const [isAdditionalPestDropdownOpen, setIsAdditionalPestDropdownOpen] =
    useState(false);
  const [pestOptions, setPestOptions] = useState<any[]>([]);
  const initialLineItemCreatedRef = useRef(false);
  const lineItemCreationLockRef = useRef<Set<number>>(new Set());
  const discountsFetchedRef = useRef<Set<string>>(new Set());
  const [serviceSelections, setServiceSelections] = useState<
    Array<{
      id: string;
      servicePlan: any | null;
      displayOrder: number;
      frequency: string;
      discount: string;
      customInitialPrice?: number;
      customRecurringPrice?: number;
      isCustomPriced?: boolean;
    }>
  >([
    {
      id: '1',
      servicePlan: null,
      displayOrder: 0,
      frequency: '',
      discount: '',
    }, // First selection always exists
  ]);

  const [calculatedPrices, setCalculatedPrices] = useState<
    Record<
      number,
      {
        initial: number;
        recurring: number;
      }
    >
  >({});
  const [allServicePlans, setAllServicePlans] = useState<any[]>([]);
  const [loadingPestOptions, setLoadingPestOptions] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingServicePlans, setLoadingServicePlans] = useState(false);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [serviceFrequency, setServiceFrequency] = useState<string>('');
  const [discount, setDiscount] = useState<string>('');
  const [availableDiscounts, setAvailableDiscounts] = useState<
    Record<
      string,
      Array<{
        id: string;
        name: string;
        description: string | null;
        discount_type: 'percentage' | 'fixed_amount';
        discount_value: number;
        applies_to_price: 'initial' | 'recurring' | 'both';
        requires_manager: boolean;
      }>
    >
  >({});

  // Add-on services state
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  const [eligibleAddOns, setEligibleAddOns] = useState<any[]>([]);
  const [loadingAddOns, setLoadingAddOns] = useState(false);

  const [preferredDate, setPreferredDate] = useState<string>('');
  const [preferredTime, setPreferredTime] = useState<string>('');

  // Contact Log activity state
  const [selectedActionType, setSelectedActionType] = useState<string>('');
  const [activityNotes, setActivityNotes] = useState<string>('');
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);
  const [nextTask, setNextTask] = useState<any | null>(null);
  const [loadingNextTask, setLoadingNextTask] = useState(false);
  const [hasActiveCadence, setHasActiveCadence] = useState<boolean | null>(
    null
  );
  const [selectedCadenceId, setSelectedCadenceId] = useState<string | null>(
    null
  );

  const { user, profile } = useUser();
  const { settings: pricingSettings } = usePricingSettings(lead.company_id);

  // Real-time quote updates - single source of truth
  const {
    quote,
    isUpdating: isQuoteUpdating,
    broadcastUpdate: broadcastQuoteUpdate,
  } = useQuoteRealtime({
    leadId: lead.id,
    userId: user?.id,
    enabled: lead.lead_status === 'quoted' || lead.lead_status === 'scheduling',
  });

  // Set default assignee to current user when component loads
  useEffect(() => {
    if (user?.id && !selectedAssignee) {
      setSelectedAssignee(user.id);
    }
  }, [user?.id, selectedAssignee]);

  // Set up customer realtime channel for broadcasting updates
  useEffect(() => {
    if (!lead.customer?.id) {
      // Clean up existing channel if no customer
      if (customerChannelRef.current) {
        removeCustomerChannel(customerChannelRef.current);
        customerChannelRef.current = null;
      }
      return;
    }

    // Create customer channel for broadcasting
    const channel = createCustomerChannel(lead.customer.id);
    customerChannelRef.current = channel;

    // Must subscribe to the channel before we can broadcast on it
    subscribeToCustomerUpdates(channel, () => {
      // Empty callback - channel subscription required for broadcasting
    });

    // Cleanup on unmount or when customer ID changes
    return () => {
      if (customerChannelRef.current) {
        removeCustomerChannel(customerChannelRef.current);
        customerChannelRef.current = null;
      }
    };
  }, [lead.customer?.id]);

  // Close pest dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pestDropdownRef.current &&
        !pestDropdownRef.current.contains(event.target as Node)
      ) {
        setIsPestDropdownOpen(false);
      }
      if (
        additionalPestDropdownRef.current &&
        !additionalPestDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAdditionalPestDropdownOpen(false);
      }
      if (
        assignmentDropdownRef.current &&
        !assignmentDropdownRef.current.contains(event.target as Node)
      ) {
        setIsAssignmentDropdownOpen(false);
      }
    };

    if (
      isPestDropdownOpen ||
      isAdditionalPestDropdownOpen ||
      isAssignmentDropdownOpen
    ) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [
    isPestDropdownOpen,
    isAdditionalPestDropdownOpen,
    isAssignmentDropdownOpen,
  ]);

  // Pre-fill preferred date and time from lead data
  useEffect(() => {
    if (lead.requested_date && !preferredDate) {
      setPreferredDate(lead.requested_date);
    }
    if (lead.requested_time && !preferredTime) {
      setPreferredTime(lead.requested_time);
    }
  }, [lead.requested_date, lead.requested_time, preferredDate, preferredTime]);

  // Pre-fill home size and yard size from service address or quote
  useEffect(() => {
    // Priority 1: Load from quote if available
    if (quote?.home_size_range && selectedHomeSizeOption === '') {
      setSelectedHomeSizeOption(quote.home_size_range);
    }
    if (quote?.yard_size_range && selectedYardSizeOption === '') {
      setSelectedYardSizeOption(quote.yard_size_range);
    }

    // Priority 2: Load from service address if no quote data
    if (
      !quote?.home_size_range &&
      lead.primary_service_address?.home_size_range &&
      selectedHomeSizeOption === ''
    ) {
      setSelectedHomeSizeOption(lead.primary_service_address.home_size_range);
    }
    if (
      !quote?.yard_size_range &&
      lead.primary_service_address?.yard_size_range &&
      selectedYardSizeOption === ''
    ) {
      setSelectedYardSizeOption(lead.primary_service_address.yard_size_range);
    }
  }, [
    lead.primary_service_address?.home_size_range,
    lead.primary_service_address?.yard_size_range,
    quote?.home_size_range,
    quote?.yard_size_range,
    selectedHomeSizeOption,
    selectedYardSizeOption,
  ]);

  // Pre-fill service frequency and discount from quote line items
  useEffect(() => {
    const firstLineItem = quote?.line_items?.[0];
    if (firstLineItem) {
      // Pre-fill service frequency
      if (firstLineItem.service_frequency && serviceFrequency === '') {
        setServiceFrequency(firstLineItem.service_frequency);
      }
      // Pre-fill discount
      if (firstLineItem.discount_percentage !== undefined && discount === '') {
        setDiscount(firstLineItem.discount_percentage.toString());
      }
    }
  }, [quote?.line_items, serviceFrequency, discount]);

  // Load pest options when component loads (for Quote step)
  useEffect(() => {
    const loadPestOptions = async () => {
      if (!lead.company_id) return;

      try {
        setLoadingPestOptions(true);
        const response = await adminAPI.getPestOptions(lead.company_id);
        if (response.success) {
          setPestOptions(response.data);
        }
      } catch (error) {
        console.error('Error loading pest options:', error);
      } finally {
        setLoadingPestOptions(false);
      }
    };

    loadPestOptions();
  }, [lead.company_id]);

  // Reset initial line item creation flag and lock when lead changes
  useEffect(() => {
    initialLineItemCreatedRef.current = false;
    lineItemCreationLockRef.current.clear();
  }, [lead.id]);

  // Load next recommended task from cadence and check if cadence exists
  useEffect(() => {
    const loadCadenceData = async () => {
      try {
        setLoadingNextTask(true);

        // Check if lead has active cadence (authenticatedFetch returns JSON directly, not Response)
        const cadenceResult = await authenticatedFetch(
          `/api/leads/${lead.id}/cadence`
        );
        const hasActiveCadence =
          cadenceResult.data !== null &&
          cadenceResult.data.completed_at === null;
        setHasActiveCadence(hasActiveCadence);

        // Only fetch next task if cadence exists
        if (hasActiveCadence) {
          const taskResult = await authenticatedFetch(
            `/api/leads/${lead.id}/next-task`
          );
          setNextTask(taskResult.data);
        } else {
          setNextTask(null);
        }
      } catch (error) {
        console.error('Error loading cadence data:', error);
        // If there's an error, assume no cadence
        setHasActiveCadence(false);
        setNextTask(null);
      } finally {
        setLoadingNextTask(false);
      }
    };

    loadCadenceData();
  }, [lead.id]);

  // Calculate and store calculated prices for custom pricing display
  useEffect(() => {
    if (!quote || !pricingSettings) return;

    const newCalculatedPrices: Record<
      number,
      { initial: number; recurring: number }
    > = {};

    serviceSelections.forEach(selection => {
      if (!selection.servicePlan) return;

      const lineItem = quote.line_items?.find(
        item => item.display_order === selection.displayOrder
      );

      if (lineItem && !lineItem.is_custom_priced) {
        // Use initial_price and recurring_price which are the calculated values before discounts
        newCalculatedPrices[selection.displayOrder] = {
          initial: lineItem.initial_price,
          recurring: lineItem.recurring_price,
        };
      }
    });

    setCalculatedPrices(newCalculatedPrices);
  }, [quote, serviceSelections, pricingSettings]);

  // Pre-populate pests from quote or lead - runs separately to avoid reloading pest options
  useEffect(() => {
    if (pestOptions.length === 0) return;

    // Pre-populate with quote.primary_pest if available, otherwise use lead.pest_type
    const primaryPestValue = quote?.primary_pest || lead.pest_type;

    if (primaryPestValue) {
      const matchingPest = pestOptions.find(
        (pest: any) =>
          pest.name.toLowerCase() === primaryPestValue?.toLowerCase() ||
          pest.slug === primaryPestValue
      );
      if (matchingPest && !selectedPests.includes(matchingPest.id)) {
        setSelectedPests([matchingPest.id]);
      }
    }

    // Pre-populate additional pests from quote.additional_pests
    if (quote?.additional_pests && quote.additional_pests.length > 0) {
      const additionalPestIds = pestOptions
        .filter((pest: any) =>
          quote.additional_pests?.some(
            (pestName: string) =>
              pestName.toLowerCase() === pest.name?.toLowerCase() ||
              pestName.toLowerCase() === pest.custom_label?.toLowerCase()
          )
        )
        .map((pest: any) => pest.id);

      setAdditionalPests(additionalPestIds);

      // Add to selected pests if not already included
      setSelectedPests(prev => {
        const primaryPest = prev[0];
        if (primaryPest) {
          // Filter out any duplicates and ensure primary is first
          const uniqueAdditional = additionalPestIds.filter(
            (id: string) => id !== primaryPest
          );
          return [primaryPest, ...uniqueAdditional];
        }
        return additionalPestIds;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote?.additional_pests, lead.pest_type, pestOptions.length]);

  /**
   * Fetches available discounts for a specific service plan
   * Memoized with useCallback to prevent unnecessary re-renders
   */
  const fetchDiscountsForPlan = useCallback(
    async (planId: string) => {
      if (!profile) return [];

      try {
        const isManager =
          profile?.role === 'admin' || profile?.role === 'super_admin';
        const response = await fetch(
          `/api/companies/${lead.company_id}/discounts/available?planId=${planId}&userIsManager=${isManager}`
        );

        if (!response.ok) {
          console.error('Failed to fetch discounts');
          return [];
        }

        const data = await response.json();
        return data.discounts || [];
      } catch (err) {
        console.error('Error fetching discounts:', err);
        return [];
      }
    },
    [profile, lead.company_id]
  );

  // Re-fetch discounts when profile loads if we have service selections but missing discounts
  useEffect(() => {
    if (!profile) return;

    // Get all plan IDs from current serviceSelections
    const planIds = serviceSelections
      .map(s => s.servicePlan?.id)
      .filter((id): id is string => !!id);

    if (planIds.length === 0) return;

    // Check if we're missing discounts for any of these plans
    const missingDiscounts = planIds.filter(planId => {
      // Either never fetched, or fetched but got empty results
      return (
        !discountsFetchedRef.current.has(planId) ||
        !availableDiscounts[planId] ||
        availableDiscounts[planId].length === 0
      );
    });

    if (missingDiscounts.length === 0) return;

    // Re-fetch discounts now that we have profile
    const refetchDiscounts = async () => {
      setLoadingDiscounts(true);
      try {
        for (const planId of missingDiscounts) {
          const discounts = await fetchDiscountsForPlan(planId);
          setAvailableDiscounts(prev => ({
            ...prev,
            [planId]: discounts,
          }));
          discountsFetchedRef.current.add(planId);
        }
      } finally {
        setLoadingDiscounts(false);
      }
    };

    refetchDiscounts();
  }, [profile, serviceSelections, availableDiscounts, fetchDiscountsForPlan]);

  // Initialize serviceSelections from existing quote line items
  useEffect(() => {
    if (
      quote?.line_items &&
      quote.line_items.length > 0 &&
      allServicePlans.length > 0
    ) {
      // Separate line items by type
      const servicePlanItems = quote.line_items.filter(
        item => item.service_plan_id
      );
      const addonItems = quote.line_items.filter(item => item.addon_service_id);

      // Map service plan line items to service selections
      const selectionsFromLineItems = servicePlanItems
        .sort((a, b) => a.display_order - b.display_order)
        .map((lineItem, index) => {
          // Find the full service plan data
          const servicePlan = allServicePlans.find(
            p => p.id === lineItem.service_plan_id
          );

          return {
            id: (index + 1).toString(),
            servicePlan: servicePlan || null,
            displayOrder: lineItem.display_order,
            frequency: lineItem.service_frequency || '',
            discount:
              (lineItem as any).discount_id ||
              lineItem.discount_percentage?.toString() ||
              '',
          };
        });

      // Extract add-on IDs
      const addonIds = addonItems
        .map(item => item.addon_service_id)
        .filter(Boolean) as string[];

      // Only update if selections are different (prevent infinite loop)
      const currentPlanIds = serviceSelections
        .map(s => s.servicePlan?.id)
        .join(',');
      const newPlanIds = selectionsFromLineItems
        .map(s => s.servicePlan?.id)
        .join(',');

      if (currentPlanIds !== newPlanIds) {
        setServiceSelections(selectionsFromLineItems);
        setSelectedAddOns(addonIds); // Sync add-on selections
        initialLineItemCreatedRef.current = true; // Mark as initialized from existing data

        // Fetch discounts for all service plans
        const fetchAllDiscounts = async () => {
          const planIds = selectionsFromLineItems
            .map(s => s.servicePlan?.id)
            .filter((id): id is string => !!id);

          setLoadingDiscounts(true);
          try {
            for (const planId of planIds) {
              const discounts = await fetchDiscountsForPlan(planId);
              setAvailableDiscounts(prev => ({
                ...prev,
                [planId]: discounts,
              }));
              // Only mark as fetched if we have a profile (prevents marking empty fetches)
              if (profile) {
                discountsFetchedRef.current.add(planId);
              }
            }
          } finally {
            setLoadingDiscounts(false);
          }
        };

        fetchAllDiscounts();
      }
    }
  }, [quote?.line_items, allServicePlans, profile, fetchDiscountsForPlan]);

  // Fetch eligible add-ons when primary service plan changes
  useEffect(() => {
    const fetchEligibleAddOns = async (planId: string) => {
      setLoadingAddOns(true);
      try {
        const response = await fetch(
          `/api/add-on-services/${lead.company_id}/eligible-for-plan/${planId}`
        );
        const result = await response.json();
        if (result.success) {
          const eligible = result.addons.filter((a: any) => a.is_eligible);
          setEligibleAddOns(eligible);
        }
      } catch (error) {
        console.error('Error fetching add-ons:', error);
      } finally {
        setLoadingAddOns(false);
      }
    };

    const primaryPlan = serviceSelections[0]?.servicePlan;

    if (primaryPlan?.id && lead.company_id) {
      fetchEligibleAddOns(primaryPlan.id);
    } else {
      setEligibleAddOns([]);
    }
  }, [serviceSelections[0]?.servicePlan?.id, lead.company_id]);

  // Load service plan for first selection when primary pest is selected
  // ONLY if there are no existing line items (auto-recommendation)
  useEffect(() => {
    const loadServicePlan = async () => {
      const primaryPest = selectedPests[0];

      // Skip if there are already line items (user has made selections)
      if (quote?.line_items && quote.line_items.length > 0) {
        return;
      }

      if (!primaryPest || !lead.company_id) {
        // Clear first selection if no pest
        setServiceSelections(prev =>
          prev.map((sel, idx) =>
            idx === 0 ? { ...sel, servicePlan: null } : sel
          )
        );
        return;
      }

      try {
        setLoadingPlan(true);
        const response = await adminAPI.getServicePlansByPest(
          lead.company_id,
          primaryPest
        );
        if (response.success && response.cheapest_plan) {
          // Cross-reference with allServicePlans to get complete plan data with pest_coverage
          const fullPlan =
            allServicePlans.find(p => p.id === response.cheapest_plan.id) ||
            response.cheapest_plan;

          // Update first service selection with complete plan data
          setServiceSelections(prev =>
            prev.map((sel, idx) =>
              idx === 0 ? { ...sel, servicePlan: fullPlan } : sel
            )
          );

          // Automatically create quote line item if quote exists and no line items exist
          if (quote && !initialLineItemCreatedRef.current) {
            await createOrUpdateQuoteLineItem(fullPlan, 0);
            initialLineItemCreatedRef.current = true;
          }
        } else {
          setServiceSelections(prev =>
            prev.map((sel, idx) =>
              idx === 0 ? { ...sel, servicePlan: null } : sel
            )
          );
        }
      } catch (error) {
        console.error('Error loading service plan:', error);
        setServiceSelections(prev =>
          prev.map((sel, idx) =>
            idx === 0 ? { ...sel, servicePlan: null } : sel
          )
        );
      } finally {
        setLoadingPlan(false);
      }
    };

    loadServicePlan();
    // Only depend on PRIMARY pest (first element), not the entire selectedPests array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPests[0], lead.company_id, allServicePlans, quote?.line_items]);

  // Removed auto-sync useEffect to prevent update loops
  // Line items are now only created/updated on explicit user actions

  // Load all service plans for the company
  useEffect(() => {
    const loadAllServicePlans = async () => {
      if (!lead.company_id) {
        setAllServicePlans([]);
        return;
      }

      try {
        setLoadingServicePlans(true);
        const response = await fetch(
          `/api/admin/service-plans/${lead.company_id}`
        );
        const data = await response.json();

        if (data.success && data.data) {
          setAllServicePlans(data.data);
        } else {
          setAllServicePlans([]);
        }
      } catch (error) {
        console.error('Error loading service plans:', error);
        setAllServicePlans([]);
      } finally {
        setLoadingServicePlans(false);
      }
    };

    loadAllServicePlans();
  }, [lead.company_id]);

  // Quote is now managed by useQuoteRealtime hook - removed manual fetch

  // Expose finalize sale modal trigger to parent
  useEffect(() => {
    if (onFinalizeSale) {
      // Pass a function to the parent that opens the modal
      onFinalizeSale(() => setShowServiceConfirmationModal(true));
    }
  }, [onFinalizeSale]);

  // Generate home size dropdown options
  const homeSizeOptions = useMemo(() => {
    if (!pricingSettings) return [];

    // Use first service selection's plan for size calculations
    const firstPlan = serviceSelections[0]?.servicePlan;
    const servicePlanPricing =
      firstPlan?.home_size_pricing && firstPlan?.yard_size_pricing
        ? {
            home_size_pricing: firstPlan.home_size_pricing,
            yard_size_pricing: firstPlan.yard_size_pricing,
          }
        : undefined;

    return generateHomeSizeOptions(pricingSettings, servicePlanPricing);
  }, [pricingSettings, serviceSelections]);

  // Generate yard size dropdown options
  const yardSizeOptions = useMemo(() => {
    if (!pricingSettings) return [];

    // Use first service selection's plan for size calculations
    const firstPlan = serviceSelections[0]?.servicePlan;
    const servicePlanPricing =
      firstPlan?.home_size_pricing && firstPlan?.yard_size_pricing
        ? {
            home_size_pricing: firstPlan.home_size_pricing,
            yard_size_pricing: firstPlan.yard_size_pricing,
          }
        : undefined;

    return generateYardSizeOptions(pricingSettings, servicePlanPricing);
  }, [pricingSettings, serviceSelections]);

  // Auto-select home size option when homeSize changes
  useEffect(() => {
    if (homeSize && homeSizeOptions.length > 0) {
      const option = findSizeOptionByValue(Number(homeSize), homeSizeOptions);
      if (option) {
        setSelectedHomeSizeOption(option.value);
      }
    }
  }, [homeSize, homeSizeOptions]);

  // Auto-select yard size option when yardSize changes
  useEffect(() => {
    if (yardSize && yardSizeOptions.length > 0) {
      const option = findSizeOptionByValue(Number(yardSize), yardSizeOptions);
      if (option) {
        setSelectedYardSizeOption(option.value);
      }
    }
  }, [yardSize, yardSizeOptions]);

  const currentUser = user
    ? {
        id: user.id,
        name:
          `${user.user_metadata?.first_name || ''} ${user.user_metadata?.last_name || ''}`.trim() ||
          user.email?.split('@')[0] ||
          'Unknown',
        avatar: user.user_metadata?.avatar_url,
      }
    : null;

  const showErrorToast = (message: string) => {
    if (onShowToast) {
      onShowToast(message, 'error');
    }
  };


  const handleCompleteTaskConfirm = async () => {
    if (!pendingActivity) return;

    setIsLoggingActivity(true);
    setShowCompleteTaskModal(false);

    try {
      // Log the activity WITH task completion (the trigger will handle auto-progression)
      const response = await fetch(`/api/leads/${lead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: pendingActivity.type,
          notes: pendingActivity.notes || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log activity');
      }

      onShowToast?.('Activity logged and task marked complete', 'success');
      setActivityNotes('');
      setSelectedActionType('');
      setPendingActivity(null);
      onLeadUpdate?.();
    } catch (error) {
      console.error('Error logging activity:', error);
      onShowToast?.('Failed to log activity', 'error');
    } finally {
      setIsLoggingActivity(false);
    }
  };

  const handleCompleteTaskSkip = async () => {
    if (!pendingActivity) return;

    setIsLoggingActivity(true);
    setShowCompleteTaskModal(false);

    try {
      // Log the activity WITHOUT task completion
      // TODO: We need an API parameter to skip auto-progression
      const response = await fetch(`/api/leads/${lead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: pendingActivity.type,
          notes: pendingActivity.notes || null,
          skip_task_completion: true, // Add this flag
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log activity');
      }

      onShowToast?.('Activity logged successfully', 'success');
      setActivityNotes('');
      setSelectedActionType('');
      setPendingActivity(null);
      onLeadUpdate?.();
    } catch (error) {
      console.error('Error logging activity:', error);
      onShowToast?.('Failed to log activity', 'error');
    } finally {
      setIsLoggingActivity(false);
    }
  };

  const handleCompleteTaskCancel = () => {
    setShowCompleteTaskModal(false);
    setPendingActivity(null);
  };

  const handleLogActivityFromSection = async (
    type: string,
    notes: string,
    matchesTask: boolean
  ) => {
    if (matchesTask) {
      // Show modal to ask if they want to mark task complete
      setPendingActivity({ type, notes });
      setShowCompleteTaskModal(true);
      return;
    }

    // If doesn't match, just log the activity without asking
    setIsLoggingActivity(true);
    try {
      const response = await fetch(`/api/leads/${lead.id}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: type,
          notes: notes || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to log activity');
      }

      onShowToast?.('Activity logged successfully', 'success');
      setActivityNotes('');
      setSelectedActionType('');
      onLeadUpdate?.();
    } catch (error) {
      console.error('Error logging activity:', error);
      onShowToast?.('Failed to log activity', 'error');
    } finally {
      setIsLoggingActivity(false);
    }
  };

  // Wrapper handlers for LeadQuoteSection
  const handlePestsChange = async (primary: string, additional: string[]) => {
    if (primary) {
      await updatePrimaryPest(primary);
    }
    if (additional.length > 0) {
      await updateAdditionalPests(additional);
    }
  };

  const handleHomeSizeChange = async (rangeValue: string) => {
    const oldValue = selectedHomeSizeOption;
    const oldHomeSize = homeSize;

    setSelectedHomeSizeOption(rangeValue);
    const option = homeSizeOptions.find(opt => opt.value === rangeValue);
    if (option) {
      setHomeSize(option.rangeStart);
    }

    // Update quote (which will also update service_address via API)
    if (quote && rangeValue) {
      try {
        const response = await fetch(`/api/quotes/${quote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ home_size_range: rangeValue }),
        });

        if (!response.ok) {
          throw new Error('Failed to update home size range');
        }

        const data = await response.json();

        if (data.success && data.data) {
          await broadcastQuoteUpdate(data.data);
          onShowToast?.('Home size updated successfully', 'success');

          // Provide undo handler
          if (onRequestUndo) {
            const undoHandler = async () => {
              try {
                setSelectedHomeSizeOption(oldValue);
                setHomeSize(oldHomeSize);

                const revertResponse = await fetch(`/api/quotes/${quote.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ home_size_range: oldValue || null }),
                });

                if (!revertResponse.ok) {
                  throw new Error('Failed to undo change');
                }

                const revertData = await revertResponse.json();
                if (revertData.success && revertData.data) {
                  await broadcastQuoteUpdate(revertData.data);
                }

                onShowToast?.('Change undone', 'success');
              } catch (error) {
                console.error('Error undoing change:', error);
                onShowToast?.('Failed to undo change', 'error');
              }
            };

            onRequestUndo(undoHandler);
          }
        }
      } catch (error) {
        console.error('Error updating home size range:', error);
        onShowToast?.('Failed to update home size', 'error');
      }
    }
  };

  const handleYardSizeChange = async (rangeValue: string) => {
    const oldValue = selectedYardSizeOption;
    const oldYardSize = yardSize;

    setSelectedYardSizeOption(rangeValue);
    const option = yardSizeOptions.find(opt => opt.value === rangeValue);
    if (option) {
      setYardSize(option.rangeStart);
    }

    // Update quote (which will also update service_address via API)
    if (quote && rangeValue) {
      try {
        const response = await fetch(`/api/quotes/${quote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ yard_size_range: rangeValue }),
        });

        if (!response.ok) {
          throw new Error('Failed to update yard size range');
        }

        const data = await response.json();

        if (data.success && data.data) {
          await broadcastQuoteUpdate(data.data);
          onShowToast?.('Yard size updated successfully', 'success');

          // Provide undo handler
          if (onRequestUndo) {
            const undoHandler = async () => {
              try {
                setSelectedYardSizeOption(oldValue);
                setYardSize(oldYardSize);

                const revertResponse = await fetch(`/api/quotes/${quote.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ yard_size_range: oldValue || null }),
                });

                if (!revertResponse.ok) {
                  throw new Error('Failed to undo change');
                }

                const revertData = await revertResponse.json();
                if (revertData.success && revertData.data) {
                  await broadcastQuoteUpdate(revertData.data);
                }

                onShowToast?.('Change undone', 'success');
              } catch (error) {
                console.error('Error undoing change:', error);
                onShowToast?.('Failed to undo change', 'error');
              }
            };

            onRequestUndo(undoHandler);
          }
        }
      } catch (error) {
        console.error('Error updating yard size range:', error);
        onShowToast?.('Failed to update yard size', 'error');
      }
    }
  };

  // Update pest_type (primary pest)
  const updatePrimaryPest = async (pestId: string) => {
    if (!quote) {
      console.error('No quote found');
      onShowToast?.('Quote not found. Please try again.', 'error');
      return;
    }

    try {
      // If removing primary pest and no additional pests, clear the quote
      if (!pestId && additionalPests.length === 0) {
        // Delete all line items
        if (quote.line_items && quote.line_items.length > 0) {
          await Promise.all(
            quote.line_items.map(item =>
              fetch(`/api/quote-line-items/${item.id}`, {
                method: 'DELETE',
              })
            )
          );
        }

        // Clear quote pests and reset totals
        const response = await fetch(`/api/quotes/${quote.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            primary_pest: '',
            additional_pests: [],
            total_initial_price: 0,
            total_recurring_price: 0,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to clear quote');
        }

        const data = await response.json();
        if (data.success && data.data) {
          await broadcastQuoteUpdate(data.data);
          // Reset local state
          setServiceSelections([
            {
              id: '1',
              servicePlan: null,
              displayOrder: 0,
              frequency: '',
              discount: '',
            },
          ]);
          initialLineItemCreatedRef.current = false;
          onShowToast?.(
            'Quote cleared - please select a pest to start over',
            'success'
          );
        }
        return;
      }

      // Find the pest to get its name
      const pest = pestOptions.find(p => p.id === pestId);
      const pestName = pest?.custom_label || pest?.name || pestId;

      // Update quote (not lead)
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primary_pest: pestName }),
      });

      if (!response.ok) {
        throw new Error('Failed to update primary pest');
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Broadcast will trigger real-time update
        await broadcastQuoteUpdate(data.data);

        onShowToast?.('Primary pest updated', 'success');
      }
    } catch (error) {
      console.error('Failed to update primary pest:', error);
      onShowToast?.('Failed to update pest selection', 'error');
    }
  };

  // Update additional_pests array
  const updateAdditionalPests = async (pestIds: string[]) => {
    if (!quote) {
      console.error('No quote found');
      onShowToast?.('Quote not found. Please try again.', 'error');
      return;
    }

    try {
      // Convert pest IDs to names
      const pestNames = pestIds.map(id => {
        const pest = pestOptions.find(p => p.id === id);
        return pest?.custom_label || pest?.name || id;
      });

      // Update quote (not lead)
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ additional_pests: pestNames }),
      });

      if (!response.ok) {
        throw new Error('Failed to update additional pests');
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Broadcast will trigger real-time update
        await broadcastQuoteUpdate(data.data);
      }
    } catch (error) {
      console.error('Failed to update additional pests:', error);
      onShowToast?.('Failed to update pest selection', 'error');
    }
  };

  // Handle confirming service and finalizing sale
  const handleConfirmAndFinalize = async (
    confirmedDate: string,
    confirmedTime: string,
    note: string
  ) => {
    try {
      // Update lead status to won and save scheduled date/time
      if (isAdmin) {
        await adminAPI.updateLead(lead.id, {
          lead_status: 'won',
          scheduled_date: confirmedDate,
          scheduled_time: confirmedTime,
        });
      } else {
        await adminAPI.updateUserLead(lead.id, {
          lead_status: 'won',
          scheduled_date: confirmedDate,
          scheduled_time: confirmedTime,
        });
      }

      // If there's a note, add it to activity log
      if (note.trim()) {
        await fetch('/api/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            company_id: lead.company_id,
            entity_type: 'lead',
            entity_id: lead.id,
            activity_type: 'note_added',
            user_id: user?.id,
            notes: note.trim(),
          }),
        });
      }

      onShowToast?.('Sale finalized successfully!', 'success');

      // Redirect to All Leads page
      window.location.href = '/tickets/leads';
    } catch (error) {
      console.error('Failed to finalize sale:', error);
      onShowToast?.('Failed to finalize sale', 'error');
      throw error;
    }
  };

  // Handle emailing quote to customer - triggers parent modal
  const handleEmailQuote = () => {
    onEmailQuote?.();
  };

  /**
   * Creates or updates a quote line item with size-based price calculations
   * Uses a lock to prevent concurrent executions for the same display order
   */
  const createOrUpdateQuoteLineItem = async (
    servicePlan: any,
    displayOrder: number,
    additionalData?: {
      service_frequency?: string;
      discount_percentage?: number;
      discount_id?: string | null;
      custom_initial_price?: number;
      custom_recurring_price?: number;
      is_custom_priced?: boolean;
    }
  ) => {
    // Check if already creating/updating this display order
    if (lineItemCreationLockRef.current.has(displayOrder)) {
      return;
    }

    // Acquire lock
    lineItemCreationLockRef.current.add(displayOrder);

    try {
      if (!quote) {
        console.error('No quote found');
        onShowToast?.('Quote not found. Please try again.', 'error');
        return;
      }

      if (!pricingSettings) {
        console.error('No pricing settings found');
        onShowToast?.('Pricing settings not configured', 'error');
        return;
      }

      // Get size ranges from quote (single source of truth)
      const homeSizeRange = quote.home_size_range;
      const yardSizeRange = quote.yard_size_range;

      // Find existing line item at this display order
      const existingLineItem = quote.line_items?.find(
        item => item.display_order === displayOrder
      );

      // Prepare the line item data
      const lineItemData: any = {
        id: existingLineItem?.id, // If exists, update it; otherwise create new
        service_plan_id: servicePlan.id,
        display_order: displayOrder,
      };

      // Add service frequency if provided
      if (additionalData?.service_frequency !== undefined) {
        lineItemData.service_frequency = additionalData.service_frequency;
      }

      // Handle custom pricing vs standard pricing
      if (
        additionalData?.is_custom_priced &&
        additionalData?.custom_initial_price !== undefined &&
        additionalData?.custom_recurring_price !== undefined
      ) {
        // Custom pricing - set custom prices and flag
        lineItemData.custom_initial_price = additionalData.custom_initial_price;
        lineItemData.custom_recurring_price =
          additionalData.custom_recurring_price;
        lineItemData.is_custom_priced = true;
        // Don't send discount data when using custom pricing
      } else {
        // Standard pricing - handle discounts
        lineItemData.is_custom_priced = false;

        // Add discount if provided
        if (additionalData?.discount_percentage !== undefined) {
          lineItemData.discount_percentage = additionalData.discount_percentage;
        }

        // Add discount_id if provided (new discount system)
        if (additionalData?.discount_id !== undefined) {
          lineItemData.discount_id = additionalData.discount_id;
          // If explicitly setting to null (removing discount), also clear discount values
          if (additionalData.discount_id === null) {
            lineItemData.discount_percentage = 0;
            lineItemData.discount_amount = 0;
          }
        }
      }

      // Call the quote API to update with the new line item
      const response = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_items: [lineItemData],
          home_size_range: homeSizeRange,
          yard_size_range: yardSizeRange,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quote');
      }

      const data = await response.json();

      if (data.success && data.data) {
        // Broadcast will trigger real-time update
        await broadcastQuoteUpdate(data.data);

        onShowToast?.('Quote updated successfully', 'success');
      }
    } catch (error) {
      console.error('Error creating/updating quote line item:', error);
      onShowToast?.('Failed to update quote', 'error');
    } finally {
      // Always release lock
      lineItemCreationLockRef.current.delete(displayOrder);
    }
  };

  // Add-on line item management functions
  const handleToggleAddon = async (addonId: string) => {
    const isSelected = selectedAddOns.includes(addonId);

    if (isSelected) {
      // Remove add-on
      setSelectedAddOns(prev => prev.filter(id => id !== addonId));
      await removeAddonLineItem(addonId);
    } else {
      // Add add-on
      setSelectedAddOns(prev => [...prev, addonId]);
      await createAddonLineItem(addonId);
    }
  };

  const createAddonLineItem = async (addonId: string) => {
    if (!quote) return;

    try {
      // Fetch add-on details
      const response = await fetch(
        `/api/add-on-services/${lead.company_id}/${addonId}`
      );
      const result = await response.json();

      if (!result.success) throw new Error('Failed to fetch add-on');

      const addon = result.addon;
      const maxOrder = Math.max(
        ...(quote.line_items?.map(i => i.display_order) || [0])
      );

      // Create line item
      const lineItemData = {
        addon_service_id: addon.id,
        display_order: maxOrder + 1,
      };

      const updateResponse = await fetch(`/api/quotes/${quote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_items: [lineItemData] }),
      });

      if (updateResponse.ok) {
        const data = await updateResponse.json();
        if (data.success && data.data) {
          await broadcastQuoteUpdate(data.data);
          onShowToast?.('Add-on service added', 'success');
        }
      }
    } catch (error) {
      console.error('Error adding add-on:', error);
      onShowToast?.('Failed to add add-on service', 'error');
      setSelectedAddOns(prev => prev.filter(id => id !== addonId));
    }
  };

  const removeAddonLineItem = async (addonId: string) => {
    if (!quote) return;

    const addonLineItem = quote.line_items?.find(
      item => item.addon_service_id === addonId
    );

    if (!addonLineItem) return;

    try {
      const response = await fetch(
        `/api/quotes/${quote.id}/line-items/${addonLineItem.id}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        // Refetch the quote to get the updated state
        const quoteResponse = await fetch(`/api/quotes/${quote.id}`);
        if (quoteResponse.ok) {
          const quoteData = await quoteResponse.json();
          if (quoteData.success && quoteData.data) {
            await broadcastQuoteUpdate(quoteData.data);
          }
        }
        onShowToast?.('Add-on service removed', 'success');
      }
    } catch (error) {
      console.error('Error removing add-on:', error);
      onShowToast?.('Failed to remove add-on service', 'error');
      setSelectedAddOns(prev => [...prev, addonId]);
    }
  };

  // Render content based on lead status
  const renderContent = () => {
    // Show all sections simultaneously instead of conditionally based on status
    return (
      <div
        className={styles.leadContentWrapper}
        data-sidebar-expanded={isSidebarExpanded}
      >
        <div className={styles.contentLeft}>
          <LeadContactSection
            lead={lead}
            nextTask={nextTask}
            loadingNextTask={loadingNextTask}
            hasActiveCadence={hasActiveCadence}
            selectedActionType={selectedActionType}
            activityNotes={activityNotes}
            isLoggingActivity={isLoggingActivity}
            selectedCadenceId={selectedCadenceId}
            onActionTypeChange={setSelectedActionType}
            onActivityNotesChange={setActivityNotes}
            onLogActivity={handleLogActivityFromSection}
            onCadenceSelect={setSelectedCadenceId}
            onShowToast={onShowToast}
            onLeadUpdate={onLeadUpdate}
          />
          <LeadQuoteSection
            lead={lead}
            quote={quote}
            isQuoteUpdating={isQuoteUpdating}
            pricingSettings={pricingSettings}
            pestOptions={pestOptions}
            allServicePlans={allServicePlans}
            serviceSelections={serviceSelections}
            selectedPests={selectedPests}
            additionalPests={additionalPests}
            selectedAddOns={selectedAddOns}
            loadingPlan={loadingPlan}
            loadingPestOptions={loadingPestOptions}
            homeSize={homeSize}
            yardSize={yardSize}
            selectedHomeSizeOption={selectedHomeSizeOption}
            selectedYardSizeOption={selectedYardSizeOption}
            homeSizeOptions={homeSizeOptions}
            yardSizeOptions={yardSizeOptions}
            preferredDate={preferredDate}
            preferredTime={preferredTime}
            onPestsChange={handlePestsChange}
            onHomeSizeChange={handleHomeSizeChange}
            onYardSizeChange={handleYardSizeChange}
            onServiceSelectionChange={setServiceSelections}
            onAddOnToggle={handleToggleAddon}
            onPreferredDateChange={setPreferredDate}
            onPreferredTimeChange={setPreferredTime}
            onEmailQuote={handleEmailQuote}
            onShowToast={onShowToast}
            onRequestUndo={onRequestUndo}
            broadcastQuoteUpdate={broadcastQuoteUpdate}
            setSelectedPests={setSelectedPests}
            setAdditionalPests={setAdditionalPests}
            setHomeSize={setHomeSize}
            setYardSize={setYardSize}
            setSelectedHomeSizeOption={setSelectedHomeSizeOption}
            setSelectedYardSizeOption={setSelectedYardSizeOption}
            setPreferredDate={setPreferredDate}
            setPreferredTime={setPreferredTime}
          />
          <LeadSchedulingSection
            lead={lead}
            quote={quote}
            isQuoteUpdating={isQuoteUpdating}
            scheduledDate={scheduledDate}
            scheduledTime={scheduledTime}
            confirmationNote={confirmationNote}
            onScheduledDateChange={setScheduledDate}
            onScheduledTimeChange={setScheduledTime}
            onConfirmationNoteChange={setConfirmationNote}
            onShowServiceConfirmationModal={() =>
              setShowServiceConfirmationModal(true)
            }
            onEmailQuote={handleEmailQuote}
          />
        </div>
        <LeadDetailsSidebar
          lead={lead}
          onShowToast={onShowToast}
          onLeadUpdate={onLeadUpdate}
          onRequestUndo={onRequestUndo}
          customerChannelRef={customerChannelRef}
          isSidebarExpanded={isSidebarExpanded}
          setIsSidebarExpanded={setIsSidebarExpanded}
        />
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      <CompleteTaskModal
        isOpen={showCompleteTaskModal}
        task={
          nextTask
            ? {
                day_number: nextTask.day_number,
                action_type: nextTask.action_type,
                time_of_day: nextTask.time_of_day,
                due_date: nextTask.due_date,
                due_time: nextTask.due_time,
                priority: nextTask.priority,
              }
            : null
        }
        onConfirm={handleCompleteTaskConfirm}
        onSkip={handleCompleteTaskSkip}
        onCancel={handleCompleteTaskCancel}
      />
      <ServiceConfirmationModal
        isOpen={showServiceConfirmationModal}
        onClose={() => setShowServiceConfirmationModal(false)}
        onConfirm={handleConfirmAndFinalize}
        scheduledDate={scheduledDate}
        scheduledTime={scheduledTime}
        confirmationNote={confirmationNote}
        onScheduledDateChange={setScheduledDate}
        onScheduledTimeChange={setScheduledTime}
        onConfirmationNoteChange={setConfirmationNote}
      />
    </>
  );
}
