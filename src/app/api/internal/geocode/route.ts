import { NextRequest, NextResponse } from 'next/server';
import {
  geocodeCustomerAddress,
  CustomerAddressComponents,
} from '@/lib/geocoding';

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
