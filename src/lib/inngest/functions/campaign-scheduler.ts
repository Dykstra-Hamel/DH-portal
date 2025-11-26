import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { fetchCompanyBusinessHours, isBusinessHours, getNextBusinessHourSlot } from '@/lib/campaigns/business-hours';
import { canStartNewCall, trackCallStart, cleanupStaleCalls } from '@/lib/campaigns/concurrency-manager';

export const campaignSchedulerHandler = inngest.createFunction(
  {
    id: 'campaign-scheduler',
    name: 'Campaign Scheduler',
    retries: 3,
  },
  { cron: '*/5 * * * *' }, // Run every 5 minutes
  async ({ event, step }) => {
    // Cleanup stale call records first
    await step.run('cleanup-stale-calls', async () => {
      await cleanupStaleCalls();
    });

    // Find campaigns that should start now
    const campaignsToStart = await step.run('find-campaigns-to-start', async () => {
      const supabase = createAdminClient();
      const now = new Date().toISOString();

      const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select(`
          id,
          company_id,
          name,
          workflow_id,
          start_datetime,
          end_datetime,
          target_audience_type,
          audience_filter_criteria,
          respect_business_hours,
          batch_size,
          batch_interval_minutes,
          daily_limit
        `)
        .eq('status', 'scheduled')
        .lte('start_datetime', now)
        .not('workflow_id', 'is', null); // Must have a workflow

      if (error) {
        console.error('Error fetching campaigns to start:', error);
        return [];
      }

      return campaigns || [];
    });

    if (campaignsToStart.length === 0) {
      return { message: 'No campaigns to start', count: 0 };
    }

    // Process each campaign
    for (const campaign of campaignsToStart) {
      await step.run(`start-campaign-${campaign.id}`, async () => {
        const supabase = createAdminClient();

        // Check business hours if enabled
        if (campaign.respect_business_hours) {
          const businessHours = await fetchCompanyBusinessHours(campaign.company_id);
          const now = new Date();

          if (!isBusinessHours(now, businessHours)) {
            console.log(`Campaign ${campaign.id} respects business hours - waiting for next business hour slot`);
            const nextSlot = getNextBusinessHourSlot(now, businessHours);
            console.log(`Next business hour slot: ${nextSlot.toISOString()}`);

            // Reschedule campaign for next business hour
            await supabase
              .from('campaigns')
              .update({ start_datetime: nextSlot.toISOString() })
              .eq('id', campaign.id);

            return { success: false, reason: 'Outside business hours - rescheduled' };
          }
        }

        // Validate campaign has contact lists before starting
        const { data: contactLists } = await supabase
          .from('campaign_contact_lists')
          .select('id')
          .eq('campaign_id', campaign.id);

        if (!contactLists || contactLists.length === 0) {
          console.error(`Campaign ${campaign.id} has no contact lists - cannot start`);

          // Set back to draft status - campaign is incomplete
          await supabase
            .from('campaigns')
            .update({ status: 'draft' })
            .eq('id', campaign.id);

          return {
            success: false,
            reason: 'No contact lists - moved back to draft'
          };
        }

        // Update campaign status to running
        await supabase
          .from('campaigns')
          .update({
            status: 'running',
            current_day_date: new Date().toISOString().split('T')[0],
            contacts_sent_today: 0,
            current_batch: 0
          })
          .eq('id', campaign.id);

        // Get all pending contacts from all lists
        const { data: contacts } = await supabase
          .from('campaign_contact_list_members')
          .select(`
            id,
            contact_list_id,
            customer_id,
            lead_id
          `)
          .in('contact_list_id', contactLists.map(l => l.id))
          .eq('status', 'pending');

        if (!contacts || contacts.length === 0) {
          console.warn(`Campaign ${campaign.id} has no pending contacts`);
          // Mark campaign as completed if no contacts
          await supabase
            .from('campaigns')
            .update({ status: 'completed' })
            .eq('id', campaign.id);
          return { success: true, contacts: 0 };
        }

        console.log(`Starting campaign ${campaign.name} with ${contacts.length} contacts`);

        // Send event to process contacts in batch
        await inngest.send({
          name: 'campaign/process-contacts',
          data: {
            campaignId: campaign.id,
            companyId: campaign.company_id,
            workflowId: campaign.workflow_id,
            contacts: contacts.map(c => ({
              memberId: c.id,
              contactListId: c.contact_list_id,
              customerId: c.customer_id,
              leadId: c.lead_id,
            })),
          },
        });

        return { success: true, contacts: contacts.length };
      });
    }

    return {
      message: 'Campaigns started',
      count: campaignsToStart.length,
      campaigns: campaignsToStart.map(c => c.name)
    };
  }
);

