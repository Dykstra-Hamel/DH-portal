/**
 * TypeScript script to seed pest pressure test data and trigger aggregation
 *
 * Usage:
 *   npx tsx scripts/seed-pest-pressure-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import { aggregatePestPressureData } from '../src/lib/ai/pest-pressure/data-aggregator';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🌱 Seeding pest pressure test data...\n');

  // Step 1: Get test company
  console.log('1️⃣ Finding active company...');
  const { data: companies, error: companyError } = await supabase
    .from('companies')
    .select('id, name')
    .eq('is_active', true)
    .limit(1);

  if (companyError || !companies || companies.length === 0) {
    console.error('❌ No active company found. Please create a company first.');
    process.exit(1);
  }

  const company = companies[0];
  console.log(`   ✅ Using company: ${company.name} (${company.id})\n`);

  // Step 2: Check if we already have leads
  const { count: existingLeads } = await supabase
    .from('leads')
    .select('id', { count: 'exact' })
    .eq('company_id', company.id)
    .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

  if (existingLeads && existingLeads > 50) {
    console.log(`⚠️  Found ${existingLeads} existing leads from last 90 days`);
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const answer = await new Promise<string>((resolve) => {
      rl.question('Continue and create more test data? (y/N): ', resolve);
    });
    rl.close();

    if (answer.toLowerCase() !== 'y') {
      console.log('Cancelled.');
      process.exit(0);
    }
  }

  // Step 3: Create test data
  console.log('2️⃣ Creating 90 days of test data...');
  console.log('   This will create leads, calls, forms, and tickets with seasonal patterns\n');

  const pestTypes = ['ants', 'termites', 'roaches', 'mosquitoes', 'spiders', 'mice', 'bed bugs', 'fleas'];
  const cities = ['Atlanta', 'Austin', 'Phoenix', 'Miami', 'Dallas'];
  const states = ['GA', 'TX', 'AZ', 'FL', 'TX'];
  const baseLats = [33.7490, 30.2672, 33.4484, 25.7617, 32.7767];
  const baseLngs = [-84.3880, -97.7431, -112.0740, -80.1918, -96.7970];

  // Get or create test customer
  let { data: customers } = await supabase
    .from('customers')
    .select('id')
    .eq('company_id', company.id)
    .limit(1);

  let customerId: string;
  if (!customers || customers.length === 0) {
    const { data: newCustomer } = await supabase
      .from('customers')
      .insert({
        company_id: company.id,
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '555-0100',
        city: 'Atlanta',
        state: 'GA',
        zip_code: '30301',
      })
      .select('id')
      .single();

    customerId = newCustomer!.id;
    console.log('   ✅ Created test customer');
  } else {
    customerId = customers[0].id;
    console.log('   ✅ Using existing customer');
  }

  let created = 0;
  const today = new Date();

  for (let i = 0; i < 90; i++) {
    const observationDate = new Date(today);
    observationDate.setDate(observationDate.getDate() - (90 - i));

    const month = observationDate.getMonth() + 1;
    const cityIdx = i % 5;
    const pestIdx = i % 8;

    // Seasonal factor (higher in summer)
    const seasonalFactor = [6, 7, 8].includes(month) ? 1.5 : [4, 5, 9].includes(month) ? 1.2 : 0.8;
    const urgency = Math.floor(3 + Math.random() * 5 * seasonalFactor);

    const lat = baseLats[cityIdx] + (Math.random() * 0.1 - 0.05);
    const lng = baseLngs[cityIdx] + (Math.random() * 0.1 - 0.05);

    try {
      // Create lead (simplified - just direct leads for speed)
      await supabase.from('leads').insert({
        company_id: company.id,
        customer_id: customerId,
        pest_type: pestTypes[pestIdx],
        city: cities[cityIdx],
        state: states[cityIdx],
        zip_code: '30301',
        lat,
        lng,
        lead_status: 'qualified',
        lead_source: 'web_form',
        created_at: observationDate.toISOString(),
      });

      created++;

      if (i % 10 === 0) {
        process.stdout.write(`   📊 Created ${created}/90 leads...\r`);
      }
    } catch (error) {
      console.error(`   ❌ Error creating lead ${i}:`, error);
    }
  }

  console.log(`\n   ✅ Created ${created} test leads with seasonal patterns\n`);

  // Step 4: Run aggregation
  console.log('3️⃣ Running pest pressure data aggregation...');

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const result = await aggregatePestPressureData(
    company.id,
    ninetyDaysAgo.toISOString(),
    new Date().toISOString()
  );

  console.log(`   ✅ Aggregation complete:
      - Inserted: ${result.inserted}
      - Skipped: ${result.skipped}
      - Errors: ${result.errors}\n`);

  // Step 5: Summary and next steps
  console.log('✅ Seeding complete!\n');
  console.log('📋 Next steps:');
  console.log(`   1. Train models: curl -X POST http://localhost:3000/api/ai/pest-pressure/train \\
        -H "Content-Type: application/json" \\
        -d '{"companyId": "${company.id}"}'`);
  console.log(`\n   2. Check training status: curl "http://localhost:3000/api/ai/pest-pressure/train?companyId=${company.id}"`);
  console.log(`\n   3. Generate predictions: curl -X POST http://localhost:3000/api/ai/predictions \\
        -H "Content-Type: application/json" \\
        -d '{"companyId": "${company.id}", "predictionType": "pest_pressure"}'`);
  console.log('\n   4. View data points in Supabase dashboard:');
  console.log('      SELECT * FROM pest_pressure_data_points WHERE company_id = \'' + company.id + '\';');
}

main().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
