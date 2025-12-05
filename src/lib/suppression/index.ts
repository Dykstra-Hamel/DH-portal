/**
 * Suppression List Manager
 *
 * Manages the suppression list for preventing communication to bounced, complained, or unsubscribed contacts.
 * Supports multiple communication channels: email, phone, SMS.
 * Integrates with the database to track suppressed contacts per company.
 */

import { createAdminClient } from '@/lib/supabase/server-admin';

export type SuppressionReason = 'bounce' | 'complaint' | 'manual';
export type SuppressionType = 'hard_bounce' | 'soft_bounce' | 'complaint' | 'unsubscribe';
export type CommunicationType = 'email' | 'phone' | 'sms' | 'all';

export interface SuppressionEntry {
  id: string;
  companyId: string;
  emailAddress?: string;
  phoneNumber?: string;
  communicationType: CommunicationType;
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
 * @param communicationType - Type of communication to suppress (default: 'email')
 * @returns Success status or error
 */
export async function addToSuppressionList(
  email: string,
  companyId: string,
  reason: SuppressionReason,
  type: SuppressionType,
  sesEventData?: any,
  notes?: string,
  communicationType: 'email' | 'all' = 'email'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Check if already suppressed
    const { data: existing } = await supabase
      .from('suppression_list')
      .select('id, communication_type')
      .eq('company_id', companyId)
      .ilike('email_address', email)
      .single();

    if (existing) {
      // Already suppressed, update the entry (upgrade to 'all' if needed)
      const newCommType = existing.communication_type === 'all' || communicationType === 'all'
        ? 'all'
        : communicationType;

      const { error: updateError } = await supabase
        .from('suppression_list')
        .update({
          communication_type: newCommType,
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
      .from('suppression_list')
      .insert({
        company_id: companyId,
        email_address: email.toLowerCase(),
        communication_type: communicationType,
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
 * Add a phone number to the suppression list
 *
 * @param phone - Phone number to suppress (E.164 format recommended)
 * @param companyId - UUID of the company
 * @param communicationType - Type of communication to suppress: phone, sms, or all
 * @param reason - Reason for suppression
 * @param type - Specific type
 * @param notes - Optional notes about the suppression
 * @returns Success status or error
 */
export async function addPhoneToSuppressionList(
  phone: string,
  companyId: string,
  communicationType: 'phone' | 'sms' | 'all',
  reason: SuppressionReason,
  type: SuppressionType,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Check if already suppressed for this communication type
    const { data: existing } = await supabase
      .from('suppression_list')
      .select('id, communication_type')
      .eq('company_id', companyId)
      .ilike('phone_number', normalizedPhone)
      .single();

    if (existing) {
      // Already suppressed, update the entry (upgrade to 'all' if needed)
      const newCommType = existing.communication_type === 'all' || communicationType === 'all'
        ? 'all'
        : communicationType;

      const { error: updateError } = await supabase
        .from('suppression_list')
        .update({
          communication_type: newCommType,
          suppression_reason: reason,
          suppression_type: type,
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
      .from('suppression_list')
      .insert({
        company_id: companyId,
        phone_number: normalizedPhone,
        communication_type: communicationType,
        suppression_reason: reason,
        suppression_type: type,
        notes: notes || null,
        suppressed_at: new Date().toISOString(),
      });

    if (insertError) {
      throw insertError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding phone to suppression list:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add phone to suppression list',
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
      .from('suppression_list')
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
 * Remove a phone number from the suppression list
 *
 * @param phone - Phone number to remove
 * @param companyId - UUID of the company
 * @returns Success status or error
 */
export async function removePhoneFromSuppressionList(
  phone: string,
  companyId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');

    const { error } = await supabase
      .from('suppression_list')
      .delete()
      .eq('company_id', companyId)
      .ilike('phone_number', normalizedPhone);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error removing phone from suppression list:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to remove phone from suppression list',
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
      .from('suppression_list')
      .select('id')
      .eq('company_id', companyId)
      .ilike('email_address', email)
      .in('communication_type', ['email', 'all'])
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
 * Check if a phone number is suppressed for a specific communication type
 *
 * @param phone - Phone number to check
 * @param companyId - UUID of the company
 * @param communicationType - Type to check: phone, sms, or all
 * @returns True if suppressed, false otherwise
 */
export async function isPhoneSuppressed(
  phone: string,
  companyId: string,
  communicationType: 'phone' | 'sms' = 'phone'
): Promise<boolean> {
  try {
    const supabase = createAdminClient();
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Check if suppressed for this specific type OR 'all' communications
    const { data, error } = await supabase
      .from('suppression_list')
      .select('id')
      .eq('company_id', companyId)
      .ilike('phone_number', normalizedPhone)
      .in('communication_type', [communicationType, 'all'])
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking phone suppression:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('Error checking phone suppression:', error);
    return false; // On error, allow communication
  }
}

/**
 * Check if a contact is suppressed (checks both email and phone)
 *
 * @param companyId - UUID of the company
 * @param email - Optional email address to check
 * @param phone - Optional phone number to check
 * @param communicationType - Type of communication to check
 * @returns True if suppressed, false otherwise
 */
export async function isContactSuppressed(
  companyId: string,
  email?: string,
  phone?: string,
  communicationType: CommunicationType = 'all'
): Promise<boolean> {
  if (communicationType === 'email' && email) {
    return isEmailSuppressed(email, companyId);
  }

  if ((communicationType === 'phone' || communicationType === 'sms') && phone) {
    return isPhoneSuppressed(phone, companyId, communicationType as 'phone' | 'sms');
  }

  if (communicationType === 'all') {
    const emailSuppressed = email ? await isEmailSuppressed(email, companyId) : false;
    const phoneSuppressed = phone ? await isPhoneSuppressed(phone, companyId, 'phone') : false;
    return emailSuppressed || phoneSuppressed;
  }

  return false;
}

/**
 * Get all suppressed contacts for a company
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
      .from('suppression_list')
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
      phoneNumber: row.phone_number,
      communicationType: row.communication_type,
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
      .from('suppression_list')
      .select('*')
      .eq('company_id', companyId)
      .ilike('email_address', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return {
          success: false,
          error: 'Contact not found in suppression list',
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
        phoneNumber: data.phone_number,
        communicationType: data.communication_type,
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
    byType: {
      email: number;
      phone: number;
      sms: number;
      all: number;
    };
    byReason: {
      hardBounces: number;
      softBounces: number;
      complaints: number;
      unsubscribes: number;
      manual: number;
    };
  };
  error?: string;
}> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('suppression_list')
      .select('suppression_reason, suppression_type, communication_type')
      .eq('company_id', companyId);

    if (error) {
      throw error;
    }

    const stats = {
      total: data.length,
      byType: {
        email: data.filter((r) => r.communication_type === 'email').length,
        phone: data.filter((r) => r.communication_type === 'phone').length,
        sms: data.filter((r) => r.communication_type === 'sms').length,
        all: data.filter((r) => r.communication_type === 'all').length,
      },
      byReason: {
        hardBounces: data.filter((r) => r.suppression_type === 'hard_bounce').length,
        softBounces: data.filter((r) => r.suppression_type === 'soft_bounce').length,
        complaints: data.filter((r) => r.suppression_type === 'complaint').length,
        unsubscribes: data.filter((r) => r.suppression_type === 'unsubscribe').length,
        manual: data.filter((r) => r.suppression_reason === 'manual').length,
      },
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
      .from('suppression_list')
      .select('email_address')
      .eq('company_id', companyId)
      .in('email_address', lowerEmails)
      .in('communication_type', ['email', 'all']);

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

/**
 * Bulk check if multiple phone numbers are suppressed
 *
 * @param phones - Array of phone numbers to check
 * @param companyId - UUID of the company
 * @param communicationType - Type of communication to check
 * @returns Object mapping phone to suppressed status
 */
export async function bulkCheckPhoneSuppression(
  phones: string[],
  companyId: string,
  communicationType: 'phone' | 'sms' = 'phone'
): Promise<{ success: boolean; data?: Record<string, boolean>; error?: string }> {
  try {
    const supabase = createAdminClient();

    const normalizedPhones = phones.map((p) => p.replace(/[\s\-\(\)]/g, ''));

    const { data, error } = await supabase
      .from('suppression_list')
      .select('phone_number')
      .eq('company_id', companyId)
      .in('phone_number', normalizedPhones)
      .in('communication_type', [communicationType, 'all']);

    if (error) {
      throw error;
    }

    const suppressedSet = new Set((data || []).map((r) => r.phone_number?.toLowerCase()));

    const result: Record<string, boolean> = {};
    for (const phone of phones) {
      const normalized = phone.replace(/[\s\-\(\)]/g, '').toLowerCase();
      result[phone] = suppressedSet.has(normalized);
    }

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('Error bulk checking phone suppression:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to bulk check phone suppression',
    };
  }
}
