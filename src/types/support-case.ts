export type SupportCaseIssueType =
  | 'billing'
  | 'scheduling'
  | 'complaint'
  | 'service_quality'
  | 'treatment_request'
  | 're_service'
  | 'general_inquiry'
  | 'warranty_claim';

export type SupportCaseStatus =
  | 'unassigned'
  | 'in_progress'
  | 'awaiting_response'
  | 'resolved'
  | 'closed';

export type SupportCasePriority = 'low' | 'medium' | 'high' | 'urgent';

export interface SupportCase {
  id: string;
  company_id: string;
  customer_id?: string;
  ticket_id?: string;
  
  // Support case specific fields
  issue_type: SupportCaseIssueType;
  summary: string;
  description?: string;
  resolution_action?: string;
  notes?: string;
  
  // Workflow and assignment
  status: SupportCaseStatus;
  assigned_to?: string;
  
  // Priority and tracking
  priority: SupportCasePriority;
  first_response_at?: string;
  resolved_at?: string;
  closed_at?: string;
  
  // Customer satisfaction
  satisfaction_rating?: number; // 1-5
  satisfaction_feedback?: string;
  satisfaction_collected_at?: string;
  
  // Standard fields
  archived: boolean;
  created_at: string;
  updated_at: string;

  // Joined data from related tables
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  };
  primary_service_address?: {
    id: string;
    street_address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    latitude?: number;
    longitude?: number;
    address_type?: string;
    home_size?: number;
    yard_size?: number;
    apartment_unit?: string;
    address_line_2?: string;
    property_notes?: string;
    hasStreetView?: boolean;
  };
  assigned_user?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string | null;
  };
  company?: {
    id: string;
    name: string;
    website?: string;
  };
  ticket?: {
    id: string;
    type: string;
    source: string;
    created_at: string;
  };
}

export interface SupportCaseFormData {
  customer_id?: string;
  ticket_id?: string;
  issue_type: SupportCaseIssueType;
  summary: string;
  description?: string;
  resolution_action?: string;
  notes?: string;
  status: SupportCaseStatus;
  assigned_to?: string;
  priority: SupportCasePriority;
  satisfaction_rating?: number;
  satisfaction_feedback?: string;
}

export const supportCaseIssueTypeOptions = [
  { value: 'billing', label: 'Billing' },
  { value: 'scheduling', label: 'Scheduling' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'service_quality', label: 'Service Quality' },
  { value: 'treatment_request', label: 'Treatment Request' },
  { value: 're_service', label: 'Re-service' },
  { value: 'general_inquiry', label: 'General Inquiry' },
  { value: 'warranty_claim', label: 'Warranty Claim' },
] as const;

export const supportCaseStatusOptions = [
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'awaiting_response', label: 'Awaiting Response' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
] as const;

export const supportCasePriorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;