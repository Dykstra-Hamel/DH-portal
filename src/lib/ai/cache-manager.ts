/**
 * AI Cache Manager
 *
 * Handles caching of AI responses in Supabase to:
 * - Reduce API costs
 * - Improve response times
 * - Optimize token usage
 *
 * Uses MD5 hashing for cache keys and supports TTL-based expiration.
 */

import { createAdminClient } from '@/lib/supabase/server-admin';
import { AICacheEntry } from './types';
import crypto from 'crypto';

export class CacheManager {
  private supabase = createAdminClient();
  private enabled: boolean;
  private defaultTTL: number; // seconds

  constructor(enabled: boolean = true, defaultTTL: number = 86400) {
    this.enabled = enabled;
    this.defaultTTL = defaultTTL; // 24 hours default
  }

  /**
   * Generate a hash for cache key from query parameters
   */
  private generateHash(data: any): string {
    const jsonString = JSON.stringify(data);
    return crypto.createHash('md5').update(jsonString).digest('hex');
  }

  /**
   * Get a cached response if available and not expired
   */
  async get(
    companyId: string,
    queryType: 'chat' | 'insights' | 'predictions' | 'report',
    queryParams: any
  ): Promise<any | null> {
    if (!this.enabled) {
      return null;
    }

    try {
      const queryHash = this.generateHash(queryParams);

      const { data, error } = await this.supabase
        .from('ai_cache')
        .select('*')
        .eq('company_id', companyId)
        .eq('query_hash', queryHash)
        .eq('query_type', queryType)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows found - cache miss
          return null;
        }
        console.error('[CacheManager] Error fetching from cache:', error);
        return null;
      }

      if (data) {
        console.log('[CacheManager] Cache hit', {
          companyId,
          queryType,
          queryHash,
          age: Math.round(
            (Date.now() - new Date(data.created_at).getTime()) / 1000
          ),
        });

        return data.response;
      }

      return null;
    } catch (error) {
      console.error('[CacheManager] Cache get error:', error);
      return null;
    }
  }

  /**
   * Store a response in the cache
   */
  async set(
    companyId: string,
    queryType: 'chat' | 'insights' | 'predictions' | 'report',
    queryParams: any,
    response: any,
    modelUsed: string,
    tokensUsed: number,
    ttlSeconds?: number
  ): Promise<void> {
    if (!this.enabled) {
      return;
    }

    try {
      const queryHash = this.generateHash(queryParams);
      const ttl = ttlSeconds || this.defaultTTL;
      const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

      const { error } = await this.supabase.from('ai_cache').upsert(
        {
          company_id: companyId,
          query_hash: queryHash,
          query_type: queryType,
          response,
          model_used: modelUsed,
          tokens_used: tokensUsed,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: 'company_id,query_hash',
        }
      );

      if (error) {
        console.error('[CacheManager] Error storing in cache:', error);
      } else {
        console.log('[CacheManager] Cache set', {
          companyId,
          queryType,
          queryHash,
          ttl,
        });
      }
    } catch (error) {
      console.error('[CacheManager] Cache set error:', error);
    }
  }

  /**
   * Invalidate cache entries for a company
   */
  async invalidate(
    companyId: string,
    queryType?: 'chat' | 'insights' | 'predictions' | 'report'
  ): Promise<number> {
    try {
      let query = this.supabase
        .from('ai_cache')
        .delete()
        .eq('company_id', companyId);

      if (queryType) {
        query = query.eq('query_type', queryType);
      }

      const { error, count } = await query;

      if (error) {
        console.error('[CacheManager] Error invalidating cache:', error);
        return 0;
      }

      console.log('[CacheManager] Cache invalidated', {
        companyId,
        queryType,
        count,
      });

      return count || 0;
    } catch (error) {
      console.error('[CacheManager] Cache invalidation error:', error);
      return 0;
    }
  }

  /**
   * Clean up expired cache entries
   * (Should be called periodically via cron job)
   */
  async cleanup(): Promise<number> {
    try {
      const { data, error } = await this.supabase.rpc('cleanup_expired_ai_cache');

      if (error) {
        console.error('[CacheManager] Error during cleanup:', error);
        return 0;
      }

      console.log(`[CacheManager] Cleaned up ${data} expired cache entries`);

      return data || 0;
    } catch (error) {
      console.error('[CacheManager] Cleanup error:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics for a company
   */
  async getStats(companyId: string): Promise<{
    totalEntries: number;
    byType: Record<string, number>;
    totalTokensSaved: number;
    oldestEntry: string | null;
    newestEntry: string | null;
  }> {
    try {
      const { data, error } = await this.supabase
        .from('ai_cache')
        .select('query_type, tokens_used, created_at')
        .eq('company_id', companyId)
        .gt('expires_at', new Date().toISOString());

      if (error) {
        console.error('[CacheManager] Error fetching stats:', error);
        return {
          totalEntries: 0,
          byType: {},
          totalTokensSaved: 0,
          oldestEntry: null,
          newestEntry: null,
        };
      }

      if (!data || data.length === 0) {
        return {
          totalEntries: 0,
          byType: {},
          totalTokensSaved: 0,
          oldestEntry: null,
          newestEntry: null,
        };
      }

      // Calculate stats
      const totalEntries = data.length;

      const byType: Record<string, number> = {};
      let totalTokensSaved = 0;

      data.forEach((entry) => {
        byType[entry.query_type] = (byType[entry.query_type] || 0) + 1;
        totalTokensSaved += entry.tokens_used || 0;
      });

      const timestamps = data.map((entry) => new Date(entry.created_at).getTime());
      const oldestEntry = new Date(Math.min(...timestamps)).toISOString();
      const newestEntry = new Date(Math.max(...timestamps)).toISOString();

      return {
        totalEntries,
        byType,
        totalTokensSaved,
        oldestEntry,
        newestEntry,
      };
    } catch (error) {
      console.error('[CacheManager] Error getting stats:', error);
      return {
        totalEntries: 0,
        byType: {},
        totalTokensSaved: 0,
        oldestEntry: null,
        newestEntry: null,
      };
    }
  }
}

/**
 * Singleton instance
 */
let cacheManagerInstance: CacheManager | null = null;

export function getCacheManager(): CacheManager {
  if (!cacheManagerInstance) {
    const enabled = process.env.ENABLE_AI_CACHE !== 'false';
    const ttl = parseInt(process.env.AI_CACHE_TTL || '86400', 10);
    cacheManagerInstance = new CacheManager(enabled, ttl);
  }

  return cacheManagerInstance;
}

/**
 * Reset singleton (for testing)
 */
export function resetCacheManager() {
  cacheManagerInstance = null;
}
