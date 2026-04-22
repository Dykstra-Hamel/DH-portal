import { Lead } from '@/types/lead';
import { TimeOption } from '@/lib/time-options';

// Common callback types
export type ShowToastCallback = (
  message: string,
  type: 'success' | 'error'
) => void;
export type RequestUndoCallback = (undoHandler: () => Promise<void>) => void;
export type LeadUpdateCallback = (updatedLead?: Lead) => void;
// Surgical patch: merges specific fields into lead state without a full refetch
export type LeadFieldUpdateCallback = (fields: Partial<Lead>) => void;

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
  uploaded_avatar_url?: string | null;
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

// Lead Scheduling Section Props
export interface LeadSchedulingSectionProps {
  lead: Lead;
  quote: any;
  isQuoteUpdating: boolean;
  scheduledDate: string;
  scheduledTime: string;
  confirmationNote: string;
  customerComment?: string | null;
  onScheduledDateChange: (date: string) => void;
  onScheduledTimeChange: (time: string) => void;
  onConfirmationNoteChange: (note: string) => void;
  onFinalizeSale: () => void;
  onEmailQuote: () => void;
  isSidebarExpanded?: boolean;
  timeOptions?: TimeOption[];
}

// Lead Contact Section Props
export interface LeadContactSectionProps {
  lead: Lead;
  nextTask: CadenceTask | null;
  afterNextActionType?: string | null;
  loadingNextTask: boolean;
  hasActiveCadence: boolean | null;
  activityNotes: string;
  isLoggingActivity: boolean;
  selectedCadenceId: string | null;
  availableCadences?: { id: string; name: string }[];
  cadenceSteps?: any[];
  cadenceStartedAt?: string | null;
  activeWorkflowExecution?: any | null;
  onNotesChange: (notes: string) => void;
  onLogActivity: (outcome?: string | null) => void;
  onCadenceSelect: (cadenceId: string | null) => void;
  onStartQuoting: () => void;
  onScheduleService?: () => void;
  onShowToast?: ShowToastCallback;
  onLeadUpdate?: LeadUpdateCallback;
  isSidebarExpanded?: boolean;
}

// Lead Quote Section Props
export interface LeadQuoteSectionProps {
  lead: Lead;
  quote: any;
  isQuoteUpdating: boolean;
  pricingSettings: any;
  selectedPests: string[];
  additionalPests: string[];
  homeSize: number | '';
  yardSize: number | '';
  linearFeet: number | '';
  selectedHomeSizeOption: string;
  selectedYardSizeOption: string;
  preferredDate: string;
  preferredTime: string;
  onEmailQuote: () => void;
  onEditAddress?: () => void;
  onShowToast?: ShowToastCallback;
  onRequestUndo?: RequestUndoCallback;
  onLeadFieldUpdate?: LeadFieldUpdateCallback;
  broadcastQuoteUpdate: (quote: any) => Promise<void>;
  setSelectedPests: (pests: string[]) => void;
  setAdditionalPests: (pests: string[]) => void;
  setHomeSize: (size: number | '') => void;
  setYardSize: (size: number | '') => void;
  setLinearFeet: (size: number | '') => void;
  setSelectedHomeSizeOption: (option: string) => void;
  setSelectedYardSizeOption: (option: string) => void;
  onPreferredDateChange: (date: string) => void;
  onPreferredTimeChange: (time: string) => void;
  onNotInterested: () => void;
  onReadyToSchedule: () => void;
  isSidebarExpanded?: boolean;
  startExpanded?: boolean;
  forceCollapse?: boolean;
  timeOptions?: TimeOption[];
}
