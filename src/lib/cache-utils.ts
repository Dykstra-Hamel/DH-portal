/**
 * Cache utility for client-side data caching with TTL support
 * Uses sessionStorage for temporary caching that persists across page reloads
 * but clears when the browser tab is closed
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached data if valid, otherwise return null
 */
export function getCached<T>(key: string): T | null {
  try {
    const item = sessionStorage.getItem(key);
    if (!item) return null;

    const entry: CacheEntry<T> = JSON.parse(item);
    const now = Date.now();

    // Check if cache is expired
    if (now > entry.expiresAt) {
      sessionStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

/**
 * Set cached data with TTL
 */
export function setCached<T>(
  key: string,
  data: T,
  ttlMs: number = DEFAULT_TTL_MS
): void {
  try {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttlMs,
    };
    sessionStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
}

/**
 * Check if cache entry exists and is valid
 */
export function isCacheValid(key: string): boolean {
  try {
    const item = sessionStorage.getItem(key);
    if (!item) return false;

    const entry: CacheEntry<unknown> = JSON.parse(item);
    const now = Date.now();

    return now <= entry.expiresAt;
  } catch (error) {
    return false;
  }
}

/**
 * Clear a specific cache entry
 */
export function clearCache(key: string): void {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
}

/**
 * Clear all cache entries with a specific prefix
 */
export function clearCacheByPrefix(prefix: string): void {
  try {
    const keys = Object.keys(sessionStorage);
    keys.forEach((key) => {
      if (key.startsWith(prefix)) {
        sessionStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Error clearing cache by prefix:', error);
  }
}

/**
 * Get cache age in milliseconds
 */
export function getCacheAge(key: string): number | null {
  try {
    const item = sessionStorage.getItem(key);
    if (!item) return null;

    const entry: CacheEntry<unknown> = JSON.parse(item);
    return Date.now() - entry.timestamp;
  } catch (error) {
    return null;
  }
}

// Cache key constants
export const CACHE_KEYS = {
  COMPANIES_LIST: 'cache:companies:list',
  USER_PROFILE: 'cache:user:profile',
  COMPANY_BRANDING: (companyId: string) => `cache:company:${companyId}:branding`,
} as const;
