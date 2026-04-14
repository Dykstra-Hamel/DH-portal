import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/routing/routes
// Query params: companyId, date, assignedTo, status, routeType
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const date = searchParams.get('date');
    const assignedTo = searchParams.get('assignedTo');
    const status = searchParams.get('status');
    const routeType = searchParams.get('routeType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    // Verify user has access to this company
    const { data: userCompany } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', companyId)
      .single();

    if (!userCompany) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    let query = supabase
      .from('routes')
      .select(`
        *,
        route_stops(count)
      `)
      .eq('company_id', companyId)
      .order('route_date', { ascending: true })
      .order('created_at', { ascending: true });

    if (date) {
      query = query.eq('route_date', date);
    }
    if (startDate) {
      query = query.gte('route_date', startDate);
    }
    if (endDate) {
      query = query.lte('route_date', endDate);
    }
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }
    if (status) {
      query = query.eq('status', status);
    }
    if (routeType) {
      query = query.eq('route_type', routeType);
    }

    const { data: routes, error } = await query;

    if (error) {
      // Table doesn't exist yet (migration pending) — return empty list
      if ((error as any).code === '42P01') {
        return NextResponse.json({ routes: [] });
      }
      return NextResponse.json({ error: 'Failed to fetch routes' }, { status: 500 });
    }

    return NextResponse.json({ routes: routes ?? [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/routing/routes
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      company_id,
      name,
      route_date,
      assigned_to,
      route_type = 'technician',
      status = 'draft',
      start_location_address,
      start_location_lat,
      start_location_lng,
      end_location_address,
      end_location_lat,
      end_location_lng,
      use_same_end_as_start = true,
      notes,
    } = body;

    if (!company_id || !route_date) {
      return NextResponse.json(
        { error: 'company_id and route_date are required' },
        { status: 400 }
      );
    }

    // Verify user is an admin/manager of this company
    const { data: userCompany } = await supabase
      .from('user_companies')
      .select('role')
      .eq('user_id', user.id)
      .eq('company_id', company_id)
      .single();

    if (!userCompany || !['owner', 'admin', 'manager'].includes(userCompany.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { data: route, error } = await supabase
      .from('routes')
      .insert({
        company_id,
        name,
        route_date,
        assigned_to,
        route_type,
        status,
        start_location_address,
        start_location_lat,
        start_location_lng,
        end_location_address,
        end_location_lat,
        end_location_lng,
        use_same_end_as_start,
        notes,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create route' }, { status: 500 });
    }

    return NextResponse.json({ route }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
