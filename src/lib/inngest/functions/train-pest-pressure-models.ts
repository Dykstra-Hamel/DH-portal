import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  trainSeasonalForecastModel,
  trainAnomalyDetectionModel,
  saveAndActivateModel,
} from '@/lib/ai/pest-pressure/ml-models';
import { buildFeatures } from '@/lib/ai/pest-pressure/features';

/**
 * Inngest Scheduled Function: Train Pest Pressure Models
 *
 * Runs weekly on Sundays at 4:00 AM EST to retrain ML models with latest data.
 * Ensures models stay accurate as new pest pressure data accumulates.
 */
export const trainPestPressureModels = inngest.createFunction(
  {
    id: 'train-pest-pressure-models',
    name: 'Train Pest Pressure Models',
    retries: 2,
  },
  // Run weekly on Sundays at 4:00 AM EST
  { cron: 'TZ=America/New_York 0 4 * * 0' },
  async ({ step }) => {
    const startTime = Date.now();

    console.log('[Inngest] Starting pest pressure model training...');

    // Step 1: Get companies with enough data for training
    const companies = await step.run('get-companies-for-training', async () => {
      const supabase = createAdminClient();

      // Get companies with at least 30 data points in last year
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const { data, error } = await supabase.rpc('get_companies_for_model_training', {
        min_data_points: 30,
        since_date: oneYearAgo.toISOString(),
      }).select('*');

      // If RPC doesn't exist, fall back to manual query
      if (error) {
        console.log('[Inngest] RPC not found, using manual query');

        const { data: allCompanies, error: companiesError } = await supabase
          .from('companies')
          .select('id, name')
          .eq('is_active', true);

        if (companiesError) {
          throw new Error(`Failed to fetch companies: ${companiesError.message}`);
        }

        const companiesWithData = [];

        for (const company of allCompanies || []) {
          const { count } = await supabase
            .from('pest_pressure_data_points')
            .select('id', { count: 'exact' })
            .eq('company_id', company.id)
            .gte('observed_at', oneYearAgo.toISOString());

          if (count && count >= 30) {
            companiesWithData.push(company);
          }
        }

        console.log(`[Inngest] Found ${companiesWithData.length} companies with sufficient data`);

        return companiesWithData;
      }

      console.log(`[Inngest] Found ${data?.length || 0} companies with sufficient data`);

      return data || [];
    });

    if (companies.length === 0) {
      return {
        success: true,
        message: 'No companies with sufficient data for training',
        models_trained: 0,
        duration: Date.now() - startTime,
      };
    }

    // Step 2: Train models for each company
    const trainingResults = await step.run('train-models', async () => {
      const results = [];

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
      const startDateStr = startDate.toISOString().split('T')[0];

      for (const company of companies) {
        try {
          console.log(`[Inngest] Training models for company ${company.id} (${company.name})`);

          // Build features
          const features = await buildFeatures(
            company.id,
            null, // Train on all pests combined initially
            startDateStr,
            endDate
          );

          if (features.length < 30) {
            console.warn(`[Inngest] Company ${company.id} has insufficient features: ${features.length}`);
            results.push({
              company_id: company.id,
              company_name: company.name,
              success: false,
              error: 'Insufficient feature vectors after processing',
            });
            continue;
          }

          // Train seasonal forecast model
          const seasonalModel = await trainSeasonalForecastModel(
            company.id,
            null,
            features
          );

          await saveAndActivateModel(seasonalModel);

          // Train anomaly detection model
          const anomalyModel = await trainAnomalyDetectionModel(
            company.id,
            null,
            features
          );

          await saveAndActivateModel(anomalyModel);

          console.log(`[Inngest] Successfully trained models for company ${company.id}`);

          results.push({
            company_id: company.id,
            company_name: company.name,
            success: true,
            features_count: features.length,
            seasonal_model_version: seasonalModel.model_version,
            anomaly_model_version: anomalyModel.model_version,
            accuracy: seasonalModel.accuracy_metrics,
          });
        } catch (error: any) {
          console.error(`[Inngest] Error training models for company ${company.id}:`, error);

          results.push({
            company_id: company.id,
            company_name: company.name,
            success: false,
            error: error.message,
          });
        }
      }

      return results;
    });

    const duration = Date.now() - startTime;

    const successCount = trainingResults.filter((r) => r.success).length;
    const failureCount = trainingResults.filter((r) => !r.success).length;

    console.log('[Inngest] Model training completed', {
      companiesProcessed: companies.length,
      successCount,
      failureCount,
      duration,
    });

    return {
      success: true,
      message: `Trained models for ${successCount}/${companies.length} companies`,
      summary: {
        companies_processed: companies.length,
        companies_successful: successCount,
        companies_failed: failureCount,
      },
      results: trainingResults,
      duration,
    };
  }
);
