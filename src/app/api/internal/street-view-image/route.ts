import { NextRequest, NextResponse } from 'next/server';

/**
 * Internal API endpoint to proxy Street View or Satellite images
 * This fetches images from Google's Static API server-side to keep the API key secure
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = searchParams.get('latitude');
    const longitude = searchParams.get('longitude');
    const width = searchParams.get('width') || '600';
    const height = searchParams.get('height') || '400';
    const type = searchParams.get('type') || 'streetview';
    const zoomParam = searchParams.get('zoom') || '18';
    const markerParam = searchParams.get('marker');
    const includeMarker = markerParam !== 'false';

    // Validate input
    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Validate dimensions
    const maxWidth = 640;
    const maxHeight = 640;
    const parsedWidth = Number.parseInt(width, 10);
    const parsedHeight = Number.parseInt(height, 10);
    const parsedZoom = Number.parseInt(zoomParam, 10);
    const imageWidth = Math.min(Number.isFinite(parsedWidth) ? parsedWidth : 600, maxWidth);
    const imageHeight = Math.min(Number.isFinite(parsedHeight) ? parsedHeight : 400, maxHeight);
    const zoom = Number.isFinite(parsedZoom) ? Math.min(21, Math.max(14, parsedZoom)) : 18;

    // Get API key from server-side environment
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    let googleMapsUrl: string;

    if (type === 'streetview') {
      // Generate Street View Static API URL
      googleMapsUrl = `https://maps.googleapis.com/maps/api/streetview?` +
        `size=${imageWidth}x${imageHeight}&` +
        `location=${latitude},${longitude}&` +
        `key=${apiKey}`;
    } else if (type === 'satellite') {
      const markerSegment = includeMarker ? `markers=color:red%7C${latitude},${longitude}&` : '';
      // Generate Static Maps API satellite URL
      googleMapsUrl = `https://maps.googleapis.com/maps/api/staticmap?` +
        `center=${latitude},${longitude}&` +
        `zoom=${zoom}&` +
        `size=${imageWidth}x${imageHeight}&` +
        `maptype=satellite&` +
        markerSegment +
        `key=${apiKey}`;
    } else {
      return NextResponse.json(
        { error: 'Invalid image type. Must be "streetview" or "satellite"' },
        { status: 400 }
      );
    }

    // Fetch the image from Google Maps API server-side
    const imageResponse = await fetch(googleMapsUrl);

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch image from Google Maps' },
        { status: imageResponse.status }
      );
    }

    // Get the image data as an ArrayBuffer
    const imageBuffer = await imageResponse.arrayBuffer();

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800', // Cache for 1 day, serve stale for 7 days
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}
