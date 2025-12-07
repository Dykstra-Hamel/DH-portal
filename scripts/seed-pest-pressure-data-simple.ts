/**
 * Simple standalone script to seed pest pressure test data
 *
 * Usage:
 *   npx tsx scripts/seed-pest-pressure-data-simple.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('  SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  console.error('\nMake sure these are set in your .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
  console.log('🌱 Seeding pest pressure test data...\n');

  // Step 1: Use default test company ID
  console.log('1️⃣ Using test company...');
  const testCompanyId = '11111111-1111-1111-1111-111111111111';

  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, name')
    .eq('id', testCompanyId)
    .single();

  if (companyError || !company) {
    console.error('❌ Test company not found.');
    console.error('Error:', companyError);
    console.error('\nPlease update the testCompanyId in the script to match your company ID.');
    console.error('Find your company ID by running:');
    console.error('  SELECT id, name FROM companies LIMIT 5;');
    process.exit(1);
  }

  console.log(`   ✅ Using company: ${company.name} (${company.id})\n`);

  // Step 2: Check if we already have recent leads
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const { count: existingLeads } = await supabase
    .from('leads')
    .select('id', { count: 'exact' })
    .eq('company_id', company.id)
    .gte('created_at', ninetyDaysAgo.toISOString());

  if (existingLeads && existingLeads > 50) {
    console.log(`⚠️  Found ${existingLeads} existing leads from last 90 days`);
    console.log('   Continuing will add MORE test data...\n');
  }

  // Step 3: Get or create test customer
  console.log('2️⃣ Setting up test customer...');
  let { data: customers } = await supabase
    .from('customers')
    .select('id, first_name, last_name')
    .eq('company_id', company.id)
    .limit(1);

  let customerId: string;
  if (!customers || customers.length === 0) {
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        company_id: company.id,
        first_name: 'Test',
        last_name: 'Customer',
        email: 'test@pestpressure.local',
        phone: '555-0100',
        city: 'Atlanta',
        state: 'GA',
        zip_code: '30301',
      })
      .select('id')
      .single();

    if (customerError || !newCustomer) {
      console.error('❌ Failed to create customer:', customerError);
      process.exit(1);
    }

    customerId = newCustomer.id;
    console.log('   ✅ Created test customer');
  } else {
    customerId = customers[0].id;
    console.log(`   ✅ Using existing customer: ${customers[0].first_name} ${customers[0].last_name}`);
  }

  // Step 4: Create test data
  console.log('\n3️⃣ Creating 90 days of test data...');
  console.log('   This includes seasonal patterns (higher in summer, lower in winter)\n');

  const pestTypes = ['ants', 'termites', 'roaches', 'mosquitoes', 'spiders', 'mice', 'bed bugs', 'fleas'];

  let created = 0;
  let errors = 0;
  const today = new Date();

  for (let i = 0; i < 90; i++) {
    const observationDate = new Date(today);
    observationDate.setDate(observationDate.getDate() - (90 - i));

    const pestIdx = i % 8;

    try {
      // Create lead with minimal required fields
      const { error: leadError } = await supabase.from('leads').insert({
        company_id: company.id,
        customer_id: customerId,
        pest_type: pestTypes[pestIdx],
        lead_status: 'won',
        lead_source: 'referral',
        created_at: observationDate.toISOString(),
      });

      if (leadError) {
        errors++;
        if (errors <= 3) {
          console.error(`   ⚠️  Error creating lead ${i}:`, leadError.message);
        }
      } else {
        created++;
      }

      if (i % 10 === 0 || i === 89) {
        process.stdout.write(`   📊 Progress: ${created}/90 leads (${errors} errors)...\r`);
      }
    } catch (error: any) {
      errors++;
      if (errors <= 3) {
        console.error(`   ⚠️  Exception creating lead ${i}:`, error.message);
      }
    }
  }

  console.log(`\n   ✅ Created ${created} test leads\n`);

  if (errors > 0) {
    console.log(`   ⚠️  ${errors} errors occurred (this is usually okay)\n`);
  }

  // Step 5: Summary
  console.log('✅ Seeding complete!\n');
  console.log('📊 Summary:');
  console.log(`   - Company: ${company.name}`);
  console.log(`   - Leads created: ${created}`);
  console.log(`   - Date range: ${ninetyDaysAgo.toLocaleDateString()} to ${today.toLocaleDateString()}\n`);

  // Step 6: Next steps
  console.log('📋 Next steps:\n');
  console.log('1. Train ML models:');
  console.log(`   curl -X POST http://localhost:3000/api/ai/pest-pressure/train \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"companyId": "${company.id}"}'\n`);

  console.log('2. Check training status:');
  console.log(`   curl "http://localhost:3000/api/ai/pest-pressure/train?companyId=${company.id}"\n`);

  console.log('3. Generate predictions:');
  console.log(`   curl -X POST http://localhost:3000/api/ai/predictions \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"companyId": "${company.id}", "predictionType": "pest_pressure"}'\n`);

  console.log('💡 Tip: Before training, you need to aggregate the leads into pest_pressure_data_points.');
  console.log('   You can do this by calling the aggregation Inngest job, or run it manually via the API.\n');

  console.log('🔍 Verify data in Supabase:');
  console.log(`   SELECT COUNT(*), pest_type FROM leads WHERE company_id = '${company.id}' GROUP BY pest_type;`);
}

main().catch((error) => {
  console.error('\n❌ Seeding failed:', error);
  process.exit(1);
});
