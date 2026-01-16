/**
 * Quote utility functions
 */

import { randomUUID } from 'crypto';
import {
  generateHomeSizeOptions,
  generateYardSizeOptions,
  findSizeOptionByValue,
  calculateLinearFeetPrice,
} from './pricing-calculations';

/**
 * Generates a secure random UUID token for quote access
 * This token must be included in the URL for public quote access
 *
 * @returns A new UUID v4 token
 *
 * @example
 * generateQuoteToken()
 * // Returns: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
 */
export function generateQuoteToken(): string {
  return randomUUID();
}

/**
 * Generates a quote URL path (without domain) for a given company, quote, and token
 * This path can be stored in the database and works across all environments
 *
 * @param companySlug - The company's URL slug
 * @param quoteId - The quote ID (UUID)
 * @param token - The secure access token for the quote
 * @returns Path to the public quote page with token
 *
 * @example
 * generateQuoteUrl('northwest-exterminating', '123e4567-e89b-12d3-a456-426614174000', '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d')
 * // Returns: '/northwest-exterminating/quote/123e4567-e89b-12d3-a456-426614174000?token=9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
 */
export function generateQuoteUrl(companySlug: string, quoteId: string, token: string): string {
  return `/${companySlug}/quote/${quoteId}?token=${token}`;
}

/**
 * Converts a quote URL path to a full URL with domain
 * Uses NEXT_PUBLIC_SITE_URL environment variable with localhost fallback
 *
 * @param quotePath - The quote path (e.g., '/northwest-exterminating/quote/123')
 * @returns Full URL with domain
 *
 * @example
 * getFullQuoteUrl('/northwest-exterminating/quote/123e4567-e89b-12d3-a456-426614174000')
 * // Returns: 'http://localhost:3000/northwest-exterminating/quote/123e4567-e89b-12d3-a456-426614174000'
 */
export function getFullQuoteUrl(quotePath: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  // Remove leading slash if present to avoid double slashes
  const cleanPath = quotePath.startsWith('/') ? quotePath.slice(1) : quotePath;
  return `${baseUrl}/${cleanPath}`;
}

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
 * This is a shared utility used by both the quotes API and service-addresses API
 */
export async function recalculateAllLineItemPrices(
  supabase: any,
  quoteId: string,
  newHomeSize?: string,
  newYardSize?: string,
  newLinearFeet?: string
) {
  // Fetch quote with company_id and current size ranges
  const { data: quote } = await supabase
    .from('quotes')
    .select('company_id, home_size_range, yard_size_range, linear_feet_range')
    .eq('id', quoteId)
    .single();

  if (!quote) return;

  const homeSizeRange = newHomeSize !== undefined ? newHomeSize : quote.home_size_range;
  const yardSizeRange = newYardSize !== undefined ? newYardSize : quote.yard_size_range;
  const linearFeetRange = newLinearFeet !== undefined ? newLinearFeet : quote.linear_feet_range;

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
    let linearFeetInitialPrice = 0;
    let linearFeetRecurringPrice = 0;

    if (servicePlan.home_size_pricing && servicePlan.yard_size_pricing) {
      const homeRangeValue = parseRangeValue(homeSizeRange);
      const yardRangeValue = parseRangeValue(yardSizeRange);

      const servicePlanPricing = {
        home_size_pricing: servicePlan.home_size_pricing,
        yard_size_pricing: servicePlan.yard_size_pricing,
        linear_feet_pricing: servicePlan.linear_feet_pricing,
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

      // Calculate linear feet pricing if applicable
      if (servicePlan.linear_feet_pricing && linearFeetRange) {
        const linearFeetValue = parseRangeValue(linearFeetRange);
        if (linearFeetValue > 0) {
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
