// Company Discount Types

export interface CompanyDiscount {
  id: string;
  company_id: string;
  discount_name: string;
  description: string | null;
  is_active: boolean;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number;
  applies_to_price: 'initial' | 'recurring' | 'both';
  applies_to_plans: 'all' | 'specific';
  eligible_plan_ids: string[];
  requires_manager: boolean;
  time_restriction_type: 'none' | 'seasonal' | 'limited_time';
  seasonal_start_month: number | null;
  seasonal_start_day: number | null;
  seasonal_end_month: number | null;
  seasonal_end_day: number | null;
  limited_time_start: string | null;
  limited_time_end: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface DiscountFormData {
  discount_name: string;
  description: string;
  is_active: boolean;
  discount_type: 'percentage' | 'fixed_amount';
  discount_value: number | string;
  applies_to_price: 'initial' | 'recurring' | 'both';
  applies_to_plans: 'all' | 'specific';
  eligible_plan_ids: string[];
  requires_manager: boolean;
  time_restriction_type: 'none' | 'seasonal' | 'limited_time';
  seasonal_start_month: number | string;
  seasonal_start_day: number | string;
  seasonal_end_month: number | string;
  seasonal_end_day: number | string;
  limited_time_start: string;
  limited_time_end: string;
  sort_order: number | string;
}

export interface ServicePlanOption {
  id: string;
  plan_name: string;
  plan_category: string;
}

export const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: String(i + 1),
}));
