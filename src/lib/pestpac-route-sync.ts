import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { getOAuthToken } from '@/lib/pestpac-auth';

const PESTPAC_BASE_URL = 'https://api.workwave.com/pestpac/v1';

export interface UserCompany {
  company_id: string;
  pestpac_employee_id: string | null;
}

interface EnrichedStop {
  stopId: string | null;
  routeId: string | null;
  address: string | null;
  scheduledTime: string | null;
  serviceStatus: string | null;
  serviceType: string | null;
  serviceNotes: string | null;
  accessInstructions: string | null;
  lat: number | null;
  lng: number | null;
  leadId: string | null;
  clientId: string | null;
  locationId: string | null;
  clientName: string | null;
  phone: string | null;
  email: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressState: string | null;
  addressZip: string | null;
  lineItems?: any[] | null;
  pestpacRawData?: any;
}

interface SyncParams {
  adminSupabase: SupabaseClient;
  companyId: string;
  routeDate: string;
  assignedUserId: string;
  stops: EnrichedStop[];
}

function mapRouteStatus(pestpacStatus: string | null): string {
  const s = (pestpacStatus ?? '').toLowerCase();
  if (s === 'completed' || s === 'posted') return 'completed';
  if (s === 'inprogress' || s === 'in_progress') return 'in_progress';
  return 'scheduled';
}

function mapStopStatus(pestpacStatus: string | null): string {
  const s = (pestpacStatus ?? '').toLowerCase();
  if (s === 'completed' || s === 'posted') return 'completed';
  if (s === 'inprogress' || s === 'in_progress') return 'in_progress';
  return 'pending';
}

// Statuses that the app sets locally (e.g. via Send Quote / Schedule Service)
// and that PestPac doesn't know about — the sync must not overwrite these.
const TERMINAL_STOP_STATUSES = new Set(['completed', 'skipped']);

async function resolveCustomer(
  adminSupabase: SupabaseClient,
  companyId: string,
  clientId: string,
  clientName: string | null,
  phone: string | null,
  email: string | null
): Promise<string | null> {
  try {
    const { data: existing } = await adminSupabase
      .from('customers')
      .select('id, phone, email')
      .eq('company_id', companyId)
      .eq('pestpac_client_id', clientId)
      .maybeSingle();

    if (existing) {
      const patch: { phone?: string; email?: string } = {};
      if (!existing.phone && phone) patch.phone = phone;
      if (!existing.email && email) patch.email = email;
      if (Object.keys(patch).length > 0) {
        await adminSupabase
          .from('customers')
          .update(patch)
          .eq('id', existing.id);
      }
      return existing.id;
    }

    if (!clientName) return null;

    const trimmed = clientName.trim();
    if (!trimmed) return null;

    const lastSpace = trimmed.lastIndexOf(' ');
    const firstName = lastSpace > 0 ? trimmed.slice(0, lastSpace) : trimmed;
    const lastName  = lastSpace > 0 ? trimmed.slice(lastSpace + 1) : '';

    const { data: newCustomer, error } = await adminSupabase
      .from('customers')
      .insert({
        company_id: companyId,
        first_name: firstName,
        last_name: lastName,
        phone: phone ?? null,
        email: email ?? null,
        pestpac_client_id: clientId,
        customer_status: 'active',
      })
      .select('id')
      .single();

    if (error || !newCustomer) {
      console.error('[pestpac-route-sync] resolveCustomer insert error:', error);
      return null;
    }

    return newCustomer.id;
  } catch (err) {
    console.error('[pestpac-route-sync] resolveCustomer unexpected error:', err);
    return null;
  }
}

