import { SupabaseClient } from '@supabase/supabase-js';

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

async function resolveCustomer(
  adminSupabase: SupabaseClient,
  companyId: string,
  clientId: string,
  clientName: string | null
): Promise<string | null> {
  try {
    const { data: existing } = await adminSupabase
      .from('customers')
      .select('id')
      .eq('company_id', companyId)
      .eq('pestpac_client_id', clientId)
      .maybeSingle();

    if (existing) return existing.id;

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
          customerId = await resolveCustomer(adminSupabase, companyId, stop.clientId, stop.clientName ?? null);
        }

        if (stop.addressStreet && stop.addressCity && stop.addressState) {
          serviceAddressId = await resolveServiceAddress(adminSupabase, companyId, stop);
        }

        if (customerId && serviceAddressId) {
          await linkCustomerAddress(adminSupabase, customerId, serviceAddressId);
        }

        const { error: stopErr } = await adminSupabase
          .from('route_stops')
          .upsert(
            {
              route_id: routeId,
              company_id: companyId,
              stop_order: i + 1,
              pestpac_stop_id: stop.stopId,
              pestpac_service_order_id: stop.stopId,
              address_display: stop.address ?? null,
              lat: stop.lat ?? null,
              lng: stop.lng ?? null,
              service_type: stop.serviceType ?? null,
              notes: stop.serviceNotes ?? null,
              access_instructions: stop.accessInstructions ?? null,
              status: mapStopStatus(stop.serviceStatus),
              lead_id: stop.leadId ?? null,
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
