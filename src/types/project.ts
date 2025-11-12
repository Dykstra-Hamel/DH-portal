export interface Project {
  id: string;
  name: string;
  description: string;
  project_type: string;
  project_subtype: string | null;
  status: 'coming_up' | 'design' | 'development' | 'out_to_client' | 'waiting_on_client' | 'bill_client';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string;
  start_date: string | null;
  completion_date: string | null;
  is_billable: boolean;
  quoted_price: number | null;
  tags: string[] | null;
  notes: string | null;
  primary_file_path: string | null;
  created_at: string;
  updated_at: string;
  requested_by_profile: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  assigned_to_profile: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  company: {
    id: string;
    name: string;
  };
}

export interface ProjectFormData {
  name: string;
  description: string;
  project_type: string;
  project_subtype: string;
  requested_by: string;
  company_id: string;
  assigned_to: string;
  status: string;
  priority: string;
  due_date: string;
  start_date: string;
  completion_date: string;
  is_billable: string;
  quoted_price: string;
  tags: string;
  notes: string;
}

export interface User {
  id: string;
  email: string;
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface Company {
  id: string;
  name: string;
}

export interface ProjectFilters {
  status: string;
  priority: string;
  companyId: string;
}

export const statusOptions = [
  { value: 'coming_up', label: 'Coming Up', color: '#f59e0b' },
  { value: 'design', label: 'Design', color: '#8b5cf6' },
  { value: 'development', label: 'Development', color: '#3b82f6' },
  { value: 'out_to_client', label: 'Out To Client', color: '#06b6d4' },
  { value: 'waiting_on_client', label: 'Waiting On Client', color: '#6b7280' },
  { value: 'bill_client', label: 'Bill Client', color: '#10b981' },
];

export const projectTypeOptions = [
  { value: 'print', label: 'Print' },
  { value: 'digital', label: 'Digital' },
];

export const printSubtypes = [
  { value: 'billboard', label: 'Billboard' },
  { value: 'business_cards', label: 'Business Cards' },
  { value: 'door_hangers', label: 'Door Hangers' },
  { value: 'lawn_sign', label: 'Lawn Sign' },
  { value: 'postcard', label: 'Postcard' },
  { value: 'vehicle_wrap', label: 'Vehicle Wrap' },
  { value: 'other', label: 'Other' },
];

export const digitalSubtypes = [
  { value: 'digital_billboard', label: 'Digital Billboard' },
  { value: 'display_ads', label: 'Display Ads' },
  { value: 'logo_design', label: 'Logo Design' },
  { value: 'social_images', label: 'Social Images' },
  { value: 'video', label: 'Video' },
  { value: 'website_design', label: 'Website Design' },
  { value: 'other', label: 'Other' },
];

export const priorityOptions = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444' },
];

// Project Task Types
export interface ProjectTask {
  id: string;
  project_id: string;
  parent_task_id: string | null;

  // Basic Info
  title: string;
  description: string | null;
  notes: string | null;

  // Completion
  is_completed: boolean;
  completed_at: string | null;

  // Priority
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Assignment
  assigned_to: string | null;
  created_by: string;

  // Timeline
  due_date: string | null;
  start_date: string | null;

  // Progress & Time Tracking
  progress_percentage: number;
  actual_hours: number | null;

  // Dependencies & Blockers
  blocked_by: string[] | null;
  blocking: string[] | null;
  blocker_reason: string | null;

  // Order & Display
  display_order: number;

  // Metadata
  created_at: string;
  updated_at: string;

  // Relationships (populated by API)
  assigned_to_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  } | null;
  created_by_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  subtasks?: ProjectTask[];
  comments?: ProjectTaskComment[];
}

export interface ProjectTaskFormData {
  title: string;
  description: string;
  notes: string;
  priority: string;
  assigned_to: string;
  due_date: string;
  start_date: string;
  parent_task_id: string;
}

export interface ProjectTaskComment {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  user_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

export interface ProjectTaskTemplate {
  id: string;
  name: string;
  description: string | null;
  tasks: any; // JSONB array of task definitions
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectTaskFilters {
  priority: string;
  assigned_to: string;
  is_completed: boolean | null;
}

export const taskPriorityOptions = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'critical', label: 'Critical', color: '#ef4444' },
];
