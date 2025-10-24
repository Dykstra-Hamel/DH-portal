/**
 * AI Usage Tracker
 *
 * Tracks all AI API usage for:
 * - Billing and cost tracking
 * - Analytics and reporting
 * - Quota management
 * - Performance monitoring
 */

import { createAdminClient } from '@/lib/supabase/server-admin';
import { AIUsageLog, GeminiUsageMetrics } from './types';

export class UsageTracker {
  private supabase = createAdminClient();

  /**
   * Log an AI API usage event
   */
  async logUsage(
    companyId: string,
    featureType: 'chat' | 'insights' | 'predictions' | 'reports',
    modelUsed: string,
    usage: GeminiUsageMetrics,
    cached: boolean,
    responseTime: number,
    success: boolean,
    userId?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase.from('ai_usage').insert({
        company_id: companyId,
        user_id: userId || null,
        feature_type: featureType,
        model_used: modelUsed,
        tokens_in: usage.tokensIn,
        tokens_out: usage.tokensOut,
        total_tokens: usage.totalTokens,
        cost_cents: usage.costCents,
        cached,
        response_time_ms: responseTime,
        success,
        error_message: errorMessage || null,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('[UsageTracker] Error logging usage:', error);
      }
    } catch (error) {
      console.error('[UsageTracker] Usage logging error:', error);
    }
  }

  /**
   * Get usage summary for a company within a date range
   */
  async getSummary(
    companyId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalRequests: number;
    cachedRequests: number;
    cacheHitRate: number;
    totalTokens: number;
    totalCostCents: number;
    averageResponseTime: number;
    successRate: number;
    byFeature: Record<
      string,
      {
        requests: number;
        tokens: number;
        costCents: number;
      }
    >;
  }> {
    try {
      const { data, error } = await this.supabase.rpc('get_ai_usage_summary', {
        p_company_id: companyId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) {
        console.error('[UsageTracker] Error getting summary:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          totalRequests: 0,
          cachedRequests: 0,
          cacheHitRate: 0,
          totalTokens: 0,
          totalCostCents: 0,
          averageResponseTime: 0,
          successRate: 0,
          byFeature: {},
        };
      }

      // Aggregate across all feature types
      const totalRequests = data.reduce((sum: number, row: any) => sum + parseInt(row.total_requests), 0);
      const cachedRequests = data.reduce((sum: number, row: any) => sum + parseInt(row.cached_requests), 0);
      const totalTokens = data.reduce((sum: number, row: any) => sum + parseInt(row.total_tokens), 0);
      const totalCostCents = data.reduce((sum: number, row: any) => sum + parseInt(row.total_cost_cents), 0);

      const cacheHitRate = totalRequests > 0 ? Math.round((cachedRequests / totalRequests) * 100) : 0;

      // Weighted average response time
      const avgResponseTime = data.reduce((sum: number, row: any) => {
        const requests = parseInt(row.total_requests);
        const avgTime = parseFloat(row.avg_response_time_ms) || 0;
        return sum + avgTime * requests;
      }, 0) / (totalRequests || 1);

      // Weighted average success rate
      const successRate = data.reduce((sum: number, row: any) => {
        const requests = parseInt(row.total_requests);
        const rate = parseFloat(row.success_rate) || 0;
        return sum + rate * requests;
      }, 0) / (totalRequests || 1);

      // By feature breakdown
      const byFeature: Record<string, any> = {};
      data.forEach((row: any) => {
        byFeature[row.feature_type] = {
          requests: parseInt(row.total_requests),
          tokens: parseInt(row.total_tokens),
          costCents: parseInt(row.total_cost_cents),
        };
      });

      return {
        totalRequests,
        cachedRequests,
        cacheHitRate,
        totalTokens,
        totalCostCents,
        averageResponseTime: Math.round(avgResponseTime),
        successRate: Math.round(successRate),
        byFeature,
      };
    } catch (error) {
      console.error('[UsageTracker] Error getting summary:', error);
      throw error;
    }
  }

  /**
   * Get recent usage logs for a company
   */
  async getRecentLogs(
    companyId: string,
    limit: number = 50
  ): Promise<AIUsageLog[]> {
    try {
      const { data, error } = await this.supabase
        .from('ai_usage')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[UsageTracker] Error getting recent logs:', error);
        return [];
      }

      return (data || []).map((row) => ({
        id: row.id,
        companyId: row.company_id,
        userId: row.user_id,
        featureType: row.feature_type,
        modelUsed: row.model_used,
        tokensIn: row.tokens_in,
        tokensOut: row.tokens_out,
        costCents: row.cost_cents,
        cached: row.cached,
        responseTime: row.response_time_ms,
        success: row.success,
        errorMessage: row.error_message,
        createdAt: row.created_at,
      }));
    } catch (error) {
      console.error('[UsageTracker] Error getting recent logs:', error);
      return [];
    }
  }

  /**
   * Get daily usage count (for quota checking)
   */
  async getDailyCount(companyId: string): Promise<number> {
    try {
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);

      const { count, error } = await this.supabase
        .from('ai_usage')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('created_at', startOfDay.toISOString());

      if (error) {
        console.error('[UsageTracker] Error getting daily count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('[UsageTracker] Error getting daily count:', error);
      return 0;
    }
  }

  /**
   * Check if company is approaching quota limits
   */
  async checkQuotaStatus(
    companyId: string,
    dailyLimit: number = 1400
  ): Promise<{
    current: number;
    limit: number;
    remaining: number;
    percentUsed: number;
    warningLevel: 'safe' | 'warning' | 'critical' | 'exceeded';
  }> {
    const current = await this.getDailyCount(companyId);
    const remaining = Math.max(0, dailyLimit - current);
    const percentUsed = (current / dailyLimit) * 100;

    let warningLevel: 'safe' | 'warning' | 'critical' | 'exceeded';
    if (percentUsed >= 100) {
      warningLevel = 'exceeded';
    } else if (percentUsed >= 90) {
      warningLevel = 'critical';
    } else if (percentUsed >= 70) {
      warningLevel = 'warning';
    } else {
      warningLevel = 'safe';
    }

    return {
      current,
      limit: dailyLimit,
      remaining,
      percentUsed,
      warningLevel,
    };
  }
}

/**
 * Singleton instance
 */
let usageTrackerInstance: UsageTracker | null = null;

export function getUsageTracker(): UsageTracker {
  if (!usageTrackerInstance) {
    usageTrackerInstance = new UsageTracker();
  }

  return usageTrackerInstance;
}

/**
 * Reset singleton (for testing)
 */
export function resetUsageTracker() {
  usageTrackerInstance = null;
}
