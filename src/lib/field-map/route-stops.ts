import { createAdminClient } from '@/lib/supabase/server-admin';

export const DB_STATUS_DISPLAY: Record<string, string> = {
  pending:      'Scheduled',
  en_route:     'En Route',
  arrived:      'Arrived',
  in_progress:  'In Progress',
  completed:    'Completed',
  skipped:      'Cancelled',
  rescheduled:  'Rescheduled',
};

export type MappedRouteStop = ReturnType<typeof mapDbStopToRouteStop>;

export function mapDbStopToRouteStop(stop: any, routeMap: Record<string, any>) {
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

export async function attachInspectionStatus(
  adminSupabase: ReturnType<typeof createAdminClient>,
  companyId: string,
  stops: MappedRouteStop[]
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

export const ROUTE_STOPS_SELECT = `
  id, route_id, stop_order, pestpac_stop_id, lead_id, referred_to_sales, service_type,
  notes, access_instructions, scheduled_arrival, status, lat, lng, address_display,
  customers ( id, pestpac_client_id, first_name, last_name ),
  service_addresses ( id, pestpac_location_id, street_address, city, state, zip_code )
`;
