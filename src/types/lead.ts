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
  | 'new'
  | 'contacted'
  | 'qualified'
  | 'quoted'
  | 'won'
  | 'lost'
  | 'unqualified';

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
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'quoted', label: 'Quoted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'unqualified', label: 'Unqualified' },
] as const;

export const leadPriorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;
