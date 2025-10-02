export type TicketSource =
  | 'organic'
  | 'referral'
  | 'google_cpc'
  | 'facebook_ads'
  | 'linkedin'
  | 'email_campaign'
  | 'cold_call'
  | 'trade_show'
  | 'webinar'
  | 'content_marketing'
  | 'internal'
  | 'other';

export type TicketType =
  | 'phone_call'
  | 'web_form'
  | 'email'
  | 'chat'
  | 'social_media'
  | 'in_person'
  | 'internal_task'
  | 'bug_report'
  | 'feature_request'
  | 'other';

export type TicketStatus =
  | 'live'
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'quoted'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'won'
  | 'lost'
  | 'unqualified';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Ticket {
  id: string;
  company_id: string;
  customer_id?: string;
  service_address_id?: string; // Reference to service address for location-based tickets
  call_record_id?: string; // Direct reference to call record for phone_call tickets
  source: TicketSource;
  type: TicketType;
  call_direction?: 'inbound' | 'outbound' | null; // Direction for phone calls, null for non-calls
  service_type?: string;
  status: TicketStatus;
  description?: string;
  assigned_to?: string;
  last_contacted_at?: string;
  next_follow_up_at?: string;
  estimated_value?: number;
  priority: TicketPriority;
  pest_type?: string;
  resolved_at?: string;
  is_qualified?: boolean | null;
  
  // Conversion tracking fields
  converted_to_lead_id?: string;
  converted_to_customer_id?: string;
  converted_at?: string;
  
  // Attribution fields
  partial_lead_id?: string;
  gclid?: string;
  attribution_data?: Record<string, any>;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  
  // Technical tracking
  referrer_url?: string;
  ip_address?: string;
  user_agent?: string;
  
  // Review tracking - for preventing simultaneous editing conflicts
  reviewed_by?: string; // User ID currently reviewing this ticket
  reviewed_at?: string;
  review_expires_at?: string;

  // Metadata
  archived?: boolean;
  created_at: string;
  updated_at: string;

  // Joined data from related tables
  reviewed_by_profile?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email: string;
  };
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
  assigned_user?: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  company?: {
    id: string;
    name: string;
    website?: string;
  };
  service_address?: {
    id: string;
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    apartment_unit?: string;
    address_line_2?: string;
    address_type: 'residential' | 'commercial' | 'industrial' | 'mixed_use';
    property_notes?: string;
    home_size_range?: string;
    yard_size_range?: string;
  };
  call_records?: Array<{
    id: string;
    call_id: string;
    call_status?: string;
    start_timestamp?: string;
    end_timestamp?: string;
    duration_seconds?: number;
  }>;
}

export interface TicketFormData {
  customer_id?: string;
  service_address_id?: string;
  source: TicketSource;
  type: TicketType;
  service_type?: string;
  status: TicketStatus;
  description?: string;
  assigned_to?: string;
  last_contacted_at?: string;
  next_follow_up_at?: string;
  priority: TicketPriority;
  pest_type?: string;
}

// Interface for ticket-to-lead conversion
export interface TicketConversionData {
  // Optional customer data if manual entry needed during conversion
  customerData?: {
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
  };
}

export const ticketSourceOptions = [
  { value: 'organic', label: 'Google Organic' },
  { value: 'referral', label: 'Referral' },
  { value: 'google_cpc', label: 'Google Ads' },
  { value: 'facebook_ads', label: 'Facebook Ads' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'trade_show', label: 'Trade Show' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'content_marketing', label: 'Content Marketing' },
  { value: 'widget_submission', label: 'Website' },
  { value: 'internal', label: 'Internal' },
  { value: 'other', label: 'Other' },
] as const;

export const ticketTypeOptions = [
  { value: 'phone_call', label: 'Call' },
  { value: 'web_form', label: 'Form' },
  { value: 'email', label: 'Email' },
  { value: 'chat', label: 'Chat' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'in_person', label: 'In Person' },
  { value: 'internal_task', label: 'Internal Task' },
  { value: 'bug_report', label: 'Bug Report' },
  { value: 'feature_request', label: 'Feature Request' },
  { value: 'other', label: 'Other' },
] as const;

export const ticketStatusOptions = [
  { value: 'live', label: 'Live Call' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'unqualified', label: 'Unqualified' },
] as const;

export const ticketPriorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;