import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';

// DELETE: Delete a quote line item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Line item ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get the line item to find the quote_id
    const { data: lineItem } = await supabase
      .from('quote_line_items')
      .select('quote_id')
      .eq('id', id)
      .single();

    if (!lineItem) {
      return NextResponse.json(
        { error: 'Line item not found' },
        { status: 404 }
      );
    }

    // Delete the line item
    const { error } = await supabase
      .from('quote_line_items')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting line item:', error);
      return NextResponse.json(
        { error: 'Failed to delete line item' },
        { status: 500 }
      );
    }

    // Recalculate quote totals
    const { data: remainingLineItems } = await supabase
      .from('quote_line_items')
      .select('final_initial_price, final_recurring_price')
      .eq('quote_id', lineItem.quote_id);

    if (remainingLineItems) {
      const totalInitialPrice = remainingLineItems.reduce(
        (sum: number, item: any) => sum + (item.final_initial_price || 0),
        0
      );
      const totalRecurringPrice = remainingLineItems.reduce(
        (sum: number, item: any) => sum + (item.final_recurring_price || 0),
        0
      );

      await supabase
        .from('quotes')
        .update({
          total_initial_price: totalInitialPrice,
          total_recurring_price: totalRecurringPrice,
        })
        .eq('id', lineItem.quote_id);
    }

    return NextResponse.json({
      success: true,
      message: 'Line item deleted successfully',
    });
  } catch (error) {
    console.error('Error in line item DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
