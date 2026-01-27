/**
 * Storage Utilities
 *
 * Centralized configuration and helper functions for Supabase storage operations.
 * Used across all image upload APIs to ensure consistent bucket usage and path generation.
 */

/**
 * Storage configuration for all image assets
 */
export const STORAGE_CONFIG = {
  BUCKET_NAME: 'brand-assets',
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB (brand-assets bucket limit)
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],

  // Allowed types for comment attachments (images + documents)
  ATTACHMENT_ALLOWED_TYPES: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],

  CATEGORIES: {
    ALTERNATE_LOGOS: 'alternate-logos',
    ICON_LOGOS: 'icon-logos',
    LOGOS: 'logos',
    PHOTOGRAPHY: 'photography',
    IMAGE_LIBRARY: 'image-library', // ALL campaign uploads
    EMAIL_LOGOS: 'email-logos',
    COMMENT_ATTACHMENTS: 'comment-attachments',
  }
} as const;

/**
 * Cleans company name for use in storage paths.
 * Converts to lowercase, removes special characters, replaces spaces with hyphens.
 *
 * @param companyName - The raw company name from database
 * @returns Cleaned company name safe for file paths
 *
 * @example
 * cleanCompanyName("Dykstra & Hamel") // Returns: "dykstra-hamel"
 * cleanCompanyName("ABC 123 Company") // Returns: "abc-123-company"
 */
export function cleanCompanyName(companyName: string): string {
  return (companyName || 'company')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')           // Replace spaces with hyphens
    .replace(/-+/g, '-')            // Collapse multiple hyphens
    .trim();
}

/**
 * Gets company name from database.
 *
 * @param supabase - Supabase client instance
 * @param companyId - UUID of the company
 * @returns Company name string
 */
export async function getCompanyName(supabase: any, companyId: string): Promise<string> {
  const { data: company } = await supabase
    .from('companies')
    .select('name')
    .eq('id', companyId)
    .single();

  return company?.name || 'company';
}

/**
 * Sanitize filename to be safe for storage.
 * - Remove special characters (except dash, underscore)
 * - Replace spaces with dashes
 * - Convert to lowercase
 * - Preserve extension
 *
 * @param fileName - Original filename to sanitize
 * @returns Sanitized filename safe for storage
 *
 * @example
 * sanitizeFileName("My Photo (1).jpg") // Returns: "my-photo-1.jpg"
 * sanitizeFileName("sunset beach.png") // Returns: "sunset-beach.png"
 */
export function sanitizeFileName(fileName: string): string {
  const parts = fileName.split('.');
  const extension = parts.pop()?.toLowerCase() || '';
  const nameWithoutExt = parts.join('.');

  let sanitized = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, '')  // Remove special chars
    .replace(/\s+/g, '-')            // Spaces to dashes
    .replace(/-+/g, '-')             // Collapse multiple dashes
    .trim();

  // Fallback for empty names
  if (!sanitized || sanitized === '') {
    sanitized = 'image';
  }

  return extension ? `${sanitized}.${extension}` : sanitized;
}

/**
 * Find available filename by checking storage and incrementing suffix.
 * - Checks if file exists at path
 * - If exists, tries name-1, name-2, etc.
 * - Returns available filename
 *
 * @param supabase - Supabase client instance
 * @param bucketName - Storage bucket name
 * @param folderPath - Folder path within bucket
 * @param desiredFilename - Desired filename (will be sanitized)
 * @returns Promise<string> - Available filename with suffix if needed
 *
 * @example
 * await findAvailableFilename(supabase, "brand-assets", "company/image-library", "photo.jpg")
 * // Returns: "photo.jpg" if available, or "photo-1.jpg", "photo-2.jpg", etc.
 */
export async function findAvailableFilename(
  supabase: any,
  bucketName: string,
  folderPath: string,
  desiredFilename: string
): Promise<string> {
  const sanitized = sanitizeFileName(desiredFilename);

  // Check if base filename is available
  const { data: baseExists } = await supabase.storage
    .from(bucketName)
    .list(folderPath, {
      search: sanitized
    });

  if (!baseExists || baseExists.length === 0) {
    return sanitized;
  }

  // Extract name and extension
  const parts = sanitized.split('.');
  const extension = parts.pop() || '';
  const nameWithoutExt = parts.join('.');

  // Try incremental suffixes
  let counter = 1;
  let available = false;
  let testFilename = '';

  while (!available && counter < 1000) {  // Safety limit
    testFilename = extension
      ? `${nameWithoutExt}-${counter}.${extension}`
      : `${nameWithoutExt}-${counter}`;

    const { data: exists } = await supabase.storage
      .from(bucketName)
      .list(folderPath, {
        search: testFilename
      });

    if (!exists || exists.length === 0) {
      available = true;
    } else {
      counter++;
    }
  }

  return testFilename;
}

/**
 * Generates a storage path for a company image (preserves original filename).
 * Format: {cleanedCompanyName}/{category}/{sanitized-filename}
 * Automatically handles duplicates by adding suffix (e.g., photo-1.jpg, photo-2.jpg)
 *
 * @param cleanedCompanyName - Company name already cleaned with cleanCompanyName()
 * @param category - Folder category (from STORAGE_CONFIG.CATEGORIES)
 * @param originalFileName - Original uploaded filename (will be sanitized)
 * @param supabase - Supabase client for duplicate checking
 * @returns Promise<string> - Storage path with available filename
 *
 * @example
 * await generateImagePath("dykstra-hamel", "image-library", "photo.jpg", supabase)
 * // Returns: "dykstra-hamel/image-library/photo.jpg" (or photo-1.jpg if duplicate)
 */
export async function generateImagePath(
  cleanedCompanyName: string,
  category: string,
  originalFileName: string,
  supabase: any
): Promise<string> {
  const folderPath = `${cleanedCompanyName}/${category}`;
  const availableFilename = await findAvailableFilename(
    supabase,
    STORAGE_CONFIG.BUCKET_NAME,
    folderPath,
    originalFileName
  );

  return `${folderPath}/${availableFilename}`;
}
