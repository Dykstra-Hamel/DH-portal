import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { toMonthlyEquivalent } from '@/lib/pricing-calculations';

/**
 * POST: Insert a new line item and recalculate quote totals
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quoteId } = await params;
    const body = await request.json();

    const { service_plan_id, plan_name, initial_price, recurring_price, billing_frequency, display_order } = body;

    if (!plan_name) {
      return NextResponse.json({ error: 'plan_name is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify the quote exists
    const { data: quote } = await supabase
      .from('quotes')
      .select('id')
      .eq('id', quoteId)
      .single();

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    const newId = crypto.randomUUID();

    await supabase.from('quote_line_items').insert({
      id: newId,
      quote_id: quoteId,
      service_plan_id: service_plan_id ?? null,
      plan_name,
      initial_price: initial_price ?? 0,
      recurring_price: recurring_price ?? 0,
      billing_frequency: billing_frequency ?? 'monthly',
      display_order: display_order ?? 0,
      final_initial_price: initial_price ?? 0,
      final_recurring_price: recurring_price ?? 0,
      is_optional: false,
      is_selected: true,
      is_recommended: null,
    });

    // Recalculate totals from selected items
    const { data: selectedItems } = await supabase
      .from('quote_line_items')
      .select('initial_price, recurring_price, billing_frequency')
      .eq('quote_id', quoteId)
      .eq('is_selected', true);

    const subtotalInitialPrice = (selectedItems ?? []).reduce(
      (s, i) => s + (i.initial_price || 0),
      0
    );
    const subtotalRecurringPrice = (selectedItems ?? []).reduce(
      (s, i) => s + toMonthlyEquivalent(i.billing_frequency, i.recurring_price || 0),
      0
    );

    // Fetch the quote's applied discount to compute exact totals
    const { data: quoteData } = await supabase
      .from('quotes')
      .select('applied_discount_id')
      .eq('id', quoteId)
      .single();

    let totalInitialPrice = subtotalInitialPrice;
    let totalRecurringPrice = subtotalRecurringPrice;

    if (quoteData?.applied_discount_id) {
      const { data: discount } = await supabase
        .from('company_discounts')
        .select('discount_type, discount_value, applies_to_price, recurring_discount_type, recurring_discount_value')
        .eq('id', quoteData.applied_discount_id)
        .single();

      if (discount) {
        if (discount.applies_to_price === 'initial' || discount.applies_to_price === 'both') {
          const dollarOff = discount.discount_type === 'percentage'
            ? (subtotalInitialPrice * discount.discount_value) / 100
            : discount.discount_value;
          totalInitialPrice = Math.max(0, subtotalInitialPrice - dollarOff);
        }
        if (discount.applies_to_price === 'recurring' || discount.applies_to_price === 'both') {
          const recurringType = discount.recurring_discount_type ?? discount.discount_type;
          const recurringValue = discount.recurring_discount_value ?? discount.discount_value;
          const dollarOff = recurringType === 'percentage'
            ? (subtotalRecurringPrice * recurringValue) / 100
            : recurringValue;
          totalRecurringPrice = Math.max(0, subtotalRecurringPrice - dollarOff);
        }
      }
    }

    await supabase
      .from('quotes')
      .update({
        subtotal_initial_price: subtotalInitialPrice,
        subtotal_recurring_price: subtotalRecurringPrice,
        total_initial_price: totalInitialPrice,
        total_recurring_price: totalRecurringPrice,
      })
      .eq('id', quoteId);

    return NextResponse.json({ success: true, id: newId, lineItemId: newId });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
