/**
 * Image Storage Migration Script
 *
 * Migrates all images from campaign-landing-pages bucket to brand-assets bucket.
 * Updates database references in company_images and campaign_landing_pages tables.
 *
 * Usage:
 *   npm run ts-node scripts/migrate-images-to-brand-assets.ts -- --dry-run  (preview only)
 *   npm run ts-node scripts/migrate-images-to-brand-assets.ts                (live migration)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables!');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Cleans company name for storage paths
 * Must match cleanCompanyName() from /src/lib/storage-utils.ts
 */
function cleanCompanyName(companyName: string): string {
  return (companyName || 'company')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

interface MigrationResult {
  success: boolean;
  oldPath: string;
  newPath: string;
  error?: string;
}

async function migrateImages(dryRun: boolean = false) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`IMAGE MIGRATION: campaign-landing-pages → brand-assets`);
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}`);
  console.log(`${'='.repeat(70)}\n`);

  const results: MigrationResult[] = [];
  let companyImagesCount = 0;
  let landingPagesCount = 0;

  // ==========================================================================
  // STEP 1: Migrate company_images table records
  // ==========================================================================
  console.log('\n[1/3] Migrating company_images table...\n');

  const { data: companyImages, error: ciError } = await supabase
    .from('company_images')
    .select('id, company_id, file_path, file_name, mime_type');

  if (ciError) {
    console.error('❌ Error fetching company_images:', ciError);
    return;
  }

  console.log(`Found ${companyImages?.length || 0} company library images\n`);

  for (const image of companyImages || []) {
    try {
      // Get company name
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', image.company_id)
        .single();

      if (!company) {
        console.log(`⚠️  Company not found for image ${image.id}, skipping\n`);
        continue;
      }

      const cleaned = cleanCompanyName(company.name);
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileExtension = image.file_name.split('.').pop();
      const newPath = `${cleaned}/image-library/${timestamp}-${randomString}.${fileExtension}`;

      console.log(`  Old: ${image.file_path}`);
      console.log(`  New: ${newPath}`);

      if (!dryRun) {
        // Download file from campaign-landing-pages bucket
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('campaign-landing-pages')
          .download(image.file_path);

        if (downloadError) {
          console.log(`  ❌ Download failed: ${downloadError.message}\n`);
          results.push({
            success: false,
            oldPath: image.file_path,
            newPath,
            error: downloadError.message
          });
          continue;
        }

        // Upload to brand-assets bucket
        const { error: uploadError } = await supabase.storage
          .from('brand-assets')
          .upload(newPath, fileData, {
            contentType: image.mime_type,
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.log(`  ❌ Upload failed: ${uploadError.message}\n`);
          results.push({
            success: false,
            oldPath: image.file_path,
            newPath,
            error: uploadError.message
          });
          continue;
        }

        // Update database record with new path
        const { error: updateError } = await supabase
          .from('company_images')
          .update({ file_path: newPath })
          .eq('id', image.id);

        if (updateError) {
          console.log(`  ❌ Database update failed: ${updateError.message}\n`);
          results.push({
            success: false,
            oldPath: image.file_path,
            newPath,
            error: updateError.message
          });
          continue;
        }

        console.log(`  ✅ Migrated successfully\n`);
        results.push({ success: true, oldPath: image.file_path, newPath });
        companyImagesCount++;
      } else {
        console.log(`  ℹ️  Would migrate (dry run)\n`);
        companyImagesCount++;
      }
    } catch (error) {
      console.error(`  ❌ Unexpected error:`, error, '\n');
    }
  }

  // ==========================================================================
  // STEP 2: Migrate campaign_landing_pages image URLs
  // ==========================================================================
  console.log('\n[2/3] Migrating campaign_landing_pages table...\n');

  const { data: landingPages, error: lpError } = await supabase
    .from('campaign_landing_pages')
    .select(`
      id,
      campaign_id,
      hero_image_url,
      feature_image_url,
      additional_services_image_url,
      thankyou_expect_col1_image,
      thankyou_expect_col2_image,
      thankyou_expect_col3_image
    `);

  if (lpError) {
    console.error('❌ Error fetching landing pages:', lpError);
    return;
  }

  console.log(`Found ${landingPages?.length || 0} landing pages to check\n`);

  for (const page of landingPages || []) {
    try {
      // Get campaign's company
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('company_id')
        .eq('id', page.campaign_id)
        .single();

      if (!campaign) {
        console.log(`⚠️  Campaign not found for landing page ${page.id}, skipping\n`);
        continue;
      }

      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', campaign.company_id)
        .single();

      if (!company) {
        console.log(`⚠️  Company not found for campaign ${page.campaign_id}, skipping\n`);
        continue;
      }

      const cleaned = cleanCompanyName(company.name);
      const updates: any = {};

      // Helper function to migrate a single URL field
      const migrateUrlField = async (fieldName: string, url: string | null) => {
        if (!url || !url.includes('campaign-landing-pages')) {
          return; // Skip if not from old bucket
        }

        // Extract path from full URL
        const pathMatch = url.match(/campaign-landing-pages\/(.+)$/);
        if (!pathMatch) {
          console.log(`  ⚠️  Could not extract path from ${fieldName}: ${url}\n`);
          return;
        }

        const oldPath = pathMatch[1];
        const fileName = oldPath.split('/').pop() || '';
        const newPath = `${cleaned}/image-library/${fileName}`;

        console.log(`  [${fieldName}]`);
        console.log(`    Old: ${oldPath}`);
        console.log(`    New: ${newPath}`);

        if (!dryRun) {
          // Download from old bucket
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('campaign-landing-pages')
            .download(oldPath);

          if (downloadError) {
            console.log(`    ❌ Download failed: ${downloadError.message}\n`);
            return;
          }

          // Determine content type from filename
          let contentType = 'image/jpeg';
          if (fileName.endsWith('.png')) contentType = 'image/png';
          else if (fileName.endsWith('.webp')) contentType = 'image/webp';

          // Upload to new bucket
          const { error: uploadError } = await supabase.storage
            .from('brand-assets')
            .upload(newPath, fileData, {
              contentType,
              cacheControl: '3600',
              upsert: true, // Allow overwrites in case of re-running script
            });

          if (uploadError && !uploadError.message.includes('already exists')) {
            console.log(`    ❌ Upload failed: ${uploadError.message}\n`);
            return;
          }

          // Get new public URL
          const { data: { publicUrl } } = supabase.storage
            .from('brand-assets')
            .getPublicUrl(newPath);

          updates[fieldName] = publicUrl;
          console.log(`    ✅ Migrated\n`);
        } else {
          console.log(`    ℹ️  Would migrate (dry run)\n`);
        }
      };

      // Process all image URL fields
      await migrateUrlField('hero_image_url', page.hero_image_url);
      await migrateUrlField('feature_image_url', page.feature_image_url);
      await migrateUrlField('additional_services_image_url', page.additional_services_image_url);
      await migrateUrlField('thankyou_expect_col1_image', page.thankyou_expect_col1_image);
      await migrateUrlField('thankyou_expect_col2_image', page.thankyou_expect_col2_image);
      await migrateUrlField('thankyou_expect_col3_image', page.thankyou_expect_col3_image);

      // Apply database updates
      if (!dryRun && Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('campaign_landing_pages')
          .update(updates)
          .eq('id', page.id);

        if (updateError) {
          console.log(`❌ Failed to update landing page ${page.id}: ${updateError.message}\n`);
        } else {
          landingPagesCount++;
        }
      } else if (Object.keys(updates).length > 0 || dryRun) {
        landingPagesCount++;
      }
    } catch (error) {
      console.error(`❌ Unexpected error processing landing page:`, error, '\n');
    }
  }

  // ==========================================================================
  // STEP 3: Migration Summary
  // ==========================================================================
  console.log('\n[3/3] Migration Summary\n');
  console.log(`${'='.repeat(70)}`);

  if (dryRun) {
    console.log('🔍 DRY RUN COMPLETE - No changes were made');
    console.log(`\n   Would migrate:`);
    console.log(`   • ${companyImagesCount} company library images`);
    console.log(`   • ${landingPagesCount} campaign landing pages with images`);
  } else {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✅ Successfully migrated:`);
    console.log(`   • ${successful} company library images`);
    console.log(`   • ${landingPagesCount} campaign landing pages`);

    if (failed > 0) {
      console.log(`\n❌ Failed migrations: ${failed}`);
      console.log(`   Review errors above for details`);
    }

    console.log(`\n⚠️  IMPORTANT:`);
    console.log(`   • Original files remain in campaign-landing-pages bucket`);
    console.log(`   • Verify migration success before deleting originals`);
    console.log(`   • Test image loading on campaign landing pages`);
  }

  console.log(`${'='.repeat(70)}\n`);
}

// Parse command line arguments
const dryRun = process.argv.includes('--dry-run');

// Run migration
migrateImages(dryRun)
  .then(() => {
    console.log('✅ Migration script completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
