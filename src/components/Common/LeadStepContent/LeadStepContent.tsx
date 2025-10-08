import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Lead } from '@/types/lead';
import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { TabCard, TabItem } from '@/components/Common/TabCard/TabCard';
import { QuoteSummaryCard } from '@/components/Common/QuoteSummaryCard/QuoteSummaryCard';
import { SalesCadenceCard } from '@/components/Common/SalesCadenceCard/SalesCadenceCard';
import { ContactInformationCard } from '@/components/Common/ContactInformationCard/ContactInformationCard';
import { ServiceLocationCard } from '@/components/Common/ServiceLocationCard/ServiceLocationCard';
import { ManageLeadModal } from '@/components/Common/ManageLeadModal/ManageLeadModal';
import { AssignSuccessModal } from '@/components/Common/AssignSuccessModal/AssignSuccessModal';
import { CompleteTaskModal } from '@/components/Common/CompleteTaskModal/CompleteTaskModal';
import { PestSelection } from '@/components/Common/PestSelection/PestSelection';
import { AdditionalPestsSelection } from '@/components/Common/AdditionalPestsSelection/AdditionalPestsSelection';
import { CustomDropdown } from '@/components/Common/CustomDropdown/CustomDropdown';
import CustomerInformation from '@/components/Tickets/TicketContent/CustomerInformation';
import { ActivityFeed } from '@/components/Common/ActivityFeed/ActivityFeed';
import { NotesSection } from '@/components/Common/NotesSection/NotesSection';
import { useUser } from '@/hooks/useUser';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import { usePricingSettings } from '@/hooks/usePricingSettings';
import { useQuoteRealtime } from '@/hooks/useQuoteRealtime';
import { authenticatedFetch, adminAPI } from '@/lib/api-client';
import {
  createCustomerChannel,
  broadcastCustomerUpdate,
  removeCustomerChannel,
  subscribeToCustomerUpdates,
} from '@/lib/realtime/customer-channel';
import AudioPlayer from '@/components/Common/AudioPlayer/AudioPlayer';
import {
  AddressAutocomplete,
  AddressComponents,
} from '@/components/Common/AddressAutocomplete/AddressAutocomplete';
import { StreetViewImage } from '@/components/Common/StreetViewImage/StreetViewImage';
import { ServiceAddressData } from '@/lib/service-addresses';
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
} from 'lucide-react';
import styles from './LeadStepContent.module.scss';
import cadenceStyles from '../SalesCadenceCard/SalesCadenceCard.module.scss';
import cardStyles from '@/components/Common/InfoCard/InfoCard.module.scss';

interface LeadStepContentProps {
  lead: Lead;
  isAdmin: boolean;
  onLeadUpdate?: (updatedLead?: Lead) => void;
  onShowToast?: (message: string, type: 'success' | 'error') => void;
}

