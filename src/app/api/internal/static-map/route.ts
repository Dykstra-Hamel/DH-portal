import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';

/**
 * GET /api/internal/static-map
 *
 * Mode 1 — address center:
 *   ?address=<encoded address string>
 *
 * Mode 2 — route preview with numbered markers:
 *   ?markers=lat,lng|lat,lng|...   (pipe-separated lat,lng pairs, in stop order)
 *
 * Proxies Google Static Maps API so the key stays server-side.
 */
export async function GET(request: NextRequest) {
  const authResult = await getAuthenticatedUser();
  if (authResult instanceof NextResponse) return authResult;

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return new NextResponse('API key not configured', { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address')?.trim();
  const markersParam = searchParams.get('markers')?.trim();

  let staticMapUrl: string;

  if (markersParam) {
    // Route preview: plot numbered markers at each coordinate
    const pairs = markersParam.split('|').filter(Boolean);
    if (pairs.length === 0) {
      return new NextResponse('markers is empty', { status: 400 });
    }

    const markerParams = pairs
      .map((pair, i) => {
        const [lat, lng] = pair.split(',');
        if (!lat || !lng) return null;
        // Labels: A-Z for first 26, then numbers
        const label = i < 26 ? String.fromCharCode(65 + i) : String(i + 1);
        return `markers=color:0x0075DE|label:${label}|${lat.trim()},${lng.trim()}`;
      })
      .filter(Boolean)
      .join('&');

    // Auto-center on the average of all points
    const latNums = pairs.map(p => parseFloat(p.split(',')[0])).filter(n => !isNaN(n));
    const lngNums = pairs.map(p => parseFloat(p.split(',')[1])).filter(n => !isNaN(n));
    const centerLat = latNums.reduce((a, b) => a + b, 0) / latNums.length;
    const centerLng = lngNums.reduce((a, b) => a + b, 0) / lngNums.length;
    const zoom = pairs.length === 1 ? 14 : pairs.length <= 4 ? 12 : 11;

    staticMapUrl =
      `https://maps.googleapis.com/maps/api/staticmap` +
      `?center=${centerLat},${centerLng}` +
      `&zoom=${zoom}` +
      `&size=800x480` +
      `&scale=2` +
      `&maptype=satellite` +
      `&${markerParams}` +
      `&key=${apiKey}`;

  } else if (address) {
    // Single address center
    staticMapUrl =
      `https://maps.googleapis.com/maps/api/staticmap` +
      `?center=${encodeURIComponent(address)}` +
      `&zoom=19` +
      `&size=800x400` +
      `&scale=2` +
      `&maptype=satellite` +
      `&key=${apiKey}`;

  } else {
    return new NextResponse('address or markers is required', { status: 400 });
  }

  try {
    const res = await fetch(staticMapUrl, { cache: 'force-cache' });
    if (!res.ok) {
      return new NextResponse('Failed to fetch static map', { status: 502 });
    }

    const imageBuffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') ?? 'image/png';

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    return new NextResponse('Internal server error', { status: 500 });
  }
}
