// Project Category Types
export interface ProjectCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_system_default: boolean;
  company_id: string | null; // NULL = internal/system category
  created_at: string;
  updated_at: string;
}

export interface ProjectCategoryAssignment {
  id: string;
  project_id: string;
  category_id: string;
  created_at: string;
  category?: ProjectCategory;
}

// Project type codes for shortcode generation
export type ProjectTypeCode = 'WEB' | 'SOC' | 'EML' | 'PRT' | 'VEH' | 'DIG' | 'ADS';

// Project scope types
export type ProjectScope = 'internal' | 'external' | 'both';

export const PROJECT_TYPE_CODES: Record<ProjectTypeCode, { label: string; description: string }> = {
  WEB: { label: 'Website', description: 'Landing Pages, Full Websites' },
  SOC: { label: 'Social Media', description: 'Social media content and campaigns' },
  EML: { label: 'Email Media', description: 'Email templates and campaigns' },
  PRT: { label: 'Print Media', description: 'Print materials and designs' },
  VEH: { label: 'Vehicle Design', description: 'Vehicle wraps and graphics' },
  DIG: { label: 'Digital Designs', description: 'Digital ads for magazines, websites, etc.' },
  ADS: { label: 'Paid Ad Designs', description: 'Google, Bing, Yelp, YouTube ads' },
};

export interface Project {
  id: string;
  name: string;
  description: string;
  project_type: string; // Existing broad category
  project_subtype: string | null; // Existing specific subcategory
  type_code?: ProjectTypeCode; // NEW: Type code for shortcode generation
  shortcode?: string; // NEW: Auto-generated shortcode (read-only)
  status: 'in_progress' | 'blocked' | 'on_hold' | 'pending_approval' | 'out_to_client' | 'complete';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string;
  start_date: string | null;
  completion_date: string | null;
  is_billable: boolean;
  quoted_price: number | null;
  budget_amount?: number | null;
  estimated_hours?: number | null;
  actual_hours?: number | null;
  tags: string[] | null;
  notes: string | null;
  primary_file_path: string | null;
  scope?: ProjectScope; // internal = agency-only, external = client-only, both = mixed work
  created_at: string;
  updated_at: string;

  // Progress tracking (auto-calculated by database trigger)
  progress_percentage?: number;

  // Optional fields for Kanban card display
  comments_count?: number;
  members_count?: number;
  progress?: { completed: number; total: number };
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
  comments?: ProjectComment[];
  activity?: ProjectActivity[];
  categories?: ProjectCategoryAssignment[]; // Many-to-many relationship
}

export interface ProjectFormData {
  name: string;
  description: string;
  project_type: string;
  project_subtype: string;
  type_code?: string; // Optional type code for shortcode generation
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
  scope?: ProjectScope; // internal, external, or both
  category_ids: string[]; // Array of category IDs for many-to-many relationship
}

export interface User {
  id: string;
  email: string;
  profiles?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string | null;
  };
}

export interface Company {
  id: string;
  name: string;
  short_code?: string; // 3-4 character code for project shortcodes (e.g., "BZB")
}

export interface ProjectFilters {
  status: string;
  priority: string;
  companyId: string;
}

export const statusOptions = [
  { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'blocked', label: 'Blocked', color: '#ef4444' },
  { value: 'on_hold', label: 'On Hold', color: '#f97316' },
  { value: 'pending_approval', label: 'Pending Approval', color: '#eab308' },
  { value: 'out_to_client', label: 'Out To Client', color: '#8b5cf6' },
  { value: 'complete', label: 'Complete', color: '#10b981' },
];

export const projectTypeOptions = [
  { value: 'none', label: 'None (no shortcode)', code: null },
  { value: 'website', label: 'Website', code: 'WEB' },
  { value: 'social', label: 'Social Media', code: 'SOC' },
  { value: 'email', label: 'Email Media', code: 'EML' },
  { value: 'print', label: 'Print Media', code: 'PRT' },
  { value: 'vehicle', label: 'Vehicle Design', code: 'VEH' },
  { value: 'digital', label: 'Digital Designs', code: 'DIG' },
  { value: 'ads', label: 'Paid Ad Designs', code: 'ADS' },
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
  project_id: string | null; // Optional - tasks can exist without a project
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

  // Recurring Fields
  recurring_frequency: RecurringFrequency | null;
  recurring_end_date: string | null;
  parent_recurring_task_id: string | null;
  is_recurring_template: boolean;
  next_recurrence_date: string | null;

  // Metadata
  created_at: string;
  updated_at: string;

  // Relationships (populated by API)
  assigned_to_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
  created_by_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string | null;
  };
  subtasks?: ProjectTask[];
  comments?: ProjectTaskComment[];
  activity?: ProjectTaskActivity[];
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
  recurring_frequency: string;
  recurring_end_date: string;
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
    avatar_url?: string | null;
  };
}

export interface ProjectTaskActivity {
  id: string;
  task_id: string;
  user_id: string;
  action_type: 'created' | 'edited' | 'completed' | 'uncompleted' | 'assigned' | 'unassigned' | 'priority_changed' | 'due_date_changed' | 'title_changed' | 'description_changed' | 'notes_changed';
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  metadata: any | null;
  created_at: string;
  user_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string | null;
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
  status?: string;
  priority?: string;
  assigned_to?: string;
  milestone?: string;
  sprint?: string;
  is_completed?: boolean | null;
}

export const taskPriorityOptions = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'critical', label: 'Critical', color: '#ef4444' },
];

export interface ProjectComment {
  id: string;
  project_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  user_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string | null;
  };
}

export interface ProjectActivity {
  id: string;
  project_id: string;
  user_id: string;
  action_type: 'created' | 'status_changed' | 'priority_changed' | 'assigned' | 'unassigned' |
                'name_changed' | 'description_changed' | 'notes_changed' | 'due_date_changed' |
                'start_date_changed' | 'completion_date_changed' | 'budget_changed' |
                'estimated_hours_changed' | 'actual_hours_changed' | 'tags_changed' |
                'project_type_changed' | 'project_subtype_changed';
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  metadata: any | null;
  created_at: string;
  user_profile?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string | null;
  };
}

// Project Template Types
export interface ProjectTemplate {
  id: string;
  name: string;
  description: string | null;
  project_type: string;
  project_subtype: string | null;
  is_active: boolean;
  template_data: Record<string, any> | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  tasks?: ProjectTemplateTask[];
}

export interface ProjectTemplateTask {
  id: string;
  template_id: string;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date_offset_days: number;
  display_order: number;
  tags: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface ProjectTemplateFormData {
  name: string;
  description: string;
  project_type: string;
  project_subtype: string;
  is_active: string;
  template_data: string;
  tasks: Array<{
    title: string;
    description: string;
    priority: string;
    due_date_offset_days: string;
    display_order: string;
    tags: string;
  }>;
}

// Recurring Task Types
export type RecurringFrequency = 'none' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export const recurringFrequencyOptions = [
  { value: 'none', label: 'Does Not Repeat' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Every 2 Weeks' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly (Every 3 Months)' },
  { value: 'yearly', label: 'Yearly' },
];
