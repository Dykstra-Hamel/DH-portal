export interface IntervalPricing {
  interval_index: number;
  pricing_type: 'custom' | 'discount';
  // Custom pricing fields
  custom_initial_price?: number;
  custom_recurring_price?: number;
  // Discount pricing fields
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  recurring_discount_type?: 'percentage' | 'fixed';
  recurring_discount_value?: number;
}

export interface BundlePlan {
  id: string;
  company_id: string;

  // Basic Info
  bundle_name: string;
  bundle_description?: string;
  bundle_category?: string; // 'starter', 'premium', 'ultimate', etc.

  // Bundled Items (JSONB arrays storing references)
  bundled_service_plans: Array<{ service_plan_id: string; plan_name: string }>;
  bundled_add_ons: Array<{ add_on_id: string; addon_name: string }>;

  // Pricing Mode
  pricing_mode?: 'global' | 'per_interval'; // Default: 'global'

  // Global Pricing (used when pricing_mode = 'global')
  pricing_type: 'custom' | 'discount';

  // Custom Pricing (used when pricing_type = 'custom')
  custom_initial_price?: number;
  custom_recurring_price?: number;

  // Discount Pricing (used when pricing_type = 'discount')
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
  applies_to_price?: 'initial' | 'recurring' | 'both'; // Which price(s) the discount applies to
  // Separate recurring discount settings (used when applies_to_price = 'both')
  recurring_discount_type?: 'percentage' | 'fixed';
  recurring_discount_value?: number;

  // Per-Interval Pricing (used when pricing_mode = 'per_interval')
  interval_dimension?: 'home' | 'yard' | 'linear_feet'; // Which dimension intervals are based on (default: 'home')
  interval_pricing?: IntervalPricing[];

  // Billing
  billing_frequency?: string;

  // Display & Content
  bundle_features: string[];
  bundle_image_url?: string;
  display_order: number;
  highlight_badge?: string; // 'Best Deal', 'Most Popular', 'Save 20%'

  // Status & Timestamps
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
