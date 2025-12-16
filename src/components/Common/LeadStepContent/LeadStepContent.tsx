import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Lead } from '@/types/lead';
import { TabCard, TabItem } from '@/components/Common/TabCard/TabCard';
import { QuoteSummaryCard } from '@/components/Common/QuoteSummaryCard/QuoteSummaryCard';
import { SalesCadenceCard } from '@/components/Common/SalesCadenceCard/SalesCadenceCard';
import { ManageLeadModal } from '@/components/Common/ManageLeadModal/ManageLeadModal';
import { AssignSuccessModal } from '@/components/Common/AssignSuccessModal/AssignSuccessModal';
import { CompleteTaskModal } from '@/components/Common/CompleteTaskModal/CompleteTaskModal';
import { ServiceConfirmationModal } from '@/components/Common/ServiceConfirmationModal/ServiceConfirmationModal';
import { PestSelection } from '@/components/Common/PestSelection/PestSelection';
import { AdditionalPestsSelection } from '@/components/Common/AdditionalPestsSelection/AdditionalPestsSelection';
import { CustomDropdown } from '@/components/Common/CustomDropdown/CustomDropdown';
import EligibleAddOnSelector from '@/components/Quotes/EligibleAddOnSelector/EligibleAddOnSelector';
import { useUser } from '@/hooks/useUser';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import { usePricingSettings } from '@/hooks/usePricingSettings';
import { useQuoteRealtime } from '@/hooks/useQuoteRealtime';
import { authenticatedFetch, adminAPI } from '@/lib/api-client';
import {
  createCustomerChannel,
  removeCustomerChannel,
  subscribeToCustomerUpdates,
} from '@/lib/realtime/customer-channel';
import AudioPlayer from '@/components/Common/AudioPlayer/AudioPlayer';
import {
  generateHomeSizeOptions,
  generateYardSizeOptions,
  findSizeOptionByValue,
} from '@/lib/pricing-calculations';
import {
  SquareUserRound,
  SquareActivity,
  NotebookPen,
  ChevronDown,
  Users,
  Trash2,
  MessageSquareMore,
  Plus,
  CircleOff,
  Phone,
  Mail,
  X,
  CalendarCheck,
  ListCollapse,
} from 'lucide-react';
import styles from './LeadStepContent.module.scss';
import cadenceStyles from '../SalesCadenceCard/SalesCadenceCard.module.scss';
import cardStyles from '@/components/Common/InfoCard/InfoCard.module.scss';
import { LeadDetailsSidebar } from './components/LeadDetailsSidebar/LeadDetailsSidebar';
import { LeadSchedulingSection } from './components/LeadSchedulingSection';
import { LeadContactSection } from './components/LeadContactSection';

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
  const [ticketType, setTicketType] = useState('sales');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [isAssignmentDropdownOpen, setIsAssignmentDropdownOpen] =
    useState(false);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showCallSummary, setShowCallSummary] = useState(false);
  const [showManageLeadModal, setShowManageLeadModal] = useState(false);
  const [showAssignSuccessModal, setShowAssignSuccessModal] = useState(false);
  const [assignedUserInfo, setAssignedUserInfo] = useState<{
    name: string;
    title: string;
    avatar?: string | null;
  } | null>(null);
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
  const initialTabSetRef = useRef(false);
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
  const [activeServiceTab, setActiveServiceTab] = useState('overview');
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

  // Custom pricing expansion state (tracks which service selection has custom pricing expanded)
  const [customPricingExpanded, setCustomPricingExpanded] = useState<
    Record<number, boolean>
  >({});
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
  const [isStartingCadence, setIsStartingCadence] = useState(false);
  const [selectedCadenceId, setSelectedCadenceId] = useState<string | null>(
    null
  );

  const { user, profile } = useUser();
  const { users: assignableUsers } = useAssignableUsers({
    companyId: lead.company_id,
    departmentType: ticketType === 'support' ? 'support' : 'sales',
    enabled: ticketType !== 'junk',
  });
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

  // Helper functions for managing service selections
  const addServiceSelection = () => {
    if (serviceSelections.length >= 3) return;

    const nextId = (serviceSelections.length + 1).toString();
    const nextDisplayOrder = serviceSelections.length;

    setServiceSelections([
      ...serviceSelections,
      {
        id: nextId,
        servicePlan: null,
        displayOrder: nextDisplayOrder,
        frequency: '',
        discount: '',
      },
    ]);
  };

  const removeServiceSelection = async (displayOrder: number) => {
    // Don't allow removing the first selection
    if (displayOrder === 0) return;

    // Remove from local state first
    const updatedSelections = serviceSelections
      .filter(sel => sel.displayOrder !== displayOrder)
      .map((sel, index) => ({
        ...sel,
        displayOrder: index,
      }));

    setServiceSelections(updatedSelections);

    // If there's a corresponding line item in the database, we need to delete it
    // This is done by fetching all current line items and removing the one at this display order
    const lineItemToDelete = quote?.line_items?.find(
      item => item.display_order === displayOrder
    );

    if (lineItemToDelete && quote) {
      try {
        // Use the Supabase admin client to delete the line item directly
        const response = await fetch(
          `/api/quote-line-items/${lineItemToDelete.id}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          // If delete fails, just refresh the quote to get updated state
          console.warn('Failed to delete line item, refreshing quote');
        }

        // Fetch updated quote to refresh state
        const quoteResponse = await fetch(`/api/quotes/${quote.id}`);
        if (quoteResponse.ok) {
          const quoteData = await quoteResponse.json();
          if (quoteData.success && quoteData.data) {
            await broadcastQuoteUpdate(quoteData.data);
          }
        }

        onShowToast?.('Service removed successfully', 'success');
      } catch (error) {
        console.error('Error removing service selection:', error);
        onShowToast?.('Failed to remove service from database', 'error');
      }
    }
  };

  const updateServiceSelection = async (displayOrder: number, plan: any) => {
    // Update local state
    setServiceSelections(
      serviceSelections.map(sel =>
        sel.displayOrder === displayOrder ? { ...sel, servicePlan: plan } : sel
      )
    );

    // Fetch available discounts for this plan
    if (plan?.id) {
      const discounts = await fetchDiscountsForPlan(plan.id);
      setAvailableDiscounts(prev => ({
        ...prev,
        [plan.id]: discounts,
      }));
    }

    // Update quote line item
    await createOrUpdateQuoteLineItem(plan, displayOrder);
  };

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

  // Watch for Service Selection tab activation and ensure discounts are loaded
  useEffect(() => {
    if (activeServiceTab === 'service-selection') {
      // Check if any service plans need discounts fetched (using ref to avoid circular dependency)
      const plansMissingDiscounts = serviceSelections
        .filter(
          s =>
            s.servicePlan?.id &&
            !discountsFetchedRef.current.has(s.servicePlan.id)
        )
        .map(s => s.servicePlan?.id)
        .filter((id): id is string => !!id);

      if (plansMissingDiscounts.length > 0) {
        const fetchMissingDiscounts = async () => {
          setLoadingDiscounts(true);
          try {
            for (const planId of plansMissingDiscounts) {
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
        fetchMissingDiscounts();
      }
    }
  }, [activeServiceTab, serviceSelections, profile, fetchDiscountsForPlan]);

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

  const handleAssigneeSelect = (assigneeId: string) => {
    setSelectedAssignee(assigneeId);
    setIsAssignmentDropdownOpen(false);
  };

  const showSuccessToast = (message: string) => {
    if (onShowToast) {
      onShowToast(message, 'success');
    }
  };

  const showErrorToast = (message: string) => {
    if (onShowToast) {
      onShowToast(message, 'error');
    }
  };

  const handleUpdateServiceAddressSize = async (
    field: 'home_size_range' | 'yard_size_range',
    value: string,
    label: string
  ) => {
    if (!lead.primary_service_address?.id || !value) return;

    try {
      await authenticatedFetch(
        `/api/service-addresses/${lead.primary_service_address.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ [field]: value }),
        }
      );
      showSuccessToast(`${label} updated`);
    } catch (error) {
      console.error(`Error updating ${label.toLowerCase()}:`, error);
      showErrorToast(`Failed to update ${label.toLowerCase()}`);
    }
  };

  const handleStartCadence = async () => {
    setIsStartingCadence(true);
    try {
      const body = selectedCadenceId
        ? JSON.stringify({ cadence_id: selectedCadenceId })
        : JSON.stringify({});

      const result = await authenticatedFetch(`/api/leads/${lead.id}/cadence`, {
        method: 'POST',
        body,
      });

      if (!result.ok && result.error) {
        throw new Error(result.error);
      }

      onShowToast?.('Sales cadence started successfully', 'success');

      // Reload cadence data and next task
      setHasActiveCadence(true);

      try {
        const taskResult = await authenticatedFetch(
          `/api/leads/${lead.id}/next-task`
        );
        if (taskResult && taskResult.data) {
          setNextTask(taskResult.data);
        }
      } catch (taskError) {
        console.error('Error fetching next task:', taskError);
        // Don't fail the whole operation if we can't fetch the next task
      }
    } catch (error: any) {
      console.error('Error starting cadence:', error);
      showErrorToast(error.message || 'Failed to start sales cadence');
    } finally {
      setIsStartingCadence(false);
    }
  };

  const handleManageLead = () => {
    // Open modal to choose next step
    setShowManageLeadModal(true);
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

  const handleManageLeadProceed = async (
    option: 'communication' | 'quote' | 'schedule'
  ) => {
    // Handler for when "Myself" is selected - assigns to current user
    if (!user?.id) {
      showErrorToast('User information not available');
      return;
    }

    setIsAssigning(true);

    try {
      if (ticketType === 'sales') {
        // Map option to lead status
        const statusMap = {
          communication: 'in_process',
          quote: 'quoted',
          schedule: 'scheduling',
        };

        const newStatus = statusMap[option];

        // Assign lead to current user and update status
        if (isAdmin) {
          await adminAPI.updateLead(lead.id, {
            assigned_to: user.id,
            lead_status: newStatus,
          });
        } else {
          await adminAPI.updateUserLead(lead.id, {
            assigned_to: user.id,
            lead_status: newStatus,
          });
        }

        if (onLeadUpdate) {
          await onLeadUpdate();
        }
        showSuccessToast(
          `Sales lead assigned to you and moved to ${option === 'communication' ? 'Communication' : option === 'quote' ? 'Quote' : 'Scheduling'} stage`
        );
      } else if (ticketType === 'support') {
        // Create support case assigned to current user
        const supportCaseData = {
          customer_id: lead.customer_id,
          company_id: lead.company_id,
          issue_type: 'general_inquiry',
          summary: `Support case for ${lead.customer ? `${lead.customer.first_name} ${lead.customer.last_name}` : 'Customer'}`,
          description: lead.comments || 'Converted from sales lead',
          status: 'open',
          priority: lead.priority,
          assigned_to: user.id,
        };

        await adminAPI.supportCases.create(supportCaseData);

        // Archive the lead after creating support case
        if (isAdmin) {
          await adminAPI.updateLead(lead.id, {
            lead_status: 'lost',
            archived: true,
          });
        } else {
          await adminAPI.updateUserLead(lead.id, {
            lead_status: 'lost',
            archived: true,
          });
        }

        if (onLeadUpdate) {
          await onLeadUpdate();
        }
        showSuccessToast('Support case created and assigned to you');
      }
    } catch (error) {
      console.error('Error managing ticket:', error);
      showErrorToast(
        error instanceof Error ? error.message : 'Failed to manage ticket'
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssignTicket = async () => {
    if (!selectedAssignee) {
      showErrorToast('Please select an assignee');
      return;
    }

    setIsAssigning(true);
    let shouldShowModal = false;
    let assigneeInfo = null;

    try {
      if (ticketType === 'sales') {
        // Sales Lead logic
        if (selectedAssignee === 'sales_team') {
          // Assigned to Sales Team - keep as new lead
          if (isAdmin) {
            await adminAPI.updateLead(lead.id, {
              assigned_to: null,
              lead_status: 'new',
            });
          } else {
            await adminAPI.updateUserLead(lead.id, {
              assigned_to: null,
              lead_status: 'new',
            });
          }

          // Show modal for sales team assignment
          const teamCount = assignableUsers.filter(user =>
            user.departments.includes('sales')
          ).length;
          assigneeInfo = {
            name: 'Sales Team',
            title: `${teamCount} members`,
            avatar: null,
          };
          shouldShowModal = true;
          setAssignedUserInfo(assigneeInfo);
          setShowAssignSuccessModal(true);
        } else {
          // Assigned to specific person - update to in_process status
          if (isAdmin) {
            await adminAPI.updateLead(lead.id, {
              assigned_to: selectedAssignee,
              lead_status: 'in_process',
            });
          } else {
            await adminAPI.updateUserLead(lead.id, {
              assigned_to: selectedAssignee,
              lead_status: 'in_process',
            });
          }

          // Get assignee info for modal
          const assignedUser = assignableUsers.find(
            u => u.id === selectedAssignee
          );
          if (assignedUser) {
            assigneeInfo = {
              name: assignedUser.display_name,
              title: assignedUser.email,
              avatar: assignedUser.avatar_url || null,
            };
            shouldShowModal = true;

            // Set assignee info and show modal BEFORE onLeadUpdate
            setAssignedUserInfo(assigneeInfo);
            setShowAssignSuccessModal(true);
          }
        }
      } else if (ticketType === 'support') {
        // Support Case logic - create support case first, then archive lead only if successful
        const supportCaseData = {
          customer_id: lead.customer_id,
          company_id: lead.company_id, // Explicitly include company_id
          issue_type: 'general_inquiry',
          summary: `Converted from sales lead${lead.customer ? ` - ${lead.customer.first_name} ${lead.customer.last_name}` : ''}`,
          description: lead.comments || 'Converted from sales lead',
          status: 'new',
          priority: 'medium',
          assigned_to:
            selectedAssignee === 'support_team' ? undefined : selectedAssignee,
        };

        try {
          // Create support case first
          await adminAPI.supportCases.create(supportCaseData);

          // Only archive the lead if support case creation was successful
          if (isAdmin) {
            await adminAPI.updateLead(lead.id, {
              archived: true,
            });
          } else {
            await adminAPI.updateUserLead(lead.id, {
              archived: true,
            });
          }

          showSuccessToast('Support case created and lead archived');
        } catch (supportCaseError) {
          console.error('Failed to create support case:', supportCaseError);
          throw new Error(
            `Failed to create support case: ${supportCaseError instanceof Error ? supportCaseError.message : 'Unknown error'}`
          );
        }
      } else if (ticketType === 'junk') {
        // Archive the lead as junk
        if (isAdmin) {
          await adminAPI.updateLead(lead.id, {
            archived: true,
          });
        } else {
          await adminAPI.updateUserLead(lead.id, {
            archived: true,
          });
        }
        showSuccessToast('Lead marked as junk and archived');
      }

      // Only call onLeadUpdate if modal is not being shown
      // The modal's "Return to Leads" button will handle navigation
      if (!shouldShowModal && onLeadUpdate) {
        await onLeadUpdate();
      }
    } catch (error) {
      console.error('Error assigning ticket:', error);
      showErrorToast(
        error instanceof Error ? error.message : 'Failed to assign ticket'
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const getTeamCount = () => {
    const department = ticketType === 'support' ? 'support' : 'sales';
    return assignableUsers.filter(user => user.departments.includes(department))
      .length;
  };

  const getSelectedAssigneeDisplay = () => {
    if (selectedAssignee === 'sales_team') {
      return {
        name: 'Sales Team',
        subtitle: `${getTeamCount()} members`,
        avatar: null,
        isTeam: true,
      };
    }

    if (selectedAssignee === 'support_team') {
      return {
        name: 'Support Team',
        subtitle: `${getTeamCount()} members`,
        avatar: null,
        isTeam: true,
      };
    }

    if (selectedAssignee === user?.id) {
      return {
        name: currentUser?.name || 'Unknown',
        subtitle: 'Myself',
        avatar: currentUser?.avatar,
        isTeam: false,
      };
    }

    const assignee = assignableUsers.find(u => u.id === selectedAssignee);
    if (assignee) {
      return {
        name: assignee.display_name,
        subtitle: assignee.email,
        avatar: assignee.avatar_url,
        isTeam: false,
      };
    }

    return {
      name: 'Select assignee',
      subtitle: '',
      avatar: null,
      isTeam: false,
    };
  };

  const updateLeadRequestedDate = async (date: string) => {
    try {
      if (isAdmin) {
        await adminAPI.updateLead(lead.id, {
          requested_date: date,
        });
      } else {
        await adminAPI.updateUserLead(lead.id, {
          requested_date: date,
        });
      }
      onShowToast?.('Preferred date updated successfully', 'success');
      // Don't call onLeadUpdate to prevent re-rendering
    } catch (error) {
      console.error('Failed to update requested date:', error);
      onShowToast?.('Failed to update requested date', 'error');
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

  // Handle marking lead as lost
  const handleMarkAsLost = async () => {
    try {
      if (isAdmin) {
        await adminAPI.updateLead(lead.id, {
          lead_status: 'lost',
        });
      } else {
        await adminAPI.updateUserLead(lead.id, {
          lead_status: 'lost',
        });
      }
      onLeadUpdate?.();
      onShowToast?.('Lead marked as lost', 'success');
    } catch (error) {
      console.error('Failed to mark lead as lost:', error);
      onShowToast?.('Failed to mark lead as lost', 'error');
    }
  };

  // Handle progressing lead to scheduling
  const handleProgressToReadyToSchedule = async () => {
    try {
      if (isAdmin) {
        await adminAPI.updateLead(lead.id, {
          lead_status: 'scheduling',
        });
      } else {
        await adminAPI.updateUserLead(lead.id, {
          lead_status: 'scheduling',
        });
      }
      onLeadUpdate?.();
      onShowToast?.('Lead marked as Ready to Schedule!', 'success');
    } catch (error) {
      console.error('Failed to progress lead:', error);
      onShowToast?.('Failed to update lead status', 'error');
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

  const updateLeadRequestedTime = async (time: string) => {
    try {
      if (isAdmin) {
        await adminAPI.updateLead(lead.id, {
          requested_time: time,
        });
      } else {
        await adminAPI.updateUserLead(lead.id, {
          requested_time: time,
        });
      }
      onShowToast?.('Preferred time updated successfully', 'success');
      // Don't call onLeadUpdate to prevent re-rendering
    } catch (error) {
      console.error('Failed to update requested time:', error);
      onShowToast?.('Failed to update requested time', 'error');
    }
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

  const getButtonText = () => {
    // Check if "Myself" is selected (current user)
    const isMyself = selectedAssignee === user?.id;

    if (ticketType === 'sales') {
      return isMyself ? 'Manage Sales Lead' : 'Assign Sales Lead';
    } else if (ticketType === 'support') {
      return isMyself ? 'Manage Support Case' : 'Assign Support Case';
    } else if (ticketType === 'junk') {
      return 'Junk It';
    }
    return 'Assign Ticket';
  };

  const formatCallTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const getCallMethod = () => {
    // This would depend on your call record structure
    // For now, assume inbound if we have a call record
    return 'Inbound Call';
  };

  const getLeadSourceDisplay = (source: string) => {
    const sourceMap: { [key: string]: string } = {
      google_cpc: 'Paid Advertisement',
      facebook_ads: 'Social Media Ads',
      organic: 'Organic Search',
      referral: 'Referral',
      other: 'Other',
    };
    return sourceMap[source] || source;
  };

  const getAIQualification = (leadStatus: string) => {
    return leadStatus === 'qualified' || leadStatus === 'in_process'
      ? 'Sales Lead'
      : 'Unqualified';
  };

  const capitalizeFirst = (str?: string) => {
    if (!str) return 'Not specified';
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const TeamAvatar = () => (
    <div className={styles.teamAvatar}>
      <Users size={16} color="white" />
    </div>
  );

  const DefaultAvatar = ({ name }: { name: string }) => (
    <div className={styles.defaultAvatar}>{name.charAt(0).toUpperCase()}</div>
  );

  const renderQuotedContent = () => {
    const selectedPlan = serviceSelections[0]?.servicePlan;
    const selectedService = selectedPlan?.plan_name || '';

    const quotedTabs: TabItem[] = [
      {
        id: 'pest',
        label: 'Pest Select',
        content: (
          <div className={styles.cardContent} style={{ position: 'relative' }}>
            {loadingPlan && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  borderRadius: '6px',
                }}
              >
                <div style={{ color: 'var(--gray-500)', fontSize: '14px' }}>
                  Updating service plan...
                </div>
              </div>
            )}
            {loadingPestOptions ? (
              <div className={cardStyles.lightText}>
                Loading pest options...
              </div>
            ) : (
              <>
                {/* Primary Pest Section */}
                <PestSelection
                  selectedPestId={selectedPests[0] || null}
                  pestOptions={pestOptions}
                  onPestChange={async pestId => {
                    if (pestId) {
                      // Update primary pest
                      setSelectedPests([pestId, ...additionalPests]);
                      await updatePrimaryPest(pestId);
                    } else {
                      // Remove primary pest
                      setSelectedPests(additionalPests);
                      await updatePrimaryPest('');
                    }
                  }}
                  loading={loadingPlan}
                />

                {/* Additional Pests Section - Only show if primary pest is selected */}
                {selectedPests.length > 0 && selectedPests[0] && (
                  <AdditionalPestsSelection
                    selectedPestIds={additionalPests}
                    pestOptions={pestOptions}
                    primaryPestId={selectedPests[0]}
                    onPestsChange={async pestIds => {
                      setAdditionalPests(pestIds);
                      setSelectedPests(
                        [selectedPests[0], ...pestIds].filter(Boolean)
                      );
                      await updateAdditionalPests(pestIds);
                    }}
                    loading={loadingPlan}
                  />
                )}
              </>
            )}
          </div>
        ),
      },
      {
        id: 'service',
        label: 'Service Selection',
        content: (
          <div className={styles.cardContent} style={{ position: 'relative' }}>
            {(loadingPlan || isQuoteUpdating) && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(255, 255, 255, 0.8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  borderRadius: '6px',
                }}
              >
                <div style={{ color: 'var(--gray-500)', fontSize: '14px' }}>
                  {loadingPlan ? 'Loading service plan...' : 'Updating...'}
                </div>
              </div>
            )}
            {loadingPlan && !selectedPlan ? (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: 'var(--gray-500)',
                }}
              >
                Loading service plan...
              </div>
            ) : selectedPests.length === 0 ? (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: 'var(--gray-500)',
                }}
              >
                Select a pest to view available service plans
              </div>
            ) : !selectedPlan ? (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: 'var(--gray-500)',
                }}
              >
                No service plans available for selected pest
              </div>
            ) : (
              <>
                {/* Service Selection Form */}
                {/* Row 1: Size of Home, Yard Size (2 columns) */}
                <div className={`${styles.gridRow} ${styles.twoColumns}`}>
                  <div className={styles.formField}>
                    <div className={styles.fieldHeader}>
                      <label className={styles.fieldLabel}>Size of Home</label>
                    </div>
                    <CustomDropdown
                      options={homeSizeOptions}
                      value={selectedHomeSizeOption}
                      onChange={async rangeValue => {
                        const oldValue = selectedHomeSizeOption;
                        const oldHomeSize = homeSize;

                        setSelectedHomeSizeOption(rangeValue);
                        const option = homeSizeOptions.find(
                          opt => opt.value === rangeValue
                        );
                        if (option) {
                          setHomeSize(option.rangeStart);
                        }

                        // Update quote (which will also update service_address via API)
                        if (quote && rangeValue) {
                          try {
                            const response = await fetch(
                              `/api/quotes/${quote.id}`,
                              {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  home_size_range: rangeValue,
                                }),
                              }
                            );

                            if (!response.ok) {
                              throw new Error(
                                'Failed to update home size range'
                              );
                            }

                            const data = await response.json();

                            if (data.success && data.data) {
                              await broadcastQuoteUpdate(data.data);
                              onShowToast?.(
                                'Home size updated successfully',
                                'success'
                              );

                              // Provide undo handler
                              if (onRequestUndo) {
                                const undoHandler = async () => {
                                  try {
                                    // Revert UI state
                                    setSelectedHomeSizeOption(oldValue);
                                    setHomeSize(oldHomeSize);

                                    // Revert in database
                                    const revertResponse = await fetch(
                                      `/api/quotes/${quote.id}`,
                                      {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                          home_size_range: oldValue || null,
                                        }),
                                      }
                                    );

                                    if (!revertResponse.ok) {
                                      throw new Error('Failed to undo change');
                                    }

                                    const revertData =
                                      await revertResponse.json();
                                    if (revertData.success && revertData.data) {
                                      await broadcastQuoteUpdate(
                                        revertData.data
                                      );
                                    }

                                    onShowToast?.('Change undone', 'success');
                                  } catch (error) {
                                    console.error(
                                      'Error undoing change:',
                                      error
                                    );
                                    onShowToast?.(
                                      'Failed to undo change',
                                      'error'
                                    );
                                  }
                                };

                                onRequestUndo(undoHandler);
                              }
                            }
                          } catch (error) {
                            console.error(
                              'Error updating home size range:',
                              error
                            );
                            onShowToast?.(
                              'Failed to update home size',
                              'error'
                            );
                          }
                        }
                      }}
                      placeholder="Select home size"
                    />
                  </div>
                  <div className={styles.formField}>
                    <div className={styles.fieldHeader}>
                      <label className={styles.fieldLabel}>Yard Size</label>
                    </div>
                    <CustomDropdown
                      options={yardSizeOptions}
                      value={selectedYardSizeOption}
                      onChange={async rangeValue => {
                        const oldValue = selectedYardSizeOption;
                        const oldYardSize = yardSize;

                        setSelectedYardSizeOption(rangeValue);
                        const option = yardSizeOptions.find(
                          opt => opt.value === rangeValue
                        );
                        if (option) {
                          setYardSize(option.rangeStart);
                        }

                        // Update quote (which will also update service_address via API)
                        if (quote && rangeValue) {
                          try {
                            const response = await fetch(
                              `/api/quotes/${quote.id}`,
                              {
                                method: 'PUT',
                                headers: {
                                  'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                  yard_size_range: rangeValue,
                                }),
                              }
                            );

                            if (!response.ok) {
                              throw new Error(
                                'Failed to update yard size range'
                              );
                            }

                            const data = await response.json();

                            if (data.success && data.data) {
                              await broadcastQuoteUpdate(data.data);
                              onShowToast?.(
                                'Yard size updated successfully',
                                'success'
                              );

                              // Provide undo handler
                              if (onRequestUndo) {
                                const undoHandler = async () => {
                                  try {
                                    // Revert UI state
                                    setSelectedYardSizeOption(oldValue);
                                    setYardSize(oldYardSize);

                                    // Revert in database
                                    const revertResponse = await fetch(
                                      `/api/quotes/${quote.id}`,
                                      {
                                        method: 'PUT',
                                        headers: {
                                          'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                          yard_size_range: oldValue || null,
                                        }),
                                      }
                                    );

                                    if (!revertResponse.ok) {
                                      throw new Error('Failed to undo change');
                                    }

                                    const revertData =
                                      await revertResponse.json();
                                    if (revertData.success && revertData.data) {
                                      await broadcastQuoteUpdate(
                                        revertData.data
                                      );
                                    }

                                    onShowToast?.('Change undone', 'success');
                                  } catch (error) {
                                    console.error(
                                      'Error undoing change:',
                                      error
                                    );
                                    onShowToast?.(
                                      'Failed to undo change',
                                      'error'
                                    );
                                  }
                                };

                                onRequestUndo(undoHandler);
                              }
                            }
                          } catch (error) {
                            console.error(
                              'Error updating yard size range:',
                              error
                            );
                            onShowToast?.(
                              'Failed to update yard size',
                              'error'
                            );
                          }
                        }
                      }}
                      placeholder="Select yard size"
                    />
                  </div>
                </div>

                {/* Render Service Selections Dynamically */}
                {serviceSelections.map((selection, index) => (
                  <div key={selection.id}>
                    <div className={`${styles.gridRow} ${styles.threeColumns}`}>
                      <div className={styles.formField}>
                        <div className={styles.serviceHeaderRow}>
                          <label className={styles.fieldLabel}>
                            Select Service {index + 1}
                          </label>
                          {index > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                removeServiceSelection(selection.displayOrder)
                              }
                              className={styles.removeServiceButton}
                              aria-label="Remove service"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                        <CustomDropdown
                          options={
                            loadingServicePlans
                              ? [{ value: '', label: 'Loading plans...' }]
                              : allServicePlans.length > 0
                                ? allServicePlans.map(plan => ({
                                    value: plan.plan_name,
                                    label: plan.plan_name,
                                  }))
                                : [{ value: '', label: 'No plans available' }]
                          }
                          value={selection.servicePlan?.plan_name || ''}
                          onChange={async planName => {
                            const plan = allServicePlans.find(
                              p => p.plan_name === planName
                            );
                            if (plan) {
                              setServiceSelections(prev =>
                                prev.map((sel, idx) =>
                                  idx === index
                                    ? { ...sel, servicePlan: plan }
                                    : sel
                                )
                              );
                              await createOrUpdateQuoteLineItem(
                                plan,
                                selection.displayOrder
                              );
                            }
                          }}
                          placeholder="Program or Service"
                          disabled={loadingServicePlans}
                        />
                      </div>
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>
                          Service Frequency
                        </label>
                        <CustomDropdown
                          options={[
                            { value: 'monthly', label: 'Monthly' },
                            { value: 'quarterly', label: 'Quarterly' },
                            { value: 'semi-annually', label: 'Semi-Annually' },
                            { value: 'annually', label: 'Annually' },
                          ]}
                          value={selection.frequency}
                          onChange={async newFrequency => {
                            setServiceSelections(prev =>
                              prev.map((sel, idx) =>
                                idx === index
                                  ? { ...sel, frequency: newFrequency }
                                  : sel
                              )
                            );

                            if (selection.servicePlan && newFrequency) {
                              await createOrUpdateQuoteLineItem(
                                selection.servicePlan,
                                selection.displayOrder,
                                {
                                  service_frequency: newFrequency,
                                }
                              );
                            }
                          }}
                          placeholder="Select Frequency"
                        />
                      </div>
                      {/* Discount selector - disabled when custom pricing is active */}
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Discount</label>
                        <CustomDropdown
                          options={
                            loadingDiscounts
                              ? [{ value: '', label: 'Loading discounts...' }]
                              : [
                                  { value: '', label: 'No Discount' },
                                  ...(selection.servicePlan &&
                                  availableDiscounts[selection.servicePlan.id]
                                    ? availableDiscounts[
                                        selection.servicePlan.id
                                      ].map(discount => ({
                                        value: discount.id,
                                        label: discount.name,
                                      }))
                                    : []),
                                ]
                          }
                          value={
                            selection.isCustomPriced ? '' : selection.discount
                          }
                          onChange={async newDiscountId => {
                            setServiceSelections(prev =>
                              prev.map((sel, idx) =>
                                idx === index
                                  ? { ...sel, discount: newDiscountId }
                                  : sel
                              )
                            );

                            if (selection.servicePlan) {
                              await createOrUpdateQuoteLineItem(
                                selection.servicePlan,
                                selection.displayOrder,
                                {
                                  discount_id:
                                    newDiscountId === '' ? null : newDiscountId,
                                }
                              );
                            }
                          }}
                          placeholder={
                            loadingDiscounts
                              ? 'Loading discounts...'
                              : selection.isCustomPriced
                                ? 'Disabled (Custom Pricing Active)'
                                : 'Select Discount'
                          }
                          disabled={
                            loadingDiscounts || selection.isCustomPriced
                          }
                        />
                      </div>
                    </div>

                    {/* Custom Pricing - Collapsible Section */}
                    {selection.servicePlan?.allow_custom_pricing && (
                      <div className={styles.customPricingSection}>
                        <button
                          type="button"
                          className={styles.customPricingToggle}
                          onClick={() => {
                            const isExpanding =
                              !customPricingExpanded[selection.displayOrder];

                            setCustomPricingExpanded(prev => ({
                              ...prev,
                              [selection.displayOrder]: isExpanding,
                            }));

                            // Pre-fill with calculated prices when expanding for the first time
                            if (
                              isExpanding &&
                              selection.customInitialPrice === undefined &&
                              selection.customRecurringPrice === undefined
                            ) {
                              setServiceSelections(prev =>
                                prev.map((sel, idx) =>
                                  idx === index
                                    ? {
                                        ...sel,
                                        customInitialPrice:
                                          calculatedPrices[
                                            selection.displayOrder
                                          ]?.initial || 0,
                                        customRecurringPrice:
                                          calculatedPrices[
                                            selection.displayOrder
                                          ]?.recurring || 0,
                                      }
                                    : sel
                                )
                              );
                            }
                          }}
                        >
                          <span className={styles.toggleIcon}>
                            {customPricingExpanded[selection.displayOrder]
                              ? '▼'
                              : '▶'}
                          </span>
                          Custom Pricing
                        </button>

                        {customPricingExpanded[selection.displayOrder] && (
                          <div className={styles.customPricingFields}>
                            <div className={styles.customPriceLabel}>
                              Override calculated price
                            </div>
                            <div className={styles.priceInputRow}>
                              <div className={styles.formField}>
                                <label className={styles.fieldLabel}>
                                  Initial Price ($)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className={styles.priceInput}
                                  value={
                                    selection.customInitialPrice ??
                                    calculatedPrices[selection.displayOrder]
                                      ?.initial ??
                                    ''
                                  }
                                  onChange={e => {
                                    const value =
                                      parseFloat(e.target.value) || 0;
                                    if (value < 0) return; // Prevent negative prices

                                    // Update state only (don't save yet)
                                    setServiceSelections(prev =>
                                      prev.map((sel, idx) =>
                                        idx === index
                                          ? {
                                              ...sel,
                                              customInitialPrice: value,
                                            }
                                          : sel
                                      )
                                    );
                                  }}
                                  placeholder="Enter custom initial price"
                                />
                              </div>
                              <div className={styles.formField}>
                                <label className={styles.fieldLabel}>
                                  Recurring Price ($)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className={styles.priceInput}
                                  value={
                                    selection.customRecurringPrice ??
                                    calculatedPrices[selection.displayOrder]
                                      ?.recurring ??
                                    ''
                                  }
                                  onChange={e => {
                                    const value =
                                      parseFloat(e.target.value) || 0;
                                    if (value < 0) return; // Prevent negative prices

                                    // Update state only (don't save yet)
                                    setServiceSelections(prev =>
                                      prev.map((sel, idx) =>
                                        idx === index
                                          ? {
                                              ...sel,
                                              customRecurringPrice: value,
                                            }
                                          : sel
                                      )
                                    );
                                  }}
                                  placeholder="Enter custom recurring price"
                                />
                              </div>
                            </div>
                            <small className={styles.customPriceNote}>
                              Calculated price: $
                              {calculatedPrices[
                                selection.displayOrder
                              ]?.initial?.toFixed(2) || '0.00'}{' '}
                              initial, $
                              {calculatedPrices[
                                selection.displayOrder
                              ]?.recurring?.toFixed(2) || '0.00'}
                              /mo recurring
                            </small>

                            {/* Action Buttons */}
                            <div className={styles.customPricingActions}>
                              <button
                                type="button"
                                className={styles.saveCustomPriceButton}
                                onClick={async () => {
                                  if (
                                    selection.servicePlan &&
                                    selection.customInitialPrice !==
                                      undefined &&
                                    selection.customRecurringPrice !== undefined
                                  ) {
                                    // Mark as custom priced and clear discount
                                    setServiceSelections(prev =>
                                      prev.map((sel, idx) =>
                                        idx === index
                                          ? {
                                              ...sel,
                                              isCustomPriced: true,
                                              discount: '', // Clear discount when using custom pricing
                                            }
                                          : sel
                                      )
                                    );

                                    // Save to backend
                                    await createOrUpdateQuoteLineItem(
                                      selection.servicePlan,
                                      selection.displayOrder,
                                      {
                                        custom_initial_price:
                                          selection.customInitialPrice,
                                        custom_recurring_price:
                                          selection.customRecurringPrice,
                                        is_custom_priced: true,
                                        discount_id: null, // Clear discount when using custom pricing
                                      }
                                    );
                                  }
                                }}
                              >
                                Save Custom Price
                              </button>
                              <button
                                type="button"
                                className={styles.clearCustomPriceButton}
                                onClick={async () => {
                                  if (selection.servicePlan) {
                                    // Clear custom pricing from state
                                    setServiceSelections(prev =>
                                      prev.map((sel, idx) =>
                                        idx === index
                                          ? {
                                              ...sel,
                                              customInitialPrice: undefined,
                                              customRecurringPrice: undefined,
                                              isCustomPriced: false,
                                            }
                                          : sel
                                      )
                                    );

                                    // Clear from backend
                                    await createOrUpdateQuoteLineItem(
                                      selection.servicePlan,
                                      selection.displayOrder,
                                      {
                                        custom_initial_price: undefined,
                                        custom_recurring_price: undefined,
                                        is_custom_priced: false,
                                      }
                                    );
                                  }
                                }}
                              >
                                Clear Custom Pricing
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Pest Concern Coverage Pills and Add Service Button Row */}
                <div className={styles.pestCoverageRow}>
                  <div className={styles.pestCoverageSection}>
                    <label className={styles.fieldLabel}>
                      Pest Concern Coverage
                    </label>
                    <div className={styles.pestContainer}>
                      {pestOptions
                        .filter(pest => selectedPests.includes(pest.id))
                        .sort((a, b) => {
                          // Sort by selectedPests order - primary pest (index 0) appears first
                          const indexA = selectedPests.indexOf(a.id);
                          const indexB = selectedPests.indexOf(b.id);
                          return indexA - indexB;
                        })
                        .map(pest => {
                          // Check if this pest is covered by ANY selected service plan
                          const isCovered = serviceSelections.some(sel =>
                            sel.servicePlan?.pest_coverage?.some(
                              (coverage: any) => coverage.pest_id === pest.id
                            )
                          );

                          return (
                            <div
                              key={pest.id}
                              className={styles.pestBadge}
                              style={
                                !isCovered
                                  ? {
                                      background: '#FFE3E2',
                                      border: '1px solid #FB2C36',
                                      color: '#C10007',
                                    }
                                  : undefined
                              }
                            >
                              {isCovered ? (
                                <svg
                                  width="8"
                                  height="8"
                                  viewBox="0 0 8 8"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M6.5 2L3 5.5L1.5 4"
                                    stroke="var(--green-600, #00A63E)"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              ) : (
                                <CircleOff
                                  size={8}
                                  style={{ color: '#FB2C36' }}
                                />
                              )}
                              {pest.custom_label}
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {/* Add Service Button */}
                  {serviceSelections.length < 3 &&
                    serviceSelections.some(sel => sel.servicePlan) && (
                      <div className={styles.addServiceButtonContainer}>
                        <button
                          type="button"
                          onClick={addServiceSelection}
                          className={styles.addServiceButton}
                        >
                          <Plus size={20} />
                          Add Service
                        </button>
                      </div>
                    )}
                </div>

                {/* Add-On Services Section */}
                {serviceSelections[0]?.servicePlan && (
                  <div
                    style={{
                      marginTop: '32px',
                      paddingTop: '24px',
                      borderTop: '1px solid #e5e7eb',
                    }}
                  >
                    <EligibleAddOnSelector
                      companyId={lead.company_id}
                      servicePlanId={serviceSelections[0].servicePlan.id}
                      selectedAddonIds={selectedAddOns}
                      onToggleAddon={handleToggleAddon}
                    />
                  </div>
                )}

                {/* Plan Pricing Section */}
                {serviceSelections.some(sel => sel.servicePlan) && (
                  <>
                    <h4 className={cardStyles.defaultText}>Plan Pricing</h4>
                    <div className={styles.planPricingContainer}>
                      {serviceSelections.length === 1 ? (
                        // Single Plan Pricing Display
                        serviceSelections[0].servicePlan && (
                          <div className={styles.singlePlanPricing}>
                            <div className={styles.pricingGrid}>
                              <div className={styles.pricingColumn}>
                                <div className={styles.pricingLabel}>
                                  Recurring Price
                                </div>
                                <div className={styles.recurringPrice}>
                                  $
                                  {quote?.line_items?.[0]
                                    ?.final_recurring_price || 0}
                                  <span className={styles.perMonth}>/mo</span>
                                </div>
                              </div>
                              <div className={styles.pricingColumn}>
                                <div className={styles.pricingLabel}>
                                  Initial Price
                                </div>
                                <div className={styles.initialPrice}>
                                  $
                                  {Math.round(
                                    quote?.line_items?.[0]
                                      ?.final_initial_price || 0
                                  )}
                                </div>
                                {quote?.line_items?.[0]?.discount_percentage ? (
                                  <div className={styles.originalPrice}>
                                    Originally $
                                    {Math.round(
                                      quote?.line_items?.[0]?.initial_price || 0
                                    )}{' '}
                                    (-
                                    {
                                      quote?.line_items?.[0]
                                        ?.discount_percentage
                                    }
                                    %)
                                  </div>
                                ) : null}
                              </div>
                              <div className={styles.pricingColumn}>
                                <div className={styles.pricingLabel}>
                                  Treatment Frequency
                                </div>
                                <div className={styles.frequency}>
                                  {serviceSelections[0].frequency
                                    .charAt(0)
                                    .toUpperCase() +
                                    serviceSelections[0].frequency.slice(1)}
                                </div>
                                <div className={styles.inspection}>
                                  Inspection Included
                                </div>
                              </div>
                            </div>

                            {/* Add-Ons for Single Plan */}
                            {quote?.line_items &&
                              quote.line_items.filter(
                                item =>
                                  item.addon_service_id != null &&
                                  item.addon_service_id !== ''
                              ).length > 0 && (
                                <div className={styles.addOnsBreakdown}>
                                  <div className={styles.addOnsHeader}>
                                    Add-On Services:
                                  </div>
                                  {quote.line_items
                                    .filter(
                                      item =>
                                        item.addon_service_id != null &&
                                        item.addon_service_id !== ''
                                    )
                                    .map(addonItem => (
                                      <div
                                        key={addonItem.id}
                                        className={styles.addonLineItem}
                                      >
                                        <div className={styles.addonName}>
                                          {addonItem.plan_name}
                                        </div>
                                        <div className={styles.addonPrices}>
                                          <span
                                            className={styles.addonRecurring}
                                          >
                                            +${addonItem.final_recurring_price}
                                            /mo
                                          </span>
                                          {addonItem.final_initial_price >
                                            0 && (
                                            <span
                                              className={styles.addonInitial}
                                            >
                                              $
                                              {Math.round(
                                                addonItem.final_initial_price
                                              )}{' '}
                                              initial
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                </div>
                              )}

                            {/* Total with Add-Ons */}
                            {quote?.line_items &&
                              quote.line_items.filter(
                                item =>
                                  item.addon_service_id != null &&
                                  item.addon_service_id !== ''
                              ).length > 0 && (
                                <div className={styles.singlePlanTotal}>
                                  <div className={styles.totalRow}>
                                    <span className={styles.totalLabel}>
                                      Total Recurring:
                                    </span>
                                    <span className={styles.totalValue}>
                                      $
                                      {Math.round(
                                        quote?.total_recurring_price || 0
                                      )}
                                      /mo
                                    </span>
                                  </div>
                                  <div className={styles.totalRow}>
                                    <span className={styles.totalLabel}>
                                      Total Initial:
                                    </span>
                                    <span className={styles.totalValue}>
                                      $
                                      {Math.round(
                                        quote?.total_initial_price || 0
                                      )}
                                    </span>
                                  </div>
                                </div>
                              )}
                          </div>
                        )
                      ) : (
                        // Multiple Plans Pricing Display
                        <div className={styles.multiplePlansPricing}>
                          {serviceSelections
                            .filter(sel => sel.servicePlan)
                            .map((selection, index) => {
                              const lineItem = quote?.line_items?.find(
                                item =>
                                  item.display_order === selection.displayOrder
                              );
                              return (
                                <div
                                  key={selection.id}
                                  className={styles.planLineItem}
                                >
                                  <div className={styles.lineItemHeader}>
                                    Service {index + 1}:{' '}
                                    {selection.servicePlan?.plan_name}
                                  </div>
                                  <div className={styles.lineItemPricing}>
                                    <div className={styles.lineItemColumn}>
                                      <div className={styles.lineItemLabel}>
                                        Recurring Price
                                      </div>
                                      <div
                                        className={
                                          styles.lineItemRecurringPrice
                                        }
                                      >
                                        $
                                        {Math.round(
                                          lineItem?.final_recurring_price || 0
                                        )}
                                        <span
                                          className={styles.lineItemPerMonth}
                                        >
                                          /mo
                                        </span>
                                      </div>
                                    </div>
                                    <div className={styles.lineItemColumn}>
                                      <div className={styles.lineItemLabel}>
                                        Initial Price
                                      </div>
                                      <div
                                        className={styles.lineItemInitialPrice}
                                      >
                                        $
                                        {Math.round(
                                          lineItem?.final_initial_price || 0
                                        )}
                                      </div>
                                      {lineItem?.discount_percentage ? (
                                        <div
                                          className={
                                            styles.lineItemOriginalPrice
                                          }
                                        >
                                          Originally $
                                          {Math.round(
                                            lineItem?.initial_price || 0
                                          )}{' '}
                                          (-
                                          {lineItem?.discount_percentage}%)
                                        </div>
                                      ) : null}
                                    </div>
                                    <div className={styles.lineItemColumn}>
                                      <div className={styles.lineItemLabel}>
                                        Treatment Frequency
                                      </div>
                                      <div className={styles.lineItemFrequency}>
                                        {selection.frequency
                                          .charAt(0)
                                          .toUpperCase() +
                                          selection.frequency.slice(1)}
                                      </div>
                                      <div
                                        className={styles.lineItemInspection}
                                      >
                                        Inspection Included
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}

                          {/* Add-Ons Section */}
                          {quote?.line_items &&
                            quote.line_items.filter(
                              item =>
                                item.addon_service_id != null &&
                                item.addon_service_id !== ''
                            ).length > 0 && (
                              <div className={styles.addOnsSection}>
                                <div className={styles.addOnsSectionHeader}>
                                  Add-On Services
                                </div>
                                {quote.line_items
                                  .filter(
                                    item =>
                                      item.addon_service_id != null &&
                                      item.addon_service_id !== ''
                                  )
                                  .map(addonItem => (
                                    <div
                                      key={addonItem.id}
                                      className={styles.planLineItem}
                                    >
                                      <div className={styles.lineItemHeader}>
                                        {addonItem.plan_name}
                                      </div>
                                      <div className={styles.lineItemPricing}>
                                        <div className={styles.lineItemColumn}>
                                          <div className={styles.lineItemLabel}>
                                            Recurring Price
                                          </div>
                                          <div
                                            className={
                                              styles.lineItemRecurringPrice
                                            }
                                          >
                                            $
                                            {Math.round(
                                              addonItem.final_recurring_price ||
                                                0
                                            )}
                                            <span
                                              className={
                                                styles.lineItemPerMonth
                                              }
                                            >
                                              /mo
                                            </span>
                                          </div>
                                        </div>
                                        <div className={styles.lineItemColumn}>
                                          <div className={styles.lineItemLabel}>
                                            Initial Price
                                          </div>
                                          <div
                                            className={
                                              styles.lineItemInitialPrice
                                            }
                                          >
                                            $
                                            {Math.round(
                                              addonItem.final_initial_price || 0
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            )}

                          {/* Total Cost Section */}
                          <div className={styles.totalCostSection}>
                            <div className={styles.totalCostHeader}>
                              Total Cost:
                            </div>
                            <div className={styles.totalCostGrid}>
                              <div className={styles.totalColumn}>
                                <div className={styles.totalLabel}>
                                  Total Recurring
                                </div>
                                <div className={styles.totalRecurringPrice}>
                                  $
                                  {Math.round(
                                    quote?.total_recurring_price || 0
                                  )}
                                  <span className={styles.totalPerMonth}>
                                    /mo
                                  </span>
                                </div>
                              </div>
                              <div className={styles.totalColumn}>
                                <div className={styles.totalLabel}>
                                  Total Initial
                                </div>
                                <div className={styles.totalInitialPrice}>
                                  ${Math.round(quote?.total_initial_price || 0)}
                                </div>
                                {(() => {
                                  const totalBaseInitial =
                                    quote?.line_items?.reduce(
                                      (sum, item) =>
                                        sum + (item.initial_price || 0),
                                      0
                                    ) || 0;
                                  const savings =
                                    totalBaseInitial -
                                    (quote?.total_initial_price || 0);
                                  return savings > 0 ? (
                                    <div className={styles.totalSavings}>
                                      Savings: ${Math.round(savings)}
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Plan Information Section */}
                <h4 className={cardStyles.defaultText}>Plan Information</h4>
                <div className={styles.planInfoContainer}>
                  <div className={styles.tabContainer}>
                    {[
                      { id: 'overview', label: 'Plan Overview' },
                      { id: 'pests', label: 'Covered Pests' },
                      { id: 'expect', label: 'What to Expect' },
                      { id: 'faqs', label: 'FAQs' },
                    ].map((tab, index, array) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveServiceTab(tab.id)}
                        className={`${styles.tabButton} ${
                          activeServiceTab === tab.id
                            ? styles.active
                            : styles.inactive
                        } ${index === 0 ? styles.firstTab : ''} ${
                          index === array.length - 1 ? styles.lastTab : ''
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  {/* Tab Content */}
                  <div className={styles.tabContent}>
                    {activeServiceTab === 'overview' && (
                      <div className={styles.tabContentInner}>
                        <div className={styles.planOverviewScroll}>
                          {serviceSelections
                            .filter(sel => sel.servicePlan)
                            .map((selection, index) => (
                              <div
                                key={selection.id}
                                className={styles.planSection}
                              >
                                <h4 className={styles.planTitle}>
                                  {selection.servicePlan.plan_name}
                                  {serviceSelections.filter(
                                    sel => sel.servicePlan
                                  ).length > 1 && (
                                    <span className={styles.planNumber}>
                                      ({index + 1}/
                                      {
                                        serviceSelections.filter(
                                          sel => sel.servicePlan
                                        ).length
                                      }
                                      )
                                    </span>
                                  )}
                                  {selection.servicePlan.highlight_badge && (
                                    <span
                                      style={{
                                        marginLeft: '8px',
                                        padding: '2px 8px',
                                        backgroundColor: 'var(--action-500)',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: '500',
                                        borderRadius: '12px',
                                      }}
                                    >
                                      {selection.servicePlan.highlight_badge}
                                    </span>
                                  )}
                                </h4>
                                <p
                                  style={{
                                    margin: '0 0 16px 0',
                                    color: 'var(--gray-600)',
                                    fontSize: '14px',
                                  }}
                                >
                                  {selection.servicePlan.plan_description}
                                </p>

                                <h5
                                  style={{
                                    margin: '0 0 12px 0',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: 'var(--gray-900)',
                                  }}
                                >
                                  Plan Features
                                </h5>
                                {selection.servicePlan.plan_features &&
                                Array.isArray(
                                  selection.servicePlan.plan_features
                                ) ? (
                                  <ul
                                    style={{
                                      margin: '0',
                                      paddingLeft: '20px',
                                      color: 'var(--gray-700)',
                                    }}
                                  >
                                    {selection.servicePlan.plan_features.map(
                                      (feature: string, idx: number) => (
                                        <li key={idx}>{feature}</li>
                                      )
                                    )}
                                  </ul>
                                ) : (
                                  <p
                                    style={{
                                      color: 'var(--gray-500)',
                                      fontStyle: 'italic',
                                    }}
                                  >
                                    No features listed
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {activeServiceTab === 'pests' && (
                      <div className={styles.tabContentInner}>
                        <h4
                          style={{
                            margin: '0 0 12px 0',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'var(--gray-900)',
                          }}
                        >
                          Covered Pests
                        </h4>
                        {(() => {
                          // Collect all unique pests from all selected plans
                          const allPestCoverage = new Map<
                            string,
                            { pest: any; coverageLevel: string }
                          >();

                          serviceSelections
                            .filter(sel => sel.servicePlan)
                            .forEach(selection => {
                              if (selection.servicePlan.pest_coverage) {
                                selection.servicePlan.pest_coverage.forEach(
                                  (coverage: any) => {
                                    const pest = pestOptions.find(
                                      p => p.id === coverage.pest_id
                                    );
                                    if (
                                      pest &&
                                      !allPestCoverage.has(coverage.pest_id)
                                    ) {
                                      allPestCoverage.set(coverage.pest_id, {
                                        pest,
                                        coverageLevel: coverage.coverage_level,
                                      });
                                    }
                                  }
                                );
                              }
                            });

                          if (allPestCoverage.size === 0) {
                            return (
                              <p
                                style={{
                                  color: 'var(--gray-500)',
                                  fontStyle: 'italic',
                                }}
                              >
                                No pest coverage information available
                              </p>
                            );
                          }

                          return (
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns:
                                  'repeat(auto-fill, minmax(150px, 1fr))',
                                gap: '8px',
                              }}
                            >
                              {Array.from(allPestCoverage.values()).map(
                                ({ pest, coverageLevel }) => (
                                  <div
                                    key={pest.id}
                                    style={{
                                      padding: '8px 12px',
                                      backgroundColor: 'var(--gray-50)',
                                      borderRadius: '6px',
                                      fontSize: '14px',
                                      color: 'var(--gray-700)',
                                      border:
                                        coverageLevel !== 'full'
                                          ? '1px dashed var(--gray-300)'
                                          : '1px solid var(--gray-200)',
                                    }}
                                  >
                                    {pest.custom_label || pest.name}
                                    {coverageLevel !== 'full' && (
                                      <span
                                        style={{
                                          display: 'block',
                                          fontSize: '12px',
                                          color: 'var(--gray-500)',
                                          textTransform: 'capitalize',
                                        }}
                                      >
                                        ({coverageLevel})
                                      </span>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {activeServiceTab === 'expect' && (
                      <div className={styles.tabContentInner}>
                        <div className={styles.planOverviewScroll}>
                          {serviceSelections
                            .filter(sel => sel.servicePlan)
                            .map((selection, index) => (
                              <div
                                key={selection.id}
                                className={styles.planSection}
                              >
                                <h4
                                  style={{
                                    margin: '0 0 12px 0',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: 'var(--gray-900)',
                                  }}
                                >
                                  {selection.servicePlan.plan_name} - What to
                                  Expect
                                  {serviceSelections.filter(
                                    sel => sel.servicePlan
                                  ).length > 1 && (
                                    <span className={styles.planNumber}>
                                      {' '}
                                      ({index + 1}/
                                      {
                                        serviceSelections.filter(
                                          sel => sel.servicePlan
                                        ).length
                                      }
                                      )
                                    </span>
                                  )}
                                </h4>
                                <div
                                  style={{
                                    color: 'var(--gray-700)',
                                    lineHeight: '1.6',
                                  }}
                                >
                                  <p>
                                    Treatment frequency:{' '}
                                    <strong>
                                      {
                                        selection.servicePlan
                                          .treatment_frequency
                                      }
                                    </strong>
                                  </p>
                                  <p>
                                    Billing cycle:{' '}
                                    <strong>
                                      {selection.servicePlan.billing_frequency}
                                    </strong>
                                  </p>
                                  {selection.servicePlan
                                    .includes_inspection && (
                                    <p>✓ Initial inspection included</p>
                                  )}
                                  <div
                                    style={{
                                      marginTop: '16px',
                                      padding: '12px',
                                      backgroundColor: 'var(--blue-50)',
                                      borderRadius: '6px',
                                      border: '1px solid var(--blue-200)',
                                    }}
                                  >
                                    <p
                                      style={{
                                        margin: '0',
                                        fontSize: '14px',
                                        color: 'var(--blue-700)',
                                      }}
                                    >
                                      Our{' '}
                                      {selection.servicePlan.plan_name.toLowerCase()}{' '}
                                      provides comprehensive protection with{' '}
                                      {
                                        selection.servicePlan
                                          .treatment_frequency
                                      }{' '}
                                      treatments to keep your property pest-free
                                      year-round.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {activeServiceTab === 'faqs' && (
                      <div className={styles.tabContentInner}>
                        <div className={styles.planOverviewScroll}>
                          {serviceSelections
                            .filter(sel => sel.servicePlan)
                            .map((selection, index) => (
                              <div
                                key={selection.id}
                                className={styles.planSection}
                              >
                                <h4
                                  style={{
                                    margin: '0 0 12px 0',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    color: 'var(--gray-900)',
                                  }}
                                >
                                  {selection.servicePlan.plan_name} - Frequently
                                  Asked Questions
                                  {serviceSelections.filter(
                                    sel => sel.servicePlan
                                  ).length > 1 && (
                                    <span className={styles.planNumber}>
                                      {' '}
                                      ({index + 1}/
                                      {
                                        serviceSelections.filter(
                                          sel => sel.servicePlan
                                        ).length
                                      }
                                      )
                                    </span>
                                  )}
                                </h4>
                                {selection.servicePlan.plan_faqs &&
                                Array.isArray(
                                  selection.servicePlan.plan_faqs
                                ) ? (
                                  <div style={{ display: 'grid', gap: '16px' }}>
                                    {selection.servicePlan.plan_faqs.map(
                                      (faq: any, idx: number) => (
                                        <div
                                          key={idx}
                                          style={{
                                            padding: '16px',
                                            backgroundColor: 'var(--gray-50)',
                                            borderRadius: '6px',
                                          }}
                                        >
                                          <h5
                                            style={{
                                              margin: '0 0 8px 0',
                                              fontSize: '14px',
                                              fontWeight: '600',
                                              color: 'var(--gray-900)',
                                            }}
                                          >
                                            {faq.question}
                                          </h5>
                                          <p
                                            style={{
                                              margin: '0',
                                              fontSize: '14px',
                                              color: 'var(--gray-700)',
                                              lineHeight: '1.5',
                                            }}
                                          >
                                            {faq.answer}
                                          </p>
                                        </div>
                                      )
                                    )}
                                  </div>
                                ) : (
                                  <p
                                    style={{
                                      color: 'var(--gray-500)',
                                      fontStyle: 'italic',
                                    }}
                                  >
                                    No FAQs available for this plan
                                  </p>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preferred Date and Time Inputs */}
                <div className={`${styles.gridRow} ${styles.twoColumns}`}>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Preferred Date</label>
                    <input
                      type="date"
                      className={styles.selectInput}
                      value={preferredDate}
                      onChange={e => {
                        setPreferredDate(e.target.value);
                        updateLeadRequestedDate(e.target.value);
                      }}
                      placeholder="Enter preferred date"
                    />
                  </div>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>Preferred Time</label>
                    <CustomDropdown
                      options={[
                        { value: 'morning', label: 'Morning (8AM - 12PM)' },
                        { value: 'afternoon', label: 'Afternoon (12PM - 5PM)' },
                        { value: 'evening', label: 'Evening (5PM - 8PM)' },
                        { value: 'anytime', label: 'Anytime' },
                      ]}
                      value={preferredTime}
                      onChange={value => {
                        setPreferredTime(value);
                        updateLeadRequestedTime(value);
                      }}
                      placeholder="Enter preferred time"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        ),
      },
      {
        id: 'quote',
        label: 'Quote Summary',
        content: (
          <QuoteSummaryCard
            quote={quote}
            lead={lead}
            isUpdating={isQuoteUpdating}
            onEmailQuote={handleEmailQuote}
            hideCard={true}
          />
        ),
      },
    ];

    // Only check line items for default tab on initial render
    if (!initialTabSetRef.current) {
      initialTabSetRef.current = true;
    }

    const hasLineItems = quote?.line_items && quote.line_items.length > 0;
    const defaultTab = hasLineItems ? 'service' : 'pest';

    return (
      <TabCard
        key={`quoted-tabs-${quote?.id}`}
        tabs={quotedTabs}
        defaultTabId={defaultTab}
      />
    );
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
            isStartingCadence={isStartingCadence}
            onActionTypeChange={setSelectedActionType}
            onActivityNotesChange={setActivityNotes}
            onLogActivity={handleLogActivityFromSection}
            onCadenceSelect={setSelectedCadenceId}
            onStartCadence={handleStartCadence}
            onShowToast={onShowToast}
            onLeadUpdate={onLeadUpdate}
          />
          {renderQuotedContent()}
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

  const handleReturnToLeads = () => {
    setShowAssignSuccessModal(false);
    // Navigate to leads page
    window.location.href = '/tickets/leads';
  };

  return (
    <>
      {renderContent()}
      <ManageLeadModal
        isOpen={showManageLeadModal}
        onClose={() => setShowManageLeadModal(false)}
        onProceed={handleManageLeadProceed}
        currentStage={lead.lead_status}
      />
      <AssignSuccessModal
        isOpen={showAssignSuccessModal}
        onClose={() => setShowAssignSuccessModal(false)}
        onReturnToPage={handleReturnToLeads}
        assigneeName={assignedUserInfo?.name || ''}
        assigneeTitle={assignedUserInfo?.title || ''}
        assigneeAvatar={assignedUserInfo?.avatar}
      />
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
