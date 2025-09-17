/**
 * Utility functions for generating and validating company slugs
 */

/**
 * Generate a URL-safe slug from a company name
 */
export function generateSlug(companyName: string): string {
  if (!companyName || typeof companyName !== 'string') {
    return 'company';
  }

  let slug = companyName
    .toLowerCase()
    .trim()
    // Remove special characters except spaces and hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace multiple spaces with single hyphen
    .replace(/\s+/g, '-')
    // Replace multiple hyphens with single hyphen
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');

  // Ensure slug is not empty
  if (!slug || slug.length === 0) {
    slug = 'company';
  }

  // Limit slug length
  if (slug.length > 100) {
    slug = slug.substring(0, 100).replace(/-+$/, '');
  }

  return slug;
}

/**
 * Validate if a slug is URL-safe and follows our rules
 */
export function validateSlug(slug: string): boolean {
  if (!slug || typeof slug !== 'string') {
    return false;
  }

  // Check if slug contains only lowercase letters, numbers, and hyphens
  const slugPattern = /^[a-z0-9-]+$/;
  
  // Additional checks
  return (
    slugPattern.test(slug) &&
    slug.length > 0 &&
    slug.length <= 100 &&
    !slug.startsWith('-') &&
    !slug.endsWith('-') &&
    !slug.includes('--') // No double hyphens
  );
}

/**
 * Generate a unique slug by appending a number if needed
 * This is a client-side helper - uniqueness should still be validated server-side
 */
export function generateUniqueSlug(companyName: string, existingSlugs: string[]): string {
  const baseSlug = generateSlug(companyName);
  
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  let uniqueSlug = `${baseSlug}-${counter}`;
  
  while (existingSlugs.includes(uniqueSlug)) {
    counter++;
    uniqueSlug = `${baseSlug}-${counter}`;
  }

  return uniqueSlug;
}