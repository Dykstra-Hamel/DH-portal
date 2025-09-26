import { NextRequest, NextResponse } from 'next/server';

interface AddressAutocompleteRequest {
  input: string;
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
  hasStreetView?: boolean;
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

// Helper function to check Street View availability
const checkStreetViewAvailability = async (lat: number, lng: number, apiKey: string): Promise<boolean> => {
  try {
    const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?location=${lat},${lng}&key=${apiKey}`;
    const response = await fetch(metadataUrl);

    if (!response.ok) {
      // Street View metadata API error
      return false;
    }

    const data = await response.json();
    return data.status === 'OK';
  } catch (error) {
    // Error checking Street View availability
    return false;
  }
};

export async function POST(request: NextRequest) {
  try {
    const { input, sessionToken }: AddressAutocompleteRequest = await request.json();

    // Validate input
    if (!input) {
      return NextResponse.json(
        { success: false, error: 'Input is required' },
        { status: 400 }
      );
    }

    // Minimum input length to prevent excessive API calls
    if (input.trim().length < 2) {
      return NextResponse.json({
        success: true,
        suggestions: [],
      });
    }

    // Get Google Places API key
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'Address API not configured' },
        { status: 500 }
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
      return NextResponse.json(
        { success: false, error: 'Address lookup service unavailable' },
        { status: 503 }
      );
    }

    const data: GooglePlacesNewAutocompleteResponse = await response.json();


    // If no suggestions, return empty results
    if (!data.suggestions?.length) {
      return NextResponse.json({
        success: true,
        suggestions: [],
      });
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

    // Check Street View availability for each place
    const streetViewPromises = validPlaces.map(place =>
      checkStreetViewAvailability(place.geometry.location.lat, place.geometry.location.lng, apiKey)
    );
    const streetViewResults = await Promise.all(streetViewPromises);

    // Transform Google Places results to our format
    const suggestions: AddressSuggestion[] = validPlaces.map((place, index) => ({
      formatted: place.formatted_address,
      street: buildStreetAddress(place.address_components),
      city: extractAddressComponent(place.address_components, ['locality', 'sublocality']),
      state: extractAddressComponent(place.address_components, ['administrative_area_level_1']),
      postcode: extractAddressComponent(place.address_components, ['postal_code']),
      country: extractAddressComponent(place.address_components, ['country']),
      lat: place.geometry.location.lat,
      lon: place.geometry.location.lng,
      hasStreetView: streetViewResults[index]
    }));


    return NextResponse.json({
      success: true,
      suggestions,
    });
  } catch (error) {
    console.error('Error in internal address autocomplete:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}