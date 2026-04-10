import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { generateQuoteToken, generateQuoteUrl } from '@/lib/quote-utils';

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
      quoteLineItems,
      notes,
      mapPlotData,
      signatureData,
      signedBy,
      scheduleOption,
      assignedTo,
      discountTarget,
      discountAmount,
      discountType,
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

    // ── Line items ─────────────────────────────────────────────────────────
    const lineItems: Array<{
      id?: string; type: string; catalogItemKind?: string; catalogItemId?: string;
      catalogItemName?: string; customName?: string;
      coveredPestLabels: string[];
      initialCost: number | null; recurringCost: number | null; frequency: string | null;
    }> = Array.isArray(quoteLineItems) ? quoteLineItems : [];

    function getLineItemLabel(item: typeof lineItems[number]): string {
      if (item.type === 'plan-addon') return item.catalogItemName || 'Service';
      if (item.customName?.trim()) return item.customName.trim();
      if (item.coveredPestLabels?.length > 0) return item.coveredPestLabels.join(', ') + ' Treatment';
      return 'Custom Service';
    }

    const totalInitial = lineItems.reduce((s, i) => s + (i.initialCost ?? 0), 0);
    const totalRecurring = lineItems.reduce((s, i) => s + (i.recurringCost ?? 0), 0);
    const recurringFreqs = [...new Set(lineItems.filter(i => (i.recurringCost ?? 0) > 0).map(i => i.frequency).filter(Boolean))];
    const billingFrequency = recurringFreqs.length === 1 ? recurringFreqs[0] : null;

    // Compute discount
    const discountAmt = typeof discountAmount === 'number' ? discountAmount : null;
    const discountDollarInitial = discountAmt != null && (discountTarget === 'initial' || discountTarget === 'both')
      ? (discountType === '%' ? totalInitial * discountAmt / 100 : discountAmt)
      : 0;
    const discountDollarRecurring = discountAmt != null && (discountTarget === 'recurring' || discountTarget === 'both')
      ? (discountType === '%' ? totalRecurring * discountAmt / 100 : discountAmt)
      : 0;
    const adjustedInitial = Math.max(0, totalInitial - discountDollarInitial);
    const adjustedRecurring = Math.max(0, totalRecurring - discountDollarRecurring);

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
          email: clientEmail ?? null,
          phone: clientPhone ?? null,
          address,
        })
        .select('id')
        .single();

      if (customerError || !newCustomer?.id) {
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
      }
      customerId = newCustomer.id;
    }

    // ── Service address ────────────────────────────────────────────────────
    const { data: serviceAddress } = await adminClient
      .from('service_addresses')
      .insert({ company_id: companyId, street_address: address })
      .select('id')
      .single();

    const serviceAddressId = serviceAddress?.id ?? null;

    // ── Build notes text ───────────────────────────────────────────────────
    const pestSummary = Array.isArray(pestTypes) && pestTypes.length > 0
      ? pestTypes.join(', ')
      : 'General pest control';

    const lineItemsText = lineItems.map((item, i) => {
      const label = getLineItemLabel(item);
      const parts = [`${i + 1}. ${label}`];
      if (item.initialCost != null) parts.push(`Initial: $${item.initialCost}`);
      if (item.recurringCost != null) parts.push(`Recurring: $${item.recurringCost}${item.frequency ? ` / ${item.frequency}` : ''}`);
      return parts.join(' — ');
    }).join('\n');

    const discountNote = discountDollarInitial > 0 || discountDollarRecurring > 0
      ? `Discount: ${discountType === '%' ? `${discountAmt}%` : `$${discountAmt}`} on ${discountTarget}`
      : null;

    const notesText = [
      `Pests: ${pestSummary}`,
      lineItemsText || null,
      discountNote,
      adjustedInitial > 0 ? `Total Initial: $${adjustedInitial.toFixed(2)}` : null,
      adjustedRecurring > 0 ? `Total Recurring: $${adjustedRecurring.toFixed(2)}${billingFrequency ? ` / ${billingFrequency}` : ''}` : null,
      notes ? `Notes: ${notes}` : null,
      `Stamps: ${mapPlotData?.stamps?.length ?? 0}, Outlines: ${mapPlotData?.outlines?.length ?? 0}`,
    ]
      .filter(Boolean)
      .join('\n');

    // ── Schedule option normalization ──────────────────────────────────────
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

    // ── Create lead ────────────────────────────────────────────────────────
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
        selected_plan_id: null,
        recommended_plan_name: null,
        estimated_value: adjustedInitial > 0 ? adjustedInitial : (totalInitial > 0 ? totalInitial : null),
        submitted_by: user.id,
        priority: 'medium',
      })
      .select('id')
      .single();

    if (leadError || !lead?.id) {
      return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 });
    }

    // ── Activity log ───────────────────────────────────────────────────────
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

    // ── Quote + line items ─────────────────────────────────────────────────
    const quoteToken = generateQuoteToken();

    const { data: newQuote } = await adminClient
      .from('quotes')
      .insert({
        lead_id: lead.id,
        company_id: companyId,
        customer_id: customerId,
        service_address_id: serviceAddressId,
        primary_pest: pestSummary,
        additional_pests: [],
        total_initial_price: adjustedInitial,
        total_recurring_price: adjustedRecurring,
        quote_status: 'draft',
        quote_token: quoteToken,
      })
      .select('id')
      .single();

    if (newQuote?.id) {
      const { data: companySlug } = await adminClient
        .from('companies')
        .select('slug')
        .eq('id', companyId)
        .single();

      if (companySlug?.slug) {
        const quoteUrl = generateQuoteUrl(companySlug.slug, newQuote.id, quoteToken);
        await adminClient.from('quotes').update({ quote_url: quoteUrl }).eq('id', newQuote.id);
      }

      if (lineItems.length > 0) {
        await adminClient.from('quote_line_items').insert(
          lineItems.map((item, idx) => {
            const planName = getLineItemLabel(item);
            const servicePlanId = item.type === 'plan-addon' && item.catalogItemKind === 'plan'
              ? (item.catalogItemId ?? null)
              : null;
            const rawInitial = item.initialCost ?? 0;
            const rawRecurring = item.recurringCost ?? 0;
            const finalInitial = totalInitial > 0 && discountDollarInitial > 0
              ? Math.max(0, rawInitial * (adjustedInitial / totalInitial))
              : rawInitial;
            const finalRecurring = totalRecurring > 0 && discountDollarRecurring > 0
              ? Math.max(0, rawRecurring * (adjustedRecurring / totalRecurring))
              : rawRecurring;
            return {
              quote_id: newQuote.id,
              service_plan_id: servicePlanId,
              plan_name: planName,
              plan_description: null,
              initial_price: rawInitial,
              recurring_price: rawRecurring,
              billing_frequency: item.frequency ?? null,
              final_initial_price: finalInitial,
              final_recurring_price: finalRecurring,
              discount_percentage: discountType === '%' && discountAmt != null ? discountAmt : 0,
              discount_amount: discountType === '$' && discountAmt != null ? discountDollarInitial + discountDollarRecurring : 0,
              is_optional: false,
              is_selected: true,
              display_order: idx,
            };
          })
        );
      }
    }

    return NextResponse.json({ success: true, leadId: lead.id, scheduleOption: normalizedScheduleOption });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
