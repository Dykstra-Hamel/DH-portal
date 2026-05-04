import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { verifyCompanyAdminAccess } from '@/lib/field-sales/admin-reports';
import {
  mapDbStopToRouteStop,
  attachInspectionStatus,
  ROUTE_STOPS_SELECT,
  type MappedRouteStop,
} from '@/lib/field-map/route-stops';

const FIELD_DEPARTMENTS = ['inspector', 'technician'];

function toIsoDateUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// GET /api/field-sales/admin-team-route-stops
//   ?companyId=<uuid>&date=YYYY-MM-DD&branchId=<uuid|null>
//
// Returns route stops for every inspector/technician in the company (or a
// single branch) for the given date, grouped by team member. Used by the
// Admin scope of TeamRouteMapModal.
//
// Permission: caller must be a company admin/owner/manager OR a global admin.
export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) return authResult;
    const { user, isGlobalAdmin } = authResult;

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId is required' },
        { status: 400 }
      );
    }

    const date = searchParams.get('date') ?? toIsoDateUTC(new Date());
    const branchId = searchParams.get('branchId') || null;

    // Optional `departments=inspector` or `departments=technician` (or
    // CSV of both). When omitted, falls back to all field departments so
    // existing callers keep their previous behavior.
    const departmentsParam = searchParams.get('departments');
    const requestedDepartments = (departmentsParam
      ? departmentsParam.split(',').map(s => s.trim()).filter(Boolean)
      : FIELD_DEPARTMENTS
    ).filter(d => FIELD_DEPARTMENTS.includes(d));
    const effectiveDepartments =
      requestedDepartments.length > 0 ? requestedDepartments : FIELD_DEPARTMENTS;

    const supabase = createAdminClient();

    const access = await verifyCompanyAdminAccess(
      supabase,
      user.id,
      companyId,
      isGlobalAdmin
    );
    if (!access.ok) {
      return NextResponse.json(
        { error: access.reason },
        { status: access.status }
      );
    }

    // Resolve field-staff user IDs (optionally branch-scoped, optionally
    // filtered by department).
    const { data: deptRows } = await supabase
      .from('user_departments')
      .select('user_id, department')
      .eq('company_id', companyId)
      .in('department', effectiveDepartments);

    const deptByUser = new Map<string, string[]>();
    for (const r of deptRows ?? []) {
      const uid = r.user_id as string;
      const dept = r.department as string;
      if (!deptByUser.has(uid)) deptByUser.set(uid, []);
      deptByUser.get(uid)!.push(dept);
    }

    let candidateIds = Array.from(deptByUser.keys());

    if (branchId) {
      const { data: branchRows } = await supabase
        .from('user_branch_assignments')
        .select('user_id')
        .eq('company_id', companyId)
        .eq('branch_id', branchId)
        .in('user_id', candidateIds.length > 0 ? candidateIds : ['__none__']);
      const branchUserIds = new Set(
        (branchRows ?? []).map(r => r.user_id as string)
      );
      candidateIds = candidateIds.filter(id => branchUserIds.has(id));
    }

    if (candidateIds.length === 0) {
      return NextResponse.json({ members: [] });
    }

    // Profiles for display
    const { data: profiles } = await supabase
      .from('profiles')
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        avatar_url,
        uploaded_avatar_url
        `
      )
      .in('id', candidateIds);

    const profileById = new Map<string, any>();
    (profiles || []).forEach((p: any) => {
      profileById.set(p.id, {
        id: p.id,
        fullName:
          `${p.first_name || ''} ${p.last_name || ''}`.trim() ||
          p.email ||
          '',
        avatarUrl: p.avatar_url ?? null,
        uploadedAvatarUrl: p.uploaded_avatar_url ?? null,
        departments: deptByUser.get(p.id) ?? [],
      });
    });

    // Routes for the date
    const { data: routesForDate } = await supabase
      .from('routes')
      .select('id, pestpac_route_id, assigned_to')
      .eq('company_id', companyId)
      .eq('route_date', date)
      .in('assigned_to', candidateIds);

    if (!routesForDate || routesForDate.length === 0) {
      const members = candidateIds.map(uid => {
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

    const members = candidateIds.map(uid => {
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
    console.error('admin-team-route-stops fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
