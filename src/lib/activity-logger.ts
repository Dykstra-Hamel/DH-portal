/**
 * Activity Logger Utility
 * Provides functions to log activities to the unified activity_log table
 */

import { createClient } from '@/lib/supabase/server';
import type { CreateActivityInput, EntityType, ActivityType } from '@/types/activity';

/**
 * Log a single activity
 */
export async function logActivity(input: CreateActivityInput): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from('activity_log').insert({
    company_id: input.company_id,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    activity_type: input.activity_type,
    field_name: input.field_name || null,
    old_value: input.old_value || null,
    new_value: input.new_value || null,
    user_id: input.user_id || null,
    notes: input.notes || null,
    metadata: input.metadata || null,
  });

  if (error) {
    console.error('Error logging activity:', error);
    // Don't throw - we don't want activity logging to break the main operation
  }
}

/**
 * Detect and log field changes between old and new data
 */
export async function logFieldChanges(params: {
  entityType: EntityType;
  entityId: string;
  companyId: string;
  oldData: Record<string, any>;
  newData: Record<string, any>;
  userId?: string;
}): Promise<void> {
  const { entityType, entityId, companyId, oldData, newData, userId } = params;

  // Fields to exclude from logging (internal/system fields)
  const excludeFields = [
    'id',
    'created_at',
    'updated_at',
    'company_id',
    'archived',
  ];

  // Detect changes
  const changes: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }> = [];

  for (const key in newData) {
    if (excludeFields.includes(key)) continue;
    if (oldData[key] !== newData[key]) {
      changes.push({
        field: key,
        oldValue: oldData[key],
        newValue: newData[key],
      });
    }
  }

  // Log each change as a separate activity
  for (const change of changes) {
    await logActivity({
      company_id: companyId,
      entity_type: entityType,
      entity_id: entityId,
      activity_type: change.field === 'status' || change.field.includes('_status')
        ? 'status_change'
        : 'field_update',
      field_name: change.field,
      old_value: formatValue(change.oldValue),
      new_value: formatValue(change.newValue),
      user_id: userId,
    });
  }
}

/**
 * Format a value for display/storage
 */
function formatValue(value: any): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

/**
 * Log a note
 */
export async function logNote(params: {
  entityType: EntityType;
  entityId: string;
  companyId: string;
  userId: string;
  notes: string;
}): Promise<void> {
  await logActivity({
    company_id: params.companyId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    activity_type: 'note_added',
    user_id: params.userId,
    notes: params.notes,
  });
}

/**
 * Log contact activity (phone call, email, text message)
 */
export async function logContact(params: {
  entityType: EntityType;
  entityId: string;
  companyId: string;
  userId: string;
  contactType: string;
  notes?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  await logActivity({
    company_id: params.companyId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    activity_type: 'contact_made',
    user_id: params.userId,
    notes: params.notes,
    metadata: {
      contact_type: params.contactType,
      ...params.metadata,
    },
  });
}

/**
 * Log entity creation
 */
export async function logCreation(params: {
  entityType: EntityType;
  entityId: string;
  companyId: string;
  userId?: string;
  notes?: string;
  metadata?: Record<string, any>;
}): Promise<void> {
  await logActivity({
    company_id: params.companyId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    activity_type: 'created',
    user_id: params.userId,
    notes: params.notes,
    metadata: params.metadata,
  });
}

/**
 * Log assignment change
 */
export async function logAssignmentChange(params: {
  entityType: EntityType;
  entityId: string;
  companyId: string;
  userId: string;
  oldAssignee?: string;
  newAssignee: string;
}): Promise<void> {
  await logActivity({
    company_id: params.companyId,
    entity_type: params.entityType,
    entity_id: params.entityId,
    activity_type: 'assignment_changed',
    user_id: params.userId,
    old_value: params.oldAssignee || null,
    new_value: params.newAssignee,
  });
}
