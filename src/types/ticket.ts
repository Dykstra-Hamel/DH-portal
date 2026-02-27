export type TicketFormat = 'call' | 'form' | 'email' | 'text';

// New taxonomy values (use these for all new records)
export type TicketSource =
  | 'google_ads'
  | 'google_organic'
  | 'facebook_ads'
  | 'referral'
  | 'direct'
  | 'campaign'
  | 'widget'
  | 'other'
  // Legacy values (existing records only — do not use for new records)
  | 'organic'
  | 'google_cpc'
  | 'linkedin'
  | 'email_campaign'
  | 'cold_call'
  | 'trade_show'
  | 'webinar'
  | 'content_marketing'
  | 'internal'
  | 'inbound'
  | 'outbound'
  | 'website';

// New taxonomy values (use these for all new records)
export type TicketType =
  | 'inbound_call'
  | 'outbound_call'
  | 'website_form'
  | 'widget_form'
  | 'campaign_call'
  | 'campaign_email'
  | 'campaign_text'
  | 'manual'
  | 'email_inbound'
  // Legacy values (existing records only — do not use for new records)
  | 'phone_call'
  | 'web_form'
  | 'email'
  | 'chat'
  | 'social_media'
  | 'in_person'
  | 'internal_task'
  | 'bug_report'
  | 'feature_request';

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
  format?: TicketFormat;
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
    avatar_url?: string | null;
  };
  customer?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
    alternate_phone?: string;
    address?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    primary_service_address?: {
      id: string;
      street_address?: string | null;
      apartment_unit?: string | null;
      address_line_2?: string | null;
      city?: string | null;
      state?: string | null;
      zip_code?: string | null;
      home_size_range?: string | null;
      yard_size_range?: string | null;
      latitude?: number | null;
      longitude?: number | null;
    } | null;
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
  format?: TicketFormat;
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

export const ticketFormatOptions = [
  { value: 'call', label: 'Call' },
  { value: 'form', label: 'Form' },
  { value: 'email', label: 'Email' },
  { value: 'text', label: 'Text' },
] as const;

export const ticketSourceOptions = [
  { value: 'google_ads', label: 'Google Ads' },
  { value: 'google_organic', label: 'Google Organic' },
  { value: 'facebook_ads', label: 'Facebook Ads' },
  { value: 'referral', label: 'Referral' },
  { value: 'direct', label: 'Direct' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'widget', label: 'Widget' },
  { value: 'other', label: 'Other' },
] as const;

export const ticketTypeOptions = [
  { value: 'inbound_call', label: 'Inbound Call' },
  { value: 'outbound_call', label: 'Outbound Call' },
  { value: 'website_form', label: 'Website Form' },
  { value: 'widget_form', label: 'Widget Form' },
  { value: 'campaign_call', label: 'Campaign Call' },
  { value: 'campaign_email', label: 'Campaign Email' },
  { value: 'campaign_text', label: 'Campaign Text' },
  { value: 'manual', label: 'Manual' },
  { value: 'email_inbound', label: 'Email Inbound' },
] as const;

// Type options filtered by format
export const ticketTypesByFormat: Record<string, { value: string; label: string }[]> = {
  call: [
    { value: 'inbound_call', label: 'Inbound Call' },
    { value: 'outbound_call', label: 'Outbound Call' },
    { value: 'campaign_call', label: 'Campaign Call' },
  ],
  form: [
    { value: 'website_form', label: 'Website Form' },
    { value: 'widget_form', label: 'Widget Form' },
    { value: 'manual', label: 'Manual' },
  ],
  email: [
    { value: 'campaign_email', label: 'Campaign Email' },
    { value: 'email_inbound', label: 'Email Inbound' },
    { value: 'manual', label: 'Manual' },
  ],
  text: [
    { value: 'campaign_text', label: 'Campaign Text' },
    { value: 'manual', label: 'Manual' },
  ],
};

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
