'use client';

import { useState, useMemo, useEffect } from 'react';
import { CustomerInformation } from '@/components/Tickets/TicketContent';
import { ServiceLocationCard } from '@/components/Common/ServiceLocationCard/ServiceLocationCard';
import { useUser } from '@/hooks/useUser';
import { usePricingSettings } from '@/hooks/usePricingSettings';
import { ServiceAddressData } from '@/lib/service-addresses';
import { AddressComponents } from '@/components/Common/AddressAutocomplete/AddressAutocomplete';
import { broadcastCustomerUpdate } from '@/lib/realtime/customer-channel';
import { authenticatedFetch } from '@/lib/api-client';
import { Lead } from '@/types/lead';
import {
  ShowToastCallback,
  RequestUndoCallback,
  LeadUpdateCallback,
} from '../../types/leadStepTypes';
import styles from './LeadContactDetailsPanel.module.scss';

interface LeadContactDetailsPanelProps {
  lead: Lead;
  onShowToast?: ShowToastCallback;
  onRequestUndo?: RequestUndoCallback;
  onLeadUpdate?: LeadUpdateCallback;
  customerChannelRef?: any;
}

// Map full state names to 2-letter abbreviations (matches prior sidebar logic)
const STATE_NAME_TO_ABBREVIATION: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
  Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS',
  Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK',
  Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI',
  Wyoming: 'WY',
};

