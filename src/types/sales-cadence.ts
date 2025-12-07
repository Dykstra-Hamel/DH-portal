// Sales Cadence System Types

export type TimeOfDay = 'morning' | 'afternoon';

export type ActionType = 'live_call' | 'outbound_call' | 'text_message' | 'ai_call' | 'email';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface SalesCadence {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface SalesCadenceStep {
  id: string;
  cadence_id: string;
  day_number: number;
  time_of_day: TimeOfDay;
  action_type: ActionType;
  priority: Priority;
  display_order: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface SalesCadenceStepWithProgress extends SalesCadenceStep {
  is_completed: boolean;
  completed_at: string | null;
}

export interface SalesCadenceWithSteps extends SalesCadence {
  steps: SalesCadenceStep[];
}

export interface SalesCadenceWithProgressSteps extends SalesCadence {
  steps: SalesCadenceStepWithProgress[];
}

export interface LeadCadenceAssignment {
  id: string;
  lead_id: string;
  cadence_id: string;
  assigned_at: string;
  started_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LeadCadenceProgress {
  id: string;
  lead_id: string;
  cadence_step_id: string;
  completed_at: string;
  completed_by_activity_id: string | null;
  created_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string;
  action_type: ActionType;
  notes: string | null;
  created_at: string;
}

export interface LeadActivityWithUser extends LeadActivity {
  user: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

// Helper types for forms and UI
export interface CadenceFormData {
  name: string;
  description: string;
  is_active: boolean;
  is_default: boolean;
}

export interface CadenceStepFormData {
  day_number: number;
  time_of_day: TimeOfDay;
  action_type: ActionType;
  priority: Priority;
  description: string;
}

// Display helpers
export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  live_call: 'Live Call',
  outbound_call: 'Outbound Call',
  text_message: 'Text Message',
  ai_call: 'AI Call',
  email: 'Email',
};

export const TIME_OF_DAY_LABELS: Record<TimeOfDay, string> = {
  morning: 'Morning (12PM)',
  afternoon: 'Afternoon (5PM)',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#10b981', // green
  medium: '#f59e0b', // amber
  high: '#ef4444', // red
  urgent: '#dc2626', // darker red
};
