export type QuoteStatus = 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';

export interface PlanVariant {
  label: string;
  initial_price?: number;
  recurring_price?: number;
  price_per_unit?: number;
  minimum_price?: number;
  billing_frequency?: string;
  treatment_frequency?: string;
}

export interface Quote {
  id: string;
  lead_id: string;
  company_id: string;
  customer_id?: string;
  service_address_id?: string;

  // Pest information
  primary_pest?: string;
  additional_pests: string[];

  // Size ranges
  home_size_range?: string;
  yard_size_range?: string;

  // Pricing totals
  total_initial_price: number;
  total_recurring_price: number;

  // Status and validity
  quote_status: QuoteStatus;
  valid_until?: string;

  // Public access
  quote_url?: string;
  quote_token?: string;
  token_expires_at?: string;

  // Signature fields
  signed_at?: string;
  signature_data?: string;
  device_data?: any;

  // Customer feedback
  customer_comments?: string;

  // Timestamps
  created_at: string;
  updated_at: string;

  // Joined data
  line_items?: QuoteLineItem[];
}

export interface QuoteLineItem {
  id: string;
  quote_id: string;
  service_plan_id?: string;
  addon_service_id?: string;
  bundle_plan_id?: string;

  // Plan details
  plan_name: string;
  plan_description?: string;
  initial_price: number;
  recurring_price: number;
  billing_frequency: string;
  service_frequency?: string;

  // Discount information
  discount_percentage?: number;
  discount_amount?: number;

  // Custom pricing fields
  custom_initial_price?: number;
  custom_recurring_price?: number;
  is_custom_priced: boolean;

  // Final pricing
  final_initial_price: number;
  final_recurring_price: number;

  // Customer selection (for optional line items on the public quote page)
  is_optional: boolean;
  is_selected: boolean;
  is_primary: boolean;

  // Display
  display_order: number;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateQuoteRequest {
  lead_id: string;
  service_plans: Array<{
    service_plan_id: string;
    discount_percentage?: number;
    discount_amount?: number;
    discount_id?: string;
    service_frequency?: string;
    is_optional?: boolean;  // Customer can toggle this item on/off
  }>;
}

export interface UpdateQuoteRequest {
  quote_status?: QuoteStatus;
  valid_until?: string;
  primary_pest?: string;
  additional_pests?: string[];
  home_size_range?: string;
  yard_size_range?: string;
  line_items?: Array<{
    id?: string; // If updating existing item
    service_plan_id?: string;
    addon_service_id?: string;
    bundle_plan_id?: string;
    discount_percentage?: number;
    discount_amount?: number;
    display_order?: number;
    service_frequency?: string;
    custom_initial_price?: number;
    custom_recurring_price?: number;
    is_custom_priced?: boolean;
    is_optional?: boolean;  // Customer can toggle this item on/off
    is_primary?: boolean;
  }>;
}

export const quoteStatusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'sent', label: 'Sent' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'declined', label: 'Declined' },
  { value: 'expired', label: 'Expired' },
] as const;