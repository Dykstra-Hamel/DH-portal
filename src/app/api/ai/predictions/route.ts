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
  buildLeadQualityScoringPrompt,
  PEST_CONTROL_EXPERT_SYSTEM_INSTRUCTION,
} from '@/lib/ai/prompt-templates';
import { PredictionsRequest, PredictionsResponse, AIError } from '@/lib/ai/types';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { loadActiveModel, predictSeasonalPressure, detectAnomaly } from '@/lib/ai/pest-pressure/ml-models';
import { buildCurrentFeatures, buildFeatures } from '@/lib/ai/pest-pressure/features';
import type { SeasonalForecastParams, AnomalyDetectionParams } from '@/lib/ai/pest-pressure/types';

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
        const supabase = createAdminClient();

        // Get pest type from parameters (null = all pests combined)
        const pestType = parameters?.pestType || null;
        const location = parameters?.location; // { city, state, lat, lng }

        console.log('[AI Predictions] Generating pest pressure predictions', { pestType, location });

        // Load active ML models
        const seasonalModel = await loadActiveModel(companyId, 'seasonal_forecast', pestType);
        const anomalyModel = await loadActiveModel(companyId, 'anomaly_detection', pestType);

        if (!seasonalModel) {
          return NextResponse.json(
            { error: 'No trained model found. Please train a model first using /api/ai/pest-pressure/train' },
            { status: 404 }
          );
        }

        // Build current features for prediction
        const currentFeatures = await buildCurrentFeatures(companyId, pestType, location);

        if (!currentFeatures) {
          return NextResponse.json(
            { error: 'Insufficient data for predictions. Need at least 30 days of pest pressure data.' },
            { status: 400 }
          );
        }

        // Get historical pressure for anomaly detection
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 90);
        const startDateStr = startDate.toISOString().split('T')[0];

        const historicalFeatures = await buildFeatures(companyId, pestType, startDateStr, endDate, location);
        const historicalPressure = historicalFeatures.map((f) => f.target);

        // Generate predictions for multiple time windows
        const windows: Array<'7d' | '30d' | '90d'> = ['7d', '30d', '90d'];
        const forecastPredictions = [];

        for (const window of windows) {
          const daysAhead = window === '7d' ? 7 : window === '30d' ? 30 : 90;
          const futureDate = new Date();
          futureDate.setDate(futureDate.getDate() + daysAhead);
          const futureMonth = futureDate.getMonth() + 1;

          // Predict using seasonal model
          const predicted_pressure = predictSeasonalPressure(
            seasonalModel.model_parameters as SeasonalForecastParams,
            futureMonth,
            daysAhead,
            {
              temp_avg_f: currentFeatures.weather.temp_avg_7d,
              precip_inches: currentFeatures.weather.precip_total_7d,
              humidity_percent: currentFeatures.weather.humidity_avg_7d,
            }
          );

          const current_pressure = currentFeatures.target;
          const trend_percentage = ((predicted_pressure - current_pressure) / current_pressure) * 100;

          let trend: 'increasing' | 'stable' | 'decreasing' | 'spike';
          if (Math.abs(trend_percentage) < 5) {
            trend = 'stable';
          } else if (trend_percentage > 0) {
            trend = 'increasing';
          } else {
            trend = 'decreasing';
          }

          forecastPredictions.push({
            prediction_window: window,
            current_pressure: Math.round(current_pressure * 10) / 10,
            predicted_pressure: Math.round(predicted_pressure * 10) / 10,
            confidence_score: 0.75, // Base confidence
            trend,
            trend_percentage: Math.round(trend_percentage * 10) / 10,
            model_version: seasonalModel.model_version,
            data_points_used: seasonalModel.training_data_count,
          });
        }

        // Detect anomalies
        let anomalyResult = null;
        if (anomalyModel && historicalPressure.length >= 14) {
          const anomaly = detectAnomaly(
            historicalPressure,
            currentFeatures.target,
            anomalyModel.model_parameters as AnomalyDetectionParams
          );

          if (anomaly.isAnomaly) {
            anomalyResult = {
              anomaly_detected: true,
              anomaly_severity: anomaly.severity,
              anomaly_description: `Unusual ${pestType || 'pest'} activity detected. Current pressure (${currentFeatures.target.toFixed(1)}) is ${anomaly.zScore.toFixed(1)} standard deviations ${anomaly.zScore > 0 ? 'above' : 'below'} normal.`,
              z_score: anomaly.zScore,
            };
          }
        }

        // Use Gemini to generate natural language insights
        const insightsPrompt = `You are a pest control industry expert analyzing pest pressure data.

Current data:
- Pest type: ${pestType || 'All pests'}
- Current pressure: ${currentFeatures.target.toFixed(1)}/10
- Location: ${location?.city || 'Unknown'}, ${location?.state || 'Unknown'}
- Month: ${new Date().toLocaleString('default', { month: 'long' })}
- 7-day weather: Temp ${currentFeatures.weather.temp_avg_7d?.toFixed(0)}°F, Precip ${currentFeatures.weather.precip_total_7d?.toFixed(2)}" inches
- Predictions: ${forecastPredictions.map((p) => `${p.prediction_window}=${p.predicted_pressure}`).join(', ')}
${anomalyResult ? `- ANOMALY DETECTED: ${anomalyResult.anomaly_description}` : ''}

Generate a JSON response with:
{
  "contributing_factors": ["array", "of", "3-5", "factors", "driving", "pest", "pressure"],
  "recommendations": ["array", "of", "3-5", "actionable", "recommendations", "for", "pest", "control", "company"]
}

Focus on weather, seasonality, and pest biology. Keep factors and recommendations concise (1-2 sentences each).`;

        const geminiResponse = await gemini.generate<{
          contributing_factors: string[];
          recommendations: string[];
        }>(insightsPrompt, {
          temperature: 0.7,
          maxOutputTokens: 1024,
          jsonMode: true,
          retries: 2,
        });

        const insights = geminiResponse.success && geminiResponse.data
          ? geminiResponse.data
          : {
              contributing_factors: ['Historical seasonal patterns', 'Current weather conditions'],
              recommendations: ['Monitor pest activity closely', 'Review service schedules'],
            };

        // Build final predictions response
        predictions = forecastPredictions.map((pred) => ({
          ...pred,
          ...anomalyResult,
          pest_type: pestType || 'all',
          location_city: location?.city,
          location_state: location?.state,
          contributing_factors: insights.contributing_factors,
          recommendations: insights.recommendations,
          generated_at: new Date().toISOString(),
          valid_until: new Date(Date.now() + (pred.prediction_window === '7d' ? 7 : pred.prediction_window === '30d' ? 30 : 90) * 24 * 60 * 60 * 1000).toISOString(),
        }));

        // Store predictions in database
        for (const prediction of predictions) {
          await supabase
            .from('pest_pressure_predictions')
            .insert({
              company_id: companyId,
              ...prediction,
            });
        }

        // Return predictions directly (skip old prompt-based flow)
        const predictionsResponse: PredictionsResponse = {
          predictionType,
          predictions,
          generatedAt: new Date().toISOString(),
          dataQuality: {
            score: seasonalModel.accuracy_metrics?.r_squared ? Math.round(seasonalModel.accuracy_metrics.r_squared * 100) : 75,
            notes: [
              `Model trained on ${seasonalModel.training_data_count} data points`,
              `Model version: ${seasonalModel.model_version}`,
              ...(seasonalModel.accuracy_metrics?.mae ? [`Mean error: ±${seasonalModel.accuracy_metrics.mae.toFixed(1)}`] : []),
            ],
          },
        };

        // Cache the response (6 hours for pest pressure)
        await cache.set(
          companyId,
          'predictions',
          cacheKey,
          predictionsResponse,
          seasonalModel.model_version,
          geminiResponse.usage?.totalTokens || 0,
          21600 // 6 hours
        );

        // Log usage
        await usageTracker.logUsage(
          companyId,
          'predictions',
          geminiResponse.modelUsed || 'gemini-1.5-flash',
          geminiResponse.usage || { tokensIn: 0, tokensOut: 0, totalTokens: 0, costCents: 0 },
          false,
          Date.now() - startTime,
          true
        );

        return NextResponse.json({
          ...predictionsResponse,
          cached: false,
          usage: geminiResponse.usage,
        });
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
