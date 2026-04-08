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
      address,
      pestTypes,
      plan,
      pricing,
      notes,
      mapPlotData,
      signatureData,
      signedBy,
      scheduleOption,
      assignedTo,
    } = body;

    if (!clientName || !address) {
      return NextResponse.json({ error: 'Client name and address are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data: userCompany } = await adminClient
      .from('user_companies')
      .select('company_id')
      .eq('user_id', user.id)
      .eq('is_primary', true)
      .single();

    if (!userCompany?.company_id) {
      return NextResponse.json({ error: 'Company not found' }, { status: 400 });
    }

    const companyId = userCompany.company_id;
    const { firstName, lastName } = splitName(clientName);

    let customerId: string | null = null;

    if (clientEmail) {
      const { data: existingCustomer } = await adminClient
        .from('customers')
        .select('id')
        .eq('company_id', companyId)
        .ilike('email', clientEmail)
        .maybeSingle();

      customerId = existingCustomer?.id ?? null;
    }

    if (!customerId) {
      const { data: newCustomer, error: customerError } = await adminClient
        .from('customers')
        .insert({
          company_id: companyId,
          first_name: firstName,
          last_name: lastName,
          email: clientEmail ?? null,
          address,
        })
        .select('id')
        .single();

      if (customerError || !newCustomer?.id) {
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
      }

      customerId = newCustomer.id;
    }

    const { data: serviceAddress } = await adminClient
      .from('service_addresses')
      .insert({
        company_id: companyId,
        street_address: address,
      })
      .select('id')
      .single();

    const serviceAddressId = serviceAddress?.id ?? null;

    const pestSummary = Array.isArray(pestTypes) && pestTypes.length > 0
      ? pestTypes.join(', ')
      : 'General pest control';

    const notesText = [
      `Pests: ${pestSummary}`,
      plan?.plan_name ? `Plan: ${plan.plan_name}` : null,
      pricing?.initialPrice != null ? `Initial: $${pricing.initialPrice}` : null,
      pricing?.recurringPrice != null
        ? `Recurring: $${pricing.recurringPrice}${pricing.billingFrequency ? ` / ${pricing.billingFrequency}` : ''}`
        : null,
      notes ? `Notes: ${notes}` : null,
      `Stamps: ${mapPlotData?.stamps?.length ?? 0}, Outlines: ${mapPlotData?.outlines?.length ?? 0}`,
    ]
      .filter(Boolean)
      .join('\n');

    const normalizedScheduleOption: 'now' | 'later' | 'someone_else' =
      scheduleOption === 'now' || scheduleOption === 'someone_else' ? scheduleOption : 'later';

    const assignedScheduler =
      normalizedScheduleOption === 'now'
        ? user.id
        : normalizedScheduleOption === 'someone_else'
        ? assignedTo === 'scheduling_team'
          ? null
          : typeof assignedTo === 'string' && assignedTo.trim().length > 0
          ? assignedTo
          : null
        : null;

    const { data: lead, error: leadError } = await adminClient
      .from('leads')
      .insert({
        company_id: companyId,
        customer_id: customerId,
        service_address_id: serviceAddressId,
        format: 'form',
        lead_type: 'manual',
        lead_source: 'inspector',
        lead_status: 'scheduling',
        assigned_scheduler: assignedScheduler,
        pest_type: pestSummary,
        comments: notesText,
        selected_plan_id: plan?.id ?? null,
        recommended_plan_name: plan?.plan_name ?? null,
        submitted_by: user.id,
        priority: 'medium',
      })
      .select('id')
      .single();

    if (leadError || !lead?.id) {
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }

    if (notes || mapPlotData) {
      await adminClient.from('activity_log').insert({
        company_id: companyId,
        entity_type: 'lead',
        entity_id: lead.id,
        activity_type: 'note_added',
        user_id: user.id,
        notes: notes?.trim() || 'Map & Plot data captured from FieldMap service wizard.',
        metadata: {
          source: 'field_map',
          map_plot: mapPlotData ?? null,
          customer_signature: signatureData ?? null,
          customer_signed_by: signedBy ?? null,
          schedule_option: normalizedScheduleOption,
        },
      });
    }

    return NextResponse.json({ success: true, leadId: lead.id, scheduleOption: normalizedScheduleOption });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
