import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { Lead } from '@/types/lead';
import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { QuoteSummaryCard } from '@/components/Common/QuoteSummaryCard/QuoteSummaryCard';
import { useUser } from '@/hooks/useUser';
import { useAssignableUsers } from '@/hooks/useAssignableUsers';
import { usePricingSettings } from '@/hooks/usePricingSettings';
import { useQuoteRealtime } from '@/hooks/useQuoteRealtime';
import { adminAPI } from '@/lib/api-client';
import AudioPlayer from '@/components/Common/AudioPlayer/AudioPlayer';
import {
  AddressAutocomplete,
  AddressComponents,
} from '@/components/Common/AddressAutocomplete/AddressAutocomplete';
import { StreetViewImage } from '@/components/Common/StreetViewImage/StreetViewImage';
import {
  ServiceAddressData,
  createServiceAddressForLead,
  updateExistingServiceAddress,
} from '@/lib/service-addresses';
import {
  generateHomeSizeOptions,
  generateYardSizeOptions,
  findSizeOptionByValue,
} from '@/lib/pricing-calculations';
import {
  Ticket,
  ReceiptText,
  SquareUserRound,
  MapPinned,
  SquareActivity,
  NotebookPen,
  ChevronDown,
  Users,
  Trash2,
  ArrowRightLeft,
  MessageSquareMore,
  CopyCheck,
  ShieldCheck,
  CirclePlus,
  CircleOff,
} from 'lucide-react';
import styles from './LeadStepContent.module.scss';
import cardStyles from '@/components/Common/InfoCard/InfoCard.module.scss';

interface LeadStepContentProps {
  lead: Lead;
  isAdmin: boolean;
  onLeadUpdate?: () => void;
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

  // Refs
  const pestDropdownRef = useRef<HTMLDivElement>(null);
  const additionalPestDropdownRef = useRef<HTMLDivElement>(null);

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
  const [selectedHomeSizeOption, setSelectedHomeSizeOption] = useState<string>('');
  const [selectedYardSizeOption, setSelectedYardSizeOption] = useState<string>('');

  // Quote step state
  const [selectedPests, setSelectedPests] = useState<string[]>([]);
  const [additionalPests, setAdditionalPests] = useState<string[]>([]);
  const [isPestDropdownOpen, setIsPestDropdownOpen] = useState(false);
  const [isAdditionalPestDropdownOpen, setIsAdditionalPestDropdownOpen] = useState(false);
  const [pestOptions, setPestOptions] = useState<any[]>([]);
  const [serviceSelections, setServiceSelections] = useState<Array<{
    id: string;
    servicePlan: any | null;
    displayOrder: number;
  }>>([
    { id: '1', servicePlan: null, displayOrder: 0 } // First selection always exists
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
    enabled: lead.lead_status === 'quoted' || lead.lead_status === 'ready_to_schedule',
  });

  // Helper functions for managing service selections
  const addServiceSelection = () => {
    if (serviceSelections.length >= 3) return;

    const nextId = (serviceSelections.length + 1).toString();
    const nextDisplayOrder = serviceSelections.length;

    setServiceSelections([
      ...serviceSelections,
      { id: nextId, servicePlan: null, displayOrder: nextDisplayOrder }
    ]);
  };

  const removeServiceSelection = async (displayOrder: number) => {
    // Don't allow removing the first selection
    if (displayOrder === 0) return;

    // Find the line item to delete
    const lineItemToDelete = quote?.line_items?.find(
      (item) => item.display_order === displayOrder
    );

    if (lineItemToDelete && quote) {
      try {
        // Delete the quote line item
        const response = await fetch(`/api/quotes/${quote.id}/line-items/${lineItemToDelete.id}`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Failed to delete line item');
        }

        const data = await response.json();

        if (data.success && data.data) {
          // Broadcast will trigger real-time update
          await broadcastQuoteUpdate(data.data);
        }
      } catch (error) {
        console.error('Error deleting service selection:', error);
        onShowToast?.('Failed to remove service selection', 'error');
        return;
      }
    }

    // Remove from local state and reorder
    const updatedSelections = serviceSelections
      .filter((sel) => sel.displayOrder !== displayOrder)
      .map((sel, index) => ({
        ...sel,
        displayOrder: index
      }));

    setServiceSelections(updatedSelections);
  };

  const updateServiceSelection = async (displayOrder: number, plan: any) => {
    // Update local state
    setServiceSelections(serviceSelections.map(sel =>
      sel.displayOrder === displayOrder
        ? { ...sel, servicePlan: plan }
        : sel
    ));

    // Update quote line item
    await createOrUpdateQuoteLineItem(plan, displayOrder);
  };

