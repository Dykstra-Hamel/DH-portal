import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/routing/routes/[routeId]/stops/reorder
// Body: { stops: [{ id: string, order: number }] }
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

    const { data: route } = await supabase
      .from('routes')
      .select('company_id')
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
    const { stops } = body;

    if (!Array.isArray(stops) || stops.length === 0) {
      return NextResponse.json(
        { error: 'stops array is required' },
        { status: 400 }
      );
    }

    // Validate each stop has id and order
    for (const s of stops) {
      if (!s.id || typeof s.order !== 'number') {
        return NextResponse.json(
          { error: 'Each stop must have id and order fields' },
          { status: 400 }
        );
      }
    }

    // Update all stop orders
    await Promise.all(
      stops.map((s: { id: string; order: number }) =>
        supabase
          .from('route_stops')
          .update({ stop_order: s.order })
          .eq('id', s.id)
          .eq('route_id', routeId)
      )
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
