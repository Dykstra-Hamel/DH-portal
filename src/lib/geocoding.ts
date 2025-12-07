interface Company {
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  widget_config?: any;
}

interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
}

interface CachedGeocodeResult extends GeocodeResult {
  cachedAt: string;
}

// NYC coordinates as fallback
const FALLBACK_COORDINATES = {
  lat: 40.7128,
  lng: -74.0060,
  address: 'New York, NY',
};

// Cache timeout: 7 days
const CACHE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Build a full address string from company address components
 */
function buildAddressString(company: Company): string {
  const parts = [
    company.address,
    company.city,
    company.state,
    company.zip_code,
    company.country || 'United States',
  ].filter(Boolean);
  
  return parts.join(', ');
}

/**
 * Check if cached geocode result is still valid
 */
function isCacheValid(cachedResult: CachedGeocodeResult): boolean {
  const cachedTime = new Date(cachedResult.cachedAt).getTime();
  const now = Date.now();
  return (now - cachedTime) < CACHE_TIMEOUT_MS;
}

/**
 * Geocode an address using Google Places API
 */
async function geocodeAddress(address: string): Promise<GeocodeResult | null> {
  try {
    const response = await fetch('/api/google-places-key');
    if (!response.ok) {
      console.error('Failed to get Google Places API key');
      return null;
    }

    const { apiKey } = await response.json();
    if (!apiKey) {
      console.error('Google Places API key not available');
      return null;
    }

    // Use Google Places API Text Search to geocode the address
    const searchUrl = 'https://places.googleapis.com/v1/places:searchText';
    const requestBody = {
      textQuery: address,
      maxResultCount: 1,
    };

    const searchResponse = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.location,places.formattedAddress',
      },
      body: JSON.stringify(requestBody),
    });

    if (!searchResponse.ok) {
      console.error('Google Places Text Search failed:', searchResponse.status);
      return null;
    }

    const searchData = await searchResponse.json();
    const place = searchData.places?.[0];

    if (!place?.location) {
      console.error('No location found for address:', address);
      return null;
    }

    return {
      lat: place.location.latitude,
      lng: place.location.longitude,
      address: place.formattedAddress || address,
    };
  } catch (error) {
    console.error('Error geocoding address:', error);
    return null;
  }
}

/**
 * Get geocoded coordinates for a company, using cache when possible
 */
export async function getCompanyCoordinates(company: Company): Promise<GeocodeResult> {
  // Check if we have a cached result
  const cachedResult = company.widget_config?.geocodedAddress as CachedGeocodeResult | undefined;
  
  if (cachedResult && isCacheValid(cachedResult)) {
    return {
      lat: cachedResult.lat,
      lng: cachedResult.lng,
      address: cachedResult.address,
    };
  }

  // Build address string from company components
  const addressString = buildAddressString(company);
  
  if (!addressString || addressString.trim().length < 5) {
    console.warn('Company has insufficient address data, using fallback coordinates');
    return FALLBACK_COORDINATES;
  }

  // Try to geocode the address
  const geocodeResult = await geocodeAddress(addressString);
  
  if (!geocodeResult) {
    console.warn('Geocoding failed for company address, using fallback coordinates');
    return FALLBACK_COORDINATES;
  }

  return geocodeResult;
}

/**
 * Save geocoded coordinates to company widget_config for caching
 */
export function createCachedGeocodeResult(result: GeocodeResult): CachedGeocodeResult {
  return {
    ...result,
    cachedAt: new Date().toISOString(),
  };
}

// ============================================================================
// Reusable Geocoding Utilities for Customer/Service Addresses
// ============================================================================

export interface CustomerAddressComponents {
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}

export interface CustomerGeocodeResult {
  success: boolean;
  coordinates?: {
    lat: number;
    lng: number;
    hasStreetView?: boolean;
  };
  error?: string;
}

/**
 * Validates a single address field
 * Returns true if the field has a valid value (not null, empty, or "none")
 */
export function isValidAddressField(value: string | null | undefined): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (trimmed === '') return false;
  if (trimmed.toLowerCase() === 'none') return false;
  return true;
}

/**
 * Builds a geocodable address string from address components
 * Returns null if insufficient data (requires at least city + state)
 */
export function buildGeocodableAddress(
  street?: string | null,
  city?: string | null,
  state?: string | null,
  zip?: string | null
): string | null {
  const parts: string[] = [];

  // Add valid components to the address string
  if (isValidAddressField(street)) parts.push(street!.trim());
  if (isValidAddressField(city)) parts.push(city!.trim());
  if (isValidAddressField(state)) parts.push(state!.trim());
  if (isValidAddressField(zip)) parts.push(zip!.trim());

  // Require at least city + state for meaningful geocoding
  if (!isValidAddressField(city) || !isValidAddressField(state)) {
    return null; // Not enough data to geocode
  }

  return parts.join(', ');
}

/**
 * Geocodes an address using Google Geocoding API (server-side only)
 * Minimum requirement: city + state
 * Returns coordinates and Street View availability
 *
 * NOTE: This function should only be called from API routes (server-side)
 * as it uses the GOOGLE_PLACES_API_KEY environment variable
 */
export async function geocodeCustomerAddress(
  addressComponents: CustomerAddressComponents
): Promise<CustomerGeocodeResult> {
  try {
    // Build the geocodable address string
    const addressString = buildGeocodableAddress(
      addressComponents.street,
      addressComponents.city,
      addressComponents.state,
      addressComponents.zip
    );

    if (!addressString) {
      return {
        success: false,
        error: 'Insufficient address data (requires at least city + state)'
      };
    }

    // Get API key (server-side only)
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: 'Google Places API key not configured'
      };
    }

    // Call Google Geocoding API
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressString)}&key=${apiKey}`;
    const geocodeResponse = await fetch(geocodeUrl);

    if (!geocodeResponse.ok) {
      return {
        success: false,
        error: `Geocoding API error: ${geocodeResponse.status}`
      };
    }

    const geocodeData = await geocodeResponse.json();

    if (geocodeData.status !== 'OK' || !geocodeData.results?.[0]) {
      return {
        success: false,
        error: `Geocoding failed: ${geocodeData.status}`
      };
    }

    const location = geocodeData.results[0].geometry?.location;
    if (!location?.lat || !location?.lng) {
      return {
        success: false,
        error: 'No coordinates found in geocoding response'
      };
    }

    // Check Street View availability
    let hasStreetView = false;
    try {
      const streetViewUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${location.lat},${location.lng}&key=${apiKey}`;
      const streetViewResponse = await fetch(streetViewUrl);

      if (streetViewResponse.ok) {
        const streetViewData = await streetViewResponse.json();
        hasStreetView = streetViewData.status === 'OK';
      }
    } catch (error) {
      console.warn('Street View check failed:', error);
      // Continue without Street View info
    }

    return {
      success: true,
      coordinates: {
        lat: location.lat,
        lng: location.lng,
        hasStreetView
      }
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown geocoding error'
    };
  }
}