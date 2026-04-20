import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api-utils';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { getOAuthToken } from '@/lib/pestpac-auth';

const PESTPAC_BASE_URL = 'https://api.workwave.com/pestpac/v1';

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

async function fetchWithPathFallback(
  paths: string[],
  headers: Record<string, string>,
  retryOnStatuses: number[] = [404]
): Promise<{ response: Response; path: string }> {
  let last: { response: Response; path: string } | null = null;

  for (const path of paths) {
    const response = await fetch(`${PESTPAC_BASE_URL}${path}`, { headers });
    const current = { response, path };
    last = current;
    if (!retryOnStatuses.includes(response.status)) return current;
  }

  if (last) return last;
  throw new Error('No fallback paths provided');
}

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stopId: string }> }
) {
  try {
    const { stopId } = await params;
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) return authResult;
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const requestedCompanyId = searchParams.get('companyId');

    const adminSupabase = createAdminClient();

    let companyQuery = adminSupabase
      .from('user_companies')
      .select('company_id')
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

    // ── DB-first lookup ────────────────────────────────────────────────────
    const { data: dbStop } = await adminSupabase
      .from('route_stops')
      .select(`
        id, service_type, notes, access_instructions,
        scheduled_arrival, status, lat, lng,
        pestpac_stop_id, estimated_duration, lead_id,
        customers ( first_name, last_name, email, phone, pestpac_client_id ),
        service_addresses ( street_address, city, state, zip_code )
      `)
      .eq('company_id', userCompany.company_id)
      .eq('pestpac_stop_id', stopId)
      .maybeSingle();

    if (dbStop) {
      // Attempt to read new columns separately — they may not exist before migration is applied.
      // If the query fails (column not found), extra will be null and we fall back to empty defaults.
      let lineItems: any[] | null = null;
      let raw: any = {};
      const { data: extra } = await adminSupabase
        .from('route_stops')
        .select('line_items, pestpac_raw_data')
        .eq('id', (dbStop as any).id)
        .maybeSingle();
      if (extra) {
        lineItems = (extra as any).line_items ?? null;
        raw = (extra as any).pestpac_raw_data ?? {};
      }

      const cust = (dbStop as any).customers ?? {};
      const addr = (dbStop as any).service_addresses ?? {};
      return NextResponse.json({
        routeStopId: dbStop.id,
        leadId: (dbStop as any).lead_id ?? null,
        stopId: dbStop.pestpac_stop_id ?? stopId,
        routeId: routeId ?? '',
        clientId: cust.pestpac_client_id ?? null,
        locationId: null,
        clientName: [cust.first_name, cust.last_name].filter(Boolean).join(' ') || null,
        clientEmail: cust.email ?? '',
        clientPhone: cust.phone ?? '',
        address: [addr.street_address, addr.city, addr.state, addr.zip_code].filter(Boolean).join(', '),
        street: addr.street_address ?? '',
        city: addr.city ?? '',
        state: addr.state ?? '',
        zip: addr.zip_code ?? '',
        lat: dbStop.lat ?? null,
        lng: dbStop.lng ?? null,
        scheduledTime: dbStop.scheduled_arrival ?? null,
        serviceDate: null,
        timeIn: null,
        timeOut: null,
        serviceStatus: dbStop.status ?? 'Scheduled',
        serviceType: dbStop.service_type ?? '',
        serviceNotes: dbStop.notes ?? '',
        accessInstructions: dbStop.access_instructions ?? '',
        technician: '',
        technicianId: null,
        duration: dbStop.estimated_duration ?? null,
        serviceClass: raw.ServiceClass ?? raw.serviceClass ?? raw.ServiceClassName ?? raw.serviceClassName ?? '',
        programCode: raw.ProgramCode ?? raw.programCode ?? raw.Program ?? raw.program ?? '',
        locationNotes: raw.LocationNotes ?? raw.locationNotes ?? '',
        amount: null,
        balanceDue: null,
        accountNumber: '',
        lastServiceDate: null,
        locationType: raw.LocationType ?? raw.locationType ?? raw.Type ?? '',
        branch: raw.Branch ?? raw.branch ?? raw.BranchCode ?? raw.branchCode ?? raw.BranchName ?? raw.branchName ?? '',
        services: Array.isArray(lineItems) ? lineItems : [],
        targets: [],
        attributes: [],
        conditions: [],
      });
    }
    // ── End DB-first lookup — fall through to PestPac ─────────────────────

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
      return NextResponse.json({ error: 'PestPac not enabled' }, { status: 400 });
    }

    const {
      pestpac_api_key: apiKey,
      pestpac_tenant_id: tenantId,
      pestpac_oauth_client_id: oauthClientId,
      pestpac_oauth_client_secret: clientSecret,
      pestpac_wwid_username: wwUsername,
      pestpac_wwid_password: wwPassword,
    } = s;

    if (!apiKey || !tenantId || !oauthClientId || !clientSecret || !wwUsername || !wwPassword) {
      return NextResponse.json({ error: 'PestPac credentials incomplete' }, { status: 400 });
    }

    const token = await getOAuthToken(oauthClientId, clientSecret, wwUsername, wwPassword);

    const headers = {
      Authorization: `Bearer ${token}`,
      apikey: apiKey,
      'tenant-id': tenantId,
      'Content-Type': 'application/json',
    } as const;

    const serviceOrderLookupPaths = [`/ServiceOrders/${encodeURIComponent(stopId)}`];

    if (routeId && routeId !== stopId) {
      serviceOrderLookupPaths.splice(1, 0, `/ServiceOrders/${encodeURIComponent(routeId)}`);
    }

    const { response: orderRes, path: orderPath } = await fetchWithPathFallback(
      serviceOrderLookupPaths,
      headers,
      [404, 400]
    );

    if (!orderRes.ok) {
      return NextResponse.json(
        {
          error: 'Failed to fetch service order',
          pestpac: {
            phase: 'service-order-detail',
            path: orderPath,
            status: orderRes.status,
            statusText: orderRes.statusText,
          },
        },
        { status: 502 }
      );
    }

    const raw = await orderRes.json();
    const orders = asArray<any>(raw?.value ?? raw);

    const getOrderKey = (o: any) =>
      String(o.OrderID ?? o.orderID ?? o.ServiceOrderID ?? o.serviceOrderID ?? o.id ?? o.ID ?? '');

    const stop =
      orders.find((o: any) => getOrderKey(o) === String(stopId)) ??
      (routeId ? orders.find((o: any) => getOrderKey(o) === String(routeId)) : null) ??
      orders[0];

    if (!stop) {
      return NextResponse.json({ error: 'Stop not found' }, { status: 404 });
    }

    // PestPac ServiceOrders use OrderID as the primary key
    const serviceOrderId = stop.OrderID ?? stop.orderID ?? stop.ServiceOrderID ?? stop.serviceOrderID ?? stop.id ?? stop.ID ?? stopId;
    const resolvedRouteId =
      stop.RouteID ?? stop.routeID ??
      stop.RouteId ?? stop.routeId ??
      stop.ScheduleID ?? stop.scheduleID ??
      routeId ?? serviceOrderId;

    // If route_stops already has a row for this PestPac stop (e.g. created by a
    // prior background sync), surface its id and lead_id so the wizard can link
    // to the correct lead even on this fallback path.
    const { data: fallbackRouteStop } = await adminSupabase
      .from('route_stops')
      .select('id, lead_id')
      .eq('company_id', userCompany.company_id)
      .eq('pestpac_stop_id', String(serviceOrderId))
      .maybeSingle();
    const fallbackRouteStopId = fallbackRouteStop?.id ?? null;
    const fallbackLeadId = fallbackRouteStop?.lead_id ?? null;

    // PestPac ServiceOrders use BillToID for the bill-to client
    const clientId =
      stop.BillToID ?? stop.billToID ??
      stop.ClientID ?? stop.clientID ??
      stop.client?.ClientID ?? stop.client?.clientID;

    const locationId =
      stop.LocationID ?? stop.locationID ??
      stop.location?.LocationID ?? stop.location?.locationID;

    let client: any = {};
    let location: any = {};

    if (clientId) {
      // PestPac uses /BillTos/{id} for bill-to records
      const { response: clientRes } = await fetchWithPathFallback(
        [
          `/BillTos/${encodeURIComponent(String(clientId))}`,
          `/Clients/${encodeURIComponent(String(clientId))}`,
        ],
        headers
      );
      if (clientRes.ok) client = await clientRes.json();
    }

    if (locationId) {
      const { response: locRes } = await fetchWithPathFallback(
        [
          `/Locations/${encodeURIComponent(String(locationId))}`,
          `/locations/${encodeURIComponent(String(locationId))}`,
        ],
        headers
      );
      if (locRes.ok) location = await locRes.json();
    }

    let services: any[] = asArray<any>(stop.lineItems ?? stop.LineItems ?? stop.services ?? stop.Services);

    const orderId = stop.orderID ?? stop.OrderID;
    if (services.length === 0 && orderId) {
      const { response: svcRes } = await fetchWithPathFallback(
        [
          `/orders/${encodeURIComponent(String(orderId))}/services`,
          `/Orders/${encodeURIComponent(String(orderId))}/Services`,
        ],
        headers,
        [404]
      );
      if (svcRes.ok) {
        const svcData = await svcRes.json();
        services = asArray<any>(svcData?.value ?? svcData);
      }
    }

    // Parallel fetch for additional order detail endpoints
    const [targetsRes, attribsRes, conditionsRes] = await Promise.all([
      fetch(`${PESTPAC_BASE_URL}/ServiceOrders/${encodeURIComponent(String(serviceOrderId))}/targets`, { headers }),
      fetch(`${PESTPAC_BASE_URL}/ServiceOrders/${encodeURIComponent(String(serviceOrderId))}/attributes`, { headers }),
      fetch(`${PESTPAC_BASE_URL}/ServiceOrders/${encodeURIComponent(String(serviceOrderId))}/conditions`, { headers }),
    ]);

    let targets: any[] = [];
    let attributes: any[] = [];
    let conditions: any[] = [];

    if (targetsRes.ok) {
      const data = await targetsRes.json();
      targets = asArray<any>(data?.value ?? data);
    }
    if (attribsRes.ok) {
      const data = await attribsRes.json();
      attributes = asArray<any>(data?.value ?? data);
    }
    if (conditionsRes.ok) {
      const data = await conditionsRes.json();
      conditions = asArray<any>(data?.value ?? data);
    }

    const address =
      [
        location.street ?? location.Address ?? stop.street ?? stop.Street ?? stop.address ?? stop.Address,
        location.city ?? location.City ?? stop.city ?? stop.City,
        location.state ?? location.State ?? stop.state ?? stop.State,
        location.zip ?? location.Zip ?? stop.zip ?? stop.Zip,
      ]
        .filter(Boolean)
        .join(', ');

    return NextResponse.json({
      routeStopId: fallbackRouteStopId,
      leadId: fallbackLeadId,
      stopId: String(serviceOrderId),
      routeId: String(resolvedRouteId),
      clientId: clientId ? String(clientId) : null,
      locationId: locationId ? String(locationId) : null,
      clientName: (() => {
        const fromClient =
          client.Name ?? client.name ??
          client.BillToName ?? client.billToName ??
          client.CompanyName ?? client.companyName ??
          `${client.FirstName ?? client.firstName ?? ''} ${client.LastName ?? client.lastName ?? ''}`.trim();
        if (fromClient) return toTitleCase(fromClient);

        const fromStop =
          stop.BillToName ?? stop.billToName ??
          stop.ClientName ?? stop.clientName ??
          stop.Company ?? stop.company ??
          `${stop.FirstName ?? stop.firstName ?? ''} ${stop.LastName ?? stop.lastName ?? ''}`.trim();
        return fromStop ? toTitleCase(fromStop) : null;
      })(),
      clientEmail: client.email ?? client.Email ?? stop.email ?? stop.Email ?? '',
      clientPhone:
        client.phone ??
        client.Phone ??
        client.mobilePhone ??
        client.MobilePhone ??
        stop.phone ??
        stop.Phone ??
        '',
      address,
      street: location.street ?? location.Address ?? stop.street ?? stop.Street ?? '',
      city: location.city ?? location.City ?? stop.city ?? stop.City ?? '',
      state: location.state ?? location.State ?? stop.state ?? stop.State ?? '',
      zip: location.zip ?? location.Zip ?? stop.zip ?? stop.Zip ?? '',
      lat: (location.latitude ?? location.Latitude ?? stop.latitude ?? stop.Latitude ?? null) as number | null,
      lng: (location.longitude ?? location.Longitude ?? stop.longitude ?? stop.Longitude ?? null) as number | null,
      scheduledTime:
        stop.scheduledTime ??
        stop.ScheduledTime ??
        stop.scheduledStart ??
        stop.ScheduledStart ??
        stop.startTime ??
        stop.StartTime ??
        null,
      serviceDate:
        stop.ServiceDate ?? stop.serviceDate ??
        stop.Date ?? stop.date ?? null,
      timeIn:
        stop.TimeIn ?? stop.timeIn ??
        stop.StartTime ?? stop.startTime ?? null,
      timeOut:
        stop.TimeOut ?? stop.timeOut ??
        stop.EndTime ?? stop.endTime ?? null,
      serviceStatus: stop.serviceStatus ?? stop.ServiceStatus ?? stop.status ?? stop.Status ?? 'Scheduled',
      serviceType:
        stop.serviceType ??
        stop.ServiceType ??
        stop.serviceTypeName ??
        stop.ServiceTypeName ??
        stop.orderType ??
        stop.OrderType ??
        '',
      serviceNotes:
        stop.serviceNotes ??
        stop.ServiceNotes ??
        stop.notes ??
        stop.Notes ??
        location.serviceNotes ??
        location.ServiceNotes ??
        '',
      accessInstructions:
        stop.accessInstructions ??
        stop.AccessInstructions ??
        stop.accessNotes ??
        stop.AccessNotes ??
        location.accessInstructions ??
        location.AccessInstructions ??
        '',
      technician:
        stop.TechnicianName ?? stop.technicianName ??
        stop.Technician ?? stop.technician ?? '',
      technicianId:
        stop.TechnicianID ?? stop.technicianID ??
        stop.TechnicianId ?? stop.technicianId ?? null,
      duration:
        stop.Duration ?? stop.duration ??
        stop.EstimatedDuration ?? stop.estimatedDuration ?? null,
      serviceClass:
        stop.ServiceClass ?? stop.serviceClass ??
        stop.ServiceClassName ?? stop.serviceClassName ?? '',
      programCode:
        stop.ProgramCode ?? stop.programCode ??
        stop.Program ?? stop.program ?? '',
      locationNotes:
        location.Notes ?? location.notes ??
        location.LocationNotes ?? location.locationNotes ?? '',
      amount:
        stop.Amount ?? stop.amount ??
        stop.TotalAmount ?? stop.totalAmount ??
        stop.OrderAmount ?? stop.orderAmount ?? null,
      balanceDue:
        client.BalanceDue ?? client.balanceDue ??
        location.BalanceDue ?? location.balanceDue ?? null,
      accountNumber:
        client.AccountNumber ?? client.accountNumber ??
        client.Account ?? client.account ?? '',
      lastServiceDate:
        location.LastServiceDate ?? location.lastServiceDate ??
        stop.LastServiceDate ?? stop.lastServiceDate ?? null,
      locationType:
        location.LocationType ?? location.locationType ??
        location.Type ?? location.type ?? '',
      branch:
        stop.Branch ?? stop.branch ??
        stop.BranchCode ?? stop.branchCode ??
        stop.BranchName ?? stop.branchName ?? '',
      services,
      targets,
      attributes,
      conditions,
    });
  } catch (error) {
    console.error('FieldMap stop detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
