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
    console.log('Company has insufficient address data, using fallback coordinates');
    return FALLBACK_COORDINATES;
  }

  // Try to geocode the address
  const geocodeResult = await geocodeAddress(addressString);
  
  if (!geocodeResult) {
    console.log('Geocoding failed for company address, using fallback coordinates');
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