// Project Category Types
export type CategoryType = 'internal' | 'external';

export interface ProjectCategory {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  is_system_default: boolean;
  is_hidden: boolean;
  company_id: string | null; // NULL = internal/system category
  created_at: string;
  updated_at: string;
}

// Project Department Types
export interface ProjectDepartment {
  id: string;
  name: string;
  icon: string | null;
  company_id: string | null;
  sort_order: number;
  is_system_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface AttributeField {
  id: string; // stable UUID for keying values
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  options?: string[]; // only for type === 'select'
  columns?: 1 | 2; // 1 = half width, 2 = full width (default: 2)
}

// Project Type Subtypes (related to project types, not categories)
export interface ProjectTypeSubtype {
  id: string;
  project_type: ProjectTypeCode; // WEB, SOC, EML, etc.
  name: string;
  description: string | null;
  sort_order: number;
  has_custom_attributes: boolean;
  custom_attribute_schema: AttributeField[];
  created_at: string;
  updated_at: string;
}

export interface ProjectCategoryAssignment {
  id: string;
  project_id: string;
  category_id: string;
  category_type: CategoryType; // internal or external categorization
  created_at: string;
  category?: ProjectCategory;
}

// Project type codes for shortcode generation
export type ProjectTypeCode = 'WEB' | 'SOC' | 'EML' | 'PRT' | 'VEH' | 'DIG' | 'ADS' | 'CAM' | 'SFT';

// Project scope types
export type ProjectScope = 'internal' | 'external' | 'both';

// Project status types
export type ProjectStatus = 'new' | 'in_progress' | 'on_hold' | 'internal_review' | 'out_to_client' | 'ready_to_print' | 'printing' | 'bill_client' | 'complete';

export const PROJECT_TYPE_CODES: Record<ProjectTypeCode, { label: string; description: string }> = {
  WEB: { label: 'Website', description: 'Landing Pages, Full Websites' },
  SOC: { label: 'Social Media', description: 'Social media content and campaigns' },
  EML: { label: 'Email Media', description: 'Email templates and campaigns' },
  PRT: { label: 'Print Media', description: 'Print materials and designs' },
  VEH: { label: 'Vehicle Design', description: 'Vehicle wraps and graphics' },
  DIG: { label: 'Digital Designs', description: 'Digital ads for magazines, websites, etc.' },
  ADS: { label: 'Paid Ad Designs', description: 'Google, Bing, Yelp, YouTube ads' },
  CAM: { label: 'Campaigns', description: 'Campaign planning, execution, and assets' },
  SFT: { label: 'Software', description: 'Software and engineering projects' },
};

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  added_via: 'manual' | 'task_assignment' | 'project_assignment';
  added_by: string | null;
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

export interface Project {
  id: string;
  name: string;
  description: string;
  project_type: string; // Existing broad category
  project_subtype: string | null; // Existing specific subcategory
  project_subtype_id: string | null; // FK to project_type_subtypes.id
  custom_attribute_values: Record<string, string | number | null>; // custom attribute values keyed by field id
  project_subtype_details?: Pick<ProjectTypeSubtype, 'id' | 'name' | 'has_custom_attributes' | 'custom_attribute_schema'> | null;
  type_code?: ProjectTypeCode; // NEW: Type code for shortcode generation
  shortcode?: string; // NEW: Auto-generated shortcode (read-only)
  status: 'new' | 'in_progress' | 'on_hold' | 'internal_review' | 'out_to_client' | 'ready_to_print' | 'printing' | 'bill_client' | 'complete';
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
  has_unread_mentions?: boolean;
  requested_by_profile: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string | null;
  };
  assigned_to_profile: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    avatar_url?: string | null;
  } | null;
  company: {
    id: string;
    name: string;
    branding?: {
      icon_logo_url?: string;
    } | {
      icon_logo_url?: string;
    }[] | null;
  };
  comments?: ProjectComment[];
  activity?: ProjectActivity[];
  categories?: ProjectCategoryAssignment[]; // Many-to-many relationship
  is_starred?: boolean; // Whether the current user has starred this project
  members?: ProjectMember[]; // Project members
  current_department_id: string | null;
  current_department?: ProjectDepartment; // For joins
  attachments?: ProjectAttachment[]; // Project attachments
}

export interface ProjectFormData {
  name: string;
  description: string;
  project_type: string;
  project_subtype: string;
  project_subtype_id?: string; // Optional FK to project_type_subtypes.id
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
  current_department_id?: string; // Optional department ID
  tasks?: ProjectTaskDraft[]; // Optional tasks to create with the project
  member_ids?: string[]; // Optional member user IDs to add to the project
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
  { value: 'new', label: 'New', color: '#3b82f6' }, // Blue (was In Progress color)
  { value: 'in_progress', label: 'In Progress', color: '#05B62E' }, // Custom green
  { value: 'on_hold', label: 'On Hold', color: '#ef4444' }, // Red (was Blocked color)
  { value: 'internal_review', label: 'Internal Review', color: '#eab308' }, // Yellow (was Pending Approval color)
  { value: 'out_to_client', label: 'Out To Client', color: '#8b5cf6' },
  { value: 'ready_to_print', label: 'Ready To Print', color: '#06b6d4', requiresCategory: 'Print' },
  { value: 'printing', label: 'Printing', color: '#0891b2', requiresCategory: 'Print' },
  { value: 'bill_client', label: 'Bill Client', color: '#059669', requiresBillable: true },
  { value: 'complete', label: 'Complete', color: '#99a1af' }, // Gray (icon color from project cards)
];

