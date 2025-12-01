import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/api-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Use admin client for global admins to bypass RLS
    const queryClient = getSupabaseClient(isGlobalAdmin, supabase);

    // Get campaign with all details
    const { data: campaign, error } = await queryClient
      .from('campaigns')
      .select(`
        *,
        workflow:automation_workflows(
          id,
          name,
          description,
          workflow_type,
          workflow_steps
        ),
        created_by_user:created_by(
          id,
          first_name,
          last_name,
          email
        ),
        discount:company_discounts(
          id,
          discount_name,
          description,
          discount_type,
          discount_value,
          applies_to_price,
          applies_to_plans
        ),
        contact_lists:campaign_contact_lists(
          id,
          list_name,
          description,
          total_contacts,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching campaign:', error);
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check user has access to campaign's company (skip for global admins)
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

    return NextResponse.json({ success: true, campaign });

  } catch (error) {
    console.error('Error in campaign GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    const body = await request.json();
    const {
      name,
      description,
      discount_id,
      start_datetime,
      end_datetime,
      workflow_id,
      target_audience_type,
      audience_filter_criteria,
    } = body;

    // Get existing campaign
    const { data: existingCampaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('company_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingCampaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check user has permission (skip for global admins)
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', existingCampaign.company_id)
        .single();

      if (!userCompany || !['admin', 'manager', 'owner'].includes(userCompany.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Don't allow editing running campaigns
    if (existingCampaign.status === 'running') {
      return NextResponse.json(
        { error: 'Cannot edit a running campaign. Pause it first.' },
        { status: 400 }
      );
    }

    // Update campaign
    const { data: campaign, error: updateError} = await supabase
      .from('campaigns')
      .update({
        name,
        description,
        discount_id: discount_id !== undefined ? discount_id : null,
        start_datetime,
        end_datetime,
        workflow_id,
        target_audience_type,
        audience_filter_criteria,
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating campaign:', updateError);
      return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
    }

    return NextResponse.json({ success: true, campaign });

  } catch (error) {
    console.error('Error in campaign PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    const body = await request.json();

    // Get existing campaign
    const { data: existingCampaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('company_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingCampaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check user has permission (skip for global admins)
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', existingCampaign.company_id)
        .single();

      if (!userCompany || !['admin', 'manager', 'owner'].includes(userCompany.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Validate status changes
    if (body.status) {
      const validStatuses = ['draft', 'scheduled', 'running', 'paused', 'completed', 'cancelled'];
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }

      // Don't allow cancelling already completed campaigns
      if (body.status === 'cancelled' && existingCampaign.status === 'completed') {
        return NextResponse.json(
          { error: 'Cannot cancel a completed campaign' },
          { status: 400 }
        );
      }
    }

    // Update campaign with only provided fields
    const { data: campaign, error: updateError } = await supabase
      .from('campaigns')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating campaign:', updateError);
      return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
    }

    return NextResponse.json({ success: true, campaign });

  } catch (error) {
    console.error('Error in campaign PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get authenticated user
    const authResult = await getAuthenticatedUser();
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { user, isGlobalAdmin, supabase } = authResult;

    // Get existing campaign
    const { data: existingCampaign, error: fetchError } = await supabase
      .from('campaigns')
      .select('company_id, status')
      .eq('id', id)
      .single();

    if (fetchError || !existingCampaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Check user has permission (skip for global admins)
    if (!isGlobalAdmin) {
      const { data: userCompany } = await supabase
        .from('user_companies')
        .select('role')
        .eq('user_id', user.id)
        .eq('company_id', existingCampaign.company_id)
        .single();

      if (!userCompany || !['admin', 'owner'].includes(userCompany.role)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Don't allow deleting running campaigns
    if (existingCampaign.status === 'running') {
      return NextResponse.json(
        { error: 'Cannot delete a running campaign. Cancel it first.' },
        { status: 400 }
      );
    }

    // Delete campaign (cascade will handle related records)
    const { error: deleteError } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting campaign:', deleteError);
      return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Campaign deleted' });

  } catch (error) {
    console.error('Error in campaign DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
