/**
 * Backfill Pest Pressure Data Points from Historical Data
 *
 * This script processes historical call records and form submissions to populate
 * the pest_pressure_data_points table. It connects to your production database
 * and can process specific companies or all active companies.
 *
 * Usage:
 *   npm run backfill-pest-pressure -- --companyId=<uuid> --startDate=2024-01-01 --endDate=2024-12-31
 *   npm run backfill-pest-pressure -- --all --startDate=2024-01-01 --endDate=2024-12-31
 *   npm run backfill-pest-pressure -- --companyId=<uuid> --startDate=2023-01-01
 *
 * Arguments:
 *   --companyId=<uuid>  Process a specific company (or use --all for all active companies)
 *   --startDate=<date>  Start date in YYYY-MM-DD format (required)
 *   --endDate=<date>    End date in YYYY-MM-DD format (defaults to today)
 *
 * Environment Variables Required (in .env.local):
 *   NEXT_PUBLIC_SUPABASE_URL       Your production Supabase URL
 *   PROD_SUPABASE_SERVICE_KEY      Your production service role key
 *   GEMINI_API_KEY                 Google Gemini API key for AI analysis
 *
 * Safety:
 *   - Idempotent: Safe to run multiple times (UNIQUE constraint prevents duplicates)
 *   - Can be stopped with Ctrl+C at any time
 *   - Shows progress for each company
 *   - Detailed summary at completion
 */

import { createClient } from '@supabase/supabase-js';
import { aggregatePestPressureData } from '@/lib/ai/pest-pressure/data-aggregator';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

interface BackfillArgs {
  companyId?: string;
  all?: boolean;
  startDate: string;
  endDate: string;
}

interface CompanyResult {
  companyId: string;
  companyName: string;
  success: boolean;
  inserted: number;
  skipped: number;
  errors: number;
  error?: string;
  duration: number;
}

/**
 * Parse command line arguments
 */
function parseArgs(): BackfillArgs {
  const args = process.argv.slice(2);

  let companyId: string | undefined;
  let all = false;
  let startDate = '';
  let endDate = new Date().toISOString().split('T')[0]; // Default to today

  for (const arg of args) {
    if (arg.startsWith('--companyId=')) {
      companyId = arg.split('=')[1];
    } else if (arg === '--all') {
      all = true;
    } else if (arg.startsWith('--startDate=')) {
      startDate = arg.split('=')[1];
    } else if (arg.startsWith('--endDate=')) {
      endDate = arg.split('=')[1];
    }
  }

  // Validation
  if (!companyId && !all) {
    console.error(
      '❌ Error: Must specify either --companyId=<uuid> or --all\n'
    );
    console.error('Usage:');
    console.error(
      '  npm run backfill-pest-pressure -- --companyId=<uuid> --startDate=2024-01-01'
    );
    console.error(
      '  npm run backfill-pest-pressure -- --all --startDate=2024-01-01 --endDate=2024-12-31'
    );
    process.exit(1);
  }

  if (!startDate) {
    console.error('❌ Error: Must specify --startDate=YYYY-MM-DD\n');
    console.error('Example: --startDate=2024-01-01');
    process.exit(1);
  }

  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
    console.error('❌ Error: Dates must be in YYYY-MM-DD format\n');
    console.error(
      `  startDate: ${startDate} ${dateRegex.test(startDate) ? '✅' : '❌'}`
    );
    console.error(
      `  endDate: ${endDate} ${dateRegex.test(endDate) ? '✅' : '❌'}`
    );
    process.exit(1);
  }

  // Validate date range
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (start > end) {
    console.error('❌ Error: startDate must be before or equal to endDate\n');
    console.error(`  startDate: ${startDate}`);
    console.error(`  endDate: ${endDate}`);
    process.exit(1);
  }

  return { companyId, all, startDate, endDate };
}

/**
 * Validate environment variables
 */
function validateEnvironment() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.PROD_SUPABASE_SERVICE_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!supabaseUrl || !supabaseKey || !geminiKey) {
    console.error('❌ Missing required environment variables in .env.local:\n');
    console.error(
      `  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✅' : '❌ MISSING'}`
    );
    console.error(
      `  PROD_SUPABASE_SERVICE_KEY: ${supabaseKey ? '✅' : '❌ MISSING'}`
    );
    console.error(`  GEMINI_API_KEY: ${geminiKey ? '✅' : '❌ MISSING'}`);
    console.error('\nPlease set these in your .env.local file');
    process.exit(1);
  }

  return { supabaseUrl, supabaseKey };
}

/**
 * Backfill data for a single company
 */
