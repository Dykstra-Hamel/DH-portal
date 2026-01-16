import { createAdminClient } from '@/lib/supabase/server-admin';
import { createClient } from '@/lib/supabase/client';

export interface ServiceAddressData {
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  apartment_unit?: string;
  address_line_2?: string;
  latitude?: number;
  longitude?: number;
  address_type?: 'residential' | 'commercial' | 'industrial' | 'mixed_use';
  property_notes?: string;
  hasStreetView?: boolean;
  home_size_range?: string;
  yard_size_range?: string;
  linear_feet_range?: string;
}

export interface CreateServiceAddressResult {
  success: boolean;
  serviceAddressId?: string;
  isExisting?: boolean;
  error?: string;
}

/**
 * Creates a new service address or returns existing one if found
 * Includes deduplication logic to prevent duplicate addresses
 */
export async function createOrFindServiceAddress(
  companyId: string,
  addressData: ServiceAddressData
): Promise<CreateServiceAddressResult> {
  try {
    const supabase = createAdminClient();

    // Normalize address data for comparison (handle empty/missing fields)
    const normalizedStreet = addressData.street_address?.trim().toLowerCase() || '';
    const normalizedCity = addressData.city?.trim().toLowerCase() || '';
    const normalizedState = addressData.state?.trim().toUpperCase() || '';
    const normalizedZip = addressData.zip_code?.trim() || '';

    // Only check for duplicates if we have sufficient data to make a meaningful comparison
    // Require at least street + city OR city + state + zip
    const hasSufficientDataForDuplicateCheck =
      (normalizedStreet && normalizedCity) ||
      (normalizedCity && normalizedState && normalizedZip);

    if (hasSufficientDataForDuplicateCheck) {
      // Build the query dynamically based on what fields we have
      let query = supabase
        .from('service_addresses')
        .select('id')
        .eq('company_id', companyId)
        .eq('is_active', true);

      if (normalizedStreet) {
        query = query.ilike('street_address', normalizedStreet);
      }
      if (normalizedCity) {
        query = query.ilike('city', normalizedCity);
      }
      if (normalizedState) {
        query = query.ilike('state', normalizedState);
      }
      if (normalizedZip) {
        query = query.eq('zip_code', normalizedZip);
      }

      const { data: existingAddress } = await query.single();

      if (existingAddress) {
        return {
          success: true,
          serviceAddressId: existingAddress.id,
          isExisting: true
        };
      }
    }

    // Try to match with service areas if coordinates are provided
    let serviceAreaId = null;
    if (addressData.latitude && addressData.longitude) {
      try {
        const serviceAreaResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/service-areas/validate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyId,
              latitude: addressData.latitude,
              longitude: addressData.longitude,
              zipCode: addressData.zip_code
            })
          }
        );

        if (serviceAreaResponse.ok) {
          const serviceAreaData = await serviceAreaResponse.json();
          if (serviceAreaData.served && serviceAreaData.primaryArea?.id) {
            serviceAreaId = serviceAreaData.primaryArea.id;
          }
        }
      } catch (error) {
        console.warn('Failed to validate service area for address:', error);
        // Continue without service area assignment
      }
    }

    // Create new service address with whatever data we have
    const { data: newServiceAddress, error: createError } = await supabase
      .from('service_addresses')
      .insert({
        company_id: companyId,
        street_address: addressData.street_address?.trim() || '',
        city: addressData.city?.trim() || '',
        state: addressData.state?.trim().toUpperCase() || '',
        zip_code: addressData.zip_code?.trim() || '',
        apartment_unit: addressData.apartment_unit?.trim() || null,
        address_line_2: addressData.address_line_2?.trim() || null,
        latitude: addressData.latitude || null,
        longitude: addressData.longitude || null,
        geocoded_at: (addressData.latitude && addressData.longitude) ? new Date().toISOString() : null,
        service_area_id: serviceAreaId,
        address_type: addressData.address_type || 'residential',
        property_notes: addressData.property_notes?.trim() || null,
        home_size_range: addressData.home_size_range || null,
        yard_size_range: addressData.yard_size_range || null,
        linear_feet_range: addressData.linear_feet_range || null
      })
      .select('id')
      .single();

    if (createError || !newServiceAddress) {
      console.error('Error creating service address:', createError);
      return {
        success: false,
        error: `Failed to create service address: ${createError?.message || 'Unknown error'}`
      };
    }

    return {
      success: true,
      serviceAddressId: newServiceAddress.id,
      isExisting: false
    };

  } catch (error) {
    console.error('Error in createOrFindServiceAddress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Links a customer to a service address with specified relationship
 */
export async function linkCustomerToServiceAddress(
  customerId: string,
  serviceAddressId: string,
  relationshipType: 'owner' | 'tenant' | 'property_manager' | 'family_member' | 'authorized_contact' | 'other' = 'owner',
  isPrimary: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Check if relationship already exists
    const { data: existingRelationship } = await supabase
      .from('customer_service_addresses')
      .select('id')
      .eq('customer_id', customerId)
      .eq('service_address_id', serviceAddressId)
      .single();

    if (existingRelationship) {
      // Relationship already exists, optionally update if making it primary
      if (isPrimary) {
        const { error: updateError } = await supabase
          .from('customer_service_addresses')
          .update({ is_primary_address: true })
          .eq('id', existingRelationship.id);

        if (updateError) {
          return { success: false, error: updateError.message };
        }
      }

      return { success: true };
    }

    // Create new customer-service address relationship
    const { error: linkError } = await supabase
      .from('customer_service_addresses')
      .insert({
        customer_id: customerId,
        service_address_id: serviceAddressId,
        relationship_type: relationshipType,
        is_primary_address: isPrimary
      });

    if (linkError) {
      console.error('Error linking customer to service address:', linkError);
      return {
        success: false,
        error: `Failed to link customer to service address: ${linkError.message}`
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Error in linkCustomerToServiceAddress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Extracts standardized address data from various input formats
 */
export function extractAddressData(
  addressDetails?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  },
  formattedAddress?: string,
  coordinates?: {
    latitude: number;
    longitude: number;
  }
): ServiceAddressData | null {
  // Prefer structured address data
  if (addressDetails?.street && addressDetails?.city && addressDetails?.state && addressDetails?.zip) {
    return {
      street_address: addressDetails.street,
      city: addressDetails.city,
      state: addressDetails.state,
      zip_code: addressDetails.zip,
      latitude: coordinates?.latitude,
      longitude: coordinates?.longitude
    };
  }

  // Fallback to parsing formatted address string
  if (formattedAddress) {
    const addressParts = formattedAddress.split(',').map(part => part.trim());
    const zipMatch = formattedAddress.match(/\b\d{5}\b/);

    let street = '';
    let city = '';
    let state = '';
    let zip = '';

    if (addressParts.length >= 1) {
      street = addressParts[0];
    }
    if (addressParts.length >= 2) {
      city = addressParts[1];
    }
    if (addressParts.length >= 3) {
      const stateZip = addressParts[2];
      const stateMatch = stateZip.match(/([A-Z]{2})/);
      state = stateMatch ? stateMatch[1] : '';
    }
    if (zipMatch) {
      zip = zipMatch[0];
    }

    // Only return if we have the minimum required fields
    if (street && city && state && zip) {
      return {
        street_address: street,
        city: city,
        state: state,
        zip_code: zip,
        latitude: coordinates?.latitude,
        longitude: coordinates?.longitude
      };
    }
  }

  return null;
}

/**
 * Gets the primary service address for a customer
 */
export async function getCustomerPrimaryServiceAddress(customerId: string): Promise<{
  serviceAddress?: any;
  error?: string;
}> {
  try {
    const supabase = createAdminClient();

    const { data: primaryAddress, error } = await supabase
      .from('customer_service_addresses')
      .select(`
        service_address:service_addresses(*)
      `)
      .eq('customer_id', customerId)
      .eq('is_primary_address', true)
      .single();

    if (error || !primaryAddress) {
      return { error: 'No primary service address found' };
    }

    return { serviceAddress: primaryAddress.service_address };

  } catch (error) {
    console.error('Error getting customer primary service address:', error);
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Updates a lead's service_address_id to link it to a service address
 */
export async function updateLeadServiceAddress(
  leadId: string,
  serviceAddressId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('leads')
      .update({ service_address_id: serviceAddressId })
      .eq('id', leadId);

    if (error) {
      console.error('Error updating lead service address:', error);
      return {
        success: false,
        error: `Failed to update lead service address: ${error.message}`
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Error in updateLeadServiceAddress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Updates an existing service address with new data
 */
export async function updateExistingServiceAddress(
  serviceAddressId: string,
  addressData: ServiceAddressData
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Get the existing service address to determine company_id for service area validation
    const { data: existingAddress, error: fetchError } = await supabase
      .from('service_addresses')
      .select('company_id')
      .eq('id', serviceAddressId)
      .single();

    if (fetchError || !existingAddress) {
      return {
        success: false,
        error: `Service address not found: ${fetchError?.message || 'Unknown error'}`
      };
    }

    // Try to match with service areas if coordinates are provided
    let serviceAreaId = null;
    if (addressData.latitude && addressData.longitude) {
      try {
        const serviceAreaResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL}/api/service-areas/validate`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              companyId: existingAddress.company_id,
              latitude: addressData.latitude,
              longitude: addressData.longitude,
              zipCode: addressData.zip_code
            })
          }
        );

        if (serviceAreaResponse.ok) {
          const serviceAreaData = await serviceAreaResponse.json();
          if (serviceAreaData.served && serviceAreaData.primaryArea?.id) {
            serviceAreaId = serviceAreaData.primaryArea.id;
          }
        }
      } catch (error) {
        console.warn('Failed to validate service area for updated address:', error);
        // Continue without service area assignment
      }
    }

    // Update the existing service address
    const { error: updateError } = await supabase
      .from('service_addresses')
      .update({
        street_address: addressData.street_address?.trim() || '',
        city: addressData.city?.trim() || '',
        state: addressData.state?.trim().toUpperCase() || '',
        zip_code: addressData.zip_code?.trim() || '',
        apartment_unit: addressData.apartment_unit?.trim() || null,
        address_line_2: addressData.address_line_2?.trim() || null,
        latitude: addressData.latitude || null,
        longitude: addressData.longitude || null,
        geocoded_at: (addressData.latitude && addressData.longitude) ? new Date().toISOString() : null,
        service_area_id: serviceAreaId,
        address_type: addressData.address_type || 'residential',
        property_notes: addressData.property_notes?.trim() || null,
        home_size_range: addressData.home_size_range || null,
        yard_size_range: addressData.yard_size_range || null,
        linear_feet_range: addressData.linear_feet_range || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceAddressId);

    if (updateError) {
      console.error('Error updating service address:', updateError);
      return {
        success: false,
        error: `Failed to update service address: ${updateError.message}`
      };
    }

    return { success: true };

  } catch (error) {
    console.error('Error in updateExistingServiceAddress:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}


/**
 * Creates a service address and links it to both customer and lead
 */
export async function createServiceAddressForLead(
  companyId: string,
  customerId: string,
  leadId: string,
  addressData: ServiceAddressData,
  isPrimary: boolean = false
): Promise<CreateServiceAddressResult & { linkedToCustomer?: boolean; linkedToLead?: boolean }> {
  try {
    // First create or find the service address
    const serviceAddressResult = await createOrFindServiceAddress(companyId, addressData);

    if (!serviceAddressResult.success || !serviceAddressResult.serviceAddressId) {
      return serviceAddressResult;
    }

    // Link to customer
    const customerLinkResult = await linkCustomerToServiceAddress(
      customerId,
      serviceAddressResult.serviceAddressId,
      'owner',
      isPrimary
    );

    // Link to lead
    const leadLinkResult = await updateLeadServiceAddress(
      leadId,
      serviceAddressResult.serviceAddressId
    );

    return {
      ...serviceAddressResult,
      linkedToCustomer: customerLinkResult.success,
      linkedToLead: leadLinkResult.success,
      error: !customerLinkResult.success ? customerLinkResult.error :
             !leadLinkResult.success ? leadLinkResult.error :
             serviceAddressResult.error
    };

  } catch (error) {
    console.error('Error in createServiceAddressForLead:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}