import { useState, useMemo, useEffect, Dispatch, SetStateAction } from 'react';
import { InfoCard } from '@/components/Common/InfoCard/InfoCard';
import { CustomerInformation } from '@/components/Tickets/TicketContent';
import { ServiceLocationCard } from '@/components/Common/ServiceLocationCard/ServiceLocationCard';
import { ActivityFeed } from '@/components/Common/ActivityFeed/ActivityFeed';
import { NotesSection } from '@/components/Common/NotesSection/NotesSection';
import { LeadCallFormInfo } from '../LeadCallFormInfo';
import { useUser } from '@/hooks/useUser';
import { usePricingSettings } from '@/hooks/usePricingSettings';
import { ServiceAddressData } from '@/lib/service-addresses';
import { AddressComponents } from '@/components/Common/AddressAutocomplete/AddressAutocomplete';
import { broadcastCustomerUpdate } from '@/lib/realtime/customer-channel';
import { authenticatedFetch } from '@/lib/api-client';
import {
  ListCollapse,
  SquareUserRound,
  SquareActivity,
  NotebookPen,
  Phone,
  TextCursorInput,
} from 'lucide-react';
import { Lead } from '@/types/lead';
import {
  ShowToastCallback,
  RequestUndoCallback,
  LeadUpdateCallback,
} from '../../types/leadStepTypes';
import styles from './LeadDetailsSidebar.module.scss';

interface LeadDetailsSidebarProps {
  lead: Lead;
  onShowToast?: ShowToastCallback;
  onRequestUndo?: RequestUndoCallback;
  onLeadUpdate?: LeadUpdateCallback;
  customerChannelRef?: any;
  isSidebarExpanded: boolean;
  setIsSidebarExpanded: Dispatch<SetStateAction<boolean>>;
  serviceLocationCardRef?: React.RefObject<HTMLDivElement | null>;
  shouldExpandServiceLocation?: boolean;
  shouldExpandActivity?: boolean;
}

