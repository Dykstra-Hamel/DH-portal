import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { fetchAndSyncFromPestPac } from '@/lib/pestpac-route-sync';

function toIsoDateUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// ── DB-first helpers ────────────────────────────────────────────────────────

const DB_STATUS_DISPLAY: Record<string, string> = {
  pending:      'Scheduled',
  en_route:     'En Route',
  arrived:      'Arrived',
  in_progress:  'In Progress',
  completed:    'Completed',
  skipped:      'Cancelled',
  rescheduled:  'Rescheduled',
};

function mapDbStopToRouteStop(stop: any, routeMap: Record<string, any>) {
  const route = routeMap[stop.route_id];
  const customer = Array.isArray(stop.customers) ? stop.customers[0] : stop.customers;
  const addr = Array.isArray(stop.service_addresses) ? stop.service_addresses[0] : stop.service_addresses;

  const clientName =
    [customer?.first_name, customer?.last_name].filter(Boolean).join(' ') || 'Unknown';

  const addressDisplay =
    [addr?.street_address, addr?.city, addr?.state, addr?.zip_code].filter(Boolean).join(', ') ||
    stop.address_display ||
    '';

  return {
    stopId:              stop.pestpac_stop_id ?? stop.id,
    routeId:             route?.pestpac_route_id ?? stop.route_id,
    clientId:            customer?.pestpac_client_id ?? undefined,
    locationId:          addr?.pestpac_location_id ?? undefined,
    clientName,
    address:             addressDisplay,
    scheduledTime:       stop.scheduled_arrival ?? null,
    serviceStatus:       DB_STATUS_DISPLAY[stop.status] ?? stop.status ?? 'Scheduled',
    serviceType:         stop.service_type ?? '',
    serviceNotes:        stop.notes ?? undefined,
    accessInstructions:  stop.access_instructions ?? undefined,
    lat:                 stop.lat ?? null,
    lng:                 stop.lng ?? null,
    inspectionStatus:    'not_started' as 'not_started' | 'in_progress' | 'done',
    leadId:              (stop.lead_id as string | null) ?? null,
    leadStatus:          null as string | null,
    referredToSales:     !!(stop.referred_to_sales),
    routeStopId:         stop.id as string,
    housePhotoUrl:       null as string | null,
  };
}

async function attachInspectionStatus(
  adminSupabase: ReturnType<typeof createAdminClient>,
  companyId: string,
  stops: ReturnType<typeof mapDbStopToRouteStop>[]
): Promise<void> {
  const leadIds = stops.map(s => s.leadId).filter(Boolean) as string[];

  const DONE_STATUSES = new Set(['quoted', 'scheduling', 'won']);

  if (leadIds.length === 0) {
    for (const stop of stops) stop.inspectionStatus = 'not_started';
    return;
  }

  const { data: matchedLeads } = await adminSupabase
    .from('leads')
    .select('id, lead_status, map_plot_data')
    .eq('company_id', companyId)
    .in('id', leadIds);

  const leadsById: Record<string, string> = {};
  const photosByLeadId: Record<string, string | null> = {};
  (matchedLeads ?? []).forEach((lead: any) => {
    leadsById[lead.id] = lead.lead_status;
    const photos = lead.map_plot_data?.housePhotos;
    photosByLeadId[lead.id] =
      Array.isArray(photos) && photos.length > 0 ? photos[0] : null;
  });

  for (const stop of stops) {
    if (!stop.leadId || !(stop.leadId in leadsById)) {
      stop.inspectionStatus = 'not_started';
      stop.leadId = null;
      stop.housePhotoUrl = null;
    } else {
      const leadStatus = leadsById[stop.leadId];
      stop.leadStatus = leadStatus ?? null;
      stop.housePhotoUrl = photosByLeadId[stop.leadId] ?? null;
      if (DONE_STATUSES.has(leadStatus)) {
        stop.inspectionStatus = 'done';
      } else {
        stop.inspectionStatus = 'in_progress';
      }
    }
  }
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
        .select(`
          id, route_id, stop_order, pestpac_stop_id, lead_id, referred_to_sales, service_type,
          notes, access_instructions, scheduled_arrival, status, lat, lng, address_display,
          customers ( id, pestpac_client_id, first_name, last_name ),
          service_addresses ( id, pestpac_location_id, street_address, city, state, zip_code )
        `)
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
