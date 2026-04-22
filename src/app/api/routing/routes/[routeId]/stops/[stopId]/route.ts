import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/routing/routes/[routeId]/stops/[stopId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ routeId: string; stopId: string }> }
) {
  try {
    const { routeId, stopId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch the stop and its route's company
    const { data: stop } = await supabase
      .from('route_stops')
      .select('company_id, route_id')
      .eq('id', stopId)
      .eq('route_id', routeId)
      .single();

    if (!stop) {
      return NextResponse.json({ error: 'Stop not found' }, { status: 404 });
    }

    const { data: userCompany } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', stop.company_id)
      .single();

    if (!userCompany || !['owner', 'admin', 'manager'].includes(userCompany.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();

    const allowedFields = [
      'service_type', 'service_description', 'estimated_duration', 'line_items',
      'scheduled_arrival', 'scheduled_departure', 'actual_arrival', 'actual_departure',
      'status', 'skip_reason', 'reschedule_date',
      'notes', 'access_instructions', 'technician_notes',
      'lat', 'lng', 'address_display',
      'pestpac_stop_id', 'pestpac_service_order_id',
      'customer_id', 'service_address_id', 'lead_id',
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

    const { data: updatedStop, error } = await supabase
      .from('route_stops')
      .update(updates)
      .eq('id', stopId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update stop' }, { status: 500 });
    }

    return NextResponse.json({ stop: updatedStop });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/routing/routes/[routeId]/stops/[stopId]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ routeId: string; stopId: string }> }
) {
  try {
    const { routeId, stopId } = await params;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: stop } = await supabase
      .from('route_stops')
      .select('company_id, stop_order')
      .eq('id', stopId)
      .eq('route_id', routeId)
      .single();

    if (!stop) {
      return NextResponse.json({ error: 'Stop not found' }, { status: 404 });
    }

    const { data: userCompany } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', stop.company_id)
      .single();

    if (!userCompany || !['owner', 'admin', 'manager'].includes(userCompany.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { error } = await supabase
      .from('route_stops')
      .delete()
      .eq('id', stopId);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete stop' }, { status: 500 });
    }

    // Re-sequence remaining stops after the deleted one
    const { data: remainingStops } = await supabase
      .from('route_stops')
      .select('id, stop_order')
      .eq('route_id', routeId)
      .gt('stop_order', stop.stop_order)
      .order('stop_order', { ascending: true });

    if (remainingStops && remainingStops.length > 0) {
      await Promise.all(
        remainingStops.map((s, i) =>
          supabase
            .from('route_stops')
            .update({ stop_order: stop.stop_order + i })
            .eq('id', s.id)
        )
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
