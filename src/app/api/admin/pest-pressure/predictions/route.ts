/**
 * Admin Pest Pressure Predictions API
 *
 * Generates cross-company pest pressure predictions for geographic scopes.
 * Super admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';
import {
  buildAdminFeatures,
  loadAdminModel,
  type AdminGeographicScope,
} from '@/lib/ai/pest-pressure/admin-models';
import { predictSeasonalPressure, detectAnomaly } from '@/lib/ai/pest-pressure/ml-models';
import type { SeasonalForecastParams, AnomalyDetectionParams } from '@/lib/ai/pest-pressure/types';
import { getGeminiClient } from '@/lib/ai';

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Verify admin authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createAdminClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAdmin = await isAuthorizedAdmin(user);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const scopeParam = searchParams.get('scope'); // state, city, region, national
    const state = searchParams.get('state');
    const city = searchParams.get('city');
    const region = searchParams.get('region');
    const pestType = searchParams.get('pestType') || null;

    if (!scopeParam) {
      return NextResponse.json(
        { error: 'scope query parameter is required (state, city, region, or national)' },
        { status: 400 }
      );
    }

    const scope: AdminGeographicScope = {
      scope: scopeParam as any,
      state: state || undefined,
      city: city || undefined,
      region: region || undefined,
    };

    console.log('[Admin Pest Pressure Predictions] Generating predictions', {
      scope: scope.scope,
      state: scope.state,
      city: scope.city,
      pestType,
    });

    // Load active models
    const seasonalModel = await loadAdminModel(scope, 'seasonal_forecast', pestType);
    const anomalyModel = await loadAdminModel(scope, 'anomaly_detection', pestType);

    if (!seasonalModel) {
      return NextResponse.json(
        {
          error: 'No trained model found for this geographic scope. Please train a model first.',
        },
        { status: 404 }
      );
    }

    // Build current features
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
    const startDateStr = startDate.toISOString().split('T')[0];

    const historicalFeatures = await buildAdminFeatures(scope, pestType, startDateStr, endDate);

    if (historicalFeatures.length === 0) {
      return NextResponse.json(
        {
          error: 'Insufficient data for predictions. Need at least 14 days of pest pressure data.',
        },
        { status: 400 }
      );
    }

    const currentFeatures = historicalFeatures[historicalFeatures.length - 1];
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
        confidence_score: 0.75,
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

    // Use Gemini to generate insights
    const gemini = getGeminiClient();
    const insightsPrompt = `You are a pest control industry expert analyzing cross-company pest pressure data.

Current data:
- Geographic scope: ${scope.scope} (${scope.state || ''} ${scope.city || ''})
- Pest type: ${pestType || 'All pests'}
- Current pressure: ${currentFeatures.target.toFixed(1)}/10
- Contributing companies: ${seasonalModel.training_companies_count}
- Month: ${new Date().toLocaleString('default', { month: 'long' })}
- 7-day weather: Temp ${currentFeatures.weather.temp_avg_7d?.toFixed(0)}°F, Precip ${currentFeatures.weather.precip_total_7d?.toFixed(2)}" inches
- Predictions: ${forecastPredictions.map((p) => `${p.prediction_window}=${p.predicted_pressure}`).join(', ')}
${anomalyResult ? `- ANOMALY DETECTED: ${anomalyResult.anomaly_description}` : ''}

Generate a JSON response with:
{
  "contributing_factors": ["array", "of", "3-5", "factors", "driving", "pest", "pressure", "across", "this", "region"],
  "recommendations": ["array", "of", "3-5", "actionable", "recommendations", "for", "pest", "control", "companies", "in", "this", "area"]
}

Focus on regional weather patterns, seasonal trends, and pest biology. Keep factors and recommendations concise (1-2 sentences each).`;

    const geminiResponse = await gemini.generate<{
      contributing_factors: string[];
      recommendations: string[];
    }>(insightsPrompt, {
      temperature: 0.7,
      maxOutputTokens: 1024,
      jsonMode: true,
      retries: 2,
    });

    const insights =
      geminiResponse.success && geminiResponse.data
        ? geminiResponse.data
        : {
            contributing_factors: ['Historical seasonal patterns', 'Current weather conditions'],
            recommendations: ['Monitor pest activity closely', 'Review service schedules'],
          };

    // Build final predictions response
    const predictions = forecastPredictions.map((pred) => ({
      ...pred,
      ...anomalyResult,
      pest_type: pestType || 'all',
      geographic_scope: scope.scope,
      location_state: scope.state,
      location_city: scope.city,
      location_region: scope.region,
      contributing_factors: insights.contributing_factors,
      recommendations: insights.recommendations,
      contributing_companies_count: seasonalModel.training_companies_count,
      generated_at: new Date().toISOString(),
      valid_until: new Date(
        Date.now() +
          (pred.prediction_window === '7d' ? 7 : pred.prediction_window === '30d' ? 30 : 90) *
            24 *
            60 *
            60 *
            1000
      ).toISOString(),
    }));

    // Store predictions in database
    for (const prediction of predictions) {
      await supabase.from('admin_pest_pressure_predictions').insert({
        model_id: seasonalModel.id,
        ...prediction,
      });
    }

    const responseTime = Date.now() - startTime;

    console.log('[Admin Pest Pressure Predictions] Completed', {
      scope: scope.scope,
      pestType,
      predictionsCount: predictions.length,
      responseTime,
    });

    return NextResponse.json({
      success: true,
      predictions,
      model_info: {
        seasonal_model_version: seasonalModel.model_version,
        anomaly_model_version: anomalyModel?.model_version,
        training_companies_count: seasonalModel.training_companies_count,
        training_data_count: seasonalModel.training_data_count,
      },
      response_time_ms: responseTime,
    });
  } catch (error: any) {
    console.error('[Admin Pest Pressure Predictions] Error:', error);

    return NextResponse.json(
      {
        error: error.message || 'An error occurred while generating predictions',
        details: error.details || undefined,
      },
      { status: error.statusCode || 500 }
    );
  }
}
