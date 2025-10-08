/**
 * Activity Log Types
 * Defines types for the unified activity logging system
 */

export type EntityType = 'lead' | 'ticket' | 'support_case' | 'customer';

export type ActivityType =
  | 'created'
  | 'field_update'
  | 'status_change'
  | 'note_added'
  | 'contact_made'
  | 'assignment_changed'
  | 'task_completed'
  | 'cadence_started'
  | 'cadence_paused'
  | 'cadence_ended'
  | 'archived'
  | 'deleted';

export interface Activity {
  id: string;
  company_id: string;
  entity_type: EntityType;
  entity_id: string;
  activity_type: ActivityType;
  field_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  user_id?: string | null;
  notes?: string | null;
  metadata?: Record<string, any> | null;
  created_at: string;

  // Joined data from relations (if included in query)
  user?: {
    id: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

export interface CreateActivityInput {
  company_id: string;
  entity_type: EntityType;
  entity_id: string;
  activity_type: ActivityType;
  field_name?: string | null;
  old_value?: string | null;
  new_value?: string | null;
  user_id?: string | null;
  notes?: string | null;
  metadata?: Record<string, any> | null;
}

export interface ActivityLogParams {
  entity_type: EntityType;
  entity_id: string;
  activity_type?: ActivityType;
  limit?: number;
  offset?: number;
}

/**
 * Activity type display configuration
 */
export interface ActivityTypeConfig {
  label: string;
  icon: string; // Lucide icon name
  color?: string;
}

export const ACTIVITY_TYPE_CONFIG: Record<ActivityType, ActivityTypeConfig> = {
  created: {
    label: 'Created',
    icon: 'Plus',
  },
  field_update: {
    label: 'Updated',
    icon: 'Edit',
  },
  status_change: {
    label: 'Status Changed',
    icon: 'RefreshCw',
  },
  note_added: {
    label: 'Added Note',
    icon: 'MessageSquare',
  },
  contact_made: {
    label: 'Contact Made',
    icon: 'Phone',
  },
  assignment_changed: {
    label: 'Reassigned',
    icon: 'User',
  },
  task_completed: {
    label: 'Task Completed',
    icon: 'Check',
  },
  cadence_started: {
    label: 'Cadence Started',
    icon: 'Target',
  },
  cadence_paused: {
    label: 'Cadence Paused',
    icon: 'Pause',
  },
  cadence_ended: {
    label: 'Cadence Ended',
    icon: 'CircleSlash',
  },
  archived: {
    label: 'Archived',
    icon: 'Archive',
  },
  deleted: {
    label: 'Deleted',
    icon: 'Trash2',
  },
};

/**
 * Field name display labels
 * Maps database field names to user-friendly labels
 */
export const FIELD_LABELS: Record<string, string> = {
  first_name: 'First Name',
  last_name: 'Last Name',
  email: 'Email',
  phone: 'Phone',
  alternate_phone: 'Alternate Phone',
  address: 'Address',
  street_address: 'Street Address',
  city: 'City',
  state: 'State',
  zip_code: 'Zip Code',
  lead_status: 'Lead Status',
  priority: 'Priority',
  assigned_to: 'Assigned To',
  notes: 'Notes',
  customer_status: 'Customer Status',
  ticket_status: 'Ticket Status',
  issue_type: 'Issue Type',
  resolution_action: 'Resolution Action',
};
