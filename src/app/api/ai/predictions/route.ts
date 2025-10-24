/**
 * AI Predictions API Route
 *
 * Generates predictive analytics including:
 * - Pest pressure predictions
 * - Lead volume forecasting
 * - Churn risk assessment
 * - Lead quality scoring
 * - Seasonal demand patterns
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGeminiClient, getCacheManager, getUsageTracker } from '@/lib/ai';
import {
  buildPestPressurePredictionPrompt,
  buildLeadQualityScoringPrompt,
  PEST_CONTROL_EXPERT_SYSTEM_INSTRUCTION,
} from '@/lib/ai/prompt-templates';
import { prepareBusinessMetrics } from '@/lib/ai/data-preparers';
import { PredictionsRequest, PredictionsResponse, AIError } from '@/lib/ai/types';
import { createAdminClient } from '@/lib/supabase/server-admin';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: PredictionsRequest = await request.json();

    // Validate request
    if (!body.companyId || !body.predictionType) {
      return NextResponse.json(
        { error: 'companyId and predictionType are required' },
        { status: 400 }
      );
    }

    const { companyId, predictionType, dateRange, parameters } = body;

    console.log('[AI Predictions] Processing request', {
      companyId,
      predictionType,
      dateRange,
    });

    // Initialize AI services
    const gemini = getGeminiClient();
    const cache = getCacheManager();
    const usageTracker = getUsageTracker();

    // Build cache key
    const cacheKey = {
      companyId,
      predictionType,
      dateRange,
      parameters,
    };

    // Check cache (predictions valid for 12 hours)
    const cachedResponse = await cache.get(companyId, 'predictions', cacheKey);
    if (cachedResponse) {
      await usageTracker.logUsage(
        companyId,
        'predictions',
        'gemini-1.5-flash',
        { tokensIn: 0, tokensOut: 0, totalTokens: 0, costCents: 0 },
        true,
        Date.now() - startTime,
        true
      );

      return NextResponse.json({
        ...cachedResponse,
        cached: true,
      });
    }

    // Handle different prediction types
    let prompt: string;
    let predictions: any;

    switch (predictionType) {
      case 'pest_pressure': {
        // Get historical pest data
        const supabase = createAdminClient();
        const { data: historicalLeads } = await supabase
          .from('leads')
          .select('pest_type, created_at')
          .eq('company_id', companyId)
          .gte('created_at', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false });

        // Aggregate by month and pest type
        const historicalData: Record<string, any> = {};
        historicalLeads?.forEach((lead) => {
          const month = new Date(lead.created_at).toLocaleString('default', {
            month: 'long',
            year: 'numeric',
          });
          const pestType = lead.pest_type || 'unknown';

          if (!historicalData[month]) {
            historicalData[month] = {};
          }
          historicalData[month][pestType] = (historicalData[month][pestType] || 0) + 1;
        });

        // Get service areas
        const { data: serviceAreas } = await supabase
          .from('service_areas')
          .select('name, type')
          .eq('company_id', companyId)
          .eq('is_active', true);

        prompt = buildPestPressurePredictionPrompt({
          companyName: companyId,
          historicalData,
          currentMonth: new Date().toLocaleString('default', { month: 'long' }),
          serviceAreas: serviceAreas?.map((sa) => sa.name) || [],
        });

        break;
      }

      case 'lead_quality': {
        // Get a specific lead to score (from parameters)
        if (!parameters?.leadId) {
          return NextResponse.json(
            { error: 'leadId required in parameters for lead_quality prediction' },
            { status: 400 }
          );
        }

        const supabase = createAdminClient();
        const { data: lead } = await supabase
          .from('leads')
          .select('*')
          .eq('id', parameters.leadId)
          .single();

        if (!lead) {
          return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
        }

        // Get historical conversion data (won leads)
        const { data: wonLeads } = await supabase
          .from('leads')
          .select('*')
          .eq('company_id', companyId)
          .eq('lead_status', 'won')
          .limit(100);

        prompt = buildLeadQualityScoringPrompt({
          lead,
          historicalConversionData: wonLeads,
          companyAverages: {
            averageTimeToClose: 7,
            averageLeadValue: 500,
            conversionRate: 0.25,
          },
        });

        break;
      }

      default:
        return NextResponse.json(
          { error: `Prediction type '${predictionType}' not yet implemented` },
          { status: 400 }
        );
    }

    console.log('[AI Predictions] Generated prompt', {
      promptLength: prompt.length,
      estimatedTokens: Math.ceil(prompt.length / 4),
    });

    // Generate prediction with JSON mode
    const response = await gemini.generate<any>(prompt, {
      temperature: 0.3,
      maxOutputTokens: 3072,
      systemInstruction: PEST_CONTROL_EXPERT_SYSTEM_INSTRUCTION,
      jsonMode: true,
    });

    if (!response.success || !response.data) {
      throw new Error('Failed to generate AI prediction');
    }

    // Build response
    const predictionsResponse: PredictionsResponse = {
      predictionType,
      predictions: Array.isArray(response.data) ? response.data : [response.data],
      generatedAt: new Date().toISOString(),
      dataQuality: {
        score: 85,
        notes: ['Based on historical data', 'Confidence varies by pest type'],
      },
    };

    // Cache the response (12 hours)
    await cache.set(
      companyId,
      'predictions',
      cacheKey,
      predictionsResponse,
      response.modelUsed,
      response.usage?.totalTokens || 0,
      43200
    );

    // Log usage
    await usageTracker.logUsage(
      companyId,
      'predictions',
      response.modelUsed,
      response.usage || { tokensIn: 0, tokensOut: 0, totalTokens: 0, costCents: 0 },
      false,
      Date.now() - startTime,
      true
    );

    console.log('[AI Predictions] Request completed', {
      companyId,
      predictionType,
      responseTime: Date.now() - startTime,
    });

    return NextResponse.json({
      ...predictionsResponse,
      cached: false,
      usage: response.usage,
    });
  } catch (error: any) {
    console.error('[AI Predictions] Error:', error);

    try {
      const body = await request.clone().json();
      const usageTracker = getUsageTracker();
      await usageTracker.logUsage(
        body.companyId || 'unknown',
        'predictions',
        'gemini-1.5-flash',
        { tokensIn: 0, tokensOut: 0, totalTokens: 0, costCents: 0 },
        false,
        Date.now() - startTime,
        false,
        undefined,
        error?.message || 'Unknown error'
      );
    } catch (logError) {
      console.error('[AI Predictions] Error logging failed usage:', logError);
    }

    if (error instanceof AIError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { error: 'An error occurred while generating predictions' },
      { status: 500 }
    );
  }
}
