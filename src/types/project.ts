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
  { value: 'cancelled', label: 'Cancelled', color: '#ef4444' }
];

export const priorityOptions = [
  { value: 'low', label: 'Low', color: '#10b981' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#f97316' },
  { value: 'urgent', label: 'Urgent', color: '#ef4444' }
];