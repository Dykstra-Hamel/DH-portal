'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface UserCompany {
  id: string;
  user_id: string;
  company_id: string;
  role: string;
  is_primary: boolean;
  companies: {
    id: string;
    name: string;
  };
}

interface UseCompanyRoleReturn {
  role: string | null;
  isCompanyAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  userCompanies: UserCompany[];
  refetch: () => Promise<void>;
}

export function useCompanyRole(companyId?: string): UseCompanyRoleReturn {
  const [role, setRole] = useState<string | null>(null);
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserCompanies = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();

      // Get current user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setError('Not authenticated');
        setRole(null);
        setUserCompanies([]);
        return;
      }

      // Fetch user's company associations
      const { data: companies, error: companiesError } = await supabase
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
        .eq('user_id', user.id);

      if (companiesError) {
        console.error('Error fetching user companies:', companiesError);
        setError('Failed to fetch company information');
        return;
      }

      setUserCompanies(companies || []);

      // Find role for specific company if provided
      if (companyId) {
        const userCompany = companies?.find(uc => uc.company_id === companyId);
        setRole(userCompany?.role || null);
      } else {
        // If no specific company, set role to null
        setRole(null);
      }
    } catch (err) {
      console.error('Error in useCompanyRole:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    fetchUserCompanies();
  }, [companyId, fetchUserCompanies]);

  const isCompanyAdmin = role
    ? ['admin', 'manager', 'owner'].includes(role)
    : false;

  return {
    role,
    isCompanyAdmin,
    isLoading,
    error,
    userCompanies,
    refetch: fetchUserCompanies,
  };
}

// Helper hook to check if user is admin for any company
export function useIsCompanyAdminAny(): {
  isAdminForAnyCompany: boolean;
  isLoading: boolean;
  error: string | null;
  adminCompanies: UserCompany[];
} {
  const { userCompanies, isLoading, error } = useCompanyRole();

  const adminCompanies = userCompanies.filter(uc =>
    ['admin', 'manager', 'owner'].includes(uc.role)
  );

  return {
    isAdminForAnyCompany: adminCompanies.length > 0,
    isLoading,
    error,
    adminCompanies,
  };
}

// Helper hook to get user role for currently selected company
export function useCurrentCompanyRole(
  selectedCompany: { id: string } | null
): UseCompanyRoleReturn {
  return useCompanyRole(selectedCompany?.id);
}

// Helper hook to check if user is global admin
export function useIsGlobalAdmin(): {
  isGlobalAdmin: boolean;
  isLoading: boolean;
  error: string | null;
} {
  const [isGlobalAdmin, setIsGlobalAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkGlobalAdmin = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const supabase = createClient();
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          setError('Not authenticated');
          setIsGlobalAdmin(false);
          return;
        }

        // Get user profile to check role
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          setError('Failed to fetch user profile');
          setIsGlobalAdmin(false);
          return;
        }

        setIsGlobalAdmin(profile?.role === 'admin');
      } catch (err) {
        console.error('Error checking global admin status:', err);
        setError('An unexpected error occurred');
        setIsGlobalAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkGlobalAdmin();
  }, []);

  return {
    isGlobalAdmin,
    isLoading,
    error,
  };
}
