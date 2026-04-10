import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';

interface ReverseGeocodeBody {
  latitude?: number;
  longitude?: number;
}

interface GoogleAddressComponent {
  long_name: string;
  short_name: string;
  types: string[];
}

interface GoogleGeocodeResult {
  formatted_address: string;
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
  address_components: GoogleAddressComponent[];
}

const extractAddressComponent = (
  components: GoogleAddressComponent[],
  types: string[]
): GoogleAddressComponent | undefined => {
  return components.find(component => types.some(type => component.types.includes(type)));
};

export async function POST(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body: ReverseGeocodeBody = await request.json();
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return NextResponse.json(
        { error: 'Valid latitude and longitude are required.' },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Latitude/longitude out of range.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Places API key is not configured.' },
        { status: 500 }
      );
    }

    const reverseGeocodeUrl =
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}` +
      `&result_type=street_address|premise|subpremise&key=${apiKey}`;

    const response = await fetch(reverseGeocodeUrl, { cache: 'no-store' });
    if (!response.ok) {
      return NextResponse.json(
        { error: `Reverse geocoding failed with status ${response.status}.` },
        { status: 502 }
      );
    }

    const payload = await response.json();
    const firstResult = payload?.results?.[0] as GoogleGeocodeResult | undefined;

    if (!firstResult) {
      return NextResponse.json(
        { error: 'Unable to resolve an address for this location.' },
        { status: 404 }
      );
    }

    const streetNumber = extractAddressComponent(firstResult.address_components, ['street_number'])?.long_name;
    const route = extractAddressComponent(firstResult.address_components, ['route'])?.long_name;
    const locality = extractAddressComponent(firstResult.address_components, ['locality', 'sublocality'])?.long_name;
    const state = extractAddressComponent(firstResult.address_components, ['administrative_area_level_1'])?.short_name;
    const postalCode = extractAddressComponent(firstResult.address_components, ['postal_code'])?.long_name;
    const country = extractAddressComponent(firstResult.address_components, ['country'])?.long_name;

    const resolvedLat =
      typeof firstResult.geometry?.location?.lat === 'number'
        ? firstResult.geometry.location.lat
        : latitude;
    const resolvedLng =
      typeof firstResult.geometry?.location?.lng === 'number'
        ? firstResult.geometry.location.lng
        : longitude;

    return NextResponse.json({
      addressComponents: {
        street_number: streetNumber,
        route,
        locality,
        administrative_area_level_1: state,
        postal_code: postalCode,
        country,
        formatted_address: firstResult.formatted_address,
        latitude: resolvedLat,
        longitude: resolvedLng,
      },
    });
  } catch (error) {
    console.error('Reverse geocode API error:', error);
    return NextResponse.json(
      { error: 'Failed to reverse geocode current location.' },
      { status: 500 }
    );
  }
}