export function LeadStepContent({
  lead,
  isAdmin,
  onLeadUpdate,
  onShowToast,
}: LeadStepContentProps) {
  const [ticketType, setTicketType] = useState('sales');
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [isAssignmentDropdownOpen, setIsAssignmentDropdownOpen] =
    useState(false);
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

  // Create a ticket-like object for the CustomerInformation component
  // Include lead.customer in dependencies to update when customer data changes
  const createTicketFromLead = useMemo(() => {
    return {
      id: lead.id,
      customer: lead.customer || undefined,
      company_id: lead.company_id,
      created_at: lead.created_at,
      updated_at: lead.updated_at,
    } as any;
  }, [
    lead.id,
    lead.customer,
    lead.company_id,
    lead.created_at,
    lead.updated_at,
  ]);

  // Refs
  const pestDropdownRef = useRef<HTMLDivElement>(null);
  const additionalPestDropdownRef = useRef<HTMLDivElement>(null);
  const assignmentDropdownRef = useRef<HTMLDivElement>(null);
  const customerChannelRef = useRef<any>(null);

  // Service Location form state
  const [serviceLocationData, setServiceLocationData] =
    useState<ServiceAddressData>({
      street_address: '',
      city: '',
      state: '',
      zip_code: '',
      latitude: undefined,
      longitude: undefined,
      address_type: 'residential',
    });
  const [originalServiceAddress, setOriginalServiceAddress] =
    useState<ServiceAddressData | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
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
  const [serviceSelections, setServiceSelections] = useState<
    Array<{
      id: string;
      servicePlan: any | null;
      displayOrder: number;
      frequency: string;
      discount: string;
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
  const [allServicePlans, setAllServicePlans] = useState<any[]>([]);
  const [loadingPestOptions, setLoadingPestOptions] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingServicePlans, setLoadingServicePlans] = useState(false);
  const [activeServiceTab, setActiveServiceTab] = useState('overview');
  const [serviceFrequency, setServiceFrequency] = useState<string>('');
  const [discount, setDiscount] = useState<string>('');
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

  const { user } = useUser();
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
    enabled:
      lead.lead_status === 'quoted' || lead.lead_status === 'ready_to_schedule',
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

  // Pre-fill service location with primary service address when component loads
  useEffect(() => {
    // Only pre-fill if we haven't already set the service location data
    if (originalServiceAddress === null) {
      if (lead.primary_service_address) {
        const addressData: ServiceAddressData = {
          street_address: lead.primary_service_address.street_address || '',
          city: lead.primary_service_address.city || '',
          state: lead.primary_service_address.state || '',
          zip_code: lead.primary_service_address.zip_code || '',
          apartment_unit: lead.primary_service_address.apartment_unit,
          address_line_2: lead.primary_service_address.address_line_2,
          latitude: lead.primary_service_address.latitude,
          longitude: lead.primary_service_address.longitude,
          address_type:
            lead.primary_service_address.address_type || 'residential',
          property_notes: lead.primary_service_address.property_notes,
        };

        // Store original service address for change detection
        setOriginalServiceAddress(addressData);

        setServiceLocationData(prev => ({
          ...prev,
          ...addressData,
        }));
      } else if (lead.customer) {
        // Fallback to customer address if no primary service address exists
        const customerAddressData: ServiceAddressData = {
          street_address: lead.customer?.address || '',
          city: lead.customer?.city || '',
          state: lead.customer?.state || '',
          zip_code: lead.customer?.zip_code || '',
          latitude: lead.customer?.latitude,
          longitude: lead.customer?.longitude,
          address_type: 'residential',
        };

        // Store original customer address for change detection
        setOriginalServiceAddress(customerAddressData);

        setServiceLocationData(prev => ({
          ...prev,
          ...customerAddressData,
        }));
      }
    }
  }, [lead.primary_service_address, lead.customer, originalServiceAddress]);

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

  // Initialize serviceSelections from existing quote line items
  useEffect(() => {
    if (
      quote?.line_items &&
      quote.line_items.length > 0 &&
      allServicePlans.length > 0
    ) {
      // Map line items to service selections
      const selectionsFromLineItems = quote.line_items
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
            discount: lineItem.discount_percentage?.toString() || '',
          };
        });

      // Only update if selections are different (prevent infinite loop)
      const currentPlanIds = serviceSelections
        .map(s => s.servicePlan?.id)
        .join(',');
      const newPlanIds = selectionsFromLineItems
        .map(s => s.servicePlan?.id)
        .join(',');

      if (currentPlanIds !== newPlanIds) {
        setServiceSelections(selectionsFromLineItems);
        initialLineItemCreatedRef.current = true; // Mark as initialized from existing data
      }
    }
  }, [quote?.line_items, allServicePlans]);

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

  // Check if we have a complete address (all required fields)
  const hasCompleteAddress = useMemo(() => {
    return !!(
      serviceLocationData.street_address &&
      serviceLocationData.city &&
      serviceLocationData.state &&
      serviceLocationData.zip_code
    );
  }, [serviceLocationData]);

  // Check if we have a complete, unchanged address from original
  const hasCompleteUnchangedAddress = useMemo(() => {
    if (!hasCompleteAddress || !originalServiceAddress) return false;

    // Check if current address matches original (no changes made)
    return (
      serviceLocationData.street_address ===
        originalServiceAddress.street_address &&
      serviceLocationData.city === originalServiceAddress.city &&
      serviceLocationData.state === originalServiceAddress.state &&
      serviceLocationData.zip_code === originalServiceAddress.zip_code &&
      serviceLocationData.apartment_unit ===
        originalServiceAddress.apartment_unit &&
      serviceLocationData.address_line_2 ===
        originalServiceAddress.address_line_2
    );
  }, [serviceLocationData, originalServiceAddress, hasCompleteAddress]);

  // Build formatted address string from current service location data
  // Build the best possible address string with available fields
  const currentFormattedAddress = useMemo(() => {
    const parts = [];

    // Add street address if available
    if (serviceLocationData.street_address?.trim()) {
      parts.push(serviceLocationData.street_address.trim());
    }

    // Add city if available
    if (serviceLocationData.city?.trim()) {
      parts.push(serviceLocationData.city.trim());
    }

    // Add state and zip together if available
    const state = serviceLocationData.state?.trim();
    const zip = serviceLocationData.zip_code?.trim();
    if (state && zip) {
      parts.push(`${state} ${zip}`);
    } else if (state) {
      parts.push(state);
    } else if (zip) {
      parts.push(zip);
    }

    // Return formatted address if we have at least a street address or city
    return parts.length >= 1 &&
      (serviceLocationData.street_address?.trim() ||
        serviceLocationData.city?.trim())
      ? parts.join(', ')
      : '';
  }, [serviceLocationData]);

  // Detect address changes by comparing current serviceLocationData with originalServiceAddress
  // Only show save/cancel buttons if there's an original address AND it has been changed
  const hasAddressChanges = useMemo(() => {
    if (!originalServiceAddress) return false;

    // Don't show buttons if the original address was empty (new address entry)
    const hadExistingAddress = !!(
      originalServiceAddress.street_address ||
      originalServiceAddress.city ||
      originalServiceAddress.state ||
      originalServiceAddress.zip_code
    );

    if (!hadExistingAddress) return false;

    return (
      serviceLocationData.street_address !==
        originalServiceAddress.street_address ||
      serviceLocationData.city !== originalServiceAddress.city ||
      serviceLocationData.state !== originalServiceAddress.state ||
      serviceLocationData.zip_code !== originalServiceAddress.zip_code ||
      serviceLocationData.apartment_unit !==
        originalServiceAddress.apartment_unit ||
      serviceLocationData.address_line_2 !==
        originalServiceAddress.address_line_2
    );
  }, [serviceLocationData, originalServiceAddress]);

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

  // State name to abbreviation mapping
  const stateNameToAbbreviation: { [key: string]: string } = {
    Alabama: 'AL',
    Alaska: 'AK',
    Arizona: 'AZ',
    Arkansas: 'AR',
    California: 'CA',
    Colorado: 'CO',
    Connecticut: 'CT',
    Delaware: 'DE',
    Florida: 'FL',
    Georgia: 'GA',
    Hawaii: 'HI',
    Idaho: 'ID',
    Illinois: 'IL',
    Indiana: 'IN',
    Iowa: 'IA',
    Kansas: 'KS',
    Kentucky: 'KY',
    Louisiana: 'LA',
    Maine: 'ME',
    Maryland: 'MD',
    Massachusetts: 'MA',
    Michigan: 'MI',
    Minnesota: 'MN',
    Mississippi: 'MS',
    Missouri: 'MO',
    Montana: 'MT',
    Nebraska: 'NE',
    Nevada: 'NV',
    'New Hampshire': 'NH',
    'New Jersey': 'NJ',
    'New Mexico': 'NM',
    'New York': 'NY',
    'North Carolina': 'NC',
    'North Dakota': 'ND',
    Ohio: 'OH',
    Oklahoma: 'OK',
    Oregon: 'OR',
    Pennsylvania: 'PA',
    'Rhode Island': 'RI',
    'South Carolina': 'SC',
    'South Dakota': 'SD',
    Tennessee: 'TN',
    Texas: 'TX',
    Utah: 'UT',
    Vermont: 'VT',
    Virginia: 'VA',
    Washington: 'WA',
    'West Virginia': 'WV',
    Wisconsin: 'WI',
    Wyoming: 'WY',
  };

  // Service Location handlers
  const handleAddressSelect = (addressComponents: AddressComponents) => {
    // Build street address from components instead of using full formatted address
    let streetAddress = '';
    if (addressComponents.street_number && addressComponents.route) {
      streetAddress = `${addressComponents.street_number} ${addressComponents.route}`;
    } else if (addressComponents.route) {
      streetAddress = addressComponents.route;
    } else {
      // Fallback to formatted address if components not available
      streetAddress = addressComponents.formatted_address || '';
    }

    // Convert state name to abbreviation
    let stateAbbreviation = addressComponents.administrative_area_level_1 || '';
    if (stateNameToAbbreviation[stateAbbreviation]) {
      stateAbbreviation = stateNameToAbbreviation[stateAbbreviation];
    }

    const newLocationData = {
      ...serviceLocationData,
      street_address: streetAddress,
      city: addressComponents.locality || '',
      state: stateAbbreviation,
      zip_code: addressComponents.postal_code || '',
      latitude: addressComponents.latitude,
      longitude: addressComponents.longitude,
      hasStreetView: addressComponents.hasStreetView,
    };

    setServiceLocationData(newLocationData);
  };

  const handleServiceLocationChange = (
    field: keyof ServiceAddressData,
    value: string
  ) => {
    setServiceLocationData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveAddress = async () => {
    if (!lead.customer || !hasAddressChanges) return;

    setIsSavingAddress(true);
    try {
      // Check if we have an existing primary service address to update
      if (lead.primary_service_address?.id) {
        // UPDATE existing service address via API
        const result = await authenticatedFetch(
          `/api/leads/${lead.id}/service-address`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              serviceAddressId: lead.primary_service_address.id,
              addressData: serviceLocationData,
            }),
          }
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to update service address');
        }

        showSuccessToast('Service address updated successfully');
      } else {
        // CREATE new service address and link to both customer and lead via API
        const isPrimary = !lead.primary_service_address; // Set as primary if no existing primary address

        const result = await authenticatedFetch(
          `/api/leads/${lead.id}/service-address`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyId: lead.company_id,
              customerId: lead.customer.id,
              isPrimary,
              addressData: serviceLocationData,
            }),
          }
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to save service address');
        }

        if (result.data?.isExisting) {
          showSuccessToast('Service address linked successfully');
        } else {
          showSuccessToast('Service address created and linked successfully');
        }
      }

      // Update the original service address to reflect the saved state
      // Preserve hasStreetView property so Street View doesn't switch to satellite after save
      setOriginalServiceAddress({
        ...serviceLocationData,
      });

      // Note: We don't call onLeadUpdate() here to avoid refreshing the lead data
      // which would reset the serviceLocationData and lose the hasStreetView property
    } catch (error) {
      console.error('Error saving service address:', error);
      showErrorToast(
        error instanceof Error
          ? error.message
          : 'Failed to save service address'
      );
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleCancelAddressChanges = () => {
    if (!originalServiceAddress) return;

    // Revert service location back to original service address
    setServiceLocationData({
      ...originalServiceAddress,
    });
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
          communication: 'contacting',
          quote: 'quoted',
          schedule: 'ready_to_schedule',
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
          // Assigned to Sales Team - keep as unassigned lead
          if (isAdmin) {
            await adminAPI.updateLead(lead.id, {
              assigned_to: null,
              lead_status: 'unassigned',
            });
          } else {
            await adminAPI.updateUserLead(lead.id, {
              assigned_to: null,
              lead_status: 'unassigned',
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
          // Assigned to specific person - update to contacting status
          if (isAdmin) {
            await adminAPI.updateLead(lead.id, {
              assigned_to: selectedAssignee,
              lead_status: 'contacting',
            });
          } else {
            await adminAPI.updateUserLead(lead.id, {
              assigned_to: selectedAssignee,
              lead_status: 'contacting',
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
          status: 'unassigned',
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

  // Handle progressing lead to ready_to_schedule
  const handleProgressToReadyToSchedule = async () => {
    try {
      if (isAdmin) {
        await adminAPI.updateLead(lead.id, {
          lead_status: 'ready_to_schedule',
        });
      } else {
        await adminAPI.updateUserLead(lead.id, {
          lead_status: 'ready_to_schedule',
        });
      }
      onLeadUpdate?.();
      onShowToast?.('Lead marked as Ready to Schedule!', 'success');
    } catch (error) {
      console.error('Failed to progress lead:', error);
      onShowToast?.('Failed to update lead status', 'error');
    }
  };

  // Handle emailing quote to customer
  const handleEmailQuote = async () => {
    if (!quote) {
      onShowToast?.('No quote available to email', 'error');
      return;
    }

    if (!lead.customer?.email) {
      onShowToast?.('Customer email not found', 'error');
      return;
    }

    try {
      const response = await fetch(`/api/quotes/${quote.id}/email`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email');
      }

      onShowToast?.(`Quote emailed to ${lead.customer.email}`, 'success');
    } catch (error) {
      console.error('Failed to email quote:', error);
      onShowToast?.(
        error instanceof Error ? error.message : 'Failed to send quote email',
        'error'
      );
    }
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

      // Add discount if provided
      if (additionalData?.discount_percentage !== undefined) {
        lineItemData.discount_percentage = additionalData.discount_percentage;
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
    return leadStatus === 'qualified' || leadStatus === 'contacting'
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

  const renderQualifyContent = () => {
    // Define tabs for the left column
    const qualifyTabs: TabItem[] = [
      {
        id: 'assign',
        label: 'Assign Ticket',
        content: (
          <div className={styles.cardContent}>
            {/* Customer Information */}
            <div className={styles.customerSection}>
              <div className={cardStyles.defaultText}>
                {lead.customer
                  ? `${lead.customer.first_name} ${lead.customer.last_name}`
                  : 'No Customer Name'}
              </div>
              <div className={cardStyles.lightText}>
                {lead.customer?.phone || 'No phone number'}
              </div>
              <div className={cardStyles.lightText}>
                {(() => {
                  // Display primary service address if available, fallback to customer billing address
                  if (lead.primary_service_address) {
                    const parts = [];
                    if (lead.primary_service_address.street_address) {
                      parts.push(lead.primary_service_address.street_address);
                    }
                    if (lead.primary_service_address.city) {
                      parts.push(lead.primary_service_address.city);
                    }
                    if (
                      lead.primary_service_address.state &&
                      lead.primary_service_address.zip_code
                    ) {
                      parts.push(
                        `${lead.primary_service_address.state} ${lead.primary_service_address.zip_code}`
                      );
                    }
                    return parts.length > 0
                      ? parts.join(', ')
                      : 'No service address available';
                  }
                  // Fallback to customer billing address
                  return lead.customer?.address || 'No address available';
                })()}
              </div>
            </div>

            {/* Ticket Type Section */}
            <div className={styles.section}>
              <div
                className={`${cardStyles.defaultText} ${styles.sectionLabel}`}
              >
                Ticket Type:
              </div>
              <div className={styles.radioGroup}>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="ticketType"
                    value="sales"
                    checked={ticketType === 'sales'}
                    onChange={e => setTicketType(e.target.value)}
                  />
                  <span className={styles.radioCustom}></span>
                  <span className={cardStyles.defaultText}>Sales Lead</span>
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="ticketType"
                    value="support"
                    checked={ticketType === 'support'}
                    onChange={e => setTicketType(e.target.value)}
                  />
                  <span className={styles.radioCustom}></span>
                  <span className={cardStyles.defaultText}>Support Case</span>
                </label>
                <label className={styles.radioOption}>
                  <input
                    type="radio"
                    name="ticketType"
                    value="junk"
                    checked={ticketType === 'junk'}
                    onChange={e => setTicketType(e.target.value)}
                  />
                  <span className={styles.radioCustom}></span>
                  <span className={cardStyles.defaultText}>Junk</span>
                </label>
              </div>
            </div>

            {/* Assign To Section - only show if not junk */}
            {ticketType !== 'junk' && (
              <div className={styles.section}>
                <div
                  className={`${cardStyles.defaultText} ${styles.sectionLabel}`}
                >
                  Assign to:
                </div>
                <div className={styles.dropdown} ref={assignmentDropdownRef}>
                  <button
                    className={styles.dropdownButton}
                    onClick={() =>
                      setIsAssignmentDropdownOpen(!isAssignmentDropdownOpen)
                    }
                  >
                    <div className={styles.dropdownContent}>
                      <div className={styles.avatarContainer}>
                        {(() => {
                          const display = getSelectedAssigneeDisplay();
                          if (display.isTeam) {
                            return <TeamAvatar />;
                          }
                          if (display.avatar) {
                            return (
                              <Image
                                src={display.avatar}
                                alt={display.name}
                                width={32}
                                height={32}
                                className={styles.avatar}
                              />
                            );
                          }
                          return <DefaultAvatar name={display.name} />;
                        })()}
                      </div>
                      <div className={styles.userInfo}>
                        <div
                          className={cardStyles.defaultText}
                          style={{ color: 'var(--action-500)' }}
                        >
                          {getSelectedAssigneeDisplay().name}
                        </div>
                        <div className={cardStyles.lightText}>
                          {getSelectedAssigneeDisplay().subtitle}
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      size={24}
                      className={`${styles.chevronIcon} ${isAssignmentDropdownOpen ? styles.rotated : ''}`}
                    />
                  </button>
                  {isAssignmentDropdownOpen && (
                    <div className={styles.dropdownMenu}>
                      {/* Current user first */}
                      {currentUser && (
                        <button
                          className={`${styles.dropdownOption} ${selectedAssignee === user?.id ? styles.selected : ''}`}
                          onClick={() => handleAssigneeSelect(user?.id || '')}
                        >
                          <div className={styles.avatarContainer}>
                            {currentUser.avatar ? (
                              <Image
                                src={currentUser.avatar}
                                alt={currentUser.name}
                                width={32}
                                height={32}
                                className={styles.avatar}
                              />
                            ) : (
                              <DefaultAvatar name={currentUser.name} />
                            )}
                          </div>
                          <div className={styles.userInfo}>
                            <div className={cardStyles.defaultText}>
                              {currentUser.name}
                            </div>
                            <div className={cardStyles.lightText}>Myself</div>
                          </div>
                        </button>
                      )}

                      {/* Team option - Sales Team when ticket type is sales, Support Team when support */}
                      {ticketType === 'sales' && (
                        <button
                          className={`${styles.dropdownOption} ${selectedAssignee === 'sales_team' ? styles.selected : ''}`}
                          onClick={() => handleAssigneeSelect('sales_team')}
                        >
                          <div className={styles.avatarContainer}>
                            <TeamAvatar />
                          </div>
                          <div className={styles.userInfo}>
                            <div className={cardStyles.defaultText}>
                              Sales Team
                            </div>
                            <div className={cardStyles.lightText}>
                              {getTeamCount()} members
                            </div>
                          </div>
                        </button>
                      )}

                      {ticketType === 'support' && (
                        <button
                          className={`${styles.dropdownOption} ${selectedAssignee === 'support_team' ? styles.selected : ''}`}
                          onClick={() => handleAssigneeSelect('support_team')}
                        >
                          <div className={styles.avatarContainer}>
                            <TeamAvatar />
                          </div>
                          <div className={styles.userInfo}>
                            <div className={cardStyles.defaultText}>
                              Support Team
                            </div>
                            <div className={cardStyles.lightText}>
                              {getTeamCount()} members
                            </div>
                          </div>
                        </button>
                      )}

                      {/* Team members - filtered by department */}
                      {(ticketType === 'sales' || ticketType === 'support') &&
                        assignableUsers
                          .filter(companyUser => companyUser.id !== user?.id)
                          .map(companyUser => (
                            <button
                              key={companyUser.id}
                              className={`${styles.dropdownOption} ${selectedAssignee === companyUser.id ? styles.selected : ''}`}
                              onClick={() =>
                                handleAssigneeSelect(companyUser.id)
                              }
                            >
                              <div className={styles.avatarContainer}>
                                {companyUser.avatar_url ? (
                                  <Image
                                    src={companyUser.avatar_url}
                                    alt={companyUser.display_name}
                                    width={32}
                                    height={32}
                                    className={styles.avatar}
                                  />
                                ) : (
                                  <DefaultAvatar
                                    name={companyUser.display_name}
                                  />
                                )}
                              </div>
                              <div className={styles.userInfo}>
                                <div className={cardStyles.defaultText}>
                                  {companyUser.display_name}
                                </div>
                                <div className={cardStyles.lightText}>
                                  {companyUser.email}
                                </div>
                              </div>
                            </button>
                          ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className={styles.actionSection}>
              <button
                className={styles.assignButton}
                onClick={
                  selectedAssignee === user?.id
                    ? handleManageLead
                    : handleAssignTicket
                }
                disabled={isAssigning || !selectedAssignee}
              >
                {isAssigning ? (
                  'Processing...'
                ) : (
                  <>
                    {ticketType === 'junk' && (
                      <Trash2
                        size={13.5}
                        width={13.5}
                        height={15}
                        color="white"
                      />
                    )}
                    {getButtonText()}
                  </>
                )}
              </button>
            </div>
          </div>
        ),
      },
      {
        id: 'call',
        label:
          lead.lead_type === 'web_form' ? 'Form Details' : 'Call Information',
        content: (
          <div className={styles.cardContent}>
            {lead.lead_type === 'web_form' ? (
              <>
                {/* Widget Details Section - only for widget submissions */}
                {lead.lead_source === 'widget_submission' && (
                  <div>
                    <div className={styles.callInsightsSection}>
                      <h4 className={cardStyles.defaultText}>
                        Widget Details:
                      </h4>
                    </div>
                    <div className={styles.callInsightsGrid}>
                      <div className={styles.callDetailItem}>
                        <span className={cardStyles.dataLabel}>Pest Type</span>
                        <span className={cardStyles.dataText}>
                          {capitalizeFirst(lead.pest_type)}
                        </span>
                      </div>
                      <div className={styles.callDetailItem}>
                        <span className={cardStyles.dataLabel}>
                          Estimated Price
                        </span>
                        <span className={cardStyles.dataText}>
                          {lead.estimated_value
                            ? `$${lead.estimated_value.toLocaleString()}`
                            : 'Not specified'}
                        </span>
                      </div>
                      <div className={styles.callDetailItem}>
                        <span className={cardStyles.dataLabel}>
                          Selected Plan
                        </span>
                        <span className={cardStyles.dataText}>
                          {lead.selected_plan_id
                            ? 'Plan Selected'
                            : 'Not selected'}
                        </span>
                      </div>
                      <div className={styles.callDetailItem}>
                        <span className={cardStyles.dataLabel}>
                          Recommended Plan
                        </span>
                        <span className={cardStyles.dataText}>
                          {lead.recommended_plan_name || 'None provided'}
                        </span>
                      </div>
                      <div className={styles.callDetailItem}>
                        <span className={cardStyles.dataLabel}>
                          Requested Date
                        </span>
                        <span className={cardStyles.dataText}>
                          {lead.requested_date
                            ? new Date(lead.requested_date).toLocaleDateString()
                            : 'Not specified'}
                        </span>
                      </div>
                      <div className={styles.callDetailItem}>
                        <span className={cardStyles.dataLabel}>
                          Requested Time
                        </span>
                        <span className={cardStyles.dataText}>
                          {capitalizeFirst(lead.requested_time || 'anytime')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Insights Section */}
                <div>
                  <div className={styles.callInsightsSection}>
                    <h4 className={cardStyles.defaultText}>Form Insights:</h4>
                  </div>
                  <div className={styles.callInsightsGrid}>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>Source</span>
                      <span className={cardStyles.dataText}>
                        {getLeadSourceDisplay(lead.lead_source)}
                      </span>
                    </div>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>Lead Status</span>
                      <span className={cardStyles.dataText}>
                        {capitalizeFirst(lead.lead_status.replace('_', ' '))}
                      </span>
                    </div>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>Priority</span>
                      <span className={cardStyles.dataText}>
                        {capitalizeFirst(lead.priority)}
                      </span>
                    </div>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>
                        Estimated Value
                      </span>
                      <span className={cardStyles.dataText}>
                        {lead.estimated_value
                          ? `$${lead.estimated_value.toLocaleString()}`
                          : 'Not specified'}
                      </span>
                    </div>
                    {lead.attribution_data?.page_url && (
                      <div className={styles.callDetailItem}>
                        <span className={cardStyles.dataLabel}>Page URL</span>
                        <span
                          className={cardStyles.dataText}
                          title={lead.attribution_data.page_url}
                        >
                          {lead.attribution_data.page_url}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Details Section */}
                <div className={styles.callDetailsSection}>
                  <div className={styles.callDetailsHeader}>
                    <h4 className={cardStyles.defaultText}>Form Details:</h4>
                  </div>
                  <div className={styles.callInsightsGrid}>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>
                        Form Submitted
                      </span>
                      <span className={cardStyles.dataText}>
                        {formatCallTimestamp(lead.created_at)}
                      </span>
                    </div>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>Service Type</span>
                      <span className={cardStyles.dataText}>
                        {lead.service_type || 'Not specified'}
                      </span>
                    </div>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>UTM Source</span>
                      <span className={cardStyles.dataText}>
                        {lead.utm_source || 'Direct'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Form Message Section */}
                {lead.comments && (
                  <div className={styles.transcriptSection}>
                    <div className={styles.transcriptHeader}>
                      <h4 className={cardStyles.dataLabel}>
                        Form Submission Details
                      </h4>
                    </div>
                    <div className={styles.transcriptContent}>
                      <span className={cardStyles.transcriptText}>
                        {lead.comments}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : lead.call_record ? (
              <>
                {/* Call Insights Section */}
                <div>
                  <div className={styles.callInsightsSection}>
                    <h4 className={cardStyles.defaultText}>Call Insights:</h4>
                  </div>
                  <div className={styles.callInsightsGrid}>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>Method</span>
                      <span className={cardStyles.dataText}>
                        {getCallMethod()}
                      </span>
                    </div>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>Source</span>
                      <span className={cardStyles.dataText}>
                        {getLeadSourceDisplay(lead.lead_source)}
                      </span>
                    </div>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>
                        AI Qualification
                      </span>
                      <span className={cardStyles.dataText}>
                        {getAIQualification(lead.lead_status)}
                      </span>
                    </div>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>
                        Caller Sentiment
                      </span>
                      <span className={cardStyles.dataText}>
                        {capitalizeFirst(lead.call_record.sentiment)}
                      </span>
                    </div>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>
                        Primary Pest Issue
                      </span>
                      <span className={cardStyles.dataText}>
                        {capitalizeFirst(lead.call_record.pest_issue)}
                      </span>
                    </div>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>
                        Preferred Service Time
                      </span>
                      <span className={cardStyles.dataText}>
                        {capitalizeFirst(
                          lead.call_record.preferred_service_time
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Call Details Section */}
                <div className={styles.callDetailsSection}>
                  <div className={styles.callDetailsHeader}>
                    <h4 className={cardStyles.defaultText}>Call Details:</h4>
                  </div>
                  <div className={styles.callInsightsGrid}>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>Call Started</span>
                      <span className={cardStyles.dataText}>
                        {formatCallTimestamp(lead.call_record.start_timestamp)}
                      </span>
                    </div>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>Call Ended</span>
                      <span className={cardStyles.dataText}>
                        {formatCallTimestamp(lead.call_record.end_timestamp)}
                      </span>
                    </div>
                    <div className={styles.callDetailItem}>
                      <span className={cardStyles.dataLabel}>
                        Disconnect Reason
                      </span>
                      <span className={cardStyles.dataText}>
                        {capitalizeFirst(lead.call_record.disconnect_reason)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Call Recording Section */}
                {lead.call_record.recording_url && (
                  <div className={styles.recordingSection}>
                    <h4 className={cardStyles.dataLabel}>Call Recording</h4>
                    <AudioPlayer
                      src={lead.call_record.recording_url}
                      title={`Call Recording - ${lead.customer?.first_name} ${lead.customer?.last_name}`.trim()}
                    />
                  </div>
                )}

                {/* Call Transcript/Summary Section */}
                {(lead.call_record.transcript ||
                  lead.call_record.call_analysis?.call_summary) && (
                  <div className={styles.transcriptSection}>
                    <div className={styles.transcriptHeader}>
                      <h4 className={cardStyles.dataLabel}>
                        {showCallSummary ? 'Call Summary' : 'Call Transcript'}
                      </h4>
                      {lead.call_record.call_analysis?.call_summary && (
                        <div
                          className={`${styles.toggleContainer} ${showCallSummary ? styles.active : ''}`}
                        >
                          <button
                            className={`${styles.transcriptToggle} ${showCallSummary ? styles.active : ''}`}
                            onClick={() => setShowCallSummary(!showCallSummary)}
                            aria-label={
                              showCallSummary
                                ? 'Switch to transcript'
                                : 'Switch to summary'
                            }
                          >
                            <div className={styles.toggleCircle}></div>
                          </button>
                          <span className={styles.toggleLabel}>
                            Call Summary
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={styles.transcriptContent}>
                      <span className={cardStyles.transcriptText}>
                        {showCallSummary
                          ? lead.call_record.call_analysis?.call_summary
                          : lead.call_record.transcript}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.noCallData}>
                <p>No call data available for this lead.</p>
              </div>
            )}
          </div>
        ),
      },
    ];

    return (
      <>
        <div className={styles.contentLeft}>
          <TabCard tabs={qualifyTabs} defaultTabId="assign" />
        </div>

        <div className={styles.contentRight}>
          <InfoCard
            title="Contact Information"
            icon={<SquareUserRound size={20} />}
            startExpanded={true}
          >
            <CustomerInformation
              ticket={createTicketFromLead}
              activityEntityType="lead"
              activityEntityId={lead.id}
              onUpdate={async updatedCustomer => {
                // Update the lead's customer data optimistically
                if (lead.customer && updatedCustomer) {
                  // Merge the updated customer data into the lead
                  const updatedLead = {
                    ...lead,
                    customer: {
                      ...lead.customer,
                      ...updatedCustomer,
                    },
                  };

                  // Call onLeadUpdate with the updated lead data
                  // This will update the parent state without a full page reload
                  if (onLeadUpdate) {
                    onLeadUpdate(updatedLead);
                  }

                  // Broadcast the customer update via realtime channel
                  if (customerChannelRef.current && lead.customer.id) {
                    await broadcastCustomerUpdate(customerChannelRef.current, {
                      customer_id: lead.customer.id,
                      first_name: updatedCustomer.first_name,
                      last_name: updatedCustomer.last_name,
                      email: updatedCustomer.email,
                      phone: updatedCustomer.phone,
                      updated_by: user?.id,
                      timestamp: new Date().toISOString(),
                    });
                  }
                }

                if (onShowToast) {
                  onShowToast(
                    'Customer information updated successfully.',
                    'success'
                  );
                }
              }}
            />
          </InfoCard>

          <ServiceLocationCard
            serviceAddress={lead.primary_service_address || null}
            startExpanded={false}
            showSizeInputs
            pricingSettings={pricingSettings || undefined}
            onShowToast={onShowToast}
            editable={true}
            onAddressSelect={handleAddressSelect}
            onSaveAddress={handleSaveAddress}
            onCancelAddress={handleCancelAddressChanges}
            hasAddressChanges={hasAddressChanges}
            isSavingAddress={isSavingAddress}
            serviceLocationData={serviceLocationData}
            onServiceLocationChange={handleServiceLocationChange}
            hasCompleteUnchangedAddress={hasCompleteUnchangedAddress}
            currentFormattedAddress={currentFormattedAddress}
          />

          <InfoCard
            title="Activity"
            icon={<SquareActivity size={20} />}
            startExpanded={false}
          >
            <ActivityFeed
              entityType="lead"
              entityId={lead.id}
              companyId={lead.company_id}
            />
          </InfoCard>

          <InfoCard
            title="Notes"
            icon={<NotebookPen size={20} />}
            startExpanded={false}
          >
            <NotesSection
              entityType="lead"
              entityId={lead.id}
              companyId={lead.company_id}
              userId={user?.id || ''}
            />
          </InfoCard>
        </div>
      </>
    );
  };

  const renderContactingContent = () => {
    const contactingTabs: TabItem[] = [
      {
        id: 'contact',
        label: 'Contact Log',
        content: (
          <div className={styles.cardContent}>
            <div>
              <h4 className={cardStyles.defaultText}>
                Next Recommended Action:
              </h4>
              {loadingNextTask ? (
                <div className={cardStyles.dataLabel}>Loading...</div>
              ) : hasActiveCadence ? (
                // Active cadence exists - show next task or completion message
                nextTask ? (
                  <div className={cadenceStyles.stepItem}>
                    <div className={cadenceStyles.stepIcon}>
                      {nextTask.action_type === 'live_call' ||
                      nextTask.action_type === 'outbound_call' ||
                      nextTask.action_type === 'ai_call' ? (
                        <Phone size={16} />
                      ) : nextTask.action_type === 'text_message' ? (
                        <MessageSquareMore size={16} />
                      ) : nextTask.action_type === 'email' ? (
                        <Mail size={16} />
                      ) : (
                        <MessageSquareMore size={16} />
                      )}
                    </div>
                    <div className={cadenceStyles.stepContent}>
                      <div className={cadenceStyles.stepHeader}>
                        <span className={cardStyles.inputText}>
                          Day {nextTask.day_number}:{' '}
                          {nextTask.time_of_day === 'AM'
                            ? 'Morning'
                            : nextTask.time_of_day === 'PM'
                              ? 'Afternoon'
                              : nextTask.time_of_day}{' '}
                          {nextTask.action_type === 'live_call'
                            ? 'Call'
                            : nextTask.action_type === 'outbound_call'
                              ? 'Outbound Call'
                              : nextTask.action_type === 'ai_call'
                                ? 'AI Call'
                                : nextTask.action_type === 'text_message'
                                  ? 'Text'
                                  : nextTask.action_type === 'email'
                                    ? 'Email'
                                    : nextTask.action_type}
                        </span>
                        <div className={cadenceStyles.priorityIndicator}>
                          <span className={cardStyles.inputText}>
                            {nextTask.priority.charAt(0).toUpperCase() +
                              nextTask.priority.slice(1)}
                          </span>
                          <div
                            className={`${cadenceStyles.priorityDot} ${
                              nextTask.priority === 'urgent'
                                ? cadenceStyles.priorityDotUrgent
                                : nextTask.priority === 'high'
                                  ? cadenceStyles.priorityDotHigh
                                  : nextTask.priority === 'low'
                                    ? cadenceStyles.priorityDotLow
                                    : cadenceStyles.priorityDotMedium
                            }`}
                          >
                            <div className={cadenceStyles.priorityDotInner} />
                          </div>
                        </div>
                      </div>
                      {nextTask.due_date && nextTask.due_time ? (
                        <div className={cardStyles.dataLabel}>
                          Target:{' '}
                          {new Date(
                            nextTask.due_date + 'T00:00:00'
                          ).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'numeric',
                            day: 'numeric',
                          })}{' '}
                          |{' '}
                          {new Date(
                            `1970-01-01T${nextTask.due_time}`
                          ).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </div>
                      ) : nextTask.due_date ? (
                        <div className={cardStyles.dataLabel}>
                          Target:{' '}
                          {new Date(
                            nextTask.due_date + 'T00:00:00'
                          ).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'numeric',
                            day: 'numeric',
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className={cardStyles.dataLabel}>
                    All cadence steps completed! 🎉
                  </div>
                )
              ) : (
                <div
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #93c5fd',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      cx="10"
                      cy="10"
                      r="9"
                      stroke="#3b82f6"
                      strokeWidth="2"
                    />
                    <path
                      d="M10 6V10M10 14H10.01"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <span style={{ color: '#3b82f6', fontSize: '14px' }}>
                    Select a sales cadence to automatically create and schedule
                    your tasks!
                  </span>
                </div>
              )}
            </div>

            <div>
              <h4 className={cardStyles.defaultText}>
                Select activity to log:
              </h4>
              <div className={styles.tabContainer}>
                {[
                  { id: 'outbound_call', label: 'Outbound Call' },
                  { id: 'text_message', label: 'Text Message' },
                  { id: 'ai_call', label: 'AI Call' },
                  { id: 'email', label: 'Email' },
                ].map((tab, index, array) => (
                  <button
                    key={tab.id}
                    onClick={() => setSelectedActionType(tab.id)}
                    className={`${styles.tabButton} ${
                      selectedActionType === tab.id
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
            </div>

            <div>
              <label
                className={cardStyles.inputLabels}
                style={{ display: 'block' }}
              >
                Comment <span className={cardStyles.dataLabel}>(optional)</span>
              </label>
              <textarea
                value={activityNotes}
                onChange={e => setActivityNotes(e.target.value)}
                placeholder={
                  selectedActionType === 'outbound_call'
                    ? 'Add details about this call'
                    : selectedActionType === 'text_message'
                      ? 'Add details about this text message'
                      : selectedActionType === 'ai_call'
                        ? 'Add details about this AI call'
                        : selectedActionType === 'email'
                          ? 'Add details about this email'
                          : 'Add a comment to ticket history'
                }
                style={{
                  width: '100%',
                  minHeight: '80px',
                  padding: '8px 12px',
                  border: '1px solid var(--gray-300)',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                  backgroundColor: 'white',
                }}
              />
            </div>

            {selectedActionType && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                }}
              >
                <button
                  onClick={async () => {
                    // Check if this activity matches the next recommended action
                    const activityMatchesTask =
                      nextTask && nextTask.action_type === selectedActionType;

                    if (activityMatchesTask) {
                      // Show modal to ask if they want to mark task complete
                      setPendingActivity({
                        type: selectedActionType,
                        notes: activityNotes || '',
                      });
                      setShowCompleteTaskModal(true);
                      return;
                    }

                    // If doesn't match, just log the activity without asking
                    setIsLoggingActivity(true);
                    try {
                      const response = await fetch(
                        `/api/leads/${lead.id}/activities`,
                        {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            activity_type: selectedActionType,
                            notes: activityNotes || null,
                          }),
                        }
                      );

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
                  }}
                  disabled={isLoggingActivity}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: isLoggingActivity ? 'not-allowed' : 'pointer',
                    opacity: isLoggingActivity ? 0.6 : 1,
                  }}
                >
                  {isLoggingActivity ? 'Logging...' : 'Log Activity'}
                </button>
              </div>
            )}
          </div>
        ),
      },
      {
        id: 'cadence',
        label: 'Sales Cadence',
        content: (
          <SalesCadenceCard
            leadId={lead.id}
            companyId={lead.company_id}
            leadCreatedAt={lead.created_at}
            onCadenceSelect={setSelectedCadenceId}
            onStartCadence={handleStartCadence}
            isStartingCadence={isStartingCadence}
            hideCard={true}
          />
        ),
      },
    ];

    return (
      <>
        <div className={styles.contentLeft}>
          <TabCard tabs={contactingTabs} defaultTabId="contact" />
        </div>

        <div className={styles.contentRight}>
          <InfoCard
            title="Contact Information"
            icon={<SquareUserRound size={20} />}
            startExpanded={true}
          >
            <CustomerInformation
              ticket={createTicketFromLead}
              activityEntityType="lead"
              activityEntityId={lead.id}
              onUpdate={async updatedCustomer => {
                // Update the lead's customer data optimistically
                if (lead.customer && updatedCustomer) {
                  // Merge the updated customer data into the lead
                  const updatedLead = {
                    ...lead,
                    customer: {
                      ...lead.customer,
                      ...updatedCustomer,
                    },
                  };

                  // Call onLeadUpdate with the updated lead data
                  // This will update the parent state without a full page reload
                  if (onLeadUpdate) {
                    onLeadUpdate(updatedLead);
                  }

                  // Broadcast the customer update via realtime channel
                  if (customerChannelRef.current && lead.customer.id) {
                    await broadcastCustomerUpdate(customerChannelRef.current, {
                      customer_id: lead.customer.id,
                      first_name: updatedCustomer.first_name,
                      last_name: updatedCustomer.last_name,
                      email: updatedCustomer.email,
                      phone: updatedCustomer.phone,
                      updated_by: user?.id,
                      timestamp: new Date().toISOString(),
                    });
                  }
                }

                if (onShowToast) {
                  onShowToast(
                    'Customer information updated successfully.',
                    'success'
                  );
                }
              }}
            />
          </InfoCard>

          <ServiceLocationCard
            serviceAddress={lead.primary_service_address || null}
            startExpanded={false}
            showSizeInputs
            pricingSettings={pricingSettings || undefined}
            onShowToast={onShowToast}
            editable={true}
            onAddressSelect={handleAddressSelect}
            onSaveAddress={handleSaveAddress}
            onCancelAddress={handleCancelAddressChanges}
            hasAddressChanges={hasAddressChanges}
            isSavingAddress={isSavingAddress}
            serviceLocationData={serviceLocationData}
            onServiceLocationChange={handleServiceLocationChange}
            hasCompleteUnchangedAddress={hasCompleteUnchangedAddress}
            currentFormattedAddress={currentFormattedAddress}
          />

          <InfoCard
            title="Activity"
            icon={<SquareActivity size={20} />}
            startExpanded={false}
          >
            <ActivityFeed
              entityType="lead"
              entityId={lead.id}
              companyId={lead.company_id}
            />
          </InfoCard>

          <InfoCard
            title="Notes"
            icon={<NotebookPen size={20} />}
            startExpanded={false}
          >
            <NotesSection
              entityType="lead"
              entityId={lead.id}
              companyId={lead.company_id}
              userId={user?.id || ''}
            />
          </InfoCard>
        </div>
      </>
    );
  };

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
                      <div className={styles.formField}>
                        <label className={styles.fieldLabel}>Discount</label>
                        <CustomDropdown
                          options={[
                            { value: '0', label: 'No Discount' },
                            { value: '5', label: '5% off Initial' },
                            { value: '10', label: '10% off Initial' },
                            { value: '15', label: '15% off Initial' },
                            { value: '20', label: '20% off Initial' },
                          ]}
                          value={selection.discount}
                          onChange={async newDiscount => {
                            setServiceSelections(prev =>
                              prev.map((sel, idx) =>
                                idx === index
                                  ? { ...sel, discount: newDiscount }
                                  : sel
                              )
                            );

                            if (selection.servicePlan && newDiscount !== '') {
                              await createOrUpdateQuoteLineItem(
                                selection.servicePlan,
                                selection.displayOrder,
                                {
                                  discount_percentage: parseFloat(newDiscount),
                                }
                              );
                            }
                          }}
                          placeholder="Select Discount"
                        />
                      </div>
                    </div>
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
                                  {quote?.line_items?.[0]
                                    ?.final_initial_price || 0}
                                </div>
                                {quote?.line_items?.[0]?.discount_percentage ? (
                                  <div className={styles.originalPrice}>
                                    Originally $
                                    {quote?.line_items?.[0]?.initial_price || 0}{' '}
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
                                        ${Math.round(lineItem?.final_recurring_price || 0)}
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
                                        ${Math.round(lineItem?.final_initial_price || 0)}
                                      </div>
                                      {lineItem?.discount_percentage ? (
                                        <div
                                          className={
                                            styles.lineItemOriginalPrice
                                          }
                                        >
                                          Originally $
                                          {Math.round(lineItem?.initial_price || 0)} (-
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
                                  ${Math.round(quote?.total_recurring_price || 0)}
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
      <>
        <div className={styles.contentLeft}>
          <TabCard
            key={`quoted-tabs-${quote?.id}`}
            tabs={quotedTabs}
            defaultTabId={defaultTab}
          />
        </div>

        <div className={styles.contentRight}>
          <InfoCard
            title="Contact Information"
            icon={<SquareUserRound size={20} />}
            startExpanded={true}
          >
            <CustomerInformation
              ticket={createTicketFromLead}
              activityEntityType="lead"
              activityEntityId={lead.id}
              onUpdate={async updatedCustomer => {
                // Update the lead's customer data optimistically
                if (lead.customer && updatedCustomer) {
                  // Merge the updated customer data into the lead
                  const updatedLead = {
                    ...lead,
                    customer: {
                      ...lead.customer,
                      ...updatedCustomer,
                    },
                  };

                  // Call onLeadUpdate with the updated lead data
                  // This will update the parent state without a full page reload
                  if (onLeadUpdate) {
                    onLeadUpdate(updatedLead);
                  }

                  // Broadcast the customer update via realtime channel
                  if (customerChannelRef.current && lead.customer.id) {
                    await broadcastCustomerUpdate(customerChannelRef.current, {
                      customer_id: lead.customer.id,
                      first_name: updatedCustomer.first_name,
                      last_name: updatedCustomer.last_name,
                      email: updatedCustomer.email,
                      phone: updatedCustomer.phone,
                      updated_by: user?.id,
                      timestamp: new Date().toISOString(),
                    });
                  }
                }

                if (onShowToast) {
                  onShowToast(
                    'Customer information updated successfully.',
                    'success'
                  );
                }
              }}
            />
          </InfoCard>

          <ServiceLocationCard
            serviceAddress={lead.primary_service_address || null}
            startExpanded={false}
            showSizeInputs
            pricingSettings={pricingSettings || undefined}
            onShowToast={onShowToast}
            editable={true}
            onAddressSelect={handleAddressSelect}
            onSaveAddress={handleSaveAddress}
            onCancelAddress={handleCancelAddressChanges}
            hasAddressChanges={hasAddressChanges}
            isSavingAddress={isSavingAddress}
            serviceLocationData={serviceLocationData}
            onServiceLocationChange={handleServiceLocationChange}
            hasCompleteUnchangedAddress={hasCompleteUnchangedAddress}
            currentFormattedAddress={currentFormattedAddress}
          />

          <InfoCard
            title="Activity"
            icon={<SquareActivity size={20} />}
            startExpanded={false}
          >
            <ActivityFeed
              entityType="lead"
              entityId={lead.id}
              companyId={lead.company_id}
            />
          </InfoCard>

          <InfoCard
            title="Notes"
            icon={<NotebookPen size={20} />}
            startExpanded={false}
          >
            <NotesSection
              entityType="lead"
              entityId={lead.id}
              companyId={lead.company_id}
              userId={user?.id || ''}
            />
          </InfoCard>
        </div>
      </>
    );
  };

  const renderReadyToScheduleContent = () => {
    const scheduleTabs: TabItem[] = [
      {
        id: 'quote_summary',
        label: 'Quote Summary',
        content: (
          <div className={styles.cardContent}>
            <QuoteSummaryCard
              quote={quote}
              lead={lead}
              isUpdating={isQuoteUpdating}
              onEmailQuote={handleEmailQuote}
              hideCard={true}
            />
          </div>
        ),
      },
      {
        id: 'thank_you',
        label: 'What To Expect / Thank You',
        content: (
          <div className={styles.cardContent}>
            <h3 className={styles.scheduleTabHeading}>
              What To Expect / Thank You
            </h3>
            <p className={styles.scheduleTabText}>
              Thank you message and expectations content will be displayed here.
            </p>
          </div>
        ),
      },
    ];

    return (
      <>
        <div className={styles.contentLeft}>
          <TabCard tabs={scheduleTabs} defaultTabId="quote_summary" />
        </div>
        <div className={styles.contentRight}>
        <InfoCard
          title="Contact Information"
          icon={<SquareUserRound size={20} />}
          startExpanded={true}
        >
          <CustomerInformation
            ticket={createTicketFromLead}
            onUpdate={async updatedCustomer => {
              // Update the lead's customer data optimistically
              if (lead.customer && updatedCustomer) {
                // Merge the updated customer data into the lead
                const updatedLead = {
                  ...lead,
                  customer: {
                    ...lead.customer,
                    ...updatedCustomer,
                  },
                };

                // Call onLeadUpdate with the updated lead data
                // This will update the parent state without a full page reload
                if (onLeadUpdate) {
                  onLeadUpdate(updatedLead);
                }

                // Broadcast the customer update via realtime channel
                if (customerChannelRef.current && lead.customer.id) {
                  await broadcastCustomerUpdate(customerChannelRef.current, {
                    customer_id: lead.customer.id,
                    first_name: updatedCustomer.first_name,
                    last_name: updatedCustomer.last_name,
                    email: updatedCustomer.email,
                    phone: updatedCustomer.phone,
                    updated_by: user?.id,
                    timestamp: new Date().toISOString(),
                  });
                }
              }

              if (onShowToast) {
                onShowToast(
                  'Customer information updated successfully.',
                  'success'
                );
              }
            }}
          />
        </InfoCard>

        <ServiceLocationCard
          serviceAddress={lead.primary_service_address || null}
          showSizeInputs
          pricingSettings={pricingSettings || undefined}
          onShowToast={onShowToast}
        />

        <InfoCard
          title="Activity"
          icon={<SquareActivity size={20} />}
          startExpanded={false}
        >
          <div className={styles.cardContent}>
            <p>Lead activity and interaction history will be displayed here.</p>
          </div>
        </InfoCard>

        <InfoCard
          title="Notes"
          icon={<NotebookPen size={20} />}
          startExpanded={false}
        >
          <div className={styles.cardContent}>
            <p>Lead notes and comments will be displayed here.</p>
          </div>
        </InfoCard>
      </div>
    </>
    );
  };

  // Render content based on lead status
  const renderContent = () => {
    switch (lead.lead_status) {
      case 'unassigned':
        return renderQualifyContent();
      case 'contacting':
        return renderContactingContent();
      case 'quoted':
        return renderQuotedContent();
      case 'ready_to_schedule':
        return renderReadyToScheduleContent();
      default:
        return renderQualifyContent(); // Default to qualify content
    }
  };

  const handleReturnToLeads = () => {
    setShowAssignSuccessModal(false);
    // Navigate to leads page
    window.location.href = '/connections/leads';
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
    </>
  );
}