export const campaignProcessContactsHandler = inngest.createFunction(
  {
    id: 'campaign-process-contacts',
    name: 'Process Campaign Contacts',
    retries: 2,
  },
  { event: 'campaign/process-contacts' },
  async ({ event, step }) => {
    const { campaignId, companyId, workflowId, contacts } = event.data;
    const supabase = createAdminClient();

    // Get campaign settings
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('batch_size, batch_interval_minutes, daily_limit, contacts_sent_today, current_day_date, respect_business_hours')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    // Check if we need to reset daily counter
    const today = new Date().toISOString().split('T')[0];
    if (campaign.current_day_date !== today) {
      await supabase
        .from('campaigns')
        .update({
          contacts_sent_today: 0,
          current_day_date: today
        })
        .eq('id', campaignId);
      campaign.contacts_sent_today = 0;
    }

    // Check business hours if enabled
    if (campaign.respect_business_hours) {
      const businessHours = await fetchCompanyBusinessHours(companyId);
      const now = new Date();

      if (!isBusinessHours(now, businessHours)) {
        console.log(`Campaign ${campaignId} paused - outside business hours`);
        // Re-queue for next business hour slot
        const nextSlot = getNextBusinessHourSlot(now, businessHours);
        await inngest.send({
          name: 'campaign/process-contacts',
          data: event.data,
          timestamp: nextSlot.getTime()
        });
        return { success: true, rescheduled: true, nextProcessing: nextSlot.toISOString() };
      }
    }

    // Use configurable batch size from campaign
    const BATCH_SIZE = campaign.batch_size || 10;
    const BATCH_INTERVAL_MS = (campaign.batch_interval_minutes || 10) * 60 * 1000;

    // Filter contacts to respect daily limit
    const remainingDailyLimit = campaign.daily_limit - campaign.contacts_sent_today;
    const contactsToProcess = contacts.slice(0, remainingDailyLimit);

    if (contactsToProcess.length === 0) {
      console.log(`Campaign ${campaignId} reached daily limit (${campaign.daily_limit})`);
      // Schedule remaining contacts for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow

      if (contacts.length > 0) {
        await inngest.send({
          name: 'campaign/process-contacts',
          data: event.data,
          timestamp: tomorrow.getTime()
        });
      }

      return { success: true, dailyLimitReached: true, rescheduledCount: contacts.length };
    }

    const batches = [];
    for (let i = 0; i < contactsToProcess.length; i += BATCH_SIZE) {
      batches.push(contactsToProcess.slice(i, i + BATCH_SIZE));
    }

    let totalProcessed = 0;
    let totalSuccessful = 0;
    let totalFailed = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];

      await step.run(`process-batch-${batchIndex}`, async () => {
        const supabase = createAdminClient();

        for (const contact of batch) {
          try {
            // Update member status to processing
            await supabase
              .from('campaign_contact_list_members')
              .update({ status: 'processing' })
              .eq('id', contact.memberId);

            // Get customer/lead data
            let leadData = null;
            let customerId = contact.customerId;
            const leadId = contact.leadId;

            if (contact.customerId) {
              const { data: customer } = await supabase
                .from('customers')
                .select('*')
                .eq('id', contact.customerId)
                .single();

              if (customer) {
                leadData = {
                  customerName: `${customer.first_name} ${customer.last_name}`,
                  firstName: customer.first_name,
                  lastName: customer.last_name,
                  customerEmail: customer.email,
                  customerPhone: customer.phone,
                  address: customer.address,
                  city: customer.city,
                  state: customer.state,
                  zipCode: customer.zip_code,
                };
              }
            } else if (contact.leadId) {
              const { data: lead } = await supabase
                .from('leads')
                .select(`
                  *,
                  customer:customers(*)
                `)
                .eq('id', contact.leadId)
                .single();

              if (lead) {
                customerId = lead.customer_id;
                leadData = {
                  customerName: lead.customer ? `${lead.customer.first_name} ${lead.customer.last_name}` : '',
                  firstName: lead.customer?.first_name || '',
                  lastName: lead.customer?.last_name || '',
                  customerEmail: lead.customer?.email || '',
                  customerPhone: lead.customer?.phone || '',
                  pestType: lead.pest_type,
                  urgency: lead.urgency,
                  leadSource: lead.lead_source,
                };
              }
            }

            if (!leadData) {
              throw new Error('No customer or lead data found');
            }

            // Create automation execution
            const { data: execution, error: executionError } = await supabase
              .from('automation_executions')
              .insert({
                workflow_id: workflowId,
                company_id: companyId,
                lead_id: leadId,
                customer_id: customerId,
                execution_status: 'pending',
                execution_data: {
                  campaignId,
                  source: 'campaign',
                  leadData,
                },
              })
              .select('id')
              .single();

            if (executionError || !execution) {
              throw new Error(`Failed to create execution: ${executionError?.message}`);
            }

            // Create campaign execution link
            await supabase
              .from('campaign_executions')
              .insert({
                campaign_id: campaignId,
                automation_execution_id: execution.id,
                customer_id: customerId,
                lead_id: leadId,
                execution_status: 'pending',
              });

            // Update member with execution ID
            await supabase
              .from('campaign_contact_list_members')
              .update({
                execution_id: execution.id,
                status: 'processing'
              })
              .eq('id', contact.memberId);

            // Trigger workflow execution
            await inngest.send({
              name: 'workflow/execute',
              data: {
                executionId: execution.id,
                workflowId,
                companyId,
                leadId,
                customerId,
                leadData,
                attribution: {},
                triggerType: 'campaign',
              },
            });

            totalProcessed++;
            totalSuccessful++;

          } catch (error) {
            console.error(`Error processing contact ${contact.memberId}:`, error);

            const supabase = createAdminClient();
            await supabase
              .from('campaign_contact_list_members')
              .update({
                status: 'failed',
                error_message: error instanceof Error ? error.message : 'Unknown error',
                processed_at: new Date().toISOString()
              })
              .eq('id', contact.memberId);

            totalProcessed++;
            totalFailed++;
          }
        }

        // Update campaign counters
        await supabase
          .from('campaigns')
          .update({
            contacts_sent_today: campaign.contacts_sent_today + batch.length,
            current_batch: batchIndex + 1,
            last_batch_sent_at: new Date().toISOString()
          })
          .eq('id', campaignId);

        return { processed: batch.length };
      });

      // Add delay between batches using campaign settings
      if (batchIndex < batches.length - 1) {
        const delaySeconds = Math.floor(BATCH_INTERVAL_MS / 1000);
        await step.sleep(`batch-delay-${batchIndex}`, `${delaySeconds}s`);
      }
    }

    // If there are remaining contacts that hit daily limit, schedule them
    if (contacts.length > contactsToProcess.length) {
      const remainingContacts = contacts.slice(contactsToProcess.length);
      console.log(`Campaign ${campaignId}: ${remainingContacts.length} contacts deferred to next day due to daily limit`);

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);

      await inngest.send({
        name: 'campaign/process-contacts',
        data: {
          ...event.data,
          contacts: remainingContacts
        },
        timestamp: tomorrow.getTime()
      });
    }

    // Check if campaign is complete
    await step.run('check-campaign-completion', async () => {
      const supabase = createAdminClient();

      const { data: campaign } = await supabase
        .from('campaigns')
        .select('processed_contacts, total_contacts, end_datetime')
        .eq('id', campaignId)
        .single();

      if (campaign) {
        const allProcessed = campaign.processed_contacts >= campaign.total_contacts;
        const endDatePassed = campaign.end_datetime && new Date(campaign.end_datetime) < new Date();

        if (allProcessed || endDatePassed) {
          await supabase
            .from('campaigns')
            .update({ status: 'completed' })
            .eq('id', campaignId);
        }
      }
    });

    return {
      success: true,
      totalContacts: contacts.length,
      totalProcessed,
      totalSuccessful,
      totalFailed,
    };
  }
);

