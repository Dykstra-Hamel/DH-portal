export type LeadSource =
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
  | 'other';

export type LeadType =
  | 'phone_call'
  | 'web_form'
  | 'email'
  | 'chat'
  | 'social_media'
  | 'in_person'
  | 'other';

export type LeadStatus =
  | 'unassigned'
  | 'contacting'
  | 'quoted'
  | 'ready_to_schedule'
  | 'scheduled'
  | 'won'
  | 'lost';

export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Lead {
  id: string;
  company_id: string;
  customer_id?: string;
  lead_source: LeadSource;
  lead_type: LeadType;
  service_type?: string;
  lead_status: LeadStatus;
  comments?: string;
  assigned_to?: string;
  last_contacted_at?: string;
  next_follow_up_at?: string;
  estimated_value?: number;
  priority: LeadPriority;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  referrer_url?: string;
  ip_address?: string;
  user_agent?: string;
  lost_reason?: string;
  lost_stage?: string;
  archived?: boolean;
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
    latitude?: number;
    longitude?: number;
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
  primary_service_address?: {
    id: string;
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    apartment_unit?: string;
    address_line_2?: string;
    latitude?: number;
    longitude?: number;
    address_type: 'residential' | 'commercial' | 'industrial' | 'mixed_use';
    property_notes?: string;
  };
  call_record?: {
    id: string;
    call_id: string;
    phone_number: string;
    call_status: string;
    start_timestamp?: string;
    end_timestamp?: string;
    duration_seconds?: number;
    recording_url?: string;
    transcript?: string;
    sentiment?: string;
    pest_issue?: string;
    preferred_service_time?: string;
    disconnect_reason?: string;
    call_analysis?: {
      call_summary?: string;
      [key: string]: any;
    };
  };
}

export interface LeadFormData {
  customer_id?: string;
  lead_source: LeadSource;
  lead_type: LeadType;
  service_type?: string;
  lead_status: LeadStatus;
  comments?: string;
  assigned_to?: string;
  last_contacted_at?: string;
  next_follow_up_at?: string;
  estimated_value?: number;
  priority: LeadPriority;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export const leadSourceOptions = [
  { value: 'organic', label: 'Organic' },
  { value: 'referral', label: 'Referral' },
  { value: 'google_cpc', label: 'Google CPC' },
  { value: 'facebook_ads', label: 'Facebook Ads' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email_campaign', label: 'Email Campaign' },
  { value: 'cold_call', label: 'Cold Call' },
  { value: 'trade_show', label: 'Trade Show' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'content_marketing', label: 'Content Marketing' },
  { value: 'other', label: 'Other' },
] as const;

export const leadTypeOptions = [
  { value: 'phone_call', label: 'Phone Call' },
  { value: 'web_form', label: 'Web Form' },
  { value: 'email', label: 'Email' },
  { value: 'chat', label: 'Chat' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'in_person', label: 'In Person' },
  { value: 'other', label: 'Other' },
] as const;

export const leadStatusOptions = [
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'contacting', label: 'Contacting' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'ready_to_schedule', label: 'Ready To Schedule' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
] as const;

export const leadPriorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;
