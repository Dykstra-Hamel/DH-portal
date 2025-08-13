import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { abTestEngine } from '@/lib/ab-testing/ab-test-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    const { id, testId } = await params;
    const companyId = id;

    const supabase = createAdminClient();

    // Get specific A/B test campaign with variants and results
    const { data: campaign, error } = await supabase
      .from('ab_test_campaigns')
      .select(`
        *,
        ab_test_variants (
          *,
          email_templates (
            name,
            subject_line,
            description
          )
        ),
        ab_test_results (
          *
        )
      `)
      .eq('id', testId)
      .eq('company_id', companyId)
      .single();

    if (error) {
      console.error('Error fetching A/B test campaign:', error);
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Get recent performance analysis
    const results = await abTestEngine.analyzeTestResults(testId);

    return NextResponse.json({
      success: true,
      campaign,
      analysis: results
    });

  } catch (error) {
    console.error('Error in GET /api/companies/[id]/ab-tests/[testId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    const { id, testId } = await params;
    const companyId = id;
    const body = await request.json();

    const supabase = createAdminClient();

    // Get current campaign
    const { data: currentCampaign, error: fetchError } = await supabase
      .from('ab_test_campaigns')
      .select('*')
      .eq('id', testId)
      .eq('company_id', companyId)
      .single();

    if (fetchError || !currentCampaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Validate status changes
    if (body.status && body.status !== currentCampaign.status) {
      const validTransitions: Record<string, string[]> = {
        'draft': ['running', 'cancelled'],
        'running': ['paused', 'completed', 'cancelled'],
        'paused': ['running', 'completed', 'cancelled'],
        'completed': [], // Final state
        'cancelled': []  // Final state
      };

      const allowedStatuses = validTransitions[currentCampaign.status] || [];
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          { success: false, error: `Cannot change status from ${currentCampaign.status} to ${body.status}` },
          { status: 400 }
        );
      }

      // When starting a campaign, set actual start date
      if (body.status === 'running' && currentCampaign.status === 'draft') {
        body.actual_start_date = new Date().toISOString();
      }

      // When completing a campaign, set actual end date
      if (body.status === 'completed' || body.status === 'cancelled') {
        body.actual_end_date = new Date().toISOString();
      }
    }

    // Update campaign
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    };

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.company_id;
    delete updateData.created_at;

    const { data: updatedCampaign, error: updateError } = await supabase
      .from('ab_test_campaigns')
      .update(updateData)
      .eq('id', testId)
      .eq('company_id', companyId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating campaign:', updateError);
      return NextResponse.json(
        { success: false, error: 'Failed to update campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign updated successfully',
      campaign: updatedCampaign
    });

  } catch (error) {
    console.error('Error in PUT /api/companies/[id]/ab-tests/[testId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; testId: string }> }
) {
  try {
    const { id, testId } = await params;
    const companyId = id;

    const supabase = createAdminClient();

    // Check if campaign exists and can be deleted
    const { data: campaign, error: fetchError } = await supabase
      .from('ab_test_campaigns')
      .select('status')
      .eq('id', testId)
      .eq('company_id', companyId)
      .single();

    if (fetchError || !campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Can only delete draft or cancelled campaigns
    if (!['draft', 'cancelled'].includes(campaign.status)) {
      return NextResponse.json(
        { success: false, error: 'Can only delete draft or cancelled campaigns' },
        { status: 400 }
      );
    }

    // Delete campaign (variants and results will be cascade deleted)
    const { error: deleteError } = await supabase
      .from('ab_test_campaigns')
      .delete()
      .eq('id', testId)
      .eq('company_id', companyId);

    if (deleteError) {
      console.error('Error deleting campaign:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete campaign' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    });

  } catch (error) {
    console.error('Error in DELETE /api/companies/[id]/ab-tests/[testId]:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}