import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { generateQuoteToken, generateQuoteUrl } from '@/lib/quote-utils';
import { toMonthlyEquivalent } from '@/lib/pricing-calculations';

interface QuoteLineItem {
  id: string;
  type: 'plan-addon' | 'custom';
  catalogItemKind?: 'plan' | 'addon' | 'bundle' | 'product';
  catalogItemId?: string;
  catalogItemName?: string;
  customName?: string;
  coveredPestLabels: string[];
  initialCost: number | null;
  recurringCost: number | null;
  frequency: string | null;
  parentLineItemId?: string | null;
  quantity?: number | null;
  // true = inspector highlighted, false = auto-added recommended, undefined = not a recommended slot
  isRecommended?: boolean;
  isSelected?: boolean;
}

function getLineItemLabel(item: QuoteLineItem): string {
  if (item.type === 'plan-addon') return item.catalogItemName || 'Service';
  if (item.customName?.trim()) return item.customName.trim();
  if (item.coveredPestLabels?.length > 0) return item.coveredPestLabels.join(', ') + ' Treatment';
  return 'Custom Service';
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
      leadId,
      companyId: bodyCompanyId,
      quoteLineItems,
      discountTarget,
      discountAmount,
      discountType,
      discountId,
      quoteStatus,
    } = body;

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
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

    // Fetch lead to get customer_id + service_address_id + pest_type
    const { data: lead } = await adminClient
      .from('leads')
      .select('customer_id, service_address_id, pest_type')
      .eq('id', leadId)
      .single();

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Line items
    const lineItems: QuoteLineItem[] = Array.isArray(quoteLineItems) ? quoteLineItems : [];
    const billableItems = lineItems.filter(item => item.isSelected !== false);

    const totalInitial = billableItems.reduce((s, i) => s + (i.initialCost ?? 0), 0);
    const totalRecurring = billableItems.reduce(
      (s, i) => s + toMonthlyEquivalent(i.frequency, i.recurringCost ?? 0),
      0
    );

    const discountAmt = typeof discountAmount === 'number' ? discountAmount : null;
    const discountDollarInitial =
      discountAmt != null && (discountTarget === 'initial' || discountTarget === 'both')
        ? discountType === '%'
          ? (totalInitial * discountAmt) / 100
          : discountAmt
        : 0;
    const discountDollarRecurring =
      discountAmt != null && (discountTarget === 'recurring' || discountTarget === 'both')
        ? discountType === '%'
          ? (totalRecurring * discountAmt) / 100
          : discountAmt
        : 0;
    const adjustedInitial = Math.max(0, totalInitial - discountDollarInitial);
    const adjustedRecurring = Math.max(0, totalRecurring - discountDollarRecurring);

    // Check for existing quote on this lead
    const { data: existingQuote } = await adminClient
      .from('quotes')
      .select('id')
      .eq('lead_id', leadId)
      .maybeSingle();

    let quoteId: string;

    if (existingQuote?.id) {
      // Update totals
      const { error: updateError } = await adminClient
        .from('quotes')
        .update({
          subtotal_initial_price: totalInitial,
          subtotal_recurring_price: totalRecurring,
          total_initial_price: adjustedInitial,
          total_recurring_price: adjustedRecurring,
          applied_discount_id: discountId ?? null,
          ...(quoteStatus != null ? { quote_status: quoteStatus } : {}),
        })
        .eq('id', existingQuote.id);

      if (updateError) {
        console.error('Failed to update quote:', updateError.message);
        throw new Error(updateError.message);
      }

      // Delete old line items and re-insert
      await adminClient.from('quote_line_items').delete().eq('quote_id', existingQuote.id);
      quoteId = existingQuote.id;
    } else {
      // Insert new quote
      const quoteToken = generateQuoteToken();
      const { data: newQuote, error: quoteError } = await adminClient
        .from('quotes')
        .insert({
          lead_id: leadId,
          company_id: companyId,
          customer_id: lead.customer_id,
          service_address_id: lead.service_address_id,
          primary_pest: lead.pest_type ?? '',
          additional_pests: [],
          subtotal_initial_price: totalInitial,
          subtotal_recurring_price: totalRecurring,
          total_initial_price: adjustedInitial,
          total_recurring_price: adjustedRecurring,
          applied_discount_id: discountId ?? null,
          quote_status: quoteStatus ?? 'draft',
          quote_token: quoteToken,
        })
        .select('id')
        .single();

      if (quoteError || !newQuote?.id) {
        return NextResponse.json({ error: 'Failed to create quote' }, { status: 500 });
      }
      quoteId = newQuote.id;

      // Generate and store quote URL
      const { data: companySlug } = await adminClient
        .from('companies')
        .select('slug')
        .eq('id', companyId)
        .single();

      if (companySlug?.slug) {
        const quoteUrl = generateQuoteUrl(companySlug.slug, quoteId, quoteToken);
        await adminClient.from('quotes').update({ quote_url: quoteUrl }).eq('id', quoteId);
      }
    }

    // Insert line items
    if (lineItems.length > 0) {
      const { error: lineItemsError } = await adminClient.from('quote_line_items').insert(
        lineItems.map((item, idx) => {
          const planName = getLineItemLabel(item);
          const servicePlanId =
            item.type === 'plan-addon' && item.catalogItemKind === 'plan'
              ? (item.catalogItemId ?? null)
              : null;
          const addonServiceId =
            item.type === 'plan-addon' && item.catalogItemKind === 'addon'
              ? (item.catalogItemId ?? null)
              : null;
          const bundlePlanId =
            item.type === 'plan-addon' && item.catalogItemKind === 'bundle'
              ? (item.catalogItemId ?? null)
              : null;
          const productId =
            item.catalogItemKind === 'product'
              ? (item.catalogItemId ?? null)
              : null;
          const rawInitial = item.initialCost ?? 0;
          const rawRecurring = item.recurringCost ?? 0;
          const finalInitial =
            totalInitial > 0 && discountDollarInitial > 0
              ? Math.max(0, rawInitial * (adjustedInitial / totalInitial))
              : rawInitial;
          const finalRecurring =
            totalRecurring > 0 && discountDollarRecurring > 0
              ? Math.max(0, rawRecurring * (adjustedRecurring / totalRecurring))
              : rawRecurring;
          const lineDiscountInitial =
            totalInitial > 0 && discountDollarInitial > 0
              ? (rawInitial / totalInitial) * discountDollarInitial
              : 0;
          const lineDiscountRecurring =
            totalRecurring > 0 && discountDollarRecurring > 0
              ? (rawRecurring / totalRecurring) * discountDollarRecurring
              : 0;
          return {
            id: item.id,
            quote_id: quoteId,
            service_plan_id: servicePlanId,
            addon_service_id: addonServiceId,
            bundle_plan_id: bundlePlanId,
            product_id: productId,
            plan_name: planName,
            plan_description: null,
            initial_price: rawInitial,
            recurring_price: rawRecurring,
            billing_frequency: item.frequency ?? 'monthly',
            final_initial_price: finalInitial,
            final_recurring_price: finalRecurring,
            discount_percentage: discountType === '%' && discountAmt != null ? discountAmt : 0,
            discount_amount: discountType === '$' ? lineDiscountInitial + lineDiscountRecurring : 0,
            // All recommended add-on slots (isRecommended true or false) are optional and start unselected
            is_optional: item.isRecommended != null,
            is_selected: item.isRecommended == null,
            is_recommended: item.isRecommended ?? null,
            display_order: idx,
            parent_line_item_id: item.parentLineItemId ?? null,
            quantity: item.quantity ?? null,
          };
        })
      );
      if (lineItemsError) {
        console.error('Failed to insert quote line items:', lineItemsError.message, lineItemsError.details);
      }
    }

    // Update lead estimated_value
    await adminClient
      .from('leads')
      .update({ estimated_value: adjustedInitial > 0 ? adjustedInitial : (totalInitial > 0 ? totalInitial : null) })
      .eq('id', leadId);

    return NextResponse.json({
      success: true,
      quoteId,
      subtotalInitialPrice: totalInitial,
      totalInitialPrice: adjustedInitial,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
