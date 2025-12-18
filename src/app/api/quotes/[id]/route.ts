import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { UpdateQuoteRequest } from '@/types/quote';
import {
  generateHomeSizeOptions,
  generateYardSizeOptions,
  findSizeOptionByValue,
} from '@/lib/pricing-calculations';
import { logActivity } from '@/lib/activity-logger';

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
    // Skip custom-priced items - they don't get recalculated
    if (lineItem.is_custom_priced) {
      continue;
    }

    const servicePlan = lineItem.service_plan;
    if (!servicePlan) continue;

    const baseInitialPrice = servicePlan.initial_price || 0;
    // For one-time plans, recurring_price should always be 0
    const baseRecurringPrice = servicePlan.plan_category === 'one-time'
      ? 0
      : (servicePlan.recurring_price || 0);

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
      // For one-time plans, never add recurring increases
      homeRecurringIncrease = servicePlan.plan_category === 'one-time' ? 0 : (homeSizeOption?.recurringIncrease || 0);
      yardInitialIncrease = yardSizeOption?.initialIncrease || 0;
      // For one-time plans, never add recurring increases
      yardRecurringIncrease = servicePlan.plan_category === 'one-time' ? 0 : (yardSizeOption?.recurringIncrease || 0);
    }

    const initialPriceWithSize = baseInitialPrice + homeInitialIncrease + yardInitialIncrease;
    const recurringPriceWithSize = baseRecurringPrice + homeRecurringIncrease + yardRecurringIncrease;

    // Apply existing discounts based on applies_to_price
    const discountAmount = lineItem.discount_amount || 0;
    const discountPercentage = lineItem.discount_percentage || 0;

    // Fetch discount configuration if discount_id exists
    let appliesToPrice = 'initial'; // default
    let recurringDiscountAmount = 0;
    let recurringDiscountPercentage = 0;

    if (lineItem.discount_id) {
      const { data: discountConfig } = await supabase
        .from('company_discounts')
        .select('applies_to_price, recurring_discount_type, recurring_discount_value')
        .eq('id', lineItem.discount_id)
        .single();

      if (discountConfig) {
        appliesToPrice = discountConfig.applies_to_price;

        // For 'both' pricing, check if there are separate recurring discount settings
        if (appliesToPrice === 'both' && discountConfig.recurring_discount_type && discountConfig.recurring_discount_value != null) {
          if (discountConfig.recurring_discount_type === 'percentage') {
            recurringDiscountPercentage = discountConfig.recurring_discount_value;
          } else {
            recurringDiscountAmount = discountConfig.recurring_discount_value;
          }
        } else {
          // Use same discount for both
          recurringDiscountAmount = discountAmount;
          recurringDiscountPercentage = discountPercentage;
        }
      }
    }

    let finalInitialPrice = initialPriceWithSize;
    let finalRecurringPrice = recurringPriceWithSize;

    // Apply discount to initial price if applicable
    if (appliesToPrice === 'initial' || appliesToPrice === 'both') {
      finalInitialPrice = finalInitialPrice - discountAmount;
      if (discountPercentage > 0) {
        finalInitialPrice = finalInitialPrice * (1 - discountPercentage / 100);
      }
    }

    // Apply discount to recurring price if applicable
    if (appliesToPrice === 'recurring' || appliesToPrice === 'both') {
      finalRecurringPrice = finalRecurringPrice - recurringDiscountAmount;
      if (recurringDiscountPercentage > 0) {
        finalRecurringPrice = finalRecurringPrice * (1 - recurringDiscountPercentage / 100);
      }
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

    // Fetch existing quote to check if it's signed and get current size ranges
    const { data: existingQuote, error: fetchError } = await supabase
      .from('quotes')
      .select('signed_at, quote_status, home_size_range, yard_size_range')
      .eq('id', id)
      .single();

    if (fetchError || !existingQuote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }

    const isQuoteSigned = existingQuote.signed_at !== null;
    let requiresReset = false;

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
      // Size change requires reset if quote is signed
      if (isQuoteSigned) {
        requiresReset = true;
      }
    }

    if (body.yard_size_range !== undefined) {
      updateData.yard_size_range = body.yard_size_range;
      // Size change requires reset if quote is signed
      if (isQuoteSigned) {
        requiresReset = true;
      }
    }

    // If quote is signed and changes require reset, clear signature data
    if (requiresReset) {
      updateData.signed_at = null;
      updateData.signature_data = null;
      updateData.device_data = null;
      updateData.quote_status = 'draft';
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

      // Log activity if quote was reset due to modifications
      if (requiresReset) {
        try {
          // Fetch quote to get lead_id and company_id
          const { data: quoteData } = await supabase
            .from('quotes')
            .select('lead_id, company_id')
            .eq('id', id)
            .single();

          if (quoteData) {
            await logActivity({
              company_id: quoteData.company_id,
              entity_type: 'lead',
              entity_id: quoteData.lead_id,
              activity_type: 'field_update',
              field_name: 'quote_status',
              old_value: 'accepted',
              new_value: 'draft',
              user_id: null,
              notes: 'Quote reset due to pricing changes after signing',
              metadata: {
                quote_id: id,
                reason: 'pricing_modified_after_signing',
                reset_at: new Date().toISOString(),
              },
            });
          }
        } catch (activityError) {
          console.error('Error logging quote reset activity:', activityError);
          // Don't fail the request if activity logging fails
        }
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

      // Recalculate ALL line items' prices ONLY if size ranges actually changed
      // Compare against the ORIGINAL values from existingQuote (before update)
      if (body.home_size_range !== undefined || body.yard_size_range !== undefined) {
        const homeSizeChanged = body.home_size_range !== undefined && body.home_size_range !== existingQuote.home_size_range;
        const yardSizeChanged = body.yard_size_range !== undefined && body.yard_size_range !== existingQuote.yard_size_range;

        if (homeSizeChanged || yardSizeChanged) {
          await recalculateAllLineItemPrices(supabase, id, body.home_size_range, body.yard_size_range);
        }
      }
    }

    // Update line items if provided
    if (body.line_items && body.line_items.length > 0) {
      // Line item changes require reset if quote is signed
      if (isQuoteSigned) {
        requiresReset = true;
      }

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

      // Validate custom pricing if provided
      if (body.line_items) {
        for (const lineItem of body.line_items) {
          if ((lineItem as any).is_custom_priced) {
            const customInitial = (lineItem as any).custom_initial_price;
            const customRecurring = (lineItem as any).custom_recurring_price;

            if (customInitial === undefined || customRecurring === undefined) {
              return NextResponse.json(
                { error: 'Custom pricing requires both initial and recurring prices' },
                { status: 400 }
              );
            }

            if (customInitial < 0 || customRecurring < 0) {
              return NextResponse.json(
                { error: 'Custom prices cannot be negative' },
                { status: 400 }
              );
            }
          }
        }
      }

      // Fetch discount configurations if discount_ids are provided
      const discountIds = body.line_items
        .map(item => (item as any).discount_id)
        .filter((id): id is string => !!id);

      let discountConfigs: any[] = [];
      if (discountIds.length > 0) {
        const { data: discounts, error: discountsError } = await supabase
          .from('company_discounts')
          .select('*')
          .in('id', discountIds);

        if (discountsError) {
          console.error('Error fetching discounts:', discountsError);
        } else {
          discountConfigs = discounts || [];
        }
      }

      // Process line items
      for (const lineItem of body.line_items) {
        if (lineItem.id && lineItem.service_plan_id) {
          // Update existing line item with new service plan
          const { data: servicePlan } = await supabase
            .from('service_plans')
            .select('*')
            .eq('id', lineItem.service_plan_id)
            .single();

          if (servicePlan) {
            // Check if custom pricing is being used
            const isCustomPriced = (lineItem as any).is_custom_priced === true;
            const customInitialPrice = (lineItem as any).custom_initial_price;
            const customRecurringPrice = (lineItem as any).custom_recurring_price;

            let initialPriceWithSize: number;
            let recurringPriceWithSize: number;
            let finalInitialPrice: number;
            let finalRecurringPrice: number;
            let discountPercentage = 0;
            let discountAmount = 0;
            let discountId: string | null = null;

            if (isCustomPriced && customInitialPrice !== undefined && customRecurringPrice !== undefined) {
              // Use custom prices - bypass all calculations and discounts
              initialPriceWithSize = customInitialPrice;
              recurringPriceWithSize = customRecurringPrice;
              finalInitialPrice = Math.max(0, customInitialPrice);
              finalRecurringPrice = Math.max(0, customRecurringPrice);
            } else {
              // Standard pricing flow
              const baseInitialPrice = servicePlan.initial_price || 0;
              // For one-time plans, recurring_price should always be 0
              const baseRecurringPrice = servicePlan.plan_category === 'one-time'
                ? 0
                : (servicePlan.recurring_price || 0);

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
                // For one-time plans, never add recurring increases
                homeRecurringIncrease = servicePlan.plan_category === 'one-time' ? 0 : (homeSizeOption?.recurringIncrease || 0);
                yardInitialIncrease = yardSizeOption?.initialIncrease || 0;
                // For one-time plans, never add recurring increases
                yardRecurringIncrease = servicePlan.plan_category === 'one-time' ? 0 : (yardSizeOption?.recurringIncrease || 0);
              }

              initialPriceWithSize = baseInitialPrice + homeInitialIncrease + yardInitialIncrease;
              recurringPriceWithSize = baseRecurringPrice + homeRecurringIncrease + yardRecurringIncrease;

              // Apply discounts - support both discount_id (new) and manual discount amounts (legacy)
              discountAmount = lineItem.discount_amount || 0;
              discountPercentage = lineItem.discount_percentage || 0;
              let recurringDiscountAmount = 0;
              let recurringDiscountPercentage = 0;
              let appliesToPrice = 'both'; // Default to applying to both prices
              discountId = (lineItem as any).discount_id || null;

              // If discount_id is provided, use pre-fetched discount configuration
              if (discountId) {
                const discountConfig = discountConfigs.find(d => d.id === discountId);

                if (discountConfig) {
                  appliesToPrice = discountConfig.applies_to_price;

                  // Initial discount settings
                  if (discountConfig.discount_type === 'percentage') {
                    discountPercentage = discountConfig.discount_value;
                    discountAmount = 0;
                  } else {
                    discountAmount = discountConfig.discount_value;
                    discountPercentage = 0;
                  }

                  // Recurring discount settings (for 'both' - use separate values if set)
                  if (appliesToPrice === 'both' && discountConfig.recurring_discount_type && discountConfig.recurring_discount_value != null) {
                    if (discountConfig.recurring_discount_type === 'percentage') {
                      recurringDiscountPercentage = discountConfig.recurring_discount_value;
                      recurringDiscountAmount = 0;
                    } else {
                      recurringDiscountAmount = discountConfig.recurring_discount_value;
                      recurringDiscountPercentage = 0;
                    }
                  } else {
                    // Fall back to same as initial
                    recurringDiscountAmount = discountAmount;
                    recurringDiscountPercentage = discountPercentage;
                  }
                }
              } else {
                // If discount_id is explicitly null, clear all discounts
                if ((lineItem as any).discount_id === null) {
                  discountAmount = 0;
                  discountPercentage = 0;
                  recurringDiscountAmount = 0;
                  recurringDiscountPercentage = 0;
                  discountId = null;
                } else {
                  // If no discount_id provided (undefined), check for existing discounts on the line item
                  const { data: existingLineItem } = await supabase
                    .from('quote_line_items')
                    .select('discount_percentage, discount_amount, discount_id')
                    .eq('id', lineItem.id)
                    .single();

                  if (existingLineItem) {
                    if (lineItem.discount_amount === undefined) {
                      discountAmount = existingLineItem.discount_amount || 0;
                    }
                    if (lineItem.discount_percentage === undefined) {
                      discountPercentage = existingLineItem.discount_percentage || 0;
                    }
                    if (!(lineItem as any).discount_id && existingLineItem.discount_id) {
                      discountId = existingLineItem.discount_id;
                    }
                    // For legacy line items without discount_id, use same values for recurring
                    recurringDiscountAmount = discountAmount;
                    recurringDiscountPercentage = discountPercentage;
                  }
                }
              }

              // Calculate final prices based on discount configuration
              finalInitialPrice = initialPriceWithSize;
              finalRecurringPrice = recurringPriceWithSize;

              // Apply discount to initial price if configured
              if (appliesToPrice === 'initial' || appliesToPrice === 'both') {
                finalInitialPrice = initialPriceWithSize - discountAmount;
                if (discountPercentage > 0) {
                  finalInitialPrice = finalInitialPrice * (1 - discountPercentage / 100);
                }
              }

              // Apply discount to recurring price if configured
              if (appliesToPrice === 'recurring' || appliesToPrice === 'both') {
                finalRecurringPrice = recurringPriceWithSize - recurringDiscountAmount;
                if (recurringDiscountPercentage > 0) {
                  finalRecurringPrice = finalRecurringPrice * (1 - recurringDiscountPercentage / 100);
                }
              }

              // Ensure prices don't go negative
              finalInitialPrice = Math.max(0, finalInitialPrice);
              finalRecurringPrice = Math.max(0, finalRecurringPrice);
            }

            // UPDATE the existing line item with new service plan
            const updateData: any = {
              service_plan_id: servicePlan.id,
              plan_name: servicePlan.plan_name,
              plan_description: servicePlan.plan_description,
              // Note: plan_category is NOT stored in line items, it comes from service_plan join
              initial_price: initialPriceWithSize,
              recurring_price: recurringPriceWithSize,
              // For one-time plans, use 'one-time' as billing_frequency (quote_line_items doesn't allow null)
              billing_frequency: servicePlan.plan_category === 'one-time' ? 'one-time' : servicePlan.billing_frequency,
              service_frequency: lineItem.service_frequency || servicePlan.treatment_frequency || null,
              discount_percentage: discountPercentage,
              discount_amount: discountAmount,
              discount_id: discountId,
              custom_initial_price: isCustomPriced ? customInitialPrice : null,
              custom_recurring_price: isCustomPriced ? customRecurringPrice : null,
              is_custom_priced: isCustomPriced,
              final_initial_price: finalInitialPrice,
              final_recurring_price: finalRecurringPrice,
            };

            const { error: updateError } = await supabase
              .from('quote_line_items')
              .update(updateData)
              .eq('id', lineItem.id);

            if (updateError) {
              console.error('Error updating line item:', updateError);
              return NextResponse.json(
                { error: `Failed to update line item: ${updateError.message}` },
                { status: 500 }
              );
            }
          }
        } else if (lineItem.id) {
          // Update existing line item (only discounts/display order, no service plan change)
          const updateLineItemData: any = {};

          if (lineItem.display_order !== undefined) {
            updateLineItemData.display_order = lineItem.display_order;
          }

          if (lineItem.service_frequency !== undefined) {
            updateLineItemData.service_frequency = lineItem.service_frequency;
          }

          // Handle discount updates
          const discountIdProvided = (lineItem as any).discount_id !== undefined;
          const manualDiscountProvided = lineItem.discount_percentage !== undefined || lineItem.discount_amount !== undefined;

          if (discountIdProvided || manualDiscountProvided) {
            const { data: existingLineItem } = await supabase
              .from('quote_line_items')
              .select('initial_price, recurring_price')
              .eq('id', lineItem.id)
              .single();

            if (existingLineItem) {
              let discountAmount = lineItem.discount_amount || 0;
              let discountPercentage = lineItem.discount_percentage || 0;
              let recurringDiscountAmount = discountAmount;
              let recurringDiscountPercentage = discountPercentage;
              let appliesToPrice = 'both';
              const discountId = (lineItem as any).discount_id || null;

              // If discount_id is provided, use discount configuration
              if (discountId) {
                const discountConfig = discountConfigs.find(d => d.id === discountId);

                if (discountConfig) {
                  appliesToPrice = discountConfig.applies_to_price;

                  // Initial discount settings
                  if (discountConfig.discount_type === 'percentage') {
                    discountPercentage = discountConfig.discount_value;
                    discountAmount = 0;
                  } else {
                    discountAmount = discountConfig.discount_value;
                    discountPercentage = 0;
                  }

                  // Recurring discount settings (for 'both' - use separate values if set)
                  if (appliesToPrice === 'both' && discountConfig.recurring_discount_type && discountConfig.recurring_discount_value != null) {
                    if (discountConfig.recurring_discount_type === 'percentage') {
                      recurringDiscountPercentage = discountConfig.recurring_discount_value;
                      recurringDiscountAmount = 0;
                    } else {
                      recurringDiscountAmount = discountConfig.recurring_discount_value;
                      recurringDiscountPercentage = 0;
                    }
                  } else {
                    recurringDiscountAmount = discountAmount;
                    recurringDiscountPercentage = discountPercentage;
                  }
                }
              }

              // Calculate final prices based on discount configuration
              let finalInitialPrice = existingLineItem.initial_price;
              let finalRecurringPrice = existingLineItem.recurring_price;

              // Apply discount to initial price if configured
              if (appliesToPrice === 'initial' || appliesToPrice === 'both') {
                finalInitialPrice = existingLineItem.initial_price - discountAmount;
                if (discountPercentage > 0) {
                  finalInitialPrice = finalInitialPrice * (1 - discountPercentage / 100);
                }
              }

              // Apply discount to recurring price if configured
              if (appliesToPrice === 'recurring' || appliesToPrice === 'both') {
                finalRecurringPrice = existingLineItem.recurring_price - recurringDiscountAmount;
                if (recurringDiscountPercentage > 0) {
                  finalRecurringPrice = finalRecurringPrice * (1 - recurringDiscountPercentage / 100);
                }
              }

              updateLineItemData.discount_percentage = discountPercentage;
              updateLineItemData.discount_amount = discountAmount;
              updateLineItemData.discount_id = discountId;
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
            // Check if custom pricing is being used
            const isCustomPriced = (lineItem as any).is_custom_priced === true;
            const customInitialPrice = (lineItem as any).custom_initial_price;
            const customRecurringPrice = (lineItem as any).custom_recurring_price;

            let initialPriceWithSize: number;
            let recurringPriceWithSize: number;
            let finalInitialPrice: number;
            let finalRecurringPrice: number;
            let discountPercentage = 0;
            let discountAmount = 0;
            let discountId: string | null = null;

            if (isCustomPriced && customInitialPrice !== undefined && customRecurringPrice !== undefined) {
              // Use custom prices - bypass all calculations
              initialPriceWithSize = customInitialPrice;
              recurringPriceWithSize = customRecurringPrice;
              finalInitialPrice = Math.max(0, customInitialPrice);
              finalRecurringPrice = Math.max(0, customRecurringPrice);
            } else {
              // Standard pricing flow
              const baseInitialPrice = servicePlan.initial_price || 0;
              // For one-time plans, recurring_price should always be 0
              const baseRecurringPrice = servicePlan.plan_category === 'one-time'
                ? 0
                : (servicePlan.recurring_price || 0);

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
                // For one-time plans, never add recurring increases
                homeRecurringIncrease = servicePlan.plan_category === 'one-time' ? 0 : (homeSizeOption?.recurringIncrease || 0);
                yardInitialIncrease = yardSizeOption?.initialIncrease || 0;
                // For one-time plans, never add recurring increases
                yardRecurringIncrease = servicePlan.plan_category === 'one-time' ? 0 : (yardSizeOption?.recurringIncrease || 0);
              }

              // Calculate prices with size increases
              initialPriceWithSize = baseInitialPrice + homeInitialIncrease + yardInitialIncrease;
              recurringPriceWithSize = baseRecurringPrice + homeRecurringIncrease + yardRecurringIncrease;

              // Apply discounts - support both discount_id (new) and manual discount amounts (legacy)
              discountAmount = lineItem.discount_amount || 0;
              discountPercentage = lineItem.discount_percentage || 0;
              let recurringDiscountAmount = discountAmount;
              let recurringDiscountPercentage = discountPercentage;
              let appliesToPrice = 'both';
              discountId = (lineItem as any).discount_id || null;

              // If discount_id is provided, use pre-fetched discount configuration
              if (discountId) {
                const discountConfig = discountConfigs.find(d => d.id === discountId);

                if (discountConfig) {
                  appliesToPrice = discountConfig.applies_to_price;

                  // Initial discount settings
                  if (discountConfig.discount_type === 'percentage') {
                    discountPercentage = discountConfig.discount_value;
                    discountAmount = 0;
                  } else {
                    discountAmount = discountConfig.discount_value;
                    discountPercentage = 0;
                  }

                  // Recurring discount settings (for 'both' - use separate values if set)
                  if (appliesToPrice === 'both' && discountConfig.recurring_discount_type && discountConfig.recurring_discount_value != null) {
                    if (discountConfig.recurring_discount_type === 'percentage') {
                      recurringDiscountPercentage = discountConfig.recurring_discount_value;
                      recurringDiscountAmount = 0;
                    } else {
                      recurringDiscountAmount = discountConfig.recurring_discount_value;
                      recurringDiscountPercentage = 0;
                    }
                  } else {
                    recurringDiscountAmount = discountAmount;
                    recurringDiscountPercentage = discountPercentage;
                  }
                }
              }

              // Calculate final prices based on discount configuration
              finalInitialPrice = initialPriceWithSize;
              finalRecurringPrice = recurringPriceWithSize;

              // Apply discount to initial price if configured
              if (appliesToPrice === 'initial' || appliesToPrice === 'both') {
                finalInitialPrice = initialPriceWithSize - discountAmount;
                if (discountPercentage > 0) {
                  finalInitialPrice = finalInitialPrice * (1 - discountPercentage / 100);
                }
              }

              // Apply discount to recurring price if configured
              if (appliesToPrice === 'recurring' || appliesToPrice === 'both') {
                finalRecurringPrice = recurringPriceWithSize - recurringDiscountAmount;
                if (recurringDiscountPercentage > 0) {
                  finalRecurringPrice = finalRecurringPrice * (1 - recurringDiscountPercentage / 100);
                }
              }

              // Ensure prices don't go negative
              finalInitialPrice = Math.max(0, finalInitialPrice);
              finalRecurringPrice = Math.max(0, finalRecurringPrice);
            }

            const insertData: any = {
              quote_id: id,
              service_plan_id: servicePlan.id,
              plan_name: servicePlan.plan_name,
              plan_description: servicePlan.plan_description,
              initial_price: initialPriceWithSize,
              recurring_price: recurringPriceWithSize,
              billing_frequency: servicePlan.billing_frequency,
              service_frequency: lineItem.service_frequency || servicePlan.treatment_frequency || null,
              discount_percentage: discountPercentage,
              discount_amount: discountAmount,
              discount_id: discountId,
              custom_initial_price: isCustomPriced ? customInitialPrice : null,
              custom_recurring_price: isCustomPriced ? customRecurringPrice : null,
              is_custom_priced: isCustomPriced,
              final_initial_price: finalInitialPrice,
              final_recurring_price: finalRecurringPrice,
              display_order: lineItem.display_order || 0,
            };

            await supabase
              .from('quote_line_items')
              .insert(insertData);
          }
        } else if (lineItem.addon_service_id) {
          // Process add-on service line items
          const { data: addon } = await supabase
            .from('add_on_services')
            .select('*')
            .eq('id', lineItem.addon_service_id)
            .single();

          if (addon) {
            const initialPrice = addon.initial_price || 0;
            const recurringPrice = addon.recurring_price;

            // Prepare update/insert data for add-on line item
            const addonData: any = {
              addon_service_id: addon.id,
              service_plan_id: null, // Add-ons don't have service_plan_id
              plan_name: addon.addon_name,
              plan_description: addon.addon_description,
              initial_price: initialPrice,
              recurring_price: recurringPrice,
              final_initial_price: initialPrice,
              final_recurring_price: recurringPrice,
              billing_frequency: addon.billing_frequency,
              display_order: lineItem.display_order,
              discount_percentage: 0, // Add-ons don't get discounts by default
              discount_amount: 0,
            };

            if (lineItem.id) {
              // Update existing add-on line item
              await supabase
                .from('quote_line_items')
                .update(addonData)
                .eq('id', lineItem.id);
            } else {
              // Create new add-on line item
              await supabase
                .from('quote_line_items')
                .insert({
                  ...addonData,
                  quote_id: id,
                });
            }
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