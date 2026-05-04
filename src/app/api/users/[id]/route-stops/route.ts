import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  verifyAuth,
  isAuthorizedAdmin,
  isCompanyAdmin,
} from '@/lib/auth-helpers';
import {
  mapDbStopToRouteStop,
  attachInspectionStatus,
  ROUTE_STOPS_SELECT,
} from '@/lib/field-map/route-stops';

function toIsoDateUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// GET /api/users/[id]/route-stops?companyId=<uuid>&date=YYYY-MM-DD
// Returns the target user's route stops for the date.
// Permission: caller is the user, the user's manager, a company admin/owner,
// or a global admin.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error: authError } = await verifyAuth(request);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: targetUserId } = await params;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const date = searchParams.get('date') ?? toIsoDateUTC(new Date());

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const isSelf = user.id === targetUserId;
    const globalAdmin = !isSelf && (await isAuthorizedAdmin(user));
    const companyAdmin =
      !isSelf && !globalAdmin && (await isCompanyAdmin(user.id, companyId));

    let isManager = false;
    if (!isSelf && !globalAdmin && !companyAdmin) {
      const { data: managedRow } = await supabase
        .from('user_companies')
        .select('user_id')
        .eq('user_id', targetUserId)
        .eq('company_id', companyId)
        .eq('manager_user_id', user.id)
        .maybeSingle();
      isManager = !!managedRow;
    }

    if (!isSelf && !globalAdmin && !companyAdmin && !isManager) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: routesForDate } = await supabase
      .from('routes')
      .select('id, pestpac_route_id')
      .eq('company_id', companyId)
      .eq('route_date', date)
      .eq('assigned_to', targetUserId);

    if (!routesForDate || routesForDate.length === 0) {
      return NextResponse.json({ stops: [] });
    }

    const routeIds = routesForDate.map((r: any) => r.id);
    const routeMap = Object.fromEntries(routesForDate.map((r: any) => [r.id, r]));

    const { data: stopsData, error: stopsError } = await supabase
      .from('route_stops')
      .select(ROUTE_STOPS_SELECT)
      .in('route_id', routeIds)
      .order('stop_order');

    if (stopsError) {
      return NextResponse.json(
        { error: 'Failed to fetch route stops' },
        { status: 500 }
      );
    }

    const mappedStops = (stopsData ?? []).map((stop: any) =>
      mapDbStopToRouteStop(stop, routeMap)
    );

    await attachInspectionStatus(supabase, companyId, mappedStops);

    return NextResponse.json({ stops: mappedStops });
  } catch (error) {
    console.error('user route-stops fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