export const projectTypeOptions = [
  { value: 'none', label: 'None (no shortcode)', code: null },
  { value: 'campaigns', label: 'Campaigns', code: 'CAM' },
  { value: 'digital', label: 'Digital Designs', code: 'DIG' },
  { value: 'email', label: 'Email Media', code: 'EML' },
  { value: 'ads', label: 'Paid Ad Designs', code: 'ADS' },
  { value: 'print', label: 'Print Media', code: 'PRT' },
  { value: 'social', label: 'Social Media', code: 'SOC' },
  { value: 'software', label: 'Software', code: 'SFT' },
  { value: 'vehicle', label: 'Vehicle Design', code: 'VEH' },
  { value: 'website', label: 'Website', code: 'WEB' },
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

  // Dependencies & Blockers (one-to-one relationships)
  blocks_task_id: string | null; // The ONE task this task is blocking
  blocked_by_task_id: string | null; // The ONE task blocking this task
  blocker_reason: string | null;
  department_id: string | null; // Optional department assignment

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
  project?: {
    id: string;
    name: string;
    shortcode?: string | null;
  } | null;
  monthly_service_id?: string | null;
  monthly_service?: {
    id: string;
    service_name: string;
    company?: {
      id: string;
      name: string;
      branding?: {
        icon_logo_url?: string;
      } | {
        icon_logo_url?: string;
      }[] | null;
    } | null;
  } | null;
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
  categories?: Array<{
    id: string;
    name: string;
    category_type: CategoryType;
  }>;
  // Task dependencies (one-to-one, populated by joins)
  blocking_task?: {
    id: string;
    title: string;
    is_completed: boolean;
    assigned_to: string | null;
    due_date: string | null;
  } | null; // The ONE task this task is blocking
  blocked_by_task?: {
    id: string;
    title: string;
    is_completed: boolean;
    assigned_to: string | null;
    due_date: string | null;
  } | null; // The ONE task blocking this task
  hasUnreadComments?: boolean; // Whether there are comments newer than user's last view
  hasUnreadMentions?: boolean; // Whether there are unread comments that mention the current user
  comment_count?: number; // Total number of comments (from list API)
  has_attachments?: boolean; // Whether any comment has attachments (from list API)
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
  blocks_task_id?: string | null;
  blocked_by_task_id?: string | null;
  blocker_reason?: string | null;
  department_id?: string | null;
  recurring_frequency: string;
  recurring_end_date: string;
  category_ids?: string[];
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
  attachments?: ProjectCommentAttachment[];
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

export interface ProjectCommentAttachment {
  id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  url: string;
  created_at: string;
}

export interface ProjectAttachment {
  id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface ProjectProof {
  id: string;
  project_id: string;
  group_id: string;
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  uploaded_by: string;
  is_current: boolean;
  is_approved: boolean;
  version: number;
  created_at: string;
  updated_at: string;
  uploaded_by_profile?: { id: string; first_name: string; last_name: string; avatar_url?: string | null };
}

export interface ProofGroup {
  id: string;
  project_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  currentProof?: ProjectProof | null;
  archivedProofs?: ProjectProof[];
}

export interface ProofFeedback {
  id: string;
  proof_id: string;
  project_id: string;
  user_id: string;
  x_percent: number | null;
  y_percent: number | null;
  page_number: number;
  comment: string;
  pin_number: number;
  is_resolved: boolean;
  created_at: string;
  updated_at: string;
  user_profile?: { id: string; first_name: string; last_name: string; avatar_url?: string | null };
}

export interface ProofFeedbackActivity {
  id: string;
  proof_id: string;
  user_id: string;
  comment: string;
  pin_number: number;
  x_percent: number | null;
  y_percent: number | null;
  page_number: number;
  is_resolved: boolean;
  created_at: string;
  user_profile?: { id: string; first_name: string; last_name: string; avatar_url?: string | null };
  proof?: { id: string; file_name: string; version: number; is_current: boolean; mime_type: string };
}

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
  attachments?: ProjectCommentAttachment[];
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
  notes: string | null;
  project_type: string;
  project_subtype: string | null;
  is_active: boolean;
  template_data: Record<string, any> | null;
  default_assigned_to: string | null;
  default_scope: ProjectScope;
  default_due_date_offset_days: number;
  default_is_billable?: boolean | null;
  initial_department_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  tasks?: ProjectTemplateTask[];
  categories?: ProjectCategoryAssignment[];
  default_members?: Array<{ id: string; user_id: string }>;
  initial_department?: ProjectDepartment; // For joins
}

export interface ProjectTemplateTask {
  id: string;
  template_id: string;
  parent_task_id?: string | null;
  title: string;
  description: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date_offset_days: number;
  display_order: number;
  tags: string[] | null;
  default_assigned_to: string | null;
  blocks_task_id: string | null;
  blocked_by_task_id: string | null;
  department_id: string | null;
  created_at: string;
  updated_at: string;
  categories?: Array<{
    id: string;
    category_id: string;
    category?: ProjectCategory;
  }>;
}

export interface ProjectTaskDraft {
  temp_id?: string;
  parent_temp_id?: string | null;
  title: string;
  description: string;
  priority: string;
  due_date_offset_days: string;
  display_order: string;
  tags: string;
  default_assigned_to: string;
  blocks_task_id?: string | null;
  blocked_by_task_id?: string | null;
  department_id?: string | null;
  category_ids?: string[];
}

export interface ProjectTemplateFormData {
  name: string;
  description: string;
  notes: string;
  project_type: string;
  project_subtype: string;
  is_active: string;
  template_data: string;
  default_assigned_to: string;
  default_scope: string;
  default_due_date_offset_days: string;
  default_is_billable?: string;
  initial_department_id?: string;
  category_ids?: string[];
  default_member_ids?: string[];
  tasks: ProjectTaskDraft[];
}

// Apply Template Options
export interface ApplyTemplateOptions {
  templateId: string;
  mergeDescription: boolean; // true = append, false = replace
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
