/**
 * Pest Pressure Data Aggregation API
 *
 * Manually trigger aggregation of pest data from leads/calls/forms
 * into pest_pressure_data_points table.
 *
 * This is useful for testing or one-off aggregations.
 * In production, this runs automatically via Inngest daily.
 */

import { NextRequest, NextResponse } from 'next/server';
import { aggregatePestPressureData } from '@/lib/ai/pest-pressure/data-aggregator';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();

    if (!body.companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const { companyId, dateRange } = body;

    // Default to last 90 days if no date range provided
    const endDate = dateRange?.end || new Date().toISOString();
    const startDate =
      dateRange?.start ||
      (() => {
        const d = new Date();
        d.setDate(d.getDate() - 90);
        return d.toISOString();
      })();

    console.log('[Pest Pressure Aggregation] Starting manual aggregation', {
      companyId,
      startDate,
      endDate,
    });

    // Run aggregation
    const result = await aggregatePestPressureData(companyId, startDate, endDate);

    const responseTime = Date.now() - startTime;

    console.log('[Pest Pressure Aggregation] Completed', {
      companyId,
      result,
      responseTime,
    });

    return NextResponse.json({
      success: true,
      result: {
        inserted: result.inserted,
        skipped: result.skipped,
        errors: result.errors,
      },
      date_range: {
        start: startDate,
        end: endDate,
      },
      response_time_ms: responseTime,
    });
  } catch (error: any) {
    console.error('[Pest Pressure Aggregation] Error:', error);

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
 * GET handler - Check aggregation statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    const { getAggregationStats } = await import('@/lib/ai/pest-pressure/data-aggregator');
    const stats = await getAggregationStats(companyId);

    return NextResponse.json({
      company_id: companyId,
      stats,
    });
  } catch (error: any) {
    console.error('[Pest Pressure Aggregation] GET Error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to fetch aggregation stats' },
      { status: 500 }
    );
  }
}
