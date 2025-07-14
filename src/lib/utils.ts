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
export const findCompanyBySlug = (companies: Array<{id: string, name: string}>, slug: string) => {
  return companies.find(company => createCompanySlug(company.name) === slug) || null;
};