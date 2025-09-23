'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useCompany } from '@/contexts/CompanyContext';
import { Department, UserDepartment, DepartmentStats } from '@/types/user';

interface UseUserDepartmentsReturn {
  departments: Department[];
  departmentDetails: UserDepartment[];
  isLoading: boolean;
  error: string | null;
  updateDepartments: (departments: Department[]) => Promise<boolean>;
  refetch: () => Promise<void>;
}

export function useUserDepartments(
  userId: string,
  companyId: string
): UseUserDepartmentsReturn {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentDetails, setDepartmentDetails] = useState<UserDepartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    if (!userId || !companyId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(
        `/api/users/${userId}/departments?companyId=${companyId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch departments');
      }

      const data = await response.json();
      setDepartments(data.departments || []);
      setDepartmentDetails(data.departmentDetails || []);
    } catch (err) {
      console.error('Error fetching user departments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch departments');
    } finally {
      setIsLoading(false);
    }
  }, [userId, companyId]);

  const updateDepartments = useCallback(async (newDepartments: Department[]): Promise<boolean> => {
    if (!userId || !companyId) return false;

    try {
      setError(null);

      const response = await fetch(`/api/users/${userId}/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyId,
          departments: newDepartments,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update departments');
      }

      const data = await response.json();
      setDepartments(data.departments || []);
      setDepartmentDetails(data.departmentDetails || []);
      return true;
    } catch (err) {
      console.error('Error updating user departments:', err);
      setError(err instanceof Error ? err.message : 'Failed to update departments');
      return false;
    }
  }, [userId, companyId]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  return {
    departments,
    departmentDetails,
    isLoading,
    error,
    updateDepartments,
    refetch: fetchDepartments,
  };
}

interface UseCompanyDepartmentsReturn {
  stats: DepartmentStats | null;
  usersWithDepartments: any[];
  eligibleUsers: any[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  fetchEligibleUsers: () => Promise<void>;
}

export function useCompanyDepartments(companyId: string): UseCompanyDepartmentsReturn {
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [usersWithDepartments, setUsersWithDepartments] = useState<any[]>([]);
  const [eligibleUsers, setEligibleUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanyDepartments = useCallback(async () => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/companies/${companyId}/departments`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch company departments');
      }

      const data = await response.json();
      setStats(data.stats);
      setUsersWithDepartments(data.usersWithDepartments || []);
    } catch (err) {
      console.error('Error fetching company departments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch company departments');
    } finally {
      setIsLoading(false);
    }
  }, [companyId]);

  const fetchEligibleUsers = useCallback(async () => {
    if (!companyId) return;

    try {
      setError(null);

      const response = await fetch(`/api/companies/${companyId}/departments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'get-eligible-users' }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch eligible users');
      }

      const data = await response.json();
      setEligibleUsers(data.eligibleUsers || []);
    } catch (err) {
      console.error('Error fetching eligible users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch eligible users');
    }
  }, [companyId]);

  useEffect(() => {
    fetchCompanyDepartments();
  }, [fetchCompanyDepartments]);

  return {
    stats,
    usersWithDepartments,
    eligibleUsers,
    isLoading,
    error,
    refetch: fetchCompanyDepartments,
    fetchEligibleUsers,
  };
}

// Hook for checking if current user has specific department access
interface UseDepartmentAccessReturn {
  hasAccess: (department: Department) => boolean;
  departments: Department[];
  isLoading: boolean;
  error: string | null;
}

export function useDepartmentAccess(
  userId: string | undefined,
  companyId: string | undefined
): UseDepartmentAccessReturn {
  const { departments, isLoading, error } = useUserDepartments(
    userId || '',
    companyId || ''
  );

  const hasAccess = useCallback(
    (department: Department): boolean => {
      return departments.includes(department);
    },
    [departments]
  );

  return {
    hasAccess,
    departments,
    isLoading,
    error,
  };
}

// Hook for department-based filtering and permissions
export function useDepartmentPermissions() {
  const checkCanAccessDepartment = useCallback(
    (userDepartments: Department[], requiredDepartment: Department): boolean => {
      return userDepartments.includes(requiredDepartment);
    },
    []
  );

  const checkCanAccessAnyDepartment = useCallback(
    (userDepartments: Department[], requiredDepartments: Department[]): boolean => {
      return requiredDepartments.some(dept => userDepartments.includes(dept));
    },
    []
  );

  const checkCanAccessAllDepartments = useCallback(
    (userDepartments: Department[], requiredDepartments: Department[]): boolean => {
      return requiredDepartments.every(dept => userDepartments.includes(dept));
    },
    []
  );

  const filterByDepartmentAccess = useCallback(
    <T extends { departments?: Department[] }>(
      items: T[],
      userDepartments: Department[],
      requiredDepartment?: Department
    ): T[] => {
      if (!requiredDepartment) return items;

      return items.filter(item => {
        if (!item.departments) return false;
        return item.departments.includes(requiredDepartment);
      });
    },
    []
  );

  return {
    checkCanAccessDepartment,
    checkCanAccessAnyDepartment,
    checkCanAccessAllDepartments,
    filterByDepartmentAccess,
  };
}

// Page access types
export type PageType = 'sales' | 'scheduling' | 'support';

