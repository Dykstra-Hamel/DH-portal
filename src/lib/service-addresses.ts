import { createAdminClient } from '@/lib/supabase/server-admin';

export interface ServiceAddressData {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  apartment_unit?: string;
  address_line_2?: string;
  latitude?: number;
  longitude?: number;
  address_type?: 'residential' | 'commercial' | 'industrial' | 'mixed_use';
  property_notes?: string;
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

    // Normalize address data for comparison
    const normalizedStreet = addressData.street_address.trim().toLowerCase();
    const normalizedCity = addressData.city.trim().toLowerCase();
    const normalizedState = addressData.state.trim().toUpperCase();
    const normalizedZip = addressData.zip_code.trim();

    // Check for existing service address to prevent duplicates
    const { data: existingAddress } = await supabase
      .from('service_addresses')
      .select('id')
      .eq('company_id', companyId)
      .ilike('street_address', normalizedStreet)
      .ilike('city', normalizedCity)
      .ilike('state', normalizedState)
      .eq('zip_code', normalizedZip)
      .eq('is_active', true)
      .single();

    if (existingAddress) {
      return {
        success: true,
        serviceAddressId: existingAddress.id,
        isExisting: true
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

    // Create new service address
    const { data: newServiceAddress, error: createError } = await supabase
      .from('service_addresses')
      .insert({
        company_id: companyId,
        street_address: addressData.street_address.trim(),
        city: addressData.city.trim(),
        state: addressData.state.trim().toUpperCase(),
        zip_code: addressData.zip_code.trim(),
        apartment_unit: addressData.apartment_unit?.trim() || null,
        address_line_2: addressData.address_line_2?.trim() || null,
        latitude: addressData.latitude || null,
        longitude: addressData.longitude || null,
        geocoded_at: (addressData.latitude && addressData.longitude) ? new Date().toISOString() : null,
        service_area_id: serviceAreaId,
        address_type: addressData.address_type || 'residential',
        property_notes: addressData.property_notes?.trim() || null
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