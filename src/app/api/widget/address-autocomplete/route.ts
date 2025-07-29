import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Helper function to add CORS headers
const addCorsHeaders = (response: NextResponse) => {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return response;
};

interface AddressAutocompleteRequest {
  input: string;
  companyId: string;
  sessionToken?: string;
}

interface GooglePlacesNewAutocompletePrediction {
  placePrediction: {
    place: string; // Resource name format: places/ChIJ...
    placeId: string;
    text: {
      text: string;
      matches: Array<{
        endOffset: number;
      }>;
    };
    structuredFormat: {
      mainText: {
        text: string;
        matches: Array<{
          endOffset: number;
        }>;
      };
      secondaryText: {
        text: string;
      };
    };
    types: string[];
  };
}

interface GooglePlacesNewAutocompleteResponse {
  suggestions: GooglePlacesNewAutocompletePrediction[];
}

interface GooglePlaceDetailsAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GooglePlaceDetailsGeometry {
  location: {
    lat: number;
    lng: number;
  };
}

interface GooglePlaceDetailsResult {
  place_id: string;
  formatted_address: string;
  address_components: GooglePlaceDetailsAddressComponent[];
  geometry: GooglePlaceDetailsGeometry;
}


interface AddressSuggestion {
  formatted: string;
  street?: string;
  city?: string;
  state?: string;
  postcode?: string;
  country?: string;
  lat: number;
  lon: number;
}

// Helper function to extract address components from Google Places response
const extractAddressComponent = (
  addressComponents: GooglePlaceDetailsAddressComponent[],
  types: string[]
): string | undefined => {
  const component = addressComponents.find(component =>
    types.some(type => component.types.includes(type))
  );
  return component?.long_name;
};

// Helper function to build street address from components
const buildStreetAddress = (addressComponents: GooglePlaceDetailsAddressComponent[]): string => {
  const streetNumber = extractAddressComponent(addressComponents, ['street_number']);
  const route = extractAddressComponent(addressComponents, ['route']);
  
  if (streetNumber && route) {
    return `${streetNumber} ${route}`;
  }
  return route || streetNumber || '';
};

export async function POST(request: NextRequest) {
  try {
    const { input, companyId, sessionToken }: AddressAutocompleteRequest =
      await request.json();

    // Validate input
    if (!input || !companyId) {
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Input and companyId are required' },
          { status: 400 }
        )
      );
    }

    // Minimum input length to prevent excessive API calls
    if (input.trim().length < 2) {
      return addCorsHeaders(
        NextResponse.json({
          success: true,
          suggestions: [],
        })
      );
    }

    // Check if company exists and has address API enabled
    const supabase = createAdminClient();
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, widget_config')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return addCorsHeaders(
        NextResponse.json({ error: 'Company not found' }, { status: 404 })
      );
    }

    // Check if address API is enabled for this company
    const widgetConfig = company.widget_config || {};
    const addressApiConfig = widgetConfig.addressApi || { enabled: false };

    if (!addressApiConfig.enabled) {
      // Return empty suggestions if API is disabled
      return addCorsHeaders(
        NextResponse.json({
          success: true,
          suggestions: [],
        })
      );
    }

    // Get Google Places API key
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Address API not configured' },
          { status: 500 }
        )
      );
    }

    // Configure Google Places API (New) Autocomplete request
    const autocompleteUrl = 'https://places.googleapis.com/v1/places:autocomplete';
    const requestBody: any = {
      input: input.trim(),
      includedRegionCodes: ['us'], // Restrict to US addresses
      languageCode: 'en',
      includedPrimaryTypes: ['street_address', 'route', 'subpremise'],
    };

    // Add session token if provided (for session-based billing)
    if (sessionToken) {
      requestBody.sessionToken = sessionToken;
    }

    const response = await fetch(autocompleteUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error(
        'Google Places API error:',
        response.status,
        response.statusText
      );
      return addCorsHeaders(
        NextResponse.json(
          { error: 'Address lookup service unavailable' },
          { status: 503 }
        )
      );
    }

    const data: GooglePlacesNewAutocompleteResponse = await response.json();

    // If no suggestions, return empty results
    if (!data.suggestions?.length) {
      return addCorsHeaders(
        NextResponse.json({
          success: true,
          suggestions: [],
        })
      );
    }

    // Get Place Details for each prediction to get full address information
    const detailsPromises = data.suggestions.slice(0, 5).map(async (suggestion) => {
      const placeId = suggestion.placePrediction.placeId;
      const detailsUrl = `https://places.googleapis.com/v1/places/${placeId}`;

      try {
        const detailsResponse = await fetch(detailsUrl, {
          method: 'GET',
          headers: {
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'formattedAddress,addressComponents,location',
          },
        });

        if (!detailsResponse.ok) {
          console.error('Place Details API error:', detailsResponse.status);
          return null;
        }

        const detailsData = await detailsResponse.json();
        if (!detailsData) {
          console.error('Place Details API returned empty data');
          return null;
        }

        // Enhanced debugging for coordinate accuracy
        console.log('🏠 GOOGLE PLACES API RESPONSE:', {
          formattedAddress: detailsData.formattedAddress,
          coordinates: { 
            lat: detailsData.location?.latitude, 
            lng: detailsData.location?.longitude 
          },
          addressTypes: suggestion.placePrediction.types,
          isStreetAddress: suggestion.placePrediction.types?.includes('street_address'),
          placeId: placeId
        });

        // Coordinate quality validation
        const isStreetAddress = suggestion.placePrediction.types?.includes('street_address');
        const hasLocation = detailsData.location?.latitude && detailsData.location?.longitude;
        
        if (!isStreetAddress) {
          console.warn('Address may not be rooftop-accurate - not a street address:', {
            types: suggestion.placePrediction.types,
            formattedAddress: detailsData.formattedAddress
          });
        }
        
        if (!hasLocation) {
          console.error('No coordinates available for place:', placeId);
          return null;
        }

        // Transform to old format for compatibility
        return {
          place_id: placeId,
          formatted_address: detailsData.formattedAddress,
          address_components: detailsData.addressComponents?.map((comp: any) => ({
            long_name: comp.longText,
            short_name: comp.shortText,
            types: comp.types,
          })) || [],
          geometry: {
            location: {
              lat: detailsData.location?.latitude || 0,
              lng: detailsData.location?.longitude || 0,
            },
          },
        };
      } catch (error) {
        console.error('Error fetching place details:', error);
        return null;
      }
    });

    const placeDetails = await Promise.all(detailsPromises);
    const validPlaces = placeDetails.filter(place => place !== null) as GooglePlaceDetailsResult[];

    // Transform Google Places results to our format
    const suggestions: AddressSuggestion[] = validPlaces.map(place => ({
      formatted: place.formatted_address,
      street: buildStreetAddress(place.address_components),
      city: extractAddressComponent(place.address_components, ['locality', 'sublocality']),
      state: extractAddressComponent(place.address_components, ['administrative_area_level_1']),
      postcode: extractAddressComponent(place.address_components, ['postal_code']),
      country: extractAddressComponent(place.address_components, ['country']),
      lat: place.geometry.location.lat,
      lon: place.geometry.location.lng,
    }));

    return addCorsHeaders(
      NextResponse.json({
        success: true,
        suggestions,
      })
    );
  } catch (error) {
    console.error('Error in address autocomplete:', error);
    return addCorsHeaders(
      NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    );
  }
}