async function resolveServiceAddress(
  adminSupabase: SupabaseClient,
  companyId: string,
  stop: EnrichedStop
): Promise<string | null> {
  try {
    // 1. Try lookup by pestpac_location_id first (fastest + most reliable)
    if (stop.locationId) {
      const { data: byLocation } = await adminSupabase
        .from('service_addresses')
        .select('id')
        .eq('company_id', companyId)
        .eq('pestpac_location_id', stop.locationId)
        .maybeSingle();
      if (byLocation) return byLocation.id;
    }

    // 2. Fall back to address match
    if (!stop.addressStreet || !stop.addressCity || !stop.addressState) return null;

    const { data: existing } = await adminSupabase
      .from('service_addresses')
      .select('id')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .ilike('street_address', stop.addressStreet.trim())
      .ilike('city', stop.addressCity.trim())
      .ilike('state', stop.addressState.trim())
      .maybeSingle();

    if (existing) {
      // Backfill pestpac_location_id if we now have it
      if (stop.locationId) {
        await adminSupabase
          .from('service_addresses')
          .update({ pestpac_location_id: stop.locationId })
          .eq('id', existing.id);
      }
      return existing.id;
    }

    // 3. Insert new record
    const now = (stop.lat != null && stop.lng != null) ? new Date().toISOString() : null;
    const { data: created, error } = await adminSupabase
      .from('service_addresses')
      .insert({
        company_id: companyId,
        street_address: stop.addressStreet.trim(),
        city: stop.addressCity.trim(),
        state: stop.addressState.trim().toUpperCase(),
        zip_code: (stop.addressZip ?? '').trim(),
        latitude: stop.lat ?? null,
        longitude: stop.lng ?? null,
        geocoded_at: now,
        address_type: 'residential',
        pestpac_location_id: stop.locationId ?? null,
      })
      .select('id')
      .single();

    if (error || !created) {
      console.error('[pestpac-route-sync] resolveServiceAddress insert error:', error);
      return null;
    }
    return created.id;
  } catch (err) {
    console.error('[pestpac-route-sync] resolveServiceAddress unexpected error:', err);
    return null;
  }
}

async function linkCustomerAddress(
  adminSupabase: SupabaseClient,
  customerId: string,
  serviceAddressId: string
): Promise<void> {
  try {
    const { data: existing } = await adminSupabase
      .from('customer_service_addresses')
      .select('id')
      .eq('customer_id', customerId)
      .eq('service_address_id', serviceAddressId)
      .maybeSingle();

    if (existing) return;

    await adminSupabase.from('customer_service_addresses').insert({
      customer_id: customerId,
      service_address_id: serviceAddressId,
      relationship_type: 'owner',
      is_primary_address: true,
    });
  } catch (err) {
    console.error('[pestpac-route-sync] linkCustomerAddress unexpected error:', err);
  }
}

