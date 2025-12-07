export type Department = 'sales' | 'support' | 'scheduling';

export type ProfileRole = 'admin' | 'super_admin' | 'user' | 'customer';

export type CompanyRole = 'admin' | 'manager' | 'owner' | 'member';

export interface UserDepartment {
  id: string;
  user_id: string;
  company_id: string;
  department: Department;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  email: string;
  role?: ProfileRole;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserCompany {
  id: string;
  user_id: string;
  company_id: string;
  role: CompanyRole;
  is_primary: boolean;
  joined_at: string;
  created_at: string;
  updated_at: string;
  companies?: {
    id: string;
    name: string;
  };
}

export interface UserWithDepartments extends Profile {
  departments?: Department[];
  user_companies?: UserCompany[];
}

export interface UserDepartmentAssignment {
  userId: string;
  companyId: string;
  departments: Department[];
}

export interface DepartmentStats {
  sales: number;
  support: number;
  scheduling: number;
  total: number;
}

// Department display configuration
export const DEPARTMENT_CONFIG = {
  sales: {
    label: 'Sales',
    description: 'Handle sales inquiries and lead qualification',
    color: '#10b981', // emerald-500
    icon: '💰'
  },
  support: {
    label: 'Customer Service',
    description: 'Provide customer support and resolve issues',
    color: '#3b82f6', // blue-500
    icon: '🛟'
  },
  scheduling: {
    label: 'Scheduling',
    description: 'Manage appointments and service scheduling',
    color: '#f59e0b', // amber-500
    icon: '📅'
  }
} as const;

// Helper functions
export const getDepartmentLabel = (department: Department): string => {
  return DEPARTMENT_CONFIG[department].label;
};

export const getDepartmentColor = (department: Department): string => {
  return DEPARTMENT_CONFIG[department].color;
};

export const getDepartmentIcon = (department: Department): string => {
  return DEPARTMENT_CONFIG[department].icon;
};

export const canHaveDepartments = (companyRole: CompanyRole): boolean => {
  return ['member', 'manager'].includes(companyRole);
};

export const formatDepartmentsList = (departments: Department[]): string => {
  if (departments.length === 0) return 'No departments';
  return departments.map(dept => getDepartmentLabel(dept)).join(', ');
};

// Validation functions
export const validateDepartments = (departments: Department[]): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (departments.length === 0) {
    errors.push('At least one department must be selected');
  }

  if (departments.length > 3) {
    errors.push('Cannot assign more than 3 departments');
  }

  const validDepartments: Department[] = ['sales', 'support', 'scheduling'];
  const invalidDepartments = departments.filter(dept => !validDepartments.includes(dept));

  if (invalidDepartments.length > 0) {
    errors.push(`Invalid departments: ${invalidDepartments.join(', ')}`);
  }

  // Check for duplicates
  const uniqueDepartments = [...new Set(departments)];
  if (uniqueDepartments.length !== departments.length) {
    errors.push('Duplicate departments are not allowed');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};