import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { UpdateQuoteRequest } from '@/types/quote';
import {
  generateHomeSizeOptions,
  generateYardSizeOptions,
  findSizeOptionByValue,
} from '@/lib/pricing-calculations';

/**
 * Helper function to parse a size range string (e.g., "1500-2000" or "3000+")
 * Returns the starting value for interval calculation
 */
function parseRangeValue(rangeString?: string): number {
  if (!rangeString) return 0;

  // Handle "3000+" format
  if (rangeString.includes('+')) {
    return parseFloat(rangeString.replace('+', ''));
  }

  // Handle "1500-2000" format - return the start value
  const parts = rangeString.split('-');
  return parseFloat(parts[0]);
}

/**
 * Recalculates all line item prices when size ranges change
 */
async function recalculateAllLineItemPrices(
  supabase: any,
  quoteId: string,
  newHomeSize?: string,
  newYardSize?: string
) {
  // Fetch quote with company_id and current size ranges
  const { data: quote } = await supabase
    .from('quotes')
    .select('company_id, home_size_range, yard_size_range')
    .eq('id', quoteId)
    .single();

  if (!quote) return;

  const homeSizeRange = newHomeSize !== undefined ? newHomeSize : quote.home_size_range;
  const yardSizeRange = newYardSize !== undefined ? newYardSize : quote.yard_size_range;

  // Fetch pricing settings
  const { data: pricingSettings } = await supabase
    .from('company_pricing_settings')
    .select('*')
    .eq('company_id', quote.company_id)
    .single();

  if (!pricingSettings) return;

  // Fetch all line items for this quote
  const { data: lineItems } = await supabase
    .from('quote_line_items')
    .select('*, service_plan:service_plans(*)')
    .eq('quote_id', quoteId);

  if (!lineItems || lineItems.length === 0) return;

  // Recalculate each line item
  for (const lineItem of lineItems) {
    const servicePlan = lineItem.service_plan;
    if (!servicePlan) continue;

    const baseInitialPrice = servicePlan.initial_price || 0;
    const baseRecurringPrice = servicePlan.recurring_price || 0;

    let homeInitialIncrease = 0;
    let homeRecurringIncrease = 0;
    let yardInitialIncrease = 0;
    let yardRecurringIncrease = 0;

    if (servicePlan.home_size_pricing && servicePlan.yard_size_pricing) {
      const homeRangeValue = parseRangeValue(homeSizeRange);
      const yardRangeValue = parseRangeValue(yardSizeRange);

      const servicePlanPricing = {
        home_size_pricing: servicePlan.home_size_pricing,
        yard_size_pricing: servicePlan.yard_size_pricing,
      };

      const homeOptions = generateHomeSizeOptions(pricingSettings, servicePlanPricing);
      const yardOptions = generateYardSizeOptions(pricingSettings, servicePlanPricing);

      const homeSizeOption = findSizeOptionByValue(homeRangeValue, homeOptions);
      const yardSizeOption = findSizeOptionByValue(yardRangeValue, yardOptions);

      homeInitialIncrease = homeSizeOption?.initialIncrease || 0;
      homeRecurringIncrease = homeSizeOption?.recurringIncrease || 0;
      yardInitialIncrease = yardSizeOption?.initialIncrease || 0;
      yardRecurringIncrease = yardSizeOption?.recurringIncrease || 0;
    }

    const initialPriceWithSize = baseInitialPrice + homeInitialIncrease + yardInitialIncrease;
    const recurringPriceWithSize = baseRecurringPrice + homeRecurringIncrease + yardRecurringIncrease;

    // Apply existing discounts
    const discountAmount = lineItem.discount_amount || 0;
    const discountPercentage = lineItem.discount_percentage || 0;

    let finalInitialPrice = initialPriceWithSize - discountAmount;
    if (discountPercentage > 0) {
      finalInitialPrice = finalInitialPrice * (1 - discountPercentage / 100);
    }

    let finalRecurringPrice = recurringPriceWithSize - discountAmount;
    if (discountPercentage > 0) {
      finalRecurringPrice = finalRecurringPrice * (1 - discountPercentage / 100);
    }

    // Update the line item
    await supabase
      .from('quote_line_items')
      .update({
        initial_price: initialPriceWithSize,
        recurring_price: recurringPriceWithSize,
        final_initial_price: Math.max(0, finalInitialPrice),
        final_recurring_price: Math.max(0, finalRecurringPrice),
      })
      .eq('id', lineItem.id);
  }

  // Recalculate quote totals
  const { data: updatedLineItems } = await supabase
    .from('quote_line_items')
    .select('final_initial_price, final_recurring_price')
    .eq('quote_id', quoteId);

  if (updatedLineItems) {
    const totalInitialPrice = updatedLineItems.reduce((sum: number, item: any) => sum + (item.final_initial_price || 0), 0);
    const totalRecurringPrice = updatedLineItems.reduce((sum: number, item: any) => sum + (item.final_recurring_price || 0), 0);

    await supabase
      .from('quotes')
      .update({
        total_initial_price: totalInitialPrice,
        total_recurring_price: totalRecurringPrice,
      })
      .eq('id', quoteId);
  }
}

