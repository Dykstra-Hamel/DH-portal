/**
 * Unsubscribe Token Management
 *
 * Handles generation, validation, and usage of unsubscribe tokens for secure one-click unsubscribe.
 */

import { createAdminClient } from '@/lib/supabase/server-admin';
import crypto from 'crypto';

export interface UnsubscribeToken {
  id: string;
  token: string;
  companyId: string;
  customerId?: string;
  email?: string;
  phoneNumber?: string;
  source: string;
  metadata: Record<string, any>;
  expiresAt: string;
  usedAt?: string;
  createdAt: string;
}

export interface GenerateTokenParams {
  companyId: string;
  customerId?: string;
  email?: string;
  phoneNumber?: string;
  source?: string;
  metadata?: Record<string, any>;
  expiresInDays?: number;
}

/**
 * Generate a secure unsubscribe token
 *
 * @param params - Token generation parameters
 * @returns Token data or error
 */
export async function generateUnsubscribeToken(
  params: GenerateTokenParams
): Promise<{ success: boolean; data?: UnsubscribeToken; error?: string }> {
  const {
    companyId,
    customerId,
    email,
    phoneNumber,
    source = 'email_campaign',
    metadata = {},
    expiresInDays = 90,
  } = params;

  // Validate that at least one contact method is provided
  if (!email && !phoneNumber) {
    return {
      success: false,
      error: 'Either email or phone number must be provided',
    };
  }

  try {
    const supabase = createAdminClient();

    // Generate secure random token (32 bytes = 64 hex characters)
    const token = crypto.randomBytes(32).toString('hex');

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Insert token into database
    const { data, error } = await supabase
      .from('unsubscribe_tokens')
      .insert({
        token,
        company_id: companyId,
        customer_id: customerId || null,
        email: email || null,
        phone_number: phoneNumber || null,
        source,
        metadata,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    const tokenData: UnsubscribeToken = {
      id: data.id,
      token: data.token,
      companyId: data.company_id,
      customerId: data.customer_id,
      email: data.email,
      phoneNumber: data.phone_number,
      source: data.source,
      metadata: data.metadata,
      expiresAt: data.expires_at,
      usedAt: data.used_at,
      createdAt: data.created_at,
    };

    return {
      success: true,
      data: tokenData,
    };
  } catch (error) {
    console.error('Error generating unsubscribe token:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to generate token',
    };
  }
}

/**
 * Validate an unsubscribe token
 * Checks if token exists, is not expired, and hasn't been used
 *
 * @param token - Token string to validate
 * @returns Token data if valid, error otherwise
 */
export async function validateUnsubscribeToken(
  token: string
): Promise<{ success: boolean; data?: UnsubscribeToken; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Fetch token from database
    const { data, error } = await supabase
      .from('unsubscribe_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: false,
          error: 'Invalid token',
        };
      }
      throw error;
    }

    // Check if token has already been used
    if (data.used_at) {
      return {
        success: false,
        error: 'Token has already been used',
      };
    }

    // Check if token has expired
    const now = new Date();
    const expiresAt = new Date(data.expires_at);

    if (now > expiresAt) {
      return {
        success: false,
        error: 'Token has expired',
      };
    }

    const tokenData: UnsubscribeToken = {
      id: data.id,
      token: data.token,
      companyId: data.company_id,
      customerId: data.customer_id,
      email: data.email,
      phoneNumber: data.phone_number,
      source: data.source,
      metadata: data.metadata,
      expiresAt: data.expires_at,
      usedAt: data.used_at,
      createdAt: data.created_at,
    };

    return {
      success: true,
      data: tokenData,
    };
  } catch (error) {
    console.error('Error validating unsubscribe token:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to validate token',
    };
  }
}

/**
 * Mark a token as used
 * Should be called after successfully processing an unsubscribe request
 *
 * @param token - Token string to mark as used
 * @returns Success status or error
 */
