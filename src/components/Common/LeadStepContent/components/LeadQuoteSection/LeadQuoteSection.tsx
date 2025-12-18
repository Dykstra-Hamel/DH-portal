'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { QuoteSummaryCard } from '@/components/Common/QuoteSummaryCard/QuoteSummaryCard';
import { PestSelection } from '@/components/Common/PestSelection/PestSelection';
import { AdditionalPestsSelection } from '@/components/Common/AdditionalPestsSelection/AdditionalPestsSelection';
import { CustomDropdown } from '@/components/Common/CustomDropdown/CustomDropdown';
import EligibleAddOnSelector from '@/components/Quotes/EligibleAddOnSelector/EligibleAddOnSelector';
import { ScrollText, X, CircleOff, Plus } from 'lucide-react';
import { useUser } from '@/hooks/useUser';
import { LeadQuoteSectionProps } from '../../types/leadStepTypes';
import { adminAPI } from '@/lib/api-client';
import {
  generateHomeSizeOptions,
  generateYardSizeOptions,
  findSizeOptionByValue,
} from '@/lib/pricing-calculations';
import styles from './LeadQuoteSection.module.scss';
import cardStyles from '@/components/Common/InfoCard/InfoCard.module.scss';

export function LeadQuoteSection({
  lead,
  quote,
  isQuoteUpdating,
  pricingSettings,
  selectedPests,
  additionalPests,
  homeSize,
  yardSize,
  selectedHomeSizeOption,
  selectedYardSizeOption,
  onEmailQuote,
  onShowToast,
  onRequestUndo,
  broadcastQuoteUpdate,
  setSelectedPests,
  setAdditionalPests,
  setHomeSize,
  setYardSize,
  setSelectedHomeSizeOption,
  setSelectedYardSizeOption,
}: LeadQuoteSectionProps) {
  // Refs
  const pestDropdownRef = useRef<HTMLDivElement>(null);
  const additionalPestDropdownRef = useRef<HTMLDivElement>(null);
  const assignmentDropdownRef = useRef<HTMLDivElement>(null);
  const discountsFetchedRef = useRef<Set<string>>(new Set());
  const initialLineItemCreatedRef = useRef(false);
  const lineItemCreationLockRef = useRef<Set<number>>(new Set());

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

  const selectedPlan = serviceSelections[0]?.servicePlan;

  const [activeServiceTab, setActiveServiceTab] = useState('overview');
  const [isAssignmentDropdownOpen, setIsAssignmentDropdownOpen] =
    useState(false);
  const [serviceFrequency, setServiceFrequency] = useState<string>('');
  const [discount, setDiscount] = useState<string>('');
  const [loadingPestOptions, setLoadingPestOptions] = useState(false);
  const [pestOptions, setPestOptions] = useState<any[]>([]);
  const [isPestDropdownOpen, setIsPestDropdownOpen] = useState(false);
  const [isAdditionalPestDropdownOpen, setIsAdditionalPestDropdownOpen] =
    useState(false);
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
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [loadingDiscounts, setLoadingDiscounts] = useState(false);
  const [allServicePlans, setAllServicePlans] = useState<any[]>([]);
  const [loadingServicePlans, setLoadingServicePlans] = useState(false);
  const [customPricingExpanded, setCustomPricingExpanded] = useState<
    Record<number, boolean>
  >({});

  const [calculatedPrices, setCalculatedPrices] = useState<
    Record<
      number,
      {
        initial: number;
        recurring: number;
      }
    >
  >({});

  const { profile } = useUser();

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

  // Auto-select home size option when homeSize changes
  useEffect(() => {
    if (homeSize && homeSizeOptions.length > 0) {
      const option = findSizeOptionByValue(Number(homeSize), homeSizeOptions);
      if (option) {
        setSelectedHomeSizeOption(option.value);
      }
    }
  }, [homeSize, homeSizeOptions]);

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

  // Auto-select yard size option when yardSize changes
  useEffect(() => {
    if (yardSize && yardSizeOptions.length > 0) {
      const option = findSizeOptionByValue(Number(yardSize), yardSizeOptions);
      if (option) {
        setSelectedYardSizeOption(option.value);
      }
    }
  }, [yardSize, yardSizeOptions]);


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

  // Reset initial line item creation flag and lock when lead changes
  useEffect(() => {
    initialLineItemCreatedRef.current = false;
    lineItemCreationLockRef.current.clear();
  }, [lead.id]);

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
        (item: any) => item.display_order === selection.displayOrder
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
      const primaryPest = selectedPests[0];
      if (primaryPest) {
        // Filter out any duplicates and ensure primary is first
        const uniqueAdditional = additionalPestIds.filter(
          (id: string) => id !== primaryPest
        );
        setSelectedPests([primaryPest, ...uniqueAdditional]);
      } else {
        setSelectedPests(additionalPestIds);
      }
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

  // Initialize serviceSelections from existing quote line items
  useEffect(() => {
    if (
      quote?.line_items &&
      quote.line_items.length > 0 &&
      allServicePlans.length > 0
    ) {
      // Separate line items by type
      const servicePlanItems = quote.line_items.filter(
        (item: any) => item.service_plan_id
      );
      const addonItems = quote.line_items.filter((item: any) => item.addon_service_id);

      // Map service plan line items to service selections
      const selectionsFromLineItems = servicePlanItems
        .sort((a: any, b: any) => a.display_order - b.display_order)
        .map((lineItem: any, index: number) => {
          // Find the full service plan data
          const servicePlan = allServicePlans.find(
            (p: any) => p.id === lineItem.service_plan_id
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
        .map((item: any) => item.addon_service_id)
        .filter(Boolean) as string[];

      // Only update if selections are different (prevent infinite loop)
      const currentPlanIds = serviceSelections
        .map((s: any) => s.servicePlan?.id)
        .join(',');
      const newPlanIds = selectionsFromLineItems
        .map((s: any) => s.servicePlan?.id)
        .join(',');

      if (currentPlanIds !== newPlanIds) {
        setServiceSelections(selectionsFromLineItems);
        setSelectedAddOns(addonIds); // Sync add-on selections
        initialLineItemCreatedRef.current = true; // Mark as initialized from existing data

        // Fetch discounts for all service plans
        const fetchAllDiscounts = async () => {
          const planIds = selectionsFromLineItems
            .map((s: any) => s.servicePlan?.id)
            .filter((id: any): id is string => !!id);

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
        ...(quote.line_items?.map((i: any) => i.display_order) || [0])
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
      (item: any) => item.addon_service_id === addonId
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
      (item: any) => item.display_order === displayOrder
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
            quote.line_items.map((item: any) =>
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
        (item: any) => item.display_order === displayOrder
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

  return (
    <InfoCard
      title="Quote"
      icon={<ScrollText size={20} />}
      isCollapsible={true}
      startExpanded={true}
    >
      <div className={styles.cardContent} style={{ position: 'relative' }}>
        {/* Pest Selection Section */}
        <div className={styles.section}>
          <h4 className={cardStyles.defaultText}>Pest Selection</h4>
          {loadingPlan && (
            <div className={styles.loadingOverlay}>
              <div className={styles.loadingText}>Updating service plan...</div>
            </div>
          )}
          {loadingPestOptions ? (
            <div className={cardStyles.lightText}>Loading pest options...</div>
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

        {/* Service Selection Section */}
        <div className={styles.section}>
          <h4 className={cardStyles.defaultText}>Service Selection</h4>
          {(loadingPlan || isQuoteUpdating) && (
            <div className={styles.loadingOverlay}>
              <div className={styles.loadingText}>
                {loadingPlan ? 'Loading service plan...' : 'Updating...'}
              </div>
            </div>
          )}
          {loadingPlan && !selectedPlan ? (
            <div className={styles.emptyState}>Loading service plan...</div>
          ) : (
            <>
              {selectedPests.length === 0 && (
                <div className={styles.emptyState}>
                  No pest selected. You can still configure service details
                  below.
                </div>
              )}
              {selectedPests.length > 0 && !selectedPlan && (
                <div className={styles.emptyState}>
                  No service plans available for selected pest.
                </div>
              )}
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
                            throw new Error('Failed to update home size range');
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
                                    await broadcastQuoteUpdate(revertData.data);
                                  }

                                  onShowToast?.('Change undone', 'success');
                                } catch (error) {
                                  console.error('Error undoing change:', error);
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
                          onShowToast?.('Failed to update home size', 'error');
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
                            throw new Error('Failed to update yard size range');
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
                                    await broadcastQuoteUpdate(revertData.data);
                                  }

                                  onShowToast?.('Change undone', 'success');
                                } catch (error) {
                                  console.error('Error undoing change:', error);
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
                          onShowToast?.('Failed to update yard size', 'error');
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
                            // Auto-set frequency to 'one-time' for one-time plans
                            const newFrequency =
                              plan.plan_category === 'one-time'
                                ? 'one-time'
                                : selection.frequency;

                            setServiceSelections(prev =>
                              prev.map((sel, idx) =>
                                idx === index
                                  ? {
                                      ...sel,
                                      servicePlan: plan,
                                      frequency: newFrequency,
                                    }
                                  : sel
                              )
                            );
                            await createOrUpdateQuoteLineItem(
                              plan,
                              selection.displayOrder,
                              plan.plan_category === 'one-time'
                                ? { service_frequency: 'one-time' }
                                : {}
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
                        options={
                          selection.servicePlan?.plan_category === 'one-time'
                            ? [{ value: 'one-time', label: 'One Time' }]
                            : [
                                { value: 'monthly', label: 'Monthly' },
                                { value: 'quarterly', label: 'Quarterly' },
                                {
                                  value: 'semi-annually',
                                  label: 'Semi-Annually',
                                },
                                { value: 'annually', label: 'Annually' },
                              ]
                        }
                        value={
                          selection.servicePlan?.plan_category === 'one-time'
                            ? 'one-time'
                            : selection.frequency
                        }
                        onChange={async newFrequency => {
                          // Don't allow changing frequency for one-time plans
                          if (
                            selection.servicePlan?.plan_category === 'one-time'
                          ) {
                            return;
                          }

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
                        disabled={
                          selection.servicePlan?.plan_category === 'one-time'
                        }
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
                        disabled={loadingDiscounts || selection.isCustomPriced}
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
                                        calculatedPrices[selection.displayOrder]
                                          ?.initial || 0,
                                      customRecurringPrice:
                                        calculatedPrices[selection.displayOrder]
                                          ?.recurring || 0,
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
                                  const value = parseFloat(e.target.value) || 0;
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
                                  const value = parseFloat(e.target.value) || 0;
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
                                  selection.customInitialPrice !== undefined &&
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
                                  quote?.line_items?.[0]?.final_initial_price ||
                                    0
                                )}
                              </div>
                              {quote?.line_items?.[0]?.discount_percentage ? (
                                <div className={styles.originalPrice}>
                                  Originally $
                                  {Math.round(
                                    quote?.line_items?.[0]?.initial_price || 0
                                  )}{' '}
                                  (-
                                  {quote?.line_items?.[0]?.discount_percentage}
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
                              (item: any) =>
                                item.addon_service_id != null &&
                                item.addon_service_id !== ''
                            ).length > 0 && (
                              <div className={styles.addOnsBreakdown}>
                                <div className={styles.addOnsHeader}>
                                  Add-On Services:
                                </div>
                                {quote.line_items
                                  .filter(
                                    (item: any) =>
                                      item.addon_service_id != null &&
                                      item.addon_service_id !== ''
                                  )
                                  .map((addonItem: any) => (
                                    <div
                                      key={addonItem.id}
                                      className={styles.addonLineItem}
                                    >
                                      <div className={styles.addonName}>
                                        {addonItem.plan_name}
                                      </div>
                                      <div className={styles.addonPrices}>
                                        <span className={styles.addonRecurring}>
                                          +${addonItem.final_recurring_price}/mo
                                        </span>
                                        {addonItem.final_initial_price > 0 && (
                                          <span className={styles.addonInitial}>
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
                              (item: any) =>
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
                          .filter((sel: any) => sel.servicePlan)
                          .map((selection: any, index: number) => {
                            const lineItem = quote?.line_items?.find(
                              (item: any) =>
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
                                      className={styles.lineItemRecurringPrice}
                                    >
                                      $
                                      {Math.round(
                                        lineItem?.final_recurring_price || 0
                                      )}
                                      <span className={styles.lineItemPerMonth}>
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
                                        className={styles.lineItemOriginalPrice}
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
                                    <div className={styles.lineItemInspection}>
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
                            (item: any) =>
                              item.addon_service_id != null &&
                              item.addon_service_id !== ''
                          ).length > 0 && (
                            <div className={styles.addOnsSection}>
                              <div className={styles.addOnsSectionHeader}>
                                Add-On Services
                              </div>
                              {quote.line_items
                                .filter(
                                  (item: any) =>
                                    item.addon_service_id != null &&
                                    item.addon_service_id !== ''
                                )
                                .map((addonItem: any) => (
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
                                            addonItem.final_recurring_price || 0
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
                                    (sum: number, item: any) =>
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
              </div>
            </>
          )}
        </div>

        {/* Quote Summary Section */}
        <div className={styles.section}>
          <h4 className={cardStyles.defaultText}>Quote Summary</h4>
          <QuoteSummaryCard
            quote={quote}
            lead={lead}
            isUpdating={isQuoteUpdating}
            onEmailQuote={onEmailQuote}
            hideCard={true}
          />
        </div>
      </div>
    </InfoCard>
  );
}
