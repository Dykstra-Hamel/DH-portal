import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { fetchAndSyncFromPestPac } from '@/lib/pestpac-route-sync';

/**
 * Inngest Scheduled Function: Nightly PestPac Route Sync
 *
 * Runs daily at 1 AM Eastern time to pre-populate route stops for all
 * PestPac-enabled companies. This ensures the first daily load of the
 * FieldMap dashboard reads from the DB cache rather than blocking on
 * a live PestPac API call.
 */
export const syncPestPacRoutesNightly = inngest.createFunction(
  {
    id: 'sync-pestpac-routes-nightly',
    name: 'Nightly PestPac Route Sync',
    retries: 2,
  },
  { cron: 'TZ=America/New_York 0 1 * * *' },
  async ({ step }) => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });

    // Step 1: Find all companies with PestPac enabled
    const pestpacCompanyIds = await step.run('get-pestpac-companies', async () => {
      const adminSupabase = createAdminClient();

      const { data, error } = await adminSupabase
        .from('company_settings')
        .select('company_id')
        .eq('setting_key', 'pestpac_enabled')
        .eq('setting_value', 'true');

      if (error) {
        throw new Error(`Failed to query PestPac-enabled companies: ${error.message}`);
      }

      const ids = [...new Set((data ?? []).map((row: any) => row.company_id as string))];
      console.log(`[sync-pestpac-routes-nightly] Found ${ids.length} PestPac-enabled company/companies for ${today}`);
      return ids;
    });

    if (pestpacCompanyIds.length === 0) {
      return { success: true, date: today, companiesSynced: 0 };
    }

    // Step 2: Sync each company in its own retryable step
    let totalUsersSynced = 0;

    for (const companyId of pestpacCompanyIds) {
      const synced = await step.run(`sync-company-${companyId}`, async () => {
        const adminSupabase = createAdminClient();

        const { data: userCompanies, error } = await adminSupabase
          .from('user_companies')
          .select('user_id, company_id, pestpac_employee_id')
          .eq('company_id', companyId)
          .not('pestpac_employee_id', 'is', null);

        if (error) {
          throw new Error(`Failed to query users for company ${companyId}: ${error.message}`);
        }

        const rows = userCompanies ?? [];
        console.log(`[sync-pestpac-routes-nightly] Syncing ${rows.length} user(s) for company ${companyId}`);

        for (const uc of rows) {
          try {
            await fetchAndSyncFromPestPac(
              adminSupabase,
              { company_id: uc.company_id, pestpac_employee_id: uc.pestpac_employee_id },
              today,
              uc.user_id,
              { awaitSync: true }
            );
          } catch (err) {
            console.error(`[sync-pestpac-routes-nightly] Error syncing user ${uc.user_id} for company ${companyId}:`, err);
          }
        }

        return rows.length;
      });

      totalUsersSynced += synced;
    }

    console.log(`[sync-pestpac-routes-nightly] Completed for ${today}: ${pestpacCompanyIds.length} companies, ${totalUsersSynced} users`);

    return {
      success: true,
      date: today,
      companiesSynced: pestpacCompanyIds.length,
      usersSynced: totalUsersSynced,
    };
  }
);
