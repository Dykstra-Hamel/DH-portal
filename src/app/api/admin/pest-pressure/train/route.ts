/**
 * Admin Pest Pressure Model Training API
 *
 * Trains cross-company ML models for geographic scopes.
 * Super admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';
import {
  buildAdminFeatures,
  trainAdminSeasonalModel,
  trainAdminAnomalyModel,
  saveAdminModel,
  type AdminGeographicScope,
} from '@/lib/ai/pest-pressure/admin-models';

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    // Validate request
    if (!body.geographicScope || !body.geographicScope.scope) {
      return NextResponse.json(
        { error: 'geographicScope.scope is required' },
        { status: 400 }
      );
    }

    const { geographicScope, pestType = null, dateRange } = body;

    const scope: AdminGeographicScope = {
      scope: geographicScope.scope,
      state: geographicScope.state,
      city: geographicScope.city,
      region: geographicScope.region,
    };

    console.log('[Admin Pest Pressure Training] Starting model training', {
      scope: scope.scope,
      state: scope.state,
      city: scope.city,
      pestType,
    });

    // Determine date range
    const endDate = dateRange?.end || new Date().toISOString().split('T')[0];
    const startDate =
      dateRange?.start ||
      (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        return d.toISOString().split('T')[0];
      })();

    console.log('[Admin Pest Pressure Training] Fetching training data from', startDate, 'to', endDate);

    // Build features
    const features = await buildAdminFeatures(scope, pestType, startDate, endDate);

    if (features.length < 14) {
      return NextResponse.json(
        {
          error: `Insufficient feature vectors. Built ${features.length} features, need at least 14.`,
          suggestion: 'Expand date range or geographic scope to include more data.',
        },
        { status: 400 }
      );
    }

    console.log(
      `[Admin Pest Pressure Training] Built ${features.length} feature vectors for training`
    );

    // Get contributing companies
    let companiesQuery = supabase
      .from('pest_pressure_data_points')
      .select('company_id')
      .gte('observed_at', startDate)
      .lte('observed_at', endDate);

    if (scope.scope === 'state' && scope.state) {
      companiesQuery = companiesQuery.eq('state', scope.state);
    } else if (scope.scope === 'city' && scope.state && scope.city) {
      companiesQuery = companiesQuery.eq('state', scope.state).eq('city', scope.city);
    } else if (scope.scope === 'region' && scope.region) {
      const states = scope.region.split(',');
      companiesQuery = companiesQuery.in('state', states);
    }

    if (pestType) {
      companiesQuery = companiesQuery.eq('pest_type', pestType);
    }

    const { data: companyData } = await companiesQuery;
    const trainingCompanies = Array.from(
      new Set(companyData?.map((d: any) => d.company_id) || [])
    );

    // Train seasonal forecast model
    console.log('[Admin Pest Pressure Training] Training seasonal forecast model...');
    const seasonalModel = await trainAdminSeasonalModel(scope, pestType, features, {
      start: startDate,
      end: endDate,
    });

    const { id: seasonalModelId } = await saveAdminModel(seasonalModel, trainingCompanies);

    console.log(
      `[Admin Pest Pressure Training] Seasonal forecast model saved: ${seasonalModelId}`
    );

    // Train anomaly detection model
    console.log('[Admin Pest Pressure Training] Training anomaly detection model...');
    const anomalyModel = await trainAdminAnomalyModel(scope, pestType, features);

    const { id: anomalyModelId } = await saveAdminModel(anomalyModel, trainingCompanies);

    console.log(`[Admin Pest Pressure Training] Anomaly detection model saved: ${anomalyModelId}`);

    const responseTime = Date.now() - startTime;

    console.log('[Admin Pest Pressure Training] Training completed', {
      scope: scope.scope,
      pestType,
      featuresCount: features.length,
      companiesCount: trainingCompanies.length,
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
        geographic_scope: scope.scope,
        location_state: scope.state,
        location_city: scope.city,
        location_region: scope.region,
        pest_type: pestType || 'all',
        date_range: { start: startDate, end: endDate },
        features_count: features.length,
        contributing_companies_count: trainingCompanies.length,
      },
      response_time_ms: responseTime,
    });
  } catch (error: any) {
    console.error('[Admin Pest Pressure Training] Error:', error);

    return NextResponse.json(
      {
        error: error.message || 'An error occurred during model training',
        details: error.details || undefined,
      },
      { status: error.statusCode || 500 }
    );
  }
}
