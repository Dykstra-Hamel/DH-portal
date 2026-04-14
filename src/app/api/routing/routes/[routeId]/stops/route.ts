import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/routing/routes/[routeId]/stops
export async function POST(
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

    // Fetch route to verify access
    const { data: route } = await supabase
      .from('routes')
      .select('company_id, status')
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

    const body = await request.json();
    const {
      service_address_id,
      customer_id,
      lead_id,
      service_type,
      service_description,
      estimated_duration,
      line_items,
      scheduled_arrival,
      scheduled_departure,
      notes,
      access_instructions,
      lat,
      lng,
      address_display,
      pestpac_stop_id,
      pestpac_service_order_id,
      stop_order: requestedOrder,
    } = body;

    // Determine stop_order: append to end if not specified
    let stop_order = requestedOrder;
    if (!stop_order) {
      const { data: lastStop } = await supabase
        .from('route_stops')
        .select('stop_order')
        .eq('route_id', routeId)
        .order('stop_order', { ascending: false })
        .limit(1)
        .single();

      stop_order = lastStop ? lastStop.stop_order + 1 : 1;
    }

    const { data: stop, error } = await supabase
      .from('route_stops')
      .insert({
        route_id: routeId,
        company_id: route.company_id,
        stop_order,
        service_address_id,
        customer_id,
        lead_id,
        service_type,
        service_description,
        estimated_duration,
        line_items,
        scheduled_arrival,
        scheduled_departure,
        notes,
        access_instructions,
        lat,
        lng,
        address_display,
        pestpac_stop_id,
        pestpac_service_order_id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to add stop' }, { status: 500 });
    }

    return NextResponse.json({ stop }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
