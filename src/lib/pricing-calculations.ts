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

    // Calculate pricing increases based on interval index and mode
    let initialIncrease = 0;
    let recurringIncrease = 0;

    if (servicePlanPricing?.home_size_pricing) {
      const pricing = servicePlanPricing.home_size_pricing;
      const mode = pricing.pricing_mode || 'linear'; // Default to linear for backwards compatibility

      if (mode === 'custom') {
        // Custom pricing: use array lookup
        initialIncrease = pricing.custom_initial_prices?.[intervalIndex] ?? 0;
        recurringIncrease = pricing.custom_recurring_prices?.[intervalIndex] ?? 0;
      } else {
        // Linear pricing (default/existing behavior)
        initialIncrease = intervalIndex * (pricing.initial_cost_per_interval ?? 0);
        recurringIncrease = intervalIndex * (pricing.recurring_cost_per_interval ?? 0);
      }
    }

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
 * Convert decimal acres to readable fractional format
 * Examples: 0.25 -> "1/4", 0.5 -> "1/2", 0.75 -> "3/4", 1.25 -> "1 1/4"
 * Rounds to nearest quarter: 0.26 -> "1/4", 0.51 -> "1/2", 1.01 -> "1"
 */
export function formatAcresFractional(acres: number): string {
  const wholeNumber = Math.floor(acres);
  const decimal = acres - wholeNumber;

  // Round decimal to nearest quarter (0, 0.25, 0.5, 0.75)
  const roundedDecimal = Math.round(decimal * 4) / 4;

  // Map rounded decimals to fractions
  const fractionMap: { [key: number]: string } = {
    0: '',
    0.25: '1/4',
    0.5: '1/2',
    0.75: '3/4',
  };

  const fraction = fractionMap[roundedDecimal];

  if (wholeNumber === 0 && roundedDecimal > 0) {
    return fraction;
  } else if (wholeNumber > 0 && roundedDecimal > 0) {
    return `${wholeNumber} ${fraction}`;
  } else if (wholeNumber > 0 && roundedDecimal === 0) {
    return `${wholeNumber}`;
  } else {
    // Edge case: 0 acres
    return '0';
  }
}

/**
 * Generate yard size dropdown options based on company intervals
 * Example output: "Up to 1/4 Acre", "1/4 to 1/2 Acre", "1 to 1 1/4 Acres", "2+ Acres"
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

    // Calculate pricing increases based on interval index and mode
    let initialIncrease = 0;
    let recurringIncrease = 0;

    if (servicePlanPricing?.yard_size_pricing) {
      const pricing = servicePlanPricing.yard_size_pricing;
      const mode = pricing.pricing_mode || 'linear'; // Default to linear for backwards compatibility

      if (mode === 'custom') {
        // Custom pricing: use array lookup
        initialIncrease = pricing.custom_initial_prices?.[intervalIndex] ?? 0;
        recurringIncrease = pricing.custom_recurring_prices?.[intervalIndex] ?? 0;
      } else {
        // Linear pricing (default/existing behavior)
        initialIncrease = intervalIndex * (pricing.initial_cost_per_interval ?? 0);
        recurringIncrease = intervalIndex * (pricing.recurring_cost_per_interval ?? 0);
      }
    }

    // Build label with fractional values
    let label = '';
    const acreWord = rangeEnd > 1 || isLastInterval ? 'Acres' : 'Acre';

    if (currentSize === 0) {
      // First interval: "Up to 1/4 Acre"
      label = `Up to ${formatAcresFractional(rangeEnd)} ${acreWord}`;
    } else if (isLastInterval) {
      // Last interval: "2+ Acres"
      label = `${formatAcresFractional(rangeStart)}+ ${acreWord}`;
    } else {
      // Middle intervals: "1/4 to 1/2 Acre" or "1 to 1 1/4 Acres"
      const startFormatted = formatAcresFractional(rangeStart);
      const endFormatted = formatAcresFractional(rangeEnd);
      label = `${startFormatted} to ${endFormatted} ${acreWord}`;
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

  // Handle null/undefined baseRecurringPrice for one-time services
  const safeBaseRecurringPrice = baseRecurringPrice || 0;

  return {
    baseInitialPrice,
    baseRecurringPrice: safeBaseRecurringPrice,
    homeSizeInitialIncrease,
    homeSizeRecurringIncrease,
    yardSizeInitialIncrease,
    yardSizeRecurringIncrease,
    totalInitialPrice:
      baseInitialPrice + homeSizeInitialIncrease + yardSizeInitialIncrease,
    totalRecurringPrice:
      safeBaseRecurringPrice +
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

/**
 * Calculate how many intervals exist for a given dimension
 * Used to determine array length for custom pricing mode
 */
export function calculateIntervalCount(
  settings: CompanyPricingSettings,
  dimension: 'home' | 'yard'
): number {
  if (dimension === 'home') {
    const range = settings.max_home_sq_ft - settings.base_home_sq_ft;
    const intervals = Math.ceil(range / settings.home_sq_ft_interval);
    return intervals + 1; // +1 for the base interval (0)
  } else {
    const range = settings.max_yard_acres - settings.base_yard_acres;
    const intervals = Math.ceil(range / settings.yard_acres_interval);
    return intervals + 1;
  }
}

/**
 * Get human-readable label for an interval
 * Used in custom pricing UI to show what each interval represents
 */
export function getIntervalLabel(
  settings: CompanyPricingSettings | null | undefined,
  dimension: 'home' | 'yard',
  intervalIndex: number
): string {
  if (!settings) {
    return `Interval ${intervalIndex}`;
  }

  // Generate all options and find the matching one
  const options = dimension === 'home'
    ? generateHomeSizeOptions(settings)
    : generateYardSizeOptions(settings);

  return options[intervalIndex]?.label || `Interval ${intervalIndex}`;
}