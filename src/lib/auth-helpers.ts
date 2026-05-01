import { NextRequest } from 'next/server';
import { createAdminClient } from './supabase/server-admin';

export async function verifyAuth(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { user: null, error: 'Missing or invalid authorization header' };
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createAdminClient();

    // Try to verify with admin client first (more reliable for API routes)
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return { user: null, error: 'Invalid or expired token' };
    }

    return { user, error: null };
  } catch (error) {
    return { user: null, error: 'Authentication failed' };
  }
}

// Alternative auth verification that accepts session token from request body or headers
export async function verifyAuthFlexible(request: NextRequest) {
  try {
    // First try the standard Bearer token approach
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const supabase = createAdminClient();

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (!error && user) {
        return { user, error: null };
      }
    }

    // Try to get session token from request body for admin components
    try {
      const body = await request.clone().json();
      if (body.sessionToken) {
        const supabase = createAdminClient();
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser(body.sessionToken);

        if (!error && user) {
          return { user, error: null };
        }
      }
    } catch {
      // JSON parsing failed, continue with other methods
    }

    // If no valid authentication found
    return { user: null, error: 'No valid authentication found' };
  } catch (error) {
    return { user: null, error: 'Authentication failed' };
  }
}

// Check if user has admin role
export async function isAuthorizedAdmin(user: any): Promise<boolean> {
  if (!user) return false;

  const supabase = createAdminClient();
  // Check if user has admin role in their profile using admin client
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin';
}

// Synchronous version for cases where we already have the profile
export function isAuthorizedAdminSync(profile: any): boolean {
  return profile?.role === 'admin';
}

export function isProjectManagerSync(profile: any): boolean {
  return profile?.role === 'project_manager';
}

export async function isAuthorizedAdminOrPM(user: any): Promise<boolean> {
  if (!user) return false;
  const supabase = createAdminClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  return profile?.role === 'admin' || profile?.role === 'project_manager';
}

export function isAuthorizedAdminOrPMSync(profile: any): boolean {
  return profile?.role === 'admin' || profile?.role === 'project_manager';
}

// Interface for UserCompany data
interface UserCompany {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  is_primary: boolean;
}

// Check if user has admin role for a specific company
export async function isCompanyAdmin(
  userId: string,
  companyId: string
): Promise<boolean> {
  if (!userId || !companyId) return false;

  const supabase = createAdminClient();
  const { data: userCompany } = await supabase
    .from('user_companies')
    .select('role')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .maybeSingle();

  return userCompany
    ? ['admin', 'manager', 'owner'].includes(userCompany.role)
    : false;
}

// Check if user has admin role for any company
export async function isCompanyAdminAny(userId: string): Promise<boolean> {
  if (!userId) return false;

  const supabase = createAdminClient();
  const { data: userCompanies } = await supabase
    .from('user_companies')
    .select('role')
    .eq('user_id', userId)
    .in('role', ['admin', 'manager', 'owner']);

  return userCompanies ? userCompanies.length > 0 : false;
}

// Get user's role for a specific company
export async function getUserCompanyRole(
  userId: string,
  companyId: string
): Promise<string | null> {
  if (!userId || !companyId) return null;

  const supabase = createAdminClient();
  const { data: userCompany } = await supabase
    .from('user_companies')
    .select('role')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .single();

  return userCompany?.role || null;
}

// Get all companies where user has admin privileges
export async function getUserAdminCompanies(
  userId: string
): Promise<UserCompany[]> {
  if (!userId) return [];

  const supabase = createAdminClient();
  const { data: userCompanies, error } = await supabase
    .from('user_companies')
    .select(
      `
      *,
      companies (
        id,
        name
      )
    `
    )
    .eq('user_id', userId)
    .in('role', ['admin', 'manager', 'owner']);

  if (error) {
    console.error('Error fetching admin companies:', error);
    return [];
  }

  return userCompanies || [];
}

// Synchronous helper to check if a role can manage settings
export function canManageSettings(role: string): boolean {
  return ['admin', 'manager', 'owner'].includes(role);
}

// Dashboard view selector. Existing isCompanyAdmin* helpers still treat
// 'manager' as company-admin for permissions; this helper exists so the
// field-sales dashboard can render a manager-scoped view (direct reports +
// default branch) without weakening permission gates elsewhere.
export type CompanyDashboardRole = 'admin' | 'manager' | 'member';

export async function getCompanyDashboardRole(
  userId: string,
  companyId: string
): Promise<CompanyDashboardRole> {
  if (!userId || !companyId) return 'member';

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from('user_companies')
    .select('role')
    .eq('user_id', userId)
    .eq('company_id', companyId)
    .maybeSingle();

  const role = row?.role;
  if (role === 'admin' || role === 'owner') return 'admin';
  if (role === 'manager') return 'manager';
  return 'member';
}

// Synchronous helper to check if user is company admin from UserCompany array
export function isCompanyAdminSync(
  userCompanies: UserCompany[],
  companyId: string
): boolean {
  const userCompany = userCompanies.find(uc => uc.company_id === companyId);
  return userCompany ? canManageSettings(userCompany.role) : false;
}
