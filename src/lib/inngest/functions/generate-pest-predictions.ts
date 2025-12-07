import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  loadActiveModel,
  predictSeasonalPressure,
} from '@/lib/ai/pest-pressure/ml-models';
import { buildCurrentFeatures } from '@/lib/ai/pest-pressure/features';
import { getGeminiClient } from '@/lib/ai/gemini-client';
import type { SeasonalForecastParams } from '@/lib/ai/pest-pressure/types';

/**
 * Inngest Scheduled Function: Generate Pest Predictions
 *
 * Runs daily at 5:00 AM EST to generate fresh pest pressure predictions
 * for all companies with trained models.
 */
export const generatePestPredictions = inngest.createFunction(
  {
    id: 'generate-pest-predictions',
    name: 'Generate Pest Predictions',
    retries: 3,
  },
  // Run daily at 5:00 AM EST (after weather sync and model training)
  { cron: 'TZ=America/New_York 0 5 * * *' },
  async ({ step }) => {
    const startTime = Date.now();

    console.log('[Inngest] Starting pest prediction generation...');

    // Step 1: Get companies with active models
    const companies = await step.run('get-companies-with-models', async () => {
      const supabase = createAdminClient();

      const { data, error } = await supabase
        .from('pest_pressure_ml_models')
        .select('company_id')
        .eq('model_type', 'seasonal_forecast')
        .eq('is_active', true);

      if (error) {
        console.error('[Inngest] Error fetching models:', error);
        throw new Error(`Failed to fetch models: ${error.message}`);
      }

      // Get unique company IDs
      const companyIds = [...new Set(data?.map((m) => m.company_id) || [])];

      console.log(`[Inngest] Found ${companyIds.length} companies with active models`);

      return companyIds;
    });

    if (companies.length === 0) {
      return {
        success: true,
        message: 'No companies with active models found',
        predictions_generated: 0,
        duration: Date.now() - startTime,
      };
    }

    // Step 2: Generate predictions for each company
    const predictionResults = await step.run('generate-predictions', async () => {
      const results = [];
      const gemini = getGeminiClient();

      for (const companyId of companies) {
        try {
          console.log(`[Inngest] Generating predictions for company ${companyId}`);

          // Load active model
          const seasonalModel = await loadActiveModel(companyId, 'seasonal_forecast', undefined);

          if (!seasonalModel) {
            console.warn(`[Inngest] No active seasonal model for company ${companyId}`);
            continue;
          }

          // Build current features
          const currentFeatures = await buildCurrentFeatures(companyId, null);

          if (!currentFeatures) {
            console.warn(`[Inngest] Insufficient data for predictions for company ${companyId}`);
            continue;
          }

          // Generate predictions for 7d, 30d, 90d
          const windows: Array<'7d' | '30d' | '90d'> = ['7d', '30d', '90d'];
          const predictions = [];

          for (const window of windows) {
            const daysAhead = window === '7d' ? 7 : window === '30d' ? 30 : 90;
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + daysAhead);
            const futureMonth = futureDate.getMonth() + 1;

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

            let trend: 'increasing' | 'stable' | 'decreasing';
            if (Math.abs(trend_percentage) < 5) {
              trend = 'stable';
            } else if (trend_percentage > 0) {
              trend = 'increasing';
            } else {
              trend = 'decreasing';
            }

            predictions.push({
              company_id: companyId,
              pest_type: 'all',
              prediction_window: window,
              current_pressure: Math.round(current_pressure * 10) / 10,
              predicted_pressure: Math.round(predicted_pressure * 10) / 10,
              confidence_score: 0.75,
              trend,
              trend_percentage: Math.round(trend_percentage * 10) / 10,
              model_version: seasonalModel.model_version,
              data_points_used: seasonalModel.training_data_count,
              generated_at: new Date().toISOString(),
              valid_until: new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000).toISOString(),
            });
          }

          // Generate AI insights for the company
          const insightsPrompt = `Analyze pest pressure trends and provide recommendations:

Current pressure: ${currentFeatures.target.toFixed(1)}/10
7-day forecast: ${predictions[0].predicted_pressure}
30-day forecast: ${predictions[1].predicted_pressure}
Weather: ${currentFeatures.weather.temp_avg_7d?.toFixed(0)}°F, ${currentFeatures.weather.precip_total_7d?.toFixed(2)}" precipitation

Return JSON:
{
  "contributing_factors": ["3-5 brief factors"],
  "recommendations": ["3-5 actionable recommendations"]
}`;

          const insightsResponse = await gemini.generate<{
            contributing_factors: string[];
            recommendations: string[];
          }>(insightsPrompt, {
            temperature: 0.7,
            maxOutputTokens: 1024,
            jsonMode: true,
            retries: 2,
          });

          const insights = insightsResponse.success && insightsResponse.data
            ? insightsResponse.data
            : {
                contributing_factors: ['Historical seasonal patterns', 'Current weather conditions'],
                recommendations: ['Monitor pest activity', 'Review service schedules'],
              };

          // Add insights to predictions
          const predictionsWithInsights = predictions.map((pred) => ({
            ...pred,
            contributing_factors: insights.contributing_factors,
            recommendations: insights.recommendations,
          }));

          // Store predictions in database
          const supabase = createAdminClient();
          const { error: insertError } = await supabase
            .from('pest_pressure_predictions')
            .insert(predictionsWithInsights);

          if (insertError) {
            console.error(`[Inngest] Error storing predictions for company ${companyId}:`, insertError);
            throw insertError;
          }

          console.log(`[Inngest] Generated ${predictions.length} predictions for company ${companyId}`);

          results.push({
            company_id: companyId,
            success: true,
            predictions_count: predictions.length,
          });

          // Small delay between companies to respect rate limits
          await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error: any) {
          console.error(`[Inngest] Error generating predictions for company ${companyId}:`, error);

          results.push({
            company_id: companyId,
            success: false,
            error: error.message,
          });
        }
      }

      return results;
    });

    const duration = Date.now() - startTime;

    const successCount = predictionResults.filter((r) => r.success).length;
    const totalPredictions = predictionResults.reduce((sum, r) => sum + ((r as any).predictions_count || 0), 0);

    console.log('[Inngest] Prediction generation completed', {
      companiesProcessed: companies.length,
      companiesSuccessful: successCount,
      totalPredictions,
      duration,
    });

    return {
      success: true,
      message: `Generated predictions for ${successCount}/${companies.length} companies`,
      summary: {
        companies_processed: companies.length,
        companies_successful: successCount,
        total_predictions: totalPredictions,
      },
      results: predictionResults,
      duration,
    };
  }
);
