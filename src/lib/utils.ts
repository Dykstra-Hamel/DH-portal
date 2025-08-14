// Utility functions for the application

/**
 * Creates a URL-safe slug from a company name
 * @param name - The company name to convert to a slug
 * @returns A URL-safe slug
 */
export const createCompanySlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace one or more spaces with single hyphen
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
    .trim();
};

/**
 * Finds a company by its slug from a list of companies
 * @param companies - Array of companies with id and name
 * @param slug - The slug to match
 * @returns The matching company or null
 */
export const findCompanyBySlug = (
  companies: Array<{ id: string; name: string }>,
  slug: string
) => {
  return (
    companies.find(company => createCompanySlug(company.name) === slug) || null
  );
};

/**
 * Normalizes a phone number to the format (xxx) xxx-xxxx
 * @param phoneNumber - The phone number to normalize
 * @returns A formatted phone number or null if invalid
 */
export const normalizePhoneNumber = (
  phoneNumber: string | null | undefined
): string | null => {
  if (!phoneNumber) return null;

  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // Handle common US phone number formats
  let cleanDigits = digits;

  // Remove country code if present (1 at the beginning for US numbers)
  if (cleanDigits.startsWith('1') && cleanDigits.length === 11) {
    cleanDigits = cleanDigits.substring(1);
  }

  // Must be exactly 10 digits for a valid US phone number
  if (cleanDigits.length !== 10) {
    return null;
  }

  // Format as (xxx) xxx-xxxx
  const areaCode = cleanDigits.substring(0, 3);
  const exchange = cleanDigits.substring(3, 6);
  const number = cleanDigits.substring(6, 10);

  return `(${areaCode}) ${exchange}-${number}`;
};

/**
 * Checks if a phone number is valid (can be normalized)
 * @param phoneNumber - The phone number to validate
 * @returns True if the phone number is valid
 */
export const isValidPhoneNumber = (
  phoneNumber: string | null | undefined
): boolean => {
  return normalizePhoneNumber(phoneNumber) !== null;
};

/**
 * Converts a phone number to E.164 format for SMS/calling
 * @param phoneNumber - The phone number to convert
 * @returns E.164 formatted phone number (+1xxxxxxxxxx) or null if invalid
 */
export const toE164PhoneNumber = (
  phoneNumber: string | null | undefined
): string | null => {
  if (!phoneNumber) return null;

  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');
  
  // Handle US numbers
  let cleanDigits = digits;
  
  // Remove country code if present (1 at the beginning)
  if (cleanDigits.startsWith('1') && cleanDigits.length === 11) {
    cleanDigits = cleanDigits.substring(1);
  }
  
  // Must be exactly 10 digits for a valid US phone number
  if (cleanDigits.length !== 10) {
    return null;
  }
  
  // Return E.164 format with US country code
  return `+1${cleanDigits}`;
};

/**
 * Formats a date for display in the user's local timezone
 * Consistent formatting across the application for timestamps
 * @param date - Date string, Date object, or timestamp
 * @returns Formatted date string in local timezone
 */
export const formatDateForDisplay = (date: string | Date | number): string => {
  const dateObj = new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};