// GET: Fetch a specific quote by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Fetch the quote with line items
    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`
        *,
        line_items:quote_line_items(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Quote not found' },
          { status: 404 }
        );
      }

      console.error('Error fetching quote:', error);
      return NextResponse.json(
        { error: 'Failed to fetch quote' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error('Error in quote GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update a quote
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body: UpdateQuoteRequest & { home_size_range?: string; yard_size_range?: string } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Prepare update data
    const updateData: any = {};

    if (body.quote_status) {
      updateData.quote_status = body.quote_status;
    }

    if (body.valid_until !== undefined) {
      updateData.valid_until = body.valid_until;
    }

    // Update pest data if provided
    if (body.primary_pest !== undefined) {
      updateData.primary_pest = body.primary_pest;
    }

    if (body.additional_pests !== undefined) {
      updateData.additional_pests = body.additional_pests;
    }

    // Update size ranges if provided
    if (body.home_size_range !== undefined) {
      updateData.home_size_range = body.home_size_range;
    }

    if (body.yard_size_range !== undefined) {
      updateData.yard_size_range = body.yard_size_range;
    }

    // Update quote if there's data to update
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await supabase
        .from('quotes')
        .update(updateData)
        .eq('id', id);

      if (updateError) {
        console.error('Error updating quote:', updateError);
        return NextResponse.json(
          { error: 'Failed to update quote' },
          { status: 500 }
        );
      }

      // Bi-directional sync: If size ranges updated, also update service_address
      if ((body.home_size_range !== undefined || body.yard_size_range !== undefined)) {
        // Fetch quote to get service_address_id
        const { data: quote } = await supabase
          .from('quotes')
          .select('service_address_id')
          .eq('id', id)
          .single();

        if (quote && quote.service_address_id) {
          const addressUpdate: any = {};

          if (body.home_size_range !== undefined) {
            addressUpdate.home_size_range = body.home_size_range;
          }

          if (body.yard_size_range !== undefined) {
            addressUpdate.yard_size_range = body.yard_size_range;
          }

          // Update service address (silently fail if error - quote is already updated)
          await supabase
            .from('service_addresses')
            .update(addressUpdate)
            .eq('id', quote.service_address_id);
        }
      }

      // Recalculate ALL line items' prices if size ranges changed
      if ((body.home_size_range !== undefined || body.yard_size_range !== undefined)) {
        await recalculateAllLineItemPrices(supabase, id, body.home_size_range, body.yard_size_range);
      }
    }

    // Update line items if provided
    if (body.line_items && body.line_items.length > 0) {
      // Fetch the quote to get company_id and size ranges
      const { data: quote } = await supabase
        .from('quotes')
        .select('company_id, home_size_range, yard_size_range')
        .eq('id', id)
        .single();

      if (!quote) {
        return NextResponse.json(
          { error: 'Quote not found' },
          { status: 404 }
        );
      }

      // Get size ranges from body or existing quote
      const homeSizeRange = body.home_size_range || quote.home_size_range;
      const yardSizeRange = body.yard_size_range || quote.yard_size_range;

      // Fetch company pricing settings for interval calculations
      const { data: pricingSettings } = await supabase
        .from('company_pricing_settings')
        .select('*')
        .eq('company_id', quote.company_id)
        .single();

      // Process line items
      for (const lineItem of body.line_items) {
        if (lineItem.id && lineItem.service_plan_id) {
          // If updating existing line item with new service plan, delete and recreate
          await supabase
            .from('quote_line_items')
            .delete()
            .eq('id', lineItem.id);

          // Create new line item with the new service plan
          const { data: servicePlan } = await supabase
            .from('service_plans')
            .select('*')
            .eq('id', lineItem.service_plan_id)
            .single();

          if (servicePlan) {
            const baseInitialPrice = servicePlan.initial_price || 0;
            const baseRecurringPrice = servicePlan.recurring_price || 0;

            // Calculate size-based price increases if pricing settings exist
            let homeInitialIncrease = 0;
            let homeRecurringIncrease = 0;
            let yardInitialIncrease = 0;
            let yardRecurringIncrease = 0;

            if (pricingSettings && servicePlan.home_size_pricing && servicePlan.yard_size_pricing) {
              const homeRangeValue = parseRangeValue(homeSizeRange);
              const yardRangeValue = parseRangeValue(yardSizeRange);

              const servicePlanPricing = {
                home_size_pricing: servicePlan.home_size_pricing,
                yard_size_pricing: servicePlan.yard_size_pricing,
              };

              const homeOptions = generateHomeSizeOptions(pricingSettings, servicePlanPricing);
              const yardOptions = generateYardSizeOptions(pricingSettings, servicePlanPricing);

              const homeSizeOption = findSizeOptionByValue(homeRangeValue, homeOptions);
              const yardSizeOption = findSizeOptionByValue(yardRangeValue, yardOptions);

              homeInitialIncrease = homeSizeOption?.initialIncrease || 0;
              homeRecurringIncrease = homeSizeOption?.recurringIncrease || 0;
              yardInitialIncrease = yardSizeOption?.initialIncrease || 0;
              yardRecurringIncrease = yardSizeOption?.recurringIncrease || 0;
            }

            const initialPriceWithSize = baseInitialPrice + homeInitialIncrease + yardInitialIncrease;
            const recurringPriceWithSize = baseRecurringPrice + homeRecurringIncrease + yardRecurringIncrease;

            const discountAmount = lineItem.discount_amount || 0;
            const discountPercentage = lineItem.discount_percentage || 0;

            let finalInitialPrice = initialPriceWithSize - discountAmount;
            if (discountPercentage > 0) {
              finalInitialPrice = finalInitialPrice * (1 - discountPercentage / 100);
            }

            let finalRecurringPrice = recurringPriceWithSize - discountAmount;
            if (discountPercentage > 0) {
              finalRecurringPrice = finalRecurringPrice * (1 - discountPercentage / 100);
            }

            await supabase
              .from('quote_line_items')
              .insert({
                quote_id: id,
                service_plan_id: servicePlan.id,
                plan_name: servicePlan.plan_name,
                plan_description: servicePlan.plan_description,
                initial_price: initialPriceWithSize,
                recurring_price: recurringPriceWithSize,
                billing_frequency: servicePlan.billing_frequency,
                discount_percentage: discountPercentage,
                discount_amount: discountAmount,
                final_initial_price: Math.max(0, finalInitialPrice),
                final_recurring_price: Math.max(0, finalRecurringPrice),
                display_order: lineItem.display_order || 0,
              });
          }
        } else if (lineItem.id) {
          // Update existing line item (only discounts/display order, no service plan change)
          const updateLineItemData: any = {};

          if (lineItem.discount_percentage !== undefined) {
            updateLineItemData.discount_percentage = lineItem.discount_percentage;
          }

          if (lineItem.discount_amount !== undefined) {
            updateLineItemData.discount_amount = lineItem.discount_amount;
          }

          if (lineItem.display_order !== undefined) {
            updateLineItemData.display_order = lineItem.display_order;
          }

          // Recalculate final prices if discounts changed
          if (lineItem.discount_percentage !== undefined || lineItem.discount_amount !== undefined) {
            const { data: existingLineItem } = await supabase
              .from('quote_line_items')
              .select('initial_price, recurring_price')
              .eq('id', lineItem.id)
              .single();

            if (existingLineItem) {
              const discountAmount = lineItem.discount_amount || 0;
              const discountPercentage = lineItem.discount_percentage || 0;

              let finalInitialPrice = existingLineItem.initial_price - discountAmount;
              if (discountPercentage > 0) {
                finalInitialPrice = finalInitialPrice * (1 - discountPercentage / 100);
              }

              let finalRecurringPrice = existingLineItem.recurring_price - discountAmount;
              if (discountPercentage > 0) {
                finalRecurringPrice = finalRecurringPrice * (1 - discountPercentage / 100);
              }

              updateLineItemData.final_initial_price = Math.max(0, finalInitialPrice);
              updateLineItemData.final_recurring_price = Math.max(0, finalRecurringPrice);
            }
          }

          if (Object.keys(updateLineItemData).length > 0) {
            await supabase
              .from('quote_line_items')
              .update(updateLineItemData)
              .eq('id', lineItem.id);
          }
        } else if (lineItem.service_plan_id) {
          // Add new line item with size-based pricing
          const { data: servicePlan } = await supabase
            .from('service_plans')
            .select('*')
            .eq('id', lineItem.service_plan_id)
            .single();

          if (servicePlan) {
            const baseInitialPrice = servicePlan.initial_price || 0;
            const baseRecurringPrice = servicePlan.recurring_price || 0;

            // Calculate size-based price increases if pricing settings exist
            let homeInitialIncrease = 0;
            let homeRecurringIncrease = 0;
            let yardInitialIncrease = 0;
            let yardRecurringIncrease = 0;

            if (pricingSettings && servicePlan.home_size_pricing && servicePlan.yard_size_pricing) {
              // Parse range values
              const homeRangeValue = parseRangeValue(homeSizeRange);
              const yardRangeValue = parseRangeValue(yardSizeRange);

              // Generate options to find interval indices
              const servicePlanPricing = {
                home_size_pricing: servicePlan.home_size_pricing,
                yard_size_pricing: servicePlan.yard_size_pricing,
              };

              const homeOptions = generateHomeSizeOptions(pricingSettings, servicePlanPricing);
              const yardOptions = generateYardSizeOptions(pricingSettings, servicePlanPricing);

              // Find appropriate options
              const homeSizeOption = findSizeOptionByValue(homeRangeValue, homeOptions);
              const yardSizeOption = findSizeOptionByValue(yardRangeValue, yardOptions);

              // Get price increases
              homeInitialIncrease = homeSizeOption?.initialIncrease || 0;
              homeRecurringIncrease = homeSizeOption?.recurringIncrease || 0;
              yardInitialIncrease = yardSizeOption?.initialIncrease || 0;
              yardRecurringIncrease = yardSizeOption?.recurringIncrease || 0;
            }

            // Calculate prices with size increases
            const initialPriceWithSize = baseInitialPrice + homeInitialIncrease + yardInitialIncrease;
            const recurringPriceWithSize = baseRecurringPrice + homeRecurringIncrease + yardRecurringIncrease;

            // Apply discounts
            const discountAmount = lineItem.discount_amount || 0;
            const discountPercentage = lineItem.discount_percentage || 0;

            let finalInitialPrice = initialPriceWithSize - discountAmount;
            if (discountPercentage > 0) {
              finalInitialPrice = finalInitialPrice * (1 - discountPercentage / 100);
            }

            let finalRecurringPrice = recurringPriceWithSize - discountAmount;
            if (discountPercentage > 0) {
              finalRecurringPrice = finalRecurringPrice * (1 - discountPercentage / 100);
            }

            await supabase
              .from('quote_line_items')
              .insert({
                quote_id: id,
                service_plan_id: servicePlan.id,
                plan_name: servicePlan.plan_name,
                plan_description: servicePlan.plan_description,
                initial_price: initialPriceWithSize,
                recurring_price: recurringPriceWithSize,
                billing_frequency: servicePlan.billing_frequency,
                discount_percentage: discountPercentage,
                discount_amount: discountAmount,
                final_initial_price: Math.max(0, finalInitialPrice),
                final_recurring_price: Math.max(0, finalRecurringPrice),
                display_order: lineItem.display_order || 0,
              });
          }
        }
      }

      // Recalculate quote totals
      const { data: lineItems } = await supabase
        .from('quote_line_items')
        .select('final_initial_price, final_recurring_price')
        .eq('quote_id', id);

      if (lineItems) {
        const totalInitialPrice = lineItems.reduce((sum, item) => sum + (item.final_initial_price || 0), 0);
        const totalRecurringPrice = lineItems.reduce((sum, item) => sum + (item.final_recurring_price || 0), 0);

        await supabase
          .from('quotes')
          .update({
            total_initial_price: totalInitialPrice,
            total_recurring_price: totalRecurringPrice,
          })
          .eq('id', id);
      }
    }

    // Fetch the updated quote with line items
    const { data: updatedQuote } = await supabase
      .from('quotes')
      .select(`
        *,
        line_items:quote_line_items(*)
      `)
      .eq('id', id)
      .single();

    return NextResponse.json({
      success: true,
      data: updatedQuote,
      message: 'Quote updated successfully',
    });
  } catch (error) {
    console.error('Error in quote PUT:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a quote
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Quote ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Delete the quote (cascade will handle line items)
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting quote:', error);
      return NextResponse.json(
        { error: 'Failed to delete quote' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Quote deleted successfully',
    });
  } catch (error) {
    console.error('Error in quote DELETE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}