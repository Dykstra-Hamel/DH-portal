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
  type MappedRouteStop,
} from '@/lib/field-map/route-stops';

function toIsoDateUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// GET /api/users/[id]/team-route-stops?companyId=<uuid>&date=YYYY-MM-DD
// Returns route stops for every direct report of [id] for the given date,
// grouped by team member. Used by the manager Team Route Map.
// Permission: caller is the user (manager themself), a company admin/owner,
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

    const { id: managerId } = await params;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const date = searchParams.get('date') ?? toIsoDateUTC(new Date());

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    // Optional `departments=inspector` (or `technician`, or CSV). When set,
    // restricts the returned members to direct reports who have at least one
    // of those departments in this company. Used by the per-department
    // "Show Route Map" buttons in the manager Team section.
    const departmentsParam = searchParams.get('departments');
    const departmentFilter = departmentsParam
      ? departmentsParam
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      : null;

    const isSelf = user.id === managerId;
    const globalAdmin = !isSelf && (await isAuthorizedAdmin(user));
    const companyAdmin =
      !isSelf && !globalAdmin && (await isCompanyAdmin(user.id, companyId));

    if (!isSelf && !globalAdmin && !companyAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Direct reports
    const { data: reportRows } = await supabase
      .from('user_companies')
      .select('user_id')
      .eq('company_id', companyId)
      .eq('manager_user_id', managerId);

    if (!reportRows || reportRows.length === 0) {
      return NextResponse.json({ members: [] });
    }

    const reportIds = reportRows.map((r: any) => r.user_id);

    // Profiles + departments (filtered to this company)
    const { data: profiles } = await supabase
      .from('profiles')
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        avatar_url,
        uploaded_avatar_url,
        user_departments!left(department, company_id)
        `
      )
      .in('id', reportIds);

    const profileById = new Map<string, any>();
    (profiles || []).forEach((p: any) => {
      const filteredDepts = Array.isArray(p.user_departments)
        ? p.user_departments
            .filter((d: any) => d.company_id === companyId)
            .map((d: any) => d.department)
        : [];
      profileById.set(p.id, {
        id: p.id,
        fullName:
          `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email || '',
        avatarUrl: p.avatar_url ?? null,
        uploadedAvatarUrl: p.uploaded_avatar_url ?? null,
        departments: filteredDepts,
      });
    });

    // Apply optional department filter so e.g. the manager "Inspectors" map
    // doesn't include direct reports who are only technicians.
    const filteredReportIds = departmentFilter
      ? reportIds.filter((uid: string) => {
          const depts: string[] = profileById.get(uid)?.departments ?? [];
          return depts.some((d: string) => departmentFilter.includes(d));
        })
      : reportIds;

    if (filteredReportIds.length === 0) {
      return NextResponse.json({ members: [] });
    }

    // All routes for this date assigned to any direct report
    const { data: routesForDate } = await supabase
      .from('routes')
      .select('id, pestpac_route_id, assigned_to')
      .eq('company_id', companyId)
      .eq('route_date', date)
      .in('assigned_to', filteredReportIds);

    if (!routesForDate || routesForDate.length === 0) {
      const members = filteredReportIds.map((uid: string) => {
        const p = profileById.get(uid);
        return {
          userId: uid,
          fullName: p?.fullName ?? '',
          avatarUrl: p?.avatarUrl ?? null,
          uploadedAvatarUrl: p?.uploadedAvatarUrl ?? null,
          departments: p?.departments ?? [],
          stops: [] as MappedRouteStop[],
        };
      });
      return NextResponse.json({ members });
    }

    const routeIds = routesForDate.map((r: any) => r.id);
    const routeMap: Record<string, any> = Object.fromEntries(
      routesForDate.map((r: any) => [r.id, r])
    );
    const routeOwnerByRouteId: Record<string, string> = Object.fromEntries(
      routesForDate.map((r: any) => [r.id, r.assigned_to])
    );

    const { data: stopsData } = await supabase
      .from('route_stops')
      .select(ROUTE_STOPS_SELECT)
      .in('route_id', routeIds)
      .order('stop_order');

    const stopsByOwner: Record<string, MappedRouteStop[]> = {};
    const allStops: MappedRouteStop[] = [];

    (stopsData ?? []).forEach((row: any) => {
      const ownerId = routeOwnerByRouteId[row.route_id];
      if (!ownerId) return;
      const mapped = mapDbStopToRouteStop(row, routeMap);
      allStops.push(mapped);
      if (!stopsByOwner[ownerId]) stopsByOwner[ownerId] = [];
      stopsByOwner[ownerId].push(mapped);
    });

    await attachInspectionStatus(supabase, companyId, allStops);

    const members = filteredReportIds.map((uid: string) => {
      const p = profileById.get(uid);
      return {
        userId: uid,
        fullName: p?.fullName ?? '',
        avatarUrl: p?.avatarUrl ?? null,
        uploadedAvatarUrl: p?.uploadedAvatarUrl ?? null,
        departments: p?.departments ?? [],
        stops: stopsByOwner[uid] ?? [],
      };
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('team-route-stops fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
