import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

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
      .select('final_initial_price, final_recurring_price')
      .eq('quote_id', quoteId);

    if (remainingItems) {
      const totalInitialPrice = remainingItems.reduce(
        (sum, item) => sum + (item.final_initial_price || 0),
        0
      );
      const totalRecurringPrice = remainingItems.reduce(
        (sum, item) => sum + (item.final_recurring_price || 0),
        0
      );

      // Update quote totals
      await supabase
        .from('quotes')
        .update({
          total_initial_price: totalInitialPrice,
          total_recurring_price: totalRecurringPrice,
        })
        .eq('id', quoteId);
    }

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