export async function markTokenAsUsed(
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('unsubscribe_tokens')
      .update({
        used_at: new Date().toISOString(),
      })
      .eq('token', token);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking token as used:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to mark token as used',
    };
  }
}

/**
 * Get unsubscribe URL for a token
 *
 * @param token - Token string
 * @param baseUrl - Base URL for the application (optional, defaults to current origin)
 * @returns Full unsubscribe URL
 */
export function getUnsubscribeUrl(token: string, baseUrl?: string): string {
  const base =
    baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  return `${base}/unsubscribe?token=${token}`;
}

/**
 * Get all tokens for a company (admin function)
 *
 * @param companyId - UUID of the company
 * @param options - Optional filters
 * @returns List of tokens or error
 */
export async function getCompanyTokens(
  companyId: string,
  options?: {
    includeUsed?: boolean;
    includeExpired?: boolean;
    limit?: number;
    offset?: number;
  }
): Promise<{
  success: boolean;
  data?: UnsubscribeToken[];
  count?: number;
  error?: string;
}> {
  try {
    const supabase = createAdminClient();
    const {
      includeUsed = false,
      includeExpired = false,
      limit = 100,
      offset = 0,
    } = options || {};

    let query = supabase
      .from('unsubscribe_tokens')
      .select('*', { count: 'exact' })
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    // Filter out used tokens if requested
    if (!includeUsed) {
      query = query.is('used_at', null);
    }

    // Filter out expired tokens if requested
    if (!includeExpired) {
      query = query.gt('expires_at', new Date().toISOString());
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    const tokens: UnsubscribeToken[] = (data || []).map(row => ({
      id: row.id,
      token: row.token,
      companyId: row.company_id,
      customerId: row.customer_id,
      email: row.email,
      phoneNumber: row.phone_number,
      source: row.source,
      metadata: row.metadata,
      expiresAt: row.expires_at,
      usedAt: row.used_at,
      createdAt: row.created_at,
    }));

    return {
      success: true,
      data: tokens,
      count: count || 0,
    };
  } catch (error) {
    console.error('Error getting company tokens:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get company tokens',
    };
  }
}

/**
 * Get token statistics for a company
 *
 * @param companyId - UUID of the company
 * @returns Token statistics or error
 */
export async function getTokenStats(companyId: string): Promise<{
  success: boolean;
  data?: {
    total: number;
    used: number;
    expired: number;
    active: number;
    bySource: Record<string, number>;
  };
  error?: string;
}> {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('unsubscribe_tokens')
      .select('used_at, expires_at, source')
      .eq('company_id', companyId);

    if (error) {
      throw error;
    }

    const now = new Date();
    const stats = {
      total: data.length,
      used: data.filter(t => t.used_at).length,
      expired: data.filter(t => new Date(t.expires_at) < now && !t.used_at)
        .length,
      active: data.filter(t => !t.used_at && new Date(t.expires_at) >= now)
        .length,
      bySource: {} as Record<string, number>,
    };

    // Count by source
    for (const token of data) {
      stats.bySource[token.source] = (stats.bySource[token.source] || 0) + 1;
    }

    return {
      success: true,
      data: stats,
    };
  } catch (error) {
    console.error('Error getting token stats:', error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Failed to get token stats',
    };
  }
}

/**
 * Clean up expired tokens (can be run as a cron job)
 * Deletes tokens that have been expired for more than 30 days
 *
 * @returns Count of deleted tokens or error
 */
export async function cleanupExpiredTokens(): Promise<{
  success: boolean;
  deletedCount?: number;
  error?: string;
}> {
  try {
    const supabase = createAdminClient();

    // Delete tokens expired for more than 30 days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);

    const { error, count } = await supabase
      .from('unsubscribe_tokens')
      .delete({ count: 'exact' })
      .lt('expires_at', cutoffDate.toISOString());

    if (error) {
      throw error;
    }

    return {
      success: true,
      deletedCount: count || 0,
    };
  } catch (error) {
    console.error('Error cleaning up expired tokens:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to cleanup expired tokens',
    };
  }
}
