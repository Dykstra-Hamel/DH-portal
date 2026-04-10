import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { sendEmailRouted } from '@/lib/email/router';
import { getCompanyFromEmail, getCompanyTenantName } from '@/lib/email';
import { generateQuoteToken, generateQuoteUrl, getFullQuoteUrl } from '@/lib/quote-utils';
import { formatHomeSizeRange, formatYardSizeRange } from '@/lib/pricing-calculations';
import { generateFieldMapQuoteEmailTemplate } from '@/lib/email/templates/field-map-quote';

// TODO: switch to customerEmail when ready for production
const QUOTE_RECIPIENT = 'jason@dykstrahamel.com';

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
      inspectorName,
      companyName: bodyCompanyName,
      sendEmail,
      discountTarget,
      discountAmount,
      discountType,
      companyId: bodyCompanyId,
    } = body;

    // Derive totals from line items
    const lineItems: Array<{
      id?: string; type: string; catalogItemKind?: string; catalogItemId?: string;
      catalogItemName?: string; customName?: string;
      coveredPestLabels: string[]; otherLabel: string;
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

    // Compute discount dollar amounts
    const discountAmt = typeof discountAmount === 'number' ? discountAmount : null;
    const discountDollarInitial = discountAmt != null && (discountTarget === 'initial' || discountTarget === 'both')
      ? (discountType === '%' ? totalInitial * discountAmt / 100 : discountAmt)
      : 0;
    const discountDollarRecurring = discountAmt != null && (discountTarget === 'recurring' || discountTarget === 'both')
      ? (discountType === '%' ? totalRecurring * discountAmt / 100 : discountAmt)
      : 0;
    const adjustedInitial = Math.max(0, totalInitial - discountDollarInitial);
    const adjustedRecurring = Math.max(0, totalRecurring - discountDollarRecurring);

    if (!clientName || !address) {
      return NextResponse.json({ error: 'Client name and address are required' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Resolve company — prefer the companyId sent from the client (selected company),
    // fall back to the user's primary company
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

    // ── Customer find / upsert ──────────────────────────────────────────────
    let customerId: string | null = null;

    // 1. Look up by email
    if (clientEmail) {
      const { data: byEmail } = await adminClient
        .from('customers')
        .select('id')
        .eq('company_id', companyId)
        .ilike('email', clientEmail)
        .maybeSingle();
      customerId = byEmail?.id ?? null;
    }

    // 2. Fall back to phone lookup
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
      // Update non-null fields on the existing customer
      const updates: Record<string, string> = {};
      if (firstName) updates.first_name = firstName;
      if (lastName) updates.last_name = lastName;
      if (clientEmail) updates.email = clientEmail;
      if (clientPhone) updates.phone = clientPhone;
      if (Object.keys(updates).length > 0) {
        await adminClient.from('customers').update(updates).eq('id', customerId);
      }
    } else {
      // Create a new customer
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
    const pestSummary =
      Array.isArray(pestTypes) && pestTypes.length > 0
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
        lead_status: 'quoted',
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

    // ── Activity log with map plot data ────────────────────────────────────
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
      },
    });

    // ── Quote + line items ─────────────────────────────────────────────────
    const quoteStatus = sendEmail && clientEmail ? 'sent' : 'draft';
    const quoteToken = generateQuoteToken();

    const { data: newQuote, error: quoteError } = await adminClient
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
        quote_status: quoteStatus,
        quote_token: quoteToken,
      })
      .select('id')
      .single();

    if (!quoteError && newQuote?.id) {
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
            // Apply proportional discount to final prices
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

    // ── Email (only when explicitly requested and customer email is present) ──
    let emailSent = false;

    if (sendEmail && clientEmail) {
      // Always fetch company + shared email infra
      const [templateSetting, company, fromEmail, tenantName] = await Promise.all([
        adminClient
          .from('company_settings')
          .select('setting_value')
          .eq('company_id', companyId)
          .eq('setting_key', 'field_map_quote_template_id')
          .maybeSingle()
          .then(r => r.data),
        adminClient
          .from('companies')
          .select('id, name, slug, email, phone, website')
          .eq('id', companyId)
          .single()
          .then(r => r.data),
        getCompanyFromEmail(companyId),
        getCompanyTenantName(companyId),
      ]);

      let htmlContent: string | null = null;
      let subjectLine = `Field Inspection Quote \u2014 ${clientName} | ${address}`;

      // ── Path A: custom company email template ──────────────────────────────
      if (templateSetting?.setting_value) {
        const [emailTemplate, customer, brandData, logoOverrideSetting, reviewsSetting, quoteRecord] =
          await Promise.all([
            adminClient
              .from('email_templates')
              .select('subject_line, html_content, text_content')
              .eq('id', templateSetting.setting_value)
              .maybeSingle()
              .then(r => r.data),
            adminClient
              .from('customers')
              .select('first_name, last_name, email, phone')
              .eq('id', customerId)
              .single()
              .then(r => r.data),
            adminClient
              .from('brands')
              .select('logo_url, primary_color_hex, secondary_color_hex')
              .eq('company_id', companyId)
              .single()
              .then(r => r.data),
            adminClient
              .from('company_settings')
              .select('setting_value')
              .eq('company_id', companyId)
              .eq('setting_key', 'logo_override_url')
              .single()
              .then(r => r.data),
            adminClient
              .from('company_settings')
              .select('setting_value')
              .eq('company_id', companyId)
              .eq('setting_key', 'google_reviews_data')
              .single()
              .then(r => r.data),
            adminClient
              .from('quotes')
              .select('*, line_items:quote_line_items(*)')
              .eq('lead_id', lead.id)
              .single()
              .then(r => r.data),
          ]);

        if (emailTemplate?.html_content && customer) {
          const formatCurrency = (amount: number) =>
            new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);

          const companyLogoUrl = logoOverrideSetting?.setting_value || brandData?.logo_url || '';

          let reviewsData: { rating?: number; reviewCount?: number } | null = null;
          try {
            if (reviewsSetting?.setting_value && reviewsSetting.setting_value !== '{}') {
              reviewsData = JSON.parse(reviewsSetting.setting_value);
            }
          } catch { /* ignore */ }

          const quoteUrlPath = quoteRecord?.quote_url ?? '';
          const quoteRecordToken = quoteRecord?.quote_token ?? '';
          const fullQuoteUrl = quoteUrlPath && quoteRecordToken
            ? `${getFullQuoteUrl(quoteUrlPath)}${quoteUrlPath.includes('?') ? '&' : '?'}token=${quoteRecordToken}`
            : '';

          const quoteLineItems = quoteRecord?.line_items?.length > 0
            ? '<ul style="list-style: none; padding: 0; margin: 0;">' +
              quoteRecord.line_items.map((item: any) => {
                const freq = item.service_frequency
                  ? ` - ${item.service_frequency.charAt(0).toUpperCase()}${item.service_frequency.slice(1)}`
                  : '';
                return `<li style="margin-bottom:12px;padding:12px;background:#f9fafb;border-radius:8px;">
                  <strong>${item.plan_name}</strong>${freq}<br>
                  <span style="color:#6b7280;font-size:14px;">
                    ${formatCurrency(item.final_initial_price || item.initial_price || 0)} initial,
                    ${formatCurrency(item.final_recurring_price || item.recurring_price || 0)}/mo recurring
                  </span>
                </li>`;
              }).join('')
              + '</ul>'
            : 'No services selected';

          const variables: Record<string, string> = {
            customerName: `${customer.first_name} ${customer.last_name}`,
            firstName: customer.first_name || '',
            lastName: customer.last_name || '',
            customerEmail: customer.email || '',
            customerPhone: customer.phone || '',
            companyName: company?.name || '',
            companyEmail: company?.email || '',
            companyPhone: company?.phone || '',
            companyWebsite: company?.website || '',
            companyLogo: companyLogoUrl,
            quoteId: quoteRecord?.id || '',
            quoteUrl: fullQuoteUrl,
            quoteTotalInitialPrice: formatCurrency(quoteRecord?.total_initial_price || 0),
            quoteTotalRecurringPrice: formatCurrency(quoteRecord?.total_recurring_price || 0),
            quoteLineItems,
            quotePestConcerns: pestSummary,
            quoteHomeSize: quoteRecord?.home_size_range ? formatHomeSizeRange(quoteRecord.home_size_range) : 'Not specified',
            quoteYardSize: quoteRecord?.yard_size_range ? formatYardSizeRange(quoteRecord.yard_size_range) : 'Not specified',
            address,
            streetAddress: address,
            city: '',
            state: '',
            zipCode: '',
            requestedDate: 'Not specified',
            requestedTime: 'Not specified',
            brandPrimaryColor: brandData?.primary_color_hex || '',
            brandSecondaryColor: brandData?.secondary_color_hex || '',
            googleRating: reviewsData?.rating?.toString() || '',
            googleReviewCount: reviewsData?.reviewCount?.toString() || '',
            inspectorName: inspectorName ?? 'Inspector',
            pestTypes: pestSummary,
            notes: notes ?? '',
          };

          htmlContent = emailTemplate.html_content;
          subjectLine = emailTemplate.subject_line || subjectLine;

          Object.entries(variables).forEach(([key, value]) => {
            const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
            htmlContent = htmlContent!.replace(regex, value);
            subjectLine = subjectLine.replace(regex, value);
          });
        }
      }

      // ── Path B: built-in fallback template (no custom template configured) ─
      if (!htmlContent) {
        htmlContent = generateFieldMapQuoteEmailTemplate({
          inspectorName: inspectorName ?? 'Inspector',
          clientName,
          clientAddress: address,
          quoteLineItems: lineItems,
          totalInitial,
          totalRecurring,
          billingFrequency,
          pestTypes: Array.isArray(pestTypes) ? pestTypes : [],
          notes: notes ?? '',
          companyName: company?.name || bodyCompanyName || 'FieldMap',
        });
      }

      // ── Send via the provider-aware router (SES or MailerSend) ────────────
      await sendEmailRouted({
        tenantName,
        from: fromEmail,
        fromName: company?.name || bodyCompanyName || 'FieldMap',
        to: QUOTE_RECIPIENT, // TODO: switch to clientEmail when ready for production
        subject: subjectLine,
        html: htmlContent,
        companyId,
        source: 'field_map',
      });

      emailSent = true;
    }

    return NextResponse.json({ success: true, leadId: lead.id, emailSent });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
