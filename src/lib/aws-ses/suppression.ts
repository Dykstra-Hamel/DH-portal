/**
 * Email Suppression List Manager
 *
 * Manages the email suppression list for preventing sends to bounced or complained addresses.
 * Integrates with the database to track suppressed emails per company.
 */

import { createAdminClient } from '@/lib/supabase/server-admin';

export type SuppressionReason = 'bounce' | 'complaint' | 'manual';
export type SuppressionType = 'hard_bounce' | 'soft_bounce' | 'complaint' | 'unsubscribe';

export interface SuppressionEntry {
  id: string;
  companyId: string;
  emailAddress: string;
  suppressionReason: SuppressionReason;
  suppressionType: SuppressionType;
  suppressedAt: string;
  sesEventData?: any;
  notes?: string;
}

/**
 * Add an email address to the suppression list
 *
 * @param email - Email address to suppress
 * @param companyId - UUID of the company
 * @param reason - Reason for suppression: bounce, complaint, or manual
 * @param type - Specific type: hard_bounce, soft_bounce, complaint, or unsubscribe
 * @param sesEventData - Optional SES event data for audit trail
 * @param notes - Optional notes about the suppression
 * @returns Success status or error
 */
export async function addToSuppressionList(
  email: string,
  companyId: string,
  reason: SuppressionReason,
  type: SuppressionType,
  sesEventData?: any,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Check if already suppressed
    const { data: existing } = await supabase
      .from('email_suppression_list')
      .select('id')
      .eq('company_id', companyId)
      .ilike('email_address', email)
      .single();

    if (existing) {
      // Already suppressed, update the entry
      const { error: updateError } = await supabase
        .from('email_suppression_list')
        .update({
          suppression_reason: reason,
          suppression_type: type,
          ses_event_data: sesEventData,
          notes: notes || null,
          suppressed_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (updateError) {
        throw updateError;
      }

      return { success: true };
    }

    // Insert new suppression entry
    const { error: insertError } = await supabase
      .from('email_suppression_list')
      .insert({
        company_id: companyId,
        email_address: email.toLowerCase(),
        suppression_reason: reason,
        suppression_type: type,
        ses_event_data: sesEventData,
        notes: notes || null,
        suppressed_at: new Date().toISOString(),
      });

    if (insertError) {
      throw insertError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding to suppression list:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add to suppression list',
    };
  }
}

/**
 * Remove an email address from the suppression list
 *
 * @param email - Email address to remove
 * @param companyId - UUID of the company
 * @returns Success status or error
 */
export async function removeFromSuppressionList(
  email: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('email_suppression_list')
      .delete()
      .eq('company_id', companyId)
      .ilike('email_address', email);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing from suppression list:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to remove from suppression list',
    };
  }
}

/**
 * Check if an email address is suppressed for a company
 *
 * @param email - Email address to check
 * @param companyId - UUID of the company
 * @returns True if suppressed, false otherwise
 */
export async function isEmailSuppressed(
  email: string,
  companyId: string
): Promise<boolean> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('email_suppression_list')
      .select('id')
      .eq('company_id', companyId)
      .ilike('email_address', email)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned", which is expected
      console.error('Error checking suppression list:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking suppression list:', error);
    return false; // On error, allow send (better than blocking valid emails)
  }
}

/**
 * Get all suppressed emails for a company
 *
 * @param companyId - UUID of the company
 * @param limit - Maximum number of results (default: 1000)
 * @param offset - Offset for pagination (default: 0)
 * @returns Array of suppression entries or error
 */
export async function getSuppressionList(
  companyId: string,
  limit: number = 1000,
  offset: number = 0
): Promise<{ success: boolean; data?: SuppressionEntry[]; error?: string; count?: number }> {
  try {
    const supabase = createAdminClient();

    const { data, error, count } = await supabase
      .from('email_suppression_list')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .order('suppressed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    const suppressionEntries: SuppressionEntry[] = (data || []).map((row) => ({
      id: row.id,
      companyId: row.company_id,
      emailAddress: row.email_address,
      suppressionReason: row.suppression_reason,
      suppressionType: row.suppression_type,
      suppressedAt: row.suppressed_at,
      sesEventData: row.ses_event_data,
      notes: row.notes,
    }));

    return {
      success: true,
      data: suppressionEntries,
      count: count || 0,
    };
  } catch (error) {
    console.error('Error getting suppression list:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get suppression list',
    };
  }
}

/**
 * Get a specific suppression entry
 *
 * @param email - Email address
 * @param companyId - UUID of the company
 * @returns Suppression entry or error
 */
export async function getSuppressionEntry(
  email: string,
  companyId: string
): Promise<{ success: boolean; data?: SuppressionEntry; error?: string }> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('email_suppression_list')
      .select('*')
      .eq('company_id', companyId)
      .ilike('email_address', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return {
          success: false,
          error: 'Email not found in suppression list',
        };
      }
      throw error;
    }

    return {
      success: true,
      data: {
        id: data.id,
        companyId: data.company_id,
        emailAddress: data.email_address,
        suppressionReason: data.suppression_reason,
        suppressionType: data.suppression_type,
        suppressedAt: data.suppressed_at,
        sesEventData: data.ses_event_data,
        notes: data.notes,
      },
    };
  } catch (error) {
    console.error('Error getting suppression entry:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get suppression entry',
    };
  }
}

/**
 * Get suppression statistics for a company
 *
 * @param companyId - UUID of the company
 * @returns Suppression statistics or error
 */
export async function getSuppressionStats(
  companyId: string
): Promise<{
  success: boolean;
  data?: {
    total: number;
    hardBounces: number;
    softBounces: number;
    complaints: number;
    manual: number;
  };
  error?: string;
}> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('email_suppression_list')
      .select('suppression_reason, suppression_type')
      .eq('company_id', companyId);

    if (error) {
      throw error;
    }

    const stats = {
      total: data.length,
      hardBounces: data.filter((r) => r.suppression_type === 'hard_bounce').length,
      softBounces: data.filter((r) => r.suppression_type === 'soft_bounce').length,
      complaints: data.filter((r) => r.suppression_type === 'complaint').length,
      manual: data.filter((r) => r.suppression_reason === 'manual').length,
    };

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('Error getting suppression stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get suppression stats',
    };
  }
}

/**
 * Bulk check if multiple emails are suppressed
 *
 * @param emails - Array of email addresses to check
 * @param companyId - UUID of the company
 * @returns Object mapping email to suppressed status
 */
export async function bulkCheckSuppression(
  emails: string[],
  companyId: string
): Promise<{ success: boolean; data?: Record<string, boolean>; error?: string }> {
  try {
    const supabase = createAdminClient();

    const lowerEmails = emails.map((e) => e.toLowerCase());

    const { data, error } = await supabase
      .from('email_suppression_list')
      .select('email_address')
      .eq('company_id', companyId)
      .in('email_address', lowerEmails);

    if (error) {
      throw error;
    }

    const suppressedSet = new Set((data || []).map((r) => r.email_address.toLowerCase()));

    const result: Record<string, boolean> = {};
    for (const email of emails) {
      result[email] = suppressedSet.has(email.toLowerCase());
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error bulk checking suppression:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to bulk check suppression',
    };
  }
}
