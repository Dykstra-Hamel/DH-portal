/**
 * AI Insights API Route
 *
 * Generates strategic business insights based on company data,
 * including opportunities, warnings, trends, and recommendations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, getCacheManager, getUsageTracker } from '@/lib/ai';
import {
  buildInsightsPrompt,
  PEST_CONTROL_EXPERT_SYSTEM_INSTRUCTION,
} from '@/lib/ai/prompt-templates';
import { prepareBusinessMetrics } from '@/lib/ai/data-preparers';
import { InsightsRequest, InsightsResponse, AIError, Insight } from '@/lib/ai/types';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: InsightsRequest = await request.json();

    // Validate request
    if (!body.companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const { companyId, dateRange, focusAreas, minConfidence = 70 } = body;

    console.log('[AI Insights] Processing request', {
      companyId,
      dateRange,
      focusAreas,
    });

    // Initialize AI services
    const gemini = getGeminiClient();
    const cache = getCacheManager();
    const usageTracker = getUsageTracker();

    // Determine date range (default to last 30 days)
    const endDate = dateRange?.end || new Date().toISOString();
    const startDate =
      dateRange?.start ||
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // Build cache key
    const cacheKey = {
      companyId,
      startDate,
      endDate,
      focusAreas,
      minConfidence,
    };

    // Check cache (insights are valid for longer - 6 hours)
    const cachedResponse = await cache.get(companyId, 'insights', cacheKey);
    if (cachedResponse) {
      // Log cached usage
      await usageTracker.logUsage(
        companyId,
        'insights',
        'gemini-1.5-flash',
        { tokensIn: 0, tokensOut: 0, totalTokens: 0, costCents: 0 },
        true, // cached
        Date.now() - startTime,
        true
      );

      return NextResponse.json({
        ...cachedResponse,
        cached: true,
      });
    }

    // Fetch business metrics
    const businessMetrics = await prepareBusinessMetrics(
      companyId,
      startDate,
      endDate
    );

    console.log('[AI Insights] Business metrics prepared', {
      companyName: businessMetrics.companyName,
      totalLeads: businessMetrics.leads.totalLeads,
      totalCalls: businessMetrics.calls.totalCalls,
    });

    // Build prompt
    const prompt = buildInsightsPrompt({
      companyName: businessMetrics.companyName,
      businessMetrics,
      dateRange: {
        start: startDate,
        end: endDate,
      },
    });

    console.log('[AI Insights] Generated prompt', {
      promptLength: prompt.length,
      estimatedTokens: Math.ceil(prompt.length / 4),
    });

    // Generate insights with JSON mode
    const response = await gemini.generate<{
      insights: Array<{
        type: string;
        priority: string;
        title: string;
        description: string;
        actionableSteps?: string[];
        estimatedImpact?: {
          metric: string;
          expectedChange: string;
          timeframe: string;
        };
        confidence: number;
      }>;
      summary: string;
    }>(prompt, {
      temperature: 0.5,
      maxOutputTokens: 4096,
      systemInstruction: PEST_CONTROL_EXPERT_SYSTEM_INSTRUCTION,
      jsonMode: true,
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to generate AI insights');
    }

    // Parse and structure insights
    const insights: Insight[] = response.data.insights
      .filter((insight) => insight.confidence >= minConfidence)
      .map((insight) => ({
        id: randomUUID(),
        type: insight.type as any,
        priority: insight.priority as any,
        title: insight.title,
        description: insight.description,
        actionableSteps: insight.actionableSteps,
        estimatedImpact: insight.estimatedImpact,
        confidence: insight.confidence,
        generatedAt: new Date().toISOString(),
      }));

    // Count high priority insights
    const highPriorityCount = insights.filter(
      (i) => i.priority === 'high' || i.priority === 'critical'
    ).length;

    // Build response
    const insightsResponse: InsightsResponse = {
      insights,
      summary: response.data.summary,
      totalInsights: insights.length,
      highPriorityCount,
    };

    // Cache the response (6 hours)
    await cache.set(
      companyId,
      'insights',
      cacheKey,
      insightsResponse,
      response.modelUsed,
      response.usage?.totalTokens || 0,
      21600 // 6 hours
    );

    // Log usage
    await usageTracker.logUsage(
      companyId,
      'insights',
      response.modelUsed,
      response.usage || { tokensIn: 0, tokensOut: 0, totalTokens: 0, costCents: 0 },
      false,
      Date.now() - startTime,
      true
    );

    console.log('[AI Insights] Request completed', {
      companyId,
      insightsGenerated: insights.length,
      highPriorityCount,
      responseTime: Date.now() - startTime,
    });

    return NextResponse.json({
      ...insightsResponse,
      cached: false,
      usage: response.usage,
    });
  } catch (error: any) {
    console.error('[AI Insights] Error:', error);

    // Log failed usage
    try {
      const body = await request.clone().json();
      const usageTracker = getUsageTracker();
      await usageTracker.logUsage(
        body.companyId || 'unknown',
        'insights',
        'gemini-1.5-flash',
        { tokensIn: 0, tokensOut: 0, totalTokens: 0, costCents: 0 },
        false,
        Date.now() - startTime,
        false,
        undefined,
        error?.message || 'Unknown error'
      );
    } catch (logError) {
      console.error('[AI Insights] Error logging failed usage:', logError);
    }

    if (error instanceof AIError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while generating insights' },
      { status: 500 }
    );
  }
}
