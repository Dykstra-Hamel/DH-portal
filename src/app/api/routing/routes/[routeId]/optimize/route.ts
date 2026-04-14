import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/routing/routes/[routeId]/optimize
// Calls Google Maps Routes API to reorder stops optimally
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
    const { routeId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch route with stops
    const { data: route } = await supabase
      .from('routes')
      .select(`
        *,
        route_stops(id, stop_order, lat, lng, address_display)
      `)
      .eq('id', routeId)
      .single();

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    const { data: userCompany } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', route.company_id)
      .single();

    if (!userCompany || !['owner', 'admin', 'manager'].includes(userCompany.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const stops = (route.route_stops ?? []).sort(
      (a: { stop_order: number }, b: { stop_order: number }) => a.stop_order - b.stop_order
    );

    if (stops.length < 2) {
      return NextResponse.json(
        { error: 'Route must have at least 2 stops to optimize' },
        { status: 400 }
      );
    }

    // Filter stops that have coordinates
    const geocodedStops = stops.filter(
      (s: { lat: number | null; lng: number | null }) => s.lat != null && s.lng != null
    );

    if (geocodedStops.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 stops must have coordinates to optimize' },
        { status: 400 }
      );
    }

    // Save before state for the audit job
    const stopOrderBefore = stops.map((s: { id: string; stop_order: number }) => ({
      stop_id: s.id,
      old_order: s.stop_order,
    }));

    // Create optimization job record
    const { data: job } = await supabase
      .from('route_optimization_jobs')
      .insert({
        company_id: route.company_id,
        route_id: routeId,
        triggered_by: user.id,
        status: 'processing',
        stop_order_before: stopOrderBefore,
        estimated_duration_before: route.estimated_total_duration,
        estimated_distance_before: route.estimated_total_distance,
        api_provider: 'google_routes',
      })
      .select()
      .single();

    const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!googleMapsApiKey) {
      await supabase
        .from('route_optimization_jobs')
        .update({ status: 'failed', error_message: 'Google Maps API key not configured' })
        .eq('id', job?.id);

      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      );
    }

    // Build the Google Maps Routes API request
    const origin = geocodedStops[0];
    const destination = geocodedStops[geocodedStops.length - 1];
    const intermediates = geocodedStops.slice(1, -1);

    const routeRequest = {
      origin: {
        location: { latLng: { latitude: origin.lat, longitude: origin.lng } },
      },
      destination: {
        location: { latLng: { latitude: destination.lat, longitude: destination.lng } },
      },
      intermediates: intermediates.map((s: { lat: number; lng: number }) => ({
        location: { latLng: { latitude: s.lat, longitude: s.lng } },
      })),
      travelMode: 'DRIVE',
      optimizeWaypointOrder: true,
    };

    const googleResponse = await fetch(
      'https://routes.googleapis.com/directions/v2:computeRoutes',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': googleMapsApiKey,
          'X-Goog-FieldMask':
            'routes.duration,routes.distanceMeters,routes.optimizedIntermediateWaypointIndex',
        },
        body: JSON.stringify(routeRequest),
      }
    );

    if (!googleResponse.ok) {
      const errorText = await googleResponse.text();
      await supabase
        .from('route_optimization_jobs')
        .update({ status: 'failed', error_message: errorText })
        .eq('id', job?.id);

      return NextResponse.json(
        { error: 'Failed to call Google Routes API' },
        { status: 502 }
      );
    }

    const googleData = await googleResponse.json();
    const optimizedRoute = googleData.routes?.[0];

    if (!optimizedRoute) {
      await supabase
        .from('route_optimization_jobs')
        .update({ status: 'failed', error_message: 'No route returned from Google' })
        .eq('id', job?.id);

      return NextResponse.json(
        { error: 'No optimized route returned' },
        { status: 502 }
      );
    }

    // Build new stop order from optimized waypoint indices
    // optimizedIntermediateWaypointIndex contains the reordered indices of intermediates
    const optimizedIndices: number[] =
      optimizedRoute.optimizedIntermediateWaypointIndex ?? [];

    // Reconstruct full stop order: origin, then reordered intermediates, then destination
    const newStopOrder: string[] = [
      geocodedStops[0].id,
      ...optimizedIndices.map((i: number) => intermediates[i].id),
      geocodedStops[geocodedStops.length - 1].id,
    ];

    // Apply the new order
    await Promise.all(
      newStopOrder.map((stopId, index) =>
        supabase
          .from('route_stops')
          .update({ stop_order: index + 1 })
          .eq('id', stopId)
      )
    );

    const stopOrderAfter = newStopOrder.map((stopId, index) => ({
      stop_id: stopId,
      new_order: index + 1,
    }));

    // Parse duration (e.g. "3600s") and distance
    const durationSeconds = optimizedRoute.duration
      ? parseInt(optimizedRoute.duration.replace('s', ''), 10)
      : null;
    const durationMinutes = durationSeconds ? Math.round(durationSeconds / 60) : null;
    const distanceMiles = optimizedRoute.distanceMeters
      ? Math.round((optimizedRoute.distanceMeters / 1609.34) * 100) / 100
      : null;

    // Update route metrics
    await supabase
      .from('routes')
      .update({
        estimated_total_duration: durationMinutes,
        estimated_total_distance: distanceMiles,
        optimization_applied: true,
        optimization_applied_at: new Date().toISOString(),
      })
      .eq('id', routeId);

    // Update optimization job
    await supabase
      .from('route_optimization_jobs')
      .update({
        status: 'completed',
        stop_order_after: stopOrderAfter,
        estimated_duration_after: durationMinutes,
        estimated_distance_after: distanceMiles,
      })
      .eq('id', job?.id);

    return NextResponse.json({
      success: true,
      optimized: {
        stopOrder: newStopOrder,
        estimatedDurationMinutes: durationMinutes,
        estimatedDistanceMiles: distanceMiles,
      },
      jobId: job?.id,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
