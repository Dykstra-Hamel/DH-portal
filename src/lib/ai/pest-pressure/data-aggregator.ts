/**
 * Pest Pressure Data Aggregator
 *
 * Implements waterfall deduplication logic to aggregate pest observations
 * from multiple sources (calls, forms, leads) without double-counting.
 *
 * Source Hierarchy (highest priority first):
 * 1. Call transcripts (richest data via AI analysis)
 * 2. Form submissions (structured data)
 * 3. Lead pest_type field (fallback for orphaned leads)
 */

import { createAdminClient } from '@/lib/supabase/server-admin';
import { analyzeTranscriptForPests } from './transcript-analyzer';
import type {
  PestPressureDataPoint,
  SourceLookupResult,
  SourceType,
  InfestationSeverity,
} from './types';

/**
 * Main aggregation function - processes call records and form submissions directly
 * Analyzes ALL inbound calls and forms, not just those that converted to leads
 * This captures more pest pressure signals for better ML training
 */
export async function aggregatePestPressureData(
  companyId: string,
  startDate: string,
  endDate: string
): Promise<{ inserted: number; skipped: number; errors: number }> {
  const supabase = createAdminClient();

  console.log(
    `[Pest Pressure Aggregator] Starting direct aggregation for company ${companyId} from ${startDate} to ${endDate}`
  );

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  // PHASE 1: Process all inbound call records with transcripts
  console.log('[Pest Pressure Aggregator] Phase 1: Analyzing inbound call records');

  const { data: callRecords, error: callsError } = await supabase
    .from('call_records')
    .select(`
      id,
      transcript,
      customer_id,
      created_at,
      customers (
        city,
        state,
        zip_code
      )
    `)
    .eq('company_id', companyId)
    .eq('call_direction', 'inbound')
    .not('transcript', 'is', null)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (callsError) {
    console.error('[Pest Pressure Aggregator] Error fetching call records:', callsError);
  } else if (callRecords && callRecords.length > 0) {
    console.log(`[Pest Pressure Aggregator] Processing ${callRecords.length} inbound calls`);

    for (const call of callRecords) {
      try {
        // Analyze transcript for pest mentions
        const analysis = await analyzeTranscriptForPests(call.transcript!);

        // Extract customer data (Supabase returns single object for many-to-one relations)
        const customer = Array.isArray(call.customers) ? call.customers[0] : call.customers;

        // Create a data point for each pest type found
        for (const pest of analysis.pest_types) {
          const dataPoint: PestPressureDataPoint = {
            company_id: companyId,
            source_type: 'call',
            source_id: call.id,
            pest_type: pest.pest_type,
            pest_mentions_count: pest.mentions_count,
            city: customer?.city,
            state: customer?.state,
            zip_code: customer?.zip_code,
            urgency_level: analysis.urgency_level,
            infestation_severity: analysis.infestation_severity,
            ai_extracted_context: analysis.extracted_context,
            confidence_score: pest.confidence,
            observed_at: call.created_at,
          };

          const { error: insertError } = await supabase
            .from('pest_pressure_data_points')
            .insert(dataPoint);

          if (insertError) {
            // Check if it's a duplicate (UNIQUE constraint violation)
            if (insertError.code === '23505') {
              skipped++;
            } else {
              console.error(
                '[Pest Pressure Aggregator] Error inserting call data point:',
                insertError
              );
              errors++;
            }
          } else {
            inserted++;
          }
        }
      } catch (error) {
        console.error(`[Pest Pressure Aggregator] Error processing call ${call.id}:`, error);
        errors++;
      }
    }
  }

  // PHASE 2: Process all successfully processed form submissions
  console.log('[Pest Pressure Aggregator] Phase 2: Analyzing form submissions');

  const { data: formSubmissions, error: formsError } = await supabase
    .from('form_submissions')
    .select('id, normalized_data, created_at')
    .eq('company_id', companyId)
    .eq('processing_status', 'processed')
    .not('normalized_data', 'is', null)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  if (formsError) {
    console.error('[Pest Pressure Aggregator] Error fetching form submissions:', formsError);
  } else if (formSubmissions && formSubmissions.length > 0) {
    console.log(`[Pest Pressure Aggregator] Processing ${formSubmissions.length} form submissions`);

    for (const form of formSubmissions) {
      try {
        // Extract pest types from normalized form data
        const pestTypes = extractPestTypesFromNormalizedData(form.normalized_data);

        if (pestTypes.length === 0) {
          skipped++;
          continue;
        }

        // Get location from normalized_data
        const location = {
          city: form.normalized_data?.city,
          state: form.normalized_data?.state,
          zip_code: form.normalized_data?.zip,
        };

        // Create a data point for each pest type
        for (const pestType of pestTypes) {
          const dataPoint: PestPressureDataPoint = {
            company_id: companyId,
            source_type: 'form',
            source_id: form.id,
            pest_type: pestType,
            pest_mentions_count: 1,
            city: location.city,
            state: location.state,
            zip_code: location.zip_code,
            observed_at: form.created_at,
          };

          const { error: insertError } = await supabase
            .from('pest_pressure_data_points')
            .insert(dataPoint);

          if (insertError) {
            // Check if it's a duplicate (UNIQUE constraint violation)
            if (insertError.code === '23505') {
              skipped++;
            } else {
              console.error(
                '[Pest Pressure Aggregator] Error inserting form data point:',
                insertError
              );
              errors++;
            }
          } else {
            inserted++;
          }
        }
      } catch (error) {
        console.error(`[Pest Pressure Aggregator] Error processing form ${form.id}:`, error);
        errors++;
      }
    }
  }

  console.log(
    `[Pest Pressure Aggregator] Completed: ${inserted} inserted, ${skipped} skipped, ${errors} errors`
  );

  return { inserted, skipped, errors };
}

