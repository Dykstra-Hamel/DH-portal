import { NextRequest, NextResponse } from 'next/server';

/**
 * Internal API endpoint to check Street View availability
 * This proxies Google's Street View Metadata API to keep the API key server-side
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { latitude, longitude } = body;

    // Validate input
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Get API key from server-side environment
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_PLACES_API_KEY not configured');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Call Google Street View Metadata API
    const metadataUrl = `https://maps.googleapis.com/maps/api/streetview/metadata?` +
      `location=${latitude},${longitude}&` +
      `key=${apiKey}`;

    const metadataResponse = await fetch(metadataUrl);
    const metadata = await metadataResponse.json();

    // Return availability status
    return NextResponse.json({
      available: metadata.status === 'OK',
      panoId: metadata.pano_id || null,
      location: metadata.location || null,
    });

  } catch (error) {
    console.error('Error checking Street View availability:', error);
    return NextResponse.json(
      { error: 'Failed to check Street View availability' },
      { status: 500 }
    );
  }
}
