/**
 * AWS SES Migration Script
 *
 * This script provisions AWS SES tenants for all existing companies that don't have one yet.
 * It optionally creates email identities for companies with configured domains.
 *
 * Usage:
 *   npm run migrate-to-ses [--dry-run] [--company-id=<uuid>]
 *
 * Options:
 *   --dry-run: Preview what would be done without making changes
 *   --company-id: Only migrate a specific company
 *
 * Environment variables required:
 *   - AWS_REGION (default: us-east-1)
 *   - AWS_ACCESS_KEY_ID
 *   - AWS_SECRET_ACCESS_KEY
 *   - DATABASE_URL or Supabase credentials
 */

import { createClient } from '@supabase/supabase-js';
import { createTenant } from '../src/lib/aws-ses/tenants';
import { createEmailIdentity, associateIdentityWithTenant } from '../src/lib/aws-ses/identities';
import { createConfigurationSetWithEvents, associateConfigSetWithTenant } from '../src/lib/aws-ses/config-sets';

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const companyIdArg = args.find(arg => arg.startsWith('--company-id='));
const specificCompanyId = companyIdArg ? companyIdArg.split('=')[1] : null;

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface Company {
  id: string;
  name: string;
  email_domain?: string;
  email_domain_status?: string;
  aws_ses_tenant_name?: string;
}

interface MigrationResult {
  companyId: string;
  companyName: string;
  success: boolean;
  error?: string;
  tenantName?: string;
  identityCreated?: boolean;
}

async function getCompaniesToMigrate(): Promise<Company[]> {
  try {
    // Get all companies
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .order('created_at');

    if (companiesError) {
      throw new Error(`Failed to fetch companies: ${companiesError.message}`);
    }

    if (!companies || companies.length === 0) {
      console.log('No companies found in database');
      return [];
    }

    // Filter to specific company if requested
    const filteredCompanies = specificCompanyId
      ? companies.filter(c => c.id === specificCompanyId)
      : companies;

    if (specificCompanyId && filteredCompanies.length === 0) {
      throw new Error(`Company with ID ${specificCompanyId} not found`);
    }

    // For each company, check if they have SES tenant and email domain settings
    const companiesWithSettings: Company[] = [];

    for (const company of filteredCompanies) {
      const { data: settings } = await supabase
        .from('company_settings')
        .select('setting_key, setting_value')
        .eq('company_id', company.id)
        .in('setting_key', ['email_domain', 'email_domain_status', 'aws_ses_tenant_name']);

      const settingsMap: Record<string, string> = {};
      settings?.forEach(s => {
        settingsMap[s.setting_key] = s.setting_value;
      });

      companiesWithSettings.push({
        ...company,
        email_domain: settingsMap.email_domain,
        email_domain_status: settingsMap.email_domain_status,
        aws_ses_tenant_name: settingsMap.aws_ses_tenant_name,
      });
    }

    // Filter companies that don't have SES tenant provisioned yet
    const companiesToMigrate = companiesWithSettings.filter(
      c => !c.aws_ses_tenant_name
    );

    return companiesToMigrate;
  } catch (error) {
    console.error('Error getting companies to migrate:', error);
    throw error;
  }
}

