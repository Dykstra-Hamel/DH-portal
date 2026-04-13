import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { getOAuthToken } from '@/lib/pestpac-auth';

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

    if (!userCompany.pestpac_employee_id) {
      return NextResponse.json(
        { error: 'PestPac employee ID not configured', needsSetup: true },
        { status: 200 }
      );
    }

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
    settingsRows?.forEach(row => {
      s[row.setting_key] = row.setting_value ?? '';
    });

    if (s.pestpac_enabled !== 'true') {
      return NextResponse.json(
        { error: 'PestPac not enabled for this company', needsSetup: true },
        { status: 200 }
      );
    }

    const {
      pestpac_api_key: apiKey,
      pestpac_tenant_id: tenantId,
      pestpac_oauth_client_id: clientId,
      pestpac_oauth_client_secret: clientSecret,
      pestpac_wwid_username: wwUsername,
      pestpac_wwid_password: wwPassword,
    } = s;

    if (!apiKey || !tenantId || !clientId || !clientSecret || !wwUsername || !wwPassword) {
      return NextResponse.json(
        { error: 'PestPac credentials incomplete', needsSetup: true },
        { status: 200 }
      );
    }

    let token: string;
    try {
      token = await getOAuthToken(clientId, clientSecret, wwUsername, wwPassword);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown OAuth error';
      console.error('FieldMap route OAuth error:', {
        companyId: userCompany.company_id,
        detail,
      });
      return NextResponse.json(
        {
          error: 'Failed to authenticate with PestPac',
          pestpac: {
            phase: 'oauth',
            detail: detail.slice(0, PESTPAC_ERROR_SNIPPET_MAX),
          },
        },
        { status: 502 }
      );
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      apikey: apiKey,
      'tenant-id': tenantId,
      'Content-Type': 'application/json',
    } as const;

    const employeeCode = String(userCompany.pestpac_employee_id); // e.g. "ALBERTB"
    const dateUs = toUsDateFromIso(date);

    // ── Step 1: Resolve employee code → numeric techId via /lookups/Employees?username= ──
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
          console.log(`FieldMap: resolved techId=${techId} for username=${employeeCode}`);
        } else {
          console.log('FieldMap: no employee match for code', employeeCode, '— got', employees.length, 'results');
        }
      } catch { /* ignore parse error */ }
    } else {
      console.log('FieldMap: /lookups/Employees status', empRes.status);
    }

    // ── Step 2: Fetch service orders for the date, filtered by techId if resolved ──
    const soPath = techId != null
      ? `/ServiceOrders?startWorkDate=${date}&endWorkDate=${date}&techId=${techId}`
      : `/ServiceOrders?startWorkDate=${date}&endWorkDate=${date}`;

    const soRes = await fetch(`${PESTPAC_BASE_URL}${soPath}`, { headers });

    if (!soRes.ok) {
      const bodySnippet = await getResponseBodySnippet(soRes);
      console.error('FieldMap ServiceOrders failed:', { path: soPath, status: soRes.status, body: bodySnippet });
      return NextResponse.json(
        { error: 'Failed to fetch service orders', detail: bodySnippet },
        { status: 502 }
      );
    }

    const soData = await soRes.json();
    const allOrders: any[] = Array.isArray(soData) ? soData : (soData?.value ?? []);

    console.log(`FieldMap: got ${allOrders.length} service orders (techId=${techId ?? 'unfiltered'})`);

    // If techId wasn't resolved, filter client-side by employee code on the Technician field
    const allStops = techId != null
      ? allOrders
      : allOrders.filter(o => matchesEmployee(o, employeeCode));

    if (allStops.length === 0) {
      return NextResponse.json({
        stops: [],
        debug: {
          requestedDate: date,
          employeeCode,
          techId,
          totalOrders: allOrders.length,
          message: techId != null
            ? 'No orders for this technician on this date.'
            : 'techId not resolved — tried client-side filter but no matches. Check employeeCode vs Technician field in PestPac.',
          sampleOrder: allOrders[0] ?? null,
        },
      });
    }

    // ── Enrich stops with client/location data ──
    // PestPac ServiceOrders use: OrderID, BillToID, LocationID,
    // ServiceInstructions, LocationInstructions, OrderInstructions
    const enrichedStops = [];

    for (const stop of allStops) {
      try {
        // PestPac primary field names first, generic fallbacks after
        const stopId = stop.OrderID ?? stop.orderID ?? stop.ServiceOrderID ?? stop.serviceOrderID ?? stop.id;

        const routeId = stop.RouteID ?? stop.routeID ?? stop.RouteId ?? stop.routeId;

        const clientId = stop.BillToID ?? stop.billToID ?? stop.ClientID ?? stop.clientID;

        const locationId = stop.LocationID ?? stop.locationID;

        let clientName =
          stop.ClientName ?? stop.clientName ??
          stop.Company ?? stop.company ??
          `${stop.FirstName ?? stop.firstName ?? ''} ${stop.LastName ?? stop.lastName ?? ''}`.trim();

        // PestPac location address fields
        let address = [
          stop.Address ?? stop.Street ?? stop.address ?? stop.street,
          stop.City ?? stop.city,
          stop.State ?? stop.state,
          stop.Zip ?? stop.zip,
        ].filter(Boolean).join(', ');

        let lat = (stop.Latitude ?? stop.latitude ?? null) as number | null;
        let lng = (stop.Longitude ?? stop.longitude ?? null) as number | null;

        // PestPac service notes: ServiceInstructions > OrderInstructions > LocationInstructions
        let serviceNotes =
          stop.ServiceInstructions ?? stop.serviceInstructions ??
          stop.OrderInstructions ?? stop.orderInstructions ??
          stop.Notes ?? stop.notes ?? '';

        // Location-specific access instructions
        let accessInstructions =
          stop.LocationInstructions ?? stop.locationInstructions ??
          stop.AccessInstructions ?? stop.accessInstructions ?? '';

        if (clientId && !clientName) {
          const res = await fetch(`${PESTPAC_BASE_URL}/BillTos/${encodeURIComponent(String(clientId))}`, { headers });
          if (res.ok) {
            const c = await res.json();
            clientName =
              c.CompanyName ?? c.companyName ??
              `${c.FirstName ?? c.firstName ?? ''} ${c.LastName ?? c.lastName ?? ''}`.trim();
          }
        }

        if (locationId && (!address || lat == null || lng == null)) {
          const res = await fetch(`${PESTPAC_BASE_URL}/Locations/${encodeURIComponent(String(locationId))}`, { headers });
          if (res.ok) {
            const loc = await res.json();
            address = address || [
              loc.Address ?? loc.Street ?? loc.address ?? loc.street,
              loc.City ?? loc.city,
              loc.State ?? loc.state,
              loc.Zip ?? loc.zip,
            ].filter(Boolean).join(', ');
            lat = lat ?? (loc.Latitude ?? loc.latitude ?? null);
            lng = lng ?? (loc.Longitude ?? loc.longitude ?? null);
            serviceNotes = serviceNotes || (loc.ServiceInstructions ?? loc.serviceInstructions ?? '');
            accessInstructions = accessInstructions || (loc.LocationInstructions ?? loc.locationInstructions ?? '');
          }
        }

        enrichedStops.push({
          stopId: stopId ? String(stopId) : null,
          routeId: routeId ? String(routeId) : null,
          clientId: clientId ? String(clientId) : null,
          locationId: locationId ? String(locationId) : null,
          clientName: clientName ? toTitleCase(clientName) : clientName,
          address,
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
          inspectionStatus: 'not_started' as 'not_started' | 'in_progress' | 'done',
          leadId: null as string | null,
        });
      } catch {
        // Skip problematic rows
      }
    }

    // ── Attach inspection status from local leads ──
    const stopIds = enrichedStops
      .map(s => s.stopId)
      .filter((id): id is string => Boolean(id));

    if (stopIds.length > 0) {
      const { data: matchedLeads } = await adminSupabase
        .from('leads')
        .select('id, pestpac_stop_id, lead_status')
        .eq('company_id', userCompany.company_id)
        .in('pestpac_stop_id', stopIds);

      const DONE_STATUSES = new Set(['quoted', 'scheduling', 'won']);
      const leadsByStopId: Record<string, { leadId: string; leadStatus: string }> = {};
      (matchedLeads ?? []).forEach(lead => {
        if (lead.pestpac_stop_id) {
          leadsByStopId[lead.pestpac_stop_id] = { leadId: lead.id, leadStatus: lead.lead_status };
        }
      });

      for (const stop of enrichedStops) {
        const linked = stop.stopId ? leadsByStopId[stop.stopId] : undefined;
        if (!linked) {
          stop.inspectionStatus = 'not_started';
          stop.leadId = null;
        } else if (DONE_STATUSES.has(linked.leadStatus)) {
          stop.inspectionStatus = 'done';
          stop.leadId = linked.leadId;
        } else {
          stop.inspectionStatus = 'in_progress';
          stop.leadId = linked.leadId;
        }
      }
    } else {
      for (const stop of enrichedStops) {
        stop.inspectionStatus = 'not_started';
        stop.leadId = null;
      }
    }

    enrichedStops.sort((a, b) => {
      if (!a.scheduledTime) return 1;
      if (!b.scheduledTime) return -1;
      return String(a.scheduledTime).localeCompare(String(b.scheduledTime));
    });

    return NextResponse.json({
      stops: enrichedStops,
      debug: {
        requestedDate: date,
        dateUs,
        employeeCode,
        techId,
        stopsFound: allStops.length,
        sampleRawStop: allStops[0] ?? null,
      },
    });
  } catch (error) {
    console.error('FieldMap route fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
