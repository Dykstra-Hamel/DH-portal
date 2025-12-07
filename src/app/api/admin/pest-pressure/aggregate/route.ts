/**
 * Admin Pest Pressure Aggregation API
 *
 * Aggregates pest pressure data across all companies for a geographic scope.
 * Super admin only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { isAuthorizedAdmin } from '@/lib/auth-helpers';
import { buildAdminFeatures, type AdminGeographicScope } from '@/lib/ai/pest-pressure/admin-models';

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

    // Check super admin role
    const isAdmin = await isAuthorizedAdmin(user);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.geographicScope || !body.geographicScope.scope) {
      return NextResponse.json(
        { error: 'geographicScope.scope is required (state, city, region, or national)' },
        { status: 400 }
      );
    }

    const { geographicScope, pestType = null, dateRange } = body;

    // Validate geographic scope
    const scope: AdminGeographicScope = {
      scope: geographicScope.scope,
      state: geographicScope.state,
      city: geographicScope.city,
      region: geographicScope.region,
    };

    if (scope.scope === 'state' && !scope.state) {
      return NextResponse.json(
        { error: 'state is required for state scope' },
        { status: 400 }
      );
    }

    if (scope.scope === 'city' && (!scope.state || !scope.city)) {
      return NextResponse.json(
        { error: 'state and city are required for city scope' },
        { status: 400 }
      );
    }

    if (scope.scope === 'region' && !scope.region) {
      return NextResponse.json(
        { error: 'region is required for region scope' },
        { status: 400 }
      );
    }

    console.log('[Admin Pest Pressure Aggregation] Starting', {
      scope: scope.scope,
      state: scope.state,
      city: scope.city,
      region: scope.region,
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

    // Check if enough data exists
    let dataPointsQuery = supabase
      .from('pest_pressure_data_points')
      .select('id, company_id', { count: 'exact' })
      .gte('observed_at', startDate)
      .lte('observed_at', endDate)
      .not('state', 'is', null);

    // Apply geographic filtering
    if (scope.scope === 'state' && scope.state) {
      dataPointsQuery = dataPointsQuery.eq('state', scope.state);
    } else if (scope.scope === 'city' && scope.state && scope.city) {
      dataPointsQuery = dataPointsQuery.eq('state', scope.state).eq('city', scope.city);
    } else if (scope.scope === 'region' && scope.region) {
      const states = scope.region.split(',');
      dataPointsQuery = dataPointsQuery.in('state', states);
    }

    // Apply pest type filter
    if (pestType) {
      dataPointsQuery = dataPointsQuery.eq('pest_type', pestType);
    }

    const { count, data: dataPointsSample, error: countError } = await dataPointsQuery.limit(1000);

    if (countError) {
      console.error('[Admin Pest Pressure Aggregation] Error counting data points:', countError);
      throw new Error('Failed to check data availability');
    }

    if (!count || count < 20) {
      return NextResponse.json(
        {
          error: `Insufficient data for aggregation. Found ${count || 0} data points, need at least 20.`,
          suggestion:
            'Expand date range or geographic scope to include more data. Ensure companies have been aggregating pest pressure data.',
        },
        { status: 400 }
      );
    }

    // Get unique companies contributing to this data
    const contributingCompanies = Array.from(
      new Set(dataPointsSample?.map((d: any) => d.company_id) || [])
    );

    console.log(
      `[Admin Pest Pressure Aggregation] Found ${count} data points from ${contributingCompanies.length} companies`
    );

    // Build features
    const features = await buildAdminFeatures(scope, pestType, startDate, endDate);

    if (features.length < 14) {
      return NextResponse.json(
        {
          error: `Insufficient feature vectors. Built ${features.length} features, need at least 14.`,
          suggestion:
            'Data is too sparse. Try expanding date range or including more geographic areas.',
        },
        { status: 400 }
      );
    }

    const responseTime = Date.now() - startTime;

    console.log('[Admin Pest Pressure Aggregation] Completed', {
      featuresCount: features.length,
      dataPointsCount: count,
      companiesCount: contributingCompanies.length,
      responseTime,
    });

    return NextResponse.json({
      success: true,
      result: {
        geographic_scope: scope.scope,
        location_state: scope.state,
        location_city: scope.city,
        location_region: scope.region,
        pest_type: pestType || 'all',
        date_range: { start: startDate, end: endDate },
        features_count: features.length,
        data_points_count: count,
        contributing_companies_count: contributingCompanies.length,
      },
      response_time_ms: responseTime,
    });
  } catch (error: any) {
    console.error('[Admin Pest Pressure Aggregation] Error:', error);

    return NextResponse.json(
      {
        error: error.message || 'An error occurred during aggregation',
        details: error.details || undefined,
      },
      { status: error.statusCode || 500 }
    );
  }
}

/**
 * GET handler - Get aggregation statistics
 */
export async function GET(request: NextRequest) {
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

    // Get overall statistics from aggregated view
    const { data: stats, error: statsError } = await supabase
      .from('admin_pest_pressure_aggregated')
      .select('*')
      .limit(1000);

    if (statsError) {
      console.error('[Admin Pest Pressure Aggregation] Error fetching stats:', statsError);
      throw new Error('Failed to fetch aggregation statistics');
    }

    // Calculate summary statistics
    const uniqueStates = new Set(stats?.map((s: any) => s.state).filter(Boolean));
    const uniqueCities = new Set(stats?.map((s: any) => `${s.city},${s.state}`).filter(Boolean));
    const uniquePestTypes = new Set(stats?.map((s: any) => s.pest_type).filter(Boolean));
    const allCompanies = new Set(
      stats?.flatMap((s: any) => s.contributing_companies || [])
    );

    return NextResponse.json({
      total_observations: stats?.length || 0,
      unique_states: uniqueStates.size,
      unique_cities: uniqueCities.size,
      unique_pest_types: uniquePestTypes.size,
      contributing_companies: allCompanies.size,
      date_range: {
        first: stats?.[0]?.first_observation,
        last: stats?.[0]?.last_observation,
      },
    });
  } catch (error: any) {
    console.error('[Admin Pest Pressure Aggregation] GET Error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to fetch aggregation statistics' },
      { status: 500 }
    );
  }
}
