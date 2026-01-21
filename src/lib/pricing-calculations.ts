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
 * Format home size range string into human-readable display
 * Examples: "0-1500" → "Up to 1,500 Sq Ft", "1501-2000" → "1,501-2,000 Sq Ft", "3000+" → "3,000+ Sq Ft"
 */
export function formatHomeSizeRange(range: string): string {
  if (!range) return 'Not specified';

  // Handle "3000+" format (open-ended)
  if (range.includes('+')) {
    const startValue = parseInt(range.replace('+', ''));
    return `${startValue.toLocaleString()}+ Sq Ft`;
  }

  // Handle "0-1500" or "1501-2000" format
  if (range.includes('-')) {
    const [start, end] = range.split('-').map(Number);

    // Special case: first interval starts at 0
    if (start === 0) {
      return `Up to ${end.toLocaleString()} Sq Ft`;
    }

    // Standard interval
    return `${start.toLocaleString()}-${end.toLocaleString()} Sq Ft`;
  }

  // Fallback: return original value
  return range;
}

/**
 * Format yard size range string into human-readable display with fractions
 * Examples: "0.00-0.25" → "Up to 1/4 Acre", "0.26-0.50" → "1/4 to 1/2 Acre", "2.00+" → "2+ Acres"
 */
export function formatYardSizeRange(range: string): string {
  if (!range) return 'Not specified';

  // Handle "2.00+" format (open-ended)
  if (range.includes('+')) {
    const startValue = parseFloat(range.replace('+', ''));
    const formatted = formatAcresFractional(startValue);
    return `${formatted}+ Acres`;
  }

  // Handle "0.00-0.25" or "0.26-0.50" format
  if (range.includes('-')) {
    const [start, end] = range.split('-').map(parseFloat);
    const startFormatted = formatAcresFractional(start);
    const endFormatted = formatAcresFractional(end);
    const acreWord = end > 1 ? 'Acres' : 'Acre';

    // Special case: first interval starts at 0
    if (start === 0) {
      return `Up to ${endFormatted} ${acreWord}`;
    }

    // Standard interval
    return `${startFormatted} to ${endFormatted} ${acreWord}`;
  }

  // Fallback: return original value
  return range;
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
 * Generate linear feet dropdown options based on company intervals
 * Example output: "0-100 Linear Ft", "101-150 Linear Ft (+$15 initial, +$8/month)", "500+ Linear Ft"
 */
export function generateLinearFeetOptions(
  companySettings: CompanyPricingSettings,
  servicePlanPricing?: ServicePlanPricing
): SizeOption[] {
  const options: SizeOption[] = [];
  const { base_linear_feet, linear_feet_interval, max_linear_feet } =
    companySettings;

  let currentSize = 0;
  let intervalIndex = 0;

  // Generate intervals: 0-base, base+1 to base+interval, etc.
  while (currentSize <= max_linear_feet) {
    const rangeStart = currentSize;
    const rangeEnd =
      currentSize === 0
        ? base_linear_feet
        : Math.min(currentSize + linear_feet_interval, max_linear_feet);

    const isLastInterval = rangeEnd >= max_linear_feet;

    // Calculate pricing increases based on interval index and mode
    let initialIncrease = 0;
    let recurringIncrease = 0;

    if (servicePlanPricing?.linear_feet_pricing) {
      const pricing = servicePlanPricing.linear_feet_pricing;
      // Linear feet uses tiered pricing with per-foot or flat rates
      // Initial pricing is based on per-foot rates in the array
      initialIncrease = 0; // Linear feet initial pricing is calculated differently
      recurringIncrease = 0; // Linear feet recurring pricing is calculated differently
    }

    // Build label
    let label = '';
    if (currentSize === 0) {
      // First interval: "0-100 Linear Ft"
      label = `0-${rangeEnd.toLocaleString()} Linear Ft`;
    } else if (isLastInterval) {
      // Last interval: "500+ Linear Ft"
      label = `${rangeStart.toLocaleString()}+ Linear Ft`;
    } else {
      // Middle intervals: "101-150 Linear Ft"
      label = `${rangeStart.toLocaleString()}-${rangeEnd.toLocaleString()} Linear Ft`;
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
      currentSize = base_linear_feet + 1;
    } else {
      currentSize = rangeEnd + 1;
    }
    intervalIndex++;
  }

  return options;
}

/**
 * Format linear feet range string into human-readable display
 * Examples: "0-100" → "Up to 100 Linear Ft", "101-150" → "101-150 Linear Ft", "500+" → "500+ Linear Ft"
 */
export function formatLinearFeetRange(range: string): string {
  if (!range) return 'Not specified';

  // Handle "500+" format (open-ended)
  if (range.includes('+')) {
    const startValue = parseInt(range.replace('+', ''));
    return `${startValue.toLocaleString()}+ Linear Ft`;
  }

  // Handle "0-100" or "101-150" format
  if (range.includes('-')) {
    const [start, end] = range.split('-').map(Number);

    // Special case: first interval starts at 0
    if (start === 0) {
      return `Up to ${end.toLocaleString()} Linear Ft`;
    }

    // Standard interval
    return `${start.toLocaleString()}-${end.toLocaleString()} Linear Ft`;
  }

  // Fallback: return original value
  return range;
}

/**
 * Calculate linear feet pricing based on tiered rates
 * Unlike home/yard which add fixed amounts, linear feet pricing multiplies actual footage by the rate for that interval
 * Initial pricing is always per-foot. Recurring can be per-foot OR flat monthly.
 *
 * @param linearFeet - Actual linear feet measurement
 * @param pricingSettings - Company pricing settings for interval ranges
 * @param servicePlanPricing - Service plan pricing with per-foot rates for each interval
 * @returns Object with initial and recurring prices
 */
export function calculateLinearFeetPrice(
  linearFeet: number,
  pricingSettings: CompanyPricingSettings,
  servicePlanPricing?: ServicePlanPricing
): { initialPrice: number; recurringPrice: number } {
  if (!servicePlanPricing?.linear_feet_pricing || linearFeet <= 0) {
    return { initialPrice: 0, recurringPrice: 0 };
  }

  const { linear_feet_pricing } = servicePlanPricing;
  const {
    initial_price_per_foot,
    recurring_pricing_types,
    recurring_price_per_foot,
    recurring_flat_price,
  } = linear_feet_pricing;

  // Generate options to determine which interval the linear feet falls into
  const options = generateLinearFeetOptions(pricingSettings);

  // Find the interval that contains this linear feet measurement
  const matchingOption = options.find(option => {
    if (option.rangeEnd === null) {
      // This is the "max+" option
      return linearFeet >= option.rangeStart;
    }
    return linearFeet >= option.rangeStart && linearFeet <= option.rangeEnd;
  });

  if (!matchingOption) {
    return { initialPrice: 0, recurringPrice: 0 };
  }

  // Calculate initial price: always per-foot
  const initialRate = initial_price_per_foot[matchingOption.intervalIndex] ?? initial_price_per_foot[0] ?? 0;
  const initialPrice = linearFeet * initialRate;

  // Calculate recurring price: check THIS interval's type (per-interval, not global)
  let recurringPrice = 0;
  const recurringType = recurring_pricing_types?.[matchingOption.intervalIndex] ?? 'per_foot';

  if (recurringType === 'flat') {
    // Flat pricing: use flat rate directly (no multiplication)
    recurringPrice = recurring_flat_price?.[matchingOption.intervalIndex] ?? recurring_flat_price?.[0] ?? 0;
  } else {
    // Per-foot pricing: multiply by linear feet
    const recurringRate = recurring_price_per_foot?.[matchingOption.intervalIndex] ?? recurring_price_per_foot?.[0] ?? 0;
    recurringPrice = linearFeet * recurringRate;
  }

  return {
    initialPrice,
    recurringPrice,
  };
}

/**
 * Calculate total pricing based on selected home size, yard size, and linear feet intervals
 */
export function calculateTotalPricing(
  baseInitialPrice: number,
  baseRecurringPrice: number,
  homeSizeOption?: SizeOption,
  yardSizeOption?: SizeOption,
  linearFeetOption?: SizeOption
): PricingCalculation {
  const homeSizeInitialIncrease = homeSizeOption?.initialIncrease || 0;
  const homeSizeRecurringIncrease = homeSizeOption?.recurringIncrease || 0;
  const yardSizeInitialIncrease = yardSizeOption?.initialIncrease || 0;
  const yardSizeRecurringIncrease = yardSizeOption?.recurringIncrease || 0;
  const linearFeetInitialIncrease = linearFeetOption?.initialIncrease || 0;
  const linearFeetRecurringIncrease = linearFeetOption?.recurringIncrease || 0;

  // Handle null/undefined baseRecurringPrice for one-time services
  const safeBaseRecurringPrice = baseRecurringPrice || 0;

  return {
    baseInitialPrice,
    baseRecurringPrice: safeBaseRecurringPrice,
    homeSizeInitialIncrease,
    homeSizeRecurringIncrease,
    yardSizeInitialIncrease,
    yardSizeRecurringIncrease,
    linearFeetInitialIncrease,
    linearFeetRecurringIncrease,
    totalInitialPrice:
      baseInitialPrice + homeSizeInitialIncrease + yardSizeInitialIncrease + linearFeetInitialIncrease,
    totalRecurringPrice:
      safeBaseRecurringPrice +
      homeSizeRecurringIncrease +
      yardSizeRecurringIncrease +
      linearFeetRecurringIncrease,
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
  dimension: 'home' | 'yard' | 'linear_feet'
): number {
  // Generate the actual options and return the length
  // This ensures the count always matches what generateHomeSizeOptions/generateYardSizeOptions/generateLinearFeetOptions creates
  const options = dimension === 'home'
    ? generateHomeSizeOptions(settings)
    : dimension === 'yard'
    ? generateYardSizeOptions(settings)
    : generateLinearFeetOptions(settings);

  return options.length;
}

/**
 * Get human-readable label for an interval
 * Used in custom pricing UI to show what each interval represents
 */
export function getIntervalLabel(
  settings: CompanyPricingSettings | null | undefined,
  dimension: 'home' | 'yard' | 'linear_feet',
  intervalIndex: number
): string {
  if (!settings) {
    return `Interval ${intervalIndex}`;
  }

  // Generate all options and find the matching one
  const options = dimension === 'home'
    ? generateHomeSizeOptions(settings)
    : dimension === 'yard'
    ? generateYardSizeOptions(settings)
    : generateLinearFeetOptions(settings);

  return options[intervalIndex]?.label || `Interval ${intervalIndex}`;
}