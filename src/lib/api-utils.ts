import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { NextResponse } from 'next/server';

/**
 * Authentication and authorization utilities for API routes
 */

export interface AuthResult {
  user: any;
  profile: any;
  isGlobalAdmin: boolean;
  supabase: any;
}

/**
 * Get authenticated user and their profile information
 * Returns user, profile, admin status, and appropriate supabase client
 */
export async function getAuthenticatedUser(): Promise<AuthResult | NextResponse> {
  const supabase = await createClient();

  // Get the current user from the session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check user profile to determine if they're a global admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isGlobalAdmin = profile?.role === 'admin';

  return {
    user,
    profile,
    isGlobalAdmin,
    supabase
  };
}

/**
 * Verify user has access to a specific company
 */
export async function verifyCompanyAccess(
  supabase: any,
  userId: string,
  companyId: string,
  isGlobalAdmin: boolean = false
): Promise<boolean | NextResponse> {
  // Admins have access to all companies
  if (isGlobalAdmin) {
    return true;
  }

  const { data: userCompany, error: userCompanyError } = await supabase
    .from('user_companies')
    .select('id')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .single();

  if (userCompanyError || !userCompany) {
    return NextResponse.json(
      { error: 'Access denied to this company' },
      { status: 403 }
    );
  }

  return true;
}

/**
 * Get the appropriate Supabase client (admin or regular) based on user role
 */
export function getSupabaseClient(isGlobalAdmin: boolean, regularClient: any) {
  if (isGlobalAdmin) {
    return createAdminClient();
  }
  return regularClient;
}

/**
 * Standard error response helper
 */
export function createErrorResponse(message: string, status: number = 500) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Standard success response helper
 */
export function createSuccessResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}