/**
 * Quote utility functions
 */

import { randomUUID } from 'crypto';

/**
 * Generates a secure random UUID token for quote access
 * This token must be included in the URL for public quote access
 *
 * @returns A new UUID v4 token
 *
 * @example
 * generateQuoteToken()
 * // Returns: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
 */
export function generateQuoteToken(): string {
  return randomUUID();
}

/**
 * Generates a quote URL path (without domain) for a given company, quote, and token
 * This path can be stored in the database and works across all environments
 *
 * @param companySlug - The company's URL slug
 * @param quoteId - The quote ID (UUID)
 * @param token - The secure access token for the quote
 * @returns Path to the public quote page with token
 *
 * @example
 * generateQuoteUrl('northwest-exterminating', '123e4567-e89b-12d3-a456-426614174000', '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d')
 * // Returns: '/northwest-exterminating/quote/123e4567-e89b-12d3-a456-426614174000?token=9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
 */
export function generateQuoteUrl(companySlug: string, quoteId: string, token: string): string {
  return `/${companySlug}/quote/${quoteId}?token=${token}`;
}

/**
 * Converts a quote URL path to a full URL with domain
 * Uses NEXT_PUBLIC_SITE_URL environment variable with localhost fallback
 *
 * @param quotePath - The quote path (e.g., '/northwest-exterminating/quote/123')
 * @returns Full URL with domain
 *
 * @example
 * getFullQuoteUrl('/northwest-exterminating/quote/123e4567-e89b-12d3-a456-426614174000')
 * // Returns: 'http://localhost:3000/northwest-exterminating/quote/123e4567-e89b-12d3-a456-426614174000'
 */
export function getFullQuoteUrl(quotePath: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  // Remove leading slash if present to avoid double slashes
  const cleanPath = quotePath.startsWith('/') ? quotePath.slice(1) : quotePath;
  return `${baseUrl}/${cleanPath}`;
}