export async function syncPestPacRoute({
  adminSupabase,
  companyId,
  routeDate,
  assignedUserId,
  stops,
}: SyncParams): Promise<void> {
  try {
    // Group stops by PestPac routeId; stops without one go into "default"
    const groups = new Map<string, EnrichedStop[]>();
    for (const stop of stops) {
      const key = stop.routeId ?? 'default';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(stop);
    }

    for (const [routeKey, groupStops] of groups) {
      const pestpacRouteId = routeKey !== 'default' ? routeKey : null;
      const routeName =
        pestpacRouteId
          ? `PestPac Route ${pestpacRouteId}`
          : `PestPac Route ${routeDate}`;

      // Derive route status from stops (use first non-null status found)
      const firstStatus = groupStops.find(s => s.serviceStatus)?.serviceStatus ?? null;
      const routeStatus = mapRouteStatus(firstStatus);

      // Upsert the route row
      let routeId: string | null = null;

      if (pestpacRouteId) {
        const { data: routeRow, error: routeErr } = await adminSupabase
          .from('routes')
          .upsert(
            {
              company_id: companyId,
              name: routeName,
              route_date: routeDate,
              assigned_to: assignedUserId,
              route_type: 'technician',
              status: routeStatus,
              pestpac_route_id: pestpacRouteId,
            },
            { onConflict: 'company_id,pestpac_route_id' }
          )
          .select('id')
          .single();

        if (routeErr) {
          console.error('[pestpac-route-sync] route upsert error:', routeErr);
          continue;
        }
        routeId = routeRow?.id ?? null;
      } else {
        // Fallback group: no pestpac_route_id — insert or find by date+company+assigned_to
        const { data: existing } = await adminSupabase
          .from('routes')
          .select('id')
          .eq('company_id', companyId)
          .eq('route_date', routeDate)
          .eq('assigned_to', assignedUserId)
          .is('pestpac_route_id', null)
          .maybeSingle();

        if (existing) {
          routeId = existing.id;
          await adminSupabase
            .from('routes')
            .update({ status: routeStatus, name: routeName })
            .eq('id', routeId);
        } else {
          const { data: newRoute, error: insertErr } = await adminSupabase
            .from('routes')
            .insert({
              company_id: companyId,
              name: routeName,
              route_date: routeDate,
              assigned_to: assignedUserId,
              route_type: 'technician',
              status: routeStatus,
              pestpac_route_id: null,
            })
            .select('id')
            .single();

          if (insertErr) {
            console.error('[pestpac-route-sync] fallback route insert error:', insertErr);
            continue;
          }
          routeId = newRoute?.id ?? null;
        }
      }

      if (!routeId) continue;

      // Upsert each stop
      for (let i = 0; i < groupStops.length; i++) {
        const stop = groupStops[i];
        if (!stop.stopId) continue;

        let customerId: string | null = null;
        let serviceAddressId: string | null = null;

        if (stop.clientId) {
          customerId = await resolveCustomer(
            adminSupabase,
            companyId,
            stop.clientId,
            stop.clientName ?? null,
            stop.phone ?? null,
            stop.email ?? null
          );
        }

        if (stop.addressStreet && stop.addressCity && stop.addressState) {
          serviceAddressId = await resolveServiceAddress(adminSupabase, companyId, stop);
        }

        if (customerId && serviceAddressId) {
          await linkCustomerAddress(adminSupabase, customerId, serviceAddressId);
        }

        // Preserve locally-owned fields that the app writes but PestPac doesn't know about:
        // terminal statuses (set by Send Quote / Schedule Service), lead_id (set by save-inspection),
        // and route_id/stop_order when manually_reassigned is set by a manager.
        const { data: existingStop } = await adminSupabase
          .from('route_stops')
          .select('status, lead_id, manually_reassigned, route_id, stop_order')
          .eq('company_id', companyId)
          .eq('pestpac_stop_id', stop.stopId)
          .maybeSingle();

        const nextStatus =
          existingStop && TERMINAL_STOP_STATUSES.has(existingStop.status)
            ? existingStop.status
            : mapStopStatus(stop.serviceStatus);

        const nextLeadId = existingStop?.lead_id ?? stop.leadId ?? null;

        const nextRouteId =
          existingStop?.manually_reassigned ? existingStop.route_id : routeId;

        const nextStopOrder =
          existingStop?.manually_reassigned ? existingStop.stop_order : i + 1;

        const { error: stopErr } = await adminSupabase
          .from('route_stops')
          .upsert(
            {
              route_id: nextRouteId,
              company_id: companyId,
              stop_order: nextStopOrder,
              pestpac_stop_id: stop.stopId,
              pestpac_service_order_id: stop.stopId,
              address_display: stop.address ?? null,
              lat: stop.lat ?? null,
              lng: stop.lng ?? null,
              service_type: stop.serviceType ?? null,
              notes: stop.serviceNotes ?? null,
              access_instructions: stop.accessInstructions ?? null,
              status: nextStatus,
              lead_id: nextLeadId,
              scheduled_arrival: stop.scheduledTime ?? null,
              customer_id: customerId,
              service_address_id: serviceAddressId,
              line_items: stop.lineItems ?? null,
              pestpac_raw_data: stop.pestpacRawData ?? null,
            },
            { onConflict: 'company_id,pestpac_stop_id' }
          );

        if (stopErr) {
          console.error('[pestpac-route-sync] stop upsert error:', stopErr);
        }
      }
    }
  } catch (err) {
    console.error('[pestpac-route-sync] unexpected error:', err);
  }
}

// ── Helpers used by fetchAndSyncFromPestPac ──────────────────────────────────

function toTitleCase(str: string): string {
  return str.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
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

export interface FetchAndSyncOptions {
  awaitSync?: boolean;
}

export interface FetchedEnrichedStop {
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

export async function fetchAndSyncFromPestPac(
  adminSupabase: ReturnType<typeof createAdminClient>,
  userCompany: UserCompany,
  date: string,
  userId: string,
  options: FetchAndSyncOptions = {}
): Promise<FetchedEnrichedStop[] | null> {
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
  const enrichedStops: FetchedEnrichedStop[] = [];

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

  const syncPromise = syncPestPacRoute({
    adminSupabase,
    companyId: userCompany.company_id,
    routeDate: date,
    assignedUserId: userId,
    stops: enrichedStops,
  });

  if (options.awaitSync) {
    await syncPromise;
  } else {
    syncPromise.catch(() => {});
  }

  return enrichedStops;
}
