import { NextRequest, NextResponse } from 'next/server';
import {
  geocodeCustomerAddress,
  CustomerAddressComponents,
} from '@/lib/geocoding';

/**
 * GET /api/internal/geocode?address=<full address string>
 * Quick forward geocode for a pre-formatted address (used by ServiceWizard).
 */
export async function GET(request: NextRequest) {
  const address = new URL(request.url).searchParams.get('address')?.trim();
  if (!address) {
    return NextResponse.json({ success: false, error: 'address is required' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ success: false, error: 'Google API key not configured' }, { status: 500 });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ success: false, error: 'Geocoding request failed' }, { status: 502 });
    }
    const data = await res.json();
    const result = data?.results?.[0];
    if (!result) {
      return NextResponse.json({ success: false, error: 'No results for this address' }, { status: 404 });
    }
    const lat = result.geometry?.location?.lat;
    const lng = result.geometry?.location?.lng;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return NextResponse.json({ success: false, error: 'Could not extract coordinates' }, { status: 404 });
    }
    return NextResponse.json({ success: true, coordinates: { latitude: lat, longitude: lng } });
  } catch {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

interface GeocodeRequest {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

/**
 * POST /api/internal/geocode
 *
 * Geocodes an address using Google Geocoding API
 * Minimum requirement: city + state
 * Returns coordinates and Street View availability
 */
export async function POST(request: NextRequest) {
  try {
    const body: GeocodeRequest = await request.json();

    // Validate request body
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request body'
        },
        { status: 400 }
      );
    }

    // Prepare address components for geocoding
    const addressComponents: CustomerAddressComponents = {
      street: body.street,
      city: body.city,
      state: body.state,
      zip: body.zip
    };

    // Call the geocoding utility
    const result = await geocodeCustomerAddress(addressComponents);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Geocoding failed'
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      coordinates: result.coordinates
    });
  } catch (error) {
    console.error('Geocoding API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}
