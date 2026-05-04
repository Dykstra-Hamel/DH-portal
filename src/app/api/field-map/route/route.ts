import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { fetchAndSyncFromPestPac } from '@/lib/pestpac-route-sync';
import {
  mapDbStopToRouteStop,
  attachInspectionStatus,
  ROUTE_STOPS_SELECT,
} from '@/lib/field-map/route-stops';

function toIsoDateUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ── GET handler ─────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') ?? toIsoDateUTC(new Date());
    const requestedCompanyId = searchParams.get('companyId');

    const adminSupabase = createAdminClient();

    let companyQuery = adminSupabase
      .from('user_companies')
      .select('company_id, pestpac_employee_id')
      .eq('user_id', user.id);

    if (requestedCompanyId) {
      companyQuery = companyQuery.eq('company_id', requestedCompanyId);
    } else {
      companyQuery = companyQuery.eq('is_primary', true);
    }

    const { data: userCompany } = await companyQuery.single();

    if (!userCompany) {
      return NextResponse.json({ error: 'No company found' }, { status: 404 });
    }

    // ── DB-first: return cached stops immediately ──
    const { data: routesForDate } = await adminSupabase
      .from('routes')
      .select('id, pestpac_route_id')
      .eq('company_id', userCompany.company_id)
      .eq('route_date', date)
      .eq('assigned_to', user.id);

    if (routesForDate && routesForDate.length > 0) {
      const routeIds = routesForDate.map((r: any) => r.id);
      const routeMap = Object.fromEntries(routesForDate.map((r: any) => [r.id, r]));

      const { data: stopsData, error: stopsError } = await adminSupabase
        .from('route_stops')
        .select(ROUTE_STOPS_SELECT)
        .in('route_id', routeIds)
        .order('stop_order');

      if (stopsError) {
        console.error('[field-map/route] route_stops query error, falling through to PestPac:', stopsError.message);
      } else {
        const mappedStops = (stopsData ?? []).map((stop: any) =>
          mapDbStopToRouteStop(stop, routeMap)
        );

        await attachInspectionStatus(adminSupabase, userCompany.company_id, mappedStops);

        // Background refresh from PestPac (fire-and-forget, only if configured)
        if (userCompany.pestpac_employee_id) {
          fetchAndSyncFromPestPac(adminSupabase, userCompany, date, user.id)
            .catch(() => {});
        }

        return NextResponse.json({ stops: mappedStops });
      }
    }

    // ── DB empty: fall through to synchronous PestPac fetch ──

    if (!userCompany.pestpac_employee_id) {
      return NextResponse.json(
        { error: 'PestPac employee ID not configured', needsSetup: true },
        { status: 200 }
      );
    }

    const pestpacStops = await fetchAndSyncFromPestPac(adminSupabase, userCompany, date, user.id);

    if (pestpacStops === null) {
      return NextResponse.json(
        { error: 'PestPac not configured or credentials incomplete', needsSetup: true },
        { status: 200 }
      );
    }

    if (pestpacStops.length === 0) {
      return NextResponse.json({ stops: [] });
    }

    // Attach inspection status to PestPac-fresh stops
    const stopIds = pestpacStops
      .map(s => s.stopId)
      .filter((id): id is string => Boolean(id));

    if (stopIds.length > 0) {
      // After sync, read referred_to_sales, lead_id, and DB id from route_stops
      const { data: syncedStops } = await adminSupabase
        .from('route_stops')
        .select('id, pestpac_stop_id, lead_id, referred_to_sales')
        .eq('company_id', userCompany.company_id)
        .in('pestpac_stop_id', stopIds);

      const stopDataMap: Record<string, { id: string; leadId: string | null; referredToSales: boolean }> = {};
      (syncedStops ?? []).forEach((row: any) => {
        if (row.pestpac_stop_id) {
          stopDataMap[row.pestpac_stop_id] = {
            id: row.id,
            leadId: row.lead_id ?? null,
            referredToSales: !!row.referred_to_sales,
          };
        }
      });

      const linkedLeadIds = Object.values(stopDataMap)
        .map(d => d.leadId)
        .filter(Boolean) as string[];
      const leadsById: Record<string, string> = {};
      const photosByLeadId: Record<string, string | null> = {};
      if (linkedLeadIds.length > 0) {
        const { data: leadsData } = await adminSupabase
          .from('leads')
          .select('id, lead_status, map_plot_data')
          .in('id', linkedLeadIds);
        (leadsData ?? []).forEach((l: any) => {
          leadsById[l.id] = l.lead_status;
          const photos = l.map_plot_data?.housePhotos;
          photosByLeadId[l.id] =
            Array.isArray(photos) && photos.length > 0 ? photos[0] : null;
        });
      }

      const DONE_STATUSES = new Set(['quoted', 'scheduling', 'won']);
      for (const stop of pestpacStops) {
        const dbStop = stop.stopId ? stopDataMap[stop.stopId] : undefined;
        stop.referredToSales = dbStop?.referredToSales ?? false;
        stop.routeStopId = dbStop?.id ?? null;
        const leadId = dbStop?.leadId;
        if (!leadId) {
          stop.inspectionStatus = 'not_started';
          stop.leadId = null;
          stop.housePhotoUrl = null;
        } else {
          const leadStatus = leadsById[leadId];
          stop.leadId = leadId;
          stop.leadStatus = leadStatus ?? null;
          stop.housePhotoUrl = photosByLeadId[leadId] ?? null;
          stop.inspectionStatus = DONE_STATUSES.has(leadStatus) ? 'done' : 'in_progress';
        }
      }
    }

    pestpacStops.sort((a, b) => {
      if (!a.scheduledTime) return 1;
      if (!b.scheduledTime) return -1;
      return String(a.scheduledTime).localeCompare(String(b.scheduledTime));
    });

    return NextResponse.json({ stops: pestpacStops });
  } catch (error) {
    console.error('FieldMap route fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