export function LeadDetailsSidebar({
  lead,
  onShowToast,
  onRequestUndo,
  onLeadUpdate,
  customerChannelRef,
  isSidebarExpanded,
  setIsSidebarExpanded,
  serviceLocationCardRef,
  shouldExpandServiceLocation,
  shouldExpandActivity,
}: LeadDetailsSidebarProps) {
  const [isSavingAddress, setIsSavingAddress] = useState(false);
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

  const { user } = useUser();
  const { settings: pricingSettings } = usePricingSettings(lead.company_id);

  // Check if we have a complete address (all required fields)
  const hasCompleteAddress = useMemo(() => {
    return !!(
      serviceLocationData.street_address &&
      serviceLocationData.city &&
      serviceLocationData.state &&
      serviceLocationData.zip_code
    );
  }, [serviceLocationData]);

  // Pre-fill service location with primary service address when component loads
  useEffect(() => {
    // Only pre-fill if we haven't already set the service location data
    if (originalServiceAddress === null) {
      let addressData: ServiceAddressData;

      if (lead.primary_service_address) {
        addressData = {
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
      } else if (lead.customer) {
        // Fallback to customer address if no primary service address exists
        addressData = {
          street_address: lead.customer?.address || '',
          city: lead.customer?.city || '',
          state: lead.customer?.state || '',
          zip_code: lead.customer?.zip_code || '',
          latitude: lead.customer?.latitude,
          longitude: lead.customer?.longitude,
          address_type: 'residential',
        };
      } else {
        // No existing address - initialize with empty values
        addressData = {
          street_address: '',
          city: '',
          state: '',
          zip_code: '',
          apartment_unit: undefined,
          address_line_2: undefined,
          latitude: undefined,
          longitude: undefined,
          address_type: 'residential',
        };
      }

      // Store original service address for change detection
      setOriginalServiceAddress(addressData);

      setServiceLocationData(prev => ({
        ...prev,
        ...addressData,
      }));
    }
  }, [lead.primary_service_address, lead.customer, originalServiceAddress]);

  // Update service location data when lead's primary service address size ranges change
  // This handles real-time updates from the quote section syncing to service_address
  useEffect(() => {
    if (lead.primary_service_address && originalServiceAddress !== null) {
      // Only update size ranges, don't overwrite address fields during editing
      if (lead.primary_service_address?.home_size_range &&
          lead.primary_service_address.home_size_range !== serviceLocationData.home_size_range) {
        setServiceLocationData(prev => ({
          ...prev,
          home_size_range: lead.primary_service_address?.home_size_range || '',
        }));
      }
      if (lead.primary_service_address?.yard_size_range &&
          lead.primary_service_address.yard_size_range !== serviceLocationData.yard_size_range) {
        setServiceLocationData(prev => ({
          ...prev,
          yard_size_range: lead.primary_service_address?.yard_size_range || '',
        }));
      }
    }
  }, [lead.primary_service_address?.home_size_range, lead.primary_service_address?.yard_size_range]);

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

        if (onShowToast) {
          onShowToast('Service address updated successfully', 'success');
        }
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
          if (onShowToast) {
            onShowToast('Service address linked successfully', 'success');
          }
        } else {
          if (onShowToast) {
            onShowToast(
              'Service address created and linked successfully',
              'success'
            );
          }
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

      if (onShowToast) {
        onShowToast(
          error instanceof Error
            ? error.message
            : 'Failed to save service address',
          'error'
        );
      }
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

  // Detect address changes by comparing current serviceLocationData with originalServiceAddress
  const hasAddressChanges = useMemo(() => {
    if (!originalServiceAddress) return false;

    // Check if any field has changed from the original
    const hasChanges =
      serviceLocationData.street_address !==
        originalServiceAddress.street_address ||
      serviceLocationData.city !== originalServiceAddress.city ||
      serviceLocationData.state !== originalServiceAddress.state ||
      serviceLocationData.zip_code !== originalServiceAddress.zip_code ||
      serviceLocationData.apartment_unit !==
        originalServiceAddress.apartment_unit ||
      serviceLocationData.address_line_2 !==
        originalServiceAddress.address_line_2;

    // Only return true if there are changes AND at least one meaningful value exists
    if (hasChanges) {
      const hasMeaningfulData = !!(
        serviceLocationData.street_address ||
        serviceLocationData.city ||
        serviceLocationData.state ||
        serviceLocationData.zip_code
      );
      return hasMeaningfulData;
    }

    return false;
  }, [serviceLocationData, originalServiceAddress]);

  const handleServiceLocationChange = (
    field: keyof ServiceAddressData,
    value: string
  ) => {
    setServiceLocationData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

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

  // Handler to expand sidebar when any card is expanded
  const handleCardExpand = () => {
    if (!isSidebarExpanded) {
      setIsSidebarExpanded(true);
    }
  };

  return (
    <div
      className={`${styles.sidebar} ${isSidebarExpanded ? styles.expanded : styles.collapsed}`}
    >
      <div className={styles.sidebarContent}>
        <div className={styles.sidebarHeader}>
          <button
            title={isSidebarExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
            onClick={
              isSidebarExpanded
                ? () => setIsSidebarExpanded(false)
                : () => setIsSidebarExpanded(true)
            }
            className={
              isSidebarExpanded
                ? styles.sidebarCollapseButton
                : styles.sidebarExpandButton
            }
          >
            <ListCollapse size={16} />
          </button>
          <h3>Details</h3>
        </div>
        <div className={styles.sidebarCardsWrapper}>
          <InfoCard
            title="Contact Information"
            icon={<SquareUserRound size={20} />}
            startExpanded={false}
            onExpand={handleCardExpand}
            forceCollapse={!isSidebarExpanded}
            isCompact={!isSidebarExpanded}
          >
            <CustomerInformation
              ticket={createTicketFromLead}
              activityEntityType="lead"
              activityEntityId={lead.id}
              onShowToast={onShowToast}
              onRequestUndo={onRequestUndo}
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

          <div ref={serviceLocationCardRef}>
            <ServiceLocationCard
              serviceAddress={lead.primary_service_address || null}
              startExpanded={shouldExpandServiceLocation || false}
              showSizeInputs
              pricingSettings={pricingSettings || undefined}
              onShowToast={onShowToast}
              onRequestUndo={onRequestUndo}
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
              onExpand={handleCardExpand}
              forceCollapse={!isSidebarExpanded}
              isCompact={!isSidebarExpanded}
            />
          </div>

          <InfoCard
            title="Activity"
            icon={<SquareActivity size={20} />}
            startExpanded={false}
            onExpand={handleCardExpand}
            forceCollapse={!isSidebarExpanded}
            forceExpand={shouldExpandActivity}
            isCompact={!isSidebarExpanded}
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
            onExpand={handleCardExpand}
            forceCollapse={!isSidebarExpanded}
            isCompact={!isSidebarExpanded}
          >
            <NotesSection
              entityType="lead"
              entityId={lead.id}
              companyId={lead.company_id}
              userId={user?.id || ''}
            />
          </InfoCard>
          <InfoCard
            title={
              lead.lead_type === 'web_form'
                ? 'Form Details'
                : 'Call Information'
            }
            icon={
              lead.lead_type === 'web_form' ? (
                <TextCursorInput size={20} />
              ) : (
                <Phone size={20} />
              )
            }
            startExpanded={false}
            onExpand={handleCardExpand}
            forceCollapse={!isSidebarExpanded}
            isCompact={!isSidebarExpanded}
          >
            <LeadCallFormInfo lead={lead} />
          </InfoCard>
        </div>
      </div>
    </div>
  );
}
