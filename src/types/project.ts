export interface Project {
  id: string;
  name: string;
  description: string;
  project_type: string;
  status: 'pending' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date: string;
  start_date: string | null;
  completion_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  budget_amount: number | null;
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
  requested_by: string;
  company_id: string;
  assigned_to: string;
  status: string;
  priority: string;
  due_date: string;
  start_date: string;
  completion_date: string;
  estimated_hours: string;
  actual_hours: string;
  budget_amount: string;
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
  { value: 'pending', label: 'Pending', color: '#f59e0b' },
  { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'on_hold', label: 'On Hold', color: '#6b7280' },
  { value: 'completed', label: 'Completed', color: '#10b981' },
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
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

  // Status & Priority
  status: 'todo' | 'in_progress' | 'in_review' | 'completed' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';

  // Assignment
  assigned_to: string | null;
  created_by: string;

  // Timeline
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;

  // Progress & Time Tracking
  progress_percentage: number;
  estimated_hours: number | null;
  actual_hours: number | null;

  // Project Management Fields
  labels: string[] | null;
  milestone: string | null;
  sprint: string | null;
  story_points: number | null;

  // Dependencies & Blockers
  blocked_by: string[] | null;
  blocking: string[] | null;
  blocker_reason: string | null;

  // Order & Display
  display_order: number;
  kanban_column: string | null;

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
  status: string;
  priority: string;
  assigned_to: string;
  due_date: string;
  start_date: string;
  estimated_hours: string;
  labels: string;
  milestone: string;
  sprint: string;
  story_points: string;
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
  status: string;
  priority: string;
  assigned_to: string;
  milestone: string;
  sprint: string;
}

export const taskStatusOptions = [
  { value: 'todo', label: 'To Do', color: '#6b7280' },
  { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'in_review', label: 'In Review', color: '#f59e0b' },
  { value: 'completed', label: 'Completed', color: '#10b981' },
  { value: 'blocked', label: 'Blocked', color: '#ef4444' },
  { value: 'cancelled', label: 'Cancelled', color: '#6b7280' },
];

export const taskPriorityOptions = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'critical', label: 'Critical', color: '#ef4444' },
];
