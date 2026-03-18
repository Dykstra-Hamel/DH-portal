import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

/**
 * Public endpoint for customers to toggle optional line items on/off.
 * Token-protected — no authentication required.
 *
 * PATCH body: { token: string, is_selected: boolean }
 * Returns updated quote totals so the client can re-render pricing.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineItemId: string }> }
) {
  try {
    const { id: quoteId, lineItemId } = await params;
    const body = await request.json();

    if (!body.token) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 403 });
    }

    if (typeof body.is_selected !== 'boolean') {
      return NextResponse.json({ error: 'is_selected (boolean) is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Validate token against quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('id, quote_token, token_expires_at, quote_status')
      .eq('id', quoteId)
      .single();

    if (quoteError || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (quote.quote_token !== body.token) {
      return NextResponse.json({ error: 'Invalid access token' }, { status: 403 });
    }

    if (quote.token_expires_at && new Date(quote.token_expires_at) < new Date()) {
      return NextResponse.json({ error: 'Access token has expired' }, { status: 403 });
    }

    if (quote.quote_status === 'accepted' || quote.quote_status === 'completed') {
      return NextResponse.json({ error: 'This quote has already been accepted' }, { status: 400 });
    }

    // Verify line item belongs to this quote and is optional
    const { data: lineItem, error: lineItemError } = await supabase
      .from('quote_line_items')
      .select('id, quote_id, is_optional')
      .eq('id', lineItemId)
      .eq('quote_id', quoteId)
      .single();

    if (lineItemError || !lineItem) {
      return NextResponse.json({ error: 'Line item not found' }, { status: 404 });
    }

    if (!lineItem.is_optional) {
      return NextResponse.json(
        { error: 'This line item is required and cannot be toggled' },
        { status: 400 }
      );
    }

    // Toggle selection
    const { error: updateError } = await supabase
      .from('quote_line_items')
      .update({ is_selected: body.is_selected })
      .eq('id', lineItemId);

    if (updateError) {
      console.error('Error updating line item selection:', updateError);
      return NextResponse.json({ error: 'Failed to update line item' }, { status: 500 });
    }

    // Recalculate quote totals based on selected items only
    const { data: selectedItems } = await supabase
      .from('quote_line_items')
      .select('final_initial_price, final_recurring_price')
      .eq('quote_id', quoteId)
      .eq('is_selected', true);

    const totalInitialPrice = (selectedItems || []).reduce(
      (sum, item) => sum + (item.final_initial_price || 0),
      0
    );
    const totalRecurringPrice = (selectedItems || []).reduce(
      (sum, item) => sum + (item.final_recurring_price || 0),
      0
    );

    await supabase
      .from('quotes')
      .update({ total_initial_price: totalInitialPrice, total_recurring_price: totalRecurringPrice })
      .eq('id', quoteId);

    return NextResponse.json({
      success: true,
      data: {
        line_item_id: lineItemId,
        is_selected: body.is_selected,
        total_initial_price: totalInitialPrice,
        total_recurring_price: totalRecurringPrice,
      },
    });
  } catch (error) {
    console.error('Error in public line item PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