async function migrateCompany(company: Company): Promise<MigrationResult> {
  console.log(`\nMigrating company: ${company.name} (${company.id})`);

  if (isDryRun) {
    console.log('  [DRY RUN] Would create SES tenant');
    if (company.email_domain) {
      console.log(`  [DRY RUN] Would create identity for domain: ${company.email_domain}`);
    }
    return {
      companyId: company.id,
      companyName: company.name,
      success: true,
    };
  }

  try {
    // Step 1: Create SES tenant
    console.log('  Creating SES tenant...');
    const tenantResult = await createTenant(company.id, company.name);

    if (!tenantResult.success || !tenantResult.data) {
      throw new Error(`Failed to create tenant: ${tenantResult.error}`);
    }

    const tenant = tenantResult.data;
    console.log(`  ✓ Created tenant: ${tenant.tenantName}`);

    // Step 2: Create configuration set
    console.log('  Creating configuration set...');
    const configSetResult = await createConfigurationSetWithEvents(company.id);

    if (!configSetResult.success || !configSetResult.data) {
      throw new Error(`Failed to create configuration set: ${configSetResult.error}`);
    }

    const configSet = configSetResult.data;
    console.log(`  ✓ Created configuration set: ${configSet.name}`);

    // Step 3: Associate configuration set with tenant
    console.log('  Associating configuration set with tenant...');
    const configAssocResult = await associateConfigSetWithTenant(
      configSet.name,
      tenant.tenantName
    );

    if (!configAssocResult.success) {
      console.warn(`  ⚠ Failed to associate config set: ${configAssocResult.error}`);
    } else {
      console.log('  ✓ Associated configuration set with tenant');
    }

    let identityCreated = false;
    let identityArn: string | undefined;
    let dkimTokens: any[] = [];

    // Step 4: Create email identity if domain is configured
    if (company.email_domain) {
      console.log(`  Creating email identity for domain: ${company.email_domain}...`);
      const identityResult = await createEmailIdentity(company.email_domain);

      if (identityResult.success && identityResult.data) {
        identityArn = identityResult.data.identityArn;
        dkimTokens = identityResult.dkimTokens || [];
        identityCreated = true;
        console.log(`  ✓ Created email identity`);

        // Associate identity with tenant
        const identityAssocResult = await associateIdentityWithTenant(
          company.email_domain,
          tenant.tenantName,
          identityArn
        );

        if (!identityAssocResult.success) {
          console.warn(`  ⚠ Failed to associate identity: ${identityAssocResult.error}`);
        } else {
          console.log('  ✓ Associated identity with tenant');
        }
      } else {
        console.warn(`  ⚠ Failed to create identity: ${identityResult.error}`);
      }
    }

    // Step 5: Save configuration to database
    console.log('  Saving configuration to database...');

    const settingsToInsert = [
      {
        company_id: company.id,
        setting_key: 'aws_ses_tenant_id',
        setting_value: tenant.tenantId,
      },
      {
        company_id: company.id,
        setting_key: 'aws_ses_tenant_name',
        setting_value: tenant.tenantName,
      },
      {
        company_id: company.id,
        setting_key: 'aws_ses_tenant_arn',
        setting_value: tenant.tenantArn,
      },
      {
        company_id: company.id,
        setting_key: 'aws_ses_configuration_set',
        setting_value: configSet.name,
      },
    ];

    if (identityArn) {
      settingsToInsert.push({
        company_id: company.id,
        setting_key: 'aws_ses_identity_arn',
        setting_value: identityArn,
      });
    }

    if (dkimTokens.length > 0) {
      settingsToInsert.push({
        company_id: company.id,
        setting_key: 'aws_ses_dkim_tokens',
        setting_value: JSON.stringify(dkimTokens),
      });
    }

    const { error: insertError } = await supabase
      .from('company_settings')
      .upsert(settingsToInsert, {
        onConflict: 'company_id,setting_key',
      });

    if (insertError) {
      throw new Error(`Failed to save configuration: ${insertError.message}`);
    }

    console.log('  ✓ Saved configuration to database');
    console.log(`  ✅ Successfully migrated ${company.name}`);

    return {
      companyId: company.id,
      companyName: company.name,
      success: true,
      tenantName: tenant.tenantName,
      identityCreated,
    };
  } catch (error) {
    console.error(`  ❌ Failed to migrate ${company.name}:`, error);
    return {
      companyId: company.id,
      companyName: company.name,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function main() {
  console.log('='.repeat(70));
  console.log('AWS SES Migration Script');
  console.log('='.repeat(70));
  console.log();

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made');
    console.log();
  }

  if (specificCompanyId) {
    console.log(`🎯 Migrating specific company: ${specificCompanyId}`);
    console.log();
  }

  // Step 1: Get companies to migrate
  console.log('📋 Fetching companies to migrate...');
  const companies = await getCompaniesToMigrate();

  if (companies.length === 0) {
    console.log('\n✅ No companies need migration');
    return;
  }

  console.log(`\nFound ${companies.length} ${companies.length === 1 ? 'company' : 'companies'} to migrate:`);
  companies.forEach((c, i) => {
    console.log(`  ${i + 1}. ${c.name} ${c.email_domain ? `(${c.email_domain})` : '(no domain)'}`);
  });

  // Step 2: Migrate each company
  console.log('\n' + '-'.repeat(70));
  console.log('Starting migration...');
  console.log('-'.repeat(70));

  const results: MigrationResult[] = [];

  for (const company of companies) {
    const result = await migrateCompany(company);
    results.push(result);

    // Add a small delay between migrations to avoid rate limits
    if (!isDryRun) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Step 3: Print summary
  console.log('\n' + '='.repeat(70));
  console.log('Migration Summary');
  console.log('='.repeat(70));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`\n✅ Successful: ${successful.length}/${results.length}`);
  if (successful.length > 0) {
    successful.forEach(r => {
      console.log(`  - ${r.companyName}${r.identityCreated ? ' (with identity)' : ''}`);
    });
  }

  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
    failed.forEach(r => {
      console.log(`  - ${r.companyName}: ${r.error}`);
    });
  }

  console.log('\n' + '='.repeat(70));

  if (isDryRun) {
    console.log('\n💡 This was a dry run. Run without --dry-run to apply changes.');
  } else {
    console.log('\n✅ Migration complete!');
    console.log('\nNext steps:');
    console.log('1. Companies with custom domains need to add DKIM DNS records');
    console.log('2. Check AWS SES console to verify tenant creation');
    console.log('3. Monitor email sending for any issues');
  }
}

// Run the script
main().catch(error => {
  console.error('\n❌ Migration script failed:', error);
  process.exit(1);
});
