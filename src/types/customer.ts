import { TicketSource, TicketType, TicketStatus, TicketPriority } from './ticket';
import { LeadSource, LeadType, LeadStatus, LeadPriority } from './lead';

export type CustomerStatus = 'active' | 'inactive' | 'archived';

export interface Customer {
  id: string;
  company_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  alternate_phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  customer_status: CustomerStatus;
  notes?: string;
  created_at: string;
  updated_at: string;

  // Joined data from related tables
  company?: {
    id: string;
    name: string;
  };
  leads?: {
    id: string;
    company_id: string;
    lead_source: LeadSource;
    lead_type: LeadType;
    service_type?: string;
    lead_status: LeadStatus;
    priority: LeadPriority;
    estimated_value?: number;
    comments?: string;
    created_at: string;
    updated_at: string;
    assigned_user?: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  }[];
  tickets?: {
    id: string;
    company_id: string;
    source: TicketSource;
    type: TicketType;
    service_type?: string;
    status: TicketStatus;
    priority: TicketPriority;
    estimated_value?: number;
    description?: string;
    created_at: string;
    updated_at: string;
    assigned_user?: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
  }[];
  primary_service_address?: {
    id: string;
    street_address?: string | null;
    apartment_unit?: string | null;
    city?: string | null;
    state?: string | null;
    zip_code?: string | null;
    home_size_range?: string | null;
    yard_size_range?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    hasStreetView?: boolean | null;
  } | null;

  // Computed fields
  full_name?: string;
  total_leads?: number;
  active_leads?: number;
  total_tickets?: number;
  active_tickets?: number;
  total_support_cases?: number;
  total_value?: number;
  last_activity?: string;
}

export interface CustomerFormData {
  first_name: string;
  last_name: string;
  phone?: string;
  alternate_phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  customer_status: CustomerStatus;
  notes?: string;
  company_id: string;
}

export interface CustomerSearchFilters {
  search?: string;
  company_id?: string;
  status?: CustomerStatus;
  sortBy?: keyof Customer;
  sortOrder?: 'asc' | 'desc';
}

export const customerStatusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
] as const;

export const customerSortOptions = [
  { value: 'first_name', label: 'First Name' },
  { value: 'last_name', label: 'Last Name' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'city', label: 'City' },
  { value: 'customer_status', label: 'Status' },
  { value: 'created_at', label: 'Created Date' },
  { value: 'updated_at', label: 'Updated Date' },
] as const;

// Helper functions
export const getCustomerFullName = (customer: Customer): string => {
  return `${customer.first_name} ${customer.last_name}`.trim();
};

export const getCustomerStatusColor = (status: CustomerStatus): string => {
  const statusColorMap: { [key in CustomerStatus]: string } = {
    active: '#10b981',
    inactive: '#f59e0b',
    archived: '#6b7280',
  };
  return statusColorMap[status] || '#6b7280';
};

export const formatCustomerAddress = (customer: Customer): string => {
  const parts = [
    customer.address,
    customer.city,
    customer.state,
    customer.zip_code,
  ].filter(Boolean);

  return parts.join(', ');
};
