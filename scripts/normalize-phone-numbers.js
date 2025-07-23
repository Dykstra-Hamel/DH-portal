/**
 * Migration script to normalize existing phone numbers in the customers table
 * This script updates all customer phone numbers to the (xxx) xxx-xxxx format
 */

const { createClient } = require('@supabase/supabase-js');

// Phone number normalization function (copied from utils.ts for Node.js compatibility)
function normalizePhoneNumber(phoneNumber) {
  if (!phoneNumber) return null;

  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, '');

  // Handle common US phone number formats
  let cleanDigits = digits;

  // Remove country code if present (1 at the beginning for US numbers)
  if (cleanDigits.startsWith('1') && cleanDigits.length === 11) {
    cleanDigits = cleanDigits.substring(1);
  }

  // Must be exactly 10 digits for a valid US phone number
  if (cleanDigits.length !== 10) {
    return null;
  }

  // Format as (xxx) xxx-xxxx
  const areaCode = cleanDigits.substring(0, 3);
  const exchange = cleanDigits.substring(3, 6);
  const number = cleanDigits.substring(6, 10);

  return `(${areaCode}) ${exchange}-${number}`;
}

async function normalizePhoneNumbers() {
  // Initialize Supabase client with service role key for admin access
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables:');
    console.error('- NEXT_PUBLIC_SUPABASE_URL');
    console.error('- SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🔄 Starting phone number normalization...');

    // Fetch all customers with phone numbers
    const { data: customers, error: fetchError } = await supabase
      .from('customers')
      .select('id, phone, first_name, last_name')
      .not('phone', 'is', null)
      .not('phone', 'eq', '');

    if (fetchError) {
      console.error('❌ Error fetching customers:', fetchError);
      process.exit(1);
    }

    if (!customers || customers.length === 0) {
      console.log('✅ No customers found with phone numbers to normalize');
      return;
    }

    console.log(`📋 Found ${customers.length} customers with phone numbers`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const customer of customers) {
      const originalPhone = customer.phone;
      const normalizedPhone = normalizePhoneNumber(originalPhone);

      // Skip if phone couldn't be normalized or is already in correct format
      if (!normalizedPhone) {
        console.log(
          `⚠️  Skipped invalid phone for ${customer.first_name} ${customer.last_name}: "${originalPhone}"`
        );
        skippedCount++;
        continue;
      }

      if (normalizedPhone === originalPhone) {
        console.log(
          `✅ Already normalized: ${customer.first_name} ${customer.last_name} - ${originalPhone}`
        );
        skippedCount++;
        continue;
      }

      // Update the customer's phone number
      const { error: updateError } = await supabase
        .from('customers')
        .update({ phone: normalizedPhone })
        .eq('id', customer.id);

      if (updateError) {
        console.error(
          `❌ Error updating ${customer.first_name} ${customer.last_name}:`,
          updateError
        );
        errorCount++;
        continue;
      }

      console.log(`🔄 Updated: ${customer.first_name} ${customer.last_name}`);
      console.log(`   From: "${originalPhone}" → To: "${normalizedPhone}"`);
      updatedCount++;
    }

    console.log('\\n📊 Migration Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} customers`);
    console.log(
      `⚠️  Skipped (already normalized/invalid): ${skippedCount} customers`
    );
    console.log(`❌ Errors: ${errorCount} customers`);
    console.log(`📋 Total processed: ${customers.length} customers`);

    if (errorCount > 0) {
      console.log(
        '\\n⚠️  Some updates failed. Check the error messages above.'
      );
      process.exit(1);
    } else {
      console.log('\\n🎉 Phone number normalization completed successfully!');
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  normalizePhoneNumbers();
}

module.exports = { normalizePhoneNumbers, normalizePhoneNumber };
