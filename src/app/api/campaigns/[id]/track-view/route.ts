/**
 * Campaign Landing Page View Tracking API
 *
 * POST: Public endpoint to track landing page views for analytics and workflow triggering.
 * Records individual views and updates summary metrics on member records.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { captureDeviceData } from '@/lib/device-utils';

interface TrackViewRequest {
  customerId: string;
  sessionId?: string;
  client_device_data?: {
    timezone?: string;
    screen_resolution?: string;
    language?: string;
  };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const body: TrackViewRequest = await request.json();

    // Validate required fields
    if (!body.customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Fetch campaign (support both database UUID and campaign_id)
    let campaign = null;

    // Try database id first
    const { data: campaignById } = await supabase
      .from('campaigns')
      .select('id, campaign_id, company_id')
      .eq('id', campaignId)
      .maybeSingle();

    if (campaignById) {
      campaign = campaignById;
    } else {
      // Try campaign_id
      const { data: campaignByExternalId, error: campaignError } = await supabase
        .from('campaigns')
        .select('id, campaign_id, company_id')
        .eq('campaign_id', campaignId)
        .single();

      if (campaignError || !campaignByExternalId) {
        return NextResponse.json(
          { success: false, error: 'Campaign not found' },
          { status: 404 }
        );
      }
      campaign = campaignByExternalId;
    }

    // Verify customer belongs to this company
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('id', body.customerId)
      .eq('company_id', campaign.company_id)
      .single();

    if (customerError || !customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found or does not belong to this campaign' },
        { status: 404 }
      );
    }

    // Verify customer is in campaign contact list
    const { data: contactListAssignments } = await supabase
      .from('campaign_contact_list_assignments')
      .select('contact_list_id')
      .eq('campaign_id', campaign.id);

    if (!contactListAssignments || contactListAssignments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No contact lists found for this campaign' },
        { status: 404 }
      );
    }

    const listIds = contactListAssignments.map(a => a.contact_list_id);

    const { data: membership } = await supabase
      .from('contact_list_members')
      .select('id, contact_list_id')
      .eq('customer_id', body.customerId)
      .in('contact_list_id', listIds)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json(
        {
          success: false,
          error: 'You are not authorized to access this campaign'
        },
        { status: 403 }
      );
    }

    // Capture device data
    const serverDeviceData = captureDeviceData(request);
    const completeDeviceData = {
      ...serverDeviceData,
      timezone: body.client_device_data?.timezone || serverDeviceData.timezone,
      session: {
        ...serverDeviceData.session,
        screen_resolution: body.client_device_data?.screen_resolution,
        language: body.client_device_data?.language || serverDeviceData.session.language,
      },
    };

    // Check for existing view in this session (avoid duplicate tracking on page refreshes)
    if (body.sessionId) {
      const { data: existingView } = await supabase
        .from('campaign_landing_page_views')
        .select('id')
        .eq('campaign_id', campaign.id)
        .eq('customer_id', body.customerId)
        .eq('session_id', body.sessionId)
        .gte('viewed_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Within last 5 minutes
        .maybeSingle();

      if (existingView) {
        // Already tracked this session recently, return success without duplicating
        return NextResponse.json({
          success: true,
          message: 'View already tracked for this session',
          duplicate: true,
        });
      }
    }

    // Record individual view
    const { error: viewError } = await supabase
      .from('campaign_landing_page_views')
      .insert({
        campaign_id: campaign.id,
        customer_id: body.customerId,
        device_data: completeDeviceData,
        session_id: body.sessionId || null,
      });

    if (viewError) {
      console.error('Error recording page view:', viewError);
      return NextResponse.json(
        { success: false, error: 'Failed to record view' },
        { status: 500 }
      );
    }

    // Get or create campaign member record for this customer
    const { data: memberRecord } = await supabase
      .from('campaign_contact_list_members')
      .select('id, first_viewed_at, view_count')
      .eq('customer_id', body.customerId)
      .eq('contact_list_id', membership.contact_list_id)
      .eq('campaign_id', campaign.id)
      .maybeSingle();

    const now = new Date().toISOString();

    if (memberRecord) {
      // Update existing member record
      const { error: updateError } = await supabase
        .from('campaign_contact_list_members')
        .update({
          first_viewed_at: memberRecord.first_viewed_at || now,
          last_viewed_at: now,
          view_count: (memberRecord.view_count || 0) + 1,
        })
        .eq('id', memberRecord.id);

      if (updateError) {
        console.error('Error updating member view tracking:', updateError);
        // Don't fail request if update fails
      }
    } else {
      // Create new member record for tracking
      const { error: insertError } = await supabase
        .from('campaign_contact_list_members')
        .insert({
          contact_list_id: membership.contact_list_id,
          customer_id: body.customerId,
          campaign_id: campaign.id,
          status: 'pending',
          first_viewed_at: now,
          last_viewed_at: now,
          view_count: 1,
        });

      if (insertError) {
        console.error('Error creating member record:', insertError);
        // Don't fail request if insert fails
      }
    }

    // Log activity
    await supabase
      .from('activities')
      .insert({
        activity_type: 'campaign_page_viewed',
        customer_id: body.customerId,
        company_id: campaign.company_id,
        metadata: {
          campaign_id: campaign.id,
          campaign_identifier: campaign.campaign_id,
          device_data: completeDeviceData,
          session_id: body.sessionId,
        },
      });

    return NextResponse.json({
      success: true,
      message: 'View tracked successfully',
    });
  } catch (error) {
    console.error('Error tracking campaign view:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
