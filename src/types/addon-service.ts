/**
 * TypeScript type definitions for add-on services
 * Add-on services are optional services that can be added to base service plans
 */

export interface AddOnService {
  // Identity
  id: string;
  company_id: string;

  // Basic Info
  addon_name: string;
  addon_description: string | null;
  addon_category: 'basic' | 'premium' | 'specialty' | null;

  // Pricing
  initial_price: number | null;
  recurring_price: number;
  billing_frequency: 'monthly' | 'quarterly' | 'semi-annually' | 'annually';
  initial_discount: number;
  home_size_pricing: {
    initial_cost_per_interval: number;
    recurring_cost_per_interval: number;
  } | null;
  yard_size_pricing: {
    initial_cost_per_interval: number;
    recurring_cost_per_interval: number;
  } | null;

  // Service Details
  treatment_frequency: 'monthly' | 'bi-monthly' | 'quarterly' | 'on-demand' | null;
  includes_inspection: boolean;

  // Display & Content
  addon_image_url: string | null;
  addon_disclaimer: string | null;
  addon_features: string[] | null;
  addon_faqs: Array<{ question: string; answer: string }> | null;
  display_order: number;
  highlight_badge: string | null;
  color_scheme: {
    primary: string;
    secondary: string;
  } | null;

  // Eligibility
  eligibility_mode: 'all' | 'specific';
  eligible_plan_ids?: string[]; // Populated from junction table when eligibility_mode is 'specific'

  // Status
  is_active: boolean;
  requires_quote: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
}

/**
 * Form data for creating/editing add-on services
 * Used in AddOnServiceEditor component
 */
export interface AddOnServiceFormData {
  addon_name: string;
  addon_description: string;
  addon_category: 'basic' | 'premium' | 'specialty' | null;
  initial_price: number | null;
  recurring_price: number;
  billing_frequency: 'monthly' | 'quarterly' | 'semi-annually' | 'annually';
  treatment_frequency: 'monthly' | 'bi-monthly' | 'quarterly' | 'on-demand' | null;
  addon_features: string[];
  addon_faqs: Array<{ question: string; answer: string }>;
  eligibility_mode: 'all' | 'specific';
  eligible_plan_ids: string[];
  is_active: boolean;
}

/**
 * Add-on eligibility data returned from get_eligible_addons_for_plan function
 * Used to display add-ons with their eligibility status for a specific service plan
 */
export interface AddOnEligibility {
  addon_id: string;
  addon_name: string;
  addon_description: string | null;
  initial_price: number | null;
  recurring_price: number;
  eligibility_mode: 'all' | 'specific';
  is_eligible: boolean; // True if this add-on can be added to the service plan
}
