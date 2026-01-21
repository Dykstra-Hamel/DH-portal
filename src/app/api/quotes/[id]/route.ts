import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { UpdateQuoteRequest } from '@/types/quote';
import {
  generateHomeSizeOptions,
  generateYardSizeOptions,
  generateLinearFeetOptions,
  findSizeOptionByValue,
  calculateLinearFeetPrice,
} from '@/lib/pricing-calculations';
import { logActivity } from '@/lib/activity-logger';
import { recalculateAllLineItemPrices } from '@/lib/quote-utils';

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
    const body: UpdateQuoteRequest & { home_size_range?: string; yard_size_range?: string; linear_feet_range?: string } = await request.json();

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
      .select('signed_at, quote_status, home_size_range, yard_size_range, linear_feet_range')
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

    if (body.linear_feet_range !== undefined) {
      updateData.linear_feet_range = body.linear_feet_range;
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
      if ((body.home_size_range !== undefined || body.yard_size_range !== undefined || body.linear_feet_range !== undefined)) {
        console.log('[Quote API] Attempting to sync size ranges to service_address', {
          home_size_range: body.home_size_range,
          yard_size_range: body.yard_size_range,
          linear_feet_range: body.linear_feet_range
        });

        // Fetch quote to get service_address_id
        const { data: quote } = await supabase
          .from('quotes')
          .select('service_address_id')
          .eq('id', id)
          .single();

        console.log('[Quote API] Fetched quote for sync:', {
          service_address_id: quote?.service_address_id
        });

        if (quote && quote.service_address_id) {
          const addressUpdate: any = {};

          if (body.home_size_range !== undefined) {
            addressUpdate.home_size_range = body.home_size_range;
          }

          if (body.yard_size_range !== undefined) {
            addressUpdate.yard_size_range = body.yard_size_range;
          }

          if (body.linear_feet_range !== undefined) {
            addressUpdate.linear_feet_range = body.linear_feet_range;
          }

          console.log('[Quote API] Updating service_address with:', addressUpdate);

          // Update service address (log any errors but don't fail the request)
          const { data: updatedAddress, error: serviceAddressError } = await supabase
            .from('service_addresses')
            .update(addressUpdate)
            .eq('id', quote.service_address_id)
            .select()
            .single();

          if (serviceAddressError) {
            console.error('[Quote API] Failed to sync size ranges to service_address:', serviceAddressError);
          } else {
            console.log('[Quote API] Successfully synced to service_address:', updatedAddress);
          }
        } else {
          console.log('[Quote API] No service_address_id found, skipping sync');
        }
      }

      // Recalculate ALL line items' prices ONLY if size ranges actually changed
      // Compare against the ORIGINAL values from existingQuote (before update)
      if (body.home_size_range !== undefined || body.yard_size_range !== undefined || body.linear_feet_range !== undefined) {
        const homeSizeChanged = body.home_size_range !== undefined && body.home_size_range !== existingQuote.home_size_range;
        const yardSizeChanged = body.yard_size_range !== undefined && body.yard_size_range !== existingQuote.yard_size_range;
        const linearFeetChanged = body.linear_feet_range !== undefined && body.linear_feet_range !== existingQuote.linear_feet_range;

        if (homeSizeChanged || yardSizeChanged || linearFeetChanged) {
          const success = await recalculateAllLineItemPrices(supabase, id, body.home_size_range, body.yard_size_range, body.linear_feet_range);

          // If recalculateAllLineItemPrices returns false, it means there are bundle line items
          // that need to be recalculated using the full bundle pricing logic.
          // We'll fetch and update bundle line items below
          if (!success) {
            // Fetch bundle line items and recalculate them
            const { data: bundleLineItems } = await supabase
              .from('quote_line_items')
              .select('*')
              .eq('quote_id', id)
              .not('bundle_plan_id', 'is', null);

            if (bundleLineItems && bundleLineItems.length > 0) {
              // For each bundle line item, trigger a recalculation by updating it
              // The update logic below will handle the bundle pricing calculation
              body.line_items = bundleLineItems.map((item: any) => ({
                id: item.id,
                bundle_plan_id: item.bundle_plan_id,
                display_order: item.display_order,
              }));
            }
          }
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
        .select('company_id, home_size_range, yard_size_range, linear_feet_range')
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
      const linearFeetRange = body.linear_feet_range || quote.linear_feet_range;

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

            let finalInitialPrice: number;
            let finalRecurringPrice: number;
            let discountPercentage = 0;
            let discountAmount = 0;
            let discountId: string | null = null;

            // Always calculate the standard pricing (even for custom priced items)
            // This preserves the calculated price for reference
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
            let linearFeetInitialPrice = 0;
            let linearFeetRecurringPrice = 0;

            if (pricingSettings) {
              // Calculate home size pricing if this plan supports it
              if (servicePlan.home_size_pricing) {
                const homeRangeValue = parseRangeValue(homeSizeRange);
                const servicePlanPricing = {
                  home_size_pricing: servicePlan.home_size_pricing,
                  yard_size_pricing: servicePlan.yard_size_pricing,
                  linear_feet_pricing: servicePlan.linear_feet_pricing,
                };
                const homeOptions = generateHomeSizeOptions(pricingSettings, servicePlanPricing);
                const homeSizeOption = findSizeOptionByValue(homeRangeValue, homeOptions);
                homeInitialIncrease = homeSizeOption?.initialIncrease || 0;
                // For one-time plans, never add recurring increases
                homeRecurringIncrease = servicePlan.plan_category === 'one-time' ? 0 : (homeSizeOption?.recurringIncrease || 0);
              }

              // Calculate yard size pricing if this plan supports it
              if (servicePlan.yard_size_pricing) {
                const yardRangeValue = parseRangeValue(yardSizeRange);
                const servicePlanPricing = {
                  home_size_pricing: servicePlan.home_size_pricing,
                  yard_size_pricing: servicePlan.yard_size_pricing,
                  linear_feet_pricing: servicePlan.linear_feet_pricing,
                };
                const yardOptions = generateYardSizeOptions(pricingSettings, servicePlanPricing);
                const yardSizeOption = findSizeOptionByValue(yardRangeValue, yardOptions);
                yardInitialIncrease = yardSizeOption?.initialIncrease || 0;
                // For one-time plans, never add recurring increases
                yardRecurringIncrease = servicePlan.plan_category === 'one-time' ? 0 : (yardSizeOption?.recurringIncrease || 0);
              }

              // Calculate linear feet pricing if this plan supports it
              if (servicePlan.linear_feet_pricing && linearFeetRange) {
                const linearFeetValue = parseRangeValue(linearFeetRange);
                if (linearFeetValue > 0) {
                  const servicePlanPricing = {
                    home_size_pricing: servicePlan.home_size_pricing,
                    yard_size_pricing: servicePlan.yard_size_pricing,
                    linear_feet_pricing: servicePlan.linear_feet_pricing,
                  };
                  const linearFeetPricing = calculateLinearFeetPrice(
                    linearFeetValue,
                    pricingSettings,
                    servicePlanPricing
                  );
                  linearFeetInitialPrice = linearFeetPricing.initialPrice;
                  // For one-time plans, never add recurring prices
                  linearFeetRecurringPrice = servicePlan.plan_category === 'one-time' ? 0 : linearFeetPricing.recurringPrice;
                }
              }
            }

            const initialPriceWithSize = baseInitialPrice + homeInitialIncrease + yardInitialIncrease + linearFeetInitialPrice;
            const recurringPriceWithSize = baseRecurringPrice + homeRecurringIncrease + yardRecurringIncrease + linearFeetRecurringPrice;

            // If custom pricing is set, use custom values for final prices only
            if (isCustomPriced && customInitialPrice !== undefined && customRecurringPrice !== undefined) {
              // Use custom prices for final values, but keep calculated prices in initial_price/recurring_price
              finalInitialPrice = Math.max(0, customInitialPrice);
              finalRecurringPrice = Math.max(0, customRecurringPrice);
              // Clear discounts when custom pricing is active
              discountPercentage = 0;
              discountAmount = 0;
              discountId = null;
            } else {
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

                      // If we retrieved a discount_id from existing line item, fetch and apply its configuration
                      const { data: fetchedDiscount } = await supabase
                        .from('company_discounts')
                        .select('*')
                        .eq('id', discountId)
                        .single();

                      if (fetchedDiscount) {
                        appliesToPrice = fetchedDiscount.applies_to_price;

                        // Apply discount configuration properly
                        if (appliesToPrice === 'both' && fetchedDiscount.recurring_discount_type && fetchedDiscount.recurring_discount_value != null) {
                          if (fetchedDiscount.recurring_discount_type === 'percentage') {
                            recurringDiscountPercentage = fetchedDiscount.recurring_discount_value;
                            recurringDiscountAmount = 0;
                          } else {
                            recurringDiscountAmount = fetchedDiscount.recurring_discount_value;
                            recurringDiscountPercentage = 0;
                          }
                        } else {
                          // For legacy line items without separate recurring fields, use same values
                          recurringDiscountAmount = discountAmount;
                          recurringDiscountPercentage = discountPercentage;
                        }
                      } else {
                        // Discount not found, use legacy behavior
                        recurringDiscountAmount = discountAmount;
                        recurringDiscountPercentage = discountPercentage;
                      }
                    } else {
                      // No discount_id, use legacy behavior
                      recurringDiscountAmount = discountAmount;
                      recurringDiscountPercentage = discountPercentage;
                    }
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
              bundle_plan_id: null, // Clear bundle when changing to service
              addon_service_id: null, // Clear addon when changing to service
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
        } else if (lineItem.id && lineItem.bundle_plan_id) {
          // Update existing line item to bundle (replacing service/addon with bundle)
          const { data: bundle } = await supabase
            .from('bundle_plans')
            .select('*')
            .eq('id', lineItem.bundle_plan_id)
            .single();

          console.log('=== BUNDLE PRICING DEBUG (UPDATE) ===');
          console.log('Bundle data:', JSON.stringify(bundle, null, 2));

          if (bundle) {
            let initialPrice = 0;
            let recurringPrice = 0;

            const pricingMode = bundle.pricing_mode || 'global';

            if (pricingMode === 'per_interval') {
              // Per-interval pricing - determine which interval applies
              const intervalDimension = bundle.interval_dimension || 'home';
              let intervalIndex = 0;

              // Determine the interval index based on the dimension
              if (pricingSettings) {
                if (intervalDimension === 'home' && homeSizeRange) {
                  const homeRangeValue = parseRangeValue(homeSizeRange);
                  const homeOptions = generateHomeSizeOptions(pricingSettings);
                  const homeSizeOption = findSizeOptionByValue(homeRangeValue, homeOptions);
                  intervalIndex = homeSizeOption?.intervalIndex ?? 0;
                } else if (intervalDimension === 'yard' && yardSizeRange) {
                  const yardRangeValue = parseRangeValue(yardSizeRange);
                  const yardOptions = generateYardSizeOptions(pricingSettings);
                  const yardSizeOption = findSizeOptionByValue(yardRangeValue, yardOptions);
                  intervalIndex = yardSizeOption?.intervalIndex ?? 0;
                } else if (intervalDimension === 'linear_feet' && linearFeetRange) {
                  const linearFeetValue = parseRangeValue(linearFeetRange);
                  const linearFeetOptions = generateLinearFeetOptions(pricingSettings);
                  const linearFeetOption = findSizeOptionByValue(linearFeetValue, linearFeetOptions);
                  intervalIndex = linearFeetOption?.intervalIndex ?? 0;
                }
              }

              // Get the pricing configuration for this interval
              const intervalPricing = bundle.interval_pricing?.[intervalIndex];
              console.log('Using per-interval pricing:', {
                intervalDimension,
                intervalIndex,
                intervalPricing
              });

              if (intervalPricing) {
                if (intervalPricing.pricing_type === 'custom') {
                  // Use custom pricing for this interval
                  initialPrice = intervalPricing.custom_initial_price || 0;
                  recurringPrice = intervalPricing.custom_recurring_price || 0;
                  console.log('Using custom pricing for interval:', { initialPrice, recurringPrice });
                } else if (intervalPricing.pricing_type === 'discount') {
                  // Calculate from bundled items and apply interval-specific discount
                  let totalInitial = 0;
                  let totalRecurring = 0;

                  // Sum up service plans with size-based pricing
                  console.log('Bundled service plans:', bundle.bundled_service_plans);
                  if (bundle.bundled_service_plans && Array.isArray(bundle.bundled_service_plans)) {
                    for (const item of bundle.bundled_service_plans) {
                      const { data: plan } = await supabase
                        .from('service_plans')
                        .select('*')
                        .eq('id', item.service_plan_id)
                        .single();

                      if (plan) {
                        const baseInitialPrice = plan.initial_price || 0;
                        const baseRecurringPrice = plan.plan_category === 'one-time' ? 0 : (plan.recurring_price || 0);

                        let homeInitialIncrease = 0;
                        let homeRecurringIncrease = 0;
                        let yardInitialIncrease = 0;
                        let yardRecurringIncrease = 0;
                        let linearFeetInitialPrice = 0;
                        let linearFeetRecurringPrice = 0;

                        if (pricingSettings) {
                          if (plan.home_size_pricing) {
                            const homeRangeValue = parseRangeValue(homeSizeRange);
                            const servicePlanPricing = {
                              home_size_pricing: plan.home_size_pricing,
                              yard_size_pricing: plan.yard_size_pricing,
                              linear_feet_pricing: plan.linear_feet_pricing,
                            };
                            const homeOptions = generateHomeSizeOptions(pricingSettings, servicePlanPricing);
                            const homeSizeOption = findSizeOptionByValue(homeRangeValue, homeOptions);
                            homeInitialIncrease = homeSizeOption?.initialIncrease || 0;
                            homeRecurringIncrease = plan.plan_category === 'one-time' ? 0 : (homeSizeOption?.recurringIncrease || 0);
                          }

                          if (plan.yard_size_pricing) {
                            const yardRangeValue = parseRangeValue(yardSizeRange);
                            const servicePlanPricing = {
                              home_size_pricing: plan.home_size_pricing,
                              yard_size_pricing: plan.yard_size_pricing,
                              linear_feet_pricing: plan.linear_feet_pricing,
                            };
                            const yardOptions = generateYardSizeOptions(pricingSettings, servicePlanPricing);
                            const yardSizeOption = findSizeOptionByValue(yardRangeValue, yardOptions);
                            yardInitialIncrease = yardSizeOption?.initialIncrease || 0;
                            yardRecurringIncrease = plan.plan_category === 'one-time' ? 0 : (yardSizeOption?.recurringIncrease || 0);
                          }

                          if (plan.linear_feet_pricing && linearFeetRange) {
                            const linearFeetValue = parseRangeValue(linearFeetRange);
                            if (linearFeetValue > 0) {
                              const servicePlanPricing = {
                                home_size_pricing: plan.home_size_pricing,
                                yard_size_pricing: plan.yard_size_pricing,
                                linear_feet_pricing: plan.linear_feet_pricing,
                              };
                              const linearFeetPricing = calculateLinearFeetPrice(
                                linearFeetValue,
                                pricingSettings,
                                servicePlanPricing
                              );
                              linearFeetInitialPrice = linearFeetPricing.initialPrice;
                              linearFeetRecurringPrice = plan.plan_category === 'one-time' ? 0 : linearFeetPricing.recurringPrice;
                            }
                          }
                        }

                        const planInitialPrice = baseInitialPrice + homeInitialIncrease + yardInitialIncrease + linearFeetInitialPrice;
                        const planRecurringPrice = baseRecurringPrice + homeRecurringIncrease + yardRecurringIncrease + linearFeetRecurringPrice;

                        totalInitial += planInitialPrice;
                        totalRecurring += planRecurringPrice;
                      }
                    }
                  }

                  // Sum up add-ons
                  if (bundle.bundled_add_ons && Array.isArray(bundle.bundled_add_ons)) {
                    for (const item of bundle.bundled_add_ons) {
                      const { data: addon } = await supabase
                        .from('add_on_services')
                        .select('initial_price, recurring_price')
                        .eq('id', item.add_on_id)
                        .single();

                      if (addon) {
                        totalInitial += addon.initial_price || 0;
                        totalRecurring += addon.recurring_price || 0;
                      }
                    }
                  }

                  // Apply interval-specific discount
                  if (intervalPricing.discount_type === 'percentage') {
                    totalInitial = totalInitial * (1 - (intervalPricing.discount_value || 0) / 100);
                  } else if (intervalPricing.discount_type === 'fixed') {
                    totalInitial = Math.max(0, totalInitial - (intervalPricing.discount_value || 0));
                  }

                  const recurringDiscountType = intervalPricing.recurring_discount_type || intervalPricing.discount_type;
                  const recurringDiscountValue = intervalPricing.recurring_discount_value ?? intervalPricing.discount_value;

                  if (recurringDiscountType === 'percentage') {
                    totalRecurring = totalRecurring * (1 - (recurringDiscountValue || 0) / 100);
                  } else if (recurringDiscountType === 'fixed') {
                    totalRecurring = Math.max(0, totalRecurring - (recurringDiscountValue || 0));
                  }

                  initialPrice = totalInitial;
                  recurringPrice = totalRecurring;
                  console.log('Interval discount pricing:', { initialPrice, recurringPrice });
                }
              }
            } else if (bundle.pricing_type === 'custom') {
              // Global custom pricing
              initialPrice = bundle.custom_initial_price || 0;
              recurringPrice = bundle.custom_recurring_price || 0;
              console.log('Using global custom pricing:', { initialPrice, recurringPrice });
            } else if (bundle.pricing_type === 'discount') {
              // Global discount pricing
              console.log('Using discount pricing');
              // Calculate from bundled items and apply discount
              let totalInitial = 0;
              let totalRecurring = 0;

              // Sum up service plans with size-based pricing
              console.log('Bundled service plans:', bundle.bundled_service_plans);
              if (bundle.bundled_service_plans && Array.isArray(bundle.bundled_service_plans)) {
                for (const item of bundle.bundled_service_plans) {
                  console.log('Fetching service plan:', item.service_plan_id);
                  const { data: plan, error: planError } = await supabase
                    .from('service_plans')
                    .select('*')
                    .eq('id', item.service_plan_id)
                    .single();

                  console.log('Service plan result:', { plan, planError });
                  if (plan) {
                    // Start with base prices
                    const baseInitialPrice = plan.initial_price || 0;
                    const baseRecurringPrice = plan.plan_category === 'one-time' ? 0 : (plan.recurring_price || 0);

                    // Calculate size-based price increases
                    let homeInitialIncrease = 0;
                    let homeRecurringIncrease = 0;
                    let yardInitialIncrease = 0;
                    let yardRecurringIncrease = 0;
                    let linearFeetInitialPrice = 0;
                    let linearFeetRecurringPrice = 0;

                    if (pricingSettings) {
                      // Home size pricing
                      if (plan.home_size_pricing) {
                        const homeRangeValue = parseRangeValue(homeSizeRange);
                        const servicePlanPricing = {
                          home_size_pricing: plan.home_size_pricing,
                          yard_size_pricing: plan.yard_size_pricing,
                          linear_feet_pricing: plan.linear_feet_pricing,
                        };
                        const homeOptions = generateHomeSizeOptions(pricingSettings, servicePlanPricing);
                        const homeSizeOption = findSizeOptionByValue(homeRangeValue, homeOptions);
                        homeInitialIncrease = homeSizeOption?.initialIncrease || 0;
                        homeRecurringIncrease = plan.plan_category === 'one-time' ? 0 : (homeSizeOption?.recurringIncrease || 0);
                      }

                      // Yard size pricing
                      if (plan.yard_size_pricing) {
                        const yardRangeValue = parseRangeValue(yardSizeRange);
                        const servicePlanPricing = {
                          home_size_pricing: plan.home_size_pricing,
                          yard_size_pricing: plan.yard_size_pricing,
                          linear_feet_pricing: plan.linear_feet_pricing,
                        };
                        const yardOptions = generateYardSizeOptions(pricingSettings, servicePlanPricing);
                        const yardSizeOption = findSizeOptionByValue(yardRangeValue, yardOptions);
                        yardInitialIncrease = yardSizeOption?.initialIncrease || 0;
                        yardRecurringIncrease = plan.plan_category === 'one-time' ? 0 : (yardSizeOption?.recurringIncrease || 0);
                      }

                      // Linear feet pricing
                      if (plan.linear_feet_pricing && linearFeetRange) {
                        const linearFeetValue = parseRangeValue(linearFeetRange);
                        if (linearFeetValue > 0) {
                          const servicePlanPricing = {
                            home_size_pricing: plan.home_size_pricing,
                            yard_size_pricing: plan.yard_size_pricing,
                            linear_feet_pricing: plan.linear_feet_pricing,
                          };
                          const linearFeetPricing = calculateLinearFeetPrice(
                            linearFeetValue,
                            pricingSettings,
                            servicePlanPricing
                          );
                          linearFeetInitialPrice = linearFeetPricing.initialPrice;
                          linearFeetRecurringPrice = plan.plan_category === 'one-time' ? 0 : linearFeetPricing.recurringPrice;
                        }
                      }
                    }

                    // Calculate final prices with size adjustments
                    const planInitialPrice = baseInitialPrice + homeInitialIncrease + yardInitialIncrease + linearFeetInitialPrice;
                    const planRecurringPrice = baseRecurringPrice + homeRecurringIncrease + yardRecurringIncrease + linearFeetRecurringPrice;

                    totalInitial += planInitialPrice;
                    totalRecurring += planRecurringPrice;
                    console.log('Service plan prices (with size adjustments):', {
                      plan_name: plan.plan_name,
                      baseInitialPrice,
                      baseRecurringPrice,
                      homeInitialIncrease,
                      homeRecurringIncrease,
                      yardInitialIncrease,
                      yardRecurringIncrease,
                      linearFeetInitialPrice,
                      linearFeetRecurringPrice,
                      planInitialPrice,
                      planRecurringPrice
                    });
                    console.log('Running totals after service plan:', { totalInitial, totalRecurring });
                  }
                }
              }

              // Sum up add-ons
              console.log('Bundled add-ons:', bundle.bundled_add_ons);
              if (bundle.bundled_add_ons && Array.isArray(bundle.bundled_add_ons)) {
                for (const item of bundle.bundled_add_ons) {
                  console.log('Fetching add-on:', item.add_on_id);
                  const { data: addon, error: addonError } = await supabase
                    .from('add_on_services')
                    .select('initial_price, recurring_price')
                    .eq('id', item.add_on_id)
                    .single();

                  console.log('Add-on result:', { addon, addonError });
                  if (addon) {
                    totalInitial += addon.initial_price || 0;
                    totalRecurring += addon.recurring_price || 0;
                    console.log('Running totals after add-on:', { totalInitial, totalRecurring });
                  }
                }
              }

              console.log('Totals before discount:', { totalInitial, totalRecurring });

              // Apply discount based on applies_to_price setting
              const appliesToPrice = bundle.applies_to_price || 'both';
              console.log('Discount settings:', {
                appliesToPrice,
                discount_type: bundle.discount_type,
                discount_value: bundle.discount_value,
                recurring_discount_type: bundle.recurring_discount_type,
                recurring_discount_value: bundle.recurring_discount_value
              });

              if (appliesToPrice === 'initial' || appliesToPrice === 'both') {
                if (bundle.discount_type === 'percentage') {
                  totalInitial = totalInitial * (1 - (bundle.discount_value || 0) / 100);
                } else if (bundle.discount_type === 'fixed') {
                  totalInitial = Math.max(0, totalInitial - (bundle.discount_value || 0));
                }
                console.log('Initial price after discount:', totalInitial);
              }

              if (appliesToPrice === 'recurring' || appliesToPrice === 'both') {
                const recurringDiscountType = bundle.recurring_discount_type || bundle.discount_type;
                const recurringDiscountValue = bundle.recurring_discount_value ?? bundle.discount_value;

                if (recurringDiscountType === 'percentage') {
                  totalRecurring = totalRecurring * (1 - (recurringDiscountValue || 0) / 100);
                } else if (recurringDiscountType === 'fixed') {
                  totalRecurring = Math.max(0, totalRecurring - (recurringDiscountValue || 0));
                }
                console.log('Recurring price after discount:', totalRecurring);
              }

              initialPrice = totalInitial;
              recurringPrice = totalRecurring;
            }

            console.log('Final prices:', { initialPrice, recurringPrice });
            console.log('=== END BUNDLE PRICING DEBUG ===');

            // Update existing line item with bundle data
            await supabase
              .from('quote_line_items')
              .update({
                bundle_plan_id: bundle.id,
                service_plan_id: null,
                addon_service_id: null,
                plan_name: bundle.bundle_name,
                plan_description: bundle.bundle_description,
                initial_price: initialPrice,
                recurring_price: recurringPrice,
                final_initial_price: initialPrice,
                final_recurring_price: recurringPrice,
                billing_frequency: bundle.billing_frequency,
                discount_percentage: 0,
                discount_amount: 0,
                is_custom_priced: false,
              })
              .eq('id', lineItem.id);
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

            let finalInitialPrice: number;
            let finalRecurringPrice: number;
            let discountPercentage = 0;
            let discountAmount = 0;
            let discountId: string | null = null;

            // Always calculate the standard pricing (even for custom priced items)
            // This preserves the calculated price for reference
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
            let linearFeetInitialPrice = 0;
            let linearFeetRecurringPrice = 0;

            if (pricingSettings) {
              // Calculate home size pricing if this plan supports it
              if (servicePlan.home_size_pricing) {
                const homeRangeValue = parseRangeValue(homeSizeRange);
                const servicePlanPricing = {
                  home_size_pricing: servicePlan.home_size_pricing,
                  yard_size_pricing: servicePlan.yard_size_pricing,
                  linear_feet_pricing: servicePlan.linear_feet_pricing,
                };
                const homeOptions = generateHomeSizeOptions(pricingSettings, servicePlanPricing);
                const homeSizeOption = findSizeOptionByValue(homeRangeValue, homeOptions);
                homeInitialIncrease = homeSizeOption?.initialIncrease || 0;
                // For one-time plans, never add recurring increases
                homeRecurringIncrease = servicePlan.plan_category === 'one-time' ? 0 : (homeSizeOption?.recurringIncrease || 0);
              }

              // Calculate yard size pricing if this plan supports it
              if (servicePlan.yard_size_pricing) {
                const yardRangeValue = parseRangeValue(yardSizeRange);
                const servicePlanPricing = {
                  home_size_pricing: servicePlan.home_size_pricing,
                  yard_size_pricing: servicePlan.yard_size_pricing,
                  linear_feet_pricing: servicePlan.linear_feet_pricing,
                };
                const yardOptions = generateYardSizeOptions(pricingSettings, servicePlanPricing);
                const yardSizeOption = findSizeOptionByValue(yardRangeValue, yardOptions);
                yardInitialIncrease = yardSizeOption?.initialIncrease || 0;
                // For one-time plans, never add recurring increases
                yardRecurringIncrease = servicePlan.plan_category === 'one-time' ? 0 : (yardSizeOption?.recurringIncrease || 0);
              }

              // Calculate linear feet pricing if this plan supports it
              if (servicePlan.linear_feet_pricing && linearFeetRange) {
                const linearFeetValue = parseRangeValue(linearFeetRange);
                if (linearFeetValue > 0) {
                  const servicePlanPricing = {
                    home_size_pricing: servicePlan.home_size_pricing,
                    yard_size_pricing: servicePlan.yard_size_pricing,
                    linear_feet_pricing: servicePlan.linear_feet_pricing,
                  };
                  const linearFeetPricing = calculateLinearFeetPrice(
                    linearFeetValue,
                    pricingSettings,
                    servicePlanPricing
                  );
                  linearFeetInitialPrice = linearFeetPricing.initialPrice;
                  // For one-time plans, never add recurring prices
                  linearFeetRecurringPrice = servicePlan.plan_category === 'one-time' ? 0 : linearFeetPricing.recurringPrice;
                }
              }
            }

            // Calculate prices with size increases
            const initialPriceWithSize = baseInitialPrice + homeInitialIncrease + yardInitialIncrease + linearFeetInitialPrice;
            const recurringPriceWithSize = baseRecurringPrice + homeRecurringIncrease + yardRecurringIncrease + linearFeetRecurringPrice;

            // If custom pricing is set, use custom values for final prices only
            if (isCustomPriced && customInitialPrice !== undefined && customRecurringPrice !== undefined) {
              // Use custom prices for final values, but keep calculated prices in initial_price/recurring_price
              finalInitialPrice = Math.max(0, customInitialPrice);
              finalRecurringPrice = Math.max(0, customRecurringPrice);
              // Clear discounts when custom pricing is active
              discountPercentage = 0;
              discountAmount = 0;
              discountId = null;
            } else {
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
        } else if (lineItem.bundle_plan_id) {
          // Create new bundle plan line items
          const { data: bundle } = await supabase
            .from('bundle_plans')
            .select('*')
            .eq('id', lineItem.bundle_plan_id)
            .single();

          console.log('=== BUNDLE PRICING DEBUG (CREATE) ===');
          console.log('Bundle data:', JSON.stringify(bundle, null, 2));

          if (bundle) {
            let initialPrice = 0;
            let recurringPrice = 0;

            const pricingMode = bundle.pricing_mode || 'global';

            if (pricingMode === 'per_interval') {
              // Per-interval pricing - determine which interval applies
              const intervalDimension = bundle.interval_dimension || 'home';
              let intervalIndex = 0;

              // Determine the interval index based on the dimension
              if (pricingSettings) {
                if (intervalDimension === 'home' && homeSizeRange) {
                  const homeRangeValue = parseRangeValue(homeSizeRange);
                  const homeOptions = generateHomeSizeOptions(pricingSettings);
                  const homeSizeOption = findSizeOptionByValue(homeRangeValue, homeOptions);
                  intervalIndex = homeSizeOption?.intervalIndex ?? 0;
                } else if (intervalDimension === 'yard' && yardSizeRange) {
                  const yardRangeValue = parseRangeValue(yardSizeRange);
                  const yardOptions = generateYardSizeOptions(pricingSettings);
                  const yardSizeOption = findSizeOptionByValue(yardRangeValue, yardOptions);
                  intervalIndex = yardSizeOption?.intervalIndex ?? 0;
                } else if (intervalDimension === 'linear_feet' && linearFeetRange) {
                  const linearFeetValue = parseRangeValue(linearFeetRange);
                  const linearFeetOptions = generateLinearFeetOptions(pricingSettings);
                  const linearFeetOption = findSizeOptionByValue(linearFeetValue, linearFeetOptions);
                  intervalIndex = linearFeetOption?.intervalIndex ?? 0;
                }
              }

              // Get the pricing configuration for this interval
              const intervalPricing = bundle.interval_pricing?.[intervalIndex];
              console.log('Using per-interval pricing:', {
                intervalDimension,
                intervalIndex,
                intervalPricing
              });

              if (intervalPricing) {
                if (intervalPricing.pricing_type === 'custom') {
                  // Use custom pricing for this interval
                  initialPrice = intervalPricing.custom_initial_price || 0;
                  recurringPrice = intervalPricing.custom_recurring_price || 0;
                  console.log('Using custom pricing for interval:', { initialPrice, recurringPrice });
                } else if (intervalPricing.pricing_type === 'discount') {
                  // Calculate from bundled items and apply interval-specific discount
                  let totalInitial = 0;
                  let totalRecurring = 0;

                  // Sum up service plans with size-based pricing
                  console.log('Bundled service plans:', bundle.bundled_service_plans);
                  if (bundle.bundled_service_plans && Array.isArray(bundle.bundled_service_plans)) {
                    for (const item of bundle.bundled_service_plans) {
                      const { data: plan } = await supabase
                        .from('service_plans')
                        .select('*')
                        .eq('id', item.service_plan_id)
                        .single();

                      if (plan) {
                        const baseInitialPrice = plan.initial_price || 0;
                        const baseRecurringPrice = plan.plan_category === 'one-time' ? 0 : (plan.recurring_price || 0);

                        let homeInitialIncrease = 0;
                        let homeRecurringIncrease = 0;
                        let yardInitialIncrease = 0;
                        let yardRecurringIncrease = 0;
                        let linearFeetInitialPrice = 0;
                        let linearFeetRecurringPrice = 0;

                        if (pricingSettings) {
                          if (plan.home_size_pricing) {
                            const homeRangeValue = parseRangeValue(homeSizeRange);
                            const servicePlanPricing = {
                              home_size_pricing: plan.home_size_pricing,
                              yard_size_pricing: plan.yard_size_pricing,
                              linear_feet_pricing: plan.linear_feet_pricing,
                            };
                            const homeOptions = generateHomeSizeOptions(pricingSettings, servicePlanPricing);
                            const homeSizeOption = findSizeOptionByValue(homeRangeValue, homeOptions);
                            homeInitialIncrease = homeSizeOption?.initialIncrease || 0;
                            homeRecurringIncrease = plan.plan_category === 'one-time' ? 0 : (homeSizeOption?.recurringIncrease || 0);
                          }

                          if (plan.yard_size_pricing) {
                            const yardRangeValue = parseRangeValue(yardSizeRange);
                            const servicePlanPricing = {
                              home_size_pricing: plan.home_size_pricing,
                              yard_size_pricing: plan.yard_size_pricing,
                              linear_feet_pricing: plan.linear_feet_pricing,
                            };
                            const yardOptions = generateYardSizeOptions(pricingSettings, servicePlanPricing);
                            const yardSizeOption = findSizeOptionByValue(yardRangeValue, yardOptions);
                            yardInitialIncrease = yardSizeOption?.initialIncrease || 0;
                            yardRecurringIncrease = plan.plan_category === 'one-time' ? 0 : (yardSizeOption?.recurringIncrease || 0);
                          }

                          if (plan.linear_feet_pricing && linearFeetRange) {
                            const linearFeetValue = parseRangeValue(linearFeetRange);
                            if (linearFeetValue > 0) {
                              const servicePlanPricing = {
                                home_size_pricing: plan.home_size_pricing,
                                yard_size_pricing: plan.yard_size_pricing,
                                linear_feet_pricing: plan.linear_feet_pricing,
                              };
                              const linearFeetPricing = calculateLinearFeetPrice(
                                linearFeetValue,
                                pricingSettings,
                                servicePlanPricing
                              );
                              linearFeetInitialPrice = linearFeetPricing.initialPrice;
                              linearFeetRecurringPrice = plan.plan_category === 'one-time' ? 0 : linearFeetPricing.recurringPrice;
                            }
                          }
                        }

                        const planInitialPrice = baseInitialPrice + homeInitialIncrease + yardInitialIncrease + linearFeetInitialPrice;
                        const planRecurringPrice = baseRecurringPrice + homeRecurringIncrease + yardRecurringIncrease + linearFeetRecurringPrice;

                        totalInitial += planInitialPrice;
                        totalRecurring += planRecurringPrice;
                      }
                    }
                  }

                  // Sum up add-ons
                  if (bundle.bundled_add_ons && Array.isArray(bundle.bundled_add_ons)) {
                    for (const item of bundle.bundled_add_ons) {
                      const { data: addon } = await supabase
                        .from('add_on_services')
                        .select('initial_price, recurring_price')
                        .eq('id', item.add_on_id)
                        .single();

                      if (addon) {
                        totalInitial += addon.initial_price || 0;
                        totalRecurring += addon.recurring_price || 0;
                      }
                    }
                  }

                  // Apply interval-specific discount
                  if (intervalPricing.discount_type === 'percentage') {
                    totalInitial = totalInitial * (1 - (intervalPricing.discount_value || 0) / 100);
                  } else if (intervalPricing.discount_type === 'fixed') {
                    totalInitial = Math.max(0, totalInitial - (intervalPricing.discount_value || 0));
                  }

                  const recurringDiscountType = intervalPricing.recurring_discount_type || intervalPricing.discount_type;
                  const recurringDiscountValue = intervalPricing.recurring_discount_value ?? intervalPricing.discount_value;

                  if (recurringDiscountType === 'percentage') {
                    totalRecurring = totalRecurring * (1 - (recurringDiscountValue || 0) / 100);
                  } else if (recurringDiscountType === 'fixed') {
                    totalRecurring = Math.max(0, totalRecurring - (recurringDiscountValue || 0));
                  }

                  initialPrice = totalInitial;
                  recurringPrice = totalRecurring;
                  console.log('Interval discount pricing:', { initialPrice, recurringPrice });
                }
              }
            } else if (bundle.pricing_type === 'custom') {
              // Global custom pricing
              initialPrice = bundle.custom_initial_price || 0;
              recurringPrice = bundle.custom_recurring_price || 0;
              console.log('Using global custom pricing:', { initialPrice, recurringPrice });
            } else if (bundle.pricing_type === 'discount') {
              // Global discount pricing
              console.log('Using discount pricing');
              // Calculate from bundled items and apply discount
              let totalInitial = 0;
              let totalRecurring = 0;

              // Sum up service plans with size-based pricing
              console.log('Bundled service plans:', bundle.bundled_service_plans);
              if (bundle.bundled_service_plans && Array.isArray(bundle.bundled_service_plans)) {
                for (const item of bundle.bundled_service_plans) {
                  console.log('Fetching service plan:', item.service_plan_id);
                  const { data: plan, error: planError } = await supabase
                    .from('service_plans')
                    .select('*')
                    .eq('id', item.service_plan_id)
                    .single();

                  console.log('Service plan result:', { plan, planError });
                  if (plan) {
                    // Start with base prices
                    const baseInitialPrice = plan.initial_price || 0;
                    const baseRecurringPrice = plan.plan_category === 'one-time' ? 0 : (plan.recurring_price || 0);

                    // Calculate size-based price increases
                    let homeInitialIncrease = 0;
                    let homeRecurringIncrease = 0;
                    let yardInitialIncrease = 0;
                    let yardRecurringIncrease = 0;
                    let linearFeetInitialPrice = 0;
                    let linearFeetRecurringPrice = 0;

                    if (pricingSettings) {
                      // Home size pricing
                      if (plan.home_size_pricing) {
                        const homeRangeValue = parseRangeValue(homeSizeRange);
                        const servicePlanPricing = {
                          home_size_pricing: plan.home_size_pricing,
                          yard_size_pricing: plan.yard_size_pricing,
                          linear_feet_pricing: plan.linear_feet_pricing,
                        };
                        const homeOptions = generateHomeSizeOptions(pricingSettings, servicePlanPricing);
                        const homeSizeOption = findSizeOptionByValue(homeRangeValue, homeOptions);
                        homeInitialIncrease = homeSizeOption?.initialIncrease || 0;
                        homeRecurringIncrease = plan.plan_category === 'one-time' ? 0 : (homeSizeOption?.recurringIncrease || 0);
                      }

                      // Yard size pricing
                      if (plan.yard_size_pricing) {
                        const yardRangeValue = parseRangeValue(yardSizeRange);
                        const servicePlanPricing = {
                          home_size_pricing: plan.home_size_pricing,
                          yard_size_pricing: plan.yard_size_pricing,
                          linear_feet_pricing: plan.linear_feet_pricing,
                        };
                        const yardOptions = generateYardSizeOptions(pricingSettings, servicePlanPricing);
                        const yardSizeOption = findSizeOptionByValue(yardRangeValue, yardOptions);
                        yardInitialIncrease = yardSizeOption?.initialIncrease || 0;
                        yardRecurringIncrease = plan.plan_category === 'one-time' ? 0 : (yardSizeOption?.recurringIncrease || 0);
                      }

                      // Linear feet pricing
                      if (plan.linear_feet_pricing && linearFeetRange) {
                        const linearFeetValue = parseRangeValue(linearFeetRange);
                        if (linearFeetValue > 0) {
                          const servicePlanPricing = {
                            home_size_pricing: plan.home_size_pricing,
                            yard_size_pricing: plan.yard_size_pricing,
                            linear_feet_pricing: plan.linear_feet_pricing,
                          };
                          const linearFeetPricing = calculateLinearFeetPrice(
                            linearFeetValue,
                            pricingSettings,
                            servicePlanPricing
                          );
                          linearFeetInitialPrice = linearFeetPricing.initialPrice;
                          linearFeetRecurringPrice = plan.plan_category === 'one-time' ? 0 : linearFeetPricing.recurringPrice;
                        }
                      }
                    }

                    // Calculate final prices with size adjustments
                    const planInitialPrice = baseInitialPrice + homeInitialIncrease + yardInitialIncrease + linearFeetInitialPrice;
                    const planRecurringPrice = baseRecurringPrice + homeRecurringIncrease + yardRecurringIncrease + linearFeetRecurringPrice;

                    totalInitial += planInitialPrice;
                    totalRecurring += planRecurringPrice;
                    console.log('Service plan prices (with size adjustments):', {
                      plan_name: plan.plan_name,
                      baseInitialPrice,
                      baseRecurringPrice,
                      homeInitialIncrease,
                      homeRecurringIncrease,
                      yardInitialIncrease,
                      yardRecurringIncrease,
                      linearFeetInitialPrice,
                      linearFeetRecurringPrice,
                      planInitialPrice,
                      planRecurringPrice
                    });
                    console.log('Running totals after service plan:', { totalInitial, totalRecurring });
                  }
                }
              }

              // Sum up add-ons
              console.log('Bundled add-ons:', bundle.bundled_add_ons);
              if (bundle.bundled_add_ons && Array.isArray(bundle.bundled_add_ons)) {
                for (const item of bundle.bundled_add_ons) {
                  console.log('Fetching add-on:', item.add_on_id);
                  const { data: addon, error: addonError } = await supabase
                    .from('add_on_services')
                    .select('initial_price, recurring_price')
                    .eq('id', item.add_on_id)
                    .single();

                  console.log('Add-on result:', { addon, addonError });
                  if (addon) {
                    totalInitial += addon.initial_price || 0;
                    totalRecurring += addon.recurring_price || 0;
                    console.log('Running totals after add-on:', { totalInitial, totalRecurring });
                  }
                }
              }

              console.log('Totals before discount:', { totalInitial, totalRecurring });

              // Apply discount based on applies_to_price setting
              const appliesToPrice = bundle.applies_to_price || 'both';
              console.log('Discount settings:', {
                appliesToPrice,
                discount_type: bundle.discount_type,
                discount_value: bundle.discount_value,
                recurring_discount_type: bundle.recurring_discount_type,
                recurring_discount_value: bundle.recurring_discount_value
              });

              if (appliesToPrice === 'initial' || appliesToPrice === 'both') {
                if (bundle.discount_type === 'percentage') {
                  totalInitial = totalInitial * (1 - (bundle.discount_value || 0) / 100);
                } else if (bundle.discount_type === 'fixed') {
                  totalInitial = Math.max(0, totalInitial - (bundle.discount_value || 0));
                }
                console.log('Initial price after discount:', totalInitial);
              }

              if (appliesToPrice === 'recurring' || appliesToPrice === 'both') {
                // Use recurring discount settings if available, otherwise use initial discount
                const recurringDiscountType = bundle.recurring_discount_type || bundle.discount_type;
                const recurringDiscountValue = bundle.recurring_discount_value ?? bundle.discount_value;

                if (recurringDiscountType === 'percentage') {
                  totalRecurring = totalRecurring * (1 - (recurringDiscountValue || 0) / 100);
                } else if (recurringDiscountType === 'fixed') {
                  totalRecurring = Math.max(0, totalRecurring - (recurringDiscountValue || 0));
                }
                console.log('Recurring price after discount:', totalRecurring);
              }

              initialPrice = totalInitial;
              recurringPrice = totalRecurring;
            }

            console.log('Final prices:', { initialPrice, recurringPrice });
            console.log('=== END BUNDLE PRICING DEBUG ===');

            // Prepare update/insert data for bundle line item
            const bundleData: any = {
              bundle_plan_id: bundle.id,
              service_plan_id: null,
              addon_service_id: null,
              plan_name: bundle.bundle_name,
              plan_description: bundle.bundle_description,
              initial_price: initialPrice,
              recurring_price: recurringPrice,
              final_initial_price: initialPrice,
              final_recurring_price: recurringPrice,
              billing_frequency: bundle.billing_frequency,
              display_order: lineItem.display_order,
              discount_percentage: 0,
              discount_amount: 0,
              is_custom_priced: false,
            };

            if (lineItem.id) {
              // Update existing bundle line item
              await supabase
                .from('quote_line_items')
                .update(bundleData)
                .eq('id', lineItem.id);
            } else {
              // Create new bundle line item
              await supabase
                .from('quote_line_items')
                .insert({
                  ...bundleData,
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