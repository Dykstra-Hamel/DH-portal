'use client';

import { useState, useEffect, useCallback } from 'react';

interface AssignableUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  avatar_url?: string | null;
  display_name: string;
  departments: string[];
  roles?: string[];
}

interface UseAssignableUsersProps {
  companyId: string | null | undefined;
  departmentType: 'sales' | 'support';
  enabled?: boolean;
}

export function useAssignableUsers({
  companyId,
  departmentType,
  enabled = true
}: UseAssignableUsersProps) {
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is eligible for assignment based on department and role
  const isUserEligible = useCallback((user: AssignableUser): boolean => {
    const roles = user.roles || [];

    // Company admins and managers can be assigned to any department
    if (roles.includes('admin') || roles.includes('manager')) {
      return true;
    }

    // If user has the required department, they're eligible
    if (user.departments.includes(departmentType)) {
      return true;
    }

    return false;
  }, [departmentType]);

  const fetchAssignableUsers = useCallback(async () => {
    if (!companyId || !enabled) {
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/companies/${companyId}/users`);
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      const allUsers = data.users || [];

      // Filter users based on department requirements
      const eligibleUsers = allUsers.filter(isUserEligible);

      setUsers(eligibleUsers);
    } catch (err) {
      console.error('Error fetching assignable users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, enabled, isUserEligible]);

  useEffect(() => {
    fetchAssignableUsers();
  }, [fetchAssignableUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchAssignableUsers,
  };
}