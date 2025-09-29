export type TaskStatus =
  | 'new'
  | 'pending'
  | 'in_progress'
  | 'completed';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskRelatedEntityType = 
  | 'leads' 
  | 'support_cases' 
  | 'customers' 
  | null;

export interface Task {
  id: string;
  company_id: string;
  
  // Core task fields
  title: string;
  description?: string;
  notes?: string;
  
  // Task workflow and status
  status: TaskStatus;
  priority: TaskPriority;
  
  // Assignment and tracking
  assigned_to?: string;
  created_by?: string;
  
  // Timing and scheduling
  due_date?: string; // ISO date string
  due_time?: string; // HH:MM format
  estimated_hours?: number;
  actual_hours?: number;
  
  // Polymorphic relationship to any entity
  related_entity_type?: TaskRelatedEntityType;
  related_entity_id?: string;
  
  // Task completion tracking
  completed_at?: string;
  started_at?: string;
  
  // Standard fields
  archived: boolean;
  created_at: string;
  updated_at: string;

  // Joined data from related tables
  assigned_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
  };
  created_user?: {
    id: string;
    first_name: string;
    last_name: string;
    email?: string;
  };
  company?: {
    id: string;
    name: string;
  };
  
  // Related entity data (populated based on related_entity_type)
  related_entity?: {
    id: string;
    title?: string;
    name?: string;
    summary?: string;
    status?: string;
    type?: string;
  };
}

export interface TaskFormData {
  title: string;
  description?: string;
  notes?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to?: string | null;
  due_date?: string;
  due_time?: string;
  related_entity_type?: TaskRelatedEntityType;
  related_entity_id?: string | null;
}

export interface TaskCreateData extends TaskFormData {
  company_id: string;
  created_by?: string;
}

export interface TaskUpdateData extends Partial<TaskFormData> {
  id: string;
}

export const taskStatusOptions = [
  { value: 'new', label: 'New' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
] as const;

export const taskPriorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;

export const taskRelatedEntityTypeOptions = [
  { value: 'leads', label: 'Lead' },
  { value: 'support_cases', label: 'Support Case' },
  { value: 'customers', label: 'Customer' },
] as const;

// Utility functions
export const getTaskStatusColor = (status: TaskStatus): string => {
  switch (status) {
    case 'new':
      return 'blue';
    case 'pending':
      return 'orange';
    case 'in_progress':
      return 'yellow';
    case 'completed':
      return 'green';
    default:
      return 'gray';
  }
};

export const getTaskPriorityColor = (priority: TaskPriority): string => {
  switch (priority) {
    case 'low':
      return 'gray';
    case 'medium':
      return 'blue';
    case 'high':
      return 'orange';
    case 'urgent':
      return 'red';
    default:
      return 'gray';
  }
};

export const formatTaskDueDateTime = (due_date?: string, due_time?: string): string => {
  if (!due_date) return '';
  
  const date = new Date(due_date);
  const dateStr = date.toLocaleDateString();
  
  if (due_time) {
    return `${dateStr} at ${due_time}`;
  }
  
  return dateStr;
};

export const isTaskOverdue = (task: Task): boolean => {
  if (!task.due_date || task.status === 'completed') {
    return false;
  }
  
  const now = new Date();
  const dueDate = new Date(task.due_date);
  
  if (task.due_time) {
    const [hours, minutes] = task.due_time.split(':').map(Number);
    dueDate.setHours(hours, minutes, 0, 0);
  } else {
    // If no time specified, consider it due at end of day
    dueDate.setHours(23, 59, 59, 999);
  }
  
  return now > dueDate;
};

export const getTaskDisplayName = (task: Task): string => {
  if (task.related_entity && task.related_entity_type) {
    const entityName = task.related_entity.title || 
                      task.related_entity.name || 
                      task.related_entity.summary ||
                      `${task.related_entity_type.replace('_', ' ')} #${task.related_entity.id.slice(-8)}`;
    return `${task.title} (${entityName})`;
  }
  return task.title;
};