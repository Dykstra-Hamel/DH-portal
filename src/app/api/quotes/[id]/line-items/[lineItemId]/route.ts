import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { toMonthlyEquivalent } from '@/lib/pricing-calculations';

/**
 * PATCH: Update is_selected on a quote line item and recalculate quote totals
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineItemId: string }> }
) {
  try {
    const { id: quoteId, lineItemId } = await params;
    const body = await request.json();

    if (typeof body.is_selected !== 'boolean') {
      return NextResponse.json(
        { error: 'is_selected (boolean) is required' },
        { status: 400 }
      );
    }

    const {
      is_selected,
      discount_type: bodyDiscountType,
      discount_value: bodyDiscountValue,
      applies_to_price: bodyAppliesToPrice,
      recurring_discount_type: bodyRecurringDiscountType,
      recurring_discount_value: bodyRecurringDiscountValue,
    } = body;

    const supabase = createAdminClient();

    const { data: lineItem } = await supabase
      .from('quote_line_items')
      .select('id')
      .eq('id', lineItemId)
      .eq('quote_id', quoteId)
      .single();

    if (!lineItem) {
      return NextResponse.json({ error: 'Line item not found' }, { status: 404 });
    }

    await supabase
      .from('quote_line_items')
      .update({ is_selected })
      .eq('id', lineItemId);

    // Recalculate totals from selected items only
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

    let totalInitialPrice = subtotalInitialPrice;
    let totalRecurringPrice = subtotalRecurringPrice;

    if (bodyDiscountType && bodyDiscountValue != null) {
      // Prefer discount passed in request body — always accurate, no extra DB lookup needed
      if (bodyAppliesToPrice === 'initial' || bodyAppliesToPrice === 'both') {
        const dollarOff =
          bodyDiscountType === 'percentage'
            ? (subtotalInitialPrice * bodyDiscountValue) / 100
            : bodyDiscountValue;
        totalInitialPrice = Math.max(0, subtotalInitialPrice - dollarOff);
      }
      if (bodyAppliesToPrice === 'recurring' || bodyAppliesToPrice === 'both') {
        const recurringType = bodyRecurringDiscountType ?? bodyDiscountType;
        const recurringValue = bodyRecurringDiscountValue ?? bodyDiscountValue;
        const dollarOff =
          recurringType === 'percentage'
            ? (subtotalRecurringPrice * recurringValue) / 100
            : recurringValue;
        totalRecurringPrice = Math.max(0, subtotalRecurringPrice - dollarOff);
      }
    } else {
      // Fall back: look up discount from DB via applied_discount_id
      const { data: quote } = await supabase
        .from('quotes')
        .select('applied_discount_id')
        .eq('id', quoteId)
        .single();

      if (quote?.applied_discount_id) {
        const { data: discount } = await supabase
          .from('discounts')
          .select('discount_type, discount_value, applies_to_price, recurring_discount_type, recurring_discount_value')
          .eq('id', quote.applied_discount_id)
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

    return NextResponse.json({
      success: true,
      data: { line_item_id: lineItemId, is_selected: body.is_selected },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE: Delete a quote line item
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineItemId: string }> }
) {
  try {
    const { id: quoteId, lineItemId } = await params;

    if (!quoteId || !lineItemId) {
      return NextResponse.json(
        { success: false, error: 'Quote ID and Line Item ID are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify the line item belongs to this quote
    const { data: lineItem, error: fetchError } = await supabase
      .from('quote_line_items')
      .select('id, quote_id')
      .eq('id', lineItemId)
      .eq('quote_id', quoteId)
      .single();

    if (fetchError || !lineItem) {
      return NextResponse.json(
        { success: false, error: 'Line item not found' },
        { status: 404 }
      );
    }

    // Delete the line item
    const { error: deleteError } = await supabase
      .from('quote_line_items')
      .delete()
      .eq('id', lineItemId);

    if (deleteError) {
      console.error('Error deleting line item:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete line item' },
        { status: 500 }
      );
    }

    // Recalculate quote totals after deletion
    const { data: remainingItems } = await supabase
      .from('quote_line_items')
      .select('initial_price, recurring_price, billing_frequency')
      .eq('quote_id', quoteId)
      .eq('is_selected', true);

    const subtotalInitialPrice = (remainingItems ?? []).reduce(
      (sum, item) => sum + (item.initial_price || 0),
      0
    );
    const subtotalRecurringPrice = (remainingItems ?? []).reduce(
      (sum, item) => sum + toMonthlyEquivalent(item.billing_frequency, item.recurring_price || 0),
      0
    );

    // Fetch the quote's applied discount to compute exact totals
    const { data: quoteForDiscount } = await supabase
      .from('quotes')
      .select('applied_discount_id')
      .eq('id', quoteId)
      .single();

    let totalInitialPrice = subtotalInitialPrice;
    let totalRecurringPrice = subtotalRecurringPrice;

    if (quoteForDiscount?.applied_discount_id) {
      const { data: discount } = await supabase
        .from('discounts')
        .select('discount_type, discount_value, applies_to_price, recurring_discount_type, recurring_discount_value')
        .eq('id', quoteForDiscount.applied_discount_id)
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

    // Update quote totals
    await supabase
      .from('quotes')
      .update({
        subtotal_initial_price: subtotalInitialPrice,
        subtotal_recurring_price: subtotalRecurringPrice,
        total_initial_price: totalInitialPrice,
        total_recurring_price: totalRecurringPrice,
      })
      .eq('id', quoteId);

    return NextResponse.json({
      success: true,
      message: 'Line item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting line item:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
