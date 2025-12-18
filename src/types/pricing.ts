// Company-wide pricing interval settings
export interface CompanyPricingSettings {
  id: string;
  company_id: string;

  // Home size intervals
  base_home_sq_ft: number;
  home_sq_ft_interval: number;
  max_home_sq_ft: number;

  // Yard size intervals
  base_yard_acres: number;
  yard_acres_interval: number;
  max_yard_acres: number;

  created_at: string;
  updated_at: string;
}

// Service plan-specific pricing per interval
export interface ServicePlanPricing {
  home_size_pricing: {
    pricing_mode?: 'linear' | 'custom'; // Default to 'linear' if not set (backwards compatible)
    // Linear mode fields
    initial_cost_per_interval: number;
    recurring_cost_per_interval: number;
    // Custom mode fields (array of exact prices per interval)
    custom_initial_prices?: number[];
    custom_recurring_prices?: number[];
  };
  yard_size_pricing: {
    pricing_mode?: 'linear' | 'custom'; // Default to 'linear' if not set (backwards compatible)
    // Linear mode fields
    initial_cost_per_interval: number;
    recurring_cost_per_interval: number;
    // Custom mode fields (array of exact prices per interval)
    custom_initial_prices?: number[];
    custom_recurring_prices?: number[];
  };
}

// Size option for dropdowns
export interface SizeOption {
  value: string; // e.g., "0-1500", "1501-2000", "3000+"
  label: string; // e.g., "0-1500 Sq Ft", "1501-2000 Sq Ft (+$20 initial, +$10/month)"
  intervalIndex: number; // 0 for base, 1 for first interval above base, etc.
  initialIncrease: number; // Additional initial cost for this interval
  recurringIncrease: number; // Additional recurring cost for this interval
  rangeStart: number; // Numeric start of the range
  rangeEnd: number | null; // Numeric end of the range (null for "max+")
}

// Pricing calculation result
export interface PricingCalculation {
  baseInitialPrice: number;
  baseRecurringPrice: number;
  homeSizeInitialIncrease: number;
  homeSizeRecurringIncrease: number;
  yardSizeInitialIncrease: number;
  yardSizeRecurringIncrease: number;
  totalInitialPrice: number;
  totalRecurringPrice: number;
}