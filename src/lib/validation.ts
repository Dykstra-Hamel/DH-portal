// Input validation and sanitization helpers

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, ''); // Basic XSS protection
}

export function validateUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

export function validateUserInput(data: {
  email: string;
  first_name: string;
  last_name: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required');
  }

  if (!data.first_name || data.first_name.trim().length < 1) {
    errors.push('First name is required');
  }

  if (!data.last_name || data.last_name.trim().length < 1) {
    errors.push('Last name is required');
  }

  if (data.first_name && data.first_name.length > 100) {
    errors.push('First name must be less than 100 characters');
  }

  if (data.last_name && data.last_name.length > 100) {
    errors.push('Last name must be less than 100 characters');
  }

  return { isValid: errors.length === 0, errors };
}

export function validateCompanyInput(data: {
  name: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 1) {
    errors.push('Company name is required');
  }

  if (data.name && data.name.length > 255) {
    errors.push('Company name must be less than 255 characters');
  }

  if (data.email && !validateEmail(data.email)) {
    errors.push('Valid email format required');
  }

  if (data.website && data.website.length > 0) {
    try {
      new URL(data.website);
    } catch {
      errors.push('Valid website URL required');
    }
  }

  return { isValid: errors.length === 0, errors };
}

export function validateUserCompanyInput(data: {
  user_id: string;
  company_id: string;
  role: string;
  is_primary: boolean;
}): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  const validRoles = ['member', 'admin', 'owner', 'manager'];

  if (!data.user_id || !validateUUID(data.user_id)) {
    errors.push('Valid user ID is required');
  }

  if (!data.company_id || !validateUUID(data.company_id)) {
    errors.push('Valid company ID is required');
  }

  if (!data.role || !validRoles.includes(data.role)) {
    errors.push('Valid role is required (member, admin, owner, manager)');
  }

  return { isValid: errors.length === 0, errors };
}
