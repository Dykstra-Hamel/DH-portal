import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import type { NormalizedLeadData } from '@/lib/gemini/csv-parser';

export const bulkLeadUploadHandler = inngest.createFunction(
  {
    id: 'bulk-lead-upload-handler',
    name: 'Handle Bulk Lead Upload',
    retries: 2,
  },
  { event: 'bulk-lead-upload/scheduled' },
  async ({ event, step }) => {
    const {
      uploadId,
      companyId,
      createdBy,
      scheduledFor,
      totalRows,
      parsedData,
    } = event.data;

    console.log(`Processing bulk lead upload: ${uploadId} (${totalRows} leads)`);

    // Step 1: Wait until scheduled time if needed
    const scheduledTime = new Date(scheduledFor);
    const now = new Date();

    if (scheduledTime > now) {
      await step.sleepUntil('wait-for-scheduled-time', scheduledTime);
    }

    // Step 2: Check if upload was cancelled
    const isCancelled = await step.run('check-cancellation-status', async () => {
      const supabase = createAdminClient();

      const { data: upload } = await supabase
        .from('bulk_lead_uploads')
        .select('status')
        .eq('id', uploadId)
        .single();

      return upload?.status === 'cancelled';
    });

    if (isCancelled) {
      console.log(`Upload ${uploadId} was cancelled, aborting.`);
      return {
        success: false,
        uploadId,
        message: 'Upload was cancelled',
      };
    }

    // Step 3: Update status to processing
    await step.run('update-status-processing', async () => {
      const supabase = createAdminClient();

      await supabase
        .from('bulk_lead_uploads')
        .update({
          status: 'processing',
          executed_at: new Date().toISOString(),
        })
        .eq('id', uploadId);
    });

    // Step 4: Process all leads
    const results = await step.run('process-leads', async () => {
      const supabase = createAdminClient();
      let successCount = 0;
      let failedCount = 0;

      for (const leadData of parsedData as NormalizedLeadData[]) {
        try {
          // Find or create customer
          let customerId: string | null = null;

          // Try to find existing customer by email or phone
          if (leadData.email || leadData.phone_number) {
            const { data: existingCustomer } = await supabase
              .from('customers')
              .select('id')
              .eq('company_id', companyId)
              .or(
                leadData.email
                  ? `email.eq.${leadData.email}`
                  : `phone.eq.${leadData.phone_number}`
              )
              .maybeSingle();

            customerId = existingCustomer?.id || null;
          }

          // Create customer if not found
          if (!customerId && (leadData.first_name || leadData.last_name)) {
            const { data: newCustomer, error: customerError } = await supabase
              .from('customers')
              .insert([
                {
                  company_id: companyId,
                  first_name: leadData.first_name || '',
                  last_name: leadData.last_name || '',
                  email: leadData.email,
                  phone: leadData.phone_number, // AI outputs phone_number, DB uses phone
                  address: leadData.street_address, // AI outputs street_address, DB uses address
                  city: leadData.city,
                  state: leadData.state,
                  zip_code: leadData.zip,
                },
              ])
              .select('id')
              .single();

            if (customerError) {
              console.error('Error creating customer:', customerError);
              failedCount++;
              continue;
            }

            customerId = newCustomer.id;
          }

          // Create service address if we have address data
          let serviceAddressId: string | null = null;

          if (
            customerId &&
            (leadData.street_address || leadData.city || leadData.state || leadData.zip)
          ) {
            const { data: newAddress, error: addressError } = await supabase
              .from('service_addresses')
              .insert([
                {
                  company_id: companyId,
                  street_address: leadData.street_address || '',
                  city: leadData.city || '',
                  state: leadData.state || '',
                  zip_code: leadData.zip || '', // DB uses zip_code, not zip
                },
              ])
              .select('id')
              .single();

            if (!addressError && newAddress) {
              serviceAddressId = newAddress.id;
            }
          }

          // Create lead
          const { error: leadError } = await supabase.from('leads').insert([
            {
              company_id: companyId,
              customer_id: customerId,
              service_address_id: serviceAddressId,
              lead_type: 'bulk_add',
              lead_source: (leadData.lead_source as any) || 'other',
              lead_status: 'new',
              priority: leadData.priority || 'medium',
              pest_type: leadData.pest_type,
              comments: leadData.comments,
              service_type: leadData.service_type,
              estimated_value: leadData.estimated_value,
              assigned_to: null,
              created_at: new Date().toISOString(),
            },
          ]);

          if (leadError) {
            console.error('Error creating lead:', leadError);
            failedCount++;
            continue;
          }

          successCount++;
        } catch (error) {
          console.error('Error processing lead:', error);
          failedCount++;
        }
      }

      return {
        successCount,
        failedCount,
      };
    });

    // Step 5: Update upload status to completed
    await step.run('update-status-completed', async () => {
      const supabase = createAdminClient();

      await supabase
        .from('bulk_lead_uploads')
        .update({
          status: results.failedCount > 0 && results.successCount === 0 ? 'failed' : 'completed',
          successful_count: results.successCount,
          failed_count: results.failedCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', uploadId);
    });

    return {
      success: true,
      uploadId,
      successCount: results.successCount,
      failedCount: results.failedCount,
      totalRows,
    };
  }
);
