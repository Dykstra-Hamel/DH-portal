import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { loadActiveModel, detectAnomaly } from '@/lib/ai/pest-pressure/ml-models';
import { buildFeatures } from '@/lib/ai/pest-pressure/features';
import type { AnomalyDetectionParams } from '@/lib/ai/pest-pressure/types';

/**
 * Inngest Scheduled Function: Detect Pest Anomalies
 *
 * Runs every hour to detect real-time pest pressure spikes.
 * Alerts companies to unusual activity that may require immediate action.
 */
export const detectPestAnomalies = inngest.createFunction(
  {
    id: 'detect-pest-anomalies',
    name: 'Detect Pest Anomalies',
    retries: 2,
  },
  // Run every hour at :15 past the hour (e.g., 1:15, 2:15, 3:15)
  { cron: '15 * * * *' },
  async ({ step }) => {
    const startTime = Date.now();

    console.log('[Inngest] Starting pest anomaly detection...');

    // Step 1: Get companies with active anomaly detection models
    const companies = await step.run('get-companies-with-models', async () => {
      const supabase = createAdminClient();

      const { data, error } = await supabase
        .from('pest_pressure_ml_models')
        .select('company_id')
        .eq('model_type', 'anomaly_detection')
        .eq('is_active', true);

      if (error) {
        console.error('[Inngest] Error fetching models:', error);
        throw new Error(`Failed to fetch models: ${error.message}`);
      }

      const companyIds = [...new Set(data?.map((m) => m.company_id) || [])];

      console.log(`[Inngest] Found ${companyIds.length} companies with anomaly detection models`);

      return companyIds;
    });

    if (companies.length === 0) {
      return {
        success: true,
        message: 'No companies with anomaly detection models',
        anomalies_detected: 0,
        duration: Date.now() - startTime,
      };
    }

    // Step 2: Check for anomalies in each company
    const anomalyResults = await step.run('detect-anomalies', async () => {
      const results = [];
      const supabase = createAdminClient();

      for (const companyId of companies) {
        try {
          console.log(`[Inngest] Checking anomalies for company ${companyId}`);

          // Load anomaly detection model
          const anomalyModel = await loadActiveModel(companyId, 'anomaly_detection', null);

          if (!anomalyModel) {
            console.warn(`[Inngest] No active anomaly model for company ${companyId}`);
            continue;
          }

          // Get historical pressure data (last 90 days)
          const endDate = new Date().toISOString().split('T')[0];
          const startDate = new Date();
          startDate.setDate(startDate.getDate() - 90);
          const startDateStr = startDate.toISOString().split('T')[0];

          const features = await buildFeatures(companyId, null, startDateStr, endDate);

          if (features.length < 14) {
            console.warn(`[Inngest] Insufficient historical data for company ${companyId}`);
            continue;
          }

          const historicalPressure = features.map((f) => f.target);
          const currentPressure = features[features.length - 1].target;

          // Detect anomaly
          const anomaly = detectAnomaly(
            historicalPressure,
            currentPressure,
            anomalyModel.model_parameters as AnomalyDetectionParams
          );

          if (anomaly.isAnomaly) {
            console.log(
              `[Inngest] ANOMALY DETECTED for company ${companyId}: ${anomaly.severity} (Z-score: ${anomaly.zScore.toFixed(2)})`
            );

            // Update or insert anomaly prediction
            const anomalyPrediction = {
              company_id: companyId,
              pest_type: 'all',
              prediction_window: '7d',
              current_pressure: Math.round(currentPressure * 10) / 10,
              predicted_pressure: Math.round(currentPressure * 10) / 10,
              confidence_score: 0.9,
              trend: 'spike' as const,
              trend_percentage: 0,
              anomaly_detected: true,
              anomaly_severity: anomaly.severity,
              anomaly_description: `Unusual pest activity detected. Current pressure (${currentPressure.toFixed(1)}) is ${anomaly.zScore.toFixed(1)} standard deviations ${anomaly.zScore > 0 ? 'above' : 'below'} normal.`,
              model_version: anomalyModel.model_version,
              data_points_used: anomalyModel.training_data_count,
              generated_at: new Date().toISOString(),
              valid_until: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              contributing_factors: [
                'Unusual spike in pest activity',
                `${anomaly.zScore.toFixed(1)} standard deviations from baseline`,
              ],
              recommendations: [
                'Review recent pest control activities',
                'Increase monitoring frequency',
                ...(anomaly.severity === 'critical' || anomaly.severity === 'high'
                  ? ['Consider immediate service response']
                  : []),
              ],
            };

            const { error: insertError } = await supabase
              .from('pest_pressure_predictions')
              .insert(anomalyPrediction);

            if (insertError) {
              console.error(
                `[Inngest] Error storing anomaly prediction for company ${companyId}:`,
                insertError
              );
            }

            results.push({
              company_id: companyId,
              anomaly_detected: true,
              severity: anomaly.severity,
              z_score: anomaly.zScore,
              current_pressure: currentPressure,
            });
          } else {
            results.push({
              company_id: companyId,
              anomaly_detected: false,
            });
          }
        } catch (error: any) {
          console.error(`[Inngest] Error checking anomalies for company ${companyId}:`, error);

          results.push({
            company_id: companyId,
            anomaly_detected: false,
            error: error.message,
          });
        }
      }

      return results;
    });

    const duration = Date.now() - startTime;

    const anomaliesDetected = anomalyResults.filter((r) => r.anomaly_detected).length;
    const criticalAnomalies = anomalyResults.filter(
      (r) => r.anomaly_detected && r.severity === 'critical'
    ).length;

    console.log('[Inngest] Anomaly detection completed', {
      companiesChecked: companies.length,
      anomaliesDetected,
      criticalAnomalies,
      duration,
    });

    return {
      success: true,
      message: `Detected ${anomaliesDetected} anomalies (${criticalAnomalies} critical) across ${companies.length} companies`,
      summary: {
        companies_checked: companies.length,
        anomalies_detected: anomaliesDetected,
        critical_anomalies: criticalAnomalies,
        high_anomalies: anomalyResults.filter((r) => r.anomaly_detected && r.severity === 'high').length,
        medium_anomalies: anomalyResults.filter((r) => r.anomaly_detected && r.severity === 'medium').length,
      },
      results: anomalyResults.filter((r) => r.anomaly_detected), // Only return anomalies
      duration,
    };
  }
);
