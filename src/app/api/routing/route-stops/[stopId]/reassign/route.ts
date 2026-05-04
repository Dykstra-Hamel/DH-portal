import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  verifyAuth,
  isAuthorizedAdmin,
  isCompanyAdmin,
} from '@/lib/auth-helpers';

// PATCH /api/routing/route-stops/[stopId]/reassign
// Body: { targetUserId: string; date: string /* YYYY-MM-DD */ }
//
// Moves a route stop to the target user's route for the given date.
// If the target has no route on that date, a new route is auto-created.
// Enforces a same-department rule (technician → technician, inspector →
// inspector).
//
// Permission: caller must be a global admin, a company owner/admin/manager,
// OR the org-chart manager of the source route's assignee.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ stopId: string }> }
) {
  try {
    const { stopId } = await params;
    const { user, error: authError } = await verifyAuth(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const targetUserId: string | undefined = body?.targetUserId;
    const date: string | undefined = body?.date;

    if (!targetUserId || !date) {
      return NextResponse.json(
        { error: 'targetUserId and date are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: stopRow } = await supabase
      .from('route_stops')
      .select('id, route_id, stop_order, company_id')
      .eq('id', stopId)
      .single();

    if (!stopRow) {
      return NextResponse.json({ error: 'Stop not found' }, { status: 404 });
    }

    const { data: sourceRoute } = await supabase
      .from('routes')
      .select('id, company_id, route_date, assigned_to, route_type')
      .eq('id', stopRow.route_id)
      .single();

    if (!sourceRoute) {
      return NextResponse.json({ error: 'Source route not found' }, { status: 404 });
    }

    // Authorize
    const globalAdmin = await isAuthorizedAdmin(user);
    const companyAdmin =
      !globalAdmin && (await isCompanyAdmin(user.id, sourceRoute.company_id));

    let isOrgChartManager = false;
    if (!globalAdmin && !companyAdmin && sourceRoute.assigned_to) {
      const { data: managedRow } = await supabase
        .from('user_companies')
        .select('user_id')
        .eq('user_id', sourceRoute.assigned_to)
        .eq('company_id', sourceRoute.company_id)
        .eq('manager_user_id', user.id)
        .maybeSingle();
      isOrgChartManager = !!managedRow;
    }

    if (!globalAdmin && !companyAdmin && !isOrgChartManager) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Target user must belong to the same company
    const { data: targetCompany } = await supabase
      .from('user_companies')
      .select('user_id')
      .eq('user_id', targetUserId)
      .eq('company_id', sourceRoute.company_id)
      .maybeSingle();

    if (!targetCompany) {
      return NextResponse.json(
        { error: 'Target user is not a member of this company' },
        { status: 400 }
      );
    }

    // Same-department check (technician/inspector)
    const FIELD_DEPTS = ['technician', 'inspector'];

    const { data: sourceDeptRows } = await supabase
      .from('user_departments')
      .select('department')
      .eq('user_id', sourceRoute.assigned_to)
      .eq('company_id', sourceRoute.company_id)
      .in('department', FIELD_DEPTS);

    const { data: targetDeptRows } = await supabase
      .from('user_departments')
      .select('department')
      .eq('user_id', targetUserId)
      .eq('company_id', sourceRoute.company_id)
      .in('department', FIELD_DEPTS);

    const sourceDepts = new Set(
      (sourceDeptRows ?? []).map((r: any) => r.department)
    );
    const targetDepts = new Set(
      (targetDeptRows ?? []).map((r: any) => r.department)
    );

    const overlap = [...sourceDepts].some(d => targetDepts.has(d));
    if (sourceDepts.size === 0 || targetDepts.size === 0 || !overlap) {
      return NextResponse.json(
        {
          error:
            'Target user is not in the same department as the current assignee',
        },
        { status: 400 }
      );
    }

    if (targetUserId === sourceRoute.assigned_to) {
      return NextResponse.json(
        { error: 'Stop is already assigned to that user' },
        { status: 400 }
      );
    }

    // Find or create target route for the date
    let { data: targetRoute } = await supabase
      .from('routes')
      .select('id')
      .eq('company_id', sourceRoute.company_id)
      .eq('route_date', date)
      .eq('assigned_to', targetUserId)
      .maybeSingle();

    if (!targetRoute) {
      const { data: created, error: createErr } = await supabase
        .from('routes')
        .insert({
          company_id: sourceRoute.company_id,
          route_date: date,
          assigned_to: targetUserId,
          route_type: sourceRoute.route_type,
          status: 'scheduled',
          created_by: user.id,
        })
        .select('id')
        .single();

      if (createErr || !created) {
        console.error('[reassign] route insert error:', createErr);
        return NextResponse.json(
          {
            error: 'Failed to create target route',
            details: createErr?.message,
          },
          { status: 500 }
        );
      }
      targetRoute = created;
    }

    // Compute next stop_order in target route
    const { data: lastStop } = await supabase
      .from('route_stops')
      .select('stop_order')
      .eq('route_id', targetRoute.id)
      .order('stop_order', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextOrder =
      lastStop && typeof lastStop.stop_order === 'number'
        ? lastStop.stop_order + 1
        : 0;

    // Move the stop. Set `manually_reassigned = true` so the periodic
    // PestPac sync (lib/pestpac-route-sync.ts) preserves the new route_id
    // and stop_order on subsequent runs instead of reverting them.
    const { data: updatedStop, error: updateErr } = await supabase
      .from('route_stops')
      .update({
        route_id: targetRoute.id,
        stop_order: nextOrder,
        manually_reassigned: true,
      })
      .eq('id', stopId)
      .select()
      .single();

    if (updateErr) {
      console.error('[reassign] route_stops update error:', updateErr);
      return NextResponse.json(
        { error: 'Failed to move stop', details: updateErr.message },
        { status: 500 }
      );
    }

    // Re-sequence remaining stops in source route
    const { data: remainingStops } = await supabase
      .from('route_stops')
      .select('id, stop_order')
      .eq('route_id', sourceRoute.id)
      .gt('stop_order', stopRow.stop_order)
      .order('stop_order', { ascending: true });

    if (remainingStops && remainingStops.length > 0) {
      await Promise.all(
        remainingStops.map((s: any, i: number) =>
          supabase
            .from('route_stops')
            .update({ stop_order: stopRow.stop_order + i })
            .eq('id', s.id)
        )
      );
    }

    return NextResponse.json({
      success: true,
      stop: updatedStop,
      targetRouteId: targetRoute.id,
    });
  } catch (error) {
    console.error('reassign route stop error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
