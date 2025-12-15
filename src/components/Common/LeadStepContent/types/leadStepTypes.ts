import { Lead } from '@/types/lead';

// Common callback types
export type ShowToastCallback = (message: string, type: 'success' | 'error') => void;
export type RequestUndoCallback = (undoHandler: () => Promise<void>) => void;
export type LeadUpdateCallback = (updatedLead?: Lead) => void;

// Assigned user info type
export interface AssignedUserInfo {
  name: string;
  title: string;
  avatar?: string | null;
}

// Assignable user type from hooks
export interface AssignableUser {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string | null;
  departments: string[];
}

// Sales cadence task type
export interface CadenceTask {
  id: string;
  day_number: number;
  action_type: string;
  time_of_day: string;
  priority: string;
  due_date?: string;
  due_time?: string;
  completed: boolean;
}

// Service selection type for quotes
export interface ServiceSelection {
  id: string;
  servicePlan: any | null;
  displayOrder: number;
  frequency: string;
  discount: string;
}

// Common props that multiple components need
export interface BaseLeadStepProps {
  lead: Lead;
  isAdmin: boolean;
  onShowToast?: ShowToastCallback;
  onRequestUndo?: RequestUndoCallback;
  onLeadUpdate?: LeadUpdateCallback;
}
