import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { getOAuthToken } from '@/lib/pestpac-auth';
import { syncPestPacRoute } from '@/lib/pestpac-route-sync';

const PESTPAC_BASE_URL = 'https://api.workwave.com/pestpac/v1';
const PESTPAC_ERROR_SNIPPET_MAX = 500;

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

async function getResponseBodySnippet(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, PESTPAC_ERROR_SNIPPET_MAX);
  } catch {
    return '';
  }
}

function parseIsoDateUTC(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toIsoDateUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toUsDateFromIso(isoDate: string): string {
  const parsed = parseIsoDateUTC(isoDate);
  if (!parsed) return isoDate;

  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  const year = String(parsed.getUTCFullYear());
  return `${month}/${day}/${year}`;
}

function toIsoStartOfDayUtc(isoDate: string): string {
  const parsed = parseIsoDateUTC(isoDate);
  if (!parsed) return `${isoDate}T00:00:00.000Z`;
  parsed.setUTCHours(0, 0, 0, 0);
  return parsed.toISOString();
}

function toIsoEndOfDayUtc(isoDate: string): string {
  const parsed = parseIsoDateUTC(isoDate);
  if (!parsed) return `${isoDate}T23:59:59.999Z`;
  parsed.setUTCHours(23, 59, 59, 999);
  return parsed.toISOString();
}

function addDaysUTC(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function getWeekRange(dateStr: string): { weekStart: string; weekEnd: string } {
  const anchor = parseIsoDateUTC(dateStr) ?? new Date();
  const day = anchor.getUTCDay(); // Sunday=0 ... Saturday=6
  const start = addDaysUTC(anchor, -day);
  const end = addDaysUTC(start, 6);
  return {
    weekStart: toIsoDateUTC(start),
    weekEnd: toIsoDateUTC(end),
  };
}

function normalizeRecordDate(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;

    const isoMatch = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];

    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  return null;
}

function extractRecordDate(record: any): string | null {
  const candidates = [
    record?.date,
    record?.Date,
    record?.serviceDate,
    record?.ServiceDate,
    record?.scheduledDate,
    record?.ScheduledDate,
    record?.scheduledStart,
    record?.ScheduledStart,
    record?.startDate,
    record?.StartDate,
    record?.appointmentDate,
    record?.AppointmentDate,
    record?.serviceOrderDate,
    record?.ServiceOrderDate,
    record?.orderDate,
    record?.OrderDate,
    record?.workDate,
    record?.WorkDate,
  ];

  for (const candidate of candidates) {
    const normalized = normalizeRecordDate(candidate);
    if (normalized) return normalized;
  }

  return null;
}

function normalizeComparable(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function matchesEmployee(record: any, employeeId: string): boolean {
  const target = normalizeComparable(employeeId);
  if (!target) return false;

  const arrayCandidates = [
    record?.technicians,
    record?.Technicians,
    record?.employees,
    record?.Employees,
    record?.assignees,
    record?.Assignees,
    record?.employeeAssignments,
    record?.EmployeeAssignments,
  ];

  for (const arr of arrayCandidates) {
    if (!Array.isArray(arr)) continue;

    const hasMatch = arr.some(item => {
      const scalarCandidates = [
        item?.employeeID,
        item?.EmployeeID,
        item?.employeeCode,
        item?.EmployeeCode,
        item?.technicianID,
        item?.TechnicianID,
        item?.assignedEmployeeID,
        item?.AssignedEmployeeID,
        item?.userID,
        item?.UserID,
        item?.username,
        item?.Username,
        item?.userName,
        item?.UserName,
        item?.code,
        item?.Code,
        item?.id,
        item?.ID,
      ];

      return scalarCandidates.some(candidate => normalizeComparable(candidate) === target);
    });

    if (hasMatch) return true;
  }

  const scalarCandidates = [
    record?.employeeID,
    record?.EmployeeID,
    record?.employeeCode,
    record?.EmployeeCode,
    record?.technicianID,
    record?.TechnicianID,
    record?.assignedEmployeeID,
    record?.AssignedEmployeeID,
    record?.inspectorID,
    record?.InspectorID,
    record?.userID,
    record?.UserID,
    record?.username,
    record?.Username,
    record?.userName,
    record?.UserName,
    record?.code,
    record?.Code,
    record?.employee?.employeeID,
    record?.employee?.EmployeeID,
    record?.employee?.username,
    record?.employee?.Username,
    record?.technician?.employeeID,
    record?.technician?.EmployeeID,
    record?.technician?.username,
    record?.technician?.Username,
  ];

  return scalarCandidates.some(candidate => normalizeComparable(candidate) === target);
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

// ── PestPac fetch + sync (used for background refresh and first-ever load) ──

interface UserCompany {
  company_id: string;
  pestpac_employee_id: string | null;
}

interface EnrichedStop {
  stopId: string | null;
  routeId: string | null;
  clientId: string | null;
  locationId: string | null;
  clientName: string | null;
  phone: string | null;
  email: string | null;
  address: string;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZip: string | null;
  scheduledTime: string | null;
  serviceStatus: string;
  serviceType: string;
  serviceNotes: string;
  accessInstructions: string;
  lat: number | null;
  lng: number | null;
  inspectionStatus: 'not_started' | 'in_progress' | 'done';
  leadId: string | null;
  leadStatus?: string | null;
  referredToSales?: boolean;
  routeStopId?: string | null;
  housePhotoUrl?: string | null;
  lineItems?: any[] | null;
  pestpacRawData?: any;
}

async function fetchAndSyncFromPestPac(
  adminSupabase: ReturnType<typeof createAdminClient>,
  userCompany: UserCompany,
  date: string,
  userId: string
): Promise<EnrichedStop[] | null> {
  if (!userCompany.pestpac_employee_id) return null;

  const { data: settingsRows } = await adminSupabase
    .from('company_settings')
    .select('setting_key, setting_value')
    .eq('company_id', userCompany.company_id)
    .in('setting_key', [
      'pestpac_enabled',
      'pestpac_api_key',
      'pestpac_tenant_id',
      'pestpac_oauth_client_id',
      'pestpac_oauth_client_secret',
      'pestpac_wwid_username',
      'pestpac_wwid_password',
    ]);

  const s: Record<string, string> = {};
  settingsRows?.forEach((row: any) => { s[row.setting_key] = row.setting_value ?? ''; });

  if (s.pestpac_enabled !== 'true') return null;

  const {
    pestpac_api_key: apiKey,
    pestpac_tenant_id: tenantId,
    pestpac_oauth_client_id: clientId,
    pestpac_oauth_client_secret: clientSecret,
    pestpac_wwid_username: wwUsername,
    pestpac_wwid_password: wwPassword,
  } = s;

  if (!apiKey || !tenantId || !clientId || !clientSecret || !wwUsername || !wwPassword) return null;

  let token: string;
  try {
    token = await getOAuthToken(clientId, clientSecret, wwUsername, wwPassword);
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Unknown OAuth error';
    console.error('FieldMap route OAuth error:', { companyId: userCompany.company_id, detail });
    return null;
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    apikey: apiKey,
    'tenant-id': tenantId,
    'Content-Type': 'application/json',
  } as const;

  const employeeCode = String(userCompany.pestpac_employee_id);

  // Step 1: Resolve employee code → numeric techId
  let techId: number | null = null;
  const empRes = await fetch(
    `${PESTPAC_BASE_URL}/lookups/Employees?username=${encodeURIComponent(employeeCode)}`,
    { headers }
  );
  if (empRes.ok) {
    try {
      const empData = await empRes.json();
      const employees: any[] = Array.isArray(empData) ? empData : (empData?.value ?? []);
      const match = employees.find(e =>
        String(e.Username ?? e.username ?? e.UserName ?? '').toLowerCase() === employeeCode.toLowerCase()
      );
      if (match) {
        const rawId = match.TechnicianID ?? match.technicianID ?? match.TechID ?? match.techID ??
          match.EmployeeID ?? match.employeeID ?? match.ID ?? match.id;
        techId = rawId != null ? Number(rawId) : null;
      }
    } catch { /* ignore parse error */ }
  }

  // Step 2: Fetch service orders for the date
  const soPath = techId != null
    ? `/ServiceOrders?startWorkDate=${date}&endWorkDate=${date}&techId=${techId}`
    : `/ServiceOrders?startWorkDate=${date}&endWorkDate=${date}`;

  const soRes = await fetch(`${PESTPAC_BASE_URL}${soPath}`, { headers });

  if (!soRes.ok) {
    console.error('FieldMap ServiceOrders failed:', { path: soPath, status: soRes.status });
    return null;
  }

  const soData = await soRes.json();
  const allOrders: any[] = Array.isArray(soData) ? soData : (soData?.value ?? []);

  const allStops = techId != null
    ? allOrders
    : allOrders.filter(o => matchesEmployee(o, employeeCode));

  if (allStops.length === 0) return [];

  // Enrich stops with client/location data
  const enrichedStops: EnrichedStop[] = [];

  for (const stop of allStops) {
    try {
      const stopId = stop.OrderID ?? stop.orderID ?? stop.ServiceOrderID ?? stop.serviceOrderID ?? stop.id;
      const routeId = stop.RouteID ?? stop.routeID ?? stop.RouteId ?? stop.routeId;
      const stopClientId = stop.BillToID ?? stop.billToID ?? stop.ClientID ?? stop.clientID;
      const locationId = stop.LocationID ?? stop.locationID;

      let clientName =
        stop.ClientName ?? stop.clientName ??
        stop.Company ?? stop.company ??
        `${stop.FirstName ?? stop.firstName ?? ''} ${stop.LastName ?? stop.lastName ?? ''}`.trim();

      let addressStreet = stop.Address ?? stop.Street ?? stop.address ?? stop.street ?? '';
      let addressCity   = stop.City  ?? stop.city  ?? '';
      let addressState  = stop.State ?? stop.state ?? '';
      let addressZip    = stop.Zip   ?? stop.zip   ?? '';
      let address = [addressStreet, addressCity, addressState, addressZip].filter(Boolean).join(', ');
      let lat = (stop.Latitude ?? stop.latitude ?? null) as number | null;
      let lng = (stop.Longitude ?? stop.longitude ?? null) as number | null;
      let phone: string | null = stop.Phone ?? stop.phone ?? null;
      let email: string | null = stop.Email ?? stop.email ?? null;
      let serviceNotes =
        stop.ServiceInstructions ?? stop.serviceInstructions ??
        stop.OrderInstructions ?? stop.orderInstructions ??
        stop.Notes ?? stop.notes ?? '';
      let accessInstructions =
        stop.LocationInstructions ?? stop.locationInstructions ??
        stop.AccessInstructions ?? stop.accessInstructions ?? '';

      if (stopClientId && !clientName) {
        const res = await fetch(`${PESTPAC_BASE_URL}/BillTos/${encodeURIComponent(String(stopClientId))}`, { headers });
        if (res.ok) {
          const c = await res.json();
          clientName =
            c.CompanyName ?? c.companyName ??
            `${c.FirstName ?? c.firstName ?? ''} ${c.LastName ?? c.lastName ?? ''}`.trim();
        }
      }

      let loc: any;
      if (locationId) {
        const res = await fetch(`${PESTPAC_BASE_URL}/Locations/${encodeURIComponent(String(locationId))}`, { headers });
        if (res.ok) {
          loc = await res.json();
          if (!addressStreet) addressStreet = loc.Address ?? loc.Street ?? loc.address ?? loc.street ?? '';
          if (!addressCity)   addressCity   = loc.City  ?? loc.city  ?? '';
          if (!addressState)  addressState  = loc.State ?? loc.state ?? '';
          if (!addressZip)    addressZip    = loc.Zip   ?? loc.zip   ?? '';
          address = address || [addressStreet, addressCity, addressState, addressZip].filter(Boolean).join(', ');
          lat = lat ?? (loc.Latitude ?? loc.latitude ?? null);
          lng = lng ?? (loc.Longitude ?? loc.longitude ?? null);
          phone = phone ?? (loc.Phone ?? loc.phone ?? null);
          email = email ?? (loc.Email ?? loc.email ?? null);
          if (!clientName) {
            const locName = `${loc.FirstName ?? loc.firstName ?? ''} ${loc.LastName ?? loc.lastName ?? ''}`.trim();
            clientName = loc.Company ?? loc.company ?? locName;
          }
          serviceNotes = serviceNotes || (loc.ServiceInstructions ?? loc.serviceInstructions ?? '');
          accessInstructions = accessInstructions || (loc.LocationInstructions ?? loc.locationInstructions ?? '');
        }
      }

      enrichedStops.push({
        stopId: stopId ? String(stopId) : null,
        routeId: routeId ? String(routeId) : null,
        clientId: stopClientId ? String(stopClientId) : null,
        locationId: locationId ? String(locationId) : null,
        clientName: clientName ? toTitleCase(clientName) : clientName,
        phone: phone ? String(phone).trim() || null : null,
        email: email ? String(email).trim() || null : null,
        address,
        addressStreet: addressStreet || null,
        addressCity: addressCity || null,
        addressState: addressState || null,
        addressZip: addressZip || null,
        scheduledTime:
          stop.WorkDate ?? stop.workDate ??
          stop.ServiceDate ?? stop.serviceDate ??
          stop.ScheduledDate ?? stop.scheduledDate ??
          stop.StartTime ?? stop.startTime ?? null,
        serviceStatus: stop.Status ?? stop.status ?? stop.ServiceStatus ?? stop.serviceStatus ?? 'Scheduled',
        serviceType:
          stop.ServiceType ?? stop.serviceType ??
          stop.ServiceTypeName ?? stop.serviceTypeName ??
          stop.OrderType ?? stop.orderType ?? '',
        serviceNotes,
        accessInstructions,
        lat,
        lng,
        inspectionStatus: 'not_started',
        leadId: null,
        leadStatus: null,
        housePhotoUrl: null,
        lineItems: (stop.lineItems ?? stop.LineItems ?? stop.lineitem ?? stop.LineItem ?? null) as any[] | null,
        pestpacRawData: {
          ...stop,
          ...(loc != null ? {
            LocationType: loc.LocationType ?? loc.locationType ?? null,
            LocationNotes: loc.Notes ?? loc.notes ?? null,
          } : {}),
        },
      });
    } catch {
      // Skip problematic rows
    }
  }

  // Fire-and-forget DB sync
  syncPestPacRoute({
    adminSupabase,
    companyId: userCompany.company_id,
    routeDate: date,
    assignedUserId: userId,
    stops: enrichedStops,
  }).catch(() => {});

  return enrichedStops;
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
    const { weekStart, weekEnd } = getWeekRange(date);

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