/**
 * Extract pest types from Gemini-normalized form data
 * Parses the pest_issue field which contains AI-extracted pest mentions
 */
function extractPestTypesFromNormalizedData(normalizedData: Record<string, unknown>): string[] {
  const pestTypes: string[] = [];

  // Primary field: pest_issue (contains Gemini-extracted pest information)
  const pestIssue = normalizedData?.pest_issue;
  if (pestIssue && typeof pestIssue === 'string' && pestIssue.trim().length > 0) {
    // The pest_issue field may contain multiple pest types or descriptions
    // We'll use simple keyword matching for common pests
    const lowerIssue = pestIssue.toLowerCase();

    const pestKeywords: Record<string, string> = {
      'ant': 'ants',
      'roach': 'roaches',
      'cockroach': 'roaches',
      'termite': 'termites',
      'bed bug': 'bed_bugs',
      'bedbug': 'bed_bugs',
      'spider': 'spiders',
      'mosquito': 'mosquitoes',
      'flea': 'fleas',
      'tick': 'ticks',
      'rat': 'rodents',
      'mouse': 'rodents',
      'mice': 'rodents',
      'rodent': 'rodents',
      'wasp': 'wasps',
      'bee': 'bees',
      'hornet': 'hornets',
      'fly': 'flies',
      'silverfish': 'silverfish',
      'beetle': 'beetles',
      'cricket': 'crickets',
      'centipede': 'centipedes',
      'millipede': 'millipedes',
    };

    // Check for each pest keyword in the issue description
    for (const [keyword, pestType] of Object.entries(pestKeywords)) {
      if (lowerIssue.includes(keyword)) {
        pestTypes.push(pestType);
      }
    }

    // If no specific pest matched, use a generic type
    if (pestTypes.length === 0) {
      pestTypes.push('general_pest_issue');
    }
  }

  // Fallback: check other possible fields
  if (pestTypes.length === 0) {
    const possibleFields = ['service_needed', 'problem', 'issue', 'additional_comments'];
    for (const field of possibleFields) {
      const value = normalizedData?.[field];
      if (value && typeof value === 'string' && value.trim().length > 0) {
        pestTypes.push('general_pest_issue');
        break;
      }
    }
  }

  // Remove duplicates
  return [...new Set(pestTypes)];
}

/**
 * Get aggregation statistics for a company
 */
export async function getAggregationStats(companyId: string): Promise<{
  total_data_points: number;
  by_source: Record<SourceType, number>;
  by_pest_type: Record<string, number>;
  date_range: { earliest: string; latest: string } | null;
}> {
  const supabase = createAdminClient();

  const { data: dataPoints, error } = await supabase
    .from('pest_pressure_data_points')
    .select('source_type, pest_type, observed_at')
    .eq('company_id', companyId);

  if (error || !dataPoints) {
    return {
      total_data_points: 0,
      by_source: { call: 0, form: 0, lead: 0, manual: 0 },
      by_pest_type: {},
      date_range: null,
    };
  }

  const bySource: Record<SourceType, number> = {
    call: 0,
    form: 0,
    lead: 0,
    manual: 0,
  };

  const byPestType: Record<string, number> = {};

  let earliest: string | null = null;
  let latest: string | null = null;

  for (const point of dataPoints) {
    // Count by source (type cast since Supabase returns untyped data)
    const sourceType = point.source_type as SourceType;
    bySource[sourceType] = (bySource[sourceType] || 0) + 1;

    // Count by pest type
    byPestType[point.pest_type] = (byPestType[point.pest_type] || 0) + 1;

    // Track date range
    if (!earliest || point.observed_at < earliest) {
      earliest = point.observed_at;
    }
    if (!latest || point.observed_at > latest) {
      latest = point.observed_at;
    }
  }

  return {
    total_data_points: dataPoints.length,
    by_source: bySource,
    by_pest_type: byPestType,
    date_range: earliest && latest ? { earliest, latest } : null,
  };
}
