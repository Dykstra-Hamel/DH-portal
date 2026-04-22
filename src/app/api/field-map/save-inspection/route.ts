import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: 'Customer', lastName: 'Unknown' };
  if (parts.length === 1) return { firstName: parts[0], lastName: 'Unknown' };
  return {
    firstName: parts.slice(0, -1).join(' '),
    lastName: parts[parts.length - 1],
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      clientName,
      clientEmail,
      clientPhone,
      address,
      pestTypes,
      mapPlotData,
      companyId: bodyCompanyId,
      leadId: existingLeadId,
      stopId,
      routeStopId,
    } = body;

    if (!clientName || !address) {
      return NextResponse.json({ error: 'Client name and address are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Resolve company
    let companyQuery = adminClient
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id);

    if (bodyCompanyId) {
      companyQuery = companyQuery.eq('company_id', bodyCompanyId);
    } else {
      companyQuery = companyQuery.eq('is_primary', true);
    }

    const { data: userCompany } = await companyQuery.single();

    if (!userCompany?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 });
    }

    const companyId = userCompany.company_id;
    const { firstName, lastName } = splitName(clientName);

    const pestSummary =
      Array.isArray(pestTypes) && pestTypes.length > 0
        ? pestTypes.join(', ')
        : 'General pest control';

    // ── Customer find / upsert ─────────────────────────────────────────────
    let customerId: string | null = null;

    if (clientEmail) {
      const { data: byEmail } = await adminClient
        .from('customers')
        .select('id')
        .eq('company_id', companyId)
        .ilike('email', clientEmail)
        .maybeSingle();
      customerId = byEmail?.id ?? null;
    }

    if (!customerId && clientPhone) {
      const { data: byPhone } = await adminClient
        .from('customers')
        .select('id')
        .eq('company_id', companyId)
        .ilike('phone', clientPhone)
        .maybeSingle();
      customerId = byPhone?.id ?? null;
    }

    if (customerId) {
      const updates: Record<string, string> = {};
      if (firstName) updates.first_name = firstName;
      if (lastName) updates.last_name = lastName;
      if (clientEmail) updates.email = clientEmail;
      if (clientPhone) updates.phone = clientPhone;
      if (Object.keys(updates).length > 0) {
        await adminClient.from('customers').update(updates).eq('id', customerId);
      }
    } else {
      const { data: newCustomer, error: customerError } = await adminClient
        .from('customers')
        .insert({
          company_id: companyId,
          first_name: firstName,
          last_name: lastName,
          email: clientEmail || null,
          phone: clientPhone || null,
          address,
        })
        .select('id')
        .single();

      if (customerError || !newCustomer?.id) {
        console.error('[save-inspection] customer insert error:', customerError);
        return NextResponse.json({ error: customerError?.message ?? 'Failed to create customer' }, { status: 500 });
      }
      customerId = newCustomer.id;
    }

    // ── Service address find / upsert ─────────────────────────────────────
    let serviceAddressId: string | null = null;

    const { data: existingAddress } = await adminClient
      .from('service_addresses')
      .select('id')
      .eq('company_id', companyId)
      .ilike('street_address', address)
      .maybeSingle();

    if (existingAddress?.id) {
      serviceAddressId = existingAddress.id;
    } else {
      const { data: newAddress } = await adminClient
        .from('service_addresses')
        .insert({ company_id: companyId, street_address: address })
        .select('id')
        .single();
      serviceAddressId = newAddress?.id ?? null;
    }

    // ── Resolve lead ID — check route_stops to avoid duplicates ──────────
    let resolvedLeadId: string | null = existingLeadId ?? null;
    let resolvedRouteStopId: string | null = routeStopId ?? null;

    if (!resolvedRouteStopId && stopId) {
      const stopIdStr = String(stopId);
      const { data: stopRow } = await adminClient
        .from('route_stops')
        .select('id, lead_id')
        .eq('company_id', companyId)
        .eq('pestpac_stop_id', stopIdStr)
        .maybeSingle();
      if (stopRow?.id) {
        resolvedRouteStopId = stopRow.id;
        if (!resolvedLeadId && stopRow.lead_id) resolvedLeadId = stopRow.lead_id;
      } else {
        // Fallback: the URL's stopId is dual-purpose (pestpac_stop_id ?? route_stops.id).
        // If it looks like a UUID, try matching route_stops.id directly.
        const looksLikeUuid =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            stopIdStr
          );
        if (looksLikeUuid) {
          const { data: byIdRow } = await adminClient
            .from('route_stops')
            .select('id, lead_id')
            .eq('company_id', companyId)
            .eq('id', stopIdStr)
            .maybeSingle();
          if (byIdRow?.id) {
            resolvedRouteStopId = byIdRow.id;
            if (!resolvedLeadId && byIdRow.lead_id) resolvedLeadId = byIdRow.lead_id;
          }
        }
      }
    } else if (!resolvedLeadId && resolvedRouteStopId) {
      const { data: stopRow } = await adminClient
        .from('route_stops')
        .select('lead_id')
        .eq('id', resolvedRouteStopId)
        .maybeSingle();
      if (stopRow?.lead_id) resolvedLeadId = stopRow.lead_id;
    }

    // ── Create or update lead ─────────────────────────────────────────────
    let leadId: string;

    if (resolvedLeadId) {
      // Update existing lead (re-editing map)
      const { error: updateError } = await adminClient
        .from('leads')
        .update({
          customer_id: customerId,
          service_address_id: serviceAddressId,
          pest_type: pestSummary,
          map_plot_data: mapPlotData ?? null,
          ...(stopId ? { pestpac_stop_id: String(stopId) } : {}),
        })
        .eq('id', resolvedLeadId);

      if (updateError) {
        console.error('[save-inspection] lead update error:', updateError);
        return NextResponse.json({ error: updateError.message ?? 'Failed to update lead' }, { status: 500 });
      }
      leadId = resolvedLeadId as string;
    } else {
      const { data: newLead, error: leadError } = await adminClient
        .from('leads')
        .insert({
          company_id: companyId,
          customer_id: customerId,
          service_address_id: serviceAddressId,
          format: 'form',
          lead_type: 'manual',
          lead_source: 'inspector',
          lead_status: 'in_process',
          pest_type: pestSummary,
          map_plot_data: mapPlotData ?? null,
          pestpac_stop_id: stopId ? String(stopId) : null,
          estimated_value: null,
          submitted_by: user.id,
          priority: 'medium',
        })
        .select('id')
        .single();

      if (leadError || !newLead?.id) {
        console.error('[save-inspection] lead insert error:', leadError);
        return NextResponse.json({ error: leadError?.message ?? 'Failed to create lead' }, { status: 500 });
      }
      leadId = newLead.id;

      // Log creation
      await adminClient.from('activity_log').insert({
        company_id: companyId,
        entity_type: 'lead',
        entity_id: leadId,
        activity_type: 'created',
        user_id: user.id,
        notes: 'Field map inspection created',
        metadata: { source: 'field_map' },
      });
    }

    // ── Link lead back to route stop ──────────────────────────────────────
    if (resolvedRouteStopId && leadId) {
      await adminClient
        .from('route_stops')
        .update({ lead_id: leadId })
        .eq('id', resolvedRouteStopId)
        .eq('company_id', companyId);
    }

    return NextResponse.json({ success: true, leadId, customerId, serviceAddressId });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