  // Set default assignee to current user when component loads
  useEffect(() => {
    if (user?.id && !selectedAssignee) {
      setSelectedAssignee(user.id);
    }
  }, [user?.id, selectedAssignee]);

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
    };

    if (isPestDropdownOpen || isAdditionalPestDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPestDropdownOpen, isAdditionalPestDropdownOpen]);

  // Pre-fill preferred date and time from lead data
  useEffect(() => {
    if (lead.requested_date && !preferredDate) {
      setPreferredDate(lead.requested_date);
    }
    if (lead.requested_time && !preferredTime) {
      setPreferredTime(lead.requested_time);
    }
  }, [lead.requested_date, lead.requested_time, preferredDate, preferredTime]);

  // Pre-fill home size and yard size from service address data
  useEffect(() => {
    if (lead.primary_service_address?.home_size && homeSize === '') {
      setHomeSize(lead.primary_service_address.home_size);
    }
    if (lead.primary_service_address?.yard_size && yardSize === '') {
      setYardSize(lead.primary_service_address.yard_size);
    }
    // Pre-fill size range options from quote (not service_address)
    if (quote?.home_size_range && selectedHomeSizeOption === '') {
      setSelectedHomeSizeOption(quote.home_size_range);
    }
    if (quote?.yard_size_range && selectedYardSizeOption === '') {
      setSelectedYardSizeOption(quote.yard_size_range);
    }
  }, [
    lead.primary_service_address?.home_size,
    lead.primary_service_address?.yard_size,
    quote?.home_size_range,
    quote?.yard_size_range,
    homeSize,
    yardSize,
    selectedHomeSizeOption,
    selectedYardSizeOption
  ]);

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

          // Pre-populate with quote.primary_pest if available (from quote, not lead)
          if (quote?.primary_pest && response.data.length > 0) {
            const matchingPest = response.data.find(
              (pest: any) =>
                pest.name.toLowerCase() === quote.primary_pest?.toLowerCase() ||
                pest.slug === quote.primary_pest
            );
            if (matchingPest && !selectedPests.includes(matchingPest.id)) {
              setSelectedPests([matchingPest.id]);
            }
          }

          // Pre-populate additional pests from quote.additional_pests (from quote, not lead)
          if (quote?.additional_pests && quote.additional_pests.length > 0) {
            const additionalPestIds = response.data
              .filter((pest: any) =>
                quote.additional_pests?.some((pestName: string) =>
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
                const uniqueAdditional = additionalPestIds.filter((id: string) => id !== primaryPest);
                return [primaryPest, ...uniqueAdditional];
              }
              return additionalPestIds;
            });
          }
        }
      } catch (error) {
        console.error('Error loading pest options:', error);
      } finally {
        setLoadingPestOptions(false);
      }
    };

    loadPestOptions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.company_id, quote?.primary_pest, quote?.additional_pests]);

  // Load service plan for first selection when primary pest is selected
  useEffect(() => {
    const loadServicePlan = async () => {
      const primaryPest = selectedPests[0];
      if (!primaryPest || !lead.company_id) {
        // Clear first selection if no pest
        setServiceSelections(prev => prev.map((sel, idx) =>
          idx === 0 ? { ...sel, servicePlan: null } : sel
        ));
        return;
      }

      try {
        setLoadingPlan(true);
        const response = await adminAPI.getServicePlansByPest(
          lead.company_id,
          primaryPest
        );
        if (response.success && response.cheapest_plan) {
          // Update first service selection with cheapest plan
          setServiceSelections(prev => prev.map((sel, idx) =>
            idx === 0 ? { ...sel, servicePlan: response.cheapest_plan } : sel
          ));

          // Automatically create quote line item if quote exists
          // Only create if this is a new plan (not already in line items)
          if (quote) {
            const existingLineItem = quote.line_items?.find(
              (item) => item.display_order === 0
            );

            // Only create/update if the plan is different or doesn't exist
            if (!existingLineItem || existingLineItem.service_plan_id !== response.cheapest_plan.id) {
              await createOrUpdateQuoteLineItem(response.cheapest_plan, 0);
            }
          }
        } else {
          setServiceSelections(prev => prev.map((sel, idx) =>
            idx === 0 ? { ...sel, servicePlan: null } : sel
          ));
        }
      } catch (error) {
        console.error('Error loading service plan:', error);
        setServiceSelections(prev => prev.map((sel, idx) =>
          idx === 0 ? { ...sel, servicePlan: null } : sel
        ));
      } finally {
        setLoadingPlan(false);
      }
    };

    loadServicePlan();
    // Only depend on PRIMARY pest (first element), not the entire selectedPests array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPests[0], lead.company_id]);

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
        const response = await fetch(`/api/admin/service-plans/${lead.company_id}`);
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
    const servicePlanPricing = firstPlan?.home_size_pricing && firstPlan?.yard_size_pricing
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
    const servicePlanPricing = firstPlan?.home_size_pricing && firstPlan?.yard_size_pricing
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
        // UPDATE existing service address
        const updateResult = await updateExistingServiceAddress(
          lead.primary_service_address.id,
          serviceLocationData
        );

        if (!updateResult.success) {
          throw new Error(
            updateResult.error || 'Failed to update service address'
          );
        }

        showSuccessToast('Service address updated successfully');
      } else {
        // CREATE new service address and link to both customer and lead
        const isPrimary = !lead.primary_service_address; // Set as primary if no existing primary address

        const result = await createServiceAddressForLead(
          lead.company_id,
          lead.customer.id,
          lead.id,
          serviceLocationData,
          isPrimary
        );

        if (!result.success) {
          throw new Error(result.error || 'Failed to save service address');
        }

        if (result.isExisting) {
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

  const handleAssignTicket = async () => {
    if (!selectedAssignee) {
      showErrorToast('Please select an assignee');
      return;
    }

    setIsAssigning(true);

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
          showSuccessToast('Lead assigned to sales team');
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
          showSuccessToast(
            'Sales lead assigned and status updated to contacting'
          );
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

      // Refresh lead data if callback provided
      if (onLeadUpdate) {
        onLeadUpdate();
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
      // Don't call onLeadUpdate to prevent re-rendering
    } catch (error) {
      console.error('Failed to update requested time:', error);
      onShowToast?.('Failed to update requested time', 'error');
    }
  };

  /**
   * Creates or updates a quote line item with size-based price calculations
   */
  const createOrUpdateQuoteLineItem = async (servicePlan: any, displayOrder: number) => {
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

    try {
      // Get size ranges from quote (single source of truth)
      const homeSizeRange = quote.home_size_range;
      const yardSizeRange = quote.yard_size_range;

      // Find existing line item at this display order
      const existingLineItem = quote.line_items?.find(
        (item) => item.display_order === displayOrder
      );

      // Prepare the line item data
      const lineItemData = {
        id: existingLineItem?.id, // If exists, update it; otherwise create new
        service_plan_id: servicePlan.id,
        display_order: displayOrder,
      };

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
    }
  };

  const getButtonText = () => {
    if (ticketType === 'sales') {
      return 'Assign Sales Lead';
    } else if (ticketType === 'support') {
      return 'Assign Support Case';
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

  const renderQualifyContent = () => (
    <>
      <div className={styles.contentLeft}>
        <InfoCard
          title="Assign Ticket"
          icon={<Ticket size={20} />}
          startExpanded={true}
        >
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
                <div className={styles.dropdown}>
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
                onClick={handleAssignTicket}
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
        </InfoCard>

        <InfoCard
          title={
            lead.lead_type === 'web_form' ? 'Form Details' : 'Call Information'
          }
          icon={<ReceiptText size={20} />}
          startExpanded={true}
        >
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
                    <h4 className={cardStyles.dataLabel}>
                      Call Recording
                    </h4>
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
        </InfoCard>
      </div>

      <div className={styles.contentRight}>
        <InfoCard
          title="Contact Information"
          icon={<SquareUserRound size={20} />}
          startExpanded={false}
        >
          <div className={styles.cardContent}>
            {lead.customer ? (
              <div className={styles.callInsightsGrid}>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Name</span>
                  <span className={cardStyles.dataText}>
                    {`${lead.customer.first_name} ${lead.customer.last_name}`.trim()}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Phone Number</span>
                  <span className={cardStyles.dataText}>
                    {lead.customer.phone || 'Not provided'}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Email</span>
                  <span className={cardStyles.dataText}>
                    {lead.customer.email || 'Not provided'}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Customer Status</span>
                  <span className={cardStyles.dataText}>
                    {capitalizeFirst(lead.customer.customer_status)}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Created At</span>
                  <span className={cardStyles.dataText}>
                    {new Date(lead.customer.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Updated At</span>
                  <span className={cardStyles.dataText}>
                    {new Date(lead.customer.updated_at).toLocaleDateString()}
                  </span>
                </div>
                {lead.customer.notes && (
                  <div className={styles.callDetailItem}>
                    <span className={cardStyles.dataLabel}>Notes</span>
                    <span className={cardStyles.dataText}>
                      {lead.customer.notes}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p>No customer information available.</p>
            )}
          </div>
        </InfoCard>

        <InfoCard
          title="Service Location"
          icon={<MapPinned size={20} />}
          startExpanded={true}
        >
          <div className={styles.cardContent}>
            <div className={styles.serviceLocationGrid}>
              {/* Row 1: City, State, Zip (3 columns) */}
              <div className={`${styles.gridRow} ${styles.threeColumns}`}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>City</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={serviceLocationData.city}
                    onChange={e =>
                      handleServiceLocationChange('city', e.target.value)
                    }
                    placeholder="Anytown"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>State</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={serviceLocationData.state}
                    onChange={e =>
                      handleServiceLocationChange('state', e.target.value)
                    }
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Zip</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={serviceLocationData.zip_code}
                    onChange={e =>
                      handleServiceLocationChange('zip_code', e.target.value)
                    }
                    placeholder="12345"
                  />
                </div>
              </div>

              {/* Row 2: Address (1 column - full width) */}
              <div className={`${styles.gridRow} ${styles.oneColumn}`}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Address</label>
                  <AddressAutocomplete
                    value={serviceLocationData.street_address}
                    onChange={value =>
                      handleServiceLocationChange('street_address', value)
                    }
                    onAddressSelect={handleAddressSelect}
                    placeholder="324 Winston Churchill Drive, Suite #34"
                    hideDropdown={hasCompleteUnchangedAddress}
                  />
                </div>
              </div>

              {/* Row 3: Size of Home, Yard Size (2 columns) */}
              <div className={`${styles.gridRow} ${styles.twoColumns}`}>
                <div className={styles.formField}>
                  <div className={styles.fieldHeader}>
                    <label className={styles.fieldLabel}>Size of Home</label>
                  </div>
                  <select
                    className={styles.selectInput}
                    value={selectedHomeSizeOption}
                    onChange={e => {
                      setSelectedHomeSizeOption(e.target.value);
                      const option = homeSizeOptions.find(opt => opt.value === e.target.value);
                      if (option) {
                        setHomeSize(option.rangeStart);
                      }
                    }}
                  >
                    <option value="">Select home size</option>
                    {homeSizeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <div className={styles.fieldHeader}>
                    <label className={styles.fieldLabel}>Yard Size</label>
                  </div>
                  <select
                    className={styles.selectInput}
                    value={selectedYardSizeOption}
                    onChange={e => {
                      setSelectedYardSizeOption(e.target.value);
                      const option = yardSizeOptions.find(opt => opt.value === e.target.value);
                      if (option) {
                        setYardSize(option.rangeStart);
                      }
                    }}
                  >
                    <option value="">Select yard size</option>
                    {yardSizeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Street View Image (1 column - full width) */}
              <div className={`${styles.gridRow} ${styles.oneColumn}`}>
                <div className={styles.streetViewContainer}>
                  <StreetViewImage
                    address={currentFormattedAddress}
                    latitude={serviceLocationData.latitude}
                    longitude={serviceLocationData.longitude}
                    width={600}
                    height={240}
                    className={styles.streetViewImage}
                    showPlaceholder={
                      !currentFormattedAddress && !serviceLocationData.latitude
                    }
                    fallbackToSatellite={true}
                    hasStreetView={serviceLocationData.hasStreetView}
                  />
                </div>
              </div>
            </div>

            {/* Save/Cancel Address Changes */}
            {hasAddressChanges && (
              <div className={styles.addressActions}>
                <div className={styles.actionButtons}>
                  <button
                    className={`${styles.button} ${styles.cancelButton}`}
                    onClick={handleCancelAddressChanges}
                    disabled={isSavingAddress}
                  >
                    Cancel
                  </button>
                  <button
                    className={`${styles.button} ${styles.saveButton}`}
                    onClick={handleSaveAddress}
                    disabled={!hasAddressChanges || isSavingAddress}
                  >
                    {isSavingAddress ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </InfoCard>

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

  const renderContactingContent = () => (
    <>
      <div className={styles.contentLeft}>
        <InfoCard
          title="Contact Log"
          icon={<ArrowRightLeft size={20} />}
          startExpanded={true}
        >
          <div className={styles.cardContent}>
            <div>
              <h4 className={cardStyles.defaultText}>
                Next Recommended Action:
              </h4>
              <div
                style={{
                  padding: '12px',
                  border: '1px solid var(--gray-300)',
                  borderRadius: '6px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      backgroundColor: 'var(--gray-100)',
                      border: '1px solid var(--gray-200)',
                      borderRadius: '50%',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      padding: '3px',
                    }}
                  >
                    <MessageSquareMore
                      size={18}
                      style={{ color: 'var(--gray-500)' }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    <span className={cardStyles.inputText}>
                      Day 1: Afternoon Text
                    </span>
                    <div className={cardStyles.dataLabel}>
                      Target: Thursday, 9/25 | 5PM
                    </div>
                  </div>
                  <span
                    style={{
                      marginLeft: 'auto',
                      padding: '2px 8px',
                      backgroundColor: '#fbbf24',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                    }}
                  >
                    Medium
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className={cardStyles.defaultText}>
                Log an action:
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                }}
              >
                <button className={styles.actionButton}>
                  Inbound Call/Transfer
                </button>
                <button className={styles.actionButton}>Outbound Call</button>
                <button
                  className={`${styles.actionButton} ${styles.actionButtonActive}`}
                >
                  Text Message
                </button>
                <button className={styles.actionButton}>AI Call</button>
                <button className={styles.actionButton}>Email Sent</button>
                <button className={styles.actionButton}>Email Reply</button>
              </div>
            </div>

            <div>
              <label
                className={cardStyles.inputLabels}
                style={{ display: 'block' }}
              >
                Notes <span className={cardStyles.dataLabel}>(optional)</span>
              </label>
              <textarea
                placeholder="Sent Katie Newburn a message letting her know that she could reach me here until 5pm and that I'd be happy to answer any questions."
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

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
              }}
            >
              <button
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--gray-300)',
                  borderRadius: '6px',
                  backgroundColor: 'white',
                  color: 'var(--gray-600)',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Clear
              </button>
              <button
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: '6px',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Log Activity
              </button>
            </div>
          </div>
        </InfoCard>
      </div>

      <div className={styles.contentRight}>
        <InfoCard
          title="Contact Information"
          icon={<SquareUserRound size={20} />}
          startExpanded={false}
        >
          <div className={styles.cardContent}>
            {lead.customer ? (
              <div className={styles.callInsightsGrid}>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Name</span>
                  <span className={cardStyles.dataText}>
                    {`${lead.customer.first_name} ${lead.customer.last_name}`.trim()}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Phone Number</span>
                  <span className={cardStyles.dataText}>
                    {lead.customer.phone || 'Not provided'}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Email</span>
                  <span className={cardStyles.dataText}>
                    {lead.customer.email || 'Not provided'}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Customer Status</span>
                  <span className={cardStyles.dataText}>
                    {capitalizeFirst(lead.customer.customer_status)}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Created At</span>
                  <span className={cardStyles.dataText}>
                    {new Date(lead.customer.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Updated At</span>
                  <span className={cardStyles.dataText}>
                    {new Date(lead.customer.updated_at).toLocaleDateString()}
                  </span>
                </div>
                {lead.customer.notes && (
                  <div className={styles.callDetailItem}>
                    <span className={cardStyles.dataLabel}>Notes</span>
                    <span className={cardStyles.dataText}>
                      {lead.customer.notes}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p>No customer information available.</p>
            )}
          </div>
        </InfoCard>

        <InfoCard
          title="Service Location"
          icon={<MapPinned size={20} />}
          startExpanded={false}
        >
          <div className={styles.cardContent}>
            <div className={styles.serviceLocationGrid}>
              {/* Row 1: City, State, Zip (3 columns) */}
              <div className={`${styles.gridRow} ${styles.threeColumns}`}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>City</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={serviceLocationData.city}
                    onChange={e =>
                      handleServiceLocationChange('city', e.target.value)
                    }
                    placeholder="Anytown"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>State</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={serviceLocationData.state}
                    onChange={e =>
                      handleServiceLocationChange('state', e.target.value)
                    }
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Zip</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={serviceLocationData.zip_code}
                    onChange={e =>
                      handleServiceLocationChange('zip_code', e.target.value)
                    }
                    placeholder="12345"
                  />
                </div>
              </div>

              {/* Row 2: Address (1 column - full width) */}
              <div className={`${styles.gridRow} ${styles.oneColumn}`}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Address</label>
                  <AddressAutocomplete
                    value={serviceLocationData.street_address}
                    onChange={value =>
                      handleServiceLocationChange('street_address', value)
                    }
                    onAddressSelect={handleAddressSelect}
                    placeholder="324 Winston Churchill Drive, Suite #34"
                    hideDropdown={hasCompleteUnchangedAddress}
                  />
                </div>
              </div>

              {/* Row 3: Size of Home, Yard Size (2 columns) */}
              <div className={`${styles.gridRow} ${styles.twoColumns}`}>
                <div className={styles.formField}>
                  <div className={styles.fieldHeader}>
                    <label className={styles.fieldLabel}>Size of Home</label>
                  </div>
                  <select
                    className={styles.selectInput}
                    value={selectedHomeSizeOption}
                    onChange={e => {
                      setSelectedHomeSizeOption(e.target.value);
                      const option = homeSizeOptions.find(opt => opt.value === e.target.value);
                      if (option) {
                        setHomeSize(option.rangeStart);
                      }
                    }}
                  >
                    <option value="">Select home size</option>
                    {homeSizeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <div className={styles.fieldHeader}>
                    <label className={styles.fieldLabel}>Yard Size</label>
                  </div>
                  <select
                    className={styles.selectInput}
                    value={selectedYardSizeOption}
                    onChange={e => {
                      setSelectedYardSizeOption(e.target.value);
                      const option = yardSizeOptions.find(opt => opt.value === e.target.value);
                      if (option) {
                        setYardSize(option.rangeStart);
                      }
                    }}
                  >
                    <option value="">Select yard size</option>
                    {yardSizeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Street View Image (1 column - full width) */}
              <div className={`${styles.gridRow} ${styles.oneColumn}`}>
                <div className={styles.streetViewContainer}>
                  <StreetViewImage
                    address={currentFormattedAddress}
                    latitude={serviceLocationData.latitude}
                    longitude={serviceLocationData.longitude}
                    width={600}
                    height={240}
                    className={styles.streetViewImage}
                    showPlaceholder={
                      !currentFormattedAddress && !serviceLocationData.latitude
                    }
                    fallbackToSatellite={true}
                    hasStreetView={serviceLocationData.hasStreetView}
                  />
                </div>
              </div>
            </div>

            {/* Save/Cancel Address Changes */}
            {hasAddressChanges && (
              <div className={styles.addressActions}>
                <div className={styles.actionButtons}>
                  <button
                    className={`${styles.button} ${styles.cancelButton}`}
                    onClick={handleCancelAddressChanges}
                    disabled={isSavingAddress}
                  >
                    Cancel
                  </button>
                  <button
                    className={`${styles.button} ${styles.saveButton}`}
                    onClick={handleSaveAddress}
                    disabled={!hasAddressChanges || isSavingAddress}
                  >
                    {isSavingAddress ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </InfoCard>

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

  const renderQuotedContent = () => {
    const selectedPlan = serviceSelections[0]?.servicePlan;
    const selectedService = selectedPlan?.plan_name || '';

    return (
      <>
        <div className={styles.contentLeft}>
        <InfoCard
          title="Pest Select"
          icon={<CopyCheck size={20} />}
          startExpanded={true}
        >
          <div className={styles.cardContent}>
            {loadingPestOptions ? (
              <div className={cardStyles.lightText}>
                Loading pest options...
              </div>
            ) : (
              <>
                {/* Primary Pest Section */}
                <div className={styles.pestSection}>
                  <label className={cardStyles.inputLabels}>
                    Primary Pest
                  </label>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '6px',
                        border: '1px solid var(--gray-300)',
                        borderRadius: '6px',
                        minHeight: '42px',
                        flex: 1,
                      }}
                    >
                      {selectedPests.length > 0 && (
                        <div className={styles.pestPillsContainer}>
                          {(() => {
                            const primaryPestId = selectedPests[0];
                            const pest = pestOptions.find(p => p.id === primaryPestId);
                            return (
                              <div
                                key={primaryPestId}
                                className={`${styles.pestPill} ${styles.primary}`}
                              >
                                <span>{pest?.custom_label || 'Unknown'}</span>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>

                    <div className={styles.pestDropdownContainer} ref={pestDropdownRef}>
                      <button
                        className={`${styles.addPestButton} ${isPestDropdownOpen ? styles.open : ''}`}
                        onClick={() => setIsPestDropdownOpen(!isPestDropdownOpen)}
                        type="button"
                      >
                        {selectedPests.length === 0 ? 'Select Primary Pest' : 'Change Primary Pest'}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                        >
                          <path
                            d="M6 12.2539L10 7.80946L14 12.2539"
                            stroke="#99A1AF"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>

                      {isPestDropdownOpen && (
                        <div className={styles.pestDropdownMenu}>
                          {pestOptions.length > 0 ? (
                            pestOptions.map(pest => (
                              <button
                                key={pest.id}
                                className={styles.pestDropdownOption}
                                onClick={async () => {
                                  // Update primary pest
                                  setSelectedPests([pest.id, ...additionalPests]);
                                  await updatePrimaryPest(pest.id);
                                  setIsPestDropdownOpen(false);
                                }}
                                type="button"
                              >
                                {pest.custom_label}
                              </button>
                            ))
                          ) : (
                            <div className={cardStyles.lightText} style={{ padding: '12px' }}>
                              No pest options available
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Pests Section */}
                {selectedPests.length > 0 && (
                  <div className={styles.pestSection}>
                    <label className={cardStyles.inputLabels}>
                      Additional Pests
                    </label>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'flex-start',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '6px',
                          border: '1px solid var(--gray-300)',
                          borderRadius: '6px',
                          minHeight: '42px',
                          flexWrap: 'wrap',
                          flex: 1,
                        }}
                      >
                        {additionalPests.length > 0 && (
                          <div className={styles.pestPillsContainer}>
                            {additionalPests.map(pestId => {
                              const pest = pestOptions.find(p => p.id === pestId);
                              return (
                                <div
                                  key={pestId}
                                  className={styles.pestPill}
                                  onClick={async () => {
                                    const newAdditionalPests = additionalPests.filter(id => id !== pestId);
                                    setAdditionalPests(newAdditionalPests);
                                    setSelectedPests([selectedPests[0], ...newAdditionalPests]);
                                    await updateAdditionalPests(newAdditionalPests);
                                  }}
                                >
                                  <span>{pest?.custom_label || 'Unknown'}</span>
                                  <div className={styles.pestPillRemoveIcon}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="8" height="9" viewBox="0 0 8 9" fill="none">
                                      <g clipPath="url(#clip0_1754_15130)">
                                        <path d="M1 1.25781L7 7.25781M7 1.25781L1 7.25781" stroke="#99A1AF"/>
                                      </g>
                                      <defs>
                                        <clipPath id="clip0_1754_15130">
                                          <rect width="8" height="8" fill="white" transform="translate(0 0.257812)"/>
                                        </clipPath>
                                      </defs>
                                    </svg>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className={styles.pestDropdownContainer} ref={additionalPestDropdownRef}>
                        <button
                          className={`${styles.addPestButton} ${isAdditionalPestDropdownOpen ? styles.open : ''}`}
                          onClick={() => setIsAdditionalPestDropdownOpen(!isAdditionalPestDropdownOpen)}
                          type="button"
                        >
                          {additionalPests.length === 0 ? 'Add Additional Pest' : 'Add More Pests'}
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="21"
                            viewBox="0 0 20 21"
                            fill="none"
                          >
                            <path
                              d="M6 12.2539L10 7.80946L14 12.2539"
                              stroke="#99A1AF"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </button>

                        {isAdditionalPestDropdownOpen && (
                          <div className={styles.pestDropdownMenu}>
                            {pestOptions
                              .filter(pest => !selectedPests.includes(pest.id))
                              .map(pest => (
                                <button
                                  key={pest.id}
                                  className={styles.pestDropdownOption}
                                  onClick={async () => {
                                    const newAdditionalPests = [...additionalPests, pest.id];
                                    setAdditionalPests(newAdditionalPests);
                                    setSelectedPests([selectedPests[0], ...newAdditionalPests]);
                                    await updateAdditionalPests(newAdditionalPests);
                                    setIsAdditionalPestDropdownOpen(false);
                                  }}
                                  type="button"
                                >
                                  {pest.custom_label}
                                </button>
                              ))}
                            {pestOptions.filter(pest => !selectedPests.includes(pest.id)).length === 0 && (
                              <div className={cardStyles.lightText}>
                                All pests selected
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </InfoCard>

        <InfoCard
          title="Service Selection"
          icon={<ShieldCheck size={20} />}
          startExpanded={true}
        >
          <div className={styles.cardContent}>
            {loadingPlan ? (
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
                      <select
                        className={styles.selectInput}
                        value={selectedHomeSizeOption}
                        onChange={async e => {
                          const rangeValue = e.target.value;
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
                              }
                            } catch (error) {
                              console.error('Error updating home size range:', error);
                              onShowToast?.('Failed to update home size', 'error');
                            }
                          }
                        }}
                      >
                        <option value="">Select home size</option>
                        {homeSizeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.formField}>
                      <div className={styles.fieldHeader}>
                        <label className={styles.fieldLabel}>Yard Size</label>
                      </div>
                      <select
                        className={styles.selectInput}
                        value={selectedYardSizeOption}
                        onChange={async e => {
                          const rangeValue = e.target.value;
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
                              }
                            } catch (error) {
                              console.error('Error updating yard size range:', error);
                              onShowToast?.('Failed to update yard size', 'error');
                            }
                          }
                        }}
                      >
                        <option value="">Select yard size</option>
                        {yardSizeOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Row 2: Select Service (1 column) */}
                  <div
                    className={`${styles.gridRow} ${styles.oneColumn}`}
                  >
                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>
                        Select Service
                      </label>
                      <div className={styles.dropdown}>
                        <select
                          className={styles.selectInput}
                          value={selectedService}
                          onChange={async e => {
                            const planName = e.target.value;
                            // Update the selected plan when user selects from dropdown
                            const plan = allServicePlans.find(p => p.plan_name === planName);
                            if (plan) {
                              // Update the first service selection
                              setServiceSelections(prev =>
                                prev.map((sel, idx) =>
                                  idx === 0 ? { ...sel, servicePlan: plan } : sel
                                )
                              );
                              // Create or update quote line item with size-based pricing
                              await createOrUpdateQuoteLineItem(plan, 0);
                            }
                          }}
                        >
                          <option value="">Program or Service</option>
                          {loadingServicePlans ? (
                            <option value="">Loading plans...</option>
                          ) : allServicePlans.length > 0 ? (
                            allServicePlans.map(plan => (
                              <option key={plan.id} value={plan.plan_name}>
                                {plan.plan_name}
                              </option>
                            ))
                          ) : (
                            <option value="">No plans available</option>
                          )}
                        </select>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                          }}
                        >
                          <path
                            d="M6 12.2539L10 7.80946L14 12.2539"
                            stroke="#99A1AF"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Service Frequency, Discount (2 columns) */}
                  <div className={`${styles.gridRow} ${styles.twoColumns}`}>
                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>
                        Service Frequency
                      </label>
                      <div className={styles.dropdown}>
                        <select
                          className={styles.selectInput}
                          value={serviceFrequency}
                          onChange={e => setServiceFrequency(e.target.value)}
                        >
                          <option value="">Select Frequency</option>
                          <option value="monthly">Monthly</option>
                          <option value="quarterly">Quarterly</option>
                          <option value="semi-annually">Semi-Annually</option>
                          <option value="annually">Annually</option>
                        </select>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                          }}
                        >
                          <path
                            d="M6 12.2539L10 7.80946L14 12.2539"
                            stroke="#99A1AF"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className={styles.formField}>
                      <label className={styles.fieldLabel}>Discount</label>
                      <div className={styles.dropdown}>
                        <select
                          className={styles.selectInput}
                          value={discount}
                          onChange={e => setDiscount(e.target.value)}
                        >
                          <option value="">Select Discount</option>
                          <option value="0">No Discount</option>
                          <option value="5">5% Off</option>
                          <option value="10">10% Off</option>
                          <option value="15">15% Off</option>
                          <option value="20">20% Off</option>
                        </select>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="21"
                          viewBox="0 0 20 21"
                          fill="none"
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                          }}
                        >
                          <path
                            d="M6 12.2539L10 7.80946L14 12.2539"
                            stroke="#99A1AF"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                {/* Pest Concern Coverage Pills */}
                <div>
                  <label className={styles.fieldLabel}>
                    Pest Concern Coverage
                  </label>
                  <div className={styles.pestContainer}>
                    {pestOptions
                      .filter(pest => selectedPests.includes(pest.id))
                      .map(pest => {
                        // Check if this pest is covered by the selected plan
                        const isCovered = selectedPlan.pest_coverage?.some(
                          (coverage: any) => coverage.pest_id === pest.id
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

                {/* Plan Information Section */}
                <h4
                  className={cardStyles.defaultText}
                >
                  Plan Information
                </h4>
                <div className={styles.planInfoContainer}>
                  <div className={styles.tabContainer}>
                    {[
                      { id: 'overview', label: 'Plan Overview' },
                      { id: 'pests', label: 'Covered Pests' },
                      { id: 'pricing', label: 'Pricing' },
                      { id: 'expect', label: 'What to Expect' },
                      { id: 'faqs', label: 'FAQs' },
                    ].map((tab, index, array) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveServiceTab(tab.id)}
                        className={`${styles.tabButton} ${
                          activeServiceTab === tab.id ? styles.active : styles.inactive
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
                        <div className={styles.planSection}>
                          <h4 className={styles.planTitle}>
                            {selectedPlan.plan_name}
                            {selectedPlan.highlight_badge && (
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
                                {selectedPlan.highlight_badge}
                              </span>
                            )}
                          </h4>
                          <p
                            style={{
                              margin: '0',
                              color: 'var(--gray-600)',
                              fontSize: '14px',
                            }}
                          >
                            {selectedPlan.plan_description}
                          </p>
                        </div>

                        <h4
                          style={{
                            margin: '0 0 12px 0',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'var(--gray-900)',
                          }}
                        >
                          Plan Features
                        </h4>
                        {selectedPlan.plan_features &&
                        Array.isArray(selectedPlan.plan_features) ? (
                          <ul
                            style={{
                              margin: '0',
                              paddingLeft: '20px',
                              color: 'var(--gray-700)',
                            }}
                          >
                            {selectedPlan.plan_features.map(
                              (feature: string, index: number) => (
                                <li key={index}>
                                  {feature}
                                </li>
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
                        {selectedPlan.covered_pests &&
                        selectedPlan.covered_pests.length > 0 ? (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns:
                                'repeat(auto-fill, minmax(150px, 1fr))',
                              gap: '8px',
                            }}
                          >
                            {selectedPlan.covered_pests.map((pest: any) => (
                              <div
                                key={pest.id}
                                style={{
                                  padding: '8px 12px',
                                  backgroundColor: 'var(--gray-50)',
                                  borderRadius: '6px',
                                  fontSize: '14px',
                                  color: 'var(--gray-700)',
                                  border:
                                    pest.coverage_level !== 'full'
                                      ? '1px dashed var(--gray-300)'
                                      : '1px solid var(--gray-200)',
                                }}
                              >
                                {pest.name}
                                {pest.coverage_level !== 'full' && (
                                  <span
                                    style={{
                                      display: 'block',
                                      fontSize: '12px',
                                      color: 'var(--gray-500)',
                                      textTransform: 'capitalize',
                                    }}
                                  >
                                    ({pest.coverage_level})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p
                            style={{
                              color: 'var(--gray-500)',
                              fontStyle: 'italic',
                            }}
                          >
                            No pest coverage information available
                          </p>
                        )}
                      </div>
                    )}

                    {activeServiceTab === 'pricing' && (
                      <div className={styles.tabContentInner}>
                        <h4
                          style={{
                            margin: '0 0 12px 0',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'var(--gray-900)',
                          }}
                        >
                          Pricing Details
                        </h4>
                        <div style={{ display: 'grid', gap: '12px' }}>
                          {selectedPlan.initial_price && (
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px',
                                backgroundColor: 'var(--gray-50)',
                                borderRadius: '6px',
                              }}
                            >
                              <span
                                style={{
                                  fontWeight: '500',
                                  color: 'var(--gray-700)',
                                }}
                              >
                                Initial Service
                              </span>
                              <span
                                style={{
                                  fontSize: '18px',
                                  fontWeight: '600',
                                  color: 'var(--gray-900)',
                                }}
                              >
                                ${selectedPlan.initial_price}
                              </span>
                            </div>
                          )}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '12px',
                              backgroundColor: 'var(--action-50)',
                              borderRadius: '6px',
                              border: '1px solid var(--action-200)',
                            }}
                          >
                            <span
                              style={{
                                fontWeight: '500',
                                color: 'var(--action-700)',
                              }}
                            >
                              Recurring ({selectedPlan.billing_frequency})
                            </span>
                            <span
                              style={{
                                fontSize: '18px',
                                fontWeight: '600',
                                color: 'var(--action-700)',
                              }}
                            >
                              ${selectedPlan.recurring_price}
                            </span>
                          </div>
                          <div
                            style={{
                              fontSize: '14px',
                              color: 'var(--gray-600)',
                            }}
                          >
                            <p>
                              <strong>Treatment Frequency:</strong>{' '}
                              {selectedPlan.treatment_frequency}
                            </p>
                            <p>
                              <strong>Includes Inspection:</strong>{' '}
                              {selectedPlan.includes_inspection ? 'Yes' : 'No'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeServiceTab === 'expect' && (
                      <div className={styles.tabContentInner}>
                        <h4
                          style={{
                            margin: '0 0 12px 0',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'var(--gray-900)',
                          }}
                        >
                          What to Expect
                        </h4>
                        <div
                          style={{
                            color: 'var(--gray-700)',
                            lineHeight: '1.6',
                          }}
                        >
                          <p>
                            Treatment frequency:{' '}
                            <strong>{selectedPlan.treatment_frequency}</strong>
                          </p>
                          <p>
                            Billing cycle:{' '}
                            <strong>{selectedPlan.billing_frequency}</strong>
                          </p>
                          {selectedPlan.includes_inspection && (
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
                              Our {selectedPlan.plan_name.toLowerCase()}{' '}
                              provides comprehensive protection with{' '}
                              {selectedPlan.treatment_frequency} treatments to
                              keep your property pest-free year-round.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeServiceTab === 'faqs' && (
                      <div className={styles.tabContentInner}>
                        <h4
                          style={{
                            margin: '0 0 12px 0',
                            fontSize: '16px',
                            fontWeight: '600',
                            color: 'var(--gray-900)',
                          }}
                        >
                          Frequently Asked Questions
                        </h4>
                        {selectedPlan.plan_faqs &&
                        Array.isArray(selectedPlan.plan_faqs) ? (
                          <div style={{ display: 'grid', gap: '16px' }}>
                            {selectedPlan.plan_faqs.map(
                              (faq: any, index: number) => (
                                <div
                                  key={index}
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
                    )}
                  </div>
                </div>

                {/* Preferred Date and Time Inputs */}
                <div className={`${styles.gridRow} ${styles.twoColumns}`}>
                  <div className={styles.formField}>
                    <label className={styles.fieldLabel}>
                      Preferred Date
                    </label>
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
                    <label className={styles.fieldLabel}>
                      Preferred Time
                    </label>
                    <div className={styles.dropdownWithArrow}>
                      <select
                        className={styles.selectInput}
                        value={preferredTime}
                        onChange={e => {
                          setPreferredTime(e.target.value);
                          updateLeadRequestedTime(e.target.value);
                        }}
                      >
                        <option value="">Enter preferred time</option>
                        <option value="morning">Morning (8AM - 12PM)</option>
                        <option value="afternoon">Afternoon (12PM - 5PM)</option>
                        <option value="evening">Evening (5PM - 8PM)</option>
                        <option value="anytime">Anytime</option>
                      </select>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="21"
                        viewBox="0 0 20 21"
                        fill="none"
                        className={styles.dropdownArrow}
                      >
                        <path
                          d="M6 12.2539L10 7.80946L14 12.2539"
                          stroke="#99A1AF"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Add Service Button */}
                {serviceSelections.length < 3 && selectedPlan && (
                  <button
                    type="button"
                    onClick={addServiceSelection}
                    style={{
                      width: '131px',
                      background: 'white',
                      border: '1px solid var(--gray-300)',
                      borderRadius: '6px',
                      padding: '9px 12px',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      marginTop: '16px',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: 'var(--gray-700)',
                    }}
                  >
                    <CirclePlus size={16} />
                    Add Service
                  </button>
                )}
              </>
            )}
          </div>
        </InfoCard>

        <QuoteSummaryCard
          quote={quote}
          lead={lead}
          isUpdating={isQuoteUpdating}
          onNotInterested={handleMarkAsLost}
          onReadyToSchedule={handleProgressToReadyToSchedule}
        />
      </div>

      <div className={styles.contentRight}>
        <InfoCard
          title="Contact Information"
          icon={<SquareUserRound size={20} />}
          startExpanded={false}
        >
          <div className={styles.cardContent}>
            {lead.customer ? (
              <div className={styles.callInsightsGrid}>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Name</span>
                  <span className={cardStyles.dataText}>
                    {`${lead.customer.first_name} ${lead.customer.last_name}`.trim()}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Phone Number</span>
                  <span className={cardStyles.dataText}>
                    {lead.customer.phone || 'Not provided'}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Email</span>
                  <span className={cardStyles.dataText}>
                    {lead.customer.email || 'Not provided'}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Customer Status</span>
                  <span className={cardStyles.dataText}>
                    {capitalizeFirst(lead.customer.customer_status)}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Created At</span>
                  <span className={cardStyles.dataText}>
                    {new Date(lead.customer.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Updated At</span>
                  <span className={cardStyles.dataText}>
                    {new Date(lead.customer.updated_at).toLocaleDateString()}
                  </span>
                </div>
                {lead.customer.notes && (
                  <div className={styles.callDetailItem}>
                    <span className={cardStyles.dataLabel}>Notes</span>
                    <span className={cardStyles.dataText}>
                      {lead.customer.notes}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p>No customer information available.</p>
            )}
          </div>
        </InfoCard>

        <InfoCard
          title="Service Location"
          icon={<MapPinned size={20} />}
          startExpanded={false}
        >
          <div className={styles.cardContent}>
            <div className={styles.serviceLocationGrid}>
              {/* Row 1: City, State, Zip (3 columns) */}
              <div className={`${styles.gridRow} ${styles.threeColumns}`}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>City</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={serviceLocationData.city}
                    onChange={e =>
                      handleServiceLocationChange('city', e.target.value)
                    }
                    placeholder="Anytown"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>State</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={serviceLocationData.state}
                    onChange={e =>
                      handleServiceLocationChange('state', e.target.value)
                    }
                    placeholder="CA"
                    maxLength={2}
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Zip</label>
                  <input
                    type="text"
                    className={styles.textInput}
                    value={serviceLocationData.zip_code}
                    onChange={e =>
                      handleServiceLocationChange('zip_code', e.target.value)
                    }
                    placeholder="12345"
                  />
                </div>
              </div>

              {/* Row 2: Address (1 column - full width) */}
              <div className={`${styles.gridRow} ${styles.oneColumn}`}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Address</label>
                  <AddressAutocomplete
                    value={serviceLocationData.street_address}
                    onChange={value =>
                      handleServiceLocationChange('street_address', value)
                    }
                    onAddressSelect={handleAddressSelect}
                    placeholder="324 Winston Churchill Drive, Suite #34"
                    hideDropdown={hasCompleteUnchangedAddress}
                  />
                </div>
              </div>

              {/* Row 3: Size of Home, Yard Size (2 columns) */}
              <div className={`${styles.gridRow} ${styles.twoColumns}`}>
                <div className={styles.formField}>
                  <div className={styles.fieldHeader}>
                    <label className={styles.fieldLabel}>Size of Home</label>
                  </div>
                  <select
                    className={styles.selectInput}
                    value={selectedHomeSizeOption}
                    onChange={async e => {
                      const rangeValue = e.target.value;
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
                          }
                        } catch (error) {
                          console.error('Error updating home size range:', error);
                          onShowToast?.('Failed to update home size', 'error');
                        }
                      }
                    }}
                  >
                    <option value="">Select home size</option>
                    {homeSizeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <div className={styles.fieldHeader}>
                    <label className={styles.fieldLabel}>Yard Size</label>
                  </div>
                  <select
                    className={styles.selectInput}
                    value={selectedYardSizeOption}
                    onChange={async e => {
                      const rangeValue = e.target.value;
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
                          }
                        } catch (error) {
                          console.error('Error updating yard size range:', error);
                          onShowToast?.('Failed to update yard size', 'error');
                        }
                      }
                    }}
                  >
                    <option value="">Select yard size</option>
                    {yardSizeOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Street View Image (1 column - full width) */}
              <div className={`${styles.gridRow} ${styles.oneColumn}`}>
                <div className={styles.streetViewContainer}>
                  <StreetViewImage
                    address={currentFormattedAddress}
                    latitude={serviceLocationData.latitude}
                    longitude={serviceLocationData.longitude}
                    width={600}
                    height={240}
                    className={styles.streetViewImage}
                    showPlaceholder={
                      !currentFormattedAddress && !serviceLocationData.latitude
                    }
                    fallbackToSatellite={true}
                    hasStreetView={serviceLocationData.hasStreetView}
                  />
                </div>
              </div>
            </div>

            {/* Save/Cancel Address Changes */}
            {hasAddressChanges && (
              <div className={styles.addressActions}>
                <div className={styles.actionButtons}>
                  <button
                    className={`${styles.button} ${styles.cancelButton}`}
                    onClick={handleCancelAddressChanges}
                    disabled={isSavingAddress}
                  >
                    Cancel
                  </button>
                  <button
                    className={`${styles.button} ${styles.saveButton}`}
                    onClick={handleSaveAddress}
                    disabled={!hasAddressChanges || isSavingAddress}
                  >
                    {isSavingAddress ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </InfoCard>

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

  const renderReadyToScheduleContent = () => (
    <>
      <div className={styles.contentLeft}>
        <QuoteSummaryCard
          quote={quote}
          lead={lead}
          isUpdating={isQuoteUpdating}
          onNotInterested={handleMarkAsLost}
          onReadyToSchedule={handleProgressToReadyToSchedule}
        />
      </div>
      <div className={styles.contentRight}>
        <InfoCard
          title="Contact Information"
          icon={<SquareUserRound size={20} />}
          startExpanded={false}
        >
          <div className={styles.cardContent}>
            {lead.customer ? (
              <div className={styles.callInsightsGrid}>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Name</span>
                  <span className={cardStyles.dataText}>
                    {`${lead.customer.first_name} ${lead.customer.last_name}`.trim()}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Phone Number</span>
                  <span className={cardStyles.dataText}>
                    {lead.customer.phone || 'Not provided'}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Email</span>
                  <span className={cardStyles.dataText}>
                    {lead.customer.email || 'Not provided'}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Customer Status</span>
                  <span className={cardStyles.dataText}>
                    {capitalizeFirst(lead.customer.customer_status)}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Created At</span>
                  <span className={cardStyles.dataText}>
                    {new Date(lead.customer.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className={cardStyles.lightText}>
                No customer information available
              </div>
            )}
          </div>
        </InfoCard>

        <InfoCard
          title="Service Location"
          icon={<MapPinned size={20} />}
          startExpanded={false}
        >
          <div className={styles.cardContent}>
            {lead.primary_service_address ? (
              <div className={styles.callInsightsGrid}>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Street Address</span>
                  <span className={cardStyles.dataText}>
                    {lead.primary_service_address.street_address}
                    {lead.primary_service_address.apartment_unit &&
                      `, ${lead.primary_service_address.apartment_unit}`}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>City</span>
                  <span className={cardStyles.dataText}>
                    {lead.primary_service_address.city}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>State</span>
                  <span className={cardStyles.dataText}>
                    {lead.primary_service_address.state}
                  </span>
                </div>
                <div className={styles.callDetailItem}>
                  <span className={cardStyles.dataLabel}>Zip Code</span>
                  <span className={cardStyles.dataText}>
                    {lead.primary_service_address.zip_code}
                  </span>
                </div>
              </div>
            ) : (
              <div className={cardStyles.lightText}>
                No service location available
              </div>
            )}
          </div>
        </InfoCard>

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

  return renderContent();
}