export function LeadContactDetailsPanel({
  lead,
  onShowToast,
  onRequestUndo,
  onLeadUpdate,
  customerChannelRef,
}: LeadContactDetailsPanelProps) {
  const { user } = useUser();
  const { settings: pricingSettings } = usePricingSettings(lead.company_id);

  const [isSavingAddress, setIsSavingAddress] = useState(false);
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

  // Pre-fill service location on first mount
  useEffect(() => {
    if (originalServiceAddress !== null) return;

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
        address_type: lead.primary_service_address.address_type || 'residential',
        property_notes: lead.primary_service_address.property_notes,
      };
    } else if (lead.customer) {
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

    setOriginalServiceAddress(addressData);
    setServiceLocationData(prev => ({ ...prev, ...addressData }));
  }, [lead.primary_service_address, lead.customer, originalServiceAddress]);

  // Sync size-range changes from elsewhere (e.g. quote section) without clobbering edits
  useEffect(() => {
    if (!lead.primary_service_address || originalServiceAddress === null) return;
    if (
      lead.primary_service_address.home_size_range &&
      lead.primary_service_address.home_size_range !== serviceLocationData.home_size_range
    ) {
      setServiceLocationData(prev => ({
        ...prev,
        home_size_range: lead.primary_service_address?.home_size_range || '',
      }));
    }
    if (
      lead.primary_service_address.yard_size_range &&
      lead.primary_service_address.yard_size_range !== serviceLocationData.yard_size_range
    ) {
      setServiceLocationData(prev => ({
        ...prev,
        yard_size_range: lead.primary_service_address?.yard_size_range || '',
      }));
    }
  }, [
    lead.primary_service_address?.home_size_range,
    lead.primary_service_address?.yard_size_range,
  ]);

  const hasCompleteAddress = useMemo(
    () =>
      !!(
        serviceLocationData.street_address &&
        serviceLocationData.city &&
        serviceLocationData.state &&
        serviceLocationData.zip_code
      ),
    [serviceLocationData]
  );

  const hasAddressChanges = useMemo(() => {
    if (!originalServiceAddress) return false;
    const changed =
      serviceLocationData.street_address !== originalServiceAddress.street_address ||
      serviceLocationData.city !== originalServiceAddress.city ||
      serviceLocationData.state !== originalServiceAddress.state ||
      serviceLocationData.zip_code !== originalServiceAddress.zip_code ||
      serviceLocationData.apartment_unit !== originalServiceAddress.apartment_unit ||
      serviceLocationData.address_line_2 !== originalServiceAddress.address_line_2;
    if (!changed) return false;
    return !!(
      serviceLocationData.street_address ||
      serviceLocationData.city ||
      serviceLocationData.state ||
      serviceLocationData.zip_code
    );
  }, [serviceLocationData, originalServiceAddress]);

  const hasCompleteUnchangedAddress = useMemo(() => {
    if (!hasCompleteAddress || !originalServiceAddress) return false;
    return (
      serviceLocationData.street_address === originalServiceAddress.street_address &&
      serviceLocationData.city === originalServiceAddress.city &&
      serviceLocationData.state === originalServiceAddress.state &&
      serviceLocationData.zip_code === originalServiceAddress.zip_code &&
      serviceLocationData.apartment_unit === originalServiceAddress.apartment_unit &&
      serviceLocationData.address_line_2 === originalServiceAddress.address_line_2
    );
  }, [serviceLocationData, originalServiceAddress, hasCompleteAddress]);

  const currentFormattedAddress = useMemo(() => {
    const parts: string[] = [];
    if (serviceLocationData.street_address?.trim()) {
      parts.push(serviceLocationData.street_address.trim());
    }
    if (serviceLocationData.city?.trim()) {
      parts.push(serviceLocationData.city.trim());
    }
    const state = serviceLocationData.state?.trim();
    const zip = serviceLocationData.zip_code?.trim();
    if (state && zip) parts.push(`${state} ${zip}`);
    else if (state) parts.push(state);
    else if (zip) parts.push(zip);

    return parts.length >= 1 &&
      (serviceLocationData.street_address?.trim() ||
        serviceLocationData.city?.trim())
      ? parts.join(', ')
      : '';
  }, [serviceLocationData]);

  const handleAddressSelect = (components: AddressComponents) => {
    let streetAddress = '';
    if (components.street_number && components.route) {
      streetAddress = `${components.street_number} ${components.route}`;
    } else if (components.route) {
      streetAddress = components.route;
    } else {
      streetAddress = components.formatted_address || '';
    }

    let stateAbbr = components.administrative_area_level_1 || '';
    if (STATE_NAME_TO_ABBREVIATION[stateAbbr]) {
      stateAbbr = STATE_NAME_TO_ABBREVIATION[stateAbbr];
    }

    setServiceLocationData(prev => ({
      ...prev,
      street_address: streetAddress,
      city: components.locality || '',
      state: stateAbbr,
      zip_code: components.postal_code || '',
      latitude: components.latitude,
      longitude: components.longitude,
      hasStreetView: components.hasStreetView,
    }));
  };

  const handleServiceLocationChange = (
    field: keyof ServiceAddressData,
    value: string
  ) => {
    setServiceLocationData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveAddress = async () => {
    if (!lead.customer || !hasAddressChanges) return;
    setIsSavingAddress(true);
    try {
      if (lead.primary_service_address?.id) {
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
        onShowToast?.('Service address updated successfully', 'success');
      } else {
        const isPrimary = !lead.primary_service_address;
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
        onShowToast?.(
          result.data?.isExisting
            ? 'Service address linked successfully'
            : 'Service address created and linked successfully',
          'success'
        );
      }

      setOriginalServiceAddress({ ...serviceLocationData });
    } catch (error) {
      console.error('Error saving service address:', error);
      onShowToast?.(
        error instanceof Error ? error.message : 'Failed to save service address',
        'error'
      );
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleCancelAddressChanges = () => {
    if (!originalServiceAddress) return;
    setServiceLocationData({ ...originalServiceAddress });
  };

  const createTicketFromLead = useMemo(
    () =>
      ({
        id: lead.id,
        customer: lead.customer || undefined,
        company_id: lead.company_id,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
      }) as any,
    [lead.id, lead.customer, lead.company_id, lead.created_at, lead.updated_at]
  );

  return (
    <div className={styles.panel}>
      <section className={styles.section}>
        <h3 className={styles.sectionHeading}>Contact Info</h3>
        <CustomerInformation
          ticket={createTicketFromLead}
          activityEntityType="lead"
          activityEntityId={lead.id}
          onShowToast={onShowToast}
          onRequestUndo={onRequestUndo}
          onUpdate={async updatedCustomer => {
          if (lead.customer && updatedCustomer) {
            const updatedLead = {
              ...lead,
              customer: { ...lead.customer, ...updatedCustomer },
            };
            onLeadUpdate?.(updatedLead);

            if (customerChannelRef?.current && lead.customer.id) {
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
          onShowToast?.('Customer information updated successfully.', 'success');
          }}
        />
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionHeading}>Service Location</h3>
        <ServiceLocationCard
          serviceAddress={lead.primary_service_address || null}
          leadId={lead.id}
          leadServiceAddressId={lead.service_address_id ?? null}
          leadPropertyType={lead.property_type ?? null}
          startExpanded
          showSizeInputs
          pricingSettings={pricingSettings || undefined}
          onShowToast={onShowToast}
          onRequestUndo={onRequestUndo}
          onPropertyTypeUpdated={value => {
            // Surgical state patch — flip the button without a full lead refetch.
            // Update lead.property_type, and patch the linked service_address's
            // address_type only when it is the lead's actual linked row.
            const linkedAddress =
              lead.primary_service_address &&
              lead.service_address_id &&
              lead.primary_service_address.id === lead.service_address_id
                ? { ...lead.primary_service_address, address_type: value }
                : lead.primary_service_address;
            onLeadUpdate?.({
              ...lead,
              property_type: value,
              primary_service_address: linkedAddress,
            });
          }}
          editable
          onAddressSelect={handleAddressSelect}
          onSaveAddress={handleSaveAddress}
          onCancelAddress={handleCancelAddressChanges}
          hasAddressChanges={hasAddressChanges}
          isSavingAddress={isSavingAddress}
          serviceLocationData={serviceLocationData}
          onServiceLocationChange={handleServiceLocationChange}
          hasCompleteUnchangedAddress={hasCompleteUnchangedAddress}
          currentFormattedAddress={currentFormattedAddress}
          unwrapped
        />
      </section>
    </div>
  );
}
