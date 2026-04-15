import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/routing/routes/[routeId]
export async function GET(
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

    const { data: route, error } = await supabase
      .from('routes')
      .select(`
        *,
        route_stops(
          *,
          customers(id, first_name, last_name),
          service_addresses(id, street_address, city, state, zip)
        )
      `)
      .eq('id', routeId)
      .single();

    if (error || !route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Verify user has access to this company
    const { data: userCompany } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', route.company_id)
      .single();

    if (!userCompany) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Sort stops by stop_order
    if (route.route_stops) {
      route.route_stops.sort(
        (a: { stop_order: number }, b: { stop_order: number }) => a.stop_order - b.stop_order
      );
    }

    return NextResponse.json({ route });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/routing/routes/[routeId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string }> }
) {
  try {
    const { routeId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch route to verify ownership
    const { data: existingRoute } = await supabase
      .from('routes')
      .select('company_id')
      .eq('id', routeId)
      .single();

    if (!existingRoute) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    const { data: userCompany } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', existingRoute.company_id)
      .single();

    if (!userCompany || !['owner', 'admin', 'manager'].includes(userCompany.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();

    // Only allow updating specific fields
    const allowedFields = [
      'name', 'route_date', 'assigned_to', 'route_type', 'status',
      'start_location_address', 'start_location_lat', 'start_location_lng',
      'end_location_address', 'end_location_lat', 'end_location_lng',
      'use_same_end_as_start', 'estimated_total_duration', 'estimated_total_distance',
      'actual_start_time', 'actual_end_time', 'optimization_applied',
      'optimization_applied_at', 'notes', 'pestpac_route_id',
    ];

    const updates: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: route, error } = await supabase
      .from('routes')
      .update(updates)
      .eq('id', routeId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update route' }, { status: 500 });
    }

    return NextResponse.json({ route });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/routing/routes/[routeId]
export async function DELETE(
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

    const { data: existingRoute } = await supabase
      .from('routes')
      .select('company_id, status')
      .eq('id', routeId)
      .single();

    if (!existingRoute) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    // Only allow deleting draft routes
    if (existingRoute.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft routes can be deleted' },
        { status: 400 }
      );
    }

    const { data: userCompany } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', existingRoute.company_id)
      .single();

    if (!userCompany || !['owner', 'admin', 'manager'].includes(userCompany.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { error } = await supabase
      .from('routes')
      .delete()
      .eq('id', routeId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete route' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
