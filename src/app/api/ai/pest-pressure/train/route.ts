/**
 * Pest Pressure Model Training API
 *
 * Trains new ML models for pest pressure prediction:
 * - Seasonal forecast model (time-series)
 * - Anomaly detection model (spike detection)
 *
 * Models are trained on historical pest_pressure_data_points
 * with weather correlation and saved to pest_pressure_ml_models table.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import {
  trainSeasonalForecastModel,
  trainAnomalyDetectionModel,
  saveAndActivateModel,
} from '@/lib/ai/pest-pressure/ml-models';
import { buildFeatures } from '@/lib/ai/pest-pressure/features';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();

    // Validate request
    if (!body.companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const {
      companyId,
      pestType = null, // null = all pests combined
      location, // { city, state, lat, lng }
      dateRange, // { start, end } - defaults to last year
    } = body;

    console.log('[Pest Pressure Training] Starting model training', {
      companyId,
      pestType,
      location,
    });

    const supabase = createAdminClient();

    // Determine date range for training data
    const endDate = dateRange?.end || new Date().toISOString().split('T')[0];
    const startDate =
      dateRange?.start ||
      (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        return d.toISOString().split('T')[0];
      })();

    console.log('[Pest Pressure Training] Fetching training data from', startDate, 'to', endDate);

    // Check if company has enough data
    let dataPointsQuery = supabase
      .from('pest_pressure_data_points')
      .select('id', { count: 'exact' })
      .eq('company_id', companyId)
      .gte('observed_at', startDate)
      .lte('observed_at', endDate);

    if (pestType) {
      dataPointsQuery = dataPointsQuery.eq('pest_type', pestType);
    }

    if (location?.city) {
      dataPointsQuery = dataPointsQuery.eq('city', location.city);
    }

    if (location?.state) {
      dataPointsQuery = dataPointsQuery.eq('state', location.state);
    }

    const { count, error: countError } = await dataPointsQuery;

    if (countError) {
      console.error('[Pest Pressure Training] Error counting data points:', countError);
      throw new Error('Failed to check training data availability');
    }

    if (!count || count < 20) {
      return NextResponse.json(
        {
          error: `Insufficient data for training. Found ${count || 0} data points, need at least 20.`,
          suggestion:
            'Run data aggregation first using the Inngest job or wait for more pest pressure data to accumulate.',
        },
        { status: 400 }
      );
    }

    console.log(`[Pest Pressure Training] Found ${count} data points for training`);

    // Build features for training
    const features = await buildFeatures(companyId, pestType, startDate, endDate, location);

    if (features.length < 14) {
      return NextResponse.json(
        {
          error: `Insufficient feature vectors. Built ${features.length} features, need at least 14.`,
          suggestion: 'Ensure data points have location coordinates for weather correlation.',
        },
        { status: 400 }
      );
    }

    console.log(
      `[Pest Pressure Training] Built ${features.length} feature vectors for training`
    );

    // Train seasonal forecast model
    console.log('[Pest Pressure Training] Training seasonal forecast model...');
    const seasonalModel = await trainSeasonalForecastModel(companyId, pestType, features, {
      start: startDate,
      end: endDate,
    });

    // Save and activate seasonal model
    const { id: seasonalModelId } = await saveAndActivateModel(seasonalModel);

    console.log(
      `[Pest Pressure Training] Seasonal forecast model saved: ${seasonalModelId}`
    );

    // Train anomaly detection model
    console.log('[Pest Pressure Training] Training anomaly detection model...');
    const anomalyModel = await trainAnomalyDetectionModel(companyId, pestType, features);

    // Save and activate anomaly model
    const { id: anomalyModelId } = await saveAndActivateModel(anomalyModel);

    console.log(`[Pest Pressure Training] Anomaly detection model saved: ${anomalyModelId}`);

    const responseTime = Date.now() - startTime;

    console.log('[Pest Pressure Training] Training completed', {
      companyId,
      pestType,
      featuresCount: features.length,
      responseTime,
    });

    return NextResponse.json({
      success: true,
      models: {
        seasonal_forecast: {
          id: seasonalModelId,
          version: seasonalModel.model_version,
          accuracy: seasonalModel.accuracy_metrics,
          training_data_count: seasonalModel.training_data_count,
        },
        anomaly_detection: {
          id: anomalyModelId,
          version: anomalyModel.model_version,
          training_data_count: anomalyModel.training_data_count,
        },
      },
      training_summary: {
        company_id: companyId,
        pest_type: pestType || 'all',
        location,
        date_range: { start: startDate, end: endDate },
        features_count: features.length,
        data_points_count: count,
      },
      response_time_ms: responseTime,
    });
  } catch (error: any) {
    console.error('[Pest Pressure Training] Error:', error);

    return NextResponse.json(
      {
        error: error.message || 'An error occurred during model training',
        details: error.details || undefined,
      },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * GET handler - Check training status and model availability
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');
    const pestType = searchParams.get('pestType');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Check available data
    let dataQuery = supabase
      .from('pest_pressure_data_points')
      .select('id', { count: 'exact' })
      .eq('company_id', companyId);

    if (pestType) {
      dataQuery = dataQuery.eq('pest_type', pestType);
    }

    const { count: dataPointsCount } = await dataQuery;

    // Check for existing models
    let modelsQuery = supabase
      .from('pest_pressure_ml_models')
      .select('*')
      .eq('company_id', companyId)
      .eq('is_active', true)
      .order('trained_at', { ascending: false });

    if (pestType) {
      modelsQuery = modelsQuery.eq('pest_type', pestType);
    }

    const { data: models, error: modelsError } = await modelsQuery;

    if (modelsError) {
      console.error('[Pest Pressure Training] Error fetching models:', modelsError);
    }

    const seasonalModel = models?.find((m) => m.model_type === 'seasonal_forecast');
    const anomalyModel = models?.find((m) => m.model_type === 'anomaly_detection');

    return NextResponse.json({
      company_id: companyId,
      pest_type: pestType || 'all',
      data_points_available: dataPointsCount || 0,
      ready_for_training: (dataPointsCount || 0) >= 30,
      models: {
        seasonal_forecast: seasonalModel
          ? {
              version: seasonalModel.model_version,
              trained_at: seasonalModel.trained_at,
              accuracy: seasonalModel.accuracy_metrics,
              training_data_count: seasonalModel.training_data_count,
            }
          : null,
        anomaly_detection: anomalyModel
          ? {
              version: anomalyModel.model_version,
              trained_at: anomalyModel.trained_at,
              training_data_count: anomalyModel.training_data_count,
            }
          : null,
      },
      recommendations: {
        should_train: !seasonalModel || !anomalyModel,
        should_retrain:
          seasonalModel &&
          new Date().getTime() - new Date(seasonalModel.trained_at || 0).getTime() >
            30 * 24 * 60 * 60 * 1000, // 30 days
        message:
          (dataPointsCount || 0) < 30
            ? 'Need at least 30 data points to train models'
            : !seasonalModel
              ? 'No models found. Train initial models to enable predictions.'
              : seasonalModel &&
                  new Date().getTime() - new Date(seasonalModel.trained_at || 0).getTime() >
                    30 * 24 * 60 * 60 * 1000
                ? 'Models are over 30 days old. Consider retraining for better accuracy.'
                : 'Models are up to date.',
      },
    });
  } catch (error: any) {
    console.error('[Pest Pressure Training] GET Error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to fetch training status' },
      { status: 500 }
    );
  }
}