async function backfillCompany(
  companyId: string,
  companyName: string,
  startDate: string,
  endDate: string
): Promise<CompanyResult> {
  console.log(
    `\n[${companyName}] Starting backfill from ${startDate} to ${endDate}...`
  );

  const startTime = Date.now();

  try {
    const result = await aggregatePestPressureData(
      companyId,
      startDate,
      endDate
    );

    const duration = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));

    console.log(`[${companyName}] ✅ Completed in ${duration}s`);
    console.log(`  - Inserted: ${result.inserted}`);
    console.log(`  - Skipped (duplicates): ${result.skipped}`);
    console.log(`  - Errors: ${result.errors}`);

    return {
      companyId,
      companyName,
      success: true,
      ...result,
      duration,
    };
  } catch (error: any) {
    const duration = parseFloat(((Date.now() - startTime) / 1000).toFixed(2));

    console.error(`[${companyName}] ❌ Failed in ${duration}s`);
    console.error(`  Error: ${error.message}`);

    return {
      companyId,
      companyName,
      success: false,
      inserted: 0,
      skipped: 0,
      errors: 1,
      error: error.message,
      duration,
    };
  }
}

/**
 * Print summary banner
 */
function printSummary(
  results: CompanyResult[],
  startDate: string,
  endDate: string,
  totalDuration: number
) {
  console.log('\n' + '='.repeat(70));
  console.log('📊 BACKFILL SUMMARY');
  console.log('='.repeat(70));
  console.log(`Date Range: ${startDate} to ${endDate}`);
  console.log(`Total Duration: ${totalDuration.toFixed(2)}s`);
  console.log(`\nCompanies Processed: ${results.length}`);
  console.log(`  ✅ Successful: ${results.filter(r => r.success).length}`);
  console.log(`  ❌ Failed: ${results.filter(r => !r.success).length}`);

  const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);
  const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.errors, 0);

  console.log(`\nData Points:`);
  console.log(`  ✅ Inserted: ${totalInserted}`);
  console.log(`  ⏭️  Skipped: ${totalSkipped}`);
  console.log(`  ❌ Errors: ${totalErrors}`);

  // Show per-company breakdown if multiple companies
  if (results.length > 1) {
    console.log(`\n📋 Per-Company Breakdown:`);
    results
      .sort((a, b) => b.inserted - a.inserted)
      .forEach(r => {
        if (r.success) {
          console.log(
            `  ${r.companyName}: ${r.inserted} inserted, ${r.skipped} skipped`
          );
        } else {
          console.log(`  ${r.companyName}: ❌ ${r.error}`);
        }
      });
  }

  // Show failed companies if any
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    console.log(`\n❌ Failed Companies:`);
    failed.forEach(f => {
      console.log(`  - ${f.companyName}: ${f.error}`);
    });
  }

  console.log('\n' + '='.repeat(70));
  console.log('✨ Backfill complete!\n');
}

/**
 * Main execution
 */
async function main() {
  console.log('🐛 Pest Pressure Historical Data Backfill\n');

  // Parse arguments
  const args = parseArgs();

  // Validate environment
  const { supabaseUrl, supabaseKey } = validateEnvironment();

  // Set service role key for createAdminClient() to use
  // (aggregatePestPressureData internally uses createAdminClient which reads SUPABASE_SERVICE_ROLE_KEY)
  process.env.SUPABASE_SERVICE_ROLE_KEY = supabaseKey;

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('✅ Environment validated');
  console.log(`📅 Date range: ${args.startDate} to ${args.endDate}\n`);

  // Get companies to process
  let companies: { id: string; name: string }[] = [];

  if (args.all) {
    console.log('🔍 Fetching all companies...');

    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .order('name');

    if (error) {
      console.error('❌ Error fetching companies:', error);
      process.exit(1);
    }

    companies = data || [];
    console.log(`   Found ${companies.length} companies\n`);
  } else if (args.companyId) {
    console.log(`🔍 Fetching company ${args.companyId}...`);

    const { data, error } = await supabase
      .from('companies')
      .select('id, name')
      .eq('id', args.companyId)
      .single();

    if (error || !data) {
      console.error(`❌ Error: Company ${args.companyId} not found`);
      console.error('   Check that the company ID is correct');
      process.exit(1);
    }

    companies = [data];
    console.log(`   Found: ${data.name}\n`);
  }

  if (companies.length === 0) {
    console.log('⚠️  No companies to process');
    return;
  }

  // Confirmation prompt
  console.log(
    '⚠️  WARNING: This will process historical data and may take a while.'
  );
  console.log(`   Companies to process: ${companies.length}`);
  console.log(`   Date range: ${args.startDate} to ${args.endDate}`);
  console.log('   Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  // Process each company
  const scriptStartTime = Date.now();
  const results: CompanyResult[] = [];

  for (const company of companies) {
    const result = await backfillCompany(
      company.id,
      company.name,
      args.startDate,
      args.endDate
    );
    results.push(result);
  }

  // Print summary
  const totalDuration = (Date.now() - scriptStartTime) / 1000;
  printSummary(results, args.startDate, args.endDate, totalDuration);

  // Next steps
  if (results.some(r => r.inserted > 0)) {
    console.log('📋 Next Steps:\n');
    console.log('1. Train ML models for companies with new data:');
    console.log('   POST /api/ai/pest-pressure/train');
    console.log('\n2. Generate predictions:');
    console.log(
      '   POST /api/ai/predictions (predictionType: "pest_pressure")\n'
    );
  }
}

// Run main and handle errors
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  });
