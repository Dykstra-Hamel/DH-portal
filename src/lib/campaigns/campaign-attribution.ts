import { createAdminClient } from '@/lib/supabase/server-admin';

export async function detectCampaignAttribution(
  supabase: any,
  customerId: string,
  companyId: string
): Promise<{ campaignId: string; campaignName: string } | null> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('campaign_executions')
    .select('campaign_id, campaigns!inner(id, name, company_id)')
    .eq('customer_id', customerId)
    .eq('campaigns.company_id', companyId)
    .gte('started_at', thirtyDaysAgo)
    .order('started_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  const campaign = Array.isArray(data.campaigns) ? data.campaigns[0] : data.campaigns;
  const campaignId = data.campaign_id;
  const campaignName = campaign?.name;

  if (!campaignId || !campaignName) {
    return null;
  }

  // Exclude if this customer already has a won lead for this campaign
  const { data: wonLead } = await supabase
    .from('leads')
    .select('id')
    .eq('campaign_id', campaignId)
    .eq('customer_id', customerId)
    .eq('lead_status', 'won')
    .limit(1)
    .single();

  if (wonLead) {
    return null;
  }

  return { campaignId, campaignName };
}

export async function hasRecentResponse(
  supabase: any,
  customerId: string,
  campaignId: string
): Promise<boolean> {
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('campaign_contact_list_members')
    .select('id, responded_at, campaign_contact_lists!inner(campaign_id)')
    .eq('customer_id', customerId)
    .eq('campaign_contact_lists.campaign_id', campaignId)
    .not('responded_at', 'is', null)
    .gte('responded_at', twentyFourHoursAgo)
    .limit(1);

  if (error || !data || data.length === 0) {
    return false;
  }

  return true;
}
