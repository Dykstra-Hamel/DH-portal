import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;

    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Use admin client for global admins to bypass RLS
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // Get campaign
    const { data: campaign } = await queryClient
      .from('campaigns')
      .select('company_id, total_contacts, processed_contacts, successful_contacts, failed_contacts')
      .eq('id', campaignId)
      .single();

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check user has access (skip for global admins)
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .eq('company_id', campaign.company_id)
        .single();

      if (!userCompany) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Get campaign executions with automation data
    const { data: executions } = await queryClient
      .from('campaign_executions')
      .select(`
        id,
        execution_status,
        started_at,
        completed_at,
        automation_execution:automation_executions(
          id,
          execution_status,
          execution_data,
          started_at,
          completed_at
        )
      `)
      .eq('campaign_id', campaignId);

    // Get email metrics from email_logs table (consolidated email tracking)
    // Query directly by campaign_id for cleaner, more efficient lookup
    const { data: emailLogs } = await queryClient
      .from('email_logs')
      .select('delivery_status, bounce_type, opened_at, clicked_at, bounced_at, complained_at')
      .eq('campaign_id', campaignId);

    // Calculate email metrics with comprehensive SES tracking
    let emailMetrics = {
      sent: emailLogs?.length || 0,
      delivered: emailLogs?.filter((e: any) =>
        ['delivered', 'opened', 'clicked'].includes(e.delivery_status)
      ).length || 0,
      opened: emailLogs?.filter((e: any) => e.opened_at !== null).length || 0,
      clicked: emailLogs?.filter((e: any) => e.clicked_at !== null).length || 0,
      bounced: emailLogs?.filter((e: any) => e.delivery_status === 'bounced').length || 0,
      hard_bounces: emailLogs?.filter((e: any) =>
        e.delivery_status === 'bounced' && e.bounce_type === 'Permanent'
      ).length || 0,
      soft_bounces: emailLogs?.filter((e: any) =>
        e.delivery_status === 'bounced' && e.bounce_type === 'Transient'
      ).length || 0,
      complained: emailLogs?.filter((e: any) => e.delivery_status === 'complained').length || 0,
      failed: emailLogs?.filter((e: any) => e.delivery_status === 'failed').length || 0,
      bounce_rate: 0,
      open_rate: 0,
      click_rate: 0,
      click_through_rate: 0,
      complaint_rate: 0,
    };

    // Get aggregated metrics with calculated rates from view
    const { data: aggregatedMetrics } = await queryClient
      .from('campaign_email_metrics')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();

    // Add calculated rates if available
    if (aggregatedMetrics) {
      emailMetrics = {
        ...emailMetrics,
        bounce_rate: aggregatedMetrics.bounce_rate,
        open_rate: aggregatedMetrics.open_rate,
        click_rate: aggregatedMetrics.click_rate,
        click_through_rate: aggregatedMetrics.click_through_rate,
        complaint_rate: aggregatedMetrics.complaint_rate,
      };
    }

    // Calculate workflow completion metrics
    const workflowMetrics = {
      pending: executions?.filter((e: any) => e.automation_execution?.execution_status === 'pending').length || 0,
      running: executions?.filter((e: any) => e.automation_execution?.execution_status === 'running').length || 0,
      completed: executions?.filter((e: any) => e.automation_execution?.execution_status === 'completed').length || 0,
      failed: executions?.filter((e: any) => e.automation_execution?.execution_status === 'failed').length || 0,
      cancelled: executions?.filter((e: any) => e.automation_execution?.execution_status === 'cancelled').length || 0,
    };

    // Get contact list breakdown from new reusable lists system
    const { data: assignments } = await queryClient
      .from('campaign_contact_list_assignments')
      .select(`
        contact_list_id,
        contact_lists (
          id,
          name,
          total_contacts
        )
      `)
      .eq('campaign_id', campaignId);

    // Transform assignments to contact list format for backward compatibility
    const contactLists = assignments?.map((a: any) => ({
      id: a.contact_lists?.id,
      list_name: a.contact_lists?.name,
      total_contacts: a.contact_lists?.total_contacts,
    })).filter((l: any) => l.id) || [];

    // Get member status breakdown - filter by campaign_id for reusable lists
    let memberStatusCounts = {
      pending: 0,
      processing: 0,
      processed: 0,
      failed: 0,
      bounced: 0,
      unsubscribed: 0,
      excluded: 0,
    };

    const { data: members } = await queryClient
      .from('campaign_contact_list_members')
      .select('status, redeemed_at, first_viewed_at, last_viewed_at, view_count')
      .eq('campaign_id', campaignId);

    if (members) {
      memberStatusCounts = {
        pending: members.filter((m: any) => m.status === 'pending').length,
        processing: members.filter((m: any) => m.status === 'processing').length,
        processed: members.filter((m: any) => m.status === 'processed').length,
        failed: members.filter((m: any) => m.status === 'failed').length,
        bounced: members.filter((m: any) => m.status === 'bounced').length,
        unsubscribed: members.filter((m: any) => m.status === 'unsubscribed').length,
        excluded: members.filter((m: any) => m.status === 'excluded').length,
      };
    }

    // Calculate view tracking metrics
    const viewMetrics = {
      total_views: members?.reduce((sum: number, m: any) => sum + (m.view_count || 0), 0) || 0,
      unique_viewers: members?.filter((m: any) => m.view_count > 0).length || 0,
      total_redeemed: members?.filter((m: any) => m.redeemed_at !== null).length || 0,
      viewed_not_redeemed: members?.filter((m: any) =>
        m.view_count > 0 && m.redeemed_at === null
      ).length || 0,
      view_to_redemption_rate: 0,
    };

    // Calculate conversion rate (views -> redemptions)
    if (viewMetrics.unique_viewers > 0) {
      viewMetrics.view_to_redemption_rate =
        Math.round((viewMetrics.total_redeemed / viewMetrics.unique_viewers) * 100);
    }

    // Get time-series view data (last 30 days)
    const { data: viewHistory } = await queryClient
      .from('campaign_landing_page_views')
      .select('viewed_at')
      .eq('campaign_id', campaignId)
      .gte('viewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('viewed_at', { ascending: true });

    // Group views by date for charting
    const viewsByDate: Record<string, number> = {};
    viewHistory?.forEach((view: any) => {
      const date = new Date(view.viewed_at).toISOString().split('T')[0];
      viewsByDate[date] = (viewsByDate[date] || 0) + 1;
    });

    // Calculate progress percentage
    const progressPercentage = campaign.total_contacts > 0
      ? Math.round((campaign.processed_contacts / campaign.total_contacts) * 100)
      : 0;

    // Calculate success rate
    const successRate = campaign.processed_contacts > 0
      ? Math.round((campaign.successful_contacts / campaign.processed_contacts) * 100)
      : 0;

    const metrics = {
      campaign: {
        total_contacts: campaign.total_contacts,
        processed_contacts: campaign.processed_contacts,
        successful_contacts: campaign.successful_contacts,
        failed_contacts: campaign.failed_contacts,
        progress_percentage: progressPercentage,
        success_rate: successRate,
      },
      email: emailMetrics,
      workflow: workflowMetrics,
      views: viewMetrics,
      viewsByDate,
      memberStatus: memberStatusCounts,
      contactLists: contactLists || [],
      totalExecutions: executions?.length || 0,
    };

    return NextResponse.json({ success: true, metrics });

  } catch (error) {
    console.error('Error in campaign metrics GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