// Function to handle workflow completion and update campaign member status
export const campaignWorkflowCompletionHandler = inngest.createFunction(
  {
    id: 'campaign-workflow-completion',
    name: 'Handle Campaign Workflow Completion',
  },
  { event: 'workflow/completed' },
  async ({ event, step }) => {
    const { executionId } = event.data;

    await step.run('update-campaign-member-status', async () => {
      const supabase = createAdminClient();

      // Get execution details
      const { data: execution } = await supabase
        .from('automation_executions')
        .select('execution_status, execution_data')
        .eq('id', executionId)
        .single();

      if (!execution || !execution.execution_data?.campaignId) {
        return { success: false, reason: 'Not a campaign execution' };
      }

      // Find the member record
      const { data: member } = await supabase
        .from('campaign_contact_list_members')
        .select('id')
        .eq('execution_id', executionId)
        .single();

      if (!member) {
        return { success: false, reason: 'Member not found' };
      }

      // Update member status based on execution result
      const newStatus = execution.execution_status === 'completed' ? 'processed' : 'failed';

      await supabase
        .from('campaign_contact_list_members')
        .update({
          status: newStatus,
          processed_at: new Date().toISOString(),
        })
        .eq('id', member.id);

      // Update campaign execution status
      await supabase
        .from('campaign_executions')
        .update({
          execution_status: execution.execution_status,
          completed_at: new Date().toISOString(),
        })
        .eq('automation_execution_id', executionId);

      return { success: true, status: newStatus };
    });

    return { success: true };
  }
);
