/**
 * AI Chat API Route
 *
 * Provides an interactive chatbot for querying business data
 * with natural language. Supports conversation history and
 * context-aware responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, getCacheManager, getUsageTracker } from '@/lib/ai';
import {
  buildChatPrompt,
  PEST_CONTROL_EXPERT_SYSTEM_INSTRUCTION,
} from '@/lib/ai/prompt-templates';
import {
  prepareBusinessMetrics,
  fetchRecentLeads,
  fetchRecentCalls,
} from '@/lib/ai/data-preparers';
import { ChatRequest, ChatResponse, AIError } from '@/lib/ai/types';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: ChatRequest = await request.json();

    // Validate request
    if (!body.companyId || !body.message) {
      return NextResponse.json(
        { error: 'companyId and message are required' },
        { status: 400 }
      );
    }

    const {
      companyId,
      message,
      conversationHistory = [],
      includeMetrics = true,
      maxTokens = 2048,
    } = body;

    console.log('[AI Chat] Processing request', {
      companyId,
      messageLength: message.length,
      historyLength: conversationHistory.length,
    });

    // Initialize AI services
    const gemini = getGeminiClient();
    const cache = getCacheManager();
    const usageTracker = getUsageTracker();

    // Build cache key from message + history
    const cacheKey = {
      message,
      history: conversationHistory.slice(-5), // Last 5 messages only for cache
      includeMetrics,
    };

    // Check cache
    const cachedResponse = await cache.get(companyId, 'chat', cacheKey);
    if (cachedResponse) {
      // Log cached usage
      await usageTracker.logUsage(
        companyId,
        'chat',
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

    // Prepare context data
    let businessMetrics = undefined;
    let recentLeads = undefined;
    let recentCalls = undefined;

    if (includeMetrics) {
      // Get last 30 days of data
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

      [businessMetrics, recentLeads, recentCalls] = await Promise.all([
        prepareBusinessMetrics(companyId, startDate, endDate),
        fetchRecentLeads(companyId, 5),
        fetchRecentCalls(companyId, 5),
      ]);
    }

    // Build prompt
    const prompt = buildChatPrompt({
      userQuery: message,
      companyName: businessMetrics?.companyName || 'Your Company',
      businessMetrics,
      recentLeads,
      recentCalls,
    });

    console.log('[AI Chat] Generated prompt', {
      promptLength: prompt.length,
      estimatedTokens: Math.ceil(prompt.length / 4),
    });

    // If there's conversation history, use chat mode
    let response;
    if (conversationHistory.length > 0) {
      // Convert conversation history to Gemini format
      const messages = [
        ...conversationHistory.map((msg) => ({
          role: msg.role === 'user' ? ('user' as const) : ('model' as const),
          parts: msg.content,
        })),
        {
          role: 'user' as const,
          parts: prompt,
        },
      ];

      response = await gemini.chat<string>(messages, {
        temperature: 0.7,
        maxOutputTokens: maxTokens,
        systemInstruction: PEST_CONTROL_EXPERT_SYSTEM_INSTRUCTION,
      });
    } else {
      // Single-turn conversation
      response = await gemini.generate<string>(prompt, {
        temperature: 0.7,
        maxOutputTokens: maxTokens,
        systemInstruction: PEST_CONTROL_EXPERT_SYSTEM_INSTRUCTION,
      });
    }

    if (!response.success || !response.data) {
      throw new Error('Failed to generate AI response');
    }

    // Build response
    const chatResponse: ChatResponse = {
      message: response.data,
      sources: [],
      suggestedFollowUps: [],
      dataUsed: includeMetrics
        ? ['business metrics', 'recent leads', 'recent calls']
        : [],
      confidence: 85, // Default confidence
    };

    // Cache the response
    await cache.set(
      companyId,
      'chat',
      cacheKey,
      chatResponse,
      response.modelUsed,
      response.usage?.totalTokens || 0,
      3600 // 1 hour TTL for chat
    );

    // Log usage
    await usageTracker.logUsage(
      companyId,
      'chat',
      response.modelUsed,
      response.usage || { tokensIn: 0, tokensOut: 0, totalTokens: 0, costCents: 0 },
      false, // not cached
      Date.now() - startTime,
      true
    );

    console.log('[AI Chat] Request completed', {
      companyId,
      responseTime: Date.now() - startTime,
      tokensUsed: response.usage?.totalTokens,
    });

    return NextResponse.json({
      ...chatResponse,
      cached: false,
      usage: response.usage,
    });
  } catch (error: any) {
    console.error('[AI Chat] Error:', error);

    // Log failed usage
    try {
      const body = await request.clone().json();
      const usageTracker = getUsageTracker();
      await usageTracker.logUsage(
        body.companyId || 'unknown',
        'chat',
        'gemini-1.5-flash',
        { tokensIn: 0, tokensOut: 0, totalTokens: 0, costCents: 0 },
        false,
        Date.now() - startTime,
        false,
        undefined,
        error?.message || 'Unknown error'
      );
    } catch (logError) {
      console.error('[AI Chat] Error logging failed usage:', logError);
    }

    if (error instanceof AIError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
