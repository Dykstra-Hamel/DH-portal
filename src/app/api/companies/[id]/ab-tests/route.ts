import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server-admin';
import { abTestEngine } from '@/lib/ab-testing/ab-test-engine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = id;

    const supabase = createAdminClient();

    // Get all A/B test campaigns for the company
    const { data: campaigns, error } = await supabase
      .from('ab_test_campaigns')
      .select(`
        *,
        ab_test_variants (
          id,
          variant_label,
          template_id,
          is_control,
          traffic_percentage,
          participants_assigned,
          emails_sent,
          emails_opened,
          emails_clicked,
          conversions,
          open_rate,
          click_rate,
          conversion_rate,
          email_templates (
            name,
            subject_line
          )
        )
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching A/B test campaigns:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch A/B test campaigns' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      campaigns: campaigns || []
    });

  } catch (error) {
    console.error('Error in GET /api/companies/[id]/ab-tests:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const companyId = id;
    const body = await request.json();

    const {
      name,
      description,
      test_type,
      traffic_split_percentage,
      start_date,
      end_date,
      confidence_level,
      minimum_sample_size,
      minimum_effect_size,
      statistical_power,
      auto_promote_winner,
      auto_complete_on_significance,
      max_duration_days,
      variants
    } = body;

    // Validation
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Campaign name is required' },
        { status: 400 }
      );
    }

    if (!variants || !Array.isArray(variants) || variants.length < 2) {
      return NextResponse.json(
        { success: false, error: 'At least 2 variants are required' },
        { status: 400 }
      );
    }

    // Validate traffic split adds up to 100
    const totalTrafficPercentage = variants.reduce((sum, v) => sum + (v.traffic_percentage || 0), 0);
    if (Math.abs(totalTrafficPercentage - 100) > 0.01) {
      return NextResponse.json(
        { success: false, error: 'Traffic percentages must add up to 100%' },
        { status: 400 }
      );
    }

    // Ensure exactly one control variant
    const controlVariants = variants.filter(v => v.is_control);
    if (controlVariants.length !== 1) {
      return NextResponse.json(
        { success: false, error: 'Exactly one control variant is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Check for unique campaign name
    const { data: existingCampaign } = await supabase
      .from('ab_test_campaigns')
      .select('id')
      .eq('company_id', companyId)
      .eq('name', name.trim())
      .single();

    if (existingCampaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign name already exists' },
        { status: 400 }
      );
    }

    // Create variant split object
    const variantSplit: Record<string, number> = {};
    variants.forEach((variant, index) => {
      const label = variant.variant_label || String.fromCharCode(65 + index); // A, B, C, etc.
      variantSplit[label] = variant.traffic_percentage;
    });

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('ab_test_campaigns')
      .insert({
        company_id: companyId,
        name: name.trim(),
        description: description || null,
        test_type: test_type || 'email_template',
        traffic_split_percentage: traffic_split_percentage || 100,
        variant_split: variantSplit,
        control_variant: controlVariants[0].variant_label,
        start_date: start_date || new Date().toISOString(),
        end_date: end_date,
        confidence_level: confidence_level || 0.95,
        minimum_sample_size: minimum_sample_size || 100,
        minimum_effect_size: minimum_effect_size || 0.05,
        statistical_power: statistical_power || 0.80,
        auto_promote_winner: auto_promote_winner !== false,
        auto_complete_on_significance: auto_complete_on_significance !== false,
        max_duration_days: max_duration_days || 30,
        status: 'draft'
      })
      .select()
      .single();

    if (campaignError) {
      console.error('Error creating campaign:', campaignError);
      return NextResponse.json(
        { success: false, error: 'Failed to create campaign' },
        { status: 500 }
      );
    }

    // Create variants
    const variantInserts = variants.map((variant, index) => ({
      campaign_id: campaign.id,
      variant_label: variant.variant_label || String.fromCharCode(65 + index),
      template_id: variant.template_id,
      is_control: variant.is_control || false,
      traffic_percentage: variant.traffic_percentage
    }));

    const { data: createdVariants, error: variantsError } = await supabase
      .from('ab_test_variants')
      .insert(variantInserts)
      .select();

    if (variantsError) {
      console.error('Error creating variants:', variantsError);
      // Rollback campaign creation
      await supabase
        .from('ab_test_campaigns')
        .delete()
        .eq('id', campaign.id);

      return NextResponse.json(
        { success: false, error: 'Failed to create variants' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'A/B test campaign created successfully',
      campaign: {
        ...campaign,
        variants: createdVariants
      }
    });

  } catch (error) {
    console.error('Error in POST /api/companies/[id]/ab-tests:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}