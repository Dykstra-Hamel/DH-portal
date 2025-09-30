import {
  CompanyPricingSettings,
  ServicePlanPricing,
  SizeOption,
  PricingCalculation,
} from '@/types/pricing';

/**
 * Generate home size dropdown options based on company intervals
 * Example output: "0-1500 Sq Ft", "1501-2000 Sq Ft (+$20 initial, +$10/month)", "3000+ Sq Ft"
 */
export function generateHomeSizeOptions(
  companySettings: CompanyPricingSettings,
  servicePlanPricing?: ServicePlanPricing
): SizeOption[] {
  const options: SizeOption[] = [];
  const { base_home_sq_ft, home_sq_ft_interval, max_home_sq_ft } =
    companySettings;

  let currentSize = 0;
  let intervalIndex = 0;

  // Generate intervals: 0-base, base+1 to base+interval, etc.
  while (currentSize <= max_home_sq_ft) {
    const rangeStart = currentSize;
    const rangeEnd =
      currentSize === 0
        ? base_home_sq_ft
        : Math.min(currentSize + home_sq_ft_interval, max_home_sq_ft);

    const isLastInterval = rangeEnd >= max_home_sq_ft;

    // Calculate pricing increases based on interval index
    const initialIncrease = servicePlanPricing
      ? intervalIndex *
        servicePlanPricing.home_size_pricing.initial_cost_per_interval
      : 0;
    const recurringIncrease = servicePlanPricing
      ? intervalIndex *
        servicePlanPricing.home_size_pricing.recurring_cost_per_interval
      : 0;

    // Build label
    let label = '';
    if (currentSize === 0) {
      // First interval: "0-1500 Sq Ft"
      label = `0-${rangeEnd.toLocaleString()} Sq Ft`;
    } else if (isLastInterval) {
      // Last interval: "3000+ Sq Ft"
      label = `${rangeStart.toLocaleString()}+ Sq Ft`;
    } else {
      // Middle intervals: "1501-2000 Sq Ft"
      label = `${rangeStart.toLocaleString()}-${rangeEnd.toLocaleString()} Sq Ft`;
    }

    // Add pricing info if service plan is selected and not the base interval
    if (servicePlanPricing && intervalIndex > 0) {
      label += ` (+$${initialIncrease.toFixed(
        2
      )} initial, +$${recurringIncrease.toFixed(2)}/month)`;
    }

    options.push({
      value: isLastInterval ? `${rangeStart}+` : `${rangeStart}-${rangeEnd}`,
      label,
      intervalIndex,
      initialIncrease,
      recurringIncrease,
      rangeStart,
      rangeEnd: isLastInterval ? null : rangeEnd,
    });

    if (isLastInterval) break;

    // Move to next interval
    if (currentSize === 0) {
      currentSize = base_home_sq_ft + 1;
    } else {
      currentSize = rangeEnd + 1;
    }
    intervalIndex++;
  }

  return options;
}

/**
 * Generate yard size dropdown options based on company intervals
 * Example output: "0-0.25 Acres", "0.26-0.50 Acres (+$25 initial, +$15/month)", "2.0+ Acres"
 */
export function generateYardSizeOptions(
  companySettings: CompanyPricingSettings,
  servicePlanPricing?: ServicePlanPricing
): SizeOption[] {
  const options: SizeOption[] = [];
  const { base_yard_acres, yard_acres_interval, max_yard_acres } =
    companySettings;

  let currentSize = 0;
  let intervalIndex = 0;

  // Generate intervals similar to home size
  while (currentSize <= max_yard_acres) {
    const rangeStart = currentSize;
    const rangeEnd =
      currentSize === 0
        ? base_yard_acres
        : Math.min(
            parseFloat((currentSize + yard_acres_interval).toFixed(3)),
            max_yard_acres
          );

    const isLastInterval = rangeEnd >= max_yard_acres;

    // Calculate pricing increases based on interval index
    const initialIncrease = servicePlanPricing
      ? intervalIndex *
        servicePlanPricing.yard_size_pricing.initial_cost_per_interval
      : 0;
    const recurringIncrease = servicePlanPricing
      ? intervalIndex *
        servicePlanPricing.yard_size_pricing.recurring_cost_per_interval
      : 0;

    // Build label
    let label = '';
    if (currentSize === 0) {
      // First interval: "0-0.25 Acres"
      label = `0-${rangeEnd.toFixed(2)} Acres`;
    } else if (isLastInterval) {
      // Last interval: "2.0+ Acres"
      label = `${rangeStart.toFixed(2)}+ Acres`;
    } else {
      // Middle intervals: "0.26-0.50 Acres"
      label = `${rangeStart.toFixed(2)}-${rangeEnd.toFixed(2)} Acres`;
    }

    // Add pricing info if service plan is selected and not the base interval
    if (servicePlanPricing && intervalIndex > 0) {
      label += ` (+$${initialIncrease.toFixed(
        2
      )} initial, +$${recurringIncrease.toFixed(2)}/month)`;
    }

    options.push({
      value: isLastInterval
        ? `${rangeStart.toFixed(2)}+`
        : `${rangeStart.toFixed(2)}-${rangeEnd.toFixed(2)}`,
      label,
      intervalIndex,
      initialIncrease,
      recurringIncrease,
      rangeStart,
      rangeEnd: isLastInterval ? null : rangeEnd,
    });

    if (isLastInterval) break;

    // Move to next interval
    if (currentSize === 0) {
      currentSize = parseFloat((base_yard_acres + 0.01).toFixed(3));
    } else {
      currentSize = parseFloat((rangeEnd + 0.01).toFixed(3));
    }
    intervalIndex++;
  }

  return options;
}

/**
 * Calculate total pricing based on selected home size and yard size intervals
 */
export function calculateTotalPricing(
  baseInitialPrice: number,
  baseRecurringPrice: number,
  homeSizeOption?: SizeOption,
  yardSizeOption?: SizeOption
): PricingCalculation {
  const homeSizeInitialIncrease = homeSizeOption?.initialIncrease || 0;
  const homeSizeRecurringIncrease = homeSizeOption?.recurringIncrease || 0;
  const yardSizeInitialIncrease = yardSizeOption?.initialIncrease || 0;
  const yardSizeRecurringIncrease = yardSizeOption?.recurringIncrease || 0;

  return {
    baseInitialPrice,
    baseRecurringPrice,
    homeSizeInitialIncrease,
    homeSizeRecurringIncrease,
    yardSizeInitialIncrease,
    yardSizeRecurringIncrease,
    totalInitialPrice:
      baseInitialPrice + homeSizeInitialIncrease + yardSizeInitialIncrease,
    totalRecurringPrice:
      baseRecurringPrice +
      homeSizeRecurringIncrease +
      yardSizeRecurringIncrease,
  };
}

/**
 * Find the appropriate size option based on a numeric value
 * For example, if homeSize is 1800 sq ft, find the "1501-2000" option
 */
export function findSizeOptionByValue(
  value: number,
  options: SizeOption[]
): SizeOption | undefined {
  return options.find((option) => {
    if (option.rangeEnd === null) {
      // This is the "max+" option
      return value >= option.rangeStart;
    }
    return value >= option.rangeStart && value <= option.rangeEnd;
  });
}