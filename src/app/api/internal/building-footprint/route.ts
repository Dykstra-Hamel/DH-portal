import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';

interface OverpassNode {
  lat: number;
  lon: number;
}

interface OverpassWay {
  type: 'way';
  id: number;
  tags?: Record<string, string>;
  geometry?: OverpassNode[];
}

interface OverpassResponse {
  elements?: OverpassWay[];
}

function mercatorY(lat: number): number {
  const latRad = (lat * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + latRad / 2));
}

/**
 * Project a lat/lng point to normalized 0-1 canvas coordinates.
 * Accounts for heading rotation.
 */
function latLngToNormalized(
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  zoom: number,
  heading: number,
  containerWidth: number,
  containerHeight: number
): { x: number; y: number } {
  // Pixels per world unit at this zoom
  const scale = Math.pow(2, zoom) * 256;

  // World coordinate deltas
  const dLng = lng - centerLng;
  const dMercY = mercatorY(centerLat) - mercatorY(lat); // inverted (down is positive)

  // Convert to pixel offsets
  let px = (dLng / 360) * scale;
  let py = (dMercY / (2 * Math.PI)) * scale;

  // Apply heading rotation around center
  if (heading !== 0) {
    const angle = -(heading * Math.PI) / 180;
    const rotPx = px * Math.cos(angle) - py * Math.sin(angle);
    const rotPy = px * Math.sin(angle) + py * Math.cos(angle);
    px = rotPx;
    py = rotPy;
  }

  return {
    x: 0.5 + px / containerWidth,
    y: 0.5 + py / containerHeight,
  };
}

function pointInPolygon(
  px: number,
  py: number,
  polygon: Array<{ x: number; y: number }>
): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function polygonCentroid(nodes: OverpassNode[]): { lat: number; lng: number } {
  const lat = nodes.reduce((sum, n) => sum + n.lat, 0) / nodes.length;
  const lng = nodes.reduce((sum, n) => sum + n.lon, 0) / nodes.length;
  return { lat, lng };
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const lat = Number(searchParams.get('lat'));
    const lng = Number(searchParams.get('lng'));
    const zoom = Number(searchParams.get('zoom') ?? '20');
    const heading = Number(searchParams.get('heading') ?? '0');
    const containerWidth = Number(searchParams.get('containerWidth') ?? '600');
    const containerHeight = Number(searchParams.get('containerHeight') ?? '600');
    const tapX = Number(searchParams.get('tapX') ?? '0.5');
    const tapY = Number(searchParams.get('tapY') ?? '0.5');

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return NextResponse.json({ error: 'Valid lat and lng are required.' }, { status: 400 });
    }

    // Query Overpass API for buildings within 80m of the center
    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    const query = `[out:json][timeout:10];way["building"](around:80,${lat},${lng});out geom;`;

    const overpassResponse = await fetch(overpassUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(12_000),
    });

    if (!overpassResponse.ok) {
      return NextResponse.json({ outlinePoints: [], source: 'osm', found: false }, { status: 200 });
    }

    const overpassData: OverpassResponse = await overpassResponse.json();
    const ways = (overpassData.elements ?? []).filter(
      el => el.type === 'way' && Array.isArray(el.geometry) && el.geometry.length >= 3
    );

    if (ways.length === 0) {
      return NextResponse.json({ outlinePoints: [], source: 'osm', found: false }, { status: 200 });
    }

    // Project all buildings and try to find the one containing the tap point
    const projected = ways.map(way => {
      const nodes = way.geometry!;
      const points = nodes.map(node =>
        latLngToNormalized(
          node.lat, node.lon,
          lat, lng,
          zoom, heading,
          containerWidth, containerHeight
        )
      );
      // Deduplicate closing node (OSM often repeats the first node at the end)
      const deduped =
        points.length > 1 &&
        Math.abs(points[0].x - points[points.length - 1].x) < 0.001 &&
        Math.abs(points[0].y - points[points.length - 1].y) < 0.001
          ? points.slice(0, -1)
          : points;

      const centroid = polygonCentroid(nodes);
      const centroidProj = latLngToNormalized(
        centroid.lat, centroid.lng,
        lat, lng,
        zoom, heading,
        containerWidth, containerHeight
      );
      const distToCenterSq =
        Math.pow(centroidProj.x - tapX, 2) + Math.pow(centroidProj.y - tapY, 2);

      return { points: deduped, distToCenterSq, containsTap: pointInPolygon(tapX, tapY, deduped) };
    });

    // Prefer buildings that contain the tap point; among those, pick the smallest (most specific)
    const containing = projected.filter(b => b.containsTap);
    const best =
      containing.length > 0
        ? containing.reduce((a, b) => (a.distToCenterSq < b.distToCenterSq ? a : b))
        : projected.reduce((a, b) => (a.distToCenterSq < b.distToCenterSq ? a : b));

    // Filter points to valid range (some buildings may partially extend out of view)
    const outlinePoints = best.points
      .map(p => ({
        x: Math.round(p.x * 100000) / 100000,
        y: Math.round(p.y * 100000) / 100000,
      }))
      .filter(p => p.x >= -0.1 && p.x <= 1.1 && p.y >= -0.1 && p.y <= 1.1);

    if (outlinePoints.length < 3) {
      return NextResponse.json({ outlinePoints: [], source: 'osm', found: false }, { status: 200 });
    }

    return NextResponse.json(
      { outlinePoints, source: 'osm', found: true },
      {
        status: 200,
        headers: { 'Cache-Control': 'public, max-age=86400' },
      }
    );
  } catch {
    // Silently return empty on any error — caller will fall back to AI
    return NextResponse.json({ outlinePoints: [], source: 'osm', found: false }, { status: 200 });
  }
}
