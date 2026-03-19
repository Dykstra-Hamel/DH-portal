import { inngest } from '../client';
import { createAdminClient } from '@/lib/supabase/server-admin';

export const campaignResponseHandler = inngest.createFunction(
  {
    id: 'campaign-response-detector',
    name: 'Campaign Response Detector',
    retries: 3,
  },
  { event: 'campaign/response-detected' },
  async ({ event, step }) => {
    const {
      leadId,
      conversationId,
      campaignId,
      campaignName,
      customerId,
      companyId,
      responseType,
    } = event.data as {
      leadId?: string;
      conversationId?: string;
      campaignId: string;
      campaignName: string;
      customerId: string;
      companyId: string;
      responseType: 'call' | 'form' | 'sms';
    };

    // Step 1 — deduplication check
    const alreadyResponded = await step.run('deduplication-check', async () => {
      const supabase = createAdminClient();
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data } = await supabase
        .from('campaign_contact_list_members')
        .select('id, responded_at, campaign_contact_lists!inner(campaign_id)')
        .eq('customer_id', customerId)
        .eq('campaign_contact_lists.campaign_id', campaignId)
        .not('responded_at', 'is', null)
        .gte('responded_at', twentyFourHoursAgo)
        .limit(1);

      return !!(data && data.length > 0);
    });

    if (alreadyResponded) {
      return { skipped: true, reason: 'Duplicate response within 24 hours' };
    }

    // Step 2 — mark-responded
    await step.run('mark-responded', async () => {
      const supabase = createAdminClient();

      // Find the most recent member record for this customer+campaign
      const { data: members } = await supabase
        .from('campaign_contact_list_members')
        .select('id, campaign_contact_lists!inner(campaign_id)')
        .eq('customer_id', customerId)
        .eq('campaign_contact_lists.campaign_id', campaignId)
        .order('added_at', { ascending: false })
        .limit(1);

      const memberId = members?.[0]?.id;
      if (memberId) {
        await supabase
          .from('campaign_contact_list_members')
          .update({ responded_at: new Date().toISOString() })
          .eq('id', memberId);
      }
    });

    // Step 3 — resolve-assignee
    const resolvedAssignee = await step.run('resolve-assignee', async () => {
      if (!leadId) return null;

      const supabase = createAdminClient();
      const { data: lead } = await supabase
        .from('leads')
        .select('assigned_to')
        .eq('campaign_id', campaignId)
        .eq('customer_id', customerId)
        .not('assigned_to', 'is', null)
        .limit(1)
        .single();

      return lead?.assigned_to ?? null;
    });

    // Step 4 — resolve customer name
    const customerName = await step.run('resolve-customer-name', async () => {
      const supabase = createAdminClient();
      const { data: customer } = await supabase
        .from('customers')
        .select('first_name, last_name')
        .eq('id', customerId)
        .single();

      if (!customer) return 'A customer';
      return `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'A customer';
    });

    // Step 5 — create-task
    await step.run('create-task', async () => {
      const supabase = createAdminClient();

      await supabase.from('tasks').insert({
        company_id: companyId,
        title: `Follow up: ${customerName} responded to "${campaignName}"`,
        description: `${customerName} made an inbound ${responseType} attributed to your "${campaignName}" campaign (activity within the last 30 days). Review the ${leadId ? 'lead' : 'conversation'} and close the loop.`,
        priority: 'high',
        status: 'new',
        related_entity_type: leadId ? 'leads' : 'customers',
        related_entity_id: leadId ?? customerId,
        assigned_to: resolvedAssignee ?? null,
      });
    });

    // Step 6 — create-notification
    await step.run('create-notification', async () => {
      const supabase = createAdminClient();

      // Find all managers/admins/owners for this company
      const { data: companyUsers } = await supabase
        .from('user_companies')
        .select('user_id')
        .eq('company_id', companyId)
        .in('role', ['owner', 'admin', 'manager']);

      if (!companyUsers || companyUsers.length === 0) return;

      const notifications = companyUsers.map((uc: { user_id: string }) => ({
        user_id: uc.user_id,
        company_id: companyId,
        type: 'campaign_response',
        title: `Campaign Response: "${campaignName}"`,
        message: `${customerName} responded to your "${campaignName}" campaign via ${responseType}.`,
        reference_id: leadId ?? customerId,
        reference_type: leadId ? 'lead' : 'customer',
        read: false,
      }));

      const { error } = await supabase.from('notifications').insert(notifications);
      if (error) {
        console.error('[Campaign Response] Failed to create notifications:', error);
      }
    });

    return {
      success: true,
      campaignId,
      customerId,
      responseType,
      leadId: leadId ?? null,
      conversationId: conversationId ?? null,
    };
  }
);