// Hook for page-level access control
interface UsePageAccessReturn {
  hasAccess: boolean;
  isLoading: boolean;
  error: string | null;
  accessReason: 'admin' | 'owner' | 'department' | 'denied';
}

export function usePageAccess(
  pageType: PageType,
  userId?: string,
  companyId?: string
): UsePageAccessReturn {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessReason, setAccessReason] = useState<'admin' | 'owner' | 'department' | 'denied'>('denied');

  // Map page types to required departments
  const departmentMap: Record<PageType, Department> = {
    sales: 'sales',
    scheduling: 'scheduling',
    support: 'support'
  };

  const requiredDepartment = departmentMap[pageType];

  useEffect(() => {
    const checkAccess = async () => {
      if (!userId || !companyId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Check if user is global admin
        const profileResponse = await fetch(`/api/users/${userId}/profile`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.role === 'admin') {
            setHasAccess(true);
            setAccessReason('admin');
            setIsLoading(false);
            return;
          }
        }

        // Check company role and departments
        const [companyRoleResponse, departmentsResponse] = await Promise.all([
          fetch(`/api/users/${userId}/company-role?companyId=${companyId}`),
          fetch(`/api/users/${userId}/departments?companyId=${companyId}`)
        ]);

        let companyRole = null;
        if (companyRoleResponse.ok) {
          const roleData = await companyRoleResponse.json();
          companyRole = roleData.role;
        }

        // Check if user is company owner/admin
        if (companyRole && ['owner', 'admin'].includes(companyRole)) {
          setHasAccess(true);
          setAccessReason('owner');
          setIsLoading(false);
          return;
        }

        // Check department access for member/manager roles
        if (companyRole && ['member', 'manager'].includes(companyRole)) {
          if (departmentsResponse.ok) {
            const departmentsData = await departmentsResponse.json();
            const userDepartments: Department[] = departmentsData.departments || [];

            if (userDepartments.includes(requiredDepartment)) {
              setHasAccess(true);
              setAccessReason('department');
              setIsLoading(false);
              return;
            }
          }
        }

        // No access granted
        setHasAccess(false);
        setAccessReason('denied');
      } catch (err) {
        console.error('Error checking page access:', err);
        setError(err instanceof Error ? err.message : 'Failed to check access');
        setHasAccess(false);
        setAccessReason('denied');
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [pageType, userId, companyId, requiredDepartment]);

  return {
    hasAccess,
    isLoading,
    error,
    accessReason,
  };
}

// Simplified hook using current user context with better integration
export function useCurrentUserPageAccess(pageType: PageType): UsePageAccessReturn {
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessReason, setAccessReason] = useState<'admin' | 'owner' | 'department' | 'denied'>('denied');

  // Use CompanyContext to avoid race conditions with localStorage
  const { selectedCompany, isLoading: companyLoading } = useCompany();

  // Map page types to required departments
  const departmentMap: Record<PageType, Department> = {
    sales: 'sales',
    scheduling: 'scheduling',
    support: 'support'
  };

  const requiredDepartment = departmentMap[pageType];

  useEffect(() => {
    const checkPageAccess = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Wait for CompanyContext to finish loading
        if (companyLoading) {
          return; // Keep loading state, don't make access decision yet
        }

        const supabase = createClient();

        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setHasAccess(false);
          setAccessReason('denied');
          return;
        }

        const userId = session.user.id;

        // Get user profile to check for global admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        // Check if user is global admin
        if (profile?.role === 'admin') {
          setHasAccess(true);
          setAccessReason('admin');
          return;
        }

        // Use selectedCompany from context instead of localStorage
        if (!selectedCompany?.id) {
          setHasAccess(false);
          setAccessReason('denied');
          return;
        }

        const companyId = selectedCompany.id;

        // Use API endpoint to check user's role in the company
        const companyRoleResponse = await fetch(`/api/users/${userId}/company-role?companyId=${companyId}`);

        if (!companyRoleResponse.ok) {
          setHasAccess(false);
          setAccessReason('denied');
          return;
        }

        const roleData = await companyRoleResponse.json();
        const companyRole = roleData.role;

        // Check if user is company owner/admin
        if (companyRole && ['owner', 'admin'].includes(companyRole)) {
          setHasAccess(true);
          setAccessReason('owner');
          return;
        }

        // Check department access for member/manager roles
        if (companyRole && ['member', 'manager'].includes(companyRole)) {
          const departmentsResponse = await fetch(
            `/api/users/${userId}/departments?companyId=${companyId}`
          );

          if (departmentsResponse.ok) {
            const departmentsData = await departmentsResponse.json();
            const userDepartments: Department[] = departmentsData.departments || [];

            if (userDepartments.includes(requiredDepartment)) {
              setHasAccess(true);
              setAccessReason('department');
              return;
            }
          }
        }

        // No access granted
        setHasAccess(false);
        setAccessReason('denied');
      } catch (err) {
        console.error('Error checking page access:', err);
        setError(err instanceof Error ? err.message : 'Failed to check access');
        setHasAccess(false);
        setAccessReason('denied');
      } finally {
        setIsLoading(false);
      }
    };

    checkPageAccess();
  }, [pageType, requiredDepartment, selectedCompany, companyLoading]);

  return {
    hasAccess,
    isLoading,
    error,
    accessReason,
  };
}